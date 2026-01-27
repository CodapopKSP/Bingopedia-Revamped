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
    // Navigational links keep their href and link semantics
  })

  return tempDiv.innerHTML
}

/**
 * Extracts the table of contents structure from Wikipedia article HTML.
 * 
 * Handles both desktop and mobile Wikipedia HTML structures:
 * - Desktop: `<div id="toc" class="toc">` with nested `<ul>` and `<li>` elements
 * - Mobile: Similar structure but may be in different location
 * - Each item has `<a href="#section-name">` and text content
 * - Nested `<ul>` for subsections
 * 
 * @param html - The HTML string from Wikipedia article
 * @returns Array of ToC items, or empty array if no ToC found
 * 
 * @example
 * ```typescript
 * const tocItems = extractTableOfContents(articleHtml)
 * // Returns: [{ id: 'History', text: 'History', level: 1, children: [...] }]
 * ```
 */
export function extractTableOfContents(html: string): ToCItem[] {
  if (!html) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Find ToC container (desktop or mobile)
  // Desktop: <div id="toc" class="toc">
  // Mobile: May be in different location, try multiple selectors
  const tocContainer = 
    doc.getElementById('toc') || 
    doc.querySelector('.toc') ||
    doc.querySelector('[role="navigation"]') ||
    doc.querySelector('nav.toc')
  
  if (!tocContainer) {
    return []
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
    
    listItems.forEach((li) => {
      const link = li.querySelector('a')
      if (!link) return
      
      const href = link.getAttribute('href')
      const text = link.textContent?.trim() || ''
      // Extract section ID from href (e.g., "#History" -> "History")
      const id = href ? href.replace(/^#/, '') : ''
      
      if (!id || !text) return
      
      const item: ToCItem = {
        id,
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
    
    return items
  }
  
  // Find the main list within the ToC container
  const mainList = tocContainer.querySelector('ul')
  if (!mainList || !(mainList instanceof HTMLUListElement)) {
    return []
  }
  
  return extractItems(mainList)
}

/**
 * Component that displays Wikipedia article content with interactive links.
 * 
 * Fetches, sanitizes, and displays Wikipedia articles. Intercepts link clicks to navigate
 * within the game instead of following external links. Handles loading states and errors.
 * 
 * Memoized to prevent unnecessary re-renders when parent components update (e.g., timer ticks).
 * Uses stable refs for event handlers to prevent re-attaching listeners.
 * 
 * @param props - Component props
 * @param props.articleTitle - The Wikipedia article title to display
 * @param props.onArticleClick - Callback when a Wikipedia link is clicked, receives the article title
 * @param props.onArticleLoadFailure - Callback when article fails to load, receives the failed title
 * @param props.onLoadingChange - Callback to notify parent of loading state changes
 * @param props.gameWon - Whether the game has been won (disables link clicking)
 */
function ArticleViewerComponent({
  articleTitle,
  onArticleClick,
  onArticleLoadFailure,
  onLoadingChange,
  gameWon,
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
  // Retry state management
  /** Current retry attempt number (0 = first attempt, 1+ = retries) */
  const [retryCount, setRetryCount] = useState(0)
  /** Whether we're currently in a retry attempt (not the initial load) */
  const [isRetrying, setIsRetrying] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const failureReportedRef = useRef(new Set<string>())
  const currentLoadingTitleRef = useRef<string | null>(null)
  const onLoadingChangeRef = useRef(onLoadingChange)
  const prevLoadingRef = useRef(loading)
  // Scroll position preservation
  const scrollPositionRef = useRef<number>(0)
  const previousArticleTitleRef = useRef<string | null>(null)
  const activeElementRef = useRef<Element | null>(null)
  // Stable refs for click handler to prevent re-attaching event listeners
  const onArticleClickRef = useRef(onArticleClick)
  const gameWonRef = useRef(gameWon)
  const isNavigatingRef = useRef(isNavigating)
  // Retry timeout management
  /** Reference to the retry timeout ID for cleanup */
  const retryTimeoutRef = useRef<number | null>(null)

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

  // Extract table of contents when content loads
  useEffect(() => {
    if (content && !loading) {
      const extracted = extractTableOfContents(content)
      setTocItems(extracted)
    } else {
      setTocItems([])
    }
  }, [content, loading])

  useEffect(() => {
    if (!articleTitle) {
      setContent('')
      setError(null)
      setLoading(false)
      setIsNavigating(false)
      setClickedLinkTitle(null)
      setRetryCount(0)
      setIsRetrying(false)
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
      if (currentLoadingTitleRef.current === normalized && attemptNumber === 0) {
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
        const processed = processHtmlLinks(result.html)
        setContent(processed)
        failureReportedRef.current.delete(articleTitle)
        previousArticleTitleRef.current = normalized
        // Reset retry state on successful load
        setRetryCount(0)
        setIsRetrying(false)
        setLoading(false)
        if (currentLoadingTitleRef.current === normalized) {
          currentLoadingTitleRef.current = null
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load article'
        
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
  }, [articleTitle, onArticleLoadFailure])

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
   * 
   * Uses refs to access latest values without causing re-renders.
   * Sets navigation state synchronously for instant user feedback.
   */
  const handleClick = useCallback((e: MouseEvent) => {
    // Prevent clicks if game is won or navigation is in progress
    if (gameWonRef.current || isNavigatingRef.current) return

    const target = e.target as HTMLElement
    const link = target.closest('a')
    if (!link) return

    const href = link.getAttribute('href')
    if (!href || !isNavigableWikiLink(href)) return

    e.preventDefault()
    e.stopPropagation()

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
    container.addEventListener('click', handleClick)
    return () => {
      container.removeEventListener('click', handleClick)
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
   * Toggles the ToC overlay visibility.
   */
  const handleTocToggle = () => {
    setShowToc(!showToc)
  }

  /**
   * Handles clicking a ToC entry.
   * Scrolls to the section and closes the ToC overlay.
   */
  const handleTocNavigate = useCallback((sectionId: string) => {
    // Scroll to the section within the article content
    if (contentRef.current) {
      const element = contentRef.current.querySelector(`#${sectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Close ToC after scrolling
        setShowToc(false)
      }
    }
  }, [])

  // Handle Escape key to close modals
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

  return (
    <div className="bp-article-viewer">
      <div className="bp-article-header">
        <h2 className="bp-article-title">{displayTitle}</h2>
        <div className="bp-article-header-actions">
          {tocItems.length > 0 && (
            <button
              type="button"
              className="bp-toc-toggle-button"
              onClick={handleTocToggle}
              aria-label="Toggle table of contents"
              title="Table of Contents"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>Contents</span>
            </button>
          )}
          {articleTitle && (
            <button
              type="button"
              className="bp-view-wikipedia-button"
              onClick={handleViewOnWikipedia}
              aria-label="View this article on Wikipedia"
              title="View on Wikipedia"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              View on Wikipedia
            </button>
          )}
        </div>
      </div>
      <div className="bp-article-layout">
        <div className="bp-article-content" ref={contentRef}>
          {loading && (
            <div className="bp-article-loading">
              <div className="bp-spinner"></div>
              <p>
                {isRetrying 
                  ? `Loading article... (Retry ${retryCount}/${MAX_RETRIES})`
                  : 'Loading article...'}
              </p>
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
      {/* Table of Contents Modal/Overlay */}
      {showToc && tocItems.length > 0 && (
        <div className="bp-modal-overlay bp-toc-overlay" onClick={() => setShowToc(false)}>
          <div className="bp-modal-content bp-toc-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bp-modal-header">
              <h3 className="bp-modal-title">Table of Contents</h3>
              <button className="bp-modal-close" onClick={() => setShowToc(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="bp-modal-body bp-toc-modal-body">
              <TableOfContents items={tocItems} onNavigate={handleTocNavigate} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders when parent updates (e.g., timer ticks)
// Only re-renders when props actually change
export const ArticleViewer = memo(ArticleViewerComponent)

