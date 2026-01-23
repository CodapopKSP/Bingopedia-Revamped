import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLoggingCollection } from './mongoClient';
import { createErrorResponse, handleApiError } from './errors';

/**
 * Applies CORS headers to the response.
 * Allows cross-origin requests from any origin for public API access.
 *
 * @param res - Vercel response object
 */
function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Event types supported by the logging system.
 */
type EventType = 'game_started' | 'game_generated' | 'game_finished';

interface LoggingRequest {
  event: EventType;
  timestamp: string | Date;
  gameId?: string;
  hashedId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Vercel serverless function handler for POST /api/logging.
 *
 * Logs game events to MongoDB time series collection.
 * Events are non-blocking - logging failures don't throw errors.
 *
 * Supported event types:
 * - 'game_started': When user clicks "Start Game"
 * - 'game_generated': When shareable game is created
 * - 'game_finished': When game is won
 *
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @returns Promise that resolves when the response is sent
 *
 * @remarks
 * - Logging failures are caught and logged but don't break the response
 * - Events are stored in 'game_events' time series collection
 * - Timestamp is converted to Date object for storage
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,OPTIONS');
    res.status(405).json(
      createErrorResponse(
        'METHOD_NOT_ALLOWED',
        `Method ${req.method} not allowed. Allowed methods: POST, OPTIONS`,
        { method: req.method, allowedMethods: ['POST', 'OPTIONS'] }
      )
    );
    return;
  }

  try {
    const { event, timestamp, gameId, hashedId, metadata } = req.body as LoggingRequest;

    // Validate required fields
    if (!event || !timestamp) {
      res.status(400).json(
        createErrorResponse(
          'MISSING_FIELD',
          'event and timestamp are required',
          { missingFields: !event ? ['event'] : [], missingTimestamp: !timestamp }
        )
      );
      return;
    }

    // Validate event type
    const validEventTypes: EventType[] = ['game_started', 'game_generated', 'game_finished'];
    if (!validEventTypes.includes(event)) {
      res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`,
          { field: 'event', value: event }
        )
      );
      return;
    }

    // Convert timestamp to Date object
    const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid timestamp format. Expected ISO date string or Date object',
          { field: 'timestamp', value: timestamp }
        )
      );
      return;
    }

    // Store event in time series collection (non-blocking)
    try {
      const collection = await getLoggingCollection();
      await collection.insertOne({
        event,
        timestamp: timestampDate,
        gameId: gameId || null,
        hashedId: hashedId || null,
        ...(metadata && { ...metadata }),
      });
    } catch (loggingError) {
      // Log error but don't fail the request (non-blocking)
      console.error('Logging error (non-blocking):', loggingError);
    }

    // Always return success (logging is non-blocking)
    res.status(200).json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('Logging API error:', err);

    const errorResponse = handleApiError(error, 'POST');

    // Determine status code based on error type
    let status = 500;
    if (errorResponse.error.code === 'DATABASE_ERROR') {
      status = 503;
    } else if (
      errorResponse.error.code === 'VALIDATION_ERROR' ||
      errorResponse.error.code === 'MISSING_FIELD'
    ) {
      status = 400;
    } else if (errorResponse.error.code === 'METHOD_NOT_ALLOWED') {
      status = 405;
    }

    res.status(status).json(errorResponse);
  }
}

