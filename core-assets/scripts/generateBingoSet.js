#!/usr/bin/env node

/**
 * Generates a bingo set of 26 articles by randomly selecting from list pages
 * Picks 1-3 articles from each list until we have 26 total
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wikipedia API headers
const API_HEADERS = {
  'User-Agent': 'Bingopedia/1.0 (https://github.com/yourusername/bingopedia; contact@example.com)',
  'Accept': 'application/json'
};

/**
 * Checks if a Wikipedia page title represents a real article
 */
function isRealArticle(title) {
  const nonArticleNamespaces = [
    'Special:', 'Wikipedia:', 'Help:', 'Template:', 'File:', 'Image:', 'Media:',
    'Portal:', 'Category:', 'User:', 'User talk:', 'Wikipedia talk:', 'Template talk:',
    'File talk:', 'MediaWiki:', 'MediaWiki talk:', 'Talk:', 'Draft:', 'Draft talk:',
    'TimedText:', 'TimedText talk:', 'Module:', 'Module talk:', 'Gadget:',
    'Gadget talk:', 'Gadget definition:', 'Gadget definition talk:'
  ];

  if (title === 'Main_Page' || title === 'Main Page') {
    return false;
  }

  if (title.endsWith(' (disambiguation)') || title.endsWith('_(disambiguation)')) {
    return false;
  }

  // Skip articles starting with "List of" or "History of"
  const skipPatterns = [
    'List of', 'List_of', 
    'Timeline of', 'Timeline_of', 
    'Index of', 'Index_of',
    'History of', 'History_of'
  ];
  for (const pattern of skipPatterns) {
    if (title.startsWith(pattern) || title.startsWith(pattern.replace(' ', '_'))) {
      return false;
    }
  }

  if (title.startsWith('Category:') || title.startsWith('Category_')) {
    return false;
  }

  for (const namespace of nonArticleNamespaces) {
    if (title.startsWith(namespace)) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts title from Wikipedia URL
 */
function extractTitleFromUrl(url) {
  const match = url.match(/\/wiki\/(.+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Fetches article links from a Wikipedia page
 */
async function fetchPageLinks(title) {
  const urlTitle = title.replace(/ /g, '_');
  const encodedTitle = encodeURIComponent(urlTitle);
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=links&pllimit=max&format=json&origin=*`;
  
  const allLinks = [];
  let continueParam = null;
  
  do {
    let currentUrl = apiUrl;
    if (continueParam) {
      const continueStr = Object.entries(continueParam)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      currentUrl = `${apiUrl}&${continueStr}`;
    }
    
    try {
      const response = await fetch(currentUrl, {
        headers: {
          'User-Agent': API_HEADERS['User-Agent'],
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Wikipedia API error: ${data.error.info || 'Unknown error'}`);
      }
      
      if (data && data.query && data.query.pages) {
        const pageIds = Object.keys(data.query.pages);
        if (pageIds.length === 0 || pageIds[0] === '-1') {
          throw new Error(`Page not found: ${title}`);
        }
        
        const pageId = pageIds[0];
        const page = data.query.pages[pageId];
        
        if (page && page.links && Array.isArray(page.links)) {
          allLinks.push(...page.links);
        }
        
        if (data.continue) {
          continueParam = {};
          if (data.continue.plcontinue) {
            continueParam.plcontinue = data.continue.plcontinue;
          }
          if (data.continue.continue) {
            continueParam.continue = data.continue.continue;
          }
          if (!continueParam.plcontinue) {
            continueParam = null;
          }
        } else {
          continueParam = null;
        }
      } else {
        continueParam = null;
      }
      
      if (allLinks.length > 5000) {
        break;
      }
    } catch (error) {
      throw new Error(`Failed to fetch links: ${error.message}`);
    }
  } while (continueParam);
  
  // Filter to only main namespace articles
  const articleLinks = allLinks
    .filter(link => {
      if (!link || !link.title) {
        return false;
      }
      if (typeof link.ns === 'number') {
        return link.ns === 0;
      }
      return !link.title.includes(':');
    })
    .map(link => link.title)
    .filter(title => isRealArticle(title));
  
  return articleLinks;
}

/**
 * Gets random items from an array
 */
function getRandomItems(array, count) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Shuffles an array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Main function to generate a bingo set
 */
async function generateBingoSet(targetCount = 26) {
  console.log(`Generating bingo set of ${targetCount} articles...\n`);
  
  // Read the sampleLists.md file
  const listsFilePath = path.join(__dirname, '..', 'sampleLists.md');
  const listsContent = await fs.readFile(listsFilePath, 'utf-8');
  
  // Extract list URLs
  const listUrls = listsContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('https://en.wikipedia.org/wiki/'));
  
  console.log(`Found ${listUrls.length} list pages in sampleLists.md\n`);
  
  // Extract titles from URLs
  const listTitles = listUrls
    .map(url => extractTitleFromUrl(url))
    .filter(title => title !== null);
  
  // Shuffle the list titles for random selection
  const shuffledLists = shuffleArray(listTitles);
  
  const selectedArticles = [];
  const usedArticles = new Set();
  const listStats = [];
  
  for (const listTitle of shuffledLists) {
    if (selectedArticles.length >= targetCount) {
      break;
    }
    
    try {
      console.log(`Fetching articles from: ${listTitle}...`);
      
      // Fetch articles from this list
      const articles = await fetchPageLinks(listTitle);
      
      if (articles.length === 0) {
        console.log(`  No articles found in this list, skipping.\n`);
        continue;
      }
      
      // Take exactly 1 article from this list
      const countToTake = 1;
      
      // Get random articles that we haven't used yet
      const availableArticles = articles.filter(title => !usedArticles.has(title));
      const randomArticles = getRandomItems(availableArticles, countToTake);
      
      if (randomArticles.length === 0) {
        console.log(`  All articles from this list already selected, skipping.\n`);
        continue;
      }
      
      // Add to our collection
      randomArticles.forEach(article => {
        selectedArticles.push({
          title: article,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.replace(/ /g, '_'))}`,
          sourceList: listTitle
        });
        usedArticles.add(article);
      });
      
      listStats.push({
        list: listTitle,
        totalArticles: articles.length,
        selected: randomArticles.length
      });
      
      console.log(`  Selected ${randomArticles.length} article(s) (${articles.length} available)\n`);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.warn(`  Error fetching from "${listTitle}": ${error.message}\n`);
      continue;
    }
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
  console.log(`✅ Generated bingo set with ${selectedArticles.length} articles\n`);
  
  // Display the results
  console.log('ARTICLES:\n');
  selectedArticles.forEach((article, index) => {
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${article.title}`);
    console.log(`    Source: ${article.sourceList}`);
    console.log(`    URL: ${article.url}\n`);
  });
  
  // Display statistics
  console.log(`\nSTATISTICS:\n`);
  console.log(`Lists used: ${listStats.length}`);
  listStats.forEach(stat => {
    console.log(`  ${stat.list}: ${stat.selected} from ${stat.totalArticles}`);
  });
  
  // Save to file
  const output = {
    generatedAt: new Date().toISOString(),
    targetCount: targetCount,
    actualCount: selectedArticles.length,
    listsUsed: listStats.length,
    articles: selectedArticles,
    statistics: listStats
  };
  
  const outputPath = path.join(__dirname, '..', 'data', 'bingoSet.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  return output;
}

// Run the script
const targetCount = process.argv[2] ? parseInt(process.argv[2]) : 26;

generateBingoSet(targetCount)
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });

