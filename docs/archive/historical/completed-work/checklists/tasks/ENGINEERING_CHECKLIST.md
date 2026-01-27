## Bingopedia Revamp – Engineering Checklist

This checklist is for engineers implementing and maintaining the rebuild. It complements `PRODUCT_CHECKLIST.md` by focusing on code, architecture, tooling, and operations.

---

### 1. Repository & Project Setup

- [x] Create new React + Vite + TypeScript app in a dedicated directory (e.g. `app/` or `web/`), leaving `Bingopedia/` as reference-only.
- [x] Configure TypeScript (tsconfig) with strict settings appropriate for this project.
- [x] Configure ESLint + Prettier (or equivalent) and ensure they run in CI or as pre-commit hooks.
- [x] Add a minimal `README` for the new app describing dev commands, env setup, and deployment path.
- [x] Ensure `core-assets/` is documented as non-runtime input only (see `core-assets/README.md`).

---

### 2. Environment & Config

- [x] Create `.env.local` template (not committed) that matches `ENVIRONMENT_AND_CONFIG.md`.
- [x] Verify the new app reads:
  - [x] `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER` (backend only).
  - [x] `PORT` for local Express dev (if used).
  - [x] `VITE_API_URL` (for pointing frontend at the API base).
- [x] Implement a small config module on the server that:
  - [x] Validates required env vars at startup.
  - [x] Throws clear but non-secret-leaking errors if anything is missing.
- [x] Confirm that no secrets are logged, written to client bundles, or committed to git.

---

### 3. Data & Assets Wiring

- [x] Copy `core-assets/public/Confetti.lottie` into the new app's `public/` folder.
- [x] Copy `core-assets/public/globe.png` into the new app's `public/` folder.
- [x] Ensure `public/curatedArticles.json` is present in the new app (from the preserved version, or regenerated via scripts if needed).
- [x] Implement a typed module for loading `curatedArticles.json` and exposing:
  - [x] `groups` (with `maxPerGame`).
  - [x] `categories` (names, counts, article arrays, group relationships).
- [x] Confirm that large JSON loading is done in a way that does not block initial render more than necessary (e.g., lazy/load-on-start-game is acceptable).

---

### 4. Core Game Engine (Logic Layer)

#### 4.1 Types & State Model

- [x] Define TypeScript types/interfaces for:
  - [x] Curated category and article structures.
  - [x] Game state (articles, grid, history, matched, winning cells, timer, clicks, flags).
  - [x] Leaderboard entries and API responses.
- [x] Implement a dedicated game state hook or module (e.g. `useGameState`) that:
  - [x] Starts a new game (resets state, fetches curated data, generates bingo set).
  - [x] Tracks `gameStarted`, `gameWon`, `gridArticles`, `startingArticle`.
  - [x] Manages `matchedArticles`, `winningCells`, `clickCount`, `timer`, `timerRunning`, `articleLoading`.
  - [x] Manages `articleHistory` and history navigation rules.

#### 4.2 Bingo Set Generation

- [x] Implement bingo set generation using curated data:
  - [x] Select 26 distinct categories.
  - [x] Enforce group constraints using `categoryGroups`/`groups` metadata.
  - [x] Select 1 article per category.
  - [x] Ensure article titles are unique per game.
  - [x] Use first 25 for grid; 26th for starting article.
- [x] Add unit tests validating:
  - [x] Group constraints (e.g. `occupations` max 1).
  - [x] Uniqueness of article titles.
  - [x] Behavior when category pool is tight (near the constraint limits).

#### 4.3 Win Detection

- [x] Implement a pure `detectWinningCells` function:
  - [x] Accepts grid size (at least 5×5) and matched article titles.
  - [x] Returns indices for winning lines (rows, columns, diagonals).
- [x] Add tests for:
  - [x] All 12 win lines in a 5×5 grid.
  - [x] Multiple simultaneous lines.
  - [x] No false positives on 4-in-a-row.

---

### 5. Wikipedia Integration & Matching

#### 5.1 Wikipedia Client

- [x] Implement a `wikipediaClient` module that:
  - [x] Fetches article HTML using REST API:
    - [x] Prefer mobile HTML endpoint.
    - [x] Fallback to desktop HTML.
    - [x] Final fallback to summary API.
  - [x] Sanitizes HTML:
    - [x] Strips scripts/styles and unwanted layout elements.
    - [x] Leaves only core article body and internal links.
  - [x] Caches article content in-memory keyed by (normalized) title.
- [x] Provide a mechanism to clear cache (for debugging/tests).

#### 5.2 Redirect Resolution

- [x] Implement `normalizeTitle(title: string)`:
  - [x] Trims whitespace.
  - [x] Replaces spaces with underscores and collapses multiple underscores.
  - [x] Performs case-insensitive matching via consistent normalization.
- [x] Implement `resolveRedirect(title: string)`:
  - [x] Uses Query API with `redirects=1&origin=*`.
  - [x] Stores canonical title in a cache keyed by normalized title.
  - [x] Handles missing pages gracefully (falls back to original title).
- [x] Add tests for:
  - [x] Simple redirects (e.g. "USA" → "United States").
  - [x] Case differences and spaces/underscores.
  - [x] Redirect chains (if possible via mocked responses).

#### 5.3 Matching Logic

- [x] Implement a matching function that, on article navigation:
  - [x] Resolves canonical title for the clicked article.
  - [x] Resolves canonical titles for grid articles (precomputed or cached).
  - [x] Matches both direct and redirect-based equivalences:
    - [x] Clicked → grid.
    - [x] Grid → clicked.
- [x] Integrate with game state so that:
  - [x] Confetti is triggered only on first-time matches.
  - [x] Matched articles are stored in a way that's compatible with win detection.
- [x] Add unit tests for:
  - [x] Matching with and without redirects.
  - [x] Handling titles like `New York` / `New_York` / URL-encoded forms.

---

### 6. UI Implementation (Components)

#### 6.1 Start Screen

- [x] Implement start screen with:
  - [x] Title and concise rules text.
  - [x] Primary "Start Game" button wired to game state initialization.
  - [x] Leaderboard component rendered prominently.

#### 6.2 Game Screen Layout

- [x] Implement responsive layout:
  - [x] Desktop: left column (grid + history + scoreboard), right column (article viewer).
  - [x] Mobile: top score bar + toggle between grid/history and article viewer.
- [x] Ensure layout behaves correctly across:
  - [x] Narrow phones.
  - [x] Large phones.
  - [x] Tablets.
  - [x] Desktop sizes.

#### 6.3 Grid & Summary Modal

- [x] Implement grid component:
  - [x] Renders 5×5 cards, supports highlighted/selected states.
  - [x] Accepts matched/winning indices for styling.
  - [x] Clicks open a summary modal; do not navigate directly.
- [x] Implement article summary modal:
  - [x] Uses Wikipedia summary API or truncated article content.
  - [x] Handles missing/failed summaries gracefully.

#### 6.4 Article Viewer

- [x] Implement article viewer component that:
  - [x] Receives current article title.
  - [x] Shows loading state while fetching/sanitizing HTML.
  - [x] Intercepts link clicks and calls into game navigation handler.
  - [x] Distinguishes "game links" (clickable) vs other links (styled as plain text).
  - [x] Notifies parent when a load fails to trigger replacement logic.

#### 6.5 History Panel

- [x] Implement history component that:
  - [x] Displays visited article titles in order.
  - [x] Highlights current article.
  - [x] Indicates entries that correspond to grid articles.
  - [x] On click, triggers navigation and increments click count.

#### 6.6 Win Modal & Confetti

- [x] Implement win modal that:
  - [x] Shows final time, clicks, and score.
  - [x] Collects username (validates length/characters).
  - [x] Calls leaderboard submit API.
  - [x] Allows skipping submission and restarting/returning to home.
- [x] Implement confetti component using `Confetti.lottie`:
  - [x] Triggers on new matches only.
  - [x] Cleans itself up to avoid memory leaks or re-renders.

---

### 7. Leaderboard Backend & Client

#### 7.1 API Implementation

- [x] Implement `api/leaderboard` (Vercel function) with:
  - [x] MongoDB connection reuse (cached client).
  - [x] Index creation on `{ score: -1 }` if not present.
  - [x] `GET /api/leaderboard`:
    - [x] Supports `limit`, `page`, `sortBy`, `sortOrder`.
    - [x] Returns `users`, `pagination`, and `sort` metadata.
  - [x] `POST /api/leaderboard`:
    - [x] Validates `username` and `score`.
    - [x] Accepts `time`, `clicks`, `bingoSquares`, `history`.
    - [x] Stores `createdAt`.
  - [x] Implement tie-breaking so that when two scores are equal, earlier `createdAt` ranks higher (as per product spec).
  - [x] Friendly error messages for:
    - [x] Missing env vars.
    - [x] Authentication/cluster/whitelisting issues.
    - [x] General server failures.

#### 7.2 Local Express Server (Optional)

- [x] Implement `server/index.ts` or similar that:
  - [x] Reuses the same Mongo config and logic as the Vercel function where feasible.
  - [x] Exposes identical endpoints for local testing.

#### 7.3 Leaderboard Client

- [x] Implement typed client functions:
  - [x] `fetchLeaderboard({ limit, page, sortBy, sortOrder })`.
  - [x] `submitScore(payload)`.
- [x] Integrate with:
  - [x] Start screen (initial load and pagination).
  - [x] Win modal (score submission).
  - [x] Game details modal (per-entry details).

#### 7.4 Username Filtering & Basic Abuse Protection

- [x] Enforce max username length on both client and server.
- [x] Implement light bad-word masking on the server:
  - [x] Replace detected words with obfuscated characters.
  - [x] Avoid rejecting otherwise valid submissions.
- [x] Add light validation to filter obviously bogus payloads (e.g. negative clicks/time).

#### 7.5 Future Social Features Support

- [ ] Ensure leaderboard and game data models are compatible with:
  - [ ] Replayable/shared boards (storing enough game metadata to reconstruct boards).
  - [ ] Future daily challenges (e.g. stable identifiers for daily boards or seeds).

---

### 8. Testing & Quality

#### 8.1 Unit Tests

- [x] Title normalization and redirect resolution.
- [x] Bingo set generation and group constraints.
- [x] Win detection for all 12 lines and multi-line cases.
- [x] Score calculation and tie-breaking logic.
- [x] Leaderboard client error handling (network and HTTP errors).
 - [ ] Basic coverage for future-linked concepts (e.g. ability to compute or persist a board seed or identifier without breaking existing flows).

#### 8.2 Integration Tests

- [x] Full game flow with mocked Wikipedia & leaderboard APIs:
  - [x] Start → navigate → matches → win.
  - [x] History navigation.
  - [x] Score submission.
- [x] API-only tests for `/api/leaderboard` with a test database/collection.

#### 8.3 Manual Testing

- [ ] Cross-browser checks (Chrome, Firefox, Safari, Edge).
- [ ] Mobile device checks (iOS Safari, Chrome Mobile).
- [ ] Slow network simulation in DevTools.
- [ ] Wikipedia outage simulation (forced failures) to verify fallback and error messaging.

---

### 9. Performance, Accessibility, and Ops

#### 9.1 Performance

- [x] Validate:
  - [x] Initial start-game → first article load < ~2 seconds on typical broadband.
  - [x] Subsequent article loads are fast, especially cached ones.
- [x] Ensure:
  - [x] Redirect cache prevents repeated query calls.
  - [x] Article content cache limits (or natural bounds) are acceptable for a single game session.

#### 9.2 Accessibility

- [x] Tab order is logical across start screen, game screen, and modals.
- [x] All interactive elements have appropriate `aria-label`s or text.
- [x] Color contrast and non-color indicators for matched/winning cells are reasonable.

#### 9.3 Operations & Monitoring

- [x] Document manual health checks:
  - [x] Simple endpoint pings for API.
  - [x] Basic DB connectivity checks.
  - [x] Sample Wikipedia API call tests.
- [ ] Decide on analytics approach (enabled now vs explicitly deferred) in line with product decisions.
- [ ] If analytics are enabled:
  - [ ] Ensure key events are emitted:
    - [ ] Game started.
    - [ ] Game won (with clicks and time).
    - [ ] Score submitted (primary metric).
    - [ ] Shared/replayable link events when that feature ships.

---

### 10. Deployment & Maintenance

- [x] Configure Vercel project:
  - [x] Build command and output directory (Vite defaults).
  - [x] Rewrites for SPA and API paths.
  - [ ] Env vars in Vercel settings.
- [ ] Verify a production build:
  - [ ] Succeeds locally (`npm run build`).
  - [ ] Includes `curatedArticles.json` and required assets.
- [ ] After first deploy:
  - [ ] Smoke-test all main flows in production.
  - [ ] Spot-check leaderboard entries being written to MongoDB.
- [x] Keep documentation up to date:
  - [x] `PRODUCT_PRD.md`, `PRODUCT_QA.md`.
  - [x] `ARCHITECTURE_OVERVIEW.md`.
  - [x] `ENVIRONMENT_AND_CONFIG.md`.
  - [x] `REBUILD_EXECUTION_PLAN.md`.
  - [x] Role-specific engineering checklists (backend, frontend, UI/UX) kept in sync with reality.