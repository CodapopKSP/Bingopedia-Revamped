import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGamesCollection } from '../mongoClient';
import { createErrorResponse, handleApiError } from '../errors';

/**
 * Applies CORS headers to the response.
 * Allows cross-origin requests from any origin for public API access.
 *
 * @param res - Vercel response object
 */
function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Validates UUID v4 format.
 *
 * @param uuid - UUID string to validate
 * @returns true if valid UUID v4, false otherwise
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates hashed ID format (16 characters, URL-safe).
 *
 * @param hashedId - Hashed ID string to validate
 * @returns true if valid hashed ID format, false otherwise
 */
function isValidHashedId(hashedId: string): boolean {
  // 16 characters, URL-safe base64url characters (A-Z, a-z, 0-9, -, _)
  const hashedIdRegex = /^[A-Za-z0-9_-]{16}$/;
  return hashedIdRegex.test(hashedId);
}

/**
 * Vercel serverless function handler for GET /api/games/:hashedId.
 *
 * Retrieves a game state by hashedId (preferred) or gameId (UUID, for backward compatibility).
 * Supports both 16-character hashed IDs and UUID v4 format.
 *
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @returns Promise that resolves when the response is sent
 *
 * @throws {Error} May throw errors for database connection issues or other server errors
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET,OPTIONS');
      res.status(405).json(
        createErrorResponse(
          'METHOD_NOT_ALLOWED',
          `Method ${req.method} not allowed. Allowed methods: GET, OPTIONS`,
          { method: req.method, allowedMethods: ['GET', 'OPTIONS'] }
        )
      );
      return;
    }

    const collection = await getGamesCollection();
    // Support both hashedId and gameId route parameters for backward compatibility
    const identifier = (req.query.hashedId as string) || (req.query.gameId as string);

    if (!identifier) {
      res.status(400).json(
        createErrorResponse(
          'MISSING_FIELD',
          'Game identifier (hashedId or gameId) is required',
          { field: 'hashedId' }
        )
      );
      return;
    }

    // Validate format: must be either hashedId (16 chars) or UUID v4
    if (!isValidHashedId(identifier) && !isValidUUID(identifier)) {
      res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid game identifier format. Expected 16-character hashed ID or UUID v4',
          { field: 'hashedId', value: identifier }
        )
      );
      return;
    }

    // Try hashedId first (preferred), then fall back to gameId (UUID) for backward compatibility
    let game = null;
    if (isValidHashedId(identifier)) {
      game = await collection.findOne({ hashedId: identifier });
    }
    
    // If not found by hashedId, try UUID (backward compatibility)
    if (!game && isValidUUID(identifier)) {
      game = await collection.findOne({ gameId: identifier });
    }

    if (!game) {
      res.status(404).json(
        createErrorResponse(
          'NOT_FOUND',
          'Game not found',
          { identifier }
        )
      );
      return;
    }

    // Return game state without MongoDB _id
    const { _id, ...gameState } = game;
    res.status(200).json(gameState);
  } catch (error) {
    const err = error as Error;
    console.error('Games API error:', err);

    const errorResponse = handleApiError(error, 'GET');

    // Determine status code based on error type
    let status = 500;
    if (errorResponse.error.code === 'DATABASE_ERROR') {
      status = 503;
    } else if (
      errorResponse.error.code === 'VALIDATION_ERROR' ||
      errorResponse.error.code === 'MISSING_FIELD'
    ) {
      status = 400;
    } else if (errorResponse.error.code === 'NOT_FOUND') {
      status = 404;
    } else if (errorResponse.error.code === 'METHOD_NOT_ALLOWED') {
      status = 405;
    }

    res.status(status).json(errorResponse);
  }
}

