const { MongoClient } = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const MONGODB_USERNAME = process.env.MONGODB_USERNAME
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD
const CLUSTER_NAME = process.env.MONGODB_CLUSTER
const DB_NAME = 'bingopedia'
const COLLECTION_NAME = 'leaderboard'

const normalizeTitle = (title) =>
  typeof title === 'string' ? title.trim().replace(/_/g, ' ').toLowerCase() : ''

async function resolveRedirect(title) {
  const encoded = encodeURIComponent(title)
  const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&titles=${encoded}&format=json&origin=*`

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return title
    const data = await response.json()
    const pages = data?.query?.pages || {}
    const page = Object.values(pages)[0]
    if (page && typeof page === 'object' && page.title) {
      return page.title
    }
    return title
  } catch {
    return title
  }
}

async function findLeaderboardHistoryRedirectMismatches() {
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

    let checked = 0
    let flagged = 0

    while (await cursor.hasNext()) {
      const entry = await cursor.next()
      if (!entry) continue
      checked += 1

      const rawBoard = Array.isArray(entry.bingopediaGame)
        ? entry.bingopediaGame.slice(0, 25)
        : Array.isArray(entry.bingoSquares)
          ? entry.bingoSquares.slice(0, 25)
          : []
      const cleanedBoard = rawBoard.map((title) =>
        typeof title === 'string' && title.startsWith('[Found] ')
          ? title.replace('[Found] ', '')
          : title
      )

      const boardNormalized = cleanedBoard.map((title) => normalizeTitle(title))
      const boardRedirects = new Map()

      for (const title of cleanedBoard) {
        const resolved = await resolveRedirect(title)
        boardRedirects.set(normalizeTitle(title), normalizeTitle(resolved))
      }

      const history = Array.isArray(entry.history) ? entry.history : []
      const mismatches = []

      for (const historyTitle of history) {
        if (typeof historyTitle !== 'string') continue
        const isTagged = historyTitle.startsWith('[Found] ')
        const cleanTitle = isTagged ? historyTitle.replace('[Found] ', '') : historyTitle
        const normalizedHistory = normalizeTitle(cleanTitle)
        const resolvedHistory = normalizeTitle(await resolveRedirect(cleanTitle))

        const matchesBoard =
          boardNormalized.includes(normalizedHistory) ||
          boardNormalized.includes(resolvedHistory) ||
          Array.from(boardRedirects.values()).includes(normalizedHistory) ||
          Array.from(boardRedirects.values()).includes(resolvedHistory)

        if (matchesBoard && !isTagged) {
          const matchedBoard =
            cleanedBoard[boardNormalized.indexOf(normalizedHistory)] ||
            cleanedBoard[boardNormalized.indexOf(resolvedHistory)] ||
            null
          mismatches.push({
            historyTitle: cleanTitle,
            matchedBoard,
          })
        }
      }

      if (mismatches.length > 0) {
        flagged += 1
        console.log(`\nEntry ${entry._id} (${entry.username || 'unknown'})`)
        mismatches.forEach((item) => {
          console.log(`  history="${item.historyTitle}" -> board="${item.matchedBoard || 'unknown'}"`)
        })
      }
    }

    console.log(`\nChecked ${checked} entries. Found ${flagged} entries with untagged redirect matches.`)
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

findLeaderboardHistoryRedirectMismatches()

