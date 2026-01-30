const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const MONGODB_USERNAME = process.env.MONGODB_USERNAME
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD
const CLUSTER_NAME = process.env.MONGODB_CLUSTER
const DB_NAME = 'bingopedia'
const COLLECTION_NAME = 'leaderboard'

/**
 * Replaces spaces with underscores in article titles.
 * Used when fixing existing leaderboard history entries.
 * 
 * @param title - Article title (may include "[Found] " prefix)
 * @returns Title with spaces replaced by underscores
 */
function replaceSpacesWithUnderscores(title) {
  if (!title || typeof title !== 'string') return title
  
  // If title starts with "[Found] ", replace spaces only in the article title part
  if (title.startsWith('[Found] ')) {
    const articleTitle = title.replace('[Found] ', '')
    return `[Found] ${articleTitle.replace(/\s+/g, '_')}`
  }
  
  // Otherwise, replace all spaces in the title
  return title.replace(/\s+/g, '_')
}

/**
 * Migrates leaderboard history entries to replace spaces with underscores.
 * This ensures consistency with the new format where article titles use underscores instead of spaces.
 */
async function migrateLeaderboardHistorySpaces() {
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

    // Find all entries with history
    const cursor = collection.find({
      history: { $exists: true, $ne: [] },
    })

    let updated = 0
    let checked = 0
    let skipped = 0

    console.log('\nProcessing leaderboard entries...')

    while (await cursor.hasNext()) {
      const entry = await cursor.next()
      if (!entry) continue
      checked += 1

      if (!Array.isArray(entry.history) || entry.history.length === 0) {
        skipped += 1
        continue
      }

      // Process history: replace spaces with underscores
      const fixedHistory = entry.history.map((title) => replaceSpacesWithUnderscores(title))

      // Check if any changes were made
      const hasChanges = fixedHistory.some((fixedTitle, index) => {
        return fixedTitle !== entry.history[index]
      })

      if (hasChanges) {
        await collection.updateOne(
          { _id: entry._id },
          { $set: { history: fixedHistory } }
        )
        updated += 1

        // Log progress every 100 updates
        if (updated % 100 === 0) {
          console.log(`  Updated ${updated} entries...`)
        }
      } else {
        skipped += 1
      }
    }

    console.log('\nMigration complete!')
    console.log(`  Checked: ${checked} entries`)
    console.log(`  Updated: ${updated} entries`)
    console.log(`  Skipped: ${skipped} entries (no changes needed)`)
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

migrateLeaderboardHistorySpaces()

