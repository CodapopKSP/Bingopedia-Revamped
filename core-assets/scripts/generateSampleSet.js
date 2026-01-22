#!/usr/bin/env node

/**
 * Generates a sample set of 26 articles with summaries
 * Picks 26 random categories and 1 article from each
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
 * Fetches article summary from Wikipedia
 */
async function fetchArticleSummary(title) {
  const encodedTitle = encodeURIComponent(title);
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;
  
  try {
    const response = await fetch(summaryUrl, {
      headers: {
        'User-Agent': API_HEADERS['User-Agent'],
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return `(Summary unavailable - HTTP ${response.status})`;
    }

    const data = await response.json();
    return data.extract || '(No summary available)';
  } catch (error) {
    return `(Error fetching summary: ${error.message})`;
  }
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
          articles: [...currentArticles]
        });
      }
      // Start new category
      currentCategory = trimmed;
      currentArticles = [];
    } else {
      // It's an article URL
      if (currentCategory) {
        currentArticles.push(trimmed);
      }
    }
  }
  
  // Save last category
  if (currentCategory && currentArticles.length > 0) {
    categories.push({
      name: currentCategory,
      articles: [...currentArticles]
    });
  }
  
  return categories;
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
 * Gets a random item from an array
 */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Main function to generate sample set
 */
async function generateSampleSet(count = 26) {
  console.log(`Generating sample set of ${count} articles with summaries...\n`);
  
  // Parse the master list
  console.log('Parsing master list...');
  const categories = await parseMasterList();
  console.log(`Found ${categories.length} categories\n`);
  
  // Filter out categories with no articles
  const validCategories = categories.filter(cat => cat.articles.length > 0);
  console.log(`${validCategories.length} categories have articles\n`);
  
  // Randomly select categories
  const shuffledCategories = shuffleArray(validCategories);
  const selectedCategories = shuffledCategories.slice(0, Math.min(count, shuffledCategories.length));
  
  console.log(`Selected ${selectedCategories.length} random categories\n`);
  
  const sampleSet = [];
  
  for (let i = 0; i < selectedCategories.length; i++) {
    const category = selectedCategories[i];
    
    // Pick random article from this category
    const articleUrl = getRandomItem(category.articles);
    const articleTitle = extractTitleFromUrl(articleUrl);
    
    if (!articleTitle) {
      console.log(`[${i + 1}/${selectedCategories.length}] Skipping invalid URL\n`);
      continue;
    }
    
    console.log(`[${i + 1}/${selectedCategories.length}] ${articleTitle}`);
    console.log(`  Category: ${category.name}`);
    console.log(`  Fetching summary...`);
    
    // Fetch summary
    const summary = await fetchArticleSummary(articleTitle);
    
    console.log(`  ✓ Done\n`);
    
    sampleSet.push({
      title: articleTitle,
      url: articleUrl,
      category: category.name,
      summary: summary
    });
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('='.repeat(60));
  console.log(`\n✅ Generated sample set with ${sampleSet.length} articles\n`);
  
  // Save to JSON
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    count: sampleSet.length,
    articles: sampleSet
  };
  
  const jsonPath = path.join(__dirname, '..', 'data', 'sampleSet.json');
  await fs.writeFile(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
  console.log(`💾 JSON saved to: ${jsonPath}`);
  
  // Save to text file for easy reading
  let textOutput = 'SAMPLE ARTICLE SET WITH SUMMARIES\n';
  textOutput += '='.repeat(80) + '\n\n';
  
  sampleSet.forEach((article, index) => {
    textOutput += `${index + 1}. ${article.title}\n`;
    textOutput += `   Category: ${article.category}\n`;
    textOutput += `   URL: ${article.url}\n\n`;
    textOutput += `   ${article.summary}\n\n`;
    textOutput += '-'.repeat(80) + '\n\n';
  });
  
  textOutput += '='.repeat(80) + '\n';
  textOutput += `Total articles: ${sampleSet.length}\n`;
  textOutput += `Generated: ${new Date().toISOString()}\n`;
  
  const textPath = path.join(__dirname, '..', 'data', 'sampleSet.txt');
  await fs.writeFile(textPath, textOutput, 'utf-8');
  console.log(`📄 Text file saved to: ${textPath}`);
  
  return sampleSet;
}

// Run the script
const count = process.argv[2] ? parseInt(process.argv[2]) : 26;

generateSampleSet(count)
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

