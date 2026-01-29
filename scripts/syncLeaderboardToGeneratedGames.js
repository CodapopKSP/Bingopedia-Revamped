const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_USERNAME = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const CLUSTER_NAME = process.env.MONGODB_CLUSTER;
const DB_NAME = 'bingopedia';
const LEADERBOARD_COLLECTION = 'leaderboard';
const GAMES_COLLECTION = 'generated-games';

/**
 * Script to sync leaderboard entries to the generated-games collection.
 * 
 * This script:
 * 1. Finds all leaderboard entries that have both generatedGame and bingopediaGame
 * 2. Creates corresponding entries in the generated-games collection
 * 3. Uses generatedGame as the link field
 * 4. Copies bingopediaGame to the new entry
 * 5. Sets source='leaderboard' to identify the origin
 * 
 * This script is idempotent (safe to run multiple times) - it checks if entries already exist.
 */
async function syncLeaderboardToGeneratedGames() {
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
    const leaderboardCollection = db.collection(LEADERBOARD_COLLECTION);
    const gamesCollection = db.collection(GAMES_COLLECTION);

    // Find leaderboard entries that have both generatedGame and bingopediaGame
    const filter = {
      generatedGame: { $exists: true },
      bingopediaGame: { $exists: true, $type: 'array' },
    };

    console.log('Finding leaderboard entries to sync...');
    const entriesToSync = await leaderboardCollection.find(filter).toArray();
    console.log(`Found ${entriesToSync.length} entries to sync`);

    if (entriesToSync.length === 0) {
      console.log('No entries found to sync.');
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const entry of entriesToSync) {
      try {
        const generatedGame = entry.generatedGame;
        const bingopediaGame = entry.bingopediaGame;

        // Validate required fields
        if (!generatedGame || !Array.isArray(bingopediaGame) || bingopediaGame.length !== 26) {
          console.log(`Skipping entry ${entry._id}: missing or invalid generatedGame/bingopediaGame`);
          skippedCount++;
          continue;
        }

        // Check if this game already exists in generated-games collection
        const existingGame = await gamesCollection.findOne({ link: generatedGame });
        if (existingGame) {
          console.log(`Skipping entry ${entry._id}: game with link '${generatedGame}' already exists`);
          skippedCount++;
          continue;
        }

        // Create new entry in generated-games collection
        const gameEntry = {
          link: generatedGame,
          bingopediaGame: bingopediaGame.map(String), // Ensure all elements are strings
          createdAt: entry.createdAt || new Date(), // Use leaderboard entry's createdAt if available
          timesPlayed: 0, // Start at 0, will be updated when scores reference this game
          source: 'leaderboard', // Mark as coming from leaderboard
        };

        await gamesCollection.insertOne(gameEntry);

        createdCount++;
        if (createdCount % 100 === 0) {
          console.log(`Progress: Created ${createdCount} game entries...`);
        }
      } catch (error) {
        console.error(`Error processing entry ${entry._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nSync complete!');
    console.log(`  Created: ${createdCount} game entries`);
    console.log(`  Skipped: ${skippedCount} entries (already exist or invalid)`);
    console.log(`  Errors: ${errorCount} entries`);

    // Verify the sync
    const totalGames = await gamesCollection.countDocuments({ source: 'leaderboard' });
    console.log(`\n✅ Total games with source='leaderboard': ${totalGames}`);
  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nMongoDB connection closed');
    }
  }
}

syncLeaderboardToGeneratedGames();

