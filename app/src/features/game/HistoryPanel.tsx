import { useEffect, useRef, useState } from 'react'
import type { GameGridCell } from './types'
import { getCuratedArticleTitle } from '../../shared/data/types'
import './HistoryPanel.css'

interface HistoryPanelProps {
  history: string[]
  onArticleClick: (title: string) => void
  selectedArticle: string | null
  gridCells: GameGridCell[]
}

/**
 * Component that displays the history of visited articles.
 * 
 * Shows articles in visit order with visual indicators for:
 * - Current article (highlighted)
 * - Articles that are in the bingo grid (green border)
 * 
 * Clicking a history item navigates to that article and increments the click counter.
 * 
 * @param props - Component props
 * @param props.history - Array of article titles in visit order
 * @param props.onArticleClick - Callback when a history item is clicked
 * @param props.selectedArticle - Currently selected/viewed article title
 * @param props.gridCells - Array of grid cells to check for matches
 */
export function HistoryPanel({ history, onArticleClick, selectedArticle, gridCells }: HistoryPanelProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const gridTitles = new Set(gridCells.map((cell) => getCuratedArticleTitle(cell.article)))

  useEffect(() => {
    if (listRef.current && history.length > 0 && !isCollapsed) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [history, isCollapsed])

  if (!history || history.length === 0) {
    return (
      <div className="bp-history-panel">
        <div className="bp-history-header">
          <h3 className="bp-history-title">History</h3>
          <button
            className="bp-history-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand history' : 'Collapse history'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
        {!isCollapsed && (
          <div className="bp-history-empty">
            <p>No articles visited yet</p>
          </div>
        )}
      </div>
    )
  }

  const seenBingoItems = new Set<string>()

  return (
    <div className={`bp-history-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="bp-history-header">
        <h3 className="bp-history-title">History</h3>
        <button
          className="bp-history-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand history' : 'Collapse history'}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="bp-history-list" ref={listRef}>
          {history
            .filter((articleTitle) => articleTitle != null && articleTitle !== '')
            .map((articleTitle, index) => {
              const displayTitle = articleTitle.replace(/_/g, ' ')
              const isSelected = articleTitle === selectedArticle
              const isBingoItem = gridTitles.has(articleTitle)
              const isFirstBingoInstance = isBingoItem && !seenBingoItems.has(articleTitle)

              if (isFirstBingoInstance) {
                seenBingoItems.add(articleTitle)
              }

              return (
                <div
                  key={`${articleTitle}-${index}`}
                  className={`bp-history-item ${isSelected ? 'selected' : ''} ${isFirstBingoInstance ? 'bingo-item' : ''}`}
                  onClick={() => onArticleClick(articleTitle)}
                  role="button"
                  tabIndex={0}
                  aria-label={`History item ${index}: ${displayTitle}${isFirstBingoInstance ? ' (bingo item)' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onArticleClick(articleTitle)
                    }
                  }}
                >
                  <span className="bp-history-item-number">{index}</span>
                  <span className="bp-history-item-title">{displayTitle}</span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

