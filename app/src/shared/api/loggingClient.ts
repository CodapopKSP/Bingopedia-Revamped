/**
 * Logging client for sending game events to the backend logging API.
 * 
 * All logging is non-blocking - failures will not interrupt game flow.
 * Events are sent asynchronously and errors are logged to console for debugging.
 */

export type LogEventType = 'game_started' | 'game_generated' | 'game_finished'

export interface LogEventMetadata {
  [key: string]: unknown
}

/**
 * Logs a game event to the backend logging API.
 * 
 * This function is non-blocking - logging failures will not interrupt the game.
 * Errors are logged to console for debugging but do not throw exceptions.
 * 
 * @param event - The type of event to log
 * @param metadata - Optional metadata to include with the event
 */
export async function logEvent(
  event: LogEventType,
  metadata?: LogEventMetadata
): Promise<void> {
  try {
    await fetch('/api/logging', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...metadata,
      }),
    })
  } catch (error) {
    // Logging failures should not break the game
    console.error('Failed to log event:', error)
  }
}

