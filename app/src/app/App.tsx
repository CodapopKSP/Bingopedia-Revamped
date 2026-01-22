import { useState, useRef, useEffect } from 'react'
import { AppLayout } from './AppLayout'
import { StartScreen } from '../features/game/StartScreen'
import { GameScreen } from '../features/game/GameScreen'
import { useGameState } from '../features/game/useGameState'
import { ErrorBoundary } from '../shared/components/ErrorBoundary'
import { ThemeProvider } from '../shared/theme/ThemeContext'

/**
 * Root application component that manages the main view state.
 * 
 * Handles navigation between the start screen and game screen.
 * Wraps components in error boundaries for graceful error handling.
 * 
 * @returns The root app component
 */
export function App() {
  const [view, setView] = useState<'start' | 'game'>('start')
  const [gameLoadError, setGameLoadError] = useState<string | null>(null)
  const onMatchRef = useRef<((title: string) => void) | undefined>(undefined)

  const [state, controls] = useGameState({
    onMatch: (title: string) => {
      // Call the callback if it's been set
      if (onMatchRef.current) {
        onMatchRef.current(title)
      }
    },
  })

  // Check for game parameter in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const gameId = urlParams.get('game')

    if (gameId) {
      // Load game from URL parameter
      controls
        .loadGameFromId(gameId)
        .then(() => {
          setView('game')
          setGameLoadError(null)
          // Clean up URL to remove game parameter
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('game')
          window.history.replaceState({}, '', newUrl.toString())
        })
        .catch((error) => {
          console.error('Failed to load game from URL:', error)
          setGameLoadError(error instanceof Error ? error.message : 'Failed to load game')
          // Still allow starting a fresh game
        })
    }
  }, [controls])

  const handleStart = async () => {
    setGameLoadError(null)
    await controls.startNewGame()
    setView('game')
  }

  const handleReplay = async (gameState: { gridCells: any[]; startingArticle: any; gameId?: string; gameType?: 'fresh' | 'linked' }) => {
    setGameLoadError(null)
    try {
      if (gameState.gameId) {
        // Load from gameId
        await controls.loadGameFromId(gameState.gameId)
      } else if (gameState.gridCells && gameState.gridCells.length > 0 && gameState.startingArticle) {
        // Start with provided state (reconstructed from bingoSquares/history)
        await controls.startNewGame(gameState)
      } else {
        throw new Error('Cannot replay: missing game data')
      }
      setView('game')
    } catch (error) {
      console.error('Failed to replay game:', error)
      setGameLoadError(error instanceof Error ? error.message : 'Failed to replay game')
    }
  }

  return (
    <ThemeProvider>
      <AppLayout>
        <ErrorBoundary>
          {view === 'start' ? (
            <>
              {gameLoadError && (
                <div style={{ 
                  padding: '1rem', 
                  margin: '1rem', 
                  background: 'var(--status-error-bg)', 
                  border: '1px solid var(--status-error-border)', 
                  borderRadius: '0.5rem', 
                  color: 'var(--status-error-text)' 
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Error loading game:</p>
                  <p style={{ margin: '0.5rem 0 0 0' }}>{gameLoadError}</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>You can start a fresh game below.</p>
                </div>
              )}
              <StartScreen onStart={handleStart} onCreateShareableGame={controls.createShareableGame} onReplay={handleReplay} />
            </>
          ) : (
            <ErrorBoundary>
              <GameScreen
                state={state}
                controls={controls}
                onBackToStart={() => setView('start')}
                onMatchCallbackReady={(callback) => {
                  onMatchRef.current = callback
                }}
              />
            </ErrorBoundary>
          )}
        </ErrorBoundary>
      </AppLayout>
    </ThemeProvider>
  )
}


