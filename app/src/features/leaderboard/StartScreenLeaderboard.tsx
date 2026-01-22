import { useEffect, useState } from 'react'
import { fetchLeaderboard, type FetchLeaderboardParams } from '../../shared/api/leaderboardClient'
import type { LeaderboardEntry, GameGridCell } from '../game/types'
import type { CuratedArticle } from '../../shared/data/types'
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
/**
 * Formats a date string or Date object to "MMM DD, YYYY" format.
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj)
}

type TimeFilter = 'all' | 'today' | '7days' | '30days' | 'year'
type GameTypeFilter = 'fresh' | 'linked' | 'all'

/**
 * Calculates date range for a time filter option.
 * @param filter - Time filter option
 * @returns Object with dateFrom and dateTo ISO strings, or undefined for 'all'
 */
function getDateRange(filter: TimeFilter): { dateFrom?: string; dateTo?: string } {
  if (filter === 'all') {
    return {}
  }

  const now = new Date()
  const dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let dateFrom: Date

  switch (filter) {
    case 'today':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      break
    case '7days':
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFrom.setHours(0, 0, 0, 0)
      break
    case '30days':
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFrom.setHours(0, 0, 0, 0)
      break
    case 'year':
      dateFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      break
    default:
      return {}
  }

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  }
}

interface StartScreenLeaderboardProps {
  onReplay?: (gameState: { gridCells: GameGridCell[]; startingArticle: CuratedArticle; gameId?: string; gameType?: 'fresh' | 'linked' }) => Promise<void>
}

export function StartScreenLeaderboard({ onReplay }: StartScreenLeaderboardProps = {}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [sortBy, setSortBy] = useState<FetchLeaderboardParams['sortBy']>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [gameTypeFilter, setGameTypeFilter] = useState<GameTypeFilter>('fresh')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const dateRange = getDateRange(timeFilter)
        const res = await fetchLeaderboard({
          limit: 5,
          sortBy,
          sortOrder,
          ...dateRange,
          gameType: gameTypeFilter,
        })
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
  }, [sortBy, sortOrder, timeFilter, gameTypeFilter])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    const dateRange = getDateRange(timeFilter)
    fetchLeaderboard({
      limit: 5,
      sortBy,
      sortOrder,
      ...dateRange,
      gameType: gameTypeFilter,
    })
      .then((res) => {
        setEntries(res.users)
        setLoading(false)
      })
      .catch(() => {
        setError('Unable to load leaderboard right now.')
        setLoading(false)
      })
  }

  const handleSort = (field: FetchLeaderboardParams['sortBy']) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new sort field
      // Default sort orders:
      // - createdAt: desc (newer first)
      // - username: asc (alphabetical)
      // - score, time, clicks: asc (lower is better)
      setSortBy(field)
      if (field === 'createdAt') {
        setSortOrder('desc')
      } else if (field === 'username') {
        setSortOrder('asc')
      } else {
        // score, time, clicks: ascending (lower is better)
        setSortOrder('asc')
      }
    }
  }

  const getSortIndicator = (field: FetchLeaderboardParams['sortBy']) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="bp-start-leaderboard">
      <div className="bp-leaderboard-header">
        <h3>Top Scores</h3>
        <div className="bp-leaderboard-filters">
          <label htmlFor="time-filter" className="bp-leaderboard-filter-label">
            Time Period:
          </label>
          <select
            id="time-filter"
            className="bp-leaderboard-filter-select"
            value={timeFilter}
            onChange={(e) => {
              setTimeFilter(e.target.value as TimeFilter)
            }}
            aria-label="Filter by time period"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
            <option value="year">Past Year</option>
          </select>
          <label htmlFor="game-type-filter" className="bp-leaderboard-filter-label">
            Game Type:
          </label>
          <select
            id="game-type-filter"
            className="bp-leaderboard-filter-select"
            value={gameTypeFilter}
            onChange={(e) => setGameTypeFilter(e.target.value as GameTypeFilter)}
            aria-label="Filter by game type"
          >
            <option value="fresh">Fresh Games</option>
            <option value="linked">Linked Games</option>
            <option value="all">All Games</option>
          </select>
        </div>
      </div>
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
              <th>
                <button
                  type="button"
                  className="bp-leaderboard-sort-button"
                  onClick={() => handleSort('username')}
                  aria-label="Sort by username"
                >
                  Player{getSortIndicator('username')}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="bp-leaderboard-sort-button"
                  onClick={() => handleSort('score')}
                  aria-label="Sort by score"
                >
                  Score{getSortIndicator('score')}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="bp-leaderboard-sort-button"
                  onClick={() => handleSort('time')}
                  aria-label="Sort by time"
                >
                  Time{getSortIndicator('time')}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="bp-leaderboard-sort-button"
                  onClick={() => handleSort('clicks')}
                  aria-label="Sort by clicks"
                >
                  Clicks{getSortIndicator('clicks')}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="bp-leaderboard-sort-button"
                  onClick={() => handleSort('createdAt')}
                  aria-label="Sort by date"
                >
                  Date{getSortIndicator('createdAt')}
                </button>
              </th>
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
                <td>{entry.createdAt ? formatDate(entry.createdAt) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedEntry && (
        <GameDetailsModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onReplay={onReplay}
        />
      )}
    </div>
  )
}


