const { MongoClient } = require('mongodb');
const { randomBytes } = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const CLUSTER_NAME = process.env.MONGODB_CLUSTER;
const DB_NAME = 'bingopedia';
const COLLECTION_NAME = 'leaderboard';

/**
 * Generates a 16-character URL-safe hashed ID.
 * Uses 12 random bytes converted to base64url encoding, truncated to 16 characters.
 *
 * @returns 16-character URL-safe hash
 */
function generateHashedId() {
  // Generate 12 random bytes (96 bits)
  const bytes = randomBytes(12);
  // Convert to base64url (URL-safe, no padding)
  return bytes.toString('base64url').substring(0, 16);
}

/**
 * Migration script to add generatedGame field to existing leaderboard entries.
 * 
 * This script:
 * 1. Finds all entries that don't have a generatedGame field
 * 2. Generates a unique 16-character hash ID for each entry
 * 3. Updates the entries with the generatedGame field
 * 
 * This script is idempotent (safe to run multiple times).
 */
async function migrateLeaderboardGeneratedGame() {
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

    // Find entries that need migration (missing generatedGame field)
    const filter = {
      generatedGame: { $exists: false },
    };

    console.log('Finding entries to migrate...');
    const entriesToMigrate = await collection.find(filter).toArray();
    console.log(`Found ${entriesToMigrate.length} entries to migrate`);

    if (entriesToMigrate.length === 0) {
      console.log('No entries need migration.');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;
    const generatedHashes = new Set(); // Track generated hashes to avoid collisions

    for (const entry of entriesToMigrate) {
      try {
        // Generate a unique hash (with collision checking)
        let generatedGame;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          generatedGame = generateHashedId();
          attempts++;

          // Check if this hash already exists in the database
          const existing = await collection.findOne({ generatedGame });
          if (!existing && !generatedHashes.has(generatedGame)) {
            generatedHashes.add(generatedGame);
            break;
          }

          if (attempts >= maxAttempts) {
            throw new Error(`Failed to generate unique hash after ${maxAttempts} attempts`);
          }
        } while (true);

        // Update the entry
        await collection.updateOne(
          { _id: entry._id },
          { $set: { generatedGame } }
        );

        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Progress: Updated ${updatedCount} entries...`);
        }
      } catch (error) {
        console.error(`Error updating entry ${entry._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`  Updated: ${updatedCount} entries`);
    console.log(`  Errors: ${errorCount} entries`);

    // Verify the migration
    const remaining = await collection.countDocuments({ generatedGame: { $exists: false } });
    if (remaining > 0) {
      console.log(`\n⚠️  Warning: ${remaining} entries still missing generatedGame field`);
    } else {
      console.log('\n✅ All entries now have generatedGame field');
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

migrateLeaderboardGeneratedGame();

