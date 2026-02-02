import { useEffect, useRef } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import './Confetti.css'

interface ConfettiProps {
  play: boolean
  onComplete?: () => void
}

/**
 * Confetti animation component that plays when matches are found.
 * 
 * Uses Lottie animation for smooth, performant confetti effects.
 * Only plays once per match to avoid excessive animations.
 * 
 * @param props - Component props
 * @param props.play - Whether to play the animation
 * @param props.onComplete - Optional callback when animation completes
 */
export function Confetti({ play, onComplete }: ConfettiProps) {
  const hasPlayedRef = useRef(false)
  const playerRef = useRef<any>(null)
  const timeoutRef = useRef<number | null>(null)
  const completionHandlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (play && !hasPlayedRef.current && playerRef.current) {
      hasPlayedRef.current = true
      
      // Set up completion handler
      completionHandlerRef.current = () => {
        if (onComplete) {
          onComplete()
        }
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
      
      // Try to play the animation
      if (typeof playerRef.current.play === 'function') {
        playerRef.current.play()
      }
      
      // Listen for animation completion event if available
      if (playerRef.current.addEventListener) {
        playerRef.current.addEventListener('complete', completionHandlerRef.current)
      }
      
      // Fallback timeout: 3.5 seconds for both mobile and desktop
      const fallbackTimeout = 3500
      
      if (onComplete) {
        timeoutRef.current = window.setTimeout(() => {
          // Only call onComplete if animation hasn't already completed
          if (completionHandlerRef.current) {
            completionHandlerRef.current()
            completionHandlerRef.current = null
          }
        }, fallbackTimeout)
      }
    }
  }, [play, onComplete])

  useEffect(() => {
    if (!play) {
      hasPlayedRef.current = false
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      // Remove event listener when not playing
      if (playerRef.current && completionHandlerRef.current && playerRef.current.removeEventListener) {
        playerRef.current.removeEventListener('complete', completionHandlerRef.current)
      }
      completionHandlerRef.current = null
    }
  }, [play])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
      // Clean up event listener on unmount
      if (playerRef.current && completionHandlerRef.current && playerRef.current.removeEventListener) {
        playerRef.current.removeEventListener('complete', completionHandlerRef.current)
      }
    }
  }, [])

  if (!play) {
    return null
  }

  return (
    <div className="bp-confetti-container">
      <DotLottieReact
        src="/Confetti.lottie"
        loop={false}
        autoplay={true}
        className="bp-confetti-animation"
        dotLottieRefCallback={(player) => {
          playerRef.current = player
        }}
      />
    </div>
  )
}

