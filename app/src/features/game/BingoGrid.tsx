import { useMemo } from 'react'
import type { GameGridCell, GridIndex } from './types'
import { getCuratedArticleTitle } from '../../shared/data/types'
import { normalizeTitle } from '../../shared/wiki/normalizeTitle'
import './BingoGrid.css'

interface BingoGridProps {
  gridCells: GameGridCell[]
  matchedArticles: Set<string>
  winningCells: GridIndex[]
  onCellClick: (articleTitle: string) => void
  onClose?: () => void
}

/**
 * Renders a 5×5 bingo grid with article titles.
 * 
 * Displays matched articles with visual highlighting and winning cells with special styling.
 * Clicking a cell opens the article summary modal.
 * 
 * @param props - Component props
 * @param props.gridCells - Array of grid cells containing article data
 * @param props.matchedArticles - Set of matched article titles (normalized)
 * @param props.winningCells - Array of grid indices that are part of winning lines
 * @param props.onCellClick - Callback when a cell is clicked, receives the article title
 * @param props.onClose - Optional callback to close the grid (for mobile overlay)
 */
export function BingoGrid({ gridCells, matchedArticles, winningCells, onCellClick, onClose }: BingoGridProps) {
  if (!gridCells || gridCells.length === 0) {
    return (
      <div className="bp-bingo-grid-container">
        <div className="bp-bingo-loading">
          <p>Loading articles for bingo grid...</p>
        </div>
      </div>
    )
  }

  // Memoize expensive computations: winning set and normalized matched articles
  const winningSet = useMemo(() => new Set(winningCells), [winningCells])
  const normalizedMatchedSet = useMemo(() => {
    return new Set(Array.from(matchedArticles).map((title) => normalizeTitle(title)))
  }, [matchedArticles])

  // Memoize cell data to avoid recalculating on every render
  const cellData = useMemo(() => {
    return gridCells.map((cell, index) => {
      const title = getCuratedArticleTitle(cell.article)
      const normalizedTitle = normalizeTitle(title)
      const isMatched = normalizedMatchedSet.has(normalizedTitle)
      const isWinning = winningSet.has(index as GridIndex)
      const displayTitle = title.replace(/_/g, ' ')
      return { title, normalizedTitle, isMatched, isWinning, displayTitle, index }
    })
  }, [gridCells, normalizedMatchedSet, winningSet])

  return (
    <div className="bp-bingo-grid-container">
      {onClose && (
        <button className="bp-bingo-close-button" onClick={onClose} aria-label="Close bingo board">
          ✕
        </button>
      )}
      <div className="bp-bingo-grid">
        {cellData.map(({ title, isMatched, isWinning, displayTitle, index }) => {

          return (
            <div
              key={gridCells[index].id}
              className={`bp-bingo-cell ${isWinning ? 'winning' : isMatched ? 'matched' : ''}`}
              onClick={() => onCellClick(title)}
              role="button"
              tabIndex={0}
              aria-label={`Bingo cell: ${displayTitle}${isMatched ? ' (matched)' : ''}${isWinning ? ' (winning)' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onCellClick(title)
                }
              }}
            >
              <div className="bp-bingo-cell-content">{displayTitle}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

