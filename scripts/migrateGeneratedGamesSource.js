const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const CLUSTER_NAME = process.env.MONGODB_CLUSTER;
const DB_NAME = 'bingopedia';
const COLLECTION_NAME = 'generated-games';

/**
 * Migration script to add source='generated' to existing generated-games entries.
 * 
 * This script:
 * 1. Finds all entries in generated-games that don't have a source field
 * 2. Updates them to have source='generated'
 * 
 * This script is idempotent (safe to run multiple times).
 */
async function migrateGeneratedGamesSource() {
  if (!MONGODB_USERNAME || !MONGODB_PASSWORD || !CLUSTER_NAME) {
    console.error(
      'Error: Missing MongoDB configuration. Please set MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_CLUSTER.'
    );
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

    // Find entries that don't have a source field
    const filter = {
      source: { $exists: false },
    };

    console.log('Finding entries to migrate...');
    const countBefore = await collection.countDocuments(filter);
    console.log(`Found ${countBefore} entries without source field`);

    if (countBefore === 0) {
      console.log('No entries need migration.');
      return;
    }

    // Update all entries that don't have source to source='generated'
    const result = await collection.updateMany(
      filter,
      { $set: { source: 'generated' } }
    );

    console.log('\nMigration complete!');
    console.log(`  Updated: ${result.modifiedCount} entries`);
    console.log(`  Matched: ${result.matchedCount} entries`);

    // Verify the migration
    const remaining = await collection.countDocuments({ source: { $exists: false } });
    const generatedCount = await collection.countDocuments({ source: 'generated' });
    const leaderboardCount = await collection.countDocuments({ source: 'leaderboard' });

    console.log('\nVerification:');
    console.log(`  Entries without source: ${remaining}`);
    console.log(`  Entries with source='generated': ${generatedCount}`);
    console.log(`  Entries with source='leaderboard': ${leaderboardCount}`);

    if (remaining === 0) {
      console.log('\n✅ All entries now have a source field');
    } else {
      console.log(`\n⚠️  Warning: ${remaining} entries still missing source field`);
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

migrateGeneratedGamesSource();

