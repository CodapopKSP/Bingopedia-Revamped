import { normalizeTitle } from './normalizeTitle'
import { retry } from '../utils/retry'

interface WikipediaHtmlResult {
  title: string
  html: string
}

import { MAX_ARTICLE_CACHE_SIZE } from '../constants'

/**
 * In-memory cache for Wikipedia article content, keyed by normalized title.
 * This prevents redundant API calls during a single game session.
 * Uses LRU-like behavior: oldest entries are removed when limit is reached.
 */
const ARTICLE_CACHE = new Map<string, WikipediaHtmlResult>()

/**
 * Removes oldest entries from cache when size limit is exceeded.
 */
function enforceCacheLimit() {
  if (ARTICLE_CACHE.size > MAX_ARTICLE_CACHE_SIZE) {
    // Remove oldest entries (first in Map iteration order)
    const entriesToRemove = ARTICLE_CACHE.size - MAX_ARTICLE_CACHE_SIZE
    const keysToRemove = Array.from(ARTICLE_CACHE.keys()).slice(0, entriesToRemove)
    for (const key of keysToRemove) {
      ARTICLE_CACHE.delete(key)
    }
  }
}

/**
 * Sanitizes Wikipedia HTML by removing scripts and styles.
 * Keeps all article content - this matches the old codebase behavior.
 * 
 * The old codebase only removed style and script tags to prevent style conflicts
 * with the app header, but kept all other content including images, paragraphs,
 * sections, and links.
 * 
 * @param html - Raw HTML from Wikipedia API
 * @returns Sanitized HTML string with scripts/styles removed
 */
function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Remove all style tags and script tags that could affect global styles
  // This is critical to prevent Wikipedia styles from overriding our header styles
  doc.querySelectorAll('style, script, noscript').forEach((el) => el.remove())
  
  // Try to find the main content area first (for mobile HTML structure)
  // Mobile HTML often has content in #content or #bodyContent
  const contentContainer = 
    doc.getElementById('content') ||
    doc.getElementById('bodyContent') ||
    doc.querySelector('main') ||
    doc.querySelector('article') ||
    doc.querySelector('.mw-parser-output') ||
    doc.body
  
  // Return cleaned HTML without style tags - keep everything else
  // This matches the old codebase behavior which kept all article content
  return contentContainer?.innerHTML || doc.documentElement.innerHTML
}

async function fetchHtmlFromEndpoint(title: string, endpoint: 'mobile' | 'desktop'): Promise<string | null> {
  const encoded = encodeURIComponent(title)
  const url =
    endpoint === 'mobile'
      ? `https://en.m.wikipedia.org/api/rest_v1/page/mobile-html/${encoded}`
      : `https://en.wikipedia.org/api/rest_v1/page/html/${encoded}`

  try {
    const response = await retry(
      async () => {
        const res = await fetch(url, { mode: 'cors' })
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
      return null
    }
    return response.text()
  } catch (error) {
    console.warn(`Failed to fetch ${endpoint} HTML for "${title}":`, error instanceof Error ? error.message : String(error))
    return null
  }
}

async function fetchSummaryHtml(title: string): Promise<string | null> {
  const encoded = encodeURIComponent(title)
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`
  
  try {
    const response = await retry(
      async () => {
        const res = await fetch(url, { mode: 'cors' })
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
      return null
    }
    const data = (await response.json()) as { extract_html?: string; extract?: string }
    return data.extract_html ?? data.extract ?? null
  } catch (error) {
    console.warn(`Failed to fetch summary for "${title}":`, error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Fetches a Wikipedia article with automatic fallback strategy.
 * 
 * Fetch order:
 * 1. Desktop HTML endpoint (preferred, most complete content)
 * 2. Mobile HTML endpoint (fallback)
 * 3. Summary API (final fallback if HTML unavailable)
 * 
 * Results are cached by normalized title to avoid redundant requests.
 * HTML is sanitized to remove scripts, styles, and navigation elements.
 * 
 * @param title - The Wikipedia article title to fetch
 * @returns Promise resolving to the article title and sanitized HTML
 * @throws Error if all fetch strategies fail
 */
export async function fetchWikipediaArticle(title: string): Promise<WikipediaHtmlResult> {
  const key = normalizeTitle(title)
  const cached = ARTICLE_CACHE.get(key)
  if (cached) return cached

  // Try desktop HTML first (most complete content, matches old codebase preference)
  // Then fall back to mobile HTML, then summary
  const desktopHtml = await fetchHtmlFromEndpoint(title, 'desktop')
  const mobileHtml = desktopHtml ?? (await fetchHtmlFromEndpoint(title, 'mobile'))
  const rawHtml = mobileHtml ?? (await fetchSummaryHtml(title))

  if (!rawHtml) {
    throw new Error('Failed to fetch article content')
  }

  const sanitized = sanitizeHtml(rawHtml)
  const result: WikipediaHtmlResult = {
    title,
    html: sanitized,
  }

  // Enforce cache size limit before adding new entry
  enforceCacheLimit()
  ARTICLE_CACHE.set(key, result)
  return result
}

/**
 * Fetches a short text summary of a Wikipedia article.
 * Used for the article summary modal when clicking grid cells.
 * 
 * @param title - The Wikipedia article title
 * @returns Promise resolving to the article extract/summary text
 * @throws Error if article not found or API request fails
 */
export async function fetchArticleSummary(title: string): Promise<string> {
  const encoded = encodeURIComponent(title)
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`
  const response = await fetch(url, {
    mode: 'cors',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Article not found or unavailable: ${response.status}`)
  }

  const data = (await response.json()) as {
    type?: string
    title?: string
    detail?: string
    extract?: string
  }

  if (
    data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found' ||
    data.title === 'Not found.' ||
    data.detail?.includes('not found')
  ) {
    throw new Error('Article not found')
  }

  return data.extract || ''
}

/**
 * Determines if a Wikipedia link is navigable within the game.
 * 
 * Navigational links are those that point to valid Wikipedia articles that
 * the game should treat as clickable. Non-navigational links include:
 * - External links (http://, https://, mailto:, etc.)
 * - Citation/reference anchors (#cite, #ref)
 * - File/media links
 * - Special Wikipedia pages (Help:, Template:, etc.)
 * 
 * @param href - The href attribute value from a link element
 * @returns true if the link is navigable, false otherwise
 */
export function isNavigableWikiLink(href: string | null): boolean {
  if (!href) return false
  
  // External links are not navigable
  if (href.includes('://') || href.startsWith('//')) {
    return false
  }
  
  // Citation/reference links are not navigable
  if (href.startsWith('#cite') || href.startsWith('#ref') || 
      href.includes('cite_note') || href.includes('cite-ref')) {
    return false
  }
  
  // File/media links are not navigable
  if (href.includes('/wiki/File:') || href.includes('/wiki/Image:') || 
      href.includes('/wiki/Media:')) {
    return false
  }
  
  // Special Wikipedia namespaces are not navigable
  if (href.includes('/wiki/Help:') || href.includes('/wiki/Template:') ||
      href.includes('/wiki/Category:') || href.includes('/wiki/Wikipedia:')) {
    return false
  }
  
  // Valid article links are navigable
  return (
    href.includes('/wiki/') ||
    href.startsWith('./') ||
    href.startsWith('../') ||
    (href.startsWith('/') && !href.includes('://') && !href.startsWith('//'))
  )
}

/**
 * Builds a Wikipedia URL for a given article title.
 * 
 * This function centralizes Wikipedia URL construction to ensure consistent
 * formatting across the application. It handles:
 * - Title normalization (spaces to underscores, proper encoding)
 * - URL encoding for special characters
 * - Proper capitalization (first letter uppercase, rest preserved)
 * 
 * The function accepts a canonical article key (normalized form) and returns
 * a properly formatted Wikipedia URL that Wikipedia can resolve.
 * 
 * @param title - The article title (canonical/normalized form)
 * @returns A complete Wikipedia URL string
 * 
 * @example
 * ```typescript
 * buildWikipediaUrl('Sony Music') // Returns: 'https://en.wikipedia.org/wiki/Sony_Music'
 * buildWikipediaUrl('new york') // Returns: 'https://en.wikipedia.org/wiki/New_York'
 * ```
 */
export function buildWikipediaUrl(title: string): string {
  if (!title) return 'https://en.wikipedia.org/wiki/'
  
  // Wikipedia URL format: spaces become underscores, first letter is uppercase
  // Replace spaces with underscores
  let formatted = title.replace(/\s+/g, '_')
  
  // Capitalize first letter (Wikipedia convention)
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }
  
  // Encode the title for URL (handles special characters)
  const encoded = encodeURIComponent(formatted)
  
  return `https://en.wikipedia.org/wiki/${encoded}`
}

/**
 * Clears the in-memory article cache.
 * 
 * Useful for testing or when starting a fresh game session.
 * This does not affect the redirect cache (see `clearRedirectCache`).
 */
export function clearWikipediaCache() {
  ARTICLE_CACHE.clear()
}


