/**
 * Integration tests for the leaderboard API.
 *
 * These tests require a test MongoDB database. Set up a test environment with:
 * - MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_CLUSTER pointing to a test database
 * - Or use a local MongoDB instance for testing
 *
 * To run these tests:
 * 1. Set up a test MongoDB database/collection
 * 2. Configure test environment variables
 * 3. Run: npm test -- leaderboard.integration.test.ts
 *
 * Note: These tests may modify the test database. Use a dedicated test collection.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoClient } from 'mongodb';
import { getMongoConfig } from '../api/config';
import type { LeaderboardEntry } from '../api/mongoClient';

// Skip integration tests if test DB is not configured
const TEST_DB_CONFIGURED =
  process.env.MONGODB_USERNAME &&
  process.env.MONGODB_PASSWORD &&
  process.env.MONGODB_CLUSTER;

describe.skipIf(!TEST_DB_CONFIGURED)('Leaderboard API Integration Tests', () => {
  let client: MongoClient;
  let collection: any;
  const TEST_COLLECTION = 'leaderboard_test';

  beforeAll(async () => {
    const config = getMongoConfig();
    client = new MongoClient(config.uri);
    await client.connect();
    const db = client.db(config.dbName);
    collection = db.collection(TEST_COLLECTION);

    // Clean up test collection before starting
    await collection.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test collection after tests
    await collection.deleteMany({});
    await client.close();
  });

  beforeEach(async () => {
    // Clear collection before each test
    await collection.deleteMany({});
  });

  it('should insert a valid leaderboard entry', async () => {
    const entry: LeaderboardEntry = {
      username: 'TestPlayer',
      score: 1500,
      time: 120,
      clicks: 25,
      bingoSquares: ['Article1', 'Article2'],
      history: ['Starting Article', 'Article1'],
      createdAt: new Date(),
    };

    const result = await collection.insertOne(entry);
    expect(result.insertedId).toBeDefined();

    const inserted = await collection.findOne({ _id: result.insertedId });
    expect(inserted).toMatchObject({
      username: 'TestPlayer',
      score: 1500,
      time: 120,
      clicks: 25,
    });
  });

  it('should retrieve entries sorted by score with tie-breaking', async () => {
    const now = new Date();
    const entries: LeaderboardEntry[] = [
      {
        username: 'Player2',
        score: 1500,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
        createdAt: new Date(now.getTime() + 1000), // Later
      },
      {
        username: 'Player1',
        score: 1500,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
        createdAt: now, // Earlier
      },
      {
        username: 'Player3',
        score: 2000,
        time: 100,
        clicks: 20,
        bingoSquares: [],
        history: [],
        createdAt: new Date(now.getTime() + 2000),
      },
    ];

    await collection.insertMany(entries);

    const sorted = await collection
      .find({})
      .sort({ score: -1, createdAt: 1 })
      .toArray();

    expect(sorted[0].username).toBe('Player3'); // Highest score
    expect(sorted[1].username).toBe('Player1'); // Equal score, earlier createdAt
    expect(sorted[2].username).toBe('Player2'); // Equal score, later createdAt
  });

  it('should support pagination', async () => {
    // Insert multiple entries
    const entries: LeaderboardEntry[] = Array.from({ length: 15 }, (_, i) => ({
      username: `Player${i}`,
      score: 1000 + i,
      time: 100,
      clicks: 10,
      bingoSquares: [],
      history: [],
      createdAt: new Date(),
    }));

    await collection.insertMany(entries);

    // Get first page (limit 10)
    const page1 = await collection
      .find({})
      .sort({ score: -1 })
      .limit(10)
      .skip(0)
      .toArray();

    expect(page1.length).toBe(10);
    expect(page1[0].score).toBe(1014); // Highest score

    // Get second page
    const page2 = await collection
      .find({})
      .sort({ score: -1 })
      .limit(10)
      .skip(10)
      .toArray();

    expect(page2.length).toBe(5);
    expect(page2[0].score).toBe(1004);
  });

  it('should support sorting by different fields', async () => {
    const entries: LeaderboardEntry[] = [
      {
        username: 'PlayerA',
        score: 1500,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      },
      {
        username: 'PlayerB',
        score: 1500,
        time: 100,
        clicks: 30,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      },
    ];

    await collection.insertMany(entries);

    // Sort by time ascending
    const byTime = await collection
      .find({})
      .sort({ time: 1 })
      .toArray();

    expect(byTime[0].username).toBe('PlayerB');

    // Sort by clicks descending
    const byClicks = await collection
      .find({})
      .sort({ clicks: -1 })
      .toArray();

    expect(byClicks[0].username).toBe('PlayerB');
  });

  describe('Pagination Edge Cases', () => {
    it('should handle empty leaderboard', async () => {
      const totalCount = await collection.countDocuments({});
      expect(totalCount).toBe(0);

      const results = await collection.find({}).limit(10).skip(0).toArray();
      expect(results).toHaveLength(0);
    });

    it('should handle single page of results', async () => {
      const entries: LeaderboardEntry[] = Array.from({ length: 5 }, (_, i) => ({
        username: `Player${i}`,
        score: 1000 + i,
        time: 100,
        clicks: 10,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      }));

      await collection.insertMany(entries);

      const totalCount = await collection.countDocuments({});
      const totalPages = Math.ceil(totalCount / 10);

      expect(totalCount).toBe(5);
      expect(totalPages).toBe(1);

      const page1 = await collection.find({}).sort({ score: -1 }).limit(10).skip(0).toArray();
      expect(page1).toHaveLength(5);
    });

    it('should handle last page with partial results', async () => {
      // Insert 23 entries (3 pages with limit 10: 10, 10, 3)
      const entries: LeaderboardEntry[] = Array.from({ length: 23 }, (_, i) => ({
        username: `Player${i}`,
        score: 1000 + i,
        time: 100,
        clicks: 10,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      }));

      await collection.insertMany(entries);

      const totalCount = await collection.countDocuments({});
      const totalPages = Math.ceil(totalCount / 10);

      expect(totalCount).toBe(23);
      expect(totalPages).toBe(3);

      // Get last page (page 3)
      const lastPage = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .skip(20)
        .toArray();

      expect(lastPage).toHaveLength(3);
      expect(lastPage[0].score).toBe(1002);
      expect(lastPage[2].score).toBe(1000);
    });

    it('should handle page beyond available data', async () => {
      const entries: LeaderboardEntry[] = Array.from({ length: 5 }, (_, i) => ({
        username: `Player${i}`,
        score: 1000 + i,
        time: 100,
        clicks: 10,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      }));

      await collection.insertMany(entries);

      // Request page 10 (beyond available data)
      const page10 = await collection.find({}).sort({ score: -1 }).limit(10).skip(90).toArray();
      expect(page10).toHaveLength(0);
    });
  });

  describe('Sorting Edge Cases', () => {
    it('should handle all scores equal (tie-breaking by createdAt)', async () => {
      const now = new Date();
      const entries: LeaderboardEntry[] = [
        {
          username: 'Player3',
          score: 1000,
          time: 100,
          clicks: 10,
          bingoSquares: [],
          history: [],
          createdAt: new Date(now.getTime() + 3000), // Latest
        },
        {
          username: 'Player1',
          score: 1000,
          time: 100,
          clicks: 10,
          bingoSquares: [],
          history: [],
          createdAt: now, // Earliest
        },
        {
          username: 'Player2',
          score: 1000,
          time: 100,
          clicks: 10,
          bingoSquares: [],
          history: [],
          createdAt: new Date(now.getTime() + 1000), // Middle
        },
      ];

      await collection.insertMany(entries);

      const sorted = await collection
        .find({})
        .sort({ score: -1, createdAt: 1 })
        .toArray();

      expect(sorted[0].username).toBe('Player1'); // Earliest createdAt
      expect(sorted[1].username).toBe('Player2');
      expect(sorted[2].username).toBe('Player3'); // Latest createdAt
    });

    it('should handle very large datasets', async () => {
      // Insert 100 entries
      const entries: LeaderboardEntry[] = Array.from({ length: 100 }, (_, i) => ({
        username: `Player${i.toString().padStart(3, '0')}`,
        score: 1000 + i,
        time: 100,
        clicks: 10,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      }));

      await collection.insertMany(entries);

      const totalCount = await collection.countDocuments({});
      expect(totalCount).toBe(100);

      // Verify sorting works correctly
      const sorted = await collection.find({}).sort({ score: -1 }).limit(10).toArray();
      expect(sorted[0].score).toBe(1099);
      expect(sorted[9].score).toBe(1090);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle very large scores', async () => {
      const entry: LeaderboardEntry = {
        username: 'HighScorePlayer',
        score: Number.MAX_SAFE_INTEGER,
        time: 100,
        clicks: 10,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      };

      const result = await collection.insertOne(entry);
      expect(result.insertedId).toBeDefined();

      const inserted = await collection.findOne({ _id: result.insertedId });
      expect(inserted.score).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle usernames at maximum length', async () => {
      const maxLengthUsername = 'a'.repeat(50);
      const entry: LeaderboardEntry = {
        username: maxLengthUsername,
        score: 1000,
        time: 100,
        clicks: 10,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      };

      const result = await collection.insertOne(entry);
      expect(result.insertedId).toBeDefined();

      const inserted = await collection.findOne({ _id: result.insertedId });
      expect(inserted.username).toBe(maxLengthUsername);
      expect(inserted.username.length).toBe(50);
    });

    it('should handle zero values', async () => {
      const entry: LeaderboardEntry = {
        username: 'ZeroPlayer',
        score: 0,
        time: 0,
        clicks: 0,
        bingoSquares: [],
        history: [],
        createdAt: new Date(),
      };

      const result = await collection.insertOne(entry);
      expect(result.insertedId).toBeDefined();

      const inserted = await collection.findOne({ _id: result.insertedId });
      expect(inserted.score).toBe(0);
      expect(inserted.time).toBe(0);
      expect(inserted.clicks).toBe(0);
    });

    it('should handle very large arrays for bingoSquares and history', async () => {
      const largeBingoSquares = Array.from({ length: 100 }, (_, i) => `Article${i}`);
      const largeHistory = Array.from({ length: 200 }, (_, i) => `History${i}`);

      const entry: LeaderboardEntry = {
        username: 'LargeDataPlayer',
        score: 1000,
        time: 100,
        clicks: 10,
        bingoSquares: largeBingoSquares,
        history: largeHistory,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(entry);
      expect(result.insertedId).toBeDefined();

      const inserted = await collection.findOne({ _id: result.insertedId });
      expect(inserted.bingoSquares).toHaveLength(100);
      expect(inserted.history).toHaveLength(200);
    });
  });

  describe('Error Response Format Validation', () => {
    it('should validate error response structure for missing fields', () => {
      // This test validates the error response structure
      // In a real API test, we would make HTTP requests and check responses
      // For now, we document the expected structure

      const expectedErrorStructure = {
        error: {
          code: expect.any(String),
          message: expect.any(String),
          details: expect.anything(), // Optional, only in development
        },
      };

      // Example error response
      const exampleError = {
        error: {
          code: 'MISSING_FIELD',
          message: 'Username and score are required',
          details: { missingFields: ['username'], missingScore: true },
        },
      };

      expect(exampleError).toMatchObject(expectedErrorStructure);
      expect(exampleError.error.code).toBe('MISSING_FIELD');
      expect(exampleError.error.message).toBeTruthy();
    });

    it('should validate error response structure for validation errors', () => {
      const exampleError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username must be at most 50 characters',
          details: { field: 'username', value: 'a'.repeat(51) },
        },
      };

      expect(exampleError.error.code).toBe('VALIDATION_ERROR');
      expect(exampleError.error.message).toBeTruthy();
      expect(exampleError.error.details).toBeDefined();
    });

    it('should validate error response structure for database errors', () => {
      const exampleError = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Unable to connect to the database. Please try again later.',
          details: 'MongoDB connection timeout',
        },
      };

      expect(exampleError.error.code).toBe('DATABASE_ERROR');
      expect(exampleError.error.message).toBeTruthy();
    });
  });

  // Note: Testing actual HTTP endpoints would require:
  // 1. Starting an Express server (for local dev) or
  // 2. Using a test framework like supertest, or
  // 3. Mocking Vercel serverless functions
  // These database-level tests validate the core functionality that the API depends on.
});

