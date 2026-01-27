const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const MONGODB_USERNAME = process.env.MONGODB_USERNAME
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD
const CLUSTER_NAME = process.env.MONGODB_CLUSTER
const DB_NAME = 'bingopedia'
const COLLECTION_NAME = 'leaderboard'

const stripFoundTag = (title) =>
  typeof title === 'string' && title.startsWith('[Found] ')
    ? title.replace('[Found] ', '')
    : title

const addFoundTagsToHistory = (history, boardTitles) => {
  const seen = new Set()
  const boardSet = new Set(boardTitles)

  return history.map((title) => {
    if (!title) return title
    if (!boardSet.has(title)) return title
    if (seen.has(title)) return title
    seen.add(title)
    return `[Found] ${title}`
  })
}

async function migrateLeaderboardHistoryFoundTags() {
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

    const cursor = collection.find({
      history: { $exists: true, $ne: [] },
      $or: [
        { bingopediaGame: { $exists: true, $ne: [] } },
        { bingoSquares: { $exists: true, $ne: [] } },
      ],
    })

    let updated = 0
    let checked = 0

    while (await cursor.hasNext()) {
      const entry = await cursor.next()
      if (!entry) continue
      checked += 1

      const rawBoard =
        (Array.isArray(entry.bingopediaGame) && entry.bingopediaGame.slice(0, 25)) ||
        (Array.isArray(entry.bingoSquares) && entry.bingoSquares.slice(0, 25)) ||
        []

      const boardTitles = rawBoard.map(stripFoundTag)
      const cleanBingopediaGame = Array.isArray(entry.bingopediaGame)
        ? entry.bingopediaGame.map(stripFoundTag)
        : undefined

      const historyHasFound =
        Array.isArray(entry.history) &&
        entry.history.some((title) => typeof title === 'string' && title.startsWith('[Found] '))

      const nextHistory =
        Array.isArray(entry.history) && !historyHasFound
          ? addFoundTagsToHistory(entry.history.map(stripFoundTag), boardTitles)
          : entry.history

      const update = {}

      if (
        cleanBingopediaGame &&
        JSON.stringify(cleanBingopediaGame) !== JSON.stringify(entry.bingopediaGame)
      ) {
        update.bingopediaGame = cleanBingopediaGame
      }

      if (nextHistory && JSON.stringify(nextHistory) !== JSON.stringify(entry.history)) {
        update.history = nextHistory
      }

      if (Object.keys(update).length > 0) {
        await collection.updateOne({ _id: entry._id }, { $set: update })
        updated += 1
      }
    }

    console.log(`Checked ${checked} entries. Updated ${updated} entries.`)
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

migrateLeaderboardHistoryFoundTags()

