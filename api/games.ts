import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';
import { getGamesCollection, type GeneratedGame } from './mongoClient';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Generates a 16-character URL-safe hashed ID for shareable games.
 * Uses 12 random bytes converted to base64url encoding, truncated to 16 characters.
 *
 * @returns 16-character URL-safe hash
 */
function generateHashedId(): string {
  // Generate 12 random bytes (96 bits)
  const bytes = randomBytes(12);
  // Convert to base64url (URL-safe, no padding)
  return bytes.toString('base64url').substring(0, 16);
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
 * Vercel serverless function handler for the games API.
 *
 * Supports the following endpoints:
 * - POST /api/games: Creates a new shareable game entry
 * - GET /api/games?link=...: Retrieves a shareable game by link
 * - OPTIONS: Handles CORS preflight requests
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
    const collection = await getGamesCollection();

    if (req.method === 'GET') {
      if (req.query.debug === 'true') {
        const total = await collection.countDocuments();
        const recent = await collection
          .find({}, { projection: { link: 1, createdAt: 1 } })
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();

        res.status(200).json({
          collection: 'generated-games',
          total,
          recentLinks: recent.map((doc) => ({ link: doc.link, createdAt: doc.createdAt })),
        });
        return;
      }

      const link = ((req.query.link as string) || '').trim();

      if (!isValidHashedId(link)) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Invalid game link format. Expected 16-character link hash',
            { field: 'link', value: link }
          )
        );
        return;
      }

      const game = await collection.findOne({ link });

      if (!game) {
        res.status(404).json(
          createErrorResponse(
            'NOT_FOUND',
            'Game not found',
            { link }
          )
        );
        return;
      }

      const { _id, ...gameState } = game;
      res.status(200).json(gameState);
      return;
    }

    if (req.method === 'POST') {
      const { bingopediaGame } = req.body || {};

      if (!Array.isArray(bingopediaGame) || bingopediaGame.length !== 26) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'bingopediaGame must be an array with exactly 26 elements',
            { field: 'bingopediaGame', received: Array.isArray(bingopediaGame) ? bingopediaGame.length : typeof bingopediaGame }
          )
        );
        return;
      }

      // Generate hashed ID with collision handling (max 3 attempts)
      let link: string;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        link = generateHashedId();
        try {
          // Try to insert with the generated hashedId
          const gameState: GeneratedGame = {
            link,
            bingopediaGame: bingopediaGame.map(String),
            createdAt: new Date(),
            timesPlayed: 0,
          };

          const result = await collection.insertOne(gameState);
          const insertedGame = { ...gameState, _id: result.insertedId };

          res.status(201).json(insertedGame);
          return;
        } catch (error) {
          const err = error as Error;
          // Check if error is due to unique constraint violation on hashedId
          if (err.message.includes('duplicate key') || err.message.includes('E11000')) {
            attempts++;
            if (attempts >= maxAttempts) {
              console.error('Failed to generate unique hashedId after', maxAttempts, 'attempts');
              res.status(500).json(
                createErrorResponse(
                  'SERVER_ERROR',
                  'Failed to generate unique game ID. Please try again.',
                  { attempts: maxAttempts }
                )
              );
              return;
            }
            // Retry with new hashedId
            continue;
          }
          // Re-throw if it's not a duplicate key error
          throw error;
        }
      }
    }

    res.setHeader('Allow', 'POST,OPTIONS');
    res.status(405).json(
      createErrorResponse(
        'METHOD_NOT_ALLOWED',
        `Method ${req.method} not allowed. Allowed methods: GET, POST, OPTIONS`,
        { method: req.method, allowedMethods: ['GET', 'POST', 'OPTIONS'] }
      )
    );
  } catch (error) {
    const err = error as Error;
    console.error('Games API error:', err);

    const context = req.method === 'GET' ? 'GET' : 'POST';
    const errorResponse = handleApiError(error, context);

    // Determine status code based on error type
    let status = 500;
    if (errorResponse.error.code === 'DATABASE_ERROR') {
      status = 503;
    } else if (
      errorResponse.error.code === 'VALIDATION_ERROR' ||
      errorResponse.error.code === 'MISSING_FIELD' ||
      errorResponse.error.code === 'NOT_FOUND'
    ) {
      status = errorResponse.error.code === 'NOT_FOUND' ? 404 : 400;
    } else if (errorResponse.error.code === 'METHOD_NOT_ALLOWED') {
      status = 405;
    }

    res.status(status).json(errorResponse);
  }
}

