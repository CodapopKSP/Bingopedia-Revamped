import { getApiBaseUrl } from './config'
import type { LeaderboardEntry } from '../../features/game/types'

export interface FetchLeaderboardParams {
  limit?: number
  page?: number
  sortBy?: 'score' | 'time' | 'clicks' | 'createdAt' | 'username'
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  gameType?: 'random' | 'repeat' | 'all'
}

export interface FetchLeaderboardResponse {
  users: LeaderboardEntry[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
  sort: {
    sortBy: string
    sortOrder: string
  }
}

export async function fetchLeaderboard(params: FetchLeaderboardParams = {}): Promise<FetchLeaderboardResponse> {
  const baseUrl = getApiBaseUrl()
  const url = new URL(baseUrl, window.location.origin)

  if (params.limit != null) url.searchParams.set('limit', String(params.limit))
  if (params.page != null) url.searchParams.set('page', String(params.page))
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder)
  if (params.dateFrom) url.searchParams.set('dateFrom', params.dateFrom)
  if (params.dateTo) url.searchParams.set('dateTo', params.dateTo)
  if (params.gameType) url.searchParams.set('gameType', params.gameType)

  // Debug: Log the actual URL being requested
  console.log('[Leaderboard Client] Request URL:', url.toString())
  console.log('[Leaderboard Client] Params:', { dateFrom: params.dateFrom, dateTo: params.dateTo })

  try {
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch leaderboard'
      
      // Try to extract error message from response
      try {
        const errorData = await response.json()
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message
        }
      } catch {
        // If response is not JSON, use status-based message
        if (response.status === 404) {
          errorMessage = 'Leaderboard endpoint not found'
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Access denied'
        } else {
          errorMessage = `Failed to fetch leaderboard (HTTP ${response.status})`
        }
      }
      
      console.error('Leaderboard fetch error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
      })
      
      throw new Error(errorMessage)
    }

    const json = (await response.json()) as FetchLeaderboardResponse
    return json
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Unable to connect to the server. Please check your internet connection.')
      console.error('Network error fetching leaderboard:', error)
      throw networkError
    }
    
    // Re-throw other errors
    throw error
  }
}

export interface SubmitScorePayload {
  username: string
  time: number
  clicks: number
  score: number
  bingoSquares: string[]
  bingopediaGame?: string[]
  history: string[]
  generatedGame?: string
  gameType?: 'random' | 'repeat'
}

export async function submitScore(payload: SubmitScorePayload): Promise<LeaderboardEntry> {
  const baseUrl = getApiBaseUrl()
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to submit score'
      
      // Try to extract error message from response
      try {
        const errorData = await response.json()
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message
        }
      } catch {
        // If response is not JSON, use status-based message
        if (response.status === 400) {
          errorMessage = 'Invalid score data. Please check your input.'
        } else if (response.status === 422) {
          errorMessage = 'Validation error. Username may be too long or invalid.'
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = `Failed to submit score (HTTP ${response.status})`
        }
      }
      
      console.error('Score submission error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
      })
      
      throw new Error(errorMessage)
    }

    const json = (await response.json()) as LeaderboardEntry
    return json
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Unable to connect to the server. Please check your internet connection.')
      console.error('Network error submitting score:', error)
      throw networkError
    }
    
    // Re-throw other errors
    throw error
  }
}


