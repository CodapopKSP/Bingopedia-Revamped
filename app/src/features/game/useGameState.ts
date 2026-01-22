import { useCallback, useMemo, useRef, useState } from 'react'
import { loadCuratedArticles } from '../../shared/data/curatedArticles'
import type { CuratedArticle, CuratedCategory } from '../../shared/data/types'
import { getCuratedArticleTitle } from '../../shared/data/types'
import { normalizeTitle } from '../../shared/wiki/normalizeTitle'
import { resolveRedirect } from '../../shared/wiki/resolveRedirect'
import { detectWinningCells } from './winDetection'
import type { GameGridCell, GameState, GridIndex } from './types'
import { GRID_CELL_COUNT, STARTING_POOL_SIZE } from '../../shared/constants'
import { useGameTimer } from './useGameTimer'

/**
 * Creates the initial game state with all values reset to defaults.
 * @returns A fresh GameState object ready for a new game.
 */
function createInitialState(): GameState {
  return {
    gameStarted: false,
    gameWon: false,
    gridCells: [],
    startingArticle: null,
    matchedArticles: new Set<string>(),
    winningCells: [],
    clickCount: 0,
    elapsedSeconds: 0,
    timerRunning: false,
    articleLoading: false,
    articleHistory: [],
    currentArticleTitle: null,
  }
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generates a bingo set by selecting 26 distinct categories and one article per category.
 * The first 25 articles form the grid, and the 26th becomes the starting article.
 * 
 * This function ensures:
 * - All selected articles have unique titles (normalized for comparison)
 * - Group constraints are respected (e.g., max 1 occupation category per game)
 * - Exactly 26 articles are selected for a complete game
 * 
 * @param categories - Array of curated categories to select from
 * @param groups - Array of group definitions with maxPerGame constraints
 * @returns An object containing the grid cells and starting article
 * @throws Error if unable to generate enough unique articles
 */
function generateBingoSet(
  categories: CuratedCategory[],
  groups: { [groupName: string]: { maxPerGame: number; categories: string[] } } = {},
): {
  gridCells: GameGridCell[]
  startingArticle: CuratedArticle
} {
  // Build a map of group name -> maxPerGame for quick lookup
  // Groups is an object with group names as keys
  const groupMaxMap = new Map<string, number>()
  for (const [groupName, groupInfo] of Object.entries(groups)) {
    groupMaxMap.set(groupName, groupInfo.maxPerGame)
  }

  // Shuffle all categories
  const shuffledCategories = shuffle(categories)

  // Select categories respecting group constraints
  const selectedCategories: CuratedCategory[] = []
  const groupUsageCount = new Map<string, number>() // Track how many times each group has been used

  for (const category of shuffledCategories) {
    if (selectedCategories.length >= STARTING_POOL_SIZE) {
      break
    }

    // Check if this category belongs to a group
    if (category.group) {
      const currentCount = groupUsageCount.get(category.group) || 0
      const maxAllowed = groupMaxMap.get(category.group) ?? Infinity

      // Skip if we've already used the max allowed from this group
      if (currentCount >= maxAllowed) {
        continue
      }

      // Increment group usage
      groupUsageCount.set(category.group, currentCount + 1)
    }

    // Add this category
    selectedCategories.push(category)
  }

  // Check if we got enough categories
  if (selectedCategories.length < STARTING_POOL_SIZE) {
    throw new Error(
      `Failed to generate enough categories for bingo set. Need ${STARTING_POOL_SIZE}, got ${selectedCategories.length}. This may be due to group constraints.`,
    )
  }

  const usedTitles = new Set<string>()
  const articles: CuratedArticle[] = []

  for (const category of selectedCategories) {
    const shuffledArticles = shuffle(category.articles)
    const chosen = shuffledArticles.find((article) => {
      const title = getCuratedArticleTitle(article)
      const norm = normalizeTitle(title)
      if (usedTitles.has(norm)) return false
      usedTitles.add(norm)
      return true
    })
    if (chosen) {
      articles.push(chosen)
    }
  }

  if (articles.length < STARTING_POOL_SIZE) {
    throw new Error('Failed to generate enough unique articles for bingo set')
  }

  const [starting, ...gridPool] = shuffle(articles)

  const gridCells: GameGridCell[] = gridPool.slice(0, GRID_CELL_COUNT).map((article, index) => ({
    id: `cell-${index}`,
    article,
  }))

  return {
    gridCells,
    startingArticle: starting,
  }
}

/**
 * Main game state hook that manages the entire game lifecycle.
 * 
 * Responsibilities:
 * - Game initialization: loads curated articles and generates bingo set
 * - Timer management: tracks elapsed time, pauses during article loading
 * - Click tracking: increments on every navigation (including history clicks)
 * - Match detection: resolves redirects and checks for matches bidirectionally
 * - Win detection: triggers when any of the 12 winning lines are completed
 * - History management: maintains article visit order and allows navigation
 * 
 * @returns A tuple containing:
 *   - [0] Current game state
 *   - [1] Control functions: startNewGame, registerNavigation, setArticleLoading, replaceFailedArticle
 */
export function useGameState(): [
  GameState,
  {
    startNewGame: () => void
    registerNavigation: (title: string) => Promise<void>
    setArticleLoading: (loading: boolean) => void
    replaceFailedArticle: (title: string) => Promise<void>
  },
] {
  const [state, setState] = useState<GameState>(() => createInitialState())

  // Use the dedicated timer hook for cleaner separation of concerns
  useGameTimer({
    timerRunning: state.timerRunning,
    articleLoading: state.articleLoading,
    gameWon: state.gameWon,
    onTick: useCallback(() => {
      setState((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }))
    }, []),
  })

  const startNewGame = useMemo(
    () => async () => {
      const payload = await loadCuratedArticles()
      const { categories, groups } = payload
      const { gridCells, startingArticle } = generateBingoSet(categories, groups)

      const startingTitle = getCuratedArticleTitle(startingArticle)
      setState({
        ...createInitialState(),
        gameStarted: true,
        gridCells,
        startingArticle,
        currentArticleTitle: startingTitle,
        articleHistory: [startingTitle],
        timerRunning: false,
      })
    },
    [],
  )

  /**
   * Registers a navigation to a new article and checks for matches.
   * 
   * This function:
   * 1. Adds the article to history and increments click count
   * 2. Resolves redirects for both clicked and grid articles
   * 3. Performs bidirectional matching (clicked→grid and grid→clicked)
   * 4. Updates matched articles and checks for winning conditions
   * 5. Starts/pauses timer appropriately
   * 
   * History clicks always count as clicks and can trigger matches/wins.
   * 
   * @param title - The article title to navigate to
   */
  const registerNavigation = async (title: string) => {
    const normalizedOriginal = normalizeTitle(title)
    const canonicalClicked = await resolveRedirect(title)
    const normalizedClicked = normalizeTitle(canonicalClicked)

    // First update: add to history, increment clicks, check direct matches
    let currentGridCells: GameGridCell[] = []
    setState((prev) => {
      currentGridCells = prev.gridCells
      const nextClickCount = prev.clickCount + 1
      const nextHistory = [...prev.articleHistory, title]

      const nextMatched = new Set(prev.matchedArticles)

      // Check direct matches first
      for (const cell of prev.gridCells) {
        const gridTitle = getCuratedArticleTitle(cell.article)
        const normalizedGrid = normalizeTitle(gridTitle)
        if (
          (normalizedGrid === normalizedOriginal || normalizedGrid === normalizedClicked) &&
          !nextMatched.has(gridTitle)
        ) {
          nextMatched.add(gridTitle)
        }
      }

      const winningCells = detectWinningCells(prev.gridCells, nextMatched)

      return {
        ...prev,
        gameStarted: true,
        clickCount: nextClickCount,
        matchedArticles: nextMatched,
        winningCells,
        gameWon: winningCells.length > 0,
        articleHistory: nextHistory,
        currentArticleTitle: title,
        timerRunning: false, // Timer will start when article finishes loading
        articleLoading: true,
      }
    })

    // Second update: resolve redirects for all grid cells and check redirect-based matches
    const gridRedirects = await Promise.all(
      currentGridCells.map((cell) =>
        resolveRedirect(getCuratedArticleTitle(cell.article)).then((resolved) => normalizeTitle(resolved)),
      ),
    )

    setState((prev) => {
      const nextMatched = new Set(prev.matchedArticles)
      let updated = false

      prev.gridCells.forEach((cell, index) => {
        const gridTitle = getCuratedArticleTitle(cell.article)
        const normalizedGrid = normalizeTitle(gridTitle)
        const canonicalGrid = gridRedirects[index]

        // Check if this grid cell matches via redirect
        if (
          (canonicalGrid === normalizedOriginal ||
            canonicalGrid === normalizedClicked ||
            normalizedGrid === normalizedOriginal ||
            normalizedGrid === normalizedClicked) &&
          !nextMatched.has(gridTitle)
        ) {
          nextMatched.add(gridTitle)
          updated = true
        }
      })

      if (updated) {
        const winningCells = detectWinningCells(prev.gridCells, nextMatched)
        const gameWon = winningCells.length > 0
        return {
          ...prev,
          matchedArticles: nextMatched,
          winningCells,
          gameWon,
          timerRunning: gameWon ? false : prev.timerRunning, // Stop timer if game is won
        }
      }

      return prev
    })
  }

  const setArticleLoading = useCallback((loading: boolean) => {
    setState((prev) => {
      // Timer should start after first article finishes loading (not on game start)
      // If loading is false and game has started but timer hasn't started yet, start it
      const shouldStartTimer = !loading && prev.gameStarted && !prev.timerRunning && prev.currentArticleTitle != null
      
      return {
        ...prev,
        articleLoading: loading,
        timerRunning: loading ? false : (shouldStartTimer ? true : prev.timerRunning),
      }
    })
  }, [])

  /**
   * Gets a random article from curated articles, excluding articles already in use.
   * Used for replacing failed articles.
   * 
   * @param excludeTitles - Array of article titles to exclude (normalized for comparison)
   * @returns Promise resolving to a random CuratedArticle
   */
  const getRandomArticle = useCallback(async (excludeTitles: string[] = []): Promise<CuratedArticle> => {
    const payload = await loadCuratedArticles()
    const validCategories = payload.categories.filter((cat) => cat.articles && cat.articles.length > 0)

    if (validCategories.length === 0) {
      throw new Error('No categories with articles available')
    }

    // Normalize exclude titles for comparison
    const normalizedExclude = new Set(excludeTitles.map((title) => normalizeTitle(title)))

    // Try to find an article not in the exclude list
    const maxAttempts = 50
    for (let i = 0; i < maxAttempts; i++) {
      const randomCategory = pickRandom(validCategories)
      const randomArticle = pickRandom(randomCategory.articles)
      const articleTitle = getCuratedArticleTitle(randomArticle)
      const normalizedTitle = normalizeTitle(articleTitle)

      if (!normalizedExclude.has(normalizedTitle)) {
        return randomArticle
      }
    }

    // If we couldn't find a unique one after max attempts, just return any article
    const randomCategory = pickRandom(validCategories)
    const randomArticle = pickRandom(randomCategory.articles)
    return randomArticle
  }, [])

  /**
   * Replaces a failed article (either in the grid or the current article).
   * 
   * @param failedTitle - The title of the article that failed to load
   */
  const replaceFailedArticle = useCallback(
    async (failedTitle: string) => {
      console.warn(`Article failed to load: ${failedTitle}`)

      setState((prev) => {
        // Collect all currently used article titles (normalized)
        const usedTitles = new Set<string>()
        prev.gridCells.forEach((cell) => {
          const title = getCuratedArticleTitle(cell.article)
          usedTitles.add(normalizeTitle(title))
        })
        if (prev.startingArticle) {
          const title = getCuratedArticleTitle(prev.startingArticle)
          usedTitles.add(normalizeTitle(title))
        }

        // Check if this article is in the grid
        const gridIndex = prev.gridCells.findIndex((cell) => {
          const title = getCuratedArticleTitle(cell.article)
          return normalizeTitle(title) === normalizeTitle(failedTitle)
        })

        if (gridIndex !== -1) {
          // It's in the grid - replace it with a new random article
          console.log(`Replacing grid article at index ${gridIndex}`)

          // Get replacement asynchronously
          getRandomArticle(Array.from(usedTitles))
            .then((replacement) => {
              setState((current) => {
                const newGridCells = [...current.gridCells]
                newGridCells[gridIndex] = {
                  ...newGridCells[gridIndex],
                  article: replacement,
                }
                console.log(`Replaced ${failedTitle} with ${getCuratedArticleTitle(replacement)}`)
                return {
                  ...current,
                  gridCells: newGridCells,
                }
              })
            })
            .catch((error) => {
              console.error('Failed to get replacement article:', error)
            })

          return prev // Return unchanged state, replacement will update it
        } else {
          // It's the currently viewed article - replace with a new random one
          console.log('Replacing currently viewed article')

          getRandomArticle(Array.from(usedTitles))
            .then((replacement) => {
              const replacementTitle = getCuratedArticleTitle(replacement)
              setState((current) => {
                console.log(`Replaced viewed article with ${replacementTitle}`)
                return {
                  ...current,
                  currentArticleTitle: replacementTitle,
                  articleHistory: [...current.articleHistory, replacementTitle],
                }
              })
            })
            .catch((error) => {
              console.error('Failed to get replacement article:', error)
            })

          return prev // Return unchanged state, replacement will update it
        }
      })
    },
    [getRandomArticle],
  )

  return [state, { startNewGame, registerNavigation, setArticleLoading, replaceFailedArticle }]
}


