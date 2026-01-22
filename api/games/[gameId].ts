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
 * Vercel serverless function handler for GET /api/games/:gameId.
 *
 * Retrieves a game state by gameId.
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
    const gameId = req.query.gameId as string;

    if (!gameId) {
      res.status(400).json(
        createErrorResponse(
          'MISSING_FIELD',
          'gameId is required',
          { field: 'gameId' }
        )
      );
      return;
    }

    if (!isValidUUID(gameId)) {
      res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid gameId format. Expected UUID v4',
          { field: 'gameId', value: gameId }
        )
      );
      return;
    }

    const game = await collection.findOne({ gameId });

    if (!game) {
      res.status(404).json(
        createErrorResponse(
          'NOT_FOUND',
          'Game not found',
          { gameId }
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

