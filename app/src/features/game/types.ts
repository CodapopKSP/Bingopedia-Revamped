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
  bingopediaGame?: string[]
  history?: string[]
  createdAt: string | Date
  gameType?: 'random' | 'repeat' // Game type
  /**
   * 16-character URL-safe hash ID uniquely identifying this leaderboard entry.
   * For repeat games, this references the game in the generated-games collection.
   * For random games, this is generated automatically.
   * Always present for new entries, but optional for backward compatibility with old entries.
   */
  generatedGame?: string
  /**
   * @deprecated Use bingopediaGame instead. This field is kept for backward compatibility with old entries.
   */
  bingoSquares?: string[]
}

/**
 * Helper to get the ID from a leaderboard entry (handles both _id and legacy id for compatibility)
 */
export function getLeaderboardEntryId(entry: LeaderboardEntry): string | undefined {
  return entry._id
}


