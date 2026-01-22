import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || 'untitledspacecraftcontrollers_db_user';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || 'tcn4yrc8bgq-DXB0vqe';
const CLUSTER_NAME = process.env.MONGODB_CLUSTER || 'cluster0.rvkwijm.mongodb.net';
const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
const MONGODB_URI = `mongodb+srv://${MONGODB_USERNAME}:${encodedPassword}@${CLUSTER_NAME}/?retryWrites=true&w=majority&appName=Cluster0&authSource=admin`;
const DB_NAME = 'bingopedia';
const COLLECTION_NAME = 'leaderboard';
const KEEP_USERNAME = 'CodapopKSP';

async function cleanLeaderboard() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // First, check if the user exists
    const keepUser = await collection.findOne({ username: KEEP_USERNAME });
    if (!keepUser) {
      console.log(`User "${KEEP_USERNAME}" not found. Nothing to keep.`);
    } else {
      console.log(`Found user "${KEEP_USERNAME}" to keep.`);
    }
    
    // Get total count before deletion
    const totalBefore = await collection.countDocuments({});
    console.log(`Total documents before cleanup: ${totalBefore}`);
    
    // Delete all documents except the one with username "CodapopKSP"
    const result = await collection.deleteMany({ username: { $ne: KEEP_USERNAME } });
    
    console.log(`Deleted ${result.deletedCount} documents`);
    
    // Get count after deletion
    const totalAfter = await collection.countDocuments({});
    console.log(`Total documents after cleanup: ${totalAfter}`);
    
    if (keepUser) {
      console.log(`\nKept user: ${keepUser.username}`);
      console.log(`  Score: ${keepUser.score}`);
      console.log(`  Clicks: ${keepUser.clicks}`);
      console.log(`  Time: ${keepUser.time}s`);
    }
    
  } catch (error) {
    console.error('Error cleaning leaderboard:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nMongoDB connection closed');
    }
  }
}

cleanLeaderboard();

