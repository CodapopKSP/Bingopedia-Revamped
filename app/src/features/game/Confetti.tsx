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

  useEffect(() => {
    if (play && !hasPlayedRef.current && playerRef.current) {
      hasPlayedRef.current = true
      if (playerRef.current.seek) {
        playerRef.current.seek(0.2)
      } else if (playerRef.current.setFrame) {
        playerRef.current.setFrame(12)
      }
      playerRef.current.play()
    }
  }, [play])

  const handleComplete = () => {
    hasPlayedRef.current = false
    if (onComplete) {
      onComplete()
    }
  }

  useEffect(() => {
    if (!play) {
      hasPlayedRef.current = false
    }
  }, [play])

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
          if (play && !hasPlayedRef.current && player) {
            hasPlayedRef.current = true
            if (player.seek) {
              player.seek(0.2)
            } else if (player.setFrame) {
              player.setFrame(12)
            }
            player.play()
          }
        }}
        onComplete={handleComplete}
      />
    </div>
  )
}

