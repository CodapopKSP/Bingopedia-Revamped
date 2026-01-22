import { useEffect, useRef } from 'react'

/**
 * Configuration for game timer behavior.
 */
export interface GameTimerConfig {
  /**
   * Whether the timer should be running.
   * Timer starts after first article navigation (not on game start).
   */
  timerRunning: boolean
  /**
   * Whether an article is currently loading.
   * Timer pauses during article loading and resumes when loading completes.
   */
  articleLoading: boolean
  /**
   * Whether the game has been won.
   * Timer stops when game is won.
   */
  gameWon: boolean
  /**
   * Callback to increment elapsed seconds.
   */
  onTick: () => void
}

/**
 * Custom hook that manages the game timer with automatic pause/resume logic.
 * 
 * Timer behavior:
 * - Starts when `timerRunning` becomes true (after first article loads)
 * - Pauses automatically when `articleLoading` is true
 * - Resumes when article loading completes (if timer was running)
 * - Stops when game is won
 * - Increments elapsed time every second via `onTick` callback
 * 
 * @param config - Timer configuration object
 */
export function useGameTimer(config: GameTimerConfig): void {
  const { timerRunning, articleLoading, gameWon, onTick } = config
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // Timer should run only if:
    // - timerRunning is true (started after first article)
    // - articleLoading is false (not paused during load)
    // - gameWon is false (game hasn't ended)
    const shouldRun = timerRunning && !articleLoading && !gameWon

    if (shouldRun && !timerRef.current) {
      // Start the timer
      timerRef.current = window.setInterval(() => {
        onTick()
      }, 1000)
    }

    if ((!shouldRun) && timerRef.current) {
      // Stop the timer (paused, stopped, or game won)
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [timerRunning, articleLoading, gameWon, onTick])
}

