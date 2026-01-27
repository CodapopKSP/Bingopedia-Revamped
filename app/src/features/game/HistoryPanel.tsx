import { useEffect, useRef } from 'react'
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

  const gridTitles = new Set(gridCells.map((cell) => getCuratedArticleTitle(cell.article)))

  const stripFoundTag = (title: string) => (title.startsWith('[Found] ') ? title.replace('[Found] ', '') : title)

  useEffect(() => {
    if (listRef.current && history.length > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [history])

  if (!history || history.length === 0) {
    return (
      <div className="bp-history-panel">
        <div className="bp-history-empty">
          <p>No articles visited yet</p>
        </div>
      </div>
    )
  }

  const seenBingoItems = new Set<string>()

  return (
    <div className="bp-history-panel">
      <div className="bp-history-list" ref={listRef}>
        {history
          .filter((articleTitle) => articleTitle != null && articleTitle !== '')
          .map((articleTitle, index) => {
            const cleanTitle = stripFoundTag(articleTitle)
            const displayTitle = cleanTitle.replace(/_/g, ' ')
            const isSelected = cleanTitle === selectedArticle
            const isBingoItem = gridTitles.has(cleanTitle)
            const isFirstBingoInstance = isBingoItem && !seenBingoItems.has(cleanTitle)

            if (isFirstBingoInstance) {
              seenBingoItems.add(cleanTitle)
            }

            return (
              <div
                key={`${cleanTitle}-${index}`}
                className={`bp-history-item ${isSelected ? 'selected' : ''} ${isFirstBingoInstance ? 'bingo-item' : ''}`}
                onClick={() => onArticleClick(cleanTitle)}
                role="button"
                tabIndex={0}
                aria-label={`History item ${index}: ${displayTitle}${isFirstBingoInstance ? ' (bingo item)' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onArticleClick(cleanTitle)
                  }
                }}
              >
                <span className="bp-history-item-number">{index}</span>
                <span className="bp-history-item-title">{displayTitle}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

