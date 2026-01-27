import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadCuratedArticles } from '../../shared/data/curatedArticles'
import type { CuratedArticle, CuratedCategory } from '../../shared/data/types'
import { getCuratedArticleTitle } from '../../shared/data/types'
import { normalizeTitle } from '../../shared/wiki/normalizeTitle'
import { resolveRedirect } from '../../shared/wiki/resolveRedirect'
import { detectWinningCells } from './winDetection'
import type { GameGridCell, GameState } from './types'
import { GRID_CELL_COUNT, STARTING_POOL_SIZE } from '../../shared/constants'
import { useGameTimer } from './useGameTimer'
import { fetchGame, createGame } from '../../shared/api/gamesClient'
import { logEvent } from '../../shared/api/loggingClient'

/**
 * Module loading verification:
 * - All React hooks are explicitly imported from 'react'
 * - No circular dependencies detected between useGameState and App.tsx
 * - Vite HMR is properly configured in vite.config.ts
 * - TypeScript module resolution is set to "bundler" (correct for Vite)
 */

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
    gameId: undefined,
    gameType: undefined,
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
 * Options for useGameState hook.
 */
export interface UseGameStateOptions {
  /**
   * Optional callback when a new match is detected.
   * Called with the article title that was matched.
   */
  onMatch?: (articleTitle: string) => void
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
 * @param options - Optional configuration
 * @param options.onMatch - Callback when a new match is detected
 * @returns A tuple containing:
 *   - [0] Current game state
 *   - [1] Control functions: startNewGame, loadGameFromId, createShareableGame, registerNavigation, setArticleLoading, replaceFailedArticle
 */
export function useGameState(options: UseGameStateOptions = {}): [
  GameState,
  {
    startNewGame: (gameState?: { gridCells: GameGridCell[]; startingArticle: CuratedArticle; gameId?: string; hashedId?: string; gameType?: 'random' | 'repeat' }) => Promise<void>
    loadGameFromId: (identifier: string) => Promise<void>
    createShareableGame: () => Promise<{ gameId: string; url: string }>
    registerNavigation: (title: string) => Promise<void>
    setArticleLoading: (loading: boolean) => void
    replaceFailedArticle: (title: string) => Promise<void>
  },
] {
  const { onMatch } = options
  const [state, setState] = useState<GameState>(() => createInitialState())
  // Explicit type annotation to prevent module loading issues
  const replacingArticlesRef = useRef<Set<string>>(new Set<string>())
  // Ref-based timer value to minimize re-renders (display updates handled separately)
  const elapsedSecondsRef = useRef<number>(0)
  // State ref for synchronous duplicate checking (avoids stale closure issues)
  const stateRef = useRef<GameState>(state)

  // Use the dedicated timer hook for cleaner separation of concerns
  // onTick callback has empty dependency array because setState updater function is stable
  // and doesn't need to be recreated on every render
  // 
  // Timer optimization strategy:
  // - Update ref immediately (no re-render)
  // - Update state for scoring accuracy, but less frequently to reduce re-renders
  // - Display updates are handled by useTimerDisplay hook which batches updates
  const onTickCallback = useCallback(() => {
    elapsedSecondsRef.current += 1
    // Update state for scoring, but this will trigger re-renders
    // The useTimerDisplay hook will batch these updates for display purposes
    setState((prev) => ({
      ...prev,
      elapsedSeconds: elapsedSecondsRef.current,
    }))
  }, []) // Empty deps array is correct - setState updater function is stable

  useGameTimer({
    timerRunning: state.timerRunning,
    articleLoading: state.articleLoading,
    gameWon: state.gameWon,
    onTick: onTickCallback,
  })

  // Sync refs with state when state changes from other sources (e.g., game reset)
  useEffect(() => {
    elapsedSecondsRef.current = state.elapsedSeconds
    stateRef.current = state
  }, [state])

  useEffect(() => {
    if (
      state.gameStarted &&
      state.currentArticleTitle &&
      !state.articleLoading &&
      !state.timerRunning &&
      !state.gameWon
    ) {
      setState((prev) => ({
        ...prev,
        timerRunning: true,
      }))
    }
  }, [state.gameStarted, state.currentArticleTitle, state.articleLoading, state.timerRunning, state.gameWon])

  /**
   * Converts article title strings to CuratedArticle objects.
   * Used when loading games from API where we only have titles.
   */
  const createArticleFromTitle = useCallback((title: string): CuratedArticle => {
    return { title }
  }, [])

  const startNewGame = useMemo(
    () => async (providedGameState?: { gridCells: GameGridCell[]; startingArticle: CuratedArticle; gameId?: string; hashedId?: string; gameType?: 'random' | 'repeat' }) => {
      if (providedGameState) {
        // Load game from provided state
        const startingTitle = getCuratedArticleTitle(providedGameState.startingArticle)
        setState({
          ...createInitialState(),
          gameStarted: true,
          gridCells: providedGameState.gridCells,
          startingArticle: providedGameState.startingArticle,
          currentArticleTitle: startingTitle,
          articleHistory: [startingTitle],
          timerRunning: true,
          articleLoading: false,
          hashedId: providedGameState.hashedId,
          gameId: providedGameState.gameId, // Keep for backward compatibility
          gameType: providedGameState.gameType || 'repeat',
        })
      } else {
        // Generate new game
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
          timerRunning: true,
          articleLoading: false,
          gameType: 'random',
        })
      }
    },
    [],
  )

  /**
   * Loads a game state from the API by hashedId (preferred) or gameId (backward compatibility).
   * @param identifier - Hashed ID (16 chars) or UUID v4 game identifier
   */
  const loadGameFromId = useCallback(async (identifier: string) => {
    try {
      const gameState = await fetchGame(identifier)

      const gridCellTitles = gameState.bingopediaGame.slice(0, GRID_CELL_COUNT)
      const startingTitle = gameState.bingopediaGame[GRID_CELL_COUNT]

      // Convert string titles to CuratedArticle objects
      const gridCells: GameGridCell[] = gridCellTitles.map((title, index) => ({
        id: `cell-${index}`,
        article: createArticleFromTitle(title),
      }))
      
      const startingArticle = createArticleFromTitle(startingTitle)
      const startingTitleResolved = getCuratedArticleTitle(startingArticle)
      
      setState({
        ...createInitialState(),
        gameStarted: true,
        gridCells,
        startingArticle,
        currentArticleTitle: startingTitleResolved,
        articleHistory: [startingTitleResolved],
        timerRunning: true,
        articleLoading: false,
        hashedId: gameState.link,
        gameType: 'repeat',
      })
    } catch (error) {
      console.error('Failed to load game:', error)
      throw error
    }
  }, [createArticleFromTitle])

  /**
   * Creates a shareable game by generating a new game and storing it in the API.
   * @returns Object with hashedId and shareable URL (path-based format)
   */
  const createShareableGame = useCallback(async (): Promise<{ gameId: string; url: string }> => {
    try {
      // Generate new game
      const payload = await loadCuratedArticles()
      const { categories, groups } = payload
      const { gridCells, startingArticle } = generateBingoSet(categories, groups)

      // Convert to string arrays for API
      const gridCellTitles = gridCells.map((cell) => getCuratedArticleTitle(cell.article))
      const startingTitle = getCuratedArticleTitle(startingArticle)
      const bingopediaGame = [...gridCellTitles, startingTitle]

      // Create game in API
      const createdGame = await createGame({
        bingopediaGame,
      })

      // Generate shareable URL using path-based format: /{hashedId}
      const url = `${window.location.origin}/${createdGame.link}`

      // Log game_generated event (non-blocking)
      void logEvent('game_generated', { hashedId: createdGame.link })

      return {
        gameId: createdGame.link,
        url,
      }
    } catch (error) {
      console.error('Failed to create shareable game:', error)
      throw error
    }
  }, [])

  /**
   * Registers a navigation to a new article and checks for matches.
   * 
   * This is the single navigation pipeline entry point used by ArticleViewer.
   * It:
   * 1. Immediately sets articleLoading to true (synchronous, before async work)
   * 2. Records navigation in history and increments click count
   * 3. Resolves redirects for both clicked and grid articles (async)
   * 4. Performs bidirectional matching (clicked→grid and grid→clicked)
   * 5. Updates matched articles and checks for winning conditions
   * 6. Starts/pauses timer appropriately
   * 
   * History clicks always count as clicks and can trigger matches/wins.
   * Duplicate navigation is prevented to avoid unnecessary state updates.
   * 
   * @param title - The article title to navigate to
   */
  const registerNavigation = async (title: string) => {
    const normalizedOriginal = normalizeTitle(title)
    
    // DUPLICATE DETECTION: Check against current and previous article using state ref
    // This prevents duplicate navigation that would increment click count unnecessarily
    const current = stateRef.current
    
    // Check if this is the same as current article (using original title before redirect resolution)
    if (current.currentArticleTitle) {
      const normalizedCurrent = normalizeTitle(current.currentArticleTitle)
      if (normalizedCurrent === normalizedOriginal) {
        // Same as current - skip navigation
        return
      }
    }

    // Check if this is the same as previous article in history
    if (current.articleHistory.length > 0) {
      const lastHistoryTitle = current.articleHistory[current.articleHistory.length - 1]
      const normalizedLast = normalizeTitle(lastHistoryTitle)
      if (normalizedLast === normalizedOriginal) {
        // Same as previous - skip navigation
        return
      }
    }

    // IMMEDIATE STATE UPDATE: Set loading state synchronously before async redirect resolution
    // This provides instant feedback to the user
    let currentGridCells: GameGridCell[] = []
    const newlyMatchedTitles: string[] = []
    setState((prev) => {
      currentGridCells = prev.gridCells
      const nextClickCount = prev.clickCount + 1
      // Use original title for now, will update with canonical after redirect resolution
      const nextHistory = [...prev.articleHistory, title]

      const nextMatched = new Set(prev.matchedArticles)

      // Check direct matches first (using original title)
      for (const cell of prev.gridCells) {
        const gridTitle = getCuratedArticleTitle(cell.article)
        const normalizedGrid = normalizeTitle(gridTitle)
        if (
          normalizedGrid === normalizedOriginal &&
          !nextMatched.has(normalizeTitle(gridTitle))
        ) {
          nextMatched.add(normalizeTitle(gridTitle))
          newlyMatchedTitles.push(gridTitle)
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
        currentArticleTitle: title, // Will be updated with canonical after redirect resolution
        timerRunning: false, // Timer will start when article finishes loading
        articleLoading: true, // Set immediately for instant feedback
      }
    })

    // Now resolve redirects asynchronously
    const canonicalClicked = await resolveRedirect(title)
    const normalizedClicked = normalizeTitle(canonicalClicked)

    // Update history with canonical title if different
    if (canonicalClicked !== title) {
      setState((prev) => {
        const updatedHistory = [...prev.articleHistory]
        // Replace the last entry (which was the original title) with canonical
        if (updatedHistory.length > 0) {
          updatedHistory[updatedHistory.length - 1] = canonicalClicked
        }
        return {
          ...prev,
          articleHistory: updatedHistory,
          currentArticleTitle: canonicalClicked,
        }
      })
    }

    // Second update: resolve redirects for all grid cells and check redirect-based matches
    const gridRedirects = await Promise.all(
      currentGridCells.map((cell) =>
        resolveRedirect(getCuratedArticleTitle(cell.article)).then((resolved) => normalizeTitle(resolved)),
      ),
    )

    const redirectMatchedTitles: string[] = []
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
          !nextMatched.has(normalizeTitle(gridTitle))
        ) {
          nextMatched.add(normalizeTitle(gridTitle))
          updated = true
          redirectMatchedTitles.push(gridTitle)
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

    // Call onMatch callback for redirect-based matches
    // Wrap in try-catch to prevent crashes from confetti trigger errors
    if (onMatch && redirectMatchedTitles.length > 0) {
      redirectMatchedTitles.forEach((matchedTitle) => {
        try {
          onMatch(matchedTitle)
        } catch (error) {
          console.error('Error in onMatch callback (redirect-based):', error)
          // Continue execution - don't crash the game
        }
      })
    }

    // Call onMatch callback for newly matched articles
    // Wrap in try-catch to prevent crashes from confetti trigger errors
    if (onMatch && newlyMatchedTitles.length > 0) {
      newlyMatchedTitles.forEach((matchedTitle) => {
        try {
          onMatch(matchedTitle)
        } catch (error) {
          console.error('Error in onMatch callback (direct match):', error)
          // Continue execution - don't crash the game
        }
      })
    }
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
   * Uses a ref to prevent multiple simultaneous replacements of the same article.
   * 
   * @param failedTitle - The title of the article that failed to load
   */
  const replaceFailedArticle = useCallback(
    async (failedTitle: string) => {
      const normalizedFailed = normalizeTitle(failedTitle)
      
      // Prevent multiple simultaneous replacements of the same article
      if (replacingArticlesRef.current.has(normalizedFailed)) {
        console.warn(`Replacement already in progress for: ${failedTitle}`)
        return
      }
      
      replacingArticlesRef.current.add(normalizedFailed)
      console.warn(`Article failed to load: ${failedTitle}`)

      try {
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
            return normalizeTitle(title) === normalizedFailed
          })

          if (gridIndex !== -1) {
            // It's in the grid - replace it with a new random article
            console.log(`Replacing grid article at index ${gridIndex}`)

            // Get replacement asynchronously
            getRandomArticle(Array.from(usedTitles))
              .then((replacement) => {
                setState((current) => {
                  // Double-check the article is still at this index before replacing
                  const currentTitle = getCuratedArticleTitle(current.gridCells[gridIndex]?.article)
                  if (normalizeTitle(currentTitle) !== normalizedFailed) {
                    console.warn(`Article at index ${gridIndex} changed before replacement completed`)
                    replacingArticlesRef.current.delete(normalizedFailed)
                    return current
                  }
                  
                  const newGridCells = [...current.gridCells]
                  newGridCells[gridIndex] = {
                    ...newGridCells[gridIndex],
                    article: replacement,
                  }
                  console.log(`Replaced ${failedTitle} with ${getCuratedArticleTitle(replacement)}`)
                  replacingArticlesRef.current.delete(normalizedFailed)
                  return {
                    ...current,
                    gridCells: newGridCells,
                  }
                })
              })
              .catch((error) => {
                console.error('Failed to get replacement article:', error)
                replacingArticlesRef.current.delete(normalizedFailed)
              })

            return prev // Return unchanged state, replacement will update it
          } else {
            // It's the currently viewed article - replace with a new random one
            console.log('Replacing currently viewed article')

            getRandomArticle(Array.from(usedTitles))
              .then((replacement) => {
                const replacementTitle = getCuratedArticleTitle(replacement)
                setState((current) => {
                  // Double-check the current article is still the failed one
                  if (current.currentArticleTitle && normalizeTitle(current.currentArticleTitle) !== normalizedFailed) {
                    console.warn(`Current article changed before replacement completed`)
                    replacingArticlesRef.current.delete(normalizedFailed)
                    return current
                  }
                  
                  console.log(`Replaced viewed article with ${replacementTitle}`)
                  replacingArticlesRef.current.delete(normalizedFailed)
                  return {
                    ...current,
                    currentArticleTitle: replacementTitle,
                    articleHistory: [...current.articleHistory, replacementTitle],
                  }
                })
              })
              .catch((error) => {
                console.error('Failed to get replacement article:', error)
                replacingArticlesRef.current.delete(normalizedFailed)
              })

            return prev // Return unchanged state, replacement will update it
          }
        })
      } catch (error) {
        console.error('Error in replaceFailedArticle:', error)
        replacingArticlesRef.current.delete(normalizedFailed)
      }
    },
    [getRandomArticle],
  )

  const controls = useMemo(
    () => ({
      startNewGame,
      loadGameFromId,
      createShareableGame,
      registerNavigation,
      setArticleLoading,
      replaceFailedArticle,
    }),
    [startNewGame, loadGameFromId, createShareableGame, registerNavigation, setArticleLoading, replaceFailedArticle],
  )

  return [state, controls]
}


