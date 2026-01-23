import { useEffect, useRef, useState } from 'react'
import { fetchWikipediaArticle } from '../../shared/wiki/wikipediaClient'
import { normalizeTitle } from '../../shared/wiki/normalizeTitle'
import './ArticleViewer.css'

interface ArticleViewerProps {
  articleTitle: string | null
  onArticleClick: (title: string) => void
  onArticleLoadFailure?: (title: string) => void
  onLoadingChange?: (loading: boolean) => void
  gameWon: boolean
}

function isClickableWikiLink(href: string | null): boolean {
  if (!href) return false
  return (
    href.includes('/wiki/') ||
    href.startsWith('./') ||
    href.startsWith('../') ||
    (href.startsWith('/') && !href.includes('://') && !href.startsWith('//'))
  )
}

function processHtmlLinks(htmlString: string): string {
  if (!htmlString) return htmlString

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlString

  const links = tempDiv.querySelectorAll('a')

  links.forEach((link) => {
    const href = link.getAttribute('href')
    const isCitationLink = href && (href.startsWith('#cite') || href.startsWith('#ref') || href.includes('cite_note') || href.includes('cite-ref'))

    if (isCitationLink) {
      link.classList.add('citation-link')
      link.setAttribute('href', '#')
      link.setAttribute('title', 'Citation reference')
    } else if (!isClickableWikiLink(href)) {
      link.classList.add('non-clickable-link')
      link.setAttribute('href', '#')
      link.setAttribute('title', 'This link is not available in the game')
    }
  })

  return tempDiv.innerHTML
}

/**
 * Component that displays Wikipedia article content with interactive links.
 * 
 * Fetches, sanitizes, and displays Wikipedia articles. Intercepts link clicks to navigate
 * within the game instead of following external links. Handles loading states and errors.
 * 
 * @param props - Component props
 * @param props.articleTitle - The Wikipedia article title to display
 * @param props.onArticleClick - Callback when a Wikipedia link is clicked, receives the article title
 * @param props.onArticleLoadFailure - Callback when article fails to load, receives the failed title
 * @param props.onLoadingChange - Callback to notify parent of loading state changes
 * @param props.gameWon - Whether the game has been won (disables link clicking)
 */
export function ArticleViewer({
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
  const contentRef = useRef<HTMLDivElement>(null)
  const failureReportedRef = useRef(new Set<string>())
  const currentLoadingTitleRef = useRef<string | null>(null)
  const onLoadingChangeRef = useRef(onLoadingChange)
  const prevLoadingRef = useRef(loading)
  // Scroll position preservation
  const scrollPositionRef = useRef<number>(0)
  const previousArticleTitleRef = useRef<string | null>(null)
  const activeElementRef = useRef<Element | null>(null)

  // Keep ref updated without causing re-renders
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange
  }, [onLoadingChange])

  // Only call onLoadingChange when loading state actually changes
  useEffect(() => {
    if (prevLoadingRef.current !== loading) {
      prevLoadingRef.current = loading
      if (onLoadingChangeRef.current) {
        onLoadingChangeRef.current(loading)
      }
    }
  }, [loading])

  useEffect(() => {
    if (!articleTitle) {
      setContent('')
      setError(null)
      setLoading(false)
      previousArticleTitleRef.current = null
      return
    }

    const normalized = normalizeTitle(articleTitle)
    const articleChanged = previousArticleTitleRef.current !== normalized && previousArticleTitleRef.current !== null

    // Save scroll position and focus before article changes
    if (articleChanged && contentRef.current) {
      scrollPositionRef.current = contentRef.current.scrollTop
      activeElementRef.current = document.activeElement
    }

    const loadArticle = async () => {
      if (currentLoadingTitleRef.current === normalized) {
        return
      }

      currentLoadingTitleRef.current = normalized
      setLoading(true)
      setError(null)

      try {
        const result = await fetchWikipediaArticle(articleTitle)
        const processed = processHtmlLinks(result.html)
        setContent(processed)
        failureReportedRef.current.delete(articleTitle)
        previousArticleTitleRef.current = normalized
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load article'
        setError(errorMessage)
        setContent('')

        if (onArticleLoadFailure && !failureReportedRef.current.has(articleTitle)) {
          failureReportedRef.current.add(articleTitle)
          onArticleLoadFailure(articleTitle)
        }
      } finally {
        setLoading(false)
        if (currentLoadingTitleRef.current === normalized) {
          currentLoadingTitleRef.current = null
        }
      }
    }

    loadArticle()
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

  useEffect(() => {
    if (!contentRef.current || !content) return

    const handleClick = (e: MouseEvent) => {
      if (gameWon) return

      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href || !isClickableWikiLink(href)) return

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
            onArticleClick(title)
          }
        }
      } catch (error) {
        // If URL parsing fails, log and skip
        console.warn('Failed to parse article link:', href, error)
      }
    }

    const container = contentRef.current
    container.addEventListener('click', handleClick)
    return () => {
      container.removeEventListener('click', handleClick)
    }
  }, [content, gameWon, onArticleClick])

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
    
    // Format title for Wikipedia URL: replace spaces with underscores, encode special characters
    const formattedTitle = articleTitle.replace(/ /g, '_')
    const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(formattedTitle)}`
    
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

  // Handle Escape key to close modal
  useEffect(() => {
    if (!showConfirmModal) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelViewOnWikipedia()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showConfirmModal])

  return (
    <div className="bp-article-viewer">
      <div className="bp-article-header">
        <h2 className="bp-article-title">{displayTitle}</h2>
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
      <div className="bp-article-content" ref={contentRef}>
        {loading && (
          <div className="bp-article-loading">
            <div className="bp-spinner"></div>
            <p>Loading article...</p>
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
    </div>
  )
}

