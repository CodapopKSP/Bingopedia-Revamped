#!/usr/bin/env node

/**
 * Test script for submitting scores to the leaderboard API.
 * 
 * Usage:
 *   node scripts/testScoreSubmission.js [options]
 * 
 * Options:
 *   --url <url>          API endpoint URL (default: http://localhost:3001/api/leaderboard)
 *   --username <name>    Username (default: TestUser)
 *   --gameType <type>   Game type: 'random' or 'repeat' (default: random, auto-set to 'repeat' if --generatedGame provided)
 *   --generatedGame <id> Generated game ID (16-char hash) for shared/repeat games (sets gameType to 'repeat')
 *   --with-bingopedia   Include bingopediaGame field (default: true)
 *   --without-bingopedia Don't include bingopediaGame field
 * 
 * Examples:
 *   node scripts/testScoreSubmission.js
 *   node scripts/testScoreSubmission.js --username "TestPlayer" --gameType random
 *   node scripts/testScoreSubmission.js --generatedGame "XHZ$G$z4y4zz46" --username "SharedGamePlayer"
 *   node scripts/testScoreSubmission.js --url http://localhost:3000/api/leaderboard
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  url: 'http://localhost:3001/api/leaderboard',
  username: 'TestUser',
  gameType: 'random',
  generatedGame: null,
  includeBingopediaGame: true,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--url' && args[i + 1]) {
    options.url = args[++i];
  } else if (arg === '--username' && args[i + 1]) {
    options.username = args[++i];
  } else if (arg === '--gameType' && args[i + 1]) {
    options.gameType = args[++i];
  } else if (arg === '--generatedGame' && args[i + 1]) {
    options.generatedGame = args[++i];
    // Automatically set gameType to 'repeat' when generatedGame is provided
    if (!args.includes('--gameType')) {
      options.gameType = 'repeat';
    }
  } else if (arg === '--with-bingopedia') {
    options.includeBingopediaGame = true;
  } else if (arg === '--without-bingopedia') {
    options.includeBingopediaGame = false;
  }
}

// Generate sample data
function generateSampleBingoSquares() {
  // Generate 25 sample article titles
  const articles = [
    'United States', 'France', 'Japan', 'Germany', 'United Kingdom',
    'Canada', 'Australia', 'Italy', 'Spain', 'Brazil',
    'India', 'China', 'Russia', 'Mexico', 'South Korea',
    'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland',
    'Poland', 'Argentina', 'Chile', 'New Zealand', 'Belgium'
  ];
  return articles.slice(0, 25);
}

function generateSampleHistory(bingoSquares, startingTitle) {
  // Generate a history with the starting title first, then some navigation
  const history = [startingTitle];
  
  // Add some articles that aren't in the bingo grid
  const nonBingoArticles = [
    'Wikipedia', 'Internet', 'Computer', 'Technology', 'Science',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History'
  ];
  
  // Add a few non-bingo articles
  for (let i = 0; i < 5; i++) {
    history.push(nonBingoArticles[i]);
  }
  
  // Add some bingo squares with [Found] tags
  for (let i = 0; i < 3; i++) {
    history.push(`[Found] ${bingoSquares[i]}`);
  }
  
  return history;
}

async function submitScore() {
  const bingoSquares = generateSampleBingoSquares();
  const startingTitle = bingoSquares[0]; // Use first bingo square as starting title
  const history = generateSampleHistory(bingoSquares, startingTitle);
  
  // Create bingopediaGame: 25 squares + 1 starting title = 26 elements
  const bingopediaGame = options.includeBingopediaGame 
    ? [...bingoSquares, startingTitle]
    : undefined;
  
  const payload = {
    username: options.username,
    score: Math.floor(Math.random() * 50000) + 10000, // Random score between 10k and 60k
    time: Math.floor(Math.random() * 1000) + 300, // Random time between 300 and 1300 seconds
    clicks: Math.floor(Math.random() * 50) + 30, // Random clicks between 30 and 80
    history: history,
    gameType: options.gameType,
  };
  
  if (bingopediaGame) {
    payload.bingopediaGame = bingopediaGame;
  }
  
  if (options.generatedGame) {
    payload.generatedGame = options.generatedGame;
  }
  
  console.log('Submitting score with payload:');
  console.log(JSON.stringify({
    username: payload.username,
    score: payload.score,
    time: payload.time,
    clicks: payload.clicks,
    bingoSquaresLength: 0, // Not sent - will be derived from bingopediaGame
    bingopediaGameLength: payload.bingopediaGame?.length || 0,
    historyLength: payload.history.length,
    gameType: payload.gameType,
    generatedGame: payload.generatedGame || '(none)',
    hasBingopediaGame: !!payload.bingopediaGame,
    isSharedGame: !!payload.generatedGame,
  }, null, 2));
  
  const url = new URL(options.url);
  const isHttps = url.protocol === 'https:';
  const httpModule = isHttps ? https : http;
  
  const postData = JSON.stringify(payload);
  
  const requestOptions = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };
  
  return new Promise((resolve, reject) => {
    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n✅ Success! Score submitted.');
            console.log('\nFull Response:');
            console.log(JSON.stringify(response, null, 2));
            console.log('\nKey Fields Check:');
            console.log(JSON.stringify({
              _id: response._id,
              username: response.username,
              score: response.score,
              gameType: response.gameType,
              hasGameType: !!response.gameType,
              generatedGame: response.generatedGame || '(none)',
              hasGeneratedGame: !!response.generatedGame,
              hasBingopediaGame: !!response.bingopediaGame,
              bingopediaGameLength: response.bingopediaGame?.length || 0,
              bingoSquaresLength: response.bingoSquares?.length || 0,
              historyLength: response.history?.length || 0,
              createdAt: response.createdAt,
              isSharedGame: !!response.generatedGame,
            }, null, 2));
            resolve(response);
          } else {
            console.error('\n❌ Error:', res.statusCode, res.statusMessage);
            console.error('Response:', JSON.stringify(response, null, 2));
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        } catch (error) {
          console.error('\n❌ Error parsing response:', error.message);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ Request error:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
submitScore()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });

