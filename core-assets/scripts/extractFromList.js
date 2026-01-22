#!/usr/bin/env node

/**
 * Extracts random articles from a Wikipedia list page
 * Usage: node extractFromList.js "List of animal names" 5
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wikipedia API requires a User-Agent header
const API_HEADERS = {
  'User-Agent': 'Bingopedia/1.0 (https://github.com/yourusername/bingopedia; contact@example.com)',
  'Accept': 'text/html'
};

/**
 * Checks if a Wikipedia page title represents a real article (not infrastructure)
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

  // Don't filter out list pages here - we want to extract from them
  // But we don't want to return other list pages as results
  const listPatterns = ['List of', 'List_of', 'Timeline of', 'Timeline_of', 'Index of', 'Index_of'];
  for (const pattern of listPatterns) {
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
 * Fetches article links from a Wikipedia page using the Action API
 */
async function fetchPageLinks(title) {
  const urlTitle = title.replace(/ /g, '_');
  const encodedTitle = encodeURIComponent(urlTitle);
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=links&pllimit=max&format=json&origin=*`;
  
  const allLinks = [];
  let continueParam = null;
  
  // Handle pagination - Wikipedia API may return links in chunks
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
      
      // Check for API errors
      if (data.error) {
        throw new Error(`Wikipedia API error: ${data.error.info || 'Unknown error'}`);
      }
      
      // Wikipedia API returns data in query.pages structure
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
        
        // Check for continuation (more links available)
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
      
      // Limit to reasonable number of requests
      if (allLinks.length > 5000) {
        break;
      }
    } catch (error) {
      throw new Error(`Failed to fetch links: ${error.message}`);
    }
  } while (continueParam);
  
  // Filter to only main namespace articles (ns: 0)
  const articleLinks = allLinks
    .filter(link => {
      if (!link || !link.title) {
        return false;
      }
      // Use namespace field if available (ns: 0 = main namespace)
      if (typeof link.ns === 'number') {
        return link.ns === 0;
      }
      // Fallback: check title doesn't have namespace prefix
      return !link.title.includes(':');
    })
    .map(link => link.title);
  
  return articleLinks;
}

/**
 * Extracts article links from a Wikipedia list page
 */
async function extractArticleLinks(listTitle) {
  const allLinks = await fetchPageLinks(listTitle);
  
  // Filter to only real articles (not lists, categories, etc.)
  const articles = allLinks.filter(title => {
    // Skip the source page itself
    if (title === listTitle || title.replace(/_/g, ' ') === listTitle.replace(/_/g, ' ')) {
      return false;
    }
    return isRealArticle(title);
  });
  
  return articles;
}

/**
 * Gets random items from an array
 */
function getRandomItems(array, count) {
  const shuffled = [...array];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Main function to extract random articles from a list
 */
async function extractFromList(listTitle, count = 5) {
  console.log(`Extracting ${count} random articles from: "${listTitle}"\n`);
  
  try {
    // Extract article links from the list page
    console.log('Fetching article links from list page...');
    const articles = await extractArticleLinks(listTitle);
    
    console.log(`Found ${articles.length} articles in the list\n`);
    
    if (articles.length === 0) {
      throw new Error('No articles found in the list page');
    }
    
    // Get random articles
    const randomArticles = getRandomItems(articles, count);
    
    // Format results
    const results = randomArticles.map((title, index) => {
      const urlTitle = title.replace(/ /g, '_');
      const encodedTitle = encodeURIComponent(urlTitle);
      
      return {
        title: title,
        url: `https://en.wikipedia.org/wiki/${encodedTitle}`,
        index: index + 1
      };
    });
    
    return {
      sourceList: listTitle,
      totalArticlesFound: articles.length,
      requestedCount: count,
      extractedCount: randomArticles.length,
      articles: results
    };
    
  } catch (error) {
    throw new Error(`Failed to extract articles: ${error.message}`);
  }
}

// Run the script
const listTitle = process.argv[2];
const count = process.argv[3] ? parseInt(process.argv[3]) : 5;

if (!listTitle) {
  console.error('Usage: node extractFromList.js "List of animal names" [count]');
  console.error('Example: node extractFromList.js "List of animal names" 5');
  process.exit(1);
}

extractFromList(listTitle, count)
  .then(results => {
    console.log('✅ Successfully extracted articles:\n');
    results.articles.forEach(article => {
      console.log(`${article.index}. ${article.title}`);
      console.log(`   ${article.url}\n`);
    });
    
    console.log(`\nTotal articles in list: ${results.totalArticlesFound}`);
    console.log(`Extracted: ${results.extractedCount} random articles`);
    
    // Optionally save to file
    const outputPath = path.join(__dirname, '..', 'data', `extracted_${listTitle.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    return fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8')
      .then(() => {
        console.log(`\nResults saved to: ${outputPath}`);
      });
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });

