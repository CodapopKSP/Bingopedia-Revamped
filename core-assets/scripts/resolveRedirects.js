#!/usr/bin/env node

/**
 * Resolves Wikipedia redirects in masterArticleList.txt
 * Updates all article URLs to their canonical (final) titles
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

// Rate limiting: delay between API calls (ms)
const API_DELAY = 100; // 100ms = ~10 requests per second (well under Wikipedia's limit)

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
 * Resolves redirects for a Wikipedia article title
 * Returns the canonical (final) title after following all redirects
 */
async function resolveRedirect(title) {
  try {
    const encodedTitle = encodeURIComponent(title);
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&redirects=1&format=json&origin=*`;
    
    const response = await fetch(apiUrl, {
      headers: API_HEADERS
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Wikipedia API error: ${data.error.info || 'Unknown error'}`);
    }
    
    // Get the page ID from the response
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || pageId === '-1') {
      // Page doesn't exist
      console.warn(`  ⚠️  Page not found: ${title}`);
      return null;
    }
    
    const page = pages[pageId];
    
    // If there was a redirect, the 'redirects' array will contain the mapping
    // The final title is in the page object
    const canonicalTitle = page.title;
    
    // Check if there was actually a redirect
    if (data.query?.redirects && data.query.redirects.length > 0) {
      const redirect = data.query.redirects[0];
      if (redirect.from !== canonicalTitle) {
        console.log(`  ↪️  ${redirect.from} → ${canonicalTitle}`);
        return canonicalTitle;
      }
    }
    
    // No redirect, return original title
    return canonicalTitle;
  } catch (error) {
    console.error(`  ❌ Error resolving redirect for "${title}":`, error.message);
    return null;
  }
}

/**
 * Converts a title to a Wikipedia URL
 */
function titleToUrl(title) {
  const encodedTitle = encodeURIComponent(title);
  return `https://en.wikipedia.org/wiki/${encodedTitle}`;
}

/**
 * Processes the masterArticleList.txt file
 */
async function resolveRedirectsInFile() {
  const filePath = path.join(__dirname, '..', 'data', 'masterArticleList.txt');
  
  console.log('Reading masterArticleList.txt...');
  const content = await fs.readFile(filePath, 'utf-8');
  
  const lines = content.split('\n');
  const updatedLines = [];
  let totalArticles = 0;
  let resolvedCount = 0;
  let errorCount = 0;
  
  console.log(`Processing ${lines.length} lines...\n`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a category header (no indentation)
    if (line.trim() && !line.startsWith('    ')) {
      updatedLines.push(line);
      continue;
    }
    
    // Check if this is an article URL (indented with URL)
    const urlMatch = line.match(/^    (https:\/\/en\.wikipedia\.org\/wiki\/.+)$/);
    if (urlMatch) {
      const url = urlMatch[1];
      const title = extractTitleFromUrl(url);
      
      if (title) {
        totalArticles++;
        process.stdout.write(`[${totalArticles}] Resolving: ${title}...`);
        
        // Resolve redirect
        const canonicalTitle = await resolveRedirect(title);
        
        if (canonicalTitle) {
          // Check if it's different from the original
          if (canonicalTitle !== title) {
            resolvedCount++;
            const canonicalUrl = titleToUrl(canonicalTitle);
            updatedLines.push(`    ${canonicalUrl}`);
            process.stdout.write(` ✓\n`);
          } else {
            // No redirect, keep original
            updatedLines.push(line);
            process.stdout.write(` ✓ (no redirect)\n`);
          }
        } else {
          // Error resolving, keep original
          errorCount++;
          updatedLines.push(line);
          process.stdout.write(` ✗ (error, keeping original)\n`);
        }
        
        // Rate limiting
        if (i < lines.length - 1) {
          await new Promise(resolve => setTimeout(resolve, API_DELAY));
        }
      } else {
        // Couldn't extract title, keep original line
        updatedLines.push(line);
      }
    } else {
      // Not a URL line, keep as-is
      updatedLines.push(line);
    }
  }
  
  console.log(`\n\nSummary:`);
  console.log(`  Total articles processed: ${totalArticles}`);
  console.log(`  Redirects resolved: ${resolvedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  No redirects: ${totalArticles - resolvedCount - errorCount}`);
  
  // Write updated content
  console.log('\nWriting updated file...');
  const updatedContent = updatedLines.join('\n');
  
  // Create backup first
  const backupPath = filePath + '.backup';
  console.log(`Creating backup: ${backupPath}`);
  await fs.copyFile(filePath, backupPath);
  
  // Write updated file
  await fs.writeFile(filePath, updatedContent, 'utf-8');
  console.log('✓ File updated successfully!');
  console.log(`\nBackup saved to: ${backupPath}`);
}

// Run the script
resolveRedirectsInFile().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

