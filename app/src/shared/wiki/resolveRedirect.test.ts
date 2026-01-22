import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resolveRedirect, clearRedirectCache } from './resolveRedirect'
import { retry } from '../utils/retry'

// Mock fetch and retry
global.fetch = vi.fn()
vi.mock('../utils/retry', async () => {
  const actual = await vi.importActual('../utils/retry')
  return {
    ...actual,
    retry: vi.fn((fn) => fn()), // By default, just call the function without retrying
  }
})

describe('resolveRedirect', () => {
  beforeEach(() => {
    clearRedirectCache()
    vi.clearAllMocks()
  })

  it('should return the original title if no redirect exists', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        query: {},
      }),
    }
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

    const result = await resolveRedirect('United States')
    expect(result).toBe('united_states')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should resolve a redirect to the canonical title', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        query: {
          redirects: [{ to: 'United States' }],
        },
      }),
    }
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

    const result = await resolveRedirect('USA')
    expect(result).toBe('united_states')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should cache redirect resolutions', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        query: {
          redirects: [{ to: 'United States' }],
        },
      }),
    }
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

    const result1 = await resolveRedirect('USA')
    const result2 = await resolveRedirect('USA')
    const result3 = await resolveRedirect('USA')

    expect(result1).toBe('united_states')
    expect(result2).toBe('united_states')
    expect(result3).toBe('united_states')
    // Should only fetch once due to caching
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should gracefully fall back to original title on fetch failures', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    // Should not throw, but return normalized original title
    const result = await resolveRedirect('Test Article')
    expect(result).toBe('test_article')
  })

  it('should gracefully fall back to original title on non-ok responses', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    }
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

    // Should not throw, but return normalized original title
    const result = await resolveRedirect('Test Article')
    expect(result).toBe('test_article')
  })

  it('should normalize the resolved title', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        query: {
          redirects: [{ to: 'United States of America' }],
        },
      }),
    }
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

    const result = await resolveRedirect('USA')
    expect(result).toBe('united_states_of_america')
  })

  it('should handle case-insensitive redirects', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        query: {
          redirects: [{ to: 'United States' }],
        },
      }),
    }
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response)

    const result1 = await resolveRedirect('usa')
    const result2 = await resolveRedirect('USA')
    const result3 = await resolveRedirect('Usa')

    // All should resolve to the same normalized title
    expect(result1).toBe('united_states')
    expect(result2).toBe('united_states')
    expect(result3).toBe('united_states')
    // Should only fetch 3 times (once per unique normalized input)
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})

