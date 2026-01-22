import dotenv from 'dotenv';

dotenv.config();

/**
 * MongoDB configuration interface.
 */
export interface MongoConfig {
  uri: string;
  dbName: string;
  collectionName: string;
}

/**
 * Reads and validates MongoDB environment variables, then constructs the connection URI.
 *
 * Environment variables (defined in `.env.local` for local dev, or Vercel project settings for production):
 * - `MONGODB_USERNAME`: MongoDB Atlas database user name
 * - `MONGODB_PASSWORD`: MongoDB Atlas user password (will be URL-encoded)
 * - `MONGODB_CLUSTER`: Atlas cluster hostname (e.g., `cluster0.rvkwijm.mongodb.net`)
 *
 * To rotate credentials safely:
 * 1. Update the values in Vercel project settings (or `.env.local` for local dev)
 * 2. Restart the server/function to pick up new values
 * 3. The cached MongoDB connection will be re-established on next request
 * 4. Old connections will be automatically closed when the cache expires
 *
 * @returns MongoDB configuration object with connection URI, database name, and collection name
 * @throws Error if required environment variables are missing
 */
export function getMongoConfig(): MongoConfig {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const cluster = process.env.MONGODB_CLUSTER;

  if (!username || !password || !cluster) {
    throw new Error(
      'Missing MongoDB configuration. Please set MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_CLUSTER. See ENVIRONMENT_AND_CONFIG.md for details.'
    );
  }

  const encodedPassword = encodeURIComponent(password);
  const uri = `mongodb+srv://${username}:${encodedPassword}@${cluster}/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin&maxPoolSize=10`;

  return {
    uri,
    dbName: 'bingopedia',
    collectionName: 'leaderboard',
  };
}

/**
 * Reads the server port from environment variables.
 *
 * Environment variable:
 * - `PORT`: Local Express server port (defaults to 3001 if not set)
 *
 * This is only used by the local Express dev server (`server/index.ts`).
 * Vercel serverless functions ignore this and use their own port configuration.
 *
 * @returns Port number (defaults to 3001)
 * @throws Error if PORT is set but is not a valid positive integer
 */
export function getServerPort(): number {
  const raw = process.env.PORT;
  const port = raw ? Number(raw) : 3001;

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('Invalid PORT environment variable. Expected a positive integer.');
  }

  return port;
}


