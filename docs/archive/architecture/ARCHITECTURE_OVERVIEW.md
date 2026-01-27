## Bingopedia Revamp – Architecture Overview

This document defines the target architecture for the **rebuild** of Bingopedia. It assumes the existing `Bingopedia/` app is **reference-only** and that critical data/scripts have been copied into `core-assets/`.

---

## 1. High-Level System Diagram

- **Frontend SPA (new)**  
  - Tech: **React 18 + Vite**, authored in **TypeScript** for maintainability.  
  - Responsibilities:
    - Game loop: start → navigate → match → win.
    - UI: grid, article viewer, history, scoreboard, win/leaderboard modals, confetti.
    - Client-side Wikipedia integrations and redirect resolution.
    - Talking to leaderboard API and reading curated article data.

- **Backend API (leaderboard)**  
  - Tech: **Node.js + MongoDB Atlas**, deployed as:
    - Primary: **Vercel serverless function** at `/api/leaderboard`.
    - Optional: Local **Express** dev server for offline/local testing (similar to `server/index.js` but re-implemented).
  - Responsibilities:
    - Read/write leaderboard entries.
    - Basic input validation and light username filtering.
    - No auth / accounts.

- **Data & Scripts (shared core assets)**  
  - Location for preserved assets: `core-assets/`
    - `core-assets/data/masterArticleList.txt` (+ backup).
    - `core-assets/categoryGroups.json`.
    - `core-assets/public/Confetti.lottie`, `core-assets/public/globe.png`.
    - `core-assets/scripts/*.js` (data-generation & utilities, referenced for rare maintenance only).
  - Responsibilities:
    - Provide the source-of-truth article pool and group constraints.
    - Allow re-generation of `curatedArticles.json` if needed.

---

## 2. Frontend Architecture

- **Tech Choices**
  - **Framework**: React 18.
  - **Language**: TypeScript (TSX) to encode game rules and data contracts.
  - **Bundler/Dev Server**: Vite.
  - **State management**: React hooks + custom hooks; no Redux/Zustand initially (scope is small and well-contained).

- **Top-Level Structure (implemented)**
  - `src/`
    - `app/` – App shell (`App.tsx`, `AppLayout.tsx`) with global layout and routing.
    - `features/game/`
      - `useGameState.ts` – Main game state hook managing game lifecycle, matches, win detection.
      - `useGameTimer.ts` – Dedicated hook that owns timer interval lifecycle (start/pause/stop).
      - `useTimerDisplay.ts` – Debounced timer display hook to avoid full-tree re-renders.
      - `winDetection.ts` – Pure function for detecting winning lines (all 12 possible lines).
      - `types.ts` – TypeScript types for game state, grid cells, leaderboard entries.
      - Components: `BingoGrid.tsx`, `HistoryPanel.tsx`, `WinModal.tsx`, `Confetti.tsx`, `ArticleSummaryModal.tsx`, `GameScreen.tsx`, `StartScreen.tsx`.
    - `features/article-viewer/`
      - `ArticleViewer.tsx` – Article display with HTML sanitization and link interception.
    - `features/leaderboard/`
      - `StartScreenLeaderboard.tsx` – Leaderboard preview on start screen.
      - `GameDetailsModal.tsx` – Modal for viewing past game boards and histories.
    - `shared/api/`
      - `leaderboardClient.ts` – Typed client for GET/POST `/api/leaderboard`.
      - `config.ts` – API base URL configuration.
    - `shared/wiki/`
      - `wikipediaClient.ts` – Article fetching with mobile/desktop/summary fallback, HTML sanitization, caching.
      - `normalizeTitle.ts` – Title normalization for consistent matching.
      - `resolveRedirect.ts` – Wikipedia redirect resolution with caching.
    - `shared/data/`
      - `curatedArticles.ts` – Loader for `curatedArticles.json` with caching.
      - `types.ts` – TypeScript types for curated articles, categories, groups.

- **Key Frontend Responsibilities**
  - Implement the **bingo set generation** algorithm in the client (using `curatedArticles.json` and group constraints).
    - Location: `features/game/useGameState.ts` → `generateBingoSet()` function.
    - Selects 26 distinct categories, ensures unique article titles, uses first 25 for grid, 26th as starting article.
  - Implement **title normalization**, **redirect resolution**, and **bidirectional match checking** as specified in the handoff docs.
    - Normalization: `shared/wiki/normalizeTitle.ts` → `normalizeTitle()`.
    - Redirect resolution: `shared/wiki/resolveRedirect.ts` → `resolveRedirect()` with caching.
    - Matching: `features/game/useGameState.ts` → `registerNavigation()` performs bidirectional checks.
  - Own the **timer and click counter** behavior, including pausing during loads.
    - Location:
      - `features/game/useGameTimer.ts` → interval lifecycle, pause on `articleLoading`, stop on win.
      - `features/game/useTimerDisplay.ts` → decouples display updates from core state to prevent UI thrash.
      - `features/game/useGameState.ts` → source of truth for `elapsedSeconds` and `clickCount`.
  - Maintain **article history** and navigation behavior (history clicks always count as clicks).
    - Location: `features/game/useGameState.ts` → `articleHistory` array, history clicks increment `clickCount`.

---

## 2.5 Game Logic & Matching Overview

The game logic is centralized in `features/game/useGameState.ts`. Here's how it works:

### Bingo Set Generation
1. Loads `curatedArticles.json` from `public/` (cached after first load).
2. Shuffles all categories and selects 26 distinct ones.
3. For each category, randomly selects 1 article, ensuring no duplicate titles (normalized comparison).
4. First 25 articles become the grid cells; 26th becomes the starting article.

### Matching Logic
When a user navigates to an article (via link click or history click):
1. **Immediate update**: Adds to history, increments click count, checks direct title matches.
2. **Redirect resolution**: Asynchronously resolves redirects for both clicked article and all grid articles.
3. **Bidirectional matching**: Compares normalized titles in both directions:
   - Clicked article → Grid articles (direct and redirect-based)
   - Grid articles → Clicked article (direct and redirect-based)
4. **Win detection**: After matches update, calls `detectWinningCells()` which checks all 12 possible winning lines:
   - 5 rows (horizontal)
   - 5 columns (vertical)
   - 2 diagonals
5. **Confetti trigger**: Only fires on first-time matches (not re-matches).

### Timer Behavior
- Starts when the first article has finished loading (not just on game start).
- Pauses automatically whenever `articleLoading` is true (article viewer is fetching content).
- Resumes when article load completes and the game is still in progress.
- Increments underlying `elapsedSeconds` every second via `useGameTimer` (interval-based hook).
- Uses `useTimerDisplay` to debounce the rendered timer value so the rest of the UI does **not** re-render every second.

### History Navigation
- History clicks are treated identically to link clicks:
  - Increment click count.
  - Can trigger matches.
  - Can trigger wins.
  - Update current article and history.

---

## 3. Backend / API Architecture

- **Target pattern**
  - Primary: Vercel serverless function at `api/leaderboard.ts` (TypeScript) with:
    - `GET` – paginated leaderboard reads (sorting by score/clicks/time/createdAt).
    - `POST` – score submission with validation and username filtering.
  - Secondary: optional `server/index.ts` Express app for:
    - Local development without Vercel.
    - Running against the same MongoDB Atlas cluster.

- **MongoDB Usage**
  - DB: `bingopedia`.
  - Collection: `leaderboard`.
  - Minimal schema (mirrors existing implementation):
    - `username`: string (max 50).
    - `score`: number (`time * clicks`).
    - `time`: number (seconds).
    - `clicks`: number.
    - `bingoSquares`: string[] (grid titles, with optional "[Found]" markers).
    - `bingopediaGame`: string[] (optional, 26 articles: 25 grid + starting article).
    - `history`: string[] (article titles in visit order, may include "[Found]" markers).
    - `createdAt`: Date.
    - `gameId`: string (optional, UUID for replay functionality).
    - `gameType`: 'random' | 'repeat' (optional, defaults to 'random').
  - Indexes: `{ score: -1, createdAt: 1 }`, `{ createdAt: -1 }`, `{ gameType: 1, score: 1, createdAt: 1 }`.
  
  **Sprint 1 Note**: No schema changes required. Existing fields fully support game details modal and all Sprint 1 frontend improvements.

- **Environment Variables (backend)**
  - `MONGODB_USERNAME`
  - `MONGODB_PASSWORD`
  - `MONGODB_CLUSTER` (e.g. `cluster0.rvkwijm.mongodb.net`)
  - `PORT` (for local Express dev only; Vercel ignores this).

---

## 4. Data & Asset Layer

- **Curated Articles**
  - Source: `core-assets/data/masterArticleList.txt` (+ backup).
  - Derived: `public/curatedArticles.json` (generated via scripts in `core-assets/scripts` when needed).
  - Runtime contract (frontend):
    - `generatedAt`, `totalCategories`, `totalArticles`.
    - `groups` section with group names and `maxPerGame`.
    - `categories[]` with `name`, `articleCount`, `articles[]`, and optional `group`.

- **Group Constraints**
  - Source: `core-assets/categoryGroups.json`.
  - Enforced entirely in the **frontend selection algorithm**.

- **Static Assets**
  - `core-assets/public/Confetti.lottie` – used by a `Confetti` component.
  - `core-assets/public/globe.png` – used in grid/article toggle UI.
  - For the new app, these should be copied into the new app’s `public/` folder at build/scaffold time; the `core-assets/` copy remains the canonical “backup”.

---

## 5. Environment & Configuration Strategy

- **Local Development**
  - Frontend:
    - `npm run dev` via Vite.
    - Uses relative `/api/leaderboard` calls proxied to local Express or to Vercel dev server.
  - Backend:
    - Optional `npm run dev:server` to run local Express API for leaderboard.
    - `.env.local` (ignored by git) holds MongoDB credentials and any `VITE_*` vars.

- **Vercel Deployment**
  - Build: `npm run build`, output `dist`.
  - Rewrites: SPA fallback and `/api/leaderboard` → serverless function.
  - Environment variables configured in Vercel dashboard (no secrets in repo).

- **Config Files**
  - `vercel.json` will be kept conceptually similar to the existing one, but updated to reflect the new folder structure when we scaffold the app.
  - A dedicated `ENVIRONMENT_AND_CONFIG.md` (separate doc) will capture exact variable names, expected values, and example `.env` layouts.

---

## 6. Old Codebase – What We Reuse Conceptually

The existing `Bingopedia/` tree is treated as **specimen code**, not something we copy from. Conceptual reuse:

- `src/App.jsx`
  - Reference for:
    - Game loop sequencing.
    - Redirect cache behavior.
    - Win detection indices and edge cases.
    - Timer and article-loading interaction.

- `src/services/curatedArticlesApi.js`
  - Reference for:
    - Bingo set generation with group constraints.
    - `getRandomArticle` semantics when replacing failed articles.

- `src/services/wikipediaApi.js`
  - Reference for:
    - Article fetching strategy and caching.
    - Content cleaning / DOM sanitization.
    - Fallback paths (desktop HTML → mobile HTML → summary).

- `src/services/leaderboardApi.js`, `api/leaderboard.js`, `server/index.js`
  - Reference for:
    - Request/response shapes.
    - Pagination and sorting conventions.
    - Mongo connection patterns and failure behaviors.

All of this logic will be **re-implemented cleanly** in the new frontend/backend, with TypeScript types and clearer separation of concerns.

---

## 7. Next Steps for Implementation (High-Level)

- Scaffold new React + Vite + TypeScript app in a dedicated directory (e.g. `app/`), keeping `core-assets/` and `Bingopedia/` untouched.
- Define shared TypeScript types for:
  - Curated article data shapes.
  - Game state, leaderboard entries, and API contracts.
- Implement:
  - Curated data loading and bingo set generation (respecting `categoryGroups`).
  - Title normalization, redirect resolution, and article matching with cache.
  - Timer, click tracking, history, and win detection according to the PRD.
  - Leaderboard client + backend function, wired to existing MongoDB.
- Wire up deployment configuration (Vercel) once the new app builds and basic flows are passing QA.


