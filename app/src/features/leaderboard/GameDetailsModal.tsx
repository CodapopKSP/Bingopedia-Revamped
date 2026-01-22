import { useState, useEffect } from 'react'
import type { LeaderboardEntry } from '../game/types'
import { BingoGrid } from '../game/BingoGrid'
import { HistoryPanel } from '../game/HistoryPanel'
import { getCuratedArticleTitle } from '../../shared/data/types'
import type { CuratedArticle } from '../../shared/data/types'
import './GameDetailsModal.css'

interface GameDetailsModalProps {
  entry: LeaderboardEntry
  onClose: () => void
}

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
 * Converts bingoSquares strings (which may include "[Found]" markers) into GameGridCell objects.
 * This allows the BingoGrid component to display the board state from a past game.
 * 
 * @param bingoSquares - Array of square strings, may include "[Found]" prefix
 * @returns Array of grid cell objects compatible with BingoGrid component
 */
function parseBingoSquares(bingoSquares: string[]): Array<{ id: string; article: CuratedArticle }> {
  const matchedTitles = new Set<string>()
  
  return bingoSquares.map((square, index) => {
    const isFound = square.startsWith('[Found] ')
    const title = isFound ? square.replace('[Found] ', '') : square
    
    // Normalize for matching
    const normalized = title.toLowerCase().replace(/_/g, ' ')
    if (isFound) {
      matchedTitles.add(normalized)
    }
    
    // Create a minimal CuratedArticle object
    const article: CuratedArticle = {
      title,
      category: 'Unknown', // We don't store category in leaderboard
    }
    
    return {
      id: `cell-${index}`,
      article,
    }
  })
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
export function GameDetailsModal({ entry, onClose }: GameDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'board' | 'history'>('board')
  
  const gridCells = entry.bingoSquares ? parseBingoSquares(entry.bingoSquares) : []
  const matchedArticles = new Set<string>()
  
  // Extract matched articles from bingoSquares that have [Found] markers
  if (entry.bingoSquares) {
    entry.bingoSquares.forEach((square) => {
      if (square.startsWith('[Found] ')) {
        const title = square.replace('[Found] ', '')
        matchedArticles.add(title.toLowerCase().replace(/_/g, ' '))
      }
    })
  }
  
  // Calculate winning cells (simplified - we don't store this in the entry)
  const winningCells: number[] = []
  
  const handleClose = () => {
    onClose()
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="bp-modal-overlay bp-game-details-overlay" onClick={handleClose}>
      <div className="bp-modal-content bp-game-details-content" onClick={(e) => e.stopPropagation()}>
        <div className="bp-modal-header">
          <h3 className="bp-modal-title">Game Details: {entry.username}</h3>
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
            {activeTab === 'board' && gridCells.length > 0 && (
              <div className="bp-game-details-board">
                <BingoGrid
                  gridCells={gridCells}
                  matchedArticles={matchedArticles}
                  winningCells={winningCells}
                  onCellClick={() => {}} // Read-only in details view
                />
              </div>
            )}
            
            {activeTab === 'history' && entry.history && entry.history.length > 0 && (
              <div className="bp-game-details-history">
                <HistoryPanel
                  history={entry.history}
                  onArticleClick={() => {}} // Read-only in details view
                  selectedArticle={null}
                  gridCells={gridCells}
                />
              </div>
            )}
            
            {activeTab === 'board' && gridCells.length === 0 && (
              <p className="bp-game-details-empty">No board data available for this entry.</p>
            )}
            
            {activeTab === 'history' && (!entry.history || entry.history.length === 0) && (
              <p className="bp-game-details-empty">No history data available for this entry.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

