import { useState, useEffect, memo } from 'react'
import { submitScore } from '../../shared/api/leaderboardClient'
import type { GameGridCell } from './types'
import { getCuratedArticleTitle } from '../../shared/data/types'
import { validateUsername } from '../../shared/utils/validation'
import './WinModal.css'

interface WinModalProps {
  clicks: number
  time: number
  gridCells: GameGridCell[]
  matchedArticles: Set<string>
  articleHistory: string[]
  gameId?: string
  gameType?: 'fresh' | 'linked'
  onClose: () => void
}

/**
 * Formats elapsed seconds into a readable time string (MM:SS or HH:MM:SS).
 * 
 * @param seconds - Total elapsed seconds
 * @returns Formatted time string
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

/**
 * Formats bingo grid cells for leaderboard submission.
 * Adds "[Found]" prefix to matched articles.
 * 
 * @param gridCells - Array of grid cells
 * @param matchedArticles - Set of matched article titles
 * @returns Array of formatted square strings
 */
function formatBingoSquares(gridCells: GameGridCell[], matchedArticles: Set<string>): string[] {
  const matchedSet = matchedArticles
  return gridCells.map((cell) => {
    const title = getCuratedArticleTitle(cell.article)
    const normalized = title.toLowerCase().replace(/_/g, ' ')
    const isFound = Array.from(matchedSet).some(
      (matched) => matched.toLowerCase().replace(/_/g, ' ') === normalized
    )
    return isFound ? `[Found] ${title}` : title
  })
}


/**
 * Modal component displayed when the player wins the game.
 * 
 * Shows final score, time, and clicks. Allows the player to submit their score
 * to the leaderboard with a username. Includes real-time username validation.
 * 
 * Wrapped with React.memo to prevent unnecessary re-renders from timer updates.
 * 
 * @param props - Component props
 * @param props.clicks - Total number of clicks/navigations
 * @param props.time - Total elapsed time in seconds
 * @param props.gridCells - Array of grid cells for score submission
 * @param props.matchedArticles - Set of matched article titles
 * @param props.articleHistory - Array of visited article titles
 * @param props.onClose - Callback when the modal should be closed
 */
function WinModalComponent({ clicks, time, gridCells, matchedArticles, articleHistory, gameId, gameType, onClose }: WinModalProps) {
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const score = time * clicks

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    const validation = validateUsername(value)
    setValidationError(validation)
    // Clear submission error when user starts typing
    if (error && !error.includes('Failed to submit')) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateUsername(username)
    if (validation) {
      setValidationError(validation)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const bingoSquares = formatBingoSquares(gridCells, matchedArticles)
      const history = articleHistory || []

      await submitScore({
        username: username.trim(),
        score,
        time,
        clicks,
        bingoSquares,
        history,
        ...(gameId && { gameId }),
        ...(gameType && { gameType }),
      })

      setSubmitted(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Please try again.'
      setError(`Failed to submit score: ${errorMessage}`)
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onClose()
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [submitting])

  return (
    <div className="bp-modal-overlay bp-win-modal-overlay" onClick={handleClose}>
      <div className="bp-modal-content bp-win-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bp-modal-header">
          <h3 className="bp-modal-title">🎉 Congratulations! You Won! 🎉</h3>
          {!submitting && (
            <button className="bp-modal-close" onClick={handleClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
        <div className="bp-modal-body bp-win-modal-body">
          {submitted ? (
            <div className="bp-win-submitted">
              <p className="bp-win-success-message">Your score has been submitted to the leaderboard!</p>
              <button className="bp-win-close-button" onClick={() => window.location.reload()}>
                Home
              </button>
            </div>
          ) : (
            <>
              <div className="bp-win-stats">
                <div className="bp-win-stat">
                  <span className="bp-win-stat-label">Time:</span>
                  <span className="bp-win-stat-value">{formatTime(time)}</span>
                </div>
                <div className="bp-win-stat">
                  <span className="bp-win-stat-label">Clicks:</span>
                  <span className="bp-win-stat-value">{clicks}</span>
                </div>
                <div className="bp-win-stat">
                  <span className="bp-win-stat-label">Score:</span>
                  <span className="bp-win-stat-value">{score.toLocaleString()}</span>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="bp-win-form">
                <div className="bp-win-form-group">
                  <label htmlFor="win-username" className="bp-win-label">
                    Enter your username to submit your score:
                  </label>
                  <input
                    id="win-username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Username (max 50 characters)"
                    maxLength={50}
                    disabled={submitting}
                    className="bp-win-input"
                    aria-label="Username input"
                  />
                  {validationError && <div className="bp-win-error">{validationError}</div>}
                </div>
                {error && <div className="bp-win-error">{error}</div>}
                <div className="bp-win-actions">
                  <button type="submit" disabled={submitting || !!validationError} className="bp-win-submit-button">
                    {submitting ? 'Submitting...' : 'Submit Score'}
                  </button>
                  <button type="button" onClick={handleClose} disabled={submitting} className="bp-win-skip-button">
                    Skip
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Memoize to prevent re-renders from timer updates
export const WinModal = memo(WinModalComponent)

