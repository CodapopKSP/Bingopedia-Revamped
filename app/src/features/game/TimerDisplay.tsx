import { memo } from 'react'
import { useTimerDisplay } from './useTimerDisplay'
import { formatTime } from '../../shared/utils/timeFormat'

interface TimerDisplayProps {
  /**
   * The actual elapsed seconds from game state (used for scoring accuracy).
   * Display updates are batched internally to minimize re-renders.
   */
  elapsedSeconds: number
  /**
   * Optional CSS class name for styling
   */
  className?: string
  /**
   * Optional prefix text (e.g., "Time: ")
   */
  prefix?: string
}

/**
 * Isolated timer display component that minimizes re-renders.
 * 
 * Uses React.memo to prevent unnecessary re-renders when parent components update.
 * Internally uses useTimerDisplay hook to batch display updates.
 * 
 * This component only re-renders when the timer display value actually changes,
 * not on every timer tick, preventing link flashing and scroll position loss.
 */
export const TimerDisplay = memo(({ elapsedSeconds, className, prefix }: TimerDisplayProps) => {
  const displaySeconds = useTimerDisplay(elapsedSeconds)
  const formattedTime = formatTime(displaySeconds)
  
  return (
    <span className={className}>
      {prefix && <span>{prefix}</span>}
      {formattedTime}
    </span>
  )
})

TimerDisplay.displayName = 'TimerDisplay'

