import { useEffect, useRef, useState } from 'react'
import { fetchArticleSummary } from '../../shared/wiki/wikipediaClient'
import './ArticleSummaryModal.css'

interface ArticleSummaryModalProps {
  articleTitle: string | null
  onClose: () => void
  onArticleFailure?: (title: string) => void
}

/**
 * Modal component that displays a Wikipedia article summary.
 * 
 * Fetches and displays a short text summary of the article when a bingo grid cell is clicked.
 * Handles loading states, errors, and keyboard navigation (Escape to close).
 * 
 * @param props - Component props
 * @param props.articleTitle - The Wikipedia article title to display (null to hide modal)
 * @param props.onClose - Callback when the modal should be closed
 * @param props.onArticleFailure - Optional callback when article fails to load (for replacement logic)
 */
export function ArticleSummaryModal({ articleTitle, onClose, onArticleFailure }: ArticleSummaryModalProps) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const failureReportedRef = useRef(new Set<string>())

  useEffect(() => {
    if (!articleTitle) return

    const loadSummary = async () => {
      setLoading(true)
      setFailed(false)
      try {
        const text = await fetchArticleSummary(articleTitle)
        setSummary(text)
        failureReportedRef.current.delete(articleTitle)
      } catch (err) {
        setSummary('This article could not be loaded. It will be replaced with a new one.')
        setFailed(true)

        if (onArticleFailure && !failureReportedRef.current.has(articleTitle)) {
          failureReportedRef.current.add(articleTitle)
          onArticleFailure(articleTitle)
        }
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [articleTitle, onArticleFailure])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!articleTitle) return null

  const displayTitle = articleTitle.replace(/_/g, ' ')

  return (
    <div className="bp-modal-overlay" onClick={onClose}>
      <div className="bp-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bp-modal-header">
          <h3 className="bp-modal-title">{displayTitle}</h3>
          <button className="bp-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="bp-modal-body">
          {loading ? (
            <div className="bp-modal-loading">
              <div className="bp-spinner-small"></div>
              <p>Loading summary...</p>
            </div>
          ) : (
            <p className={`bp-modal-summary ${failed ? 'error' : ''}`}>{summary}</p>
          )}
        </div>
      </div>
    </div>
  )
}

