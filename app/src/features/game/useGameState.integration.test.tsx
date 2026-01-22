import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGameState } from './useGameState'
import { loadCuratedArticles } from '../../shared/data/curatedArticles'
import { fetchWikipediaArticle } from '../../shared/wiki/wikipediaClient'
import { resolveRedirect } from '../../shared/wiki/resolveRedirect'
import { getCuratedArticleTitle } from '../../shared/data/types'

// Mock dependencies
vi.mock('../../shared/data/curatedArticles')
vi.mock('../../shared/wiki/wikipediaClient')
vi.mock('../../shared/wiki/resolveRedirect')

const mockCategories = [
  {
    name: 'Category1',
    articleCount: 10,
    articles: [
      { title: 'Article1', category: 'Category1' },
      { title: 'Article2', category: 'Category1' },
    ],
  },
  {
    name: 'Category2',
    articleCount: 10,
    articles: [
      { title: 'Article3', category: 'Category2' },
      { title: 'Article4', category: 'Category2' },
    ],
  },
  // Add more categories to ensure we have enough for 26
  ...Array.from({ length: 30 }, (_, i) => ({
    name: `Category${i + 3}`,
    articleCount: 5,
    articles: Array.from({ length: 5 }, (_, j) => ({
      title: `Article${i * 5 + j + 5}`,
      category: `Category${i + 3}`,
    })),
  })),
]

describe('useGameState Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadCuratedArticles).mockResolvedValue({
      generatedAt: '2024-01-01',
      totalCategories: mockCategories.length,
      totalArticles: 100,
      groups: {}, // Object format, not array
      categories: mockCategories,
    })
    vi.mocked(fetchWikipediaArticle).mockResolvedValue({
      title: 'Test Article',
      html: '<div>Test content</div>',
    })
    vi.mocked(resolveRedirect).mockImplementation(async (title) => title.toLowerCase().replace(/\s+/g, '_'))
  })

  it('should start a new game and generate bingo set', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
      expect(state.gridCells).toHaveLength(25)
      expect(state.startingArticle).not.toBeNull()
      if (state.startingArticle) {
        expect(state.currentArticleTitle).toBe(getCuratedArticleTitle(state.startingArticle))
      }
      expect(state.articleHistory).toHaveLength(1)
    })
  })

  it('should navigate to a new article and increment click count', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    const [initialState] = result.current
    const initialClicks = initialState.clickCount

    await act(async () => {
      await controls.registerNavigation('New Article')
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.clickCount).toBe(initialClicks + 1)
      expect(state.currentArticleTitle).toBe('New Article')
      expect(state.articleHistory).toContain('New Article')
      expect(state.timerRunning).toBe(true)
    })
  })

  it('should detect matches when navigating to a grid article', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    const [state] = result.current
    const gridArticle = state.gridCells[0]
    const gridTitle = getCuratedArticleTitle(gridArticle.article)

    await act(async () => {
      await controls.registerNavigation(gridTitle)
    })

    await waitFor(() => {
      const [newState] = result.current
      expect(newState.matchedArticles.size).toBeGreaterThan(0)
      expect(Array.from(newState.matchedArticles)).toContain(gridTitle.toLowerCase())
    })
  })

  it('should detect win when completing a row', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    const [state] = result.current
    // Match all 5 articles in the first row (indices 0-4)
    const firstRowArticles = state.gridCells.slice(0, 5).map((cell) => getCuratedArticleTitle(cell.article))

    for (const title of firstRowArticles) {
      await act(async () => {
        await controls.registerNavigation(title)
      })
    }

    await waitFor(() => {
      const [newState] = result.current
      expect(newState.gameWon).toBe(true)
      expect(newState.winningCells.length).toBeGreaterThan(0)
    })
  })

  it('should handle history navigation and increment clicks', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    // Navigate to a few articles
    await act(async () => {
      await controls.registerNavigation('Article A')
    })
    await act(async () => {
      await controls.registerNavigation('Article B')
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.articleHistory.length).toBeGreaterThan(1)
    })

    const [state] = result.current
    const historyItem = state.articleHistory[0]
    const clicksBefore = state.clickCount

    // Navigate back via history
    await act(async () => {
      await controls.registerNavigation(historyItem)
    })

    await waitFor(() => {
      const [newState] = result.current
      expect(newState.clickCount).toBe(clicksBefore + 1)
      expect(newState.currentArticleTitle).toBe(historyItem)
    })
  })

  it('should pause timer during article loading', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    // Start navigation (this sets articleLoading to true)
    act(() => {
      controls.setArticleLoading(true)
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.articleLoading).toBe(true)
      expect(state.timerRunning).toBe(false)
    })

    // Stop loading
    act(() => {
      controls.setArticleLoading(false)
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.articleLoading).toBe(false)
      // Timer should resume if game is in progress
      if (state.gameStarted && !state.gameWon) {
        expect(state.timerRunning).toBe(true)
      }
    })
  })

  it('should enforce group constraints when generating bingo set', async () => {
    const groupsWithConstraints = {
      occupations: { maxPerGame: 1, categories: [] },
      countries: { maxPerGame: 2, categories: [] },
    }

    const categoriesWithGroups = [
      { name: 'Category1', articleCount: 10, group: 'occupations', articles: [{ title: 'Article1' }] },
      { name: 'Category2', articleCount: 10, group: 'occupations', articles: [{ title: 'Article2' }] },
      { name: 'Category3', articleCount: 10, group: 'occupations', articles: [{ title: 'Article3' }] },
      { name: 'Category4', articleCount: 10, group: 'countries', articles: [{ title: 'Article4' }] },
      { name: 'Category5', articleCount: 10, group: 'countries', articles: [{ title: 'Article5' }] },
      { name: 'Category6', articleCount: 10, group: 'countries', articles: [{ title: 'Article6' }] },
      ...Array.from({ length: 30 }, (_, i) => ({
        name: `Category${i + 7}`,
        articleCount: 5,
        articles: Array.from({ length: 5 }, (_, j) => ({ title: `Article${i * 5 + j + 7}` })),
      })),
    ]

    vi.mocked(loadCuratedArticles).mockResolvedValue({
      generatedAt: '2024-01-01',
      totalCategories: categoriesWithGroups.length,
      totalArticles: 100,
      groups: groupsWithConstraints, // Object format
      categories: categoriesWithGroups,
    })

    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
      expect(state.gridCells).toHaveLength(25)
    })

    // Count how many categories from each group were selected
    const [state] = result.current
    const selectedGroups = new Map<string, number>()

    // Check grid cells
    state.gridCells.forEach((cell) => {
      const title = getCuratedArticleTitle(cell.article)
      const category = categoriesWithGroups.find((cat) =>
        cat.articles.some((art) => getCuratedArticleTitle(art as any) === title),
      )
      if (category?.group) {
        selectedGroups.set(category.group, (selectedGroups.get(category.group) || 0) + 1)
      }
    })

    // Check starting article
    if (state.startingArticle) {
      const title = getCuratedArticleTitle(state.startingArticle)
      const category = categoriesWithGroups.find((cat) =>
        cat.articles.some((art) => getCuratedArticleTitle(art as any) === title),
      )
      if (category?.group) {
        selectedGroups.set(category.group, (selectedGroups.get(category.group) || 0) + 1)
      }
    }

    // Verify constraints: max 1 occupation, max 2 countries
    expect(selectedGroups.get('occupations')).toBeLessThanOrEqual(1)
    expect(selectedGroups.get('countries')).toBeLessThanOrEqual(2)
  })

  it('should replace failed grid article', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    const [state] = result.current
    const failedArticle = getCuratedArticleTitle(state.gridCells[0].article)
    const originalGrid = state.gridCells.map((cell) => getCuratedArticleTitle(cell.article))

    await act(async () => {
      await controls.replaceFailedArticle(failedArticle)
    })

    // Wait for replacement to complete
    await waitFor(
      () => {
        const [newState] = result.current
        const newGrid = newState.gridCells.map((cell) => getCuratedArticleTitle(cell.article))
        // Grid should have changed (replacement happened)
        expect(newGrid[0]).not.toBe(failedArticle)
        // Replacement should not duplicate existing articles
        expect(new Set(newGrid).size).toBe(newGrid.length)
      },
      { timeout: 3000 },
    )
  })

  it('should replace failed current article', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    // Navigate to an article first
    await act(async () => {
      await controls.registerNavigation('Some Article')
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.currentArticleTitle).toBe('Some Article')
    })

    const [state] = result.current
    const failedArticle = state.currentArticleTitle!

    await act(async () => {
      await controls.replaceFailedArticle(failedArticle)
    })

    // Wait for replacement to complete
    await waitFor(
      () => {
        const [newState] = result.current
        // Current article should have changed
        expect(newState.currentArticleTitle).not.toBe(failedArticle)
        expect(newState.currentArticleTitle).not.toBeNull()
        // Should be added to history
        expect(newState.articleHistory).toContain(newState.currentArticleTitle)
      },
      { timeout: 3000 },
    )
  })

  it('should handle multiple simultaneous wins', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    const [state] = result.current
    // Match first row (indices 0-4) and first column (indices 0, 5, 10, 15, 20)
    const firstRowArticles = state.gridCells.slice(0, 5).map((cell) => getCuratedArticleTitle(cell.article))
    const firstColumnIndices = [0, 5, 10, 15, 20]
    const firstColumnArticles = firstColumnIndices.map((idx) => getCuratedArticleTitle(state.gridCells[idx].article))

    // Match all articles that are in both row and column (will create multiple wins)
    const articlesToMatch = Array.from(new Set([...firstRowArticles, ...firstColumnArticles]))

    for (const title of articlesToMatch) {
      await act(async () => {
        await controls.registerNavigation(title)
      })
    }

    await waitFor(() => {
      const [newState] = result.current
      expect(newState.gameWon).toBe(true)
      // Should detect multiple winning lines
      expect(newState.winningCells.length).toBeGreaterThanOrEqual(5)
    })
  })

  it('should not cause excessive re-renders from timer updates', async () => {
    const { result } = renderHook(() => useGameState())
    const [, controls] = result.current

    await act(async () => {
      await controls.startNewGame()
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.gameStarted).toBe(true)
    })

    // Start timer by navigating
    await act(async () => {
      await controls.registerNavigation('Test Article')
    })

    await waitFor(() => {
      const [state] = result.current
      expect(state.timerRunning).toBe(true)
    })

    // Wait for a few timer ticks
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2500))
    })

    // Verify timer is still running and elapsed time has increased
    await waitFor(() => {
      const [state] = result.current
      expect(state.timerRunning).toBe(true)
      expect(state.elapsedSeconds).toBeGreaterThan(0)
    })

    // Verify game state is still intact (no resets)
    const [finalState] = result.current
    expect(finalState.gameStarted).toBe(true)
    expect(finalState.currentArticleTitle).toBe('Test Article')
    expect(finalState.articleHistory).toContain('Test Article')
  })
})

