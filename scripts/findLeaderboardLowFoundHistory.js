const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const MONGODB_USERNAME = process.env.MONGODB_USERNAME
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD
const CLUSTER_NAME = process.env.MONGODB_CLUSTER
const DB_NAME = 'bingopedia'
const COLLECTION_NAME = 'leaderboard'

const countFoundInHistory = (history = []) =>
  history.filter((title) => typeof title === 'string' && title.startsWith('[Found] ')).length

async function findLeaderboardLowFoundHistory() {
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

    const cursor = collection.find({ history: { $exists: true, $ne: [] } })

    let checked = 0
    let flagged = 0

    console.log('Entries with fewer than 5 [Found] in history:')
    while (await cursor.hasNext()) {
      const entry = await cursor.next()
      if (!entry) continue
      checked += 1

      const foundCount = countFoundInHistory(entry.history)
      if (foundCount < 5) {
        flagged += 1
        console.log(
          `- id=${entry._id} username=${entry.username ?? 'unknown'} found=${foundCount} historyLen=${
            Array.isArray(entry.history) ? entry.history.length : 0
          }`
        )
      }
    }

    console.log(`\nChecked ${checked} entries. Found ${flagged} entries under 5.`)
  } catch (error) {
    console.error('Error during scan:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('\nMongoDB connection closed')
    }
  }
}

findLeaderboardLowFoundHistory()

