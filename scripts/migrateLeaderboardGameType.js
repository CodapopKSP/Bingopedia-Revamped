const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection
const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const CLUSTER_NAME = process.env.MONGODB_CLUSTER;
const DB_NAME = 'bingopedia';
const COLLECTION_NAME = 'leaderboard';

/**
 * Migration script to add gameType field to existing leaderboard entries and update terminology.
 * 
 * This script:
 * 1. Updates terminology: 'fresh' → 'random', 'linked' → 'repeat'
 * 2. Sets gameType to 'random' for all entries that don't have it
 * 
 * This script is idempotent (safe to run multiple times).
 */
async function migrateLeaderboardGameType() {
  if (!MONGODB_USERNAME || !MONGODB_PASSWORD || !CLUSTER_NAME) {
    console.error('Error: Missing MongoDB configuration. Please set MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_CLUSTER.');
    process.exit(1);
  }

  let client;

  try {
    console.log('Connecting to MongoDB...');
    const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
    const MONGODB_URI = `mongodb+srv://${MONGODB_USERNAME}:${encodedPassword}@${CLUSTER_NAME}/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Step 1: Update terminology from 'fresh' to 'random'
    const freshToRandomResult = await collection.updateMany(
      { gameType: 'fresh' },
      { $set: { gameType: 'random' } }
    );
    console.log(`Updated ${freshToRandomResult.modifiedCount} entries: 'fresh' → 'random'`);

    // Step 2: Update terminology from 'linked' to 'repeat'
    const linkedToRepeatResult = await collection.updateMany(
      { gameType: 'linked' },
      { $set: { gameType: 'repeat' } }
    );
    console.log(`Updated ${linkedToRepeatResult.modifiedCount} entries: 'linked' → 'repeat'`);

    // Step 3: Count entries without gameType
    const countBefore = await collection.countDocuments({
      $or: [
        { gameType: { $exists: false } },
        { gameType: null }
      ]
    });

    console.log(`Found ${countBefore} entries without gameType field`);

    if (countBefore === 0) {
      console.log('No migration needed. All entries already have gameType field.');
    } else {
      // Update all entries that don't have gameType, setting it to 'random'
      const result = await collection.updateMany(
        {
          $or: [
            { gameType: { $exists: false } },
            { gameType: null }
          ]
        },
        {
          $set: { gameType: 'random' }
        }
      );

      console.log(`Updated ${result.modifiedCount} entries with gameType: 'random'`);
    }

    // Verify migration
    const countAfter = await collection.countDocuments({
      $or: [
        { gameType: { $exists: false } },
        { gameType: null }
      ]
    });

    if (countAfter === 0) {
      console.log('✓ Migration completed successfully. All entries now have gameType field with updated terminology.');
    } else {
      console.warn(`⚠ Warning: ${countAfter} entries still missing gameType field.`);
    }

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nMongoDB connection closed');
    }
  }
}

migrateLeaderboardGameType();

