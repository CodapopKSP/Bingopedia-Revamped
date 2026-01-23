import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getServerPort } from '../api/config';
import { getLeaderboardCollection, type LeaderboardEntry } from '../api/mongoClient';
import {
  validateAndSanitizeUsername,
  validateScoreData,
} from '../api/validation';
import { createErrorResponse, handleApiError } from '../api/errors';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/leaderboard', async (req, res) => {
  try {
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

    const totalCount = await collection.countDocuments({});
    const totalPages = Math.ceil(totalCount / limit);

    const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };
    if (sortField === 'score') {
      sortObj.createdAt = 1;
    }

    const users = (await collection
      .find({})
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
    const { username, score, time, clicks, bingoSquares, history } = req.body || {};

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

    const entry: LeaderboardEntry = {
      username: usernameValidation.username,
      score: scoreValidation.score,
      time: scoreValidation.time,
      clicks: scoreValidation.clicks,
      bingoSquares: Array.isArray(bingoSquares) ? bingoSquares.map(String) : [],
      history: Array.isArray(history) ? history.map(String) : [],
      createdAt: new Date(),
    };

    const result = await collection.insertOne(entry);
    const insertedEntry = { ...entry, _id: result.insertedId };

    res.status(201).json(insertedEntry);
  } catch (error) {
    console.error('Error saving score:', error);
    const errorResponse = handleApiError(error, 'POST');
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


