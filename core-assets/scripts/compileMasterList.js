#!/usr/bin/env node

/**
 * Compiles a master list of all articles from all Wikipedia lists in sampleLists.md
 * Outputs a simple text file organized by list
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
  // Check both space and underscore versions
  const skipPatterns = [
    'List of', 'List_of', 
    'Timeline of', 'Timeline_of', 
    'Index of', 'Index_of',
    'History of', 'History_of',
    'Lists of', 'Lists_of'
  ];
  
  // Normalize title to check (replace underscores with spaces for comparison)
  const normalizedTitle = title.replace(/_/g, ' ');
  
  for (const pattern of skipPatterns) {
    const normalizedPattern = pattern.replace(/_/g, ' ');
    if (normalizedTitle.startsWith(normalizedPattern) || title.startsWith(pattern)) {
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
 * Validates that articles actually exist on Wikipedia (filters out red links)
 * Checks in batches of 50 articles at a time
 */
async function validateArticlesExist(titles) {
  const batchSize = 50;
  const validArticles = [];
  
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    const titlesParam = batch.map(t => t.replace(/ /g, '_')).join('|');
    const encodedTitles = encodeURIComponent(titlesParam);
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitles}&format=json&origin=*`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': API_HEADERS['User-Agent'],
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`    Warning: Failed to validate batch (${response.status}), keeping all articles`);
        validArticles.push(...batch);
        continue;
      }
      
      const data = await response.json();
      
      if (data && data.query && data.query.pages) {
        // Check which pages exist (page ID !== -1)
        for (const pageId in data.query.pages) {
          const page = data.query.pages[pageId];
          // Only include if page exists (not -1) and is not a redirect to a non-existent page
          if (pageId !== '-1' && !page.missing) {
            validArticles.push(page.title);
          }
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`    Warning: Error validating batch: ${error.message}, keeping all articles`);
      validArticles.push(...batch);
    }
  }
  
  return validArticles;
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
      
      // Limit to avoid extremely large lists
      if (allLinks.length > 10000) {
        console.log(`    (limiting to first 10000 links)`);
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
 * Main function to compile master list
 */
async function compileMasterList() {
  console.log('Compiling master list of all articles from all lists...\n');
  
  // Read the sampleLists.md file
  const listsFilePath = path.join(__dirname, '..', 'sampleLists.md');
  const listsContent = await fs.readFile(listsFilePath, 'utf-8');
  
  // Extract list URLs
  const listUrls = listsContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('https://en.wikipedia.org/wiki/'));
  
  console.log(`Found ${listUrls.length} lists to process\n`);
  
  // Extract titles from URLs
  const listTitles = listUrls
    .map(url => extractTitleFromUrl(url))
    .filter(title => title !== null);
  
  let outputText = 'MASTER LIST OF ALL ARTICLES\n';
  outputText += '='.repeat(80) + '\n\n';
  
  const allData = [];
  let totalArticles = 0;
  
  for (let i = 0; i < listTitles.length; i++) {
    const listTitle = listTitles[i];
    
    try {
      console.log(`[${i + 1}/${listTitles.length}] Fetching: ${listTitle}...`);
      
      // Fetch articles from this list
      const allArticles = await fetchPageLinks(listTitle);
      console.log(`  Found ${allArticles.length} linked articles`);
      
      // Validate that articles actually exist (filter out red links)
      console.log(`  Validating articles exist...`);
      const articles = await validateArticlesExist(allArticles);
      const redLinksCount = allArticles.length - articles.length;
      if (redLinksCount > 0) {
        console.log(`  Filtered out ${redLinksCount} red links`);
      }
      console.log(`  ${articles.length} valid articles\n`);
      
      // Add to output with URLs
      outputText += `${listTitle}\n`;
      articles.forEach(article => {
        const urlTitle = article.replace(/ /g, '_');
        const encodedTitle = encodeURIComponent(urlTitle);
        const url = `https://en.wikipedia.org/wiki/${encodedTitle}`;
        outputText += `    ${url}\n`;
      });
      outputText += '\n';
      
      allData.push({
        list: listTitle,
        articleCount: articles.length,
        articles: articles
      });
      
      totalArticles += articles.length;
      
      // Small delay to respect rate limits (increased due to batch validation)
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.warn(`  Error fetching "${listTitle}": ${error.message}\n`);
      outputText += `${listTitle}\n`;
      outputText += `    (Error: ${error.message})\n\n`;
      continue;
    }
  }
  
  // Add summary at the end
  outputText += '='.repeat(80) + '\n';
  outputText += 'SUMMARY\n';
  outputText += '='.repeat(80) + '\n\n';
  outputText += `Total lists: ${allData.length}\n`;
  outputText += `Total articles: ${totalArticles}\n\n`;
  
  allData.forEach(item => {
    outputText += `${item.list}: ${item.articleCount} articles\n`;
  });
  
  // Save to text file
  const outputPath = path.join(__dirname, '..', 'data', 'masterArticleList.txt');
  await fs.writeFile(outputPath, outputText, 'utf-8');
  
  console.log(`\n${'='.repeat(60)}\n`);
  console.log(`✅ Master list compiled!`);
  console.log(`\nTotal lists: ${allData.length}`);
  console.log(`Total articles: ${totalArticles}`);
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  return allData;
}

// Run the script
compileMasterList()
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });

