import type { CuratedArticlesPayload } from './types'

let cachedPayload: CuratedArticlesPayload | null = null

/**
 * Loads curated articles data from the public JSON file.
 * 
 * Results are cached after the first load to avoid redundant fetches.
 * The data includes categories, articles, and group constraints.
 * 
 * @returns Promise resolving to the curated articles payload
 * @throws Error if the JSON file cannot be loaded
 */
export async function loadCuratedArticles(): Promise<CuratedArticlesPayload> {
  if (cachedPayload) return cachedPayload

  const response = await fetch('/curatedArticles.json')
  if (!response.ok) {
    throw new Error('Failed to load curatedArticles.json')
  }

  const json = (await response.json()) as CuratedArticlesPayload
  cachedPayload = json
  return json
}

/**
 * Clears the cached curated articles data.
 * Useful for testing or forcing a reload of the data.
 */
export function clearCuratedArticlesCache() {
  cachedPayload = null
}


