/**
 * Shared constants used throughout the application.
 */

// Game configuration
export const GRID_SIZE = 5
export const GRID_CELL_COUNT = GRID_SIZE * GRID_SIZE
export const STARTING_POOL_SIZE = GRID_CELL_COUNT + 1 // 25 grid + 1 starting article

// Cache limits
export const MAX_ARTICLE_CACHE_SIZE = 100
export const MAX_REDIRECT_CACHE_SIZE = 200

// Validation limits
export const MAX_USERNAME_LENGTH = 50

// API configuration
export const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org'
export const WIKIPEDIA_MOBILE_API_BASE = 'https://en.m.wikipedia.org'

// Retry configuration
export const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 4000, // 4 seconds
  backoffMultiplier: 2,
} as const

