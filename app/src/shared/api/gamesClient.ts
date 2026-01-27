// Removed getApiBaseUrl import - using direct paths instead

export interface GameStateResponse {
  link: string
  bingopediaGame: string[]
  createdAt: string | Date
  timesPlayed: number
}

export interface CreateGamePayload {
  bingopediaGame: string[]
}

/**
 * Validates if a string is a valid hashed ID (16 characters, URL-safe).
 * @param id - String to validate
 * @returns True if valid hashed ID format
 */
export function isValidHashedId(id: string): boolean {
  // Hashed ID is 16 characters, URL-safe (A-Za-z0-9_-)
  return /^[A-Za-z0-9_-]{16}$/.test(id)
}

/**
 * Fetches a game state by hashedId (preferred) or gameId (backward compatibility) from the API.
 * @param identifier - Hashed ID (16 chars) or UUID v4 game identifier
 * @returns Game state response
 * @throws Error if game not found or request fails
 */
export async function fetchGame(identifier: string): Promise<GameStateResponse> {
  const queryUrl = new URL('/api/games', window.location.origin)
  queryUrl.searchParams.set('link', identifier)
  const pathUrl = new URL(`/api/games/${identifier}`, window.location.origin)

  try {
    const queryResponse = await fetch(queryUrl.toString())
    if (queryResponse.ok) {
      const json = (await queryResponse.json()) as GameStateResponse
      if (!Array.isArray(json.bingopediaGame) || json.bingopediaGame.length !== 26) {
        throw new Error('Invalid game data received from API.')
      }
      return json
    }

    const response = await fetch(pathUrl.toString())

    if (!response.ok) {
      let errorMessage = 'Failed to fetch game'

      try {
        const errorData = await response.json()
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error?.message || errorData.message || errorMessage
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
 * @returns Created game state with hashedId (and optional gameId for backward compatibility)
 * @throws Error if creation fails
 */
export async function createGame(payload: CreateGamePayload): Promise<GameStateResponse> {
  // Use absolute path - don't manipulate base URL
  const url = new URL('/api/games', window.location.origin)

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
          errorMessage = errorData.error?.message || errorData.message || errorMessage
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

