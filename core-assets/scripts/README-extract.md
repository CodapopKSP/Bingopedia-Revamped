# Extract Articles from Wikipedia Lists

This script extracts random articles from Wikipedia list pages (like "List of animal names", "List of countries", etc.).

## Usage

Extract 5 random articles from a list (default):
```bash
npm run extract-from-list "List of animal names"
```

Or specify a custom count:
```bash
node scripts/extractFromList.js "List of animal names" 10
```

## Examples

```bash
# Get 5 random animals
node scripts/extractFromList.js "List of animal names" 5

# Get 10 random countries
node scripts/extractFromList.js "List of countries and dependencies by population" 10

# Get 3 random scientists
node scripts/extractFromList.js "List of Nobel laureates in Physics" 3
```

## How It Works

1. Fetches all article links from the specified Wikipedia list page
2. Filters out non-article pages (categories, files, other lists, etc.)
3. Randomly selects the requested number of articles
4. Outputs the results and saves to a JSON file

## Output

The script:
- Prints the extracted articles to the console
- Saves results to `data/extracted_[List_Title].json`

The JSON file includes:
- Source list title
- Total articles found in the list
- Requested and extracted counts
- Array of extracted articles with titles and URLs

## Notes

- The script uses Wikipedia's Action API to get all links from a page
- It automatically handles pagination (lists with many links)
- Only extracts main namespace articles (filters out categories, files, etc.)
- Skips the list page itself and other list pages

