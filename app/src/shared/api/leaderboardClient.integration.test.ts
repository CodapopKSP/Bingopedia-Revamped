import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchLeaderboard, submitScore } from './leaderboardClient'

// Mock fetch globally
global.fetch = vi.fn()

describe('leaderboardClient Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Full game flow with leaderboard', () => {
    it('should submit score after winning a game', async () => {
      const mockSubmitResponse = {
        _id: '123',
        username: 'TestPlayer',
        score: 1500,
        time: 120,
        clicks: 25,
        bingoSquares: ['Article1', '[Found] Article2', 'Article3'],
        history: ['Start', 'Article1', 'Article2'],
        createdAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubmitResponse,
      } as Response)

      const payload = {
        username: 'TestPlayer',
        score: 1500,
        time: 120,
        clicks: 25,
        bingoSquares: ['Article1', '[Found] Article2', 'Article3'],
        history: ['Start', 'Article1', 'Article2'],
      }

      const result = await submitScore(payload)

      expect(result).toEqual(mockSubmitResponse)
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
    })

    it('should fetch leaderboard and display submitted score', async () => {
      const mockLeaderboardResponse = {
        users: [
          {
            _id: '123',
            username: 'TestPlayer',
            score: 1500,
            time: 120,
            clicks: 25,
            bingoSquares: ['Article1', '[Found] Article2'],
            history: ['Start', 'Article1'],
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

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboardResponse,
      } as Response)

      const result = await fetchLeaderboard({ limit: 10, sortBy: 'score', sortOrder: 'desc' })

      expect(result.users).toHaveLength(1)
      expect(result.users[0].username).toBe('TestPlayer')
      expect(result.users[0].score).toBe(1500)
    })

    it('should handle score submission error gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Username is required' }),
      } as Response)

      const payload = {
        username: '',
        score: 1500,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
      }

      await expect(submitScore(payload)).rejects.toThrow('Failed to submit score')
    })

    it('should handle network error during submission', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const payload = {
        username: 'TestPlayer',
        score: 1500,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
      }

      await expect(submitScore(payload)).rejects.toThrow('Network error')
    })
  })
})

