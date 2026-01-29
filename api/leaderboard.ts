import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLeaderboardCollection, getGamesCollection, type LeaderboardEntry } from './mongoClient';
import {
  validateAndSanitizeUsername,
  validateScoreData,
} from './validation';
import { createErrorResponse, handleApiError } from './errors';

type SortField = 'score' | 'clicks' | 'time' | 'createdAt' | 'username';
type SortOrder = 'asc' | 'desc';

interface LeaderboardQuery {
  limit?: string;
  page?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  dateFrom?: string;
  dateTo?: string;
  gameType?: 'random' | 'repeat' | 'all';
}

/**
 * Parses and validates query parameters for leaderboard requests.
 *
 * Default behavior:
 * - sortOrder defaults to 'asc' (lower scores rank higher)
 * - When sorting by score, entries with equal scores are sorted by createdAt ascending (earlier dates rank higher)
 *
 * @param query - Query parameters from the request
 * @returns Parsed and validated query parameters with defaults applied
 * @throws Error if date parameters are invalid
 */
function parseQuery(query: LeaderboardQuery) {
  const limit = Math.max(parseInt(query.limit ?? '10', 10) || 10, 1);
  const page = Math.max(parseInt(query.page ?? '1', 10) || 1, 1);
  const sortBy: SortField = (query.sortBy as SortField) || 'score';
  // Default to ascending sort order (lower scores rank higher)
  const sortOrder: SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

  const validSortFields: SortField[] = ['score', 'clicks', 'time', 'createdAt', 'username'];
  const sortField: SortField = validSortFields.includes(sortBy) ? sortBy : 'score';

  // Parse and validate date parameters
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (query.dateFrom) {
    dateFrom = new Date(query.dateFrom);
    if (isNaN(dateFrom.getTime())) {
      throw new Error('Invalid dateFrom format. Expected ISO date string (e.g., 2024-01-01T00:00:00Z)');
    }
  }

  if (query.dateTo) {
    dateTo = new Date(query.dateTo);
    if (isNaN(dateTo.getTime())) {
      throw new Error('Invalid dateTo format. Expected ISO date string (e.g., 2024-01-31T23:59:59Z)');
    }
  }

  // Validate date range
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new Error('dateFrom must be before or equal to dateTo');
  }

  // Parse and validate gameType
  const gameType = query.gameType || 'random';
  if (gameType !== 'random' && gameType !== 'repeat' && gameType !== 'all') {
    throw new Error("gameType must be 'random', 'repeat', or 'all'");
  }

  return { limit, page, sortField, sortOrder, dateFrom, dateTo, gameType };
}

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
  // Disable caching for leaderboard API to ensure filters work correctly
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * Vercel serverless function handler for the leaderboard API.
 *
 * Supports the following endpoints:
 * - GET /api/leaderboard: Retrieves paginated leaderboard entries with optional sorting
 * - POST /api/leaderboard: Submits a new leaderboard entry
 * - OPTIONS: Handles CORS preflight requests
 *
 * @param req - Vercel request object
 * @param res - Vercel response object
 * @returns Promise that resolves when the response is sent
 *
 * @throws {Error} May throw errors for database connection issues or other server errors
 * @remarks
 * - GET requests support pagination via `limit` and `page` query parameters
 * - GET requests support sorting via `sortBy` and `sortOrder` query parameters
 * - POST requests require `username` and `score` fields
 * - All errors are returned in a structured format with error codes
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const collection = await getLeaderboardCollection();

    if (req.method === 'GET') {
      let parsedQuery;
      try {
        parsedQuery = parseQuery(req.query as LeaderboardQuery);
      } catch (error) {
        const err = error as Error;
        res.status(400).json(
          createErrorResponse('VALIDATION_ERROR', err.message, { field: 'date', value: req.query })
        );
        return;
      }

      const { limit, page, sortField, sortOrder, dateFrom, dateTo, gameType } = parsedQuery;
      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      // Build date filter
      // Date filtering uses UTC timezone
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom || dateTo) {
        dateFilter.createdAt = {};
        if (dateFrom) {
          const fromDate = dateFrom instanceof Date ? dateFrom : new Date(dateFrom);
          dateFilter.createdAt.$gte = fromDate;
        }
        if (dateTo) {
          // Frontend already sends dateTo as end of day (23:59:59.999), use it directly
          const toDate = dateTo instanceof Date ? dateTo : new Date(dateTo);
          dateFilter.createdAt.$lte = toDate;
        }
      }
      
      // Debug logging - check what we actually received
      console.log('[Leaderboard] Raw query params:', JSON.stringify(req.query));
      console.log('[Leaderboard] dateFrom in query:', req.query.dateFrom);
      console.log('[Leaderboard] dateTo in query:', req.query.dateTo);
      console.log('[Leaderboard] Parsed dates:', {
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        dateFromType: typeof dateFrom,
        dateToType: typeof dateTo,
        hasDateFrom: !!dateFrom,
        hasDateTo: !!dateTo
      });

      // Build gameType filter separately (don't mix with dateFilter)
      const gameTypeFilter: Record<string, unknown> = {};
      if (gameType === 'random') {
        // Backfill: legacy entries without gameType should be treated as random
        gameTypeFilter.$or = [{ gameType: 'random' }, { gameType: { $exists: false } }];
      } else if (gameType === 'repeat') {
        gameTypeFilter.gameType = 'repeat';
      }

      // Merge filters properly
      const queryFilter = { ...dateFilter, ...gameTypeFilter };
      
      // Debug logging
      console.log('[Leaderboard] Date filter:', JSON.stringify(dateFilter, (key, value) => {
        if (value instanceof Date) return value.toISOString();
        return value;
      }));
      console.log('[Leaderboard] Final query filter:', JSON.stringify(queryFilter, (key, value) => {
        if (value instanceof Date) return value.toISOString();
        return value;
      }));

      const totalCount = await collection.countDocuments(queryFilter);
      const totalPages = Math.ceil(totalCount / limit);

      const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };
      if (sortField === 'score') {
        sortObj.createdAt = 1;
      }

      // Debug: Log what we're querying
      console.log('[Leaderboard] Querying with filter:', JSON.stringify(queryFilter, (key, value) => {
        if (value instanceof Date) return value.toISOString();
        if (value && typeof value === 'object' && '$gte' in value) {
          return { $gte: value.$gte instanceof Date ? value.$gte.toISOString() : value.$gte };
        }
        if (value && typeof value === 'object' && '$lte' in value) {
          return { $lte: value.$lte instanceof Date ? value.$lte.toISOString() : value.$lte };
        }
        return value;
      }));
      
      const users = (await collection
        .find(queryFilter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .toArray()) as LeaderboardEntry[];
      
      // Debug: Log what we got back
      console.log('[Leaderboard] Found', users.length, 'entries');
      if (users.length > 0) {
        console.log('[Leaderboard] First entry createdAt:', users[0].createdAt);
      console.log('[Leaderboard] Last entry createdAt:', users[users.length - 1].createdAt);
      }

      // Debug: Add filter info to response headers for debugging
      res.setHeader('X-Debug-Filter', JSON.stringify({
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        dateFilter: dateFilter,
        queryFilter: queryFilter
      }));

      res.status(200).json({
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
        sort: {
          sortBy: sortField,
          sortOrder,
        },
      });
      return;
    }

    if (req.method === 'POST') {
      const { username, score, time, clicks, history, bingopediaGame, gameId, gameType } = req.body || {};
      
      // Debug logging for score submission
      console.log('[Leaderboard POST] Received data:', {
        username,
        score,
        hasBingopediaGame: Array.isArray(bingopediaGame),
        bingopediaGameLength: Array.isArray(bingopediaGame) ? bingopediaGame.length : 0,
        hasHistory: Array.isArray(history),
        historyLength: Array.isArray(history) ? history.length : 0,
        gameId,
        gameType,
        receivedGameType: gameType
      });

      if (!username || score === undefined) {
        res.status(400).json(
          createErrorResponse(
            'MISSING_FIELD',
            'Username and score are required',
            { missingFields: !username ? ['username'] : [], missingScore: score === undefined }
          )
        );
        return;
      }

      const usernameValidation = validateAndSanitizeUsername(String(username));
      if (usernameValidation.error) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            usernameValidation.error,
            { field: 'username', value: String(username) }
          )
        );
        return;
      }

      const scoreValidation = validateScoreData(score, time, clicks);
      if (scoreValidation.error) {
        res.status(400).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            scoreValidation.error,
            { field: 'score', value: score, time, clicks }
          )
        );
        return;
      }

      // Validate gameType if provided, default to 'random'
      const validGameType = gameType === 'repeat' ? 'repeat' : 'random';
      
      // Check if bingopediaGame should be included
      const shouldIncludeBingopediaGame = Array.isArray(bingopediaGame) && bingopediaGame.length >= 26;
      
      console.log('[Leaderboard POST] Processing entry:', {
        validGameType,
        shouldIncludeBingopediaGame,
        bingopediaGameLength: Array.isArray(bingopediaGame) ? bingopediaGame.length : 0,
      });
      
      const entry: LeaderboardEntry = {
        username: usernameValidation.username,
        score: scoreValidation.score,
        time: scoreValidation.time,
        clicks: scoreValidation.clicks,
        ...(shouldIncludeBingopediaGame
          ? { bingopediaGame: bingopediaGame.map(String) }
          : {}),
        history: Array.isArray(history) ? history.map(String) : [],
        createdAt: new Date(),
        ...(gameId && { gameId: String(gameId) }),
        gameType: validGameType,
      };
      
      console.log('[Leaderboard POST] Final entry:', {
        hasGameType: !!entry.gameType,
        gameType: entry.gameType,
        hasBingopediaGame: !!entry.bingopediaGame,
        bingopediaGameLength: entry.bingopediaGame?.length || 0
      });

      const result = await collection.insertOne(entry);
      const insertedEntry = { ...entry, _id: result.insertedId };

      if (gameId) {
        const gamesCollection = await getGamesCollection();
        await gamesCollection.updateOne({ link: String(gameId) }, { $inc: { timesPlayed: 1 } });
      }

      res.status(201).json(insertedEntry);
      return;
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    res.status(405).json(
      createErrorResponse(
        'METHOD_NOT_ALLOWED',
        `Method ${req.method} not allowed. Allowed methods: GET, POST, OPTIONS`,
        { method: req.method, allowedMethods: ['GET', 'POST', 'OPTIONS'] }
      )
    );
  } catch (error) {
    const err = error as Error;
    console.error('Leaderboard API error:', err);

    const context = req.method === 'GET' ? 'GET' : 'POST';
    const errorResponse = handleApiError(error, context);

    // Determine status code based on error type
    let status = 500;
    if (errorResponse.error.code === 'DATABASE_ERROR') {
      status = 503;
    } else if (errorResponse.error.code === 'VALIDATION_ERROR' || errorResponse.error.code === 'MISSING_FIELD') {
      status = 400;
    } else if (errorResponse.error.code === 'METHOD_NOT_ALLOWED') {
      status = 405;
    }

    res.status(status).json(errorResponse);
  }
}



