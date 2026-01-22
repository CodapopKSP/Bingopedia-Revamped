import { getApiBaseUrl } from './config'

export interface GameStateResponse {
  gameId: string
  gridCells: string[]
  startingArticle: string
  gameType: 'fresh' | 'linked'
  createdAt: string | Date
  createdBy?: string
}

export interface CreateGamePayload {
  gridCells: string[]
  startingArticle: string
  gameType: 'fresh' | 'linked'
  createdBy?: string
}

/**
 * Fetches a game state by gameId from the API.
 * @param gameId - UUID v4 game identifier
 * @returns Game state response
 * @throws Error if game not found or request fails
 */
export async function fetchGame(gameId: string): Promise<GameStateResponse> {
  // Construct URL for games API (similar structure to leaderboard API)
  const apiBase = getApiBaseUrl().replace('/leaderboard', '')
  const url = new URL(`${apiBase}/games/${gameId}`, window.location.origin)

  try {
    const response = await fetch(url.toString())

    if (!response.ok) {
      let errorMessage = 'Failed to fetch game'

      try {
        const errorData = await response.json()
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message
        }
      } catch {
        if (response.status === 404) {
          errorMessage = 'Game not found'
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = `Failed to fetch game (HTTP ${response.status})`
        }
      }

      throw new Error(errorMessage)
    }

    const json = (await response.json()) as GameStateResponse
    return json
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Unable to connect to the server.')
      throw networkError
    }
    throw error
  }
}

/**
 * Creates a new shareable game state.
 * @param payload - Game state data
 * @returns Created game state with gameId
 * @throws Error if creation fails
 */
export async function createGame(payload: CreateGamePayload): Promise<GameStateResponse> {
  // Construct URL for games API (similar structure to leaderboard API)
  const apiBase = getApiBaseUrl().replace('/leaderboard', '')
  const url = new URL(`${apiBase}/games`, window.location.origin)

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to create game'

      try {
        const errorData = await response.json()
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message
        }
      } catch {
        if (response.status === 400) {
          errorMessage = 'Invalid game data. Please check your input.'
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = `Failed to create game (HTTP ${response.status})`
        }
      }

      throw new Error(errorMessage)
    }

    const json = (await response.json()) as GameStateResponse
    return json
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Unable to connect to the server.')
      throw networkError
    }
    throw error
  }
}

