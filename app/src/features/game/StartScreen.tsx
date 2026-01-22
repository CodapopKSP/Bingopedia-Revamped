import { useState } from 'react'
import './StartScreen.css'
import { StartScreenLeaderboard } from '../leaderboard/StartScreenLeaderboard'
import type { GameGridCell } from './types'
import type { CuratedArticle } from '../../shared/data/types'

interface StartScreenProps {
  onStart: () => void | Promise<void>
  onCreateShareableGame?: () => Promise<{ gameId: string; url: string }>
  onReplay?: (gameState: { gridCells: GameGridCell[]; startingArticle: CuratedArticle; gameId?: string; gameType?: 'fresh' | 'linked' }) => Promise<void>
}

/**
 * Start screen component displayed before the game begins.
 * 
 * Shows the game title, rules, and leaderboard preview.
 * Provides the "Start Game" button to begin a new game.
 * 
 * @param props - Component props
 * @param props.onStart - Callback when "Start Game" is clicked
 */
export function StartScreen({ onStart, onCreateShareableGame, onReplay }: StartScreenProps) {
  const [shareableUrl, setShareableUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleGenerateShareable = async () => {
    if (!onCreateShareableGame) return

    setIsGenerating(true)
    setCopySuccess(false)
    try {
      const result = await onCreateShareableGame()
      setShareableUrl(result.url)
    } catch (error) {
      console.error('Failed to create shareable game:', error)
      // Error handling could be improved with a toast/notification
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareableUrl) return

    try {
      await navigator.clipboard.writeText(shareableUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <div className="bp-start-screen">
      <section className="bp-start-hero">
        <div>
          <h2>Wiki Bingo, Reimagined</h2>
          <p>
            Navigate Wikipedia from a random starting article to complete a 5×5 bingo card of
            target articles. Every click and every second counts toward your final score.
          </p>
          <div className="bp-start-actions">
            <button className="bp-start-button" type="button" onClick={() => void onStart()} aria-label="Start a new game">
              Start Game
            </button>
            {onCreateShareableGame && (
              <button
                className="bp-share-button"
                type="button"
                onClick={handleGenerateShareable}
                disabled={isGenerating}
                aria-label="Generate shareable game"
              >
                {isGenerating ? 'Generating...' : 'Generate Shareable Game'}
              </button>
            )}
          </div>
          {shareableUrl && (
            <div className="bp-shareable-link-container">
              <p className="bp-shareable-link-label">Share this game:</p>
              <div className="bp-shareable-link-input-group">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="bp-shareable-link-input"
                  aria-label="Shareable game URL"
                />
                <button
                  type="button"
                  className="bp-copy-button"
                  onClick={handleCopyLink}
                  aria-label="Copy link to clipboard"
                >
                  {copySuccess ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="bp-start-leaderboard-shell">
        <StartScreenLeaderboard onReplay={onReplay} />
      </section>
    </div>
  )
}


