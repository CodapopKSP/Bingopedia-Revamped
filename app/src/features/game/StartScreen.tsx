import './StartScreen.css'
import { StartScreenLeaderboard } from '../leaderboard/StartScreenLeaderboard'

interface StartScreenProps {
  onStart: () => void | Promise<void>
}

/**
 * Start screen component displayed before the game begins.
 * 
 * Shows the game title, rules, and leaderboard preview.
 * Provides the "Start Game" button to begin a new game.
 * 
 * @param props - Component props
 * @param props.onStart - Callback when "Start Game" is clicked
 */
export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="bp-start-screen">
      <section className="bp-start-hero">
        <div>
          <h2>Wiki Bingo, Reimagined</h2>
          <p>
            Navigate Wikipedia from a random starting article to complete a 5×5 bingo card of
            target articles. Every click and every second counts toward your final score.
          </p>
          <button className="bp-start-button" type="button" onClick={() => void onStart()} aria-label="Start a new game">
            Start Game
          </button>
        </div>
      </section>
      <section className="bp-start-leaderboard-shell">
        <StartScreenLeaderboard />
      </section>
    </div>
  )
}


