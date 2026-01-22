import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook that provides a debounced timer display value to minimize re-renders.
 * 
 * The timer value is stored in a ref and only updates the display state periodically
 * to prevent excessive re-renders that can cause UI issues (modal closing, scroll reset, focus loss).
 * 
 * @param elapsedSeconds - The actual elapsed seconds from game state (used for scoring)
 * @returns The display value that updates less frequently
 */
export function useTimerDisplay(elapsedSeconds: number): number {
  const [displaySeconds, setDisplaySeconds] = useState(elapsedSeconds)
  const lastUpdateRef = useRef<number>(elapsedSeconds)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Update the ref immediately (no re-render)
    lastUpdateRef.current = elapsedSeconds

    // Schedule a display update on the next animation frame
    // This batches updates and prevents excessive re-renders
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplaySeconds(lastUpdateRef.current)
        rafRef.current = null
      })
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [elapsedSeconds])

  // Ensure display is never behind by more than 1 second
  // This handles cases where RAF might be delayed
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.abs(displaySeconds - lastUpdateRef.current) > 1) {
        setDisplaySeconds(lastUpdateRef.current)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [displaySeconds])

  return displaySeconds
}

