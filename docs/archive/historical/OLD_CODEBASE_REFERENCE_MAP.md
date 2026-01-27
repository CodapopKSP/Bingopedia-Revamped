## Bingopedia Old Codebase – Reference Map

The `Bingopedia/` directory contains the legacy implementation. This document maps key files to the behaviors they illustrate so you know where to look while rebuilding from scratch.

---

## 1. Top-Level Structure (Legacy App)

- `Bingopedia/`
  - `api/leaderboard.js` – Vercel serverless leaderboard API.
  - `server/index.js` – Express leaderboard API (local dev).
  - `public/` – Static assets (`Confetti.lottie`, `globe.png`, `curatedArticles.json`, etc.).
  - `data/` – Master list and intermediate data files.
  - `scripts/` – Data pipeline and utility scripts.
  - `src/`
    - `App.jsx` – Main game logic and layout.
    - `components/` – UI components.
    - `services/` – Curated data, Wikipedia API, and leaderboard API clients.

---

## 2. Frontend Game & UI

- **`src/App.jsx`**
  - Concerns to study:
    - Game lifecycle:
      - `handleStartGame` – how a game is initialized and state is reset.
      - `loadArticles` – how the 26-article set is loaded and split into grid + starting article.
    - Timer & click tracking:
      - Timer only starts after initial load.
      - Timer pauses while `articleLoading` is true.
      - Every article change (including history) increments `clickCount`.
    - Matching & redirect handling:
      - `normalizeTitle` and `resolveRedirect` helpers.
      - How the app matches a clicked article to grid titles using redirects in both directions.
      - Use of `redirectCacheRef` to avoid repeated API calls.
    - Win detection:
      - 5×5 grid index math (rows, columns, diagonals).
      - How `winningCells` are computed and how `gameWon`/`winModalOpen` are set.
    - Error handling:
      - `handleArticleLoadFailure` and how failed grid/current articles are replaced via `getRandomArticle`.
    - UX:
      - Mobile vs desktop layout behavior.
      - How the bingo board toggle and overlays behave.

- **`src/components/*`**
  - `BingoGrid.jsx`:
    - Grid rendering.
    - Visual states for default/matched/winning cells.
  - `ArticleViewer.jsx`:
    - Receives `articleTitle`, fetches and renders sanitized HTML.
    - Intercepts in-article link clicks and calls back into `handleArticleClick`.
    - Drives `onArticleLoadFailure` when content can’t be loaded.
  - `ArticleSummaryModal.jsx`:
    - Read-only summary for clicked grid cells.
  - `HistoryPanel.jsx`:
    - Displays chronological history.
    - On click: navigates back to selected article and counts a click.
  - `WinModal.jsx`:
    - Collects username and calls leaderboard submit API.
    - Shows game stats and provides “home”/“play again” behaviors.
  - `Leaderboard.jsx`:
    - Renders leaderboard table with pagination and sorting.
  - `Confetti.jsx`:
    - Uses `Confetti.lottie` to play confetti on new matches.

---

## 3. Services & Data Access

- **`src/services/curatedArticlesApi.js`**
  - Important behaviors:
    - `fetchCuratedData`:
      - Loads `curatedArticles.json` from `public/`.
      - Error handling for missing/invalid JSON.
    - `generateBingoSet(count = 26)`:
      - Shuffles categories, applies group constraints using `group` and `maxPerGame`.
      - Picks 1 article per category and constructs article objects with legacy fields.
      - Logs useful diagnostics about group usage.
    - `getRandomArticle(excludeTitles = [])`:
      - Picks a category + article not in `excludeTitles`, with a bounded number of attempts.
      - Falls back to any article if necessary.

- **`src/services/wikipediaApi.js`**
  - Important behaviors:
    - Article fetching:
      - Uses REST HTML endpoints (`page/html`, `page/mobile-html`) with fallback to `page/summary`.
      - Handles “article not found” semantics via response fields.
    - Content cleaning:
      - `cleanWikipediaHTML` removes style and script tags to avoid polluting the app.
      - Legacy (commented) code shows more aggressive DOM pruning for references, sidebars, etc.
    - Caching:
      - `articleContentCache` with helpers to clear cache.
    - Misc:
      - Historical top-articles and link-counting logic (now largely superseded by curated data).

- **`src/services/leaderboardApi.js`**
  - Important behaviors:
    - `fetchLeaderboard`:
      - Uses `VITE_API_URL` when present, otherwise relative path.
      - Encodes sort/pagination parameters.
      - Robust error handling for non-JSON responses and network errors.
    - `submitScore`:
      - Sends the full payload: username, score, time, clicks, bingoSquares, history.
      - Logs API payloads/results for debugging.

---

## 4. Backend APIs (Leaderboard)

- **`api/leaderboard.js` (Vercel function)**
  - Concerns:
    - MongoDB connection reuse between invocations (cached client/db).
    - Connection error reporting and friendly error messages.
    - Auto-creation of `{ score: -1 }` index.
    - GET:
      - Pagination and sorting by `score`, `clicks`, `time`, `createdAt`, `username`.
      - Response shape with `users`, `pagination`, and `sort` sections.
    - POST:
      - Basic validation of `username` and `score`.
      - Writes `bingoSquares` and `history` arrays along with stats.

- **`server/index.js` (Express)**
  - Concerns:
    - Local dev alternative to the Vercel function.
    - Similar GET/POST logic with middleware for CORS and JSON.
    - Uses `dotenv` for `MONGODB_*` variables.
  - Note: Current file still has fallback default credentials; treat those as a legacy smell and do not replicate.

---

## 5. Data & Script Layer

- **`data/masterArticleList.txt` & backup**
  - Legacy source-of-truth list of categories and article URLs.
  - Now preserved in `core-assets/data/`.

- **`categoryGroups.json`**
  - Defines groups like `occupations` with `maxPerGame`.
  - Consumed by scripts and encoded into `curatedArticles.json`.

- **`scripts/*.js`**
  - `compileMasterList.js` – fetches from Wikipedia list pages into `masterArticleList.txt`.
  - `generateCuratedData.js` – converts master list into `curatedArticles.json`.
  - `extractFromList.js`, `generateBingoSet.js`, `generateSampleSet.js`, `resolveRedirects.js`, etc. – utilities and testing tools.
  - These are not meant to be rewritten now; they are preserved in `core-assets/scripts/` and may be run if article data ever needs updating.

---

## 6. How to Use This Map During the Rebuild

- When implementing a feature in the new app:
  - Start from the **PRD / handoff docs** for requirements.
  - Use this map to locate the legacy implementation that illustrates behavior and edge cases.
  - Read the old code for understanding only; then re-implement clean, typed, and tested logic in the new architecture.
- If behavior in the old app conflicts with the PRD:
  - Prefer the PRD and Q&A clarifications.
  - Note any discrepancies in commit messages or future docs as needed.


