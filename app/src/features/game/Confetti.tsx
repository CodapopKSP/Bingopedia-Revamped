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

  useEffect(() => {
    if (play && !hasPlayedRef.current && playerRef.current) {
      hasPlayedRef.current = true
      // Try to play the animation
      if (typeof playerRef.current.play === 'function') {
        playerRef.current.play()
      }
      // Set timeout to call onComplete after animation duration (approximately 2 seconds)
      if (onComplete) {
        timeoutRef.current = window.setTimeout(() => {
          onComplete()
        }, 2000)
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
    }
  }, [play])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
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

