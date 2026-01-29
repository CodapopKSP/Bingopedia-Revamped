import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { getMongoConfig } from './config';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export interface LeaderboardEntry {
  username: string;
  score: number;
  time: number;
  clicks: number;
  bingopediaGame?: string[];
  history: string[];
  createdAt: Date;
  gameId?: string; // Optional for backward compatibility
  /**
   * Game type: 'random' for random games, 'repeat' for repeat/linked games.
   * Optional field, defaults to 'random' if not provided.
   * Terminology updated from 'fresh'/'linked' to 'random'/'repeat'.
   */
  gameType?: 'random' | 'repeat';
  /**
   * @deprecated Use bingopediaGame instead. This field is kept for backward compatibility with old entries.
   */
  bingoSquares?: string[];
}

export interface GeneratedGame {
  _id?: ObjectId; // MongoDB ObjectId
  /**
   * 16-character URL-safe hash used in shareable links.
   */
  link: string;
  /**
   * 26 article titles: 25 grid squares + starting article.
   */
  bingopediaGame: string[];
  createdAt: Date;
  timesPlayed: number;
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
export async function getGamesCollection(): Promise<Collection<GeneratedGame>> {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return cachedDb.collection<GeneratedGame>('generated-games');
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
    await db.collection('generated-games').createIndex({ link: 1 }, { unique: true });
    await db.collection('generated-games').createIndex({ createdAt: -1 });
  } catch (error) {
    console.log('Index creation note:', (error as Error).message);
  }

  cachedClient = client;
  cachedDb = db;

  return db.collection<GeneratedGame>('generated-games');
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


