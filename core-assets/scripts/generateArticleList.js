#!/usr/bin/env node

/**
 * Generates a list of top Wikipedia articles by total views from the last 5 years
 * Outputs a JSON file that can be manually edited with metadata fields
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wikipedia API requires a User-Agent header
const API_HEADERS = {
  'User-Agent': 'Bingopedia/1.0 (https://github.com/yourusername/bingopedia; contact@example.com)',
  'Accept': 'application/json'
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

  const listPatterns = ['List of', 'List_of', 'Timeline of', 'Timeline_of', 'Index of', 'Index_of'];
  for (const pattern of listPatterns) {
    if (title.startsWith(pattern) || title.startsWith(pattern.replace(' ', '_'))) {
      return false;
    }
  }

  if (title.startsWith('Category:') || title.startsWith('Category_')) {
    return false;
  }

  if (/^\d{4}$/.test(title)) {
    return false;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  for (const month of monthNames) {
    const monthPattern = new RegExp(`^${month}[_ ]\\d{1,2}(, \\d{4})?$`, 'i');
    if (monthPattern.test(title)) {
      return false;
    }
  }

  if (/^(Deaths|Births) in \d{4}$/i.test(title) || /^(Deaths|Births)_in_\d{4}$/i.test(title)) {
    return false;
  }

  if (/^\d{4} in film$/i.test(title) || /^\d{4}_in_film$/i.test(title)) {
    return false;
  }

  if (title.endsWith(' by country') || title.endsWith('_by_country')) {
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
 * Formats a date as YYYY/MM/DD for Wikipedia API
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Fetches top articles from Wikipedia API for a specific date
 * @param {string} dateStr - Date in format YYYY/MM/DD or YYYY/MM for monthly
 */
async function fetchTopArticlesForDate(dateStr) {
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${dateStr}`;
  
  try {
    const response = await fetch(url, {
      headers: API_HEADERS
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.items && data.items[0] && data.items[0].articles) {
      return data.items[0].articles;
    }
    
    return [];
  } catch (error) {
    console.warn(`Failed to fetch data for ${dateStr}: ${error.message}`);
    return [];
  }
}



/**
 * Gets dates spaced 2 months apart over 5 years
 */
function getDatesEveryTwoMonths() {
  const dates = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2); // Go back 2 days for API delay
  endDate.setHours(0, 0, 0, 0);
  
  // Start from 5 years ago
  const startDate = new Date(endDate);
  startDate.setFullYear(startDate.getFullYear() - 5);
  startDate.setHours(0, 0, 0, 0);
  
  // Sample 1 day every 2 months
  const currentDate = new Date(endDate);
  
  while (currentDate >= startDate) {
    dates.push(new Date(currentDate));
    // Go back 2 months
    currentDate.setMonth(currentDate.getMonth() - 2);
  }
  
  return dates.reverse(); // Return in chronological order (oldest first)
}

/**
 * Main function to generate the article list
 * Samples 1 day every 2 months for 5 years, gets top 100 from each, compiles into top 100 overall
 */
async function generateArticleList(limit = 100) {
  console.log(`Generating list of top ${limit} Wikipedia articles...`);
  console.log('Sampling 1 day every 2 months over the past 5 years...\n');

  // Get dates spaced 2 months apart
  const datesToFetch = getDatesEveryTwoMonths();
  
  console.log(`Will fetch data from ${datesToFetch.length} sample days:`);
  datesToFetch.forEach((date, i) => {
    console.log(`  ${i + 1}. ${formatDate(date)}`);
  });
  console.log('');

  const allArticles = new Map();
  let successfulFetches = 0;

  for (let i = 0; i < datesToFetch.length; i++) {
    const currentDate = datesToFetch[i];
    
    // Ensure we don't go into the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (currentDate > today) {
      console.log(`Skipping future date: ${formatDate(currentDate)}`);
      continue;
    }
    
    const dateStr = formatDate(currentDate);

    process.stdout.write(`\rFetching sample ${i + 1}/${datesToFetch.length}: ${dateStr}...`);
    
    // Add a small delay between requests to respect rate limits
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const articles = await fetchTopArticlesForDate(dateStr);
    
    if (articles.length > 0) {
      successfulFetches++;
      
      // Get top 100 articles from this day (after filtering)
      const validArticles = articles
        .filter(article => isRealArticle(article.article))
        .slice(0, 100); // Top 100 from this sample
      
      validArticles.forEach((article, index) => {
        const title = article.article;
        const views = article.views || 0;
        
        if (!allArticles.has(title)) {
          allArticles.set(title, {
            title: title,
            totalViews: 0,
            daysCounted: 0,
            rankSum: 0
          });
        }
        
        const articleData = allArticles.get(title);
        articleData.totalViews += views;
        articleData.daysCounted += 1;
        articleData.rankSum += (index + 1);
      });
    }
  }

  console.log(`\n\nSuccessfully fetched data from ${successfulFetches} days`);
  console.log(`Found ${allArticles.size} unique articles\n`);

  if (allArticles.size === 0) {
    throw new Error('No article data was retrieved. The API may be temporarily unavailable.');
  }

  // Convert map to array, calculate averages, and sort by views
  const articlesArray = Array.from(allArticles.values())
    .map(article => ({
      title: article.title,
      totalViews: article.totalViews,
      averageViews: Math.round(article.totalViews / article.daysCounted),
      averageRank: Math.round(article.rankSum / article.daysCounted)
    }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, limit);

  console.log(`\nGenerating article list with metadata fields...\n`);

  // Generate URL from title (no need to fetch metadata)
  const articlesWithMetadata = articlesArray.map(article => {
    const urlTitle = article.title.replace(/ /g, '_');
    const encodedTitle = encodeURIComponent(urlTitle);
    
    return {
      title: article.title,
      url: `https://en.wikipedia.org/wiki/${encodedTitle}`,
      totalViews: article.totalViews,
      averageViews: article.averageViews,
      averageRank: article.averageRank,
      // Metadata fields for manual editing
      category: '',
      subcategory: '',
      obscurity: null // 0 = very well known (e.g., Donald Trump), 10 = very obscure
    };
  });

  console.log(`Generated ${articlesWithMetadata.length} articles\n`);

  // Create output file
  const outputPath = path.join(__dirname, '..', 'data', 'topArticles.json');
  const outputDir = path.dirname(outputPath);
  
  // Create data directory if it doesn't exist
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }

  // Format JSON with nice indentation for human readability
  const output = {
    generatedAt: new Date().toISOString(),
    totalArticles: articlesWithMetadata.length,
    description: 'Top Wikipedia articles by total views from the last 5 years. Edit category, subcategory, and obscurity fields as needed.',
    articles: articlesWithMetadata
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`✅ Successfully generated article list:`);
  console.log(`   File: ${outputPath}`);
  console.log(`   Articles: ${articlesWithMetadata.length}`);
  console.log(`\nYou can now manually edit the file to add categories, subcategories, and obscurity ratings.`);
}

// Run the script
// Usage: node generateArticleList.js [limit]
// Example: node generateArticleList.js 100  (default: top 100)
// 
// The script samples 1 day every 2 months over the past 5 years,
// gets the top 100 articles from each sample, then compiles them
// into a final top 100 list based on total views.
const limit = process.argv[2] ? parseInt(process.argv[2]) : 100;

generateArticleList(limit).catch(error => {
  console.error('\n❌ Error generating article list:', error);
  process.exit(1);
});

