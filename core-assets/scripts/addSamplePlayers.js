import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection (same as server)
// Using provided database credentials
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || 'untitledspacecraftcontrollers_db_user';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || 'tcn4yrc8bgq-DXB0vqe';
const CLUSTER_NAME = process.env.MONGODB_CLUSTER || 'cluster0.rvkwijm.mongodb.net';
// URL encode the password in case it has special characters
const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
const MONGODB_URI = `mongodb+srv://${MONGODB_USERNAME}:${encodedPassword}@${CLUSTER_NAME}/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;
const DB_NAME = 'bingopedia';
const COLLECTION_NAME = 'leaderboard';

// Helper function to convert hours:minutes:seconds to total seconds
function timeToSeconds(hours, minutes, seconds) {
  return hours * 3600 + minutes * 60 + seconds;
}

// Generate random players
function generateRandomPlayers(count, startIndex = 0) {
  const usernames = [
    'WikiMaster', 'BingoChamp', 'LinkNavigator', 'ArticleHunter', 'QuickClick',
    'SpeedRunner', 'WikipediaWizard', 'BingoPro', 'LinkMaster', 'ArticleAce',
    'WikiExplorer', 'BingoKing', 'LinkFinder', 'ArticleSeeker', 'FastClick',
    'RapidRunner', 'WikiGenius', 'BingoElite', 'LinkPro', 'ArticleMaster',
    'WikiNinja', 'BingoLegend', 'LinkHunter', 'ArticlePro', 'QuickDraw',
    'SwiftRunner', 'WikiSage', 'BingoHero', 'LinkAce', 'ArticleStar',
    'WikiGuru', 'BingoChampion', 'LinkExpert', 'ArticleWhiz', 'SpeedClick',
    'TurboRunner', 'BingoVeteran', 'LinkSpecialist', 'ArticleGuru',
    'WikiPro', 'BingoAce', 'ArticleElite', 'RapidClick',
    'FlashRunner', 'WikiExpert', 'BingoStar', 'LinkNinja', 'ArticleChamp',
    'WikiHero', 'BingoMaster', 'LinkGuru', 'QuickRunner',
    'LightningClick', 'WikiChamp', 'LinkStar',
    'WikiLegend', 'LinkHero', 'SpeedMaster',
    'TurboClick', 'WikiAce', 'BingoGuru',
    'WikiStar', 'LinkChamp', 'RapidMaster',
    'FlashClick', 'WikiElite', 'ArticlePro',
    'WikiVeteran', 'LinkGuru', 'QuickMaster',
    'LightningRunner', 'WikiChampion', 'LinkStar',
    'BingoElite', 'LinkHero', 'SpeedPro'
  ];
  
  const players = [];
  const baseDate = new Date('2024-01-01T00:00:00Z');
  
  for (let i = 0; i < count; i++) {
    // Generate random stats
    const clicks = Math.floor(Math.random() * 30) + 10; // 10-40 clicks
    const minutes = Math.floor(Math.random() * 10) + 2; // 2-12 minutes
    const seconds = Math.floor(Math.random() * 60);
    const time = timeToSeconds(0, minutes, seconds);
    
    // Calculate score (higher score for lower time and clicks)
    const score = Math.floor(1200 - (time / 2) - (clicks * 5));
    
    // Generate date (spread over last 30 days)
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(baseDate);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(Math.floor(Math.random() * 24));
    createdAt.setMinutes(Math.floor(Math.random() * 60));
    
    // Use username with unique index to ensure uniqueness
    const globalIndex = startIndex + i;
    const baseUsername = usernames[globalIndex % usernames.length];
    const suffix = globalIndex >= usernames.length ? Math.floor(globalIndex / usernames.length) : '';
    const username = suffix ? `${baseUsername}${suffix}` : baseUsername;
    
    players.push({
      username: username.trim(),
      clicks,
      time,
      score: Math.max(100, score), // Ensure minimum score of 100
      createdAt
    });
  }
  
  return players;
}

// Original 10 sample players
const originalPlayers = [
  {
    username: 'WikiMaster',
    clicks: 12,
    time: timeToSeconds(0, 3, 45),
    score: 1000,
    createdAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    username: 'BingoChamp',
    clicks: 15,
    time: timeToSeconds(0, 4, 20),
    score: 950,
    createdAt: new Date('2024-01-14T15:22:00Z')
  },
  {
    username: 'LinkNavigator',
    clicks: 18,
    time: timeToSeconds(0, 5, 10),
    score: 850,
    createdAt: new Date('2024-01-13T09:15:00Z')
  },
  {
    username: 'ArticleHunter',
    clicks: 20,
    time: timeToSeconds(0, 6, 30),
    score: 750,
    createdAt: new Date('2024-01-12T14:45:00Z')
  },
  {
    username: 'QuickClick',
    clicks: 14,
    time: timeToSeconds(0, 4, 55),
    score: 900,
    createdAt: new Date('2024-01-11T11:20:00Z')
  },
  {
    username: 'SpeedRunner',
    clicks: 11,
    time: timeToSeconds(0, 3, 20),
    score: 1050,
    createdAt: new Date('2024-01-10T16:10:00Z')
  },
  {
    username: 'WikipediaWizard',
    clicks: 16,
    time: timeToSeconds(0, 5, 5),
    score: 820,
    createdAt: new Date('2024-01-09T13:30:00Z')
  },
  {
    username: 'BingoPro',
    clicks: 19,
    time: timeToSeconds(0, 6, 15),
    score: 780,
    createdAt: new Date('2024-01-08T10:00:00Z')
  },
  {
    username: 'LinkMaster',
    clicks: 13,
    time: timeToSeconds(0, 4, 10),
    score: 920,
    createdAt: new Date('2024-01-07T12:15:00Z')
  },
  {
    username: 'ArticleAce',
    clicks: 17,
    time: timeToSeconds(0, 5, 40),
    score: 800,
    createdAt: new Date('2024-01-06T08:45:00Z')
  }
];

// Generate 90 more random players
const additionalPlayers = generateRandomPlayers(90);
const samplePlayers = [...originalPlayers, ...additionalPlayers];

async function addSamplePlayers() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all existing usernames to avoid duplicates
    const existingUsernames = await collection.find({})
      .project({ username: 1 })
      .toArray();
    const existingUsernameSet = new Set(existingUsernames.map(u => u.username));
    
    // Filter out existing players
    const newPlayers = samplePlayers.filter(p => !existingUsernameSet.has(p.username));
    
    if (newPlayers.length === 0) {
      console.log('All sample players already exist.');
      const totalCount = await collection.countDocuments({});
      console.log(`Total players in database: ${totalCount}`);
      if (totalCount < 100) {
        console.log(`Generating ${100 - totalCount} more players to reach 100 total...`);
        const additionalNeeded = 100 - totalCount;
        // Use a high start index to avoid conflicts
        const morePlayers = generateRandomPlayers(additionalNeeded, 1000);
        
        // Filter out any duplicates
        const uniqueMorePlayers = morePlayers.filter(p => !existingUsernameSet.has(p.username));
        
        if (uniqueMorePlayers.length > 0) {
          const result = await collection.insertMany(uniqueMorePlayers);
          console.log(`Successfully added ${result.insertedCount} more players!`);
        } else {
          console.log('Could not generate unique players. Some may already exist.');
        }
      }
      return;
    }
    
    console.log(`Adding ${newPlayers.length} new sample players...`);
    const result = await collection.insertMany(newPlayers);
    console.log(`Successfully added ${result.insertedCount} sample players!`);
    
    // Check if we need more to reach 100
    const totalCount = await collection.countDocuments({});
    if (totalCount < 100) {
      console.log(`Total players: ${totalCount}. Generating ${100 - totalCount} more to reach 100...`);
      const additionalNeeded = 100 - totalCount;
      const allUsernames = await collection.find({}).project({ username: 1 }).toArray();
      const allUsernameSet = new Set(allUsernames.map(u => u.username));
      
      // Generate unique players with high start index
      const morePlayers = generateRandomPlayers(additionalNeeded, 1000);
      const uniqueMorePlayers = morePlayers.filter(p => !allUsernameSet.has(p.username));
      
      if (uniqueMorePlayers.length > 0) {
        const addResult = await collection.insertMany(uniqueMorePlayers);
        console.log(`Successfully added ${addResult.insertedCount} more players!`);
      } else {
        console.log('Could not generate unique players. Some may already exist.');
      }
    }
    
    // Display the leaderboard
    console.log('\nCurrent leaderboard:');
    const leaderboard = await collection
      .find({})
      .sort({ score: -1 })
      .limit(10)
      .toArray();
    
    leaderboard.forEach((player, index) => {
      const hours = Math.floor(player.time / 3600);
      const minutes = Math.floor((player.time % 3600) / 60);
      const seconds = player.time % 60;
      const timeStr = hours > 0 
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${minutes}:${String(seconds).padStart(2, '0')}`;
      
      console.log(`${index + 1}. ${player.username} - Score: ${player.score}, Time: ${timeStr}, Clicks: ${player.clicks}`);
    });
    
  } catch (error) {
    console.error('Error adding sample players:', error);
    if (error.code === 'ENOTFOUND' || error.message.includes('cluster')) {
      console.error('\n⚠️  MongoDB connection failed. Please check:');
      console.error('1. Your MongoDB Atlas cluster name in the connection string');
      console.error('2. The cluster name format should be: cluster0.xxxxx.mongodb.net');
      console.error('3. You can set MONGODB_CLUSTER environment variable:');
      console.error('   export MONGODB_CLUSTER=cluster0.xxxxx.mongodb.net');
      console.error('4. Or update CLUSTER_NAME in scripts/addSamplePlayers.js');
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nMongoDB connection closed');
    }
  }
}

addSamplePlayers();

