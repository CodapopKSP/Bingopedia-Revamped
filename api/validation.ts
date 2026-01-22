/**
 * Validation utilities for leaderboard API.
 */

const MAX_USERNAME_LENGTH = 50;

/**
 * Validates and sanitizes a username.
 * - Trims whitespace
 * - Enforces maximum length
 * - Masks bad words
 *
 * @param username - Raw username input
 * @returns Sanitized username
 * @throws Error if username is empty or exceeds max length
 */
export function validateAndSanitizeUsername(username: string): {
  username: string;
  error?: string;
} {
  const trimmed = username.trim();

  if (!trimmed) {
    return { username: '', error: 'Username cannot be empty' };
  }

  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return {
      username: '',
      error: `Username must be at most ${MAX_USERNAME_LENGTH} characters`,
    };
  }

  return { username: maskBadWords(trimmed) };
}

/**
 * Validates score, time, and clicks values.
 *
 * @param score - Game score
 * @param time - Game time in seconds
 * @param clicks - Number of clicks/navigations
 * @returns Validation result with numeric values or error message
 */
export function validateScoreData(
  score: unknown,
  time: unknown,
  clicks: unknown
): {
  score: number;
  time: number;
  clicks: number;
  error?: string;
} {
  const numericScore = Number(score);
  const numericTime = Number(time) || 0;
  const numericClicks = Number(clicks) || 0;

  if (!Number.isFinite(numericScore) || numericScore < 0) {
    return {
      score: 0,
      time: 0,
      clicks: 0,
      error: 'Score must be a non-negative number',
    };
  }

  if (numericTime < 0 || numericClicks < 0) {
    return {
      score: 0,
      time: 0,
      clicks: 0,
      error: 'Time and clicks must be non-negative',
    };
  }

  return { score: numericScore, time: numericTime, clicks: numericClicks };
}

/**
 * Masks bad words in a username by replacing them with asterisks.
 *
 * **Intentionally Minimal Implementation:**
 * This filter uses a minimal word list as a basic profanity filter. It is designed
 * to catch the most obvious cases while remaining maintainable and avoiding false
 * positives. The list can be extended as needed, or replaced with a comprehensive
 * profanity filtering library (e.g., `bad-words`, `profanity-filter`) if more
 * thorough filtering is required.
 *
 * **Current Behavior:**
 * - Case-insensitive matching (already implemented)
 * - Replaces matched words with asterisks matching the word length
 * - Matches words anywhere in the string (not just whole words)
 *
 * **Future Enhancements:**
 * - Consider word boundaries to avoid false positives (e.g., "classic" containing "ass")
 * - Expand word list with common variations (plural, past tense, etc.)
 * - Evaluate and integrate a comprehensive profanity filtering library if needed
 *
 * @param username - Username to sanitize
 * @returns Username with bad words masked
 */
export function maskBadWords(username: string): string {
  // Intentionally minimal word list - can be extended or replaced with a library
  const badWords = ['fuck', 'shit', 'bitch'];
  let result = username;

  for (const word of badWords) {
    const regex = new RegExp(word, 'gi');
    if (regex.test(result)) {
      const mask = '*'.repeat(word.length);
      result = result.replace(regex, mask);
    }
  }

  return result;
}

/**
 * Calculates score from time and clicks.
 * Score = time * clicks (as per product spec).
 *
 * @param time - Game time in seconds
 * @param clicks - Number of clicks/navigations
 * @returns Calculated score
 */
export function calculateScore(time: number, clicks: number): number {
  return time * clicks;
}

