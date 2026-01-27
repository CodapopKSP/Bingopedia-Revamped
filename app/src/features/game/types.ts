import type { CuratedArticle } from '../../shared/data/types'

export interface GameGridCell {
  id: string
  article: CuratedArticle
}

export type GridIndex = number // 0–24 for a 5×5 board

export interface GameState {
  gameStarted: boolean
  gameWon: boolean
  gridCells: GameGridCell[]
  startingArticle: CuratedArticle | null
  matchedArticles: Set<string> // normalized titles
  winningCells: GridIndex[]
  clickCount: number
  elapsedSeconds: number
  timerRunning: boolean
  articleLoading: boolean
  articleHistory: string[] // titles in visit order
  currentArticleTitle: string | null
  hashedId?: string // 16-character hashed ID (primary identifier for shareable games)
  gameId?: string // UUID v4 (optional, for backward compatibility)
  gameType?: 'random' | 'repeat' // 'random' for new games, 'repeat' for shared/replayed games
}

/**
 * Leaderboard entry from the API.
 * MongoDB returns `_id`, so we use that as the primary identifier.
 */
export interface LeaderboardEntry {
  _id?: string // MongoDB document ID
  username: string
  score: number
  time: number
  clicks: number
  bingoSquares?: string[]
  bingopediaGame?: string[]
  history?: string[]
  createdAt: string | Date
  gameId?: string // UUID v4 for replay functionality
  gameType?: 'random' | 'repeat' // Game type
}

/**
 * Helper to get the ID from a leaderboard entry (handles both _id and legacy id for compatibility)
 */
export function getLeaderboardEntryId(entry: LeaderboardEntry): string | undefined {
  return entry._id
}


