import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GameState } from './types'
import { BingoGrid } from './BingoGrid'
import { HistoryPanel } from './HistoryPanel'
import { ArticleSummaryModal } from './ArticleSummaryModal'
import { WinModal } from './WinModal'
import { Confetti } from './Confetti'
import { ArticleViewer } from '../article-viewer/ArticleViewer'
import { TimerDisplay } from './TimerDisplay'
import './GameScreen.css'

interface GameScreenProps {
  state: GameState
  controls: {
    startNewGame: () => Promise<void> | void
    registerNavigation: (title: string) => Promise<void>
    setArticleLoading: (loading: boolean) => void
    replaceFailedArticle: (title: string) => Promise<void>
  }
  onBackToStart: () => void
  onMatchCallbackReady?: (callback: (title: string) => void) => void
}

/**
 * Main game screen component that displays the bingo grid, article viewer, and game controls.
 * 
 * Manages the layout for both desktop (side-by-side) and mobile (toggle between views).
 * Handles game state display, navigation, and win detection.
 * 
 * @param props - Component props
 * @param props.state - Current game state
 * @param props.controls - Game control functions
 * @param props.onBackToStart - Callback to return to the start screen
 */
export function GameScreen({ state, controls, onBackToStart, onMatchCallbackReady }: GameScreenProps) {
  const { clickCount, elapsedSeconds, gameWon, currentArticleTitle, gridCells, matchedArticles, winningCells, articleHistory, articleLoading, gameType } = state
  const { registerNavigation, setArticleLoading, replaceFailedArticle } = controls
  const [summaryModalTitle, setSummaryModalTitle] = useState<string | null>(null)
  const [showWinModal, setShowWinModal] = useState(false)
  const [showWinConfetti, setShowWinConfetti] = useState(false)
  const [showMatchConfetti, setShowMatchConfetti] = useState(false)
  // On mobile (screens < 960px), show bingo board by default
  const [bingoBoardOpen, setBingoBoardOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 960
    }
    return false
  })

  useEffect(() => {
    if (gameWon && !showWinModal && !showWinConfetti) {
      setShowWinConfetti(true)
      setShowWinModal(true)
    }
  }, [gameWon, showWinModal, showWinConfetti])

  const handleMatch = useCallback(() => {
    // Trigger confetti for new match
    // The Confetti component handles its own completion timing
    setShowMatchConfetti(true)
  }, [])

  // Register the match callback with parent (App.tsx) so it can pass it to useGameState
  useEffect(() => {
    if (onMatchCallbackReady) {
      onMatchCallbackReady(handleMatch)
    }
  }, [handleMatch, onMatchCallbackReady])

  const handleCellClick = useCallback((articleTitle: string) => {
    setSummaryModalTitle(articleTitle)
  }, [])

  const handleCloseSummaryModal = useCallback(() => {
    setSummaryModalTitle(null)
  }, [])

  const handleHistoryClick = useCallback(async (title: string) => {
    await registerNavigation(title)
  }, [registerNavigation])

  const handleArticleClick = useCallback(async (title: string) => {
    await registerNavigation(title)
  }, [registerNavigation])

  const handleArticleLoadFailure = useCallback(async (title: string) => {
    await replaceFailedArticle(title)
  }, [replaceFailedArticle])

  // Memoize isPausedForLoading to prevent recalculation on every render
  // This prevents ArticleViewer from re-rendering every second when timer ticks
  const isPausedForLoading = useMemo(() => {
    return !state.timerRunning && articleLoading
  }, [state.timerRunning, articleLoading])

  return (
    <div className="bp-game-screen">
      {showWinConfetti && <Confetti play={showWinConfetti} onComplete={() => setShowWinConfetti(false)} />}
      {showMatchConfetti && <Confetti play={showMatchConfetti} onComplete={() => setShowMatchConfetti(false)} />}
      {showWinModal && (
        <WinModal
          clicks={clickCount}
          time={elapsedSeconds}
          gridCells={gridCells}
          matchedArticles={matchedArticles}
          articleHistory={articleHistory}
          gameType={gameType}
          hashedId={state.hashedId}
          onClose={() => setShowWinModal(false)}
        />
      )}
      {summaryModalTitle && (
        <ArticleSummaryModal
          articleTitle={summaryModalTitle}
          onClose={handleCloseSummaryModal}
          onArticleFailure={handleArticleLoadFailure}
        />
      )}
      {/* Mobile score bar */}
      <div className="bp-game-scorebar-mobile">
        <button type="button" className="bp-link-button" onClick={onBackToStart}>
          ← New Game
        </button>
        <div className="bp-game-metrics">
          <span>Clicks: {clickCount}</span>
          <TimerDisplay
            elapsedSeconds={elapsedSeconds}
            className={articleLoading ? 'bp-game-timer bp-game-timer--paused' : 'bp-game-timer'}
            prefix="Time: "
          />
        </div>
      </div>
      {/* Mobile toggle button */}
      <button
        type="button"
        className="bp-bingo-board-toggle"
        onClick={() => setBingoBoardOpen(!bingoBoardOpen)}
        aria-label={bingoBoardOpen ? 'Show article viewer' : 'Show bingo board'}
      >
        {bingoBoardOpen ? (
          <img src="/globe.png" alt="Wikipedia globe" className="bp-globe-icon" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
            <rect x="3" y="3" width="18" height="18" fill="none"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
          </svg>
        )}
      </button>
      {/* Overlay for mobile */}
      {bingoBoardOpen && (
        <div
          className="bp-bingo-overlay"
          onClick={() => setBingoBoardOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Left panel (grid + history) */}
      <section className={`bp-game-left ${bingoBoardOpen ? 'bp-game-left--open' : ''}`}>
        <header className="bp-game-scorebar bp-game-scorebar--desktop">
          <button type="button" className="bp-link-button" onClick={onBackToStart}>
            ← New Game
          </button>
          <div className="bp-game-metrics">
            <TimerDisplay 
              elapsedSeconds={elapsedSeconds} 
              prefix="Time: "
            />
            <span>Clicks: {clickCount}</span>
            {gameWon && (
              <span className="bp-game-status bp-game-status--won">
                Bingo!
              </span>
            )}
          </div>
        </header>
        <BingoGrid
          gridCells={gridCells}
          matchedArticles={matchedArticles}
          winningCells={winningCells}
          onCellClick={handleCellClick}
        />
        <HistoryPanel
          history={articleHistory}
          onArticleClick={handleHistoryClick}
          selectedArticle={currentArticleTitle}
          gridCells={gridCells}
        />
      </section>
      {/* Right panel (article viewer) */}
      <section className="bp-game-right">
        <ArticleViewer
          articleTitle={currentArticleTitle}
          onArticleClick={handleArticleClick}
          onLoadingChange={setArticleLoading}
          gameWon={gameWon}
          isPausedForLoading={isPausedForLoading}
        />
      </section>
    </div>
  )
}
