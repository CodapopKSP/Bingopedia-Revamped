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

    const filter = {
      bingopediaGame: { $exists: false },
      bingoSquares: { $size: 25 },
      history: { $exists: true, $ne: [] },
    }

    const result = await collection.updateMany(filter, [
      {
        $set: {
          bingopediaGame: {
            $concatArrays: ['$bingoSquares', [{ $arrayElemAt: ['$history', 0] }]],
          },
        },
      },
    ])

    console.log(
      `Updated ${result.modifiedCount} entries with bingopediaGame (matched ${result.matchedCount}).`
    )
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

