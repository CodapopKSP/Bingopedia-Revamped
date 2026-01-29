import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { fetchWikipediaArticle, buildWikipediaUrl, isNavigableWikiLink } from '../../shared/wiki/wikipediaClient'
import { normalizeTitle } from '../../shared/wiki/normalizeTitle'
import { TableOfContents, type ToCItem } from './TableOfContents'
import './ArticleViewer.css'

interface ArticleViewerProps {
  articleTitle: string | null
  onArticleClick: (title: string) => void
  onArticleLoadFailure?: (title: string) => void
  onLoadingChange?: (loading: boolean) => void
  gameWon: boolean
  /**
   * Whether the timer is paused for article loading.
   * When true, displays a contextual message in the loading UI.
   */
  isPausedForLoading?: boolean
}

/**
 * Maximum number of component-level retry attempts.
 * Each retry will trigger a new fetchWikipediaArticle call, which itself has 3 API-level retries.
 * Total possible attempts = MAX_RETRIES × 3 (API retries) = 9 attempts maximum.
 */
const MAX_RETRIES = 3

/**
 * Delays between component-level retry attempts (in milliseconds).
 * First retry is immediate (0ms), subsequent retries have increasing delays.
 */
const RETRY_DELAYS: readonly number[] = [0, 1000, 2000] as const

function processHtmlLinks(htmlString: string): string {
  if (!htmlString) return htmlString

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlString

  const links = tempDiv.querySelectorAll('a')

  links.forEach((link) => {
    const href = link.getAttribute('href')
    const isNavigable = isNavigableWikiLink(href)

    if (!isNavigable) {
      // Non-navigational links: remove href, add neutral styling class
      link.classList.add('non-navigational')
      link.setAttribute('href', '#')
      link.setAttribute('role', 'text') // Remove link semantics
      // Keep title attribute if it exists, or add a descriptive one
      if (!link.getAttribute('title')) {
        link.setAttribute('title', 'This link is not available in the game')
      }
    }
    
    // Process images within links to prevent navigation on image clicks
    // Add CSS class to images inside navigational links
    const images = link.querySelectorAll('img, svg, picture')
    images.forEach((img) => {
      img.classList.add('bp-image-non-navigational')
    })
    // Navigational links keep their href and link semantics
  })

  return tempDiv.innerHTML
}

/**
 * Extracts the table of contents structure from Wikipedia article HTML.
 * 
 * **Extraction Strategy** (multiple fallbacks for robustness):
 * 1. Primary: Extract from raw Wikipedia HTML (current approach)
 * 2. Fallback: Try alternative selectors if primary fails
 * 3. Fallback: Extract from article content DOM after rendering (not implemented here, handled by component)
 * 
 * Handles both desktop and mobile Wikipedia HTML structures:
 * - Desktop: `<div id="toc" class="toc">` with nested `<ul>` and `<li>` elements
 * - Mobile: Similar structure but may be in different location
 * - Each item has `<a href="#section-name">` and text content
 * - Nested `<ul>` for subsections
 * 
 * **Performance**: This function is called synchronously during HTML processing,
 * and results are cached per article title to avoid re-extraction.
 * 
 * **Text Extraction**: Uses robust text extraction (`textContent` with `innerText` fallback)
 * to handle nested structures (spans, icons, navigation elements). Strips out icon spans
 * and navigation elements. Preserves Unicode characters properly. Minimum text length is 2
 * characters to filter out single-character navigation elements like "v", "t", "e".
 * 
 * **ID Extraction**: Handles URL-encoded section IDs (decodes `%20` → space, `%27` → apostrophe, etc.).
 * Supports multiple ID formats (normalizes hyphens, underscores, spaces). Extracts IDs from both
 * `href` attributes (primary) and `id` attributes (fallback). Normalizes IDs to lowercase for
 * consistent matching with article section headings.
 * 
 * **Container Detection**: Tries multiple selectors in order for compatibility:
 * `#toc`, `nav#toc`, `div.toc`, `aside.toc`, `[id="toc"]`, `.toc`, `nav.toc`, `[role="navigation"]`
 * Validates that container has at least one `<ul>` before proceeding.
 * 
 * **Error Recovery**: Returns empty array if all extraction strategies fail. Logs warnings
 * in development mode when ToC not found (includes article title if provided for debugging).
 * Component handles empty ToC gracefully (shows empty state message).
 * 
 * @param html - The HTML string from Wikipedia article
 * @param articleTitle - Optional article title for logging purposes (helps with debugging)
 * @returns Array of ToC items, or empty array if no ToC found
 * 
 * @example
 * ```typescript
 * const tocItems = extractTableOfContents(articleHtml, 'Article_Title')
 * // Returns: [{ id: 'History', text: 'History', level: 1, children: [...] }]
 * ```
 */
export function extractTableOfContents(html: string, articleTitle?: string): ToCItem[] {
  if (!html) return []

  /**
   * Normalizes a section ID for consistent matching.
   * Handles URL encoding, normalizes separators, and converts to lowercase.
   * @param id - The raw section ID from href or id attribute
   * @returns Normalized ID (lowercase, decoded, normalized separators)
   */
  function normalizeSectionId(id: string): string {
    if (!id) return ''
    
    // Decode URL encoding (e.g., %20 → space, %27 → apostrophe)
    let normalized = decodeURIComponent(id)
    
    // Normalize separators: convert underscores and spaces to hyphens
    normalized = normalized.replace(/[_\s]+/g, '-')
    
    // Convert to lowercase for consistent matching
    normalized = normalized.toLowerCase()
    
    // Remove leading/trailing hyphens
    normalized = normalized.replace(/^-+|-+$/g, '')
    
    return normalized
  }

  /**
   * Extracts section ID from a link element.
   * Tries href attribute first, then id attribute as fallback.
   * @param link - The anchor element
   * @returns Normalized section ID, or empty string if not found
   */
  function extractSectionId(link: HTMLAnchorElement): string {
    // Primary: Extract from href attribute (e.g., "#History" → "History")
    // Store the original ID (before normalization) for scrolling
    const href = link.getAttribute('href')
    if (href) {
      const idFromHref = href.replace(/^#/, '')
      if (idFromHref) {
        // Return normalized ID for consistent storage, but we'll use original for scrolling
        return normalizeSectionId(idFromHref)
      }
    }
    
    // Fallback: Extract from id attribute
    const idAttr = link.getAttribute('id')
    if (idAttr) {
      return normalizeSectionId(idAttr)
    }
    
    return ''
  }
  
  /**
   * Extracts the original (non-normalized) section ID from a link element.
   * This is used for scrolling since HTML IDs might not match normalized versions.
   * @param link - The anchor element
   * @returns Original section ID (not normalized), or empty string if not found
   */
  function extractOriginalSectionId(link: HTMLAnchorElement): string {
    // Primary: Extract from href attribute (e.g., "#History" → "History")
    const href = link.getAttribute('href')
    if (href) {
      const idFromHref = href.replace(/^#/, '')
      if (idFromHref) {
        // Return original ID (decoded but not normalized)
        // Use try-catch to handle cases where decodeURIComponent fails
        try {
          return decodeURIComponent(idFromHref)
        } catch {
          // If decode fails, return the original (might not be URL-encoded)
          return idFromHref
        }
      }
    }
    
    // Fallback: Extract from id attribute
    const idAttr = link.getAttribute('id')
    if (idAttr) {
      return idAttr
    }
    
    return ''
  }

  /**
   * Cleans text content by removing icon spans and navigation elements.
   * Preserves Unicode characters and handles nested structures.
   * @param link - The anchor element containing text
   * @returns Cleaned text content
   */
  function extractCleanText(link: HTMLAnchorElement): string {
    // Wikipedia ToC structure: <a href="#Section"><span class="toctext">Section Name</span></a>
    // The text is usually in a .toctext span, so check for that first
    const toctextSpan = link.querySelector('.toctext')
    if (toctextSpan) {
      const text = toctextSpan.textContent?.trim() || toctextSpan.innerText?.trim() || ''
      if (text && text.length >= 2) {
        return text
      }
    }
    
    // If no .toctext span, extract from the link itself
    // Remove unwanted elements but keep the actual text content
    const clone = link.cloneNode(true) as HTMLAnchorElement
    
    // Remove icon spans and navigation elements, but NOT .toctext (we already checked for it)
    const unwantedElements = clone.querySelectorAll('span.mw-editsection, .mw-editsection, .icon, [class*="icon"], .tocnumber')
    unwantedElements.forEach(el => el.remove())
    
    // Extract text content - textContent gets all text including nested elements
    let text = clone.textContent?.trim() || ''
    
    // If textContent is empty, try innerText as fallback
    if (!text || text.length < 2) {
      text = clone.innerText?.trim() || ''
    }
    
    return text
  }

  /**
   * Recursively extracts ToC items from a list element.
   * @param listElement - The `<ul>` element to extract from
   * @param level - The nesting level (1 for top-level, 2 for subsections, etc.)
   * @returns Array of ToC items
   */
  function extractItems(listElement: HTMLUListElement, level: number = 1): ToCItem[] {
    const items: ToCItem[] = []
    // Use :scope to only select direct children
    const listItems = listElement.querySelectorAll(':scope > li')
    
    if (process.env.NODE_ENV === 'development' && listItems.length === 0) {
      console.debug(`[ToC Extraction] No list items found in list element`)
    }
    
    listItems.forEach((li) => {
      const link = li.querySelector('a')
      if (!link) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[ToC Extraction] List item has no link element`)
        }
        return
      }
      
      // Check href to determine if this is a section link or article link
      const href = link.getAttribute('href') || ''
      
      // Skip article links - only extract section anchors (hrefs starting with #)
      // Article links include: /wiki/Article, ./Article, Article (without #), http://, etc.
      const isSectionLink = href.startsWith('#')
      const isArticleLink = !isSectionLink && (
        href.includes('/wiki/') ||
        href.includes('://') ||
        (href.startsWith('./') && !href.startsWith('./#')) ||
        (href.startsWith('../') && !href.startsWith('../#')) ||
        (href.length > 0 && !href.startsWith('#') && !href.startsWith('#'))
      )
      
      if (isArticleLink) {
        // This is a link to another article, not a section anchor - skip it
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[ToC Extraction] Skipping article link: href="${href}"`)
        }
        return
      }
      
      // Only proceed if this is a section link (starts with #)
      if (!isSectionLink) {
        // Not a section link and not an article link - skip it
        return
      }
      
      // Extract normalized section ID (for storage/display)
      const id = extractSectionId(link)
      
      // Extract original section ID (for scrolling - matches actual HTML IDs)
      const originalId = extractOriginalSectionId(link)
      
      // Extract cleaned text content
      const text = extractCleanText(link)
      
      // Use original ID for scrolling (matches HTML)
      // Always prefer originalId, but fallback to normalized if originalId is empty
      const finalId = originalId || id
      
      // Skip items with empty or invalid text or ID
      // Minimum length is 2 characters to filter out single-character navigation elements
      // (e.g., "v", "t", "e" which are Wikipedia navigation shortcuts)
      if (!finalId || !text || text.length < 2) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[ToC Extraction] Skipping item: id="${finalId}", text="${text}" (too short or empty)`)
        }
        return
      }
      
      // Skip common Wikipedia navigation elements that aren't real sections
      const lowerText = text.toLowerCase().trim()
      if (lowerText === 'v' || lowerText === 't' || lowerText === 'e') {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[ToC Extraction] Skipping navigation element: "${text}"`)
        }
        return
      }
      
      const item: ToCItem = {
        id: finalId, // Use original ID if available, fallback to normalized
        text,
        level,
        children: [],
      }
      
      // Check for nested list (subsections)
      const nestedList = li.querySelector(':scope > ul')
      if (nestedList && nestedList instanceof HTMLUListElement) {
        item.children = extractItems(nestedList, level + 1)
      }
      
      items.push(item)
    })
    
    if (process.env.NODE_ENV === 'development' && items.length > 0) {
      console.debug(`[ToC Extraction] Extracted ${items.length} items at level ${level}`)
    }
    
    return items
  }

  // Strategy 1: Primary extraction from raw HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Expanded selector list for better compatibility (desktop and mobile)
  // Try multiple selectors in order of specificity
  const tocContainer = 
    doc.getElementById('toc') || 
    doc.querySelector('nav#toc') ||
    doc.querySelector('div.toc') ||
    doc.querySelector('aside.toc') ||
    doc.querySelector('[id="toc"]') ||
    doc.querySelector('.toc') ||
    doc.querySelector('nav.toc') ||
    doc.querySelector('[role="navigation"]')
  
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    if (!tocContainer) {
      // Try to find any potential ToC-like structures for debugging
      const potentialTocs = doc.querySelectorAll('[id*="toc"], [class*="toc"], nav, aside')
      if (potentialTocs.length > 0) {
        console.debug(`[ToC Extraction] Found ${potentialTocs.length} potential ToC containers but none matched primary selectors`)
      }
    }
  }
  
  // Validate container has at least one <ul> before proceeding
  if (tocContainer) {
    const mainList = tocContainer.querySelector('ul')
    if (mainList && mainList instanceof HTMLUListElement) {
      const items = extractItems(mainList)
      if (items.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[ToC Extraction] Successfully extracted ${items.length} ToC items using primary strategy`)
        }
        return items
      } else if (process.env.NODE_ENV === 'development') {
        console.debug(`[ToC Extraction] Found ToC container but extraction returned 0 items`)
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.debug(`[ToC Extraction] Found ToC container but no <ul> element found`)
    }
  }
  
  // Strategy 2: Fallback - try finding ToC in different locations
  // Some Wikipedia articles may have ToC in alternative structures
  const alternativeContainers = doc.querySelectorAll('nav, aside, div[class*="toc"], div[id*="toc"]')
  for (const container of Array.from(alternativeContainers)) {
    const mainList = container.querySelector('ul')
    if (mainList && mainList instanceof HTMLUListElement) {
      // Check if this looks like a ToC (has links with href starting with #)
      const sectionLinks = mainList.querySelectorAll('a[href^="#"]')
      if (sectionLinks.length > 0) {
        const items = extractItems(mainList)
        if (items.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[ToC Extraction] Successfully extracted ${items.length} ToC items using fallback strategy`)
          }
          return items
        }
      }
    }
  }
  
  // Strategy 3: Try to find ToC by looking for lists with section links anywhere in the document
  // This is a more aggressive fallback for cases where ToC structure is non-standard
  const allLists = doc.querySelectorAll('ul')
  for (const list of Array.from(allLists)) {
    if (list instanceof HTMLUListElement) {
      const sectionLinks = list.querySelectorAll('a[href^="#"]')
      // If we find a list with multiple section links, it might be a ToC
      if (sectionLinks.length >= 3) {
        const items = extractItems(list)
        // Only use this if we got a reasonable number of items
        if (items.length >= 3) {
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[ToC Extraction] Successfully extracted ${items.length} ToC items using aggressive fallback strategy`)
          }
          return items
        }
      }
    }
  }
  
  // Strategy 4: Extract ToC from section headings in the article content
  // This is a last resort - build ToC from actual section headings
  // This works even if Wikipedia doesn't provide a ToC container
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length > 0) {
    const tocFromHeadings: ToCItem[] = []
    const stack: ToCItem[] = [] // Stack to track parent items for nesting
    
    headings.forEach((heading) => {
      // Skip the main article title (usually first h1)
      if (heading.tagName === 'H1' && tocFromHeadings.length === 0) {
        return
      }
      
      const headingLevel = parseInt(heading.tagName.charAt(1))
      let headingId = heading.id || heading.getAttribute('name') || ''
      
      // If no ID, try to generate one from the text
      if (!headingId) {
        const headingText = heading.textContent?.trim() || heading.innerText?.trim() || ''
        if (headingText) {
          // Generate ID from text (similar to how Wikipedia does it)
          headingId = headingText
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Collapse multiple hyphens
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        }
      }
      
      const headingText = heading.textContent?.trim() || heading.innerText?.trim() || ''
      
      // Skip if no ID or text
      if (!headingId || !headingText || headingText.length < 2) {
        return
      }
      
      // Normalize the ID
      const normalizedId = normalizeSectionId(headingId)
      if (!normalizedId) {
        return
      }
      
      // Skip common Wikipedia navigation elements
      const lowerText = headingText.toLowerCase().trim()
      if (lowerText === 'v' || lowerText === 't' || lowerText === 'e') {
        return
      }
      
      const item: ToCItem = {
        id: normalizedId,
        text: headingText,
        level: headingLevel,
        children: [],
      }
      
      // Handle nesting: find the appropriate parent based on heading levels
      // Pop items from stack until we find a parent at a lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= headingLevel) {
        stack.pop()
      }
      
      if (stack.length > 0) {
        // Add as child of the top item on the stack
        stack[stack.length - 1].children.push(item)
      } else {
        // Top-level item
        tocFromHeadings.push(item)
      }
      
      // Push this item onto the stack (it might become a parent)
      stack.push(item)
    })
    
    if (tocFromHeadings.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ToC Extraction] Successfully extracted ${tocFromHeadings.length} ToC items from section headings`)
      }
      return tocFromHeadings
    }
  }
  
  // All extraction strategies failed
  // Log warning for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    const titleInfo = articleTitle ? ` for article "${articleTitle}"` : ''
    console.warn(`[ToC Extraction] Table of Contents container not found${titleInfo}. Article may not have a ToC, or structure is non-standard.`)
    
    // Additional debugging: log document structure
    const allIds = Array.from(doc.querySelectorAll('[id]')).map(el => el.id).filter(id => id)
    const tocLikeIds = allIds.filter(id => id.toLowerCase().includes('toc'))
    if (tocLikeIds.length > 0) {
      console.debug(`[ToC Extraction] Found IDs that might be ToC-related:`, tocLikeIds)
    }
    
    // Log heading count for debugging
    const headingCount = doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length
    console.debug(`[ToC Extraction] Found ${headingCount} headings in document`)
  }
  
  return []
}

/**
 * Component that displays Wikipedia article content with interactive links.
 * 
 * Fetches, sanitizes, and displays Wikipedia articles. Intercepts link clicks to navigate
 * within the game instead of following external links. Handles loading states and errors.
 * 
 * **Performance Optimizations**:
 * - Memoized to prevent unnecessary re-renders when parent components update (e.g., timer ticks)
 * - Uses stable refs for event handlers to prevent re-attaching listeners
 * - Table of Contents extraction happens synchronously during HTML processing (not in separate useEffect)
 * - ToC results are cached per article title to avoid re-extraction
 * 
 * **Navigation Reliability**:
 * - Click debouncing prevents rapid clicks from triggering multiple navigations (100ms delay)
 * - Navigation lock in useGameState prevents concurrent navigations
 * - Event handler attached immediately when content is available (useEffect with content dependency)
 * - Handler is stable (memoized with useCallback) to prevent unnecessary re-attachments
 * - First-click reliability ensured by immediate handler attachment and stable callback
 * 
 * **Image Click Prevention**:
 * - Images (IMG, SVG, picture elements) within links do not trigger navigation
 * - Image clicks are detected and prevented in the click handler
 * - Images are marked with CSS class `bp-image-non-navigational` during HTML processing
 * 
 * **Table of Contents**:
 * - Button always visible (even when ToC is empty, shows loading state in modal)
 * - Button disabled during article loading
 * - Extracted immediately when HTML is received (no delay)
 * - Modal opens instantly when button is clicked (shows loading state if ToC not ready)
 * - Section navigation uses case-insensitive ID matching for robust scrolling
 * 
 * @param props - Component props
 * @param props.articleTitle - The Wikipedia article title to display
 * @param props.onArticleClick - Callback when a Wikipedia link is clicked, receives the article title
 * @param props.onArticleLoadFailure - Callback when article fails to load, receives the failed title
 * @param props.onLoadingChange - Callback to notify parent of loading state changes
 * @param props.gameWon - Whether the game has been won (disables link clicking)
 * @param props.isPausedForLoading - Whether the timer is paused for article loading (optional, for backward compatibility)
 */
function ArticleViewerComponent({
  articleTitle,
  onArticleClick,
  onArticleLoadFailure,
  onLoadingChange,
  gameWon,
  isPausedForLoading,
}: ArticleViewerProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  // Immediate feedback state management
  /** Tracks the title of the link that was clicked for visual feedback */
  const [clickedLinkTitle, setClickedLinkTitle] = useState<string | null>(null)
  /** Prevents multiple clicks during navigation to avoid double-loads */
  const [isNavigating, setIsNavigating] = useState(false)
  // Table of Contents state
  /** Extracted table of contents items from the article */
  const [tocItems, setTocItems] = useState<ToCItem[]>([])
  /** Whether the ToC modal/overlay is visible */
  const [showToc, setShowToc] = useState(false)
  /** Cache for ToC extraction results per article title */
  const tocCacheRef = useRef<Map<string, ToCItem[]>>(new Map())
  // Retry state management
  /** Current retry attempt number (0 = first attempt, 1+ = retries) */
  const [retryCount, setRetryCount] = useState(0)
  /** Whether we're currently in a retry attempt (not the initial load) */
  const [isRetrying, setIsRetrying] = useState(false)
  // Reload state - increments to force reload
  const [reloadKey, setReloadKey] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const failureReportedRef = useRef(new Set<string>())
  const currentLoadingTitleRef = useRef<string | null>(null)
  const onLoadingChangeRef = useRef(onLoadingChange)
  const prevLoadingRef = useRef(loading)
  // Scroll position preservation
  const scrollPositionRef = useRef<number>(0)
  const previousArticleTitleRef = useRef<string | null>(null)
  const activeElementRef = useRef<Element | null>(null)
  // ToC modal focus management
  const tocModalRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedElementRef = useRef<Element | null>(null)
  // Stable refs for click handler to prevent re-attaching event listeners
  const onArticleClickRef = useRef(onArticleClick)
  const gameWonRef = useRef(gameWon)
  const isNavigatingRef = useRef(isNavigating)
  // Retry timeout management
  /** Reference to the retry timeout ID for cleanup */
  const retryTimeoutRef = useRef<number | null>(null)
  // Click debouncing refs
  /** Tracks the timestamp of the last click for debouncing */
  const lastClickTimeRef = useRef<number>(0)
  /** Debounce delay in milliseconds (prevents rapid clicks from triggering multiple navigations) */
  const DEBOUNCE_DELAY = 100

  // Keep refs updated without causing re-renders
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange
  }, [onLoadingChange])

  useEffect(() => {
    onArticleClickRef.current = onArticleClick
  }, [onArticleClick])

  useEffect(() => {
    gameWonRef.current = gameWon
  }, [gameWon])

  useEffect(() => {
    isNavigatingRef.current = isNavigating
  }, [isNavigating])

  // Only call onLoadingChange when loading state actually changes
  useEffect(() => {
    if (prevLoadingRef.current !== loading) {
      prevLoadingRef.current = loading
      if (onLoadingChangeRef.current) {
        onLoadingChangeRef.current(loading)
      }
    }
  }, [loading])

  // Reset navigation state when article loads successfully
  useEffect(() => {
    if (!loading && !error && content) {
      setIsNavigating(false)
      setClickedLinkTitle(null)
      // Remove visual feedback from all links
      if (contentRef.current) {
        contentRef.current.querySelectorAll('.bp-link-clicked').forEach((link) => {
          link.classList.remove('bp-link-clicked')
        })
      }
    }
  }, [loading, error, content])

  // ToC extraction is now done synchronously during HTML processing (see loadArticle function)
  // This useEffect is removed to improve performance - ToC is extracted immediately when HTML is received

  useEffect(() => {
    if (!articleTitle) {
      setContent('')
      setError(null)
      setLoading(false)
      setIsNavigating(false)
      setClickedLinkTitle(null)
      setRetryCount(0)
      setIsRetrying(false)
      setTocItems([]) // Clear ToC when no article
      setShowToc(false) // Close ToC modal when no article
      previousArticleTitleRef.current = null
      // Clear any pending retry timeout
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      return
    }

    const normalized = normalizeTitle(articleTitle)
    const articleChanged = previousArticleTitleRef.current !== normalized && previousArticleTitleRef.current !== null
    
    // If reloadKey changed, clear cache and content for this article to force fresh load
    if (reloadKey > 0) {
      tocCacheRef.current.delete(normalized)
      currentLoadingTitleRef.current = null
      setContent('')
      setTocItems([])
    }

    // Clear ToC and close modal when article changes
    // Do this immediately to prevent race conditions
    if (articleChanged) {
      setTocItems([])
      setShowToc(false)
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[ToC] Article changed - cleared ToC. Old: ${previousArticleTitleRef.current}, New: ${normalized}`)
      }
    }

    // Save scroll position and focus before article changes
    if (articleChanged && contentRef.current) {
      scrollPositionRef.current = contentRef.current.scrollTop
      activeElementRef.current = document.activeElement
    }

    /**
     * Loads an article with automatic retry logic.
     * 
     * Component-level retry strategy:
     * - If fetchWikipediaArticle fails (after all its internal API-level retries),
     *   we retry the entire operation up to MAX_RETRIES times.
     * - Each retry has a delay from RETRY_DELAYS array (immediate, 1s, 2s).
     * - This provides resilience against transient network issues that persist
     *   longer than a single API call's retry window.
     * 
     * @param attemptNumber - Current retry attempt (0 = first attempt, 1+ = retries)
     */
    const loadArticle = async (attemptNumber: number = 0) => {
      // Prevent duplicate loads of the same article on first attempt
      // Skip this check if we're reloading (reloadKey > 0)
      if (currentLoadingTitleRef.current === normalized && attemptNumber === 0 && reloadKey === 0) {
        return
      }

      // If article title changed during retry, cancel the retry
      // (This handles edge case where user navigates to new article while retry is pending)
      const currentNormalized = normalizeTitle(articleTitle)
      if (attemptNumber > 0 && currentNormalized !== normalized) {
        // Article changed - cancel retry
        setRetryCount(0)
        setIsRetrying(false)
        setLoading(false)
        if (currentLoadingTitleRef.current === normalized) {
          currentLoadingTitleRef.current = null
        }
        return
      }

      // Reset retry state on first attempt
      if (attemptNumber === 0) {
        currentLoadingTitleRef.current = normalized
        setRetryCount(0)
        setIsRetrying(false)
      }

      setLoading(true)
      setError(null)

      try {
        const result = await fetchWikipediaArticle(articleTitle)
        
        // Process HTML links - wrap in try-catch to handle processing errors gracefully
        let processed: string
        try {
          processed = processHtmlLinks(result.html)
        } catch (processError) {
          // If HTML processing fails, use the original HTML
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ArticleViewer] HTML processing failed, using original HTML:', processError)
          }
          processed = result.html
        }
        
        // Extract ToC immediately during HTML processing (not in separate useEffect)
        // Check cache first to avoid re-extraction
        const normalizedTitle = normalizeTitle(articleTitle)
        let extractedToc: ToCItem[] = []
        
        const cachedToc = tocCacheRef.current.get(normalizedTitle)
        if (cachedToc) {
          extractedToc = cachedToc
        } else {
          // Extract from raw HTML (before sanitization) for better accuracy
          // The sanitized HTML may not include the ToC container
          // Use rawHtml if available, otherwise fall back to sanitized HTML
          // Wrap in try-catch to ensure ToC extraction failures don't prevent article loading
          try {
            const htmlForExtraction = result.rawHtml || result.html
            // Pass article title for better logging in development mode
            extractedToc = extractTableOfContents(htmlForExtraction, articleTitle)
            // Cache the result
            tocCacheRef.current.set(normalizedTitle, extractedToc)
          } catch (tocError) {
            // ToC extraction failed, but article should still load
            if (process.env.NODE_ENV === 'development') {
              console.warn('[ArticleViewer] ToC extraction failed, but continuing with article load:', tocError)
            }
            // extractedToc remains empty array, which is fine
            // Don't cache empty result in case it's a transient error
          }
        }
        
        // Verify we're still loading the same article (prevent race conditions)
        const currentArticle = normalizeTitle(articleTitle)
        if (currentLoadingTitleRef.current !== currentArticle && currentLoadingTitleRef.current !== null) {
          // Article changed during load - don't set stale content/ToC
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ArticleViewer] Article changed during load, discarding stale content')
          }
          setLoading(false)
          if (currentLoadingTitleRef.current === normalized) {
            currentLoadingTitleRef.current = null
          }
          return
        }
        
        // Filter out any article links that might have slipped through extraction
        // Only keep items that look like section IDs (no slashes, no URLs)
        const filteredToc = extractedToc.filter(item => {
          // Section IDs should not contain slashes, colons, or look like URLs
          const isValidSectionId = item.id && 
            !item.id.includes('/') && 
            !item.id.includes(':') && 
            !item.id.includes('://') &&
            !item.id.startsWith('./') &&
            !item.id.startsWith('../')
          return isValidSectionId
        })
        
        // Set both content and ToC in the same render cycle
        // React 18+ automatically batches these state updates in async functions,
        // so both updates will be processed together without causing multiple re-renders
        setContent(processed)
        setTocItems(filteredToc)
        
        // Update cache with filtered ToC
        if (filteredToc.length !== extractedToc.length) {
          tocCacheRef.current.set(normalizedTitle, filteredToc)
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[ToC] Filtered ${extractedToc.length - filteredToc.length} article links from ToC`)
          }
        }
        
        failureReportedRef.current.delete(articleTitle)
        previousArticleTitleRef.current = normalized
        // Reset retry state on successful load
        setRetryCount(0)
        setIsRetrying(false)
        setLoading(false)
        // Reset reload key after successful reload
        if (reloadKey > 0) {
          setReloadKey(0)
        }
        if (currentLoadingTitleRef.current === normalized) {
          currentLoadingTitleRef.current = null
        }
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? `${err.message}${err.stack ? `\n${err.stack}` : ''}` 
          : `Failed to load article: ${String(err)}`
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`[ArticleViewer] Failed to load article "${articleTitle}" (attempt ${attemptNumber + 1}/${MAX_RETRIES + 1}):`, err)
        }
        
        // Check if we should retry
        if (attemptNumber < MAX_RETRIES) {
          const delay = RETRY_DELAYS[attemptNumber] ?? 2000
          setIsRetrying(true)
          setRetryCount(attemptNumber + 1)
          
          // Keep loading state true during retry delay
          // Schedule retry - loading will be set to true again when retry executes
          // Note: The cleanup function will cancel this timeout if article changes
          retryTimeoutRef.current = window.setTimeout(() => {
            // Verify article hasn't changed before executing retry
            const currentNormalized = normalizeTitle(articleTitle)
            if (currentNormalized === normalized) {
              loadArticle(attemptNumber + 1)
            } else {
              // Article changed - cancel retry
              setRetryCount(0)
              setIsRetrying(false)
              setLoading(false)
              if (currentLoadingTitleRef.current === normalized) {
                currentLoadingTitleRef.current = null
              }
            }
          }, delay)
        } else {
          // All retries failed - show error
          setError(errorMessage)
          setContent('')
          setIsRetrying(false)
          setLoading(false)
          if (currentLoadingTitleRef.current === normalized) {
            currentLoadingTitleRef.current = null
          }
          
          if (onArticleLoadFailure && !failureReportedRef.current.has(articleTitle)) {
            failureReportedRef.current.add(articleTitle)
            onArticleLoadFailure(articleTitle)
          }
        }
      }
    }

    loadArticle()

    // Cleanup retry timeout on unmount or article change
    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [articleTitle, onArticleLoadFailure, reloadKey])

  // Restore scroll position and focus when content changes (but only if article hasn't changed)
  useEffect(() => {
    if (!contentRef.current || !content || loading || !articleTitle) return

    const normalized = normalizeTitle(articleTitle)
    const articleUnchanged = previousArticleTitleRef.current === normalized

    // Only restore scroll position if the article hasn't changed
    // (i.e., this is just a re-render from timer update)
    if (articleUnchanged && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = scrollPositionRef.current

          // Restore focus if it was within the article content
          if (activeElementRef.current && contentRef.current.contains(activeElementRef.current)) {
            ;(activeElementRef.current as HTMLElement).focus()
          }
        }
      })
    }
  }, [content, loading, articleTitle])

  // Save scroll position on scroll events
  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  /**
   * Handles click events on article links.
   * Provides immediate visual feedback before async navigation begins.
   * Prevents multiple clicks during navigation to avoid double-loads.
   * Prevents image clicks from triggering navigation.
   * Debounces rapid clicks to prevent race conditions.
   * 
   * Uses refs to access latest values without causing re-renders.
   * Sets navigation state synchronously for instant user feedback.
   */
  const handleClick = useCallback((e: MouseEvent) => {
    // Prevent clicks if game is won or navigation is in progress
    if (gameWonRef.current || isNavigatingRef.current) {
      // Still prevent default navigation even if we're ignoring the click
      const link = (e.target as HTMLElement).closest('a')
      if (link) {
        e.preventDefault()
        e.stopPropagation()
      }
      return
    }

    const target = e.target as HTMLElement
    const link = target.closest('a')
    
    // CRITICAL: Prevent default navigation IMMEDIATELY for any link click
    // This must happen before any conditional checks to prevent browser navigation
    if (link) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Debounce check: ignore clicks within DEBOUNCE_DELAY of previous click
    const now = Date.now()
    if (now - lastClickTimeRef.current < DEBOUNCE_DELAY) {
      // Still provide visual feedback even if debounced
      if (link) {
        link.classList.add('bp-link-clicked')
        // Remove visual feedback after a short delay
        setTimeout(() => {
          link.classList.remove('bp-link-clicked')
        }, 200)
      }
      return
    }
    lastClickTimeRef.current = now
    
    // Detect image clicks and prevent navigation
    // Check if click target is an image or inside an image container
    if (
      target.tagName === 'IMG' ||
      target.tagName === 'SVG' ||
      target.closest('img') !== null ||
      target.closest('svg') !== null ||
      target.closest('picture') !== null
    ) {
      // Image click detected - prevent navigation but allow default image behavior
      // (preventDefault already called above)
      return
    }

    if (!link) return

    const href = link.getAttribute('href')
    if (!href || !isNavigableWikiLink(href)) {
      // Not a navigable link - preventDefault already called above, just return
      return
    }

    // Extract article title from various URL formats
    let title: string | null = null

    try {
      // Handle full URLs (https://en.wikipedia.org/wiki/Article_Title)
      if (href.includes('://') && href.includes('/wiki/')) {
        const url = new URL(href)
        if (url.pathname.startsWith('/wiki/')) {
          title = url.pathname.slice(6) // Remove '/wiki/'
        }
      }
      // Handle relative URLs with /wiki/ prefix
      else if (href.includes('/wiki/')) {
        const match = href.match(/\/wiki\/([^#?]+)/)
        if (match) {
          title = match[1]
        }
      }
      // Handle relative paths (./Article_Title or ../Article_Title)
      else if (href.startsWith('./') || href.startsWith('../')) {
        title = href.replace(/^\.\.?\//, '').split('#')[0].split('?')[0]
      }
      // Handle absolute paths (/wiki/Article_Title)
      else if (href.startsWith('/wiki/')) {
        title = href.slice(6).split('#')[0].split('?')[0] // Remove '/wiki/' and fragments/query params
      }
      // Handle bare article titles (Article_Title)
      else if (!href.includes('://') && !href.startsWith('#')) {
        title = href.split('#')[0].split('?')[0]
      }

      // Decode and normalize the title
      if (title) {
        // Decode URL encoding (e.g., %20 -> space, %27 -> ')
        title = decodeURIComponent(title)
        // Replace underscores with spaces for display/navigation
        title = title.replace(/_/g, ' ')
        // Trim whitespace
        title = title.trim()

        if (title) {
          // IMMEDIATE FEEDBACK: Set loading state synchronously before async navigation
          setIsNavigating(true)
          setClickedLinkTitle(title)
          
          // Add visual feedback class to clicked link
          link.classList.add('bp-link-clicked')
          
          // Trigger navigation (this will call registerNavigation which sets articleLoading)
          onArticleClickRef.current(title)
        }
      }
    } catch (error) {
      // If URL parsing fails, log and skip
      console.warn('Failed to parse article link:', href, error)
    }
  }, []) // Empty deps - uses refs for latest values

  useEffect(() => {
    if (!contentRef.current || !content) return

    const container = contentRef.current
    // Use capture phase to catch clicks earlier and prevent default navigation immediately
    container.addEventListener('click', handleClick, true)
    return () => {
      container.removeEventListener('click', handleClick, true)
    }
  }, [content, handleClick])

  if (!articleTitle) {
    return (
      <div className="bp-article-viewer">
        <div className="bp-article-empty">
          <p>No article selected</p>
        </div>
      </div>
    )
  }

  const displayTitle = articleTitle.replace(/_/g, ' ')

  /**
   * Handles clicking the "View on Wikipedia" button.
   * Shows a confirmation modal before opening Wikipedia.
   */
  const handleViewOnWikipedia = () => {
    setShowConfirmModal(true)
  }

  /**
   * Confirms opening Wikipedia in a new tab.
   * Formats the article title for Wikipedia URL and opens it.
   */
  const confirmViewOnWikipedia = () => {
    if (!articleTitle) return
    
    // Use centralized URL builder for consistent formatting
    const wikipediaUrl = buildWikipediaUrl(articleTitle)
    
    // Open in new tab with security attributes
    window.open(wikipediaUrl, '_blank', 'noopener,noreferrer')
    setShowConfirmModal(false)
  }

  /**
   * Closes the confirmation modal without opening Wikipedia.
   */
  const cancelViewOnWikipedia = () => {
    setShowConfirmModal(false)
  }

  /**
   * Handles clicking the Table of Contents button.
   * Opens modal immediately, shows loading state if ToC not yet extracted.
   * Prevents opening during article loading to avoid race conditions.
   */
  const handleTocToggle = useCallback(() => {
    // Don't allow opening ToC while loading - prevents showing stale/wrong items
    if (loading || !content) {
      return
    }
    setShowToc((prev) => !prev)
    // Modal opens immediately - if tocItems is empty, loading state will be shown
  }, [loading, content])

  /**
   * Handles reloading the article from scratch.
   * Clears cache and forces a fresh load.
   */
  const handleReload = useCallback(() => {
    if (!articleTitle) return
    
    // Clear cache for this article
    const normalized = normalizeTitle(articleTitle)
    tocCacheRef.current.delete(normalized)
    
    // Clear current loading state
    currentLoadingTitleRef.current = null
    
    // Clear any pending retry timeout
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    // Clear content and error state to force reload
    setContent('')
    setError(null)
    setTocItems([])
    
    // Reset previous article title ref so useEffect treats it as a new article
    previousArticleTitleRef.current = null
    
    // Increment reload key to trigger useEffect reload
    setReloadKey((prev) => prev + 1)
  }, [articleTitle])

  /**
   * Normalizes a section ID for matching (same logic as in extractTableOfContents).
   * Handles URL encoding, normalizes separators, and converts to lowercase.
   * @param id - The section ID to normalize
   * @returns Normalized ID
   */
  const normalizeSectionIdForMatching = useCallback((id: string): string => {
    if (!id) return ''
    
    // Decode URL encoding (e.g., %20 → space, %27 → apostrophe)
    let normalized = decodeURIComponent(id)
    
    // Normalize separators: convert underscores and spaces to hyphens
    normalized = normalized.replace(/[_\s]+/g, '-')
    
    // Convert to lowercase for consistent matching
    normalized = normalized.toLowerCase()
    
    // Remove leading/trailing hyphens
    normalized = normalized.replace(/^-+|-+$/g, '')
    
    return normalized
  }, [])

  /**
   * Handles clicking a ToC entry.
   * Scrolls to the section with robust ID matching (handles URL encoding, case-insensitive,
   * multiple ID formats) and closes the ToC overlay.
   * 
   * **Matching Strategy**:
   * 1. Try multiple ID format variants (original, decoded, normalized)
   * 2. Try matching against both `id` and `name` attributes
   * 3. Try case-insensitive matching against all elements with IDs
   * 4. Fallback: Find heading with matching text content (case-insensitive)
   * 
   * **ID Variant Generation**:
   * - Original ID (already normalized from extraction)
   * - URL-decoded ID (decodeURIComponent)
   * - Lowercase version
   * - Hyphen-normalized (replace `_` with `-`)
   * - Underscore-normalized (replace `-` with `_`)
   * 
   * **Scroll Target Detection**:
   * - Prefer section heading elements (h1-h6) with matching ID
   * - Fallback to any element with matching ID
   * - Final fallback: Find heading with matching text content
   */
  const handleTocNavigate = useCallback((sectionId: string) => {
    if (!contentRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ToC] contentRef.current is null')
      }
      return
    }
    
    // Don't navigate if still loading or no content
    if (loading || !content) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ToC] Cannot navigate - still loading or no content')
      }
      return
    }
    
    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ToC] Navigating to section: "${sectionId}"`)
    }
    
    // Generate ID variants to try (multiple formats for robust matching)
    // sectionId is now the original ID from the href, so try it first
    const idVariants = [
      sectionId, // Original ID from href (should match HTML)
      decodeURIComponent(sectionId), // URL-decoded version
      sectionId.toLowerCase(), // Lowercase version
      sectionId.replace(/_/g, '-'), // Hyphen-normalized
      sectionId.replace(/-/g, '_'), // Underscore-normalized
      // Also try normalized versions
      normalizeSectionIdForMatching(sectionId), // Fully normalized
    ]
    
    // Remove duplicates and empty strings
    const uniqueVariants = Array.from(new Set(idVariants.filter(id => id && id.trim())))
    
    let element: Element | null = null
    let matchedVariant: string | null = null
    
    // Strategy 1: Try direct match first (fastest path)
    // First try getElementById on the document (most reliable)
    try {
      const docElement = document.getElementById(sectionId)
      if (docElement && contentRef.current.contains(docElement)) {
        element = docElement
        matchedVariant = sectionId
      }
    } catch (e) {
      // Continue to next strategy
    }
    
    // Strategy 1b: Try querySelector in content container
    if (!element) {
      try {
        const escapedId = CSS.escape(sectionId)
        element = contentRef.current.querySelector(`#${escapedId}`)
        if (element) {
          matchedVariant = sectionId
        }
      } catch (e) {
        // CSS.escape might fail, continue to next strategy
      }
    }
    
    // Strategy 2: Try each variant with CSS.escape for safety
    // Prefer section headings (h1-h6) first, then span anchors, then any element
    if (!element) {
      for (const id of uniqueVariants) {
        try {
          // Try document.getElementById first (most reliable)
          const docElement = document.getElementById(id)
          if (docElement && contentRef.current.contains(docElement)) {
            element = docElement
            matchedVariant = id
            break
          }
          
          const escapedId = CSS.escape(id)
          
          // Try to find section heading first (preferred target)
          element = contentRef.current.querySelector(`h1#${escapedId}, h2#${escapedId}, h3#${escapedId}, h4#${escapedId}, h5#${escapedId}, h6#${escapedId}`)
          if (element) {
            matchedVariant = id
            break
          }
          
          // Try span elements (Wikipedia often uses span anchors)
          element = contentRef.current.querySelector(`span#${escapedId}`)
          if (element) {
            matchedVariant = id
            break
          }
          
          // Try id attribute on any element
          element = contentRef.current.querySelector(`#${escapedId}`)
          if (element) {
            matchedVariant = id
            break
          }
          
          // Try name attribute (escape quotes in attribute selector)
          const safeName = id.replace(/"/g, '\\"')
          element = contentRef.current.querySelector(`[name="${safeName}"]`)
          if (element) {
            matchedVariant = id
            break
          }
        } catch (e) {
          // CSS.escape might fail for invalid IDs, continue to next variant
          continue
        }
      }
    }
    
    // Strategy 3: Case-insensitive matching against all elements with IDs
    if (!element) {
      const allElements = contentRef.current.querySelectorAll('[id], [name]')
      const normalizedSectionId = normalizeSectionIdForMatching(sectionId)
      
      for (const el of Array.from(allElements)) {
        const elId = el.getAttribute('id') || el.getAttribute('name') || ''
        const normalizedElId = normalizeSectionIdForMatching(elId)
        
        if (normalizedElId === normalizedSectionId) {
          // Prefer heading elements if multiple matches
          if (el.tagName.match(/^H[1-6]$/i)) {
            element = el
            matchedVariant = elId
            break
          } else if (!element) {
            // Store first match as fallback
            element = el
            matchedVariant = elId
          }
        }
      }
    }
    
    // Strategy 4: Fallback - Find heading with matching text content (case-insensitive)
    // This matches the sectionId (which might be a heading text) with actual heading text
    if (!element) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const normalizedSectionId = normalizeSectionIdForMatching(sectionId)
      
      for (const heading of Array.from(headings)) {
        const headingText = heading.textContent?.trim() || ''
        const normalizedHeadingText = normalizeSectionIdForMatching(headingText)
        
        if (normalizedHeadingText === normalizedSectionId) {
          element = heading
          matchedVariant = headingText
          break
        }
      }
    }
    
    // Strategy 5: Match by ToC item text if we have tocItems available
    // This is a last resort - find the ToC item and match its text with headings
    if (!element && tocItems.length > 0) {
      const tocItem = tocItems.find(item => item.id === sectionId)
      if (tocItem) {
        const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
        const normalizedItemText = normalizeSectionIdForMatching(tocItem.text)
        
        for (const heading of Array.from(headings)) {
          const headingText = heading.textContent?.trim() || ''
          const normalizedHeadingText = normalizeSectionIdForMatching(headingText)
          
          if (normalizedHeadingText === normalizedItemText) {
            element = heading
            matchedVariant = headingText
            break
          }
        }
      }
    }
    
    if (element) {
      const elementId = element.id || element.getAttribute('name') || ''
      const elementTag = element.tagName
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ToC] Found section element: ${elementId} (tag: ${elementTag}, matched variant: ${matchedVariant})`)
      }
      
      // Store the matched ID for re-finding after modal closes
      const targetId = matchedVariant || sectionId
      
      // Close ToC modal
      setShowToc(false)
      
      // Use setTimeout to ensure modal closes first, then scroll
      setTimeout(() => {
        if (!contentRef.current) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ToC] contentRef.current is null after modal close')
          }
          return
        }
        
        // Re-find the element by ID (more reliable than keeping reference)
        let scrollTarget: Element | null = null
        
        // Try to find by the matched variant ID first
        if (targetId) {
          try {
            scrollTarget = document.getElementById(targetId)
            if (scrollTarget && contentRef.current.contains(scrollTarget)) {
              // Found it!
            } else {
              scrollTarget = null
            }
          } catch (e) {
            // Continue to other methods
          }
        }
        
        // If not found, try querySelector in container
        if (!scrollTarget && targetId) {
          try {
            const escapedId = CSS.escape(targetId)
            scrollTarget = contentRef.current.querySelector(`#${escapedId}`)
          } catch (e) {
            // Continue
          }
        }
        
        // If still not found, try finding by tag + ID
        if (!scrollTarget && elementTag && targetId) {
          try {
            const escapedId = CSS.escape(targetId)
            scrollTarget = contentRef.current.querySelector(`${elementTag.toLowerCase()}#${escapedId}`)
          } catch (e) {
            // Continue
          }
        }
        
        // Last resort: try all the strategies again
        if (!scrollTarget) {
          const allElements = contentRef.current.querySelectorAll('[id]')
          for (const el of Array.from(allElements)) {
            const elId = el.id || ''
            if (elId === targetId || normalizeSectionIdForMatching(elId) === normalizeSectionIdForMatching(targetId)) {
              scrollTarget = el
              break
            }
          }
        }
        
        if (!scrollTarget) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[ToC] Could not re-find element with ID: ${targetId}`)
          }
          return
        }
        
        const scrollContainer = contentRef.current
        
        // Try scrolling - use multiple methods for reliability
        let scrollSucceeded = false
        
        // Method 1: Calculate and scroll to position
        try {
          const elementRect = scrollTarget.getBoundingClientRect()
          const containerRect = scrollContainer.getBoundingClientRect()
          const offset = 20 // Offset from top
          const targetScrollTop = scrollContainer.scrollTop + elementRect.top - containerRect.top - offset
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ToC] Attempting scroll to position: ${targetScrollTop}`)
            console.log(`[ToC] Element rect:`, elementRect)
            console.log(`[ToC] Container rect:`, containerRect)
            console.log(`[ToC] Current scrollTop:`, scrollContainer.scrollTop)
          }
          
          scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
          })
          scrollSucceeded = true
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ToC] Scroll command executed successfully`)
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ToC] scrollTo failed:', error)
          }
        }
        
        // Method 2: Fallback to scrollIntoView if scrollTo didn't work
        if (!scrollSucceeded) {
          try {
            if (process.env.NODE_ENV === 'development') {
              console.log('[ToC] Trying scrollIntoView fallback')
            }
            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
            scrollSucceeded = true
          } catch (fallbackError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[ToC] scrollIntoView failed:', fallbackError)
            }
          }
        }
        
        // Method 3: Last resort - instant scroll
        if (!scrollSucceeded) {
          try {
            if (process.env.NODE_ENV === 'development') {
              console.log('[ToC] Trying instant scroll fallback')
            }
            const elementRect = scrollTarget.getBoundingClientRect()
            const containerRect = scrollContainer.getBoundingClientRect()
            scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop + elementRect.top - containerRect.top - 20)
            scrollSucceeded = true
          } catch (instantError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[ToC] All scroll methods failed:', instantError)
            }
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[ToC] Scroll attempt completed. Success: ${scrollSucceeded}`)
        }
      }, 100) // Small delay to ensure modal closes
    } else {
      // Log warning and debug info (development only)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ToC] Section not found: "${sectionId}"`)
        
        // Log available IDs for debugging
        const allIds = Array.from(contentRef.current.querySelectorAll('[id]'))
          .map(el => ({ id: el.id, tag: el.tagName, text: el.textContent?.trim().substring(0, 50) }))
          .filter(item => item.id)
        console.log(`[ToC] Available section IDs (${allIds.length}):`, allIds.slice(0, 10))
        
        // Log headings for debugging
        const headings = Array.from(contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => ({ id: h.id, tag: h.tagName, text: h.textContent?.trim().substring(0, 50) }))
        console.log(`[ToC] Available headings (${headings.length}):`, headings.slice(0, 10))
        
        // Log ToC items for comparison
        console.log(`[ToC] ToC items:`, tocItems.map(item => ({ id: item.id, text: item.text })).slice(0, 10))
      }
    }
  }, [normalizeSectionIdForMatching, tocItems, loading, content])

  // Handle Escape key to close modals and focus management for ToC modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          cancelViewOnWikipedia()
        } else if (showToc) {
          setShowToc(false)
        }
      }
    }

    if (showConfirmModal || showToc) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [showConfirmModal, showToc])

  // Focus management for ToC modal
  useEffect(() => {
    if (!showToc) {
      // Restore focus when modal closes
      if (previouslyFocusedElementRef.current instanceof HTMLElement) {
        previouslyFocusedElementRef.current.focus()
        previouslyFocusedElementRef.current = null
      }
      return
    }

    // Save currently focused element when modal opens
    previouslyFocusedElementRef.current = document.activeElement

    const modal = tocModalRef.current
    if (!modal) return

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const getFocusableElements = () =>
      Array.from(modal.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
      )

    const focusFirstElement = () => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        modal.focus()
      }
    }

    // Move initial focus into the modal
    focusFirstElement()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusable = getFocusableElements()
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }

        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)
        let nextIndex = currentIndex

        if (e.shiftKey) {
          // Shift + Tab: backwards
          nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
        } else {
          // Tab: forwards
          nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1
        }

        e.preventDefault()
        focusable[nextIndex].focus()
      }
    }

    modal.addEventListener('keydown', handleKeyDown)

    return () => {
      modal.removeEventListener('keydown', handleKeyDown)
    }
  }, [showToc])

  return (
    <div className="bp-article-viewer">
      <div className="bp-article-header">
        <button
          type="button"
          className="bp-toc-toggle-button"
          onClick={handleTocToggle}
          disabled={loading || !content}
          aria-label="Open Table of Contents"
          title={loading || !content ? "Table of Contents (loading...)" : "Table of Contents"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span>Table of Contents</span>
        </button>
        <h2 className="bp-article-title">{displayTitle}</h2>
        {articleTitle && (
          <button
            type="button"
            className="bp-view-wikipedia-link"
            onClick={handleViewOnWikipedia}
            aria-label="View this article on Wikipedia"
            title="View on Wikipedia"
          >
            View on Wiki
          </button>
        )}
      </div>
      <div className="bp-article-layout">
        {/* Desktop: Inline Table of Contents */}
        {showToc && !loading && content && (
          <div className="bp-toc-inline" onClick={(e) => e.stopPropagation()}>
            <div className="bp-toc-inline-header">
              <h3>Table of Contents</h3>
            </div>
            <TableOfContents items={tocItems} onNavigate={handleTocNavigate} hideHeader={true} />
          </div>
        )}
        <div 
          className="bp-article-content" 
          ref={contentRef}
          onClick={() => showToc && setShowToc(false)}
        >
          {loading && (
            <div className="bp-article-loading">
              <div className="bp-spinner"></div>
              <p>
                {isRetrying 
                  ? `Loading article... (Retry ${retryCount}/${MAX_RETRIES})`
                  : 'Loading article...'}
              </p>
              {isPausedForLoading && (
                <p className="bp-timer-paused-contextual">
                  Timer paused while loading article
                </p>
              )}
            </div>
          )}
          {error && (
            <div className="bp-article-error">
              <p>Failed to load article: {error}</p>
            </div>
          )}
          {!loading && !error && content && (
            <div className="bp-article-body" dangerouslySetInnerHTML={{ __html: content }} />
          )}
          {/* Reload button at the bottom of article content */}
          <div className="bp-article-reload-container">
            <button
              type="button"
              className="bp-article-reload-button"
              onClick={handleReload}
              disabled={!articleTitle || loading}
              aria-label="Reload article"
              title="Reload article from scratch"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <span>Reload Article</span>
            </button>
          </div>
        </div>
      </div>
      {showConfirmModal && (
        <div className="bp-modal-overlay" onClick={cancelViewOnWikipedia}>
          <div className="bp-modal-content bp-confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bp-modal-header">
              <h3 className="bp-modal-title">Leave Game?</h3>
              <button className="bp-modal-close" onClick={cancelViewOnWikipedia} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="bp-modal-body">
              <p>Are you sure? Leaving may clear your game progress.</p>
              <div className="bp-modal-actions">
                <button
                  type="button"
                  className="bp-button bp-button-secondary"
                  onClick={cancelViewOnWikipedia}
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bp-button bp-button-primary"
                  onClick={confirmViewOnWikipedia}
                  aria-label="Continue to Wikipedia"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Table of Contents Modal/Overlay - Mobile only */}
      {showToc && (
        <div 
          className="bp-modal-overlay bp-toc-overlay bp-toc-overlay-mobile" 
          onClick={() => setShowToc(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="toc-modal-title"
        >
          <div 
            ref={tocModalRef}
            className="bp-modal-content bp-toc-modal-content" 
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <div className="bp-modal-header">
              <h3 id="toc-modal-title" className="bp-modal-title">Table of Contents</h3>
            </div>
            <div className="bp-modal-body bp-toc-modal-body">
              {loading ? (
                <div className="bp-article-loading" role="status" aria-live="polite">
                  <div className="bp-spinner" aria-hidden="true"></div>
                  <p>Loading table of contents...</p>
                </div>
              ) : (
                <TableOfContents items={tocItems} onNavigate={handleTocNavigate} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders when parent updates (e.g., timer ticks)
// Only re-renders when props actually change
// Custom comparison function ensures we only re-render when props actually change
// This prevents re-renders every second when timer ticks (which causes link flashing)
export const ArticleViewer = memo(ArticleViewerComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.articleTitle === nextProps.articleTitle &&
    prevProps.gameWon === nextProps.gameWon &&
    prevProps.isPausedForLoading === nextProps.isPausedForLoading &&
    prevProps.onArticleClick === nextProps.onArticleClick &&
    prevProps.onArticleLoadFailure === nextProps.onArticleLoadFailure &&
    prevProps.onLoadingChange === nextProps.onLoadingChange
  )
})

