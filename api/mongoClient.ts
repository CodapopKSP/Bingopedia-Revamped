import { MongoClient, Db, Collection } from 'mongodb';
import { getMongoConfig } from './config';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export interface LeaderboardEntry {
  username: string;
  score: number;
  time: number;
  clicks: number;
  bingoSquares: string[];
  history: string[];
  createdAt: Date;
  gameId?: string; // Optional for backward compatibility
  /**
   * Game type: 'random' for random games, 'repeat' for repeat/linked games.
   * Optional field, defaults to 'random' if not provided.
   * Terminology updated from 'fresh'/'linked' to 'random'/'repeat'.
   */
  gameType?: 'random' | 'repeat';
}

export interface GameState {
  _id?: unknown; // MongoDB ObjectId
  /**
   * 16-character URL-safe hashed ID for shareable games.
   * Required for new games, unique across all games.
   */
  hashedId: string;
  /**
   * UUID v4 game ID. Kept for backward compatibility.
   * Optional for new games (hashedId is preferred).
   */
  gameId?: string;
  gridCells: string[]; // 25 article titles
  startingArticle: string;
  /**
   * Game type: 'random' for random games, 'repeat' for repeat/linked games.
   * Terminology updated from 'fresh'/'linked' to 'random'/'repeat'.
   */
  gameType: 'random' | 'repeat';
  createdAt: Date;
  createdBy?: string; // Optional username
}

/**
 * Gets or creates a MongoDB collection connection for leaderboard entries.
 *
 * Uses connection caching to reuse existing connections across requests for better performance.
 * Automatically creates an index on `{ score: -1, createdAt: 1 }` for efficient sorting.
 *
 * @returns Promise that resolves to the leaderboard collection
 * @throws {Error} If MongoDB configuration is missing or connection fails
 *
 * @remarks
 * - Connection is cached and reused across requests
 * - Connection health is checked with a ping before reuse
 * - If connection fails, a new connection is established
 * - Index creation is attempted but errors are logged, not thrown
 *
 * @example
 * ```typescript
 * const collection = await getLeaderboardCollection();
 * const entries = await collection.find({}).toArray();
 * ```
 */
export async function getLeaderboardCollection(): Promise<Collection<LeaderboardEntry>> {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return cachedDb.collection<LeaderboardEntry>('leaderboard');
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }

  const { uri, dbName, collectionName } = getMongoConfig();
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db(dbName);

  try {
    await db.collection(collectionName).createIndex({ score: -1, createdAt: 1 });
    await db.collection(collectionName).createIndex({ gameType: 1, score: 1, createdAt: 1 });
    await db.collection(collectionName).createIndex({ createdAt: -1 });
    await db.collection(collectionName).createIndex({ createdAt: -1, score: 1 });
  } catch (error) {
    console.log('Index creation note:', (error as Error).message);
  }

  cachedClient = client;
  cachedDb = db;

  return db.collection<LeaderboardEntry>(collectionName);
}

/**
 * Gets or creates a MongoDB collection connection for game states.
 *
 * Uses connection caching to reuse existing connections across requests for better performance.
 * Automatically creates indexes on `hashedId` (unique), `gameId` (unique), and `createdAt` for efficient queries.
 *
 * @returns Promise that resolves to the games collection
 * @throws {Error} If MongoDB configuration is missing or connection fails
 *
 * @remarks
 * - Connection is cached and reused across requests
 * - Connection health is checked with a ping before reuse
 * - If connection fails, a new connection is established
 * - Index creation is attempted but errors are logged, not thrown
 *
 * @example
 * ```typescript
 * const collection = await getGamesCollection();
 * const game = await collection.findOne({ gameId: 'some-uuid' });
 * ```
 */
export async function getGamesCollection(): Promise<Collection<GameState>> {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return cachedDb.collection<GameState>('games');
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }

  const { uri, dbName } = getMongoConfig();
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db(dbName);

  try {
    await db.collection('games').createIndex({ hashedId: 1 }, { unique: true });
    await db.collection('games').createIndex({ gameId: 1 }, { unique: true, sparse: true });
    await db.collection('games').createIndex({ createdAt: -1 });
  } catch (error) {
    console.log('Index creation note:', (error as Error).message);
  }

  cachedClient = client;
  cachedDb = db;

  return db.collection<GameState>('games');
}

/**
 * Gets or creates a MongoDB collection connection for game event logging.
 *
 * Uses connection caching to reuse existing connections across requests for better performance.
 * This collection is designed for time series data (game events).
 *
 * @returns Promise that resolves to the game_events collection
 * @throws {Error} If MongoDB configuration is missing or connection fails
 *
 * @remarks
 * - Connection is cached and reused across requests
 * - Connection health is checked with a ping before reuse
 * - If connection fails, a new connection is established
 * - Collection name: 'game_events' (time series collection)
 *
 * @example
 * ```typescript
 * const collection = await getLoggingCollection();
 * await collection.insertOne({ event: 'game_started', timestamp: new Date() });
 * ```
 */
export async function getLoggingCollection(): Promise<Collection<Record<string, unknown>>> {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return cachedDb.collection<Record<string, unknown>>('game_events');
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }

  const { uri, dbName } = getMongoConfig();
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db(dbName);

  // Note: Time series collection creation should be done via MongoDB shell or admin tools
  // This function assumes the collection exists or will be created automatically

  cachedClient = client;
  cachedDb = db;

  return db.collection<Record<string, unknown>>('game_events');
}


