import { useState, useEffect, useRef, useCallback } from 'react'
import type { LeaderboardEntry, GameGridCell } from '../game/types'
import { BingoGrid } from '../game/BingoGrid'
import { HistoryPanel } from '../game/HistoryPanel'
import { ArticleSummaryModal } from '../game/ArticleSummaryModal'
import type { CuratedArticle } from '../../shared/data/types'
import { formatTime } from '../../shared/utils/timeFormat'
import './GameDetailsModal.css'

interface GameDetailsModalProps {
  entry: LeaderboardEntry
  onClose: () => void
  onReplay?: (gameState: { gridCells: GameGridCell[]; startingArticle: CuratedArticle; gameId?: string; hashedId?: string; gameType?: 'random' | 'repeat' }) => Promise<void>
}

/**
 * Converts bingoSquares strings (which may include "[Found]" markers) into GameGridCell objects.
 * This allows the BingoGrid component to display the board state from a past game.
 * 
 * @param bingoSquares - Array of square strings, may include "[Found]" prefix
 * @returns Array of grid cell objects compatible with BingoGrid component
 */
function parseBingoSquares(bingoSquares: string[]): Array<{ id: string; article: CuratedArticle }> {
  return bingoSquares.map((square, index) => {
    const isFound = square.startsWith('[Found] ')
    const title = isFound ? square.replace('[Found] ', '') : square
    
    // Create a minimal CuratedArticle object
    const article: CuratedArticle = {
      title,
    }
    
    return {
      id: `cell-${index}`,
      article,
    }
  })
}

function stripFoundTag(title: string): string {
  return title.startsWith('[Found] ') ? title.replace('[Found] ', '') : title
}

/**
 * Game Details Modal displays a past game's bingo board and article history.
 * This allows users to review how a leaderboard entry was achieved.
 */
/**
 * Modal component that displays detailed information about a past game from the leaderboard.
 * 
 * Shows the bingo grid state, article history, and game statistics. Allows users to see
 * how a leaderboard entry was achieved.
 * 
 * @param props - Component props
 * @param props.entry - Leaderboard entry to display
 * @param props.onClose - Callback when the modal should be closed
 */
export function GameDetailsModal({ entry, onClose, onReplay }: GameDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'board' | 'history'>('board')
  const [summaryModalTitle, setSummaryModalTitle] = useState<string | null>(null)
  const [isReplaying, setIsReplaying] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedElementRef = useRef<Element | null>(null)
  
  const boardSquares =
    entry.bingoSquares?.slice(0, 25) ??
    entry.bingopediaGame?.slice(0, 25) ??
    []
  const gridCells = boardSquares.length > 0 ? parseBingoSquares(boardSquares) : []
  const matchedArticles = new Set<string>()
  
  // Prefer "[Found]" tags from history; fall back to board markers for legacy entries
  const historyHasFound = entry.history?.some((title) => title.startsWith('[Found] ')) ?? false
  if (historyHasFound && entry.history) {
    entry.history.forEach((title) => {
      if (title.startsWith('[Found] ')) {
        matchedArticles.add(stripFoundTag(title).toLowerCase().replace(/_/g, ' '))
      }
    })
  } else if (boardSquares.length > 0) {
    boardSquares.forEach((square) => {
      if (square.startsWith('[Found] ')) {
        const title = stripFoundTag(square)
        matchedArticles.add(title.toLowerCase().replace(/_/g, ' '))
      }
    })
  }
  
  // Calculate winning cells (simplified - we don't store this in the entry)
  const winningCells: number[] = []
  
  const handleClose = useCallback(() => {
    onClose()
    // Restore focus to the element that launched the modal, if any
    if (previouslyFocusedElementRef.current instanceof HTMLElement) {
      previouslyFocusedElementRef.current.focus()
    }
  }, [onClose])

  const handleCellClick = (articleTitle: string) => {
    setSummaryModalTitle(articleTitle)
  }

  const handleReplay = async () => {
    if (!onReplay) return

    setIsReplaying(true)
    try {
      if (entry.gameId) {
        // Load from gameId - pass gameId and let handler load it
        await onReplay({
          gridCells: [], // Will be loaded from API
          startingArticle: { title: '' }, // Will be loaded from API
          gameId: entry.gameId,
          gameType: 'repeat',
        })
      } else if (entry.bingopediaGame && entry.bingopediaGame.length >= 26) {
        // Reconstruct from bingopediaGame (25 board + starting article)
        const startingTitle = stripFoundTag(entry.bingopediaGame[25])
        const startingArticle: CuratedArticle = {
          title: startingTitle,
        }
        await onReplay({
          gridCells,
          startingArticle,
          gameType: 'repeat',
        })
      } else if (entry.bingoSquares && entry.history && entry.history.length > 0) {
        // Reconstruct from bingoSquares and history
        const startingArticle: CuratedArticle = {
          title: stripFoundTag(entry.history[0]),
        }
        await onReplay({
          gridCells,
          startingArticle,
          gameType: 'repeat',
        })
      } else {
        console.error('Cannot replay: missing gameId or game data')
      }
    } catch (error) {
      console.error('Failed to replay game:', error)
    } finally {
      setIsReplaying(false)
    }
  }

  // Basic focus trapping within the modal dialog
  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement

    const dialog = dialogRef.current
    if (!dialog) return

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
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
      )

    const focusFirstElement = () => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        dialog.focus()
      }
    }

    // Move initial focus into the dialog
    focusFirstElement()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
        return
      }

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

    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose])

  return (
    <div
      className="bp-modal-overlay bp-game-details-overlay"
      onClick={handleClose}
      aria-hidden="true"
    >
      <div
        className="bp-modal-content bp-game-details-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bp-game-details-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="bp-modal-header">
          <h3 className="bp-modal-title" id="bp-game-details-title">
            Game Details: {entry.username}
          </h3>
          <button className="bp-modal-close" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="bp-modal-body bp-game-details-body">
          <div className="bp-game-details-stats">
            <div className="bp-game-details-stat">
              <span className="bp-game-details-stat-label">Score:</span>
              <span className="bp-game-details-stat-value">{entry.score.toLocaleString()}</span>
            </div>
            <div className="bp-game-details-stat">
              <span className="bp-game-details-stat-label">Time:</span>
              <span className="bp-game-details-stat-value">{formatTime(entry.time)}</span>
            </div>
            <div className="bp-game-details-stat">
              <span className="bp-game-details-stat-label">Clicks:</span>
              <span className="bp-game-details-stat-value">{entry.clicks}</span>
            </div>
            {entry.createdAt && (
              <div className="bp-game-details-stat">
                <span className="bp-game-details-stat-label">Date:</span>
                <span className="bp-game-details-stat-value">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          {onReplay &&
            (entry.gameId ||
              (entry.bingopediaGame && entry.bingopediaGame.length >= 26) ||
              (entry.bingoSquares && entry.history && entry.history.length > 0)) && (
            <div className="bp-game-details-actions">
              <button
                type="button"
                className="bp-replay-button"
                onClick={handleReplay}
                disabled={isReplaying}
                aria-label="Replay this game"
              >
                {isReplaying ? 'Loading...' : 'Replay Game'}
              </button>
            </div>
          )}
          
          <div className="bp-game-details-tabs">
            <button
              type="button"
              className={`bp-game-details-tab ${activeTab === 'board' ? 'bp-game-details-tab--active' : ''}`}
              onClick={() => setActiveTab('board')}
              aria-label="View bingo board"
            >
              Bingo Board
            </button>
            <button
              type="button"
              className={`bp-game-details-tab ${activeTab === 'history' ? 'bp-game-details-tab--active' : ''}`}
              onClick={() => setActiveTab('history')}
              aria-label="View article history"
            >
              Article History
            </button>
          </div>
          
          <div className="bp-game-details-content-area">
            {/* Render both tabs in same container, toggle visibility to prevent layout shifts */}
            <div className={`bp-game-details-board ${activeTab === 'board' ? 'bp-game-details-tab-active' : 'bp-game-details-tab-hidden'}`}>
              {gridCells.length > 0 ? (
                <BingoGrid
                  gridCells={gridCells}
                  matchedArticles={matchedArticles}
                  winningCells={winningCells}
                  onCellClick={handleCellClick}
                />
              ) : (
                <p className="bp-game-details-empty">No board data available for this entry.</p>
              )}
            </div>
            
            <div className={`bp-game-details-history ${activeTab === 'history' ? 'bp-game-details-tab-active' : 'bp-game-details-tab-hidden'}`}>
              {entry.history && entry.history.length > 0 ? (
                <HistoryPanel
                  history={entry.history}
                  onArticleClick={() => {}} // Read-only in details view
                  selectedArticle={null}
                  gridCells={gridCells}
                />
              ) : (
                <p className="bp-game-details-empty">No history data available for this entry.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {summaryModalTitle && (
        <ArticleSummaryModal
          articleTitle={summaryModalTitle}
          onClose={() => setSummaryModalTitle(null)}
        />
      )}
    </div>
  )
}

