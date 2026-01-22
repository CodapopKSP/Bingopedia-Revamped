import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchLeaderboard, submitScore } from './leaderboardClient'

// Mock fetch globally
global.fetch = vi.fn()

describe('leaderboardClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchLeaderboard', () => {
    it('should fetch leaderboard with default parameters', async () => {
      const mockResponse = {
        users: [
          {
            _id: '1',
            username: 'Player1',
            score: 1000,
            time: 120,
            clicks: 25,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
        },
        sort: {
          sortBy: 'score',
          sortOrder: 'desc',
        },
      }

      const mockFetch = vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await fetchLeaderboard()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResponse)
    })

    it('should include query parameters in URL', async () => {
      const mockResponse = {
        users: [],
        pagination: { page: 2, limit: 20, totalCount: 0, totalPages: 0 },
        sort: { sortBy: 'time', sortOrder: 'asc' },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      await fetchLeaderboard({
        limit: 20,
        page: 2,
        sortBy: 'time',
        sortOrder: 'asc',
      })

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
      expect(callUrl).toContain('limit=20')
      expect(callUrl).toContain('page=2')
      expect(callUrl).toContain('sortBy=time')
      expect(callUrl).toContain('sortOrder=asc')
    })

    it('should throw error on failed fetch', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      await expect(fetchLeaderboard()).rejects.toThrow('Failed to fetch leaderboard')
    })

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchLeaderboard()).rejects.toThrow('Network error')
    })
  })

  describe('submitScore', () => {
    it('should submit score successfully', async () => {
      const payload = {
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: ['Article1', 'Article2'],
        history: ['Start', 'Article1'],
      }

      const mockResponse = {
        _id: '1',
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: ['Article1', 'Article2'],
        history: ['Start', 'Article1'],
        createdAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await submitScore(payload)

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }),
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw error on failed submission', async () => {
      const payload = {
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response)

      await expect(submitScore(payload)).rejects.toThrow('Failed to submit score')
    })

    it('should handle network errors', async () => {
      const payload = {
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
      }

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(submitScore(payload)).rejects.toThrow('Network error')
    })

    it('should handle server error responses', async () => {
      const payload = {
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Database connection failed' }),
      } as Response)

      await expect(submitScore(payload)).rejects.toThrow('Failed to submit score')
    })
  })
})

