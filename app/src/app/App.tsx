import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { AppLayout } from './AppLayout'
import { StartScreen } from '../features/game/StartScreen'
import { GameScreen } from '../features/game/GameScreen'
import { useGameState } from '../features/game/useGameState'
import { ErrorBoundary } from '../shared/components/ErrorBoundary'
import { ThemeProvider } from '../shared/theme/ThemeContext'
import { logEvent } from '../shared/api/loggingClient'

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

  // Memoize onMatch callback to prevent useGameState from recreating registerNavigation on every render
  // This prevents ArticleViewer from re-rendering every second when timer ticks
  const onMatch = useCallback((title: string) => {
    // Call the callback if it's been set
    if (onMatchRef.current) {
      onMatchRef.current(title)
    }
  }, []) // Empty deps - uses ref for latest value

  // Memoize options object to prevent useGameState from seeing it as a new object on every render
  const gameStateOptions = useMemo(() => ({ onMatch }), [onMatch])

  const [state, controls] = useGameState(gameStateOptions)

  // Check for game in URL on mount (path-based or query param for backward compatibility)
  useEffect(() => {
    const pathname = window.location.pathname
    const urlParams = new URLSearchParams(window.location.search)
    
    // Try path-based routing first: /{hashedId}
    const pathHashedId = pathname.substring(1) // Remove leading slash
    const isValidHashedId = pathHashedId && pathHashedId.length === 16 && /^[A-Za-z0-9_-]+$/.test(pathHashedId)
    
    // Fall back to query param for backward compatibility: ?game=uuid
    const queryGameId = urlParams.get('game')
    
    const identifier = isValidHashedId ? pathHashedId : queryGameId

    if (identifier) {
      // Load game from URL (path-based or query param)
      controls
        .loadGameFromId(identifier)
        .then(() => {
          setView('game')
          setGameLoadError(null)
          // Clean up URL: remove query param if present, or update to path-based format
          if (queryGameId) {
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('game')
            window.history.replaceState({}, '', newUrl.toString())
          } else if (isValidHashedId && pathname !== `/${pathHashedId}`) {
            // Ensure path is correct
            window.history.replaceState({}, '', `/${pathHashedId}`)
          }
        })
        .catch((error) => {
          console.error('Failed to load game from URL:', error)
          setGameLoadError(error instanceof Error ? error.message : 'Failed to load game')
          // Still allow starting a new game
        })
    }
  }, [])

  const handleStart = async () => {
    setGameLoadError(null)
    await controls.startNewGame()
    // Log game_started event (non-blocking)
    void logEvent('game_started')
    setView('game')
  }

  const handleReplay = async (gameState: { gridCells: any[]; startingArticle: any; gameId?: string; hashedId?: string; gameType?: 'random' | 'repeat' }) => {
    setGameLoadError(null)
    try {
      // Prefer hashedId, fall back to gameId for backward compatibility
      const identifier = gameState.hashedId || gameState.gameId
      if (identifier) {
        // Load from hashedId or gameId, preserving gameId if provided (for replay scenarios)
        await controls.loadGameFromId(identifier, gameState.gameId)
        
        // Update URL to the game's link (path-based format: /{hashedId})
        // Only update if we have a hashedId (16-character hash), not for legacy gameId (UUID)
        if (gameState.hashedId && gameState.hashedId.length === 16 && /^[A-Za-z0-9_-]+$/.test(gameState.hashedId)) {
          const newPath = `/${gameState.hashedId}`
          if (window.location.pathname !== newPath) {
            window.history.pushState({}, '', newPath)
          }
        }
      } else if (gameState.gridCells && gameState.gridCells.length > 0 && gameState.startingArticle) {
        // Start with provided state (reconstructed from bingoSquares/history)
        await controls.startNewGame(gameState)
        // Clear URL for reconstructed games (no shareable link)
        if (window.location.pathname !== '/' || window.location.search) {
          window.history.pushState({}, '', '/')
        }
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
                onBackToStart={() => {
                  // Reset URL to home when starting a new game
                  if (window.location.pathname !== '/' || window.location.search) {
                    window.history.pushState({}, '', '/')
                  }
                  setView('start')
                }}
                onMatchCallbackReady={(callback) => {
                  onMatchRef.current = callback
                }}
              />
            </ErrorBoundary>
          )}
        </ErrorBoundary>
      </AppLayout>
      <Analytics />
    </ThemeProvider>
  )
}


