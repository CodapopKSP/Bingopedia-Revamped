#!/usr/bin/env node

/**
 * Generates a curated data file for the app to use
 * Converts the master list into a JSON structure optimized for the bingo game
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Parses the master list file
 */
async function parseMasterList() {
  const masterListPath = path.join(__dirname, '..', 'data', 'masterArticleList.txt');
  const content = await fs.readFile(masterListPath, 'utf-8');
  
  const lines = content.split('\n');
  const categories = [];
  let currentCategory = null;
  let currentArticles = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and header lines
    if (!trimmed || trimmed.startsWith('=') || trimmed === 'MASTER LIST OF ALL ARTICLES' || trimmed === 'SUMMARY') {
      continue;
    }
    
    // Check if it's a category header (doesn't start with http)
    if (!trimmed.startsWith('http')) {
      // Save previous category if exists
      if (currentCategory && currentArticles.length > 0) {
        categories.push({
          name: currentCategory,
          articleCount: currentArticles.length,
          articles: [...currentArticles]
        });
      }
      // Start new category
      currentCategory = trimmed;
      currentArticles = [];
    } else {
      // It's an article URL - extract title
      if (currentCategory) {
        const title = extractTitleFromUrl(trimmed);
        if (title) {
          currentArticles.push(title);
        }
      }
    }
  }
  
  // Save last category
  if (currentCategory && currentArticles.length > 0) {
    categories.push({
      name: currentCategory,
      articleCount: currentArticles.length,
      articles: [...currentArticles]
    });
  }
  
  return categories;
}

/**
 * Loads category groups configuration
 */
async function loadCategoryGroups() {
  try {
    const groupsPath = path.join(__dirname, '..', 'categoryGroups.json');
    const content = await fs.readFile(groupsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('No category groups file found, using default (no grouping)');
    return { groups: {} };
  }
}

/**
 * Assigns groups to categories based on configuration
 */
function assignGroups(categories, groupsConfig) {
  const groupMap = new Map();
  
  // Build a map of category name -> group info
  for (const [groupName, groupInfo] of Object.entries(groupsConfig.groups)) {
    for (const catName of groupInfo.categories) {
      groupMap.set(catName, {
        group: groupName,
        maxPerGame: groupInfo.maxPerGame || null
      });
    }
  }
  
  // Assign groups to categories
  return categories.map(cat => ({
    ...cat,
    group: groupMap.get(cat.name)?.group || null,
    maxPerGame: groupMap.get(cat.name)?.maxPerGame || null
  }));
}

/**
 * Main function
 */
async function generateCuratedData() {
  console.log('Generating curated data file for the app...\n');
  
  // Parse the master list
  console.log('Parsing master list...');
  const categories = await parseMasterList();
  console.log(`Found ${categories.length} categories\n`);
  
  // Load and apply category groups
  console.log('Loading category groups...');
  const groupsConfig = await loadCategoryGroups();
  const categoriesWithGroups = assignGroups(categories, groupsConfig);
  
  const groupedCount = categoriesWithGroups.filter(cat => cat.group).length;
  console.log(`Assigned ${groupedCount} categories to groups\n`);
  
  // Calculate total articles
  const totalArticles = categoriesWithGroups.reduce((sum, cat) => sum + cat.articleCount, 0);
  
  // Create output structure
  const output = {
    generatedAt: new Date().toISOString(),
    totalCategories: categoriesWithGroups.length,
    totalArticles: totalArticles,
    groups: groupsConfig.groups,
    categories: categoriesWithGroups
  };
  
  // Save to public folder so it can be fetched by the app
  const outputPath = path.join(__dirname, '..', 'public', 'curatedArticles.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`✅ Curated data file generated!`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Total articles: ${totalArticles}`);
  console.log(`   File: ${outputPath}\n`);
  
  // Show some stats
  console.log('Category breakdown:');
  categories.slice(0, 10).forEach(cat => {
    console.log(`  ${cat.name}: ${cat.articleCount} articles`);
  });
  if (categories.length > 10) {
    console.log(`  ... and ${categories.length - 10} more categories`);
  }
  
  return output;
}

// Run the script
generateCuratedData()
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });

