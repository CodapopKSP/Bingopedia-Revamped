/**
 * Structured error response utilities for the leaderboard API.
 * Provides consistent error formatting with error codes, user-friendly messages,
 * and optional detailed information for debugging.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'MISSING_FIELD'
  | 'INVALID_VALUE'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_FOUND';

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * Creates a structured error response object with consistent formatting.
 *
 * The `details` field is only included when `NODE_ENV=development` to avoid
 * exposing sensitive information in production.
 *
 * @param code - Error code identifying the type of error (e.g., "VALIDATION_ERROR", "DATABASE_ERROR")
 * @param message - User-friendly error message that can be displayed to end users
 * @param details - Optional detailed error information for debugging (only included in development)
 * @returns Structured error response object following the ApiError interface
 *
 * @example
 * ```typescript
 * createErrorResponse('VALIDATION_ERROR', 'Username must be at most 50 characters', { field: 'username' })
 * // Returns: { error: { code: 'VALIDATION_ERROR', message: '...', details: {...} } }
 * ```
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ApiError {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return {
    error: {
      code,
      message,
      ...(isDevelopment && details !== undefined ? { details } : {}),
    },
  };
}

/**
 * Analyzes an error object and creates an appropriate structured error response.
 *
 * Automatically categorizes errors based on error message patterns:
 * - MongoDB connection/network errors → `DATABASE_ERROR` with 503 status
 * - Database query errors → `DATABASE_ERROR` with 503 status
 * - Other errors → `SERVER_ERROR` with 500 status
 *
 * @param error - The error object to analyze (can be any type)
 * @param context - Context about what operation was being performed ('GET' or 'POST')
 * @returns Structured error response with appropriate error code and message
 *
 * @remarks
 * Error categorization is based on case-insensitive string matching of error messages.
 * This function is designed to handle common MongoDB and database-related errors.
 *
 * @example
 * ```typescript
 * try {
 *   await collection.find({}).toArray();
 * } catch (error) {
 *   const errorResponse = handleApiError(error, 'GET');
 *   // Returns appropriate error code based on error type
 * }
 * ```
 */
export function handleApiError(error: unknown, context: 'GET' | 'POST'): ApiError {
  const err = error as Error;
  const errorMessage = err.message?.toLowerCase() || '';

  // MongoDB connection errors
  if (
    errorMessage.includes('mongodb') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network')
  ) {
    return createErrorResponse(
      'DATABASE_ERROR',
      'Unable to connect to the database. Please try again later.',
      err.message
    );
  }

  // Database query errors
  if (errorMessage.includes('query') || errorMessage.includes('find') || errorMessage.includes('insert')) {
    return createErrorResponse(
      'DATABASE_ERROR',
      'Database operation failed. Please try again later.',
      err.message
    );
  }

  // Generic server errors
  const defaultMessage =
    context === 'GET' ? 'Failed to fetch leaderboard' : 'Failed to save score';
  return createErrorResponse('SERVER_ERROR', defaultMessage, err.message);
}

