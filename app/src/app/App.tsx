import { useState } from 'react'
import { AppLayout } from './AppLayout'
import { StartScreen } from '../features/game/StartScreen'
import { GameScreen } from '../features/game/GameScreen'
import { useGameState } from '../features/game/useGameState'
import { ErrorBoundary } from '../shared/components/ErrorBoundary'

/**
 * Root application component that manages the main view state.
 * 
 * Handles navigation between the start screen and game screen.
 * Wraps components in error boundaries for graceful error handling.
 * 
 * @returns The root app component
 */
export function App() {
  const [state, controls] = useGameState()
  const [view, setView] = useState<'start' | 'game'>('start')

  const handleStart = async () => {
    await controls.startNewGame()
    setView('game')
  }

  return (
    <AppLayout>
      <ErrorBoundary>
        {view === 'start' ? (
          <StartScreen onStart={handleStart} />
        ) : (
          <ErrorBoundary>
            <GameScreen state={state} controls={controls} onBackToStart={() => setView('start')} />
          </ErrorBoundary>
        )}
      </ErrorBoundary>
    </AppLayout>
  )
}


