const DEFAULT_API_BASE = '/api/leaderboard'

/**
 * Gets the base URL for the leaderboard API.
 * 
 * Uses `VITE_API_URL` environment variable if set, otherwise falls back to
 * same-origin `/api/leaderboard` for Vercel serverless functions.
 * 
 * @returns The API base URL
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined
  return fromEnv?.trim() || DEFAULT_API_BASE
}


