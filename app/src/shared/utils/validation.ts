import { MAX_USERNAME_LENGTH } from '../constants'

/**
 * Validates a username for leaderboard submission.
 * 
 * @param username - The username to validate
 * @returns Error message if validation fails, null if valid
 */
export function validateUsername(username: string): string | null {
  const trimmed = username.trim()
  if (!trimmed) {
    return 'Please enter a username'
  }
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return `Username must be ${MAX_USERNAME_LENGTH} characters or less`
  }
  return null
}

