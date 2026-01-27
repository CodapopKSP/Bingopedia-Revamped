import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook that provides a debounced timer display value to minimize re-renders.
 * 
 * The timer value is stored in a ref and only updates the display state periodically
 * to prevent excessive re-renders that can cause UI issues (modal closing, scroll reset, focus loss).
 * 
 * Enhanced with aggressive batching:
 * - Time-based throttling: only update display if >500ms has passed since last render
 * - Value-based throttling: only update if value changed by >1 second
 * - Uses requestAnimationFrame for smooth updates
 * 
 * @param elapsedSeconds - The actual elapsed seconds from game state (used for scoring)
 * @returns The display value that updates less frequently
 */
export function useTimerDisplay(elapsedSeconds: number): number {
  const [displaySeconds, setDisplaySeconds] = useState(elapsedSeconds)
  const lastUpdateRef = useRef<number>(elapsedSeconds)
  const rafRef = useRef<number | null>(null)
  const lastRenderedRef = useRef<number>(Date.now())

  useEffect(() => {
    // Update the ref immediately (no re-render)
    lastUpdateRef.current = elapsedSeconds
    
    // Only update display if:
    // 1. More than 500ms has passed since last render, OR
    // 2. Value changed by more than 1 second
    const timeSinceLastRender = Date.now() - lastRenderedRef.current
    const valueDiff = Math.abs(displaySeconds - elapsedSeconds)
    const shouldUpdate = timeSinceLastRender > 500 || valueDiff > 1

    if (shouldUpdate && rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplaySeconds(lastUpdateRef.current)
        lastRenderedRef.current = Date.now()
        rafRef.current = null
      })
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [elapsedSeconds, displaySeconds])

  // Ensure display is never behind by more than 1 second
  // This handles cases where RAF might be delayed
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.abs(displaySeconds - lastUpdateRef.current) > 1) {
        setDisplaySeconds(lastUpdateRef.current)
        lastRenderedRef.current = Date.now()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [displaySeconds])

  return displaySeconds
}

