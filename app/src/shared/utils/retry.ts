import { DEFAULT_RETRY_OPTIONS } from '../constants'

/**
 * Retry configuration for API calls
 */
export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatuses?: number[]
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableStatuses'>> & { retryableStatuses: number[] } = {
  ...DEFAULT_RETRY_OPTIONS,
  retryableStatuses: [500, 502, 503, 504], // Server errors
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown, status?: number, retryableStatuses: number[]): boolean {
  // Network errors (fetch failures) are always retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  // 5xx server errors are retryable
  if (status && retryableStatuses.includes(status)) {
    return true
  }

  // Timeout errors
  if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('Timeout'))) {
    return true
  }

  return false
}

/**
 * Calculates delay for exponential backoff
 */
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number, backoffMultiplier: number): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Retries a function with exponential backoff.
 * 
 * Only retries on transient errors (network failures, 5xx responses, timeouts).
 * Does not retry on 4xx client errors (like 404).
 * 
 * @param fn - Function to retry (should return a Promise)
 * @param options - Retry configuration
 * @returns Promise resolving to the function's result
 * @throws The last error if all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if error is retryable
      const status = error instanceof Response ? error.status : undefined
      const isRetryable = isRetryableError(error, status, opts.retryableStatuses)

      // Don't retry on last attempt or if error is not retryable
      if (attempt === opts.maxAttempts || !isRetryable) {
        throw error
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, opts.initialDelay, opts.maxDelay, opts.backoffMultiplier)
      console.warn(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms:`, error instanceof Error ? error.message : String(error))
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}

