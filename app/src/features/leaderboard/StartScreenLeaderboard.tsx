import { useEffect, useState } from 'react'
import { fetchLeaderboard, type FetchLeaderboardParams } from '../../shared/api/leaderboardClient'
import type { LeaderboardEntry, GameGridCell } from '../game/types'
import type { CuratedArticle } from '../../shared/data/types'
import { GameDetailsModal } from './GameDetailsModal'
import { formatTime } from '../../shared/utils/timeFormat'
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
type GameTypeFilter = 'random' | 'repeat' | 'all'

/**
 * Calculates date range for a time filter option.
 * Uses UTC timezone to match backend expectations.
 * 
 * @param filter - Time filter option
 * @returns Object with dateFrom and dateTo ISO strings, or empty object for 'all'
 */
function getDateRange(filter: TimeFilter): { dateFrom?: string; dateTo?: string } {
  if (filter === 'all') {
    return {}
  }

  const now = new Date()
  // Use UTC dates to match backend timezone handling
  const utcNow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ))
  
  // dateTo: End of today in UTC (23:59:59.999)
  const dateTo = new Date(Date.UTC(
    utcNow.getUTCFullYear(),
    utcNow.getUTCMonth(),
    utcNow.getUTCDate(),
    23,
    59,
    59,
    999
  ))
  
  let dateFrom: Date

  switch (filter) {
    case 'today':
      // Start of today in UTC (00:00:00.000)
      dateFrom = new Date(Date.UTC(
        utcNow.getUTCFullYear(),
        utcNow.getUTCMonth(),
        utcNow.getUTCDate(),
        0,
        0,
        0,
        0
      ))
      break
    case '7days':
      // 7 days ago, start of day in UTC
      dateFrom = new Date(Date.UTC(
        utcNow.getUTCFullYear(),
        utcNow.getUTCMonth(),
        utcNow.getUTCDate() - 7,
        0,
        0,
        0,
        0
      ))
      break
    case '30days':
      // 30 days ago, start of day in UTC
      dateFrom = new Date(Date.UTC(
        utcNow.getUTCFullYear(),
        utcNow.getUTCMonth(),
        utcNow.getUTCDate() - 30,
        0,
        0,
        0,
        0
      ))
      break
    case 'year':
      // Start of current year in UTC (January 1, 00:00:00.000)
      dateFrom = new Date(Date.UTC(
        utcNow.getUTCFullYear(),
        0,
        1,
        0,
        0,
        0,
        0
      ))
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
  onReplay?: (gameState: { gridCells: GameGridCell[]; startingArticle: CuratedArticle; gameId?: string; hashedId?: string; gameType?: 'random' | 'repeat' }) => Promise<void>
}

export function StartScreenLeaderboard({ onReplay }: StartScreenLeaderboardProps = {}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [sortBy, setSortBy] = useState<FetchLeaderboardParams['sortBy']>('score')
  // Default sort order is ascending (lower scores are better)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [gameTypeFilter, setGameTypeFilter] = useState<GameTypeFilter>('random')
  const [page, setPage] = useState(1)
  const [limit] = useState(20) // Increased from 5 to 20
  const [totalPages, setTotalPages] = useState(1)

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [sortBy, sortOrder, timeFilter, gameTypeFilter])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const dateRange = getDateRange(timeFilter)
        const res = await fetchLeaderboard({
          limit,
          page,
          sortBy,
          sortOrder,
          ...dateRange,
          gameType: gameTypeFilter,
        })
        if (!cancelled) {
          setEntries(res.users)
          setTotalPages(res.pagination.totalPages)
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
  }, [limit, page, sortBy, sortOrder, timeFilter, gameTypeFilter])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    const dateRange = getDateRange(timeFilter)
    fetchLeaderboard({
      limit,
      page,
      sortBy,
      sortOrder,
      ...dateRange,
      gameType: gameTypeFilter,
    })
      .then((res) => {
        setEntries(res.users)
        setTotalPages(res.pagination.totalPages)
        setLoading(false)
      })
      .catch(() => {
        setError('Unable to load leaderboard right now.')
        setLoading(false)
      })
  }

  const handleSort = (field: FetchLeaderboardParams['sortBy']) => {
    // Only allow sorting on score, time, and clicks
    // Always sort ascending (low to high)
    if (field === 'score' || field === 'time' || field === 'clicks') {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIndicator = (field: FetchLeaderboardParams['sortBy']) => {
    // No arrows, just use highlighting
    return null
  }

  return (
    <div className="bp-start-leaderboard">
      <div className="bp-leaderboard-header">
        <h3>Top Scores</h3>
        <div className="bp-leaderboard-filters">
          <select
            id="time-filter"
            className="bp-leaderboard-filter-select bp-leaderboard-filter-select-time"
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
          <select
            id="game-type-filter"
            className="bp-leaderboard-filter-select bp-leaderboard-filter-select-game-type"
            value={gameTypeFilter}
            onChange={(e) => setGameTypeFilter(e.target.value as GameTypeFilter)}
            aria-label="Filter by game type"
          >
            <option value="random">Random Games</option>
            <option value="repeat">Repeat Games</option>
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
        <>
          <table className="bp-leaderboard-table">
            <thead>
              <tr>
                <th className="bp-leaderboard-number-header">#</th>
                <th>Player</th>
                <th>
                  <button
                    type="button"
                    className={`bp-leaderboard-sort-button ${sortBy === 'score' ? 'bp-leaderboard-sort-button--active' : ''}`}
                    onClick={() => handleSort('score')}
                    aria-label="Sort by score"
                  >
                    Score
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`bp-leaderboard-sort-button ${sortBy === 'time' ? 'bp-leaderboard-sort-button--active' : ''}`}
                    onClick={() => handleSort('time')}
                    aria-label="Sort by time"
                  >
                    Time
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`bp-leaderboard-sort-button ${sortBy === 'clicks' ? 'bp-leaderboard-sort-button--active' : ''}`}
                    onClick={() => handleSort('clicks')}
                    aria-label="Sort by clicks"
                  >
                    Clicks
                  </button>
                </th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const rowNumber = (page - 1) * limit + index + 1
                return (
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
                    <td className="bp-leaderboard-number-cell">{rowNumber}</td>
                    <td>{entry.username}</td>
                    <td>{entry.score.toLocaleString()}</td>
                    <td>{formatTime(entry.time)}</td>
                    <td>{entry.clicks}</td>
                    <td>{entry.createdAt ? formatDate(entry.createdAt) : 'N/A'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="bp-pagination">
              <button
                type="button"
                className="bp-pagination-button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="bp-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="bp-pagination-button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </>
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


