import { useEffect, useState } from 'react'
import { fetchLeaderboard } from '../../shared/api/leaderboardClient'
import type { LeaderboardEntry } from '../game/types'
import { GameDetailsModal } from './GameDetailsModal'
import './StartScreenLeaderboard.css'

/**
 * Leaderboard preview component displayed on the start screen.
 * 
 * Shows the top 5 scores with loading states and error handling.
 * Clicking a row opens the GameDetailsModal to view that game's details.
 * 
 * @returns The leaderboard component
 */
export function StartScreenLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetchLeaderboard({ limit: 5, sortBy: 'score', sortOrder: 'desc' })
        if (!cancelled) {
          setEntries(res.users)
        }
      } catch (e) {
        if (!cancelled) {
          setError('Unable to load leaderboard right now.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    fetchLeaderboard({ limit: 5, sortBy: 'score', sortOrder: 'desc' })
      .then((res) => {
        setEntries(res.users)
        setLoading(false)
      })
      .catch((e) => {
        setError('Unable to load leaderboard right now.')
        setLoading(false)
      })
  }

  return (
    <div className="bp-start-leaderboard">
      <h3>Top Scores</h3>
      {loading && (
        <div className="bp-leaderboard-loading">
          <div className="bp-spinner" aria-label="Loading leaderboard"></div>
          <p className="bp-muted">Loading…</p>
        </div>
      )}
      {error && (
        <div className="bp-leaderboard-error">
          <p className="bp-error">{error}</p>
          <button onClick={handleRetry} className="bp-retry-button" aria-label="Retry loading leaderboard">
            Retry
          </button>
        </div>
      )}
      {!loading && !error && entries.length === 0 && <p className="bp-muted">No scores yet. Be the first!</p>}
      {!loading && !error && entries.length > 0 && (
        <table className="bp-leaderboard-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Score</th>
              <th>Time</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry._id || entry.username}
                className="bp-leaderboard-row"
                onClick={() => setSelectedEntry(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedEntry(entry)
                  }
                }}
                aria-label={`View details for ${entry.username}'s game`}
              >
                <td>{entry.username}</td>
                <td>{entry.score.toLocaleString()}</td>
                <td>{entry.time}s</td>
                <td>{entry.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedEntry && (
        <GameDetailsModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  )
}


