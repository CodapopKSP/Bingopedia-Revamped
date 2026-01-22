import { normalizeTitle } from './normalizeTitle'
import { retry } from '../utils/retry'

import { MAX_REDIRECT_CACHE_SIZE } from '../constants'

/**
 * In-memory cache for Wikipedia redirect resolutions, keyed by normalized title.
 * Prevents redundant API calls for the same redirect chains.
 * Uses LRU-like behavior: oldest entries are removed when limit is reached.
 */
const REDIRECT_CACHE = new Map<string, string>()

/**
 * Removes oldest entries from cache when size limit is exceeded.
 */
function enforceCacheLimit() {
  if (REDIRECT_CACHE.size > MAX_REDIRECT_CACHE_SIZE) {
    // Remove oldest entries (first in Map iteration order)
    const entriesToRemove = REDIRECT_CACHE.size - MAX_REDIRECT_CACHE_SIZE
    const keysToRemove = Array.from(REDIRECT_CACHE.keys()).slice(0, entriesToRemove)
    for (const key of keysToRemove) {
      REDIRECT_CACHE.delete(key)
    }
  }
}

/**
 * Resolves Wikipedia redirects to find the canonical article title.
 * 
 * Uses the Wikipedia Query API with redirects=1 to follow redirect chains.
 * Results are cached by normalized title to avoid repeated API calls.
 * 
 * If no redirect exists, returns the original title.
 * If the API call fails, gracefully falls back to the original title (does not throw).
 * This matches the old codebase behavior and prevents network issues from breaking the game.
 * 
 * @param title - The article title (may be a redirect)
 * @returns Promise resolving to the canonical/non-redirect title (or original title on error)
 */
export async function resolveRedirect(title: string): Promise<string> {
  const key = normalizeTitle(title)
  const cached = REDIRECT_CACHE.get(key)
  if (cached) return cached

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&format=json&titles=${encodeURIComponent(
      title,
    )}&origin=*`

    const response = await retry(
      async () => {
        const res = await fetch(url)
        if (!res.ok && res.status >= 500) {
          // Retry on 5xx errors
          throw new Error(`HTTP ${res.status}`)
        }
        return res
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 4000,
        backoffMultiplier: 2,
      },
    )

    if (!response.ok) {
      console.warn(`Failed to resolve redirect for "${title}": HTTP ${response.status}. Using original title.`)
      const normalizedOriginal = normalizeTitle(title)
      enforceCacheLimit()
      REDIRECT_CACHE.set(key, normalizedOriginal)
      return normalizedOriginal
    }

    const data = (await response.json()) as {
      query?: { redirects?: Array<{ to: string }> }
    }

    const resolved = data.query?.redirects?.[0]?.to ?? title
    const normalizedResolved = normalizeTitle(resolved)
    enforceCacheLimit()
    REDIRECT_CACHE.set(key, normalizedResolved)
    return normalizedResolved
  } catch (error) {
    // Network errors or other failures: gracefully fall back to original title
    console.warn(`Error resolving redirect for "${title}":`, error instanceof Error ? error.message : String(error))
    const normalizedOriginal = normalizeTitle(title)
    enforceCacheLimit()
    REDIRECT_CACHE.set(key, normalizedOriginal)
    return normalizedOriginal
  }
}

/**
 * Clears the in-memory redirect cache.
 * 
 * Useful for testing or when starting a fresh game session.
 * This does not affect the article content cache (see `clearWikipediaCache`).
 */
export function clearRedirectCache() {
  REDIRECT_CACHE.clear()
}


