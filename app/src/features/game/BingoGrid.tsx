import { useMemo, useRef, useEffect, useState } from 'react'
import type { GameGridCell, GridIndex } from './types'
import { getCuratedArticleTitle } from '../../shared/data/types'
import { normalizeTitle } from '../../shared/wiki/normalizeTitle'
import './BingoGrid.css'

/**
 * Bingo cell component that centers text vertically unless it exceeds 4 lines.
 */
function BingoCell({
  title,
  displayTitle,
  displayTitleWithHyphens,
  isMatched,
  isWinning,
  onCellClick,
}: {
  title: string
  displayTitle: string
  displayTitleWithHyphens: string
  isMatched: boolean
  isWinning: boolean
  onCellClick: (title: string) => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isTall, setIsTall] = useState(false)

  useEffect(() => {
    if (!contentRef.current) return

    // Calculate 4 lines height: font-size (0.875rem) * line-height (1.2) * 4
    // Convert rem to pixels: 0.875rem ≈ 14px, so 14 * 1.2 * 4 = 67.2px
    const fourLinesHeight = parseFloat(getComputedStyle(contentRef.current).fontSize) * 1.2 * 4
    
    const checkHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight
        setIsTall(height > fourLinesHeight)
      }
    }

    // Check after a brief delay to ensure content is rendered
    const timeoutId = setTimeout(checkHeight, 0)
    
    // Also check on resize
    const resizeObserver = new ResizeObserver(checkHeight)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [displayTitleWithHyphens])

  return (
    <div
      className={`bp-bingo-cell ${isWinning ? 'winning' : isMatched ? 'matched' : ''} ${isTall ? 'bp-bingo-cell--tall' : ''}`}
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
      <div ref={contentRef} className="bp-bingo-cell-content" lang="en">
        {displayTitleWithHyphens}
      </div>
    </div>
  )
}

/**
 * Adds soft hyphens to long words by splitting them in half.
 * Only processes individual words (not spaces), and only words longer than 8 characters.
 * This ensures words break at word boundaries first, and only break within words if they're too long.
 */
function addSoftHyphens(text: string): string {
  // Match words (sequences of non-whitespace, non-punctuation characters)
  // Only add hyphens to words longer than 8 characters
  return text.replace(/\b(\w{9,})\b/g, (word) => {
    const midPoint = Math.floor(word.length / 2)
    return word.slice(0, midPoint) + '\u00AD' + word.slice(midPoint)
  })
}

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
      const displayTitleWithHyphens = addSoftHyphens(displayTitle)
      return { title, normalizedTitle, isMatched, isWinning, displayTitle, displayTitleWithHyphens, index }
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
        {cellData.map(({ title, isMatched, isWinning, displayTitle, displayTitleWithHyphens, index }) => (
          <BingoCell
            key={gridCells[index].id}
            title={title}
            displayTitle={displayTitle}
            displayTitleWithHyphens={displayTitleWithHyphens}
            isMatched={isMatched}
            isWinning={isWinning}
            onCellClick={onCellClick}
          />
        ))}
      </div>
    </div>
  )
}

