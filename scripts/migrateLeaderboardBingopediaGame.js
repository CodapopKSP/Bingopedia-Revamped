const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const MONGODB_USERNAME = process.env.MONGODB_USERNAME
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD
const CLUSTER_NAME = process.env.MONGODB_CLUSTER
const DB_NAME = 'bingopedia'
const COLLECTION_NAME = 'leaderboard'

async function migrateLeaderboardBingopediaGame() {
  if (!MONGODB_USERNAME || !MONGODB_PASSWORD || !CLUSTER_NAME) {
    console.error(
      'Error: Missing MongoDB configuration. Please set MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_CLUSTER.'
    )
    process.exit(1)
  }

  let client

  try {
    console.log('Connecting to MongoDB...')
    const encodedPassword = encodeURIComponent(MONGODB_PASSWORD)
    const MONGODB_URI = `mongodb+srv://${MONGODB_USERNAME}:${encodedPassword}@${CLUSTER_NAME}/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`

    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    // Find entries that need migration:
    // - Have bingoSquares but no bingopediaGame, OR
    // - Missing gameType
    const filter = {
      $or: [
        {
          bingopediaGame: { $exists: false },
          bingoSquares: { $exists: true, $size: 25 },
          history: { $exists: true, $ne: [] },
        },
        {
          gameType: { $exists: false },
        },
      ],
    }

    console.log('Finding entries to migrate...')
    const entriesToMigrate = await collection.find(filter).toArray()
    console.log(`Found ${entriesToMigrate.length} entries to migrate`)

    if (entriesToMigrate.length === 0) {
      console.log('No entries need migration.')
      return
    }

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    let bingopediaGameAdded = 0
    let gameTypeAdded = 0

    for (const entry of entriesToMigrate) {
      try {
        const updates = {}
        let needsUpdate = false

        // Add bingopediaGame if missing
        if (!entry.bingopediaGame && entry.bingoSquares && entry.history) {
          const bingoSquares = entry.bingoSquares || []
          const history = entry.history || []
          const startingTitle = history[0]

          // Validate we have what we need
          if (bingoSquares.length === 25 && startingTitle) {
            // Create bingopediaGame: 25 squares + 1 starting title = 26 elements
            updates.bingopediaGame = [...bingoSquares, startingTitle]
            needsUpdate = true
            bingopediaGameAdded++
          } else {
            console.log(`Skipping bingopediaGame for entry ${entry._id}: bingoSquares has ${bingoSquares.length} elements or missing starting title`)
          }
        }

        // Add gameType if missing (default to 'random')
        if (!entry.gameType) {
          updates.gameType = 'random'
          needsUpdate = true
          gameTypeAdded++
        }

        // Update the entry if we have changes
        if (needsUpdate) {
          await collection.updateOne(
            { _id: entry._id },
            { $set: updates }
          )

          updatedCount++
          if (updatedCount % 100 === 0) {
            console.log(`Progress: Updated ${updatedCount} entries...`)
          }
        } else {
          skippedCount++
        }
      } catch (error) {
        console.error(`Error updating entry ${entry._id}:`, error.message)
        errorCount++
      }
    }

    console.log('\nMigration complete!')
    console.log(`  Updated: ${updatedCount} entries`)
    console.log(`    - Added bingopediaGame: ${bingopediaGameAdded} entries`)
    console.log(`    - Added gameType: ${gameTypeAdded} entries`)
    console.log(`  Skipped: ${skippedCount} entries`)
    console.log(`  Errors: ${errorCount} entries`)
  } catch (error) {
    console.error('Error during migration:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('\nMongoDB connection closed')
    }
  }
}

migrateLeaderboardBingopediaGame()

