import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { randomBytes } from 'crypto';
import { getServerPort } from '../api/config';
import { getLeaderboardCollection, getGamesCollection, type LeaderboardEntry, type GeneratedGame } from '../api/mongoClient';
import {
  validateAndSanitizeUsername,
  validateScoreData,
} from '../api/validation';
import { createErrorResponse, handleApiError } from '../api/errors';

const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env'), override: true });
dotenv.config({ path: path.join(rootDir, '.env.local'), override: true });

const app = express();

app.use(cors());
app.use(express.json());

function generateLink(): string {
  return randomBytes(12).toString('base64url').substring(0, 16);
}

/**
 * Replaces spaces with underscores in article titles.
 * Used when saving history to the leaderboard.
 * 
 * @param title - Article title (may include "[Found] " prefix)
 * @returns Title with spaces replaced by underscores
 */
function replaceSpacesWithUnderscores(title: string): string {
  if (!title) return title;
  
  // If title starts with "[Found] ", replace spaces only in the article title part
  if (title.startsWith('[Found] ')) {
    const articleTitle = title.replace('[Found] ', '');
    return `[Found] ${articleTitle.replace(/\s+/g, '_')}`;
  }
  
  // Otherwise, replace all spaces in the title
  return title.replace(/\s+/g, '_');
}

app.get('/api/leaderboard', async (req, res) => {
  try {
    // Disable caching for leaderboard API to ensure filters work correctly
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const collection = await getLeaderboardCollection();

    const limit = Math.max(parseInt((req.query.limit as string) ?? '10', 10) || 10, 1);
    const page = Math.max(parseInt((req.query.page as string) ?? '1', 10) || 1, 1);
    const sortBy = (req.query.sortBy as string) || 'score';
    // Default to ascending sort order (lower scores rank higher)
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

    const validSortFields = ['score', 'clicks', 'time', 'createdAt', 'username'] as const;
    const sortField = validSortFields.includes(sortBy as any) ? sortBy : 'score';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    // Parse and validate date parameters
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (req.query.dateFrom) {
      dateFrom = new Date(req.query.dateFrom as string);
      if (isNaN(dateFrom.getTime())) {
        res.status(400).json(
          createErrorResponse('VALIDATION_ERROR', 'Invalid dateFrom format. Expected ISO date string', { field: 'dateFrom', value: req.query.dateFrom })
        );
        return;
      }
    }

    if (req.query.dateTo) {
      dateTo = new Date(req.query.dateTo as string);
      if (isNaN(dateTo.getTime())) {
        res.status(400).json(
          createErrorResponse('VALIDATION_ERROR', 'Invalid dateTo format. Expected ISO date string', { field: 'dateTo', value: req.query.dateTo })
        );
        return;
      }
    }

    // Validate date range
    if (dateFrom && dateTo && dateFrom > dateTo) {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'dateFrom must be before or equal to dateTo', { dateFrom, dateTo })
      );
      return;
    }

    // Parse and validate gameType
    const gameType = (req.query.gameType as string) || 'random';
    if (gameType !== 'random' && gameType !== 'repeat' && gameType !== 'all') {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', "gameType must be 'random', 'repeat', or 'all'", { field: 'gameType', value: gameType })
      );
      return;
    }

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) {
        dateFilter.createdAt = { ...dateFilter.createdAt as Record<string, unknown>, $gte: dateFrom };
      }
      if (dateTo) {
        dateFilter.createdAt = { ...dateFilter.createdAt as Record<string, unknown>, $lte: dateTo };
      }
    }

    // Build gameType filter
    const gameTypeFilter: Record<string, unknown> = {};
    if (gameType !== 'all') {
      gameTypeFilter.gameType = gameType;
    }

    // Merge filters
    const queryFilter = { ...dateFilter, ...gameTypeFilter };

    const totalCount = await collection.countDocuments(queryFilter);
    const totalPages = Math.ceil(totalCount / limit);

    const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };
    if (sortField === 'score') {
      sortObj.createdAt = 1;
    }

    const users = (await collection
      .find(queryFilter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray()) as LeaderboardEntry[];

    res.json({
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
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    const errorResponse = handleApiError(error, 'GET');
    const status = errorResponse.error.code === 'DATABASE_ERROR' ? 503 : 500;
    res.status(status).json(errorResponse);
  }
});

app.post('/api/leaderboard', async (req, res) => {
  try {
    const collection = await getLeaderboardCollection();
    const { username, score, time, clicks, history, bingopediaGame, gameId, gameType } = req.body || {};

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
    
    // Generate a unique generatedGame hash ID for this leaderboard entry
    const { randomBytes } = require('crypto');
    function generateHashedId(): string {
      const bytes = randomBytes(12);
      return bytes.toString('base64url').substring(0, 16);
    }
    const generatedGame = generateHashedId();

    const entry: LeaderboardEntry = {
      username: usernameValidation.username,
      score: scoreValidation.score,
      time: scoreValidation.time,
      clicks: scoreValidation.clicks,
      ...(shouldIncludeBingopediaGame
        ? { bingopediaGame: bingopediaGame.map(String) }
        : {}),
      history: Array.isArray(history) ? history.map((title) => replaceSpacesWithUnderscores(String(title))) : [],
      createdAt: new Date(),
      ...(gameId && { gameId: String(gameId) }),
      gameType: validGameType,
      generatedGame,
    };

    const result = await collection.insertOne(entry);
    const insertedEntry = { ...entry, _id: result.insertedId };

    if (gameId) {
      const gamesCollection = await getGamesCollection();
      await gamesCollection.updateOne({ link: String(gameId) }, { $inc: { timesPlayed: 1 } });
    }

    res.status(201).json(insertedEntry);
  } catch (error) {
    console.error('Error saving score:', error);
    const errorResponse = handleApiError(error, 'POST');
    const status = errorResponse.error.code === 'DATABASE_ERROR' ? 503 : 500;
    res.status(status).json(errorResponse);
  }
});

app.post('/api/games', async (req, res) => {
  try {
    const collection = await getGamesCollection();
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

    let link = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      link = generateLink();
      try {
        const gameState: GeneratedGame = {
          link,
          bingopediaGame: bingopediaGame.map(String),
          createdAt: new Date(),
          timesPlayed: 0,
          source: 'generated',
        };

        const result = await collection.insertOne(gameState);
        const insertedGame = { ...gameState, _id: result.insertedId };
        res.status(201).json(insertedGame);
        return;
      } catch (error) {
        const err = error as Error;
        if (err.message.includes('duplicate key') || err.message.includes('E11000')) {
          attempts += 1;
          if (attempts >= maxAttempts) {
            res.status(500).json(
              createErrorResponse(
                'SERVER_ERROR',
                'Failed to generate unique game link. Please try again.',
                { attempts: maxAttempts }
              )
            );
            return;
          }
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating shareable game:', error);
    const errorResponse = handleApiError(error, 'POST');
    const status = errorResponse.error.code === 'DATABASE_ERROR' ? 503 : 500;
    res.status(status).json(errorResponse);
  }
});

app.get('/api/games/debug', async (_req, res) => {
  try {
    const collection = await getGamesCollection();
    const total = await collection.countDocuments();
    const recent = await collection
      .find({}, { projection: { link: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    res.json({
      collection: 'generated-games',
      total,
      recentLinks: recent.map((doc) => ({ link: doc.link, createdAt: doc.createdAt })),
    });
  } catch (error) {
    console.error('Error fetching games debug info:', error);
    const errorResponse = handleApiError(error, 'GET');
    const status = errorResponse.error.code === 'DATABASE_ERROR' ? 503 : 500;
    res.status(status).json(errorResponse);
  }
});

app.get('/api/games/:link([A-Za-z0-9_-]{16})', async (req, res) => {
  try {
    const collection = await getGamesCollection();
    const link = (req.params.link || '').trim();

    if (!link || !/^[A-Za-z0-9_-]{16}$/.test(link)) {
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
    res.json(gameState);
  } catch (error) {
    console.error('Error fetching shareable game:', error);
    const errorResponse = handleApiError(error, 'GET');
    const status = errorResponse.error.code === 'DATABASE_ERROR' ? 503 : 500;
    res.status(status).json(errorResponse);
  }
});

app.get('/api/games', async (req, res) => {
  try {
    const collection = await getGamesCollection();
    const link = ((req.query.link as string) || '').trim();

    if (!link || !/^[A-Za-z0-9_-]{16}$/.test(link)) {
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
    res.json(gameState);
  } catch (error) {
    console.error('Error fetching shareable game:', error);
    const errorResponse = handleApiError(error, 'GET');
    const status = errorResponse.error.code === 'DATABASE_ERROR' ? 503 : 500;
    res.status(status).json(errorResponse);
  }
});


/**
 * Starts the Express server on the configured port.
 *
 * Reads the port from environment variables (defaults to 3001).
 * Logs the server URL when successfully started.
 *
 * @remarks
 * This function is only used by the local Express dev server.
 * Vercel serverless functions ignore this and use their own port configuration.
 */
function startServer() {
  const port = getServerPort();
  app.listen(port, () => {
    console.log(`Leaderboard API server running at http://localhost:${port}`);
  });
}

startServer();


