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
  } catch (error) {
    console.log('Index creation note:', (error as Error).message);
  }

  cachedClient = client;
  cachedDb = db;

  return db.collection<LeaderboardEntry>(collectionName);
}


