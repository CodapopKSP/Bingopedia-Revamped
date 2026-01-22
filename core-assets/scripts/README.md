# Article List Generator

This script generates a curated list of top Wikipedia articles based on total page views from the last 5 years.

## Usage

Generate a list of the top 100 articles (default):
```bash
npm run generate-articles
```

Or specify a custom limit:
```bash
# Top 500 articles
node scripts/generateArticleList.js 500
```

### How It Works

The script uses a smart sampling strategy:
1. **Samples 1 day every 2 months** over the past 5 years (approximately 30 sample days)
2. **Gets top 100 articles** from each sample day
3. **Aggregates all views** across all samples
4. **Compiles final top 100 list** based on total views

This approach:
- ✅ Fast: Only ~30 API calls instead of thousands
- ✅ Representative: Covers the entire 5-year period
- ✅ Accurate: Gets top performers from each time period
- ✅ Efficient: Balances speed with data quality

**Note**: Wikipedia's API only supports single-day queries, so we sample representative days and aggregate the results.

## Output

The script generates a JSON file at `data/topArticles.json` with the following structure:

```json
{
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "totalArticles": 5000,
  "description": "Top Wikipedia articles by total views from the last 5 years...",
  "articles": [
    {
      "title": "Article_Title",
      "pageId": 12345,
      "url": "https://en.wikipedia.org/wiki/Article_Title",
      "totalViews": 1000000,
      "averageViews": 20000,
      "averageRank": 50,
      "category": "",
      "subcategory": "",
      "obscurity": null
    }
  ]
}
```

## Metadata Fields

Each article includes the following fields that you can manually edit:

- **title**: The Wikipedia article title (used for lookup)
- **pageId**: Wikipedia page ID (for programmatic access)
- **url**: Direct link to the article
- **totalViews**: Total views across all sampled days
- **averageViews**: Average daily views
- **averageRank**: Average ranking position when it appeared in top lists
- **category**: Main category (e.g., "People", "Places", "Events") - *editable*
- **subcategory**: Subcategory (e.g., "Scientists", "Americans", "World War II") - *editable*
- **obscurity**: Obscurity rating from 0-10 (0 = very well known, 10 = very obscure) - *editable*

## Manual Editing

The JSON file is formatted with 2-space indentation for easy manual editing. You can:

1. Open `data/topArticles.json` in any text editor
2. Edit the `category`, `subcategory`, and `obscurity` fields for each article
3. Save the file

The file structure is preserved, so you can safely edit it and re-run the generator (it will create a new file, preserving your manual edits if you rename the old one).

## Notes

- The script fetches data from multiple days over the past 5 years to build a comprehensive list
- It filters out non-article pages (disambiguation pages, lists, special pages, etc.)
- Rate limiting is built in to respect Wikipedia API limits
- The process may take 30-60 minutes for 5000 articles due to API rate limits

