import { useEffect, useRef } from 'react'
import './RulesModal.css'

interface RulesModalProps {
  onClose: () => void
}

/**
 * Modal component displaying detailed game rules and an example.
 */
export function RulesModal({ onClose }: RulesModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus the modal when it opens for accessibility
    dialogRef.current?.focus()

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="bp-modal-overlay bp-rules-modal-overlay"
      onClick={handleOverlayClick}
      aria-hidden="true"
    >
      <div
        className="bp-modal-content bp-rules-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bp-rules-modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="bp-modal-header">
          <h3 className="bp-modal-title" id="bp-rules-modal-title">
            How to Play
          </h3>
          <button className="bp-modal-close" onClick={onClose} aria-label="Close rules">
            ✕
          </button>
        </div>
        <div className="bp-modal-body bp-rules-modal-body">
          <section className="bp-rules-section">
            <h4 className="bp-rules-section-title">Objective</h4>
            <p className="bp-rules-text">
              Navigate through Wikipedia articles to complete a 5×5 bingo card. Win by finding 5 target articles in a row—horizontally, vertically, or diagonally.
            </p>
          </section>

          <section className="bp-rules-section">
            <h4 className="bp-rules-section-title">How to Play</h4>
            <ol className="bp-rules-list">
              <li>
                <strong>Start:</strong> You begin at a random Wikipedia article. The timer starts once the first article loads.
              </li>
              <li>
                <strong>Navigate:</strong> Click any link within the Wikipedia article to navigate to another article. You can only move by clicking links—no direct navigation or search.
              </li>
              <li>
                <strong>Match Articles:</strong> When you visit an article that matches one on your bingo card, it will be automatically marked. You'll see a celebration animation when you find a new match!
              </li>
              <li>
                <strong>Win:</strong> Complete any line of 5 articles (row, column, or diagonal) to win the game.
              </li>
              <li>
                <strong>View Summaries:</strong> Click any cell on the bingo card to read a summary of that article, but you cannot navigate directly from the summary.
              </li>
              <li>
                <strong>Article History:</strong> Use the history panel to see all articles you've visited and click any previous article to return to it. This is helpful if you need to backtrack or explore a different path. Note that clicking an article in the history counts as a click toward your score.
              </li>
            </ol>
          </section>

          <section className="bp-rules-section">
            <h4 className="bp-rules-section-title">Scoring</h4>
            <p className="bp-rules-text">
              Your score is calculated as: <strong>Time (seconds) × Clicks</strong>
            </p>
            <ul className="bp-rules-list">
              <li><strong>Lower scores are better!</strong> Complete the game quickly with as few clicks as possible.</li>
              <li>Each article you visit counts as one click, regardless of whether it matches a bingo square. This includes clicking articles from the history panel.</li>
              <li>You can submit your score to the leaderboard after winning (optional).</li>
            </ul>
          </section>

          <section className="bp-rules-section">
            <h4 className="bp-rules-section-title">Example Game</h4>
            <div className="bp-rules-example">
              <p className="bp-rules-text">
                Let's say your bingo card includes <strong>Quantum Mechanics</strong> and <strong>Albert Einstein</strong> as target articles.
              </p>
              <ol className="bp-rules-list">
                <li>You start at a random article, say <strong>Physics</strong>.</li>
                <li>You browse the article and click a link to <strong>Theoretical Physics</strong> (no match yet).</li>
                <li>From there, you navigate to <strong>Quantum Mechanics</strong> → Match! ✓</li>
                <li>You continue exploring and eventually find a link to <strong>Albert Einstein</strong> → Match! ✓</li>
              </ol>
              <p className="bp-rules-text">
                Most games require navigating through many intermediate articles to reach your targets. The challenge is finding efficient paths between unrelated topics!
              </p>
            </div>
          </section>

          <section className="bp-rules-section">
            <h4 className="bp-rules-section-title">Tips</h4>
            <ul className="bp-rules-list">
              <li>Plan your route strategically—some articles are better "hubs" with many connections.</li>
              <li>Use the article history panel to revisit previous articles if you need to backtrack.</li>
              <li>Read article summaries on the bingo card to understand what you're looking for.</li>
              <li>Remember: speed and efficiency matter, but don't rush and miss connections!</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

