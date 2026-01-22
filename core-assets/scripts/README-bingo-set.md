# Generate Bingo Set

This script generates a bingo set of 26 articles by randomly selecting from the list pages in `sampleLists.md`.

## How It Works

1. Reads all Wikipedia list page URLs from `sampleLists.md`
2. Shuffles the list pages to select them in random order
3. For each list page:
   - Fetches all article links from the page
   - Randomly selects **exactly 1 article** from that list
   - Adds it to the bingo set
4. Continues until we have 26 articles total (1 from each of 26 different lists)
5. Saves the results to `data/bingoSet.json`

### Filtering

The script automatically skips articles that start with:
- "List of"
- "History of"
- Other non-article pages (categories, files, etc.)

## Usage

Generate a bingo set of 26 articles (default):
```bash
npm run generate-bingo-set
```

Or specify a custom number:
```bash
node scripts/generateBingoSet.js 50
```

## Output

The script outputs:
- A list of all selected articles with their sources
- Statistics showing which lists were used and how many articles from each
- Saves to `data/bingoSet.json`

### Example Output

```
✅ Generated bingo set with 26 articles

ARTICLES:

 1. Wheelwright
    Source: List_of_industrial_occupations
    URL: https://en.wikipedia.org/wiki/Wheelwright

 2. Gametophyte
    Source: List_of_tallest_trees
    URL: https://en.wikipedia.org/wiki/Gametophyte

[... more articles ...]

STATISTICS:

Lists used: 14
  List_of_industrial_occupations: 1 from 23
  List_of_tallest_trees: 3 from 278
  List_of_anime_series_considered_the_best: 1 from 89
  [... more stats ...]
```

## Features

- **Random variety**: Each run picks from different lists in a different order
- **One per list**: Takes exactly 1 article from each list for maximum diversity
- **No duplicates**: Ensures each article is only selected once
- **Smart filtering**: Automatically skips "List of" and "History of" articles
- **Source tracking**: Records which list each article came from
- **Automatic saving**: Saves results to JSON for later use

## Notes

- The script respects Wikipedia API rate limits (300ms delay between requests)
- If a list has no articles or all articles are already selected, it skips to the next list
- The script will use as many lists as needed to reach the target count

