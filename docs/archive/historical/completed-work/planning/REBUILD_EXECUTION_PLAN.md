## Bingopedia Revamp – Execution Plan

This plan turns the PRD, Q&A, and handoff docs into a concrete implementation roadmap. It assumes:

- The old app in `Bingopedia/` is **reference-only**.
- Critical assets have been copied to `core-assets/`.
- Deployment target is **Vercel** with MongoDB Atlas.

---

## 1. Phase 0 – Prep (Done / In Progress)

- **Docs & Understanding**
  - Read: `HANDOFF_PRODUCT_SPEC.md`, `HANDOFF_CRITICAL_FILES.md`, `HANDOFF_QUICK_START.md`, `PRODUCT_PRD.md`, `PRODUCT_QA.md`.
  - Map existing behavior from:
    - `Bingopedia/src/App.jsx`.
    - `Bingopedia/src/services/curatedArticlesApi.js`.
    - `Bingopedia/src/services/wikipediaApi.js`.
    - `Bingopedia/src/services/leaderboardApi.js`.
    - `Bingopedia/api/leaderboard.js` and `Bingopedia/server/index.js`.

- **Critical Asset Extraction**
  - Copy, do **not** delete, from `Bingopedia/` into `core-assets/`:
    - `data/masterArticleList.txt`, `data/masterArticleList.txt.backup`.
    - `categoryGroups.json`.
    - All `scripts/*.js`.
    - `public/Confetti.lottie`, `public/globe.png`.
  - Result: `core-assets/` holds the canonical copies used for the rebuild; `Bingopedia/` remains as archival reference.

---

## 2. Phase 1 – New App Skeleton & Environment

- **1.1 Choose and scaffold the new frontend**
  - Create a new Vite React + TypeScript app (e.g. in `app/` or `web/`):
    - React 18.
    - Vite.
    - TypeScript + ESLint + basic testing (Vitest) for core logic.
  - Configure folder structure to match the high-level layout in `ARCHITECTURE_OVERVIEW.md`.

- **1.2 Environment & config conventions**
  - Create `ENVIRONMENT_AND_CONFIG.md` that defines:
    - Local `.env.local` layout (not committed).
    - Vercel env vars (`MONGODB_*`, `VITE_API_URL`).
    - Expected MongoDB database/collection and index.
  - Set up Vite env handling:
    - `VITE_API_URL` for pointing the frontend at either:
      - Local Express server.
      - Vercel dev/prod env.

- **1.3 Public assets**
  - Copy `core-assets/public/Confetti.lottie` and `core-assets/public/globe.png` into the new app’s `public/` folder during scaffold.
  - Document their usage in a small `public/README.md` in the new app (optional but helpful).

---

## 3. Phase 2 – Core Game Engine

- **2.1 Data loading & bingo set generation**
  - Implement a small data module that:
    - Loads `curatedArticles.json` from `public/`.
    - Understands `groups` and `categories` structure.
  - Re-implement bingo set generation:
    - Select 26 distinct categories, respecting `maxPerGame` group constraints.
    - Randomly choose 1 article per category.
    - Use first 25 for the grid; 26th as starting article.
    - Guarantee uniqueness of article titles within a game.

- **2.2 Game state model**
  - Implement a dedicated hook (e.g. `useGameState`) that manages:
    - `gameStarted`, `gameWon`, `gridArticles`, `startingArticle`.
    - `matchedArticles`, `winningCells`.
    - `clickCount`, `timer`, `timerRunning`, `articleLoading`.
    - `articleHistory` and history navigation rules.
  - Encode the game state types in TypeScript based on the structures defined in `HANDOFF_PRODUCT_SPEC.md`.

- **2.3 Win detection**
  - Implement a pure function for win detection using a 5×5 index grid:
    - Accepts `gridArticles` and `matchedArticles`.
    - Returns set of winning indices (if any).
  - Add unit tests to cover all 12 winning lines and critical edge cases.

---

## 4. Phase 3 – Wikipedia Integration & Matching

- **3.1 Wikipedia client**
  - Implement a `wikipediaClient` module (referencing, not copying, the old `wikipediaApi.js`):
    - Fetch article HTML via REST:
      - Prefer mobile HTML, with desktop fallback.
      - Final fallback to summary API if both HTML endpoints fail.
    - Clean/sanitize HTML:
      - Remove scripts/styles/sidebars/references.
      - Keep only in-article links and essential content.
    - Implement article content caching in memory per session.

- **3.2 Redirect resolution**
  - Implement a `resolveRedirect(title)` function:
    - Uses the Wikipedia Query API with `redirects=1&origin=*`.
    - Maintains an in-memory cache keyed by normalized title.
  - Write tests for representative redirect scenarios (including chains and capitalization).

- **3.3 Title normalization & matching**
  - Implement shared helpers:
    - `normalizeTitle()` – mirrors the normalization in the old `App.jsx` (spaces→underscores, collapse underscores, trim, case-insensitive comparison).
  - Rebuild the matching logic:
    - After each navigation:
      - Resolve canonical titles for both clicked and grid articles.
      - Match on both **direct** and **redirect-based** comparisons.
      - Only trigger confetti for newly matched titles.
    - Add unit tests for matching and redirect edge cases.

---

## 5. Phase 4 – UI Assembly & UX Polish

- **4.1 Layout & components**
  - Implement main screens:
    - Start screen with game description + prominent leaderboard.
    - Game screen with:
      - Grid panel + history.
      - Article viewer.
      - Score/timer panel.
  - Ensure mobile-first design:
    - Toggle between grid/history and viewer.
    - Persistent timer/clicks bar across views.

- **4.2 Interactions**
  - Ensure all of the following match the current behavioral spec:
    - History clicks always count as clicks and can trigger matches/wins.
    - Timer starts after first article load and pauses on loading.
    - Article failure triggers replacement behavior, without corrupting game state.
    - Grid click opens a read-only summary modal, not a direct navigation.

- **4.3 Visual polish & accessibility**
  - Apply a clean, modern visual skin:
    - Neutral, readable typography.
    - Sufficient contrast for matched vs winning states.
  - Add basic accessibility:
    - Keyboard focus handling for key controls and modals.
    - Reasonable ARIA labels and roles for buttons, toggles, and overlays.

---

## 6. Phase 5 – Leaderboard API & Integration

- **5.1 Backend implementation**
  - Implement `api/leaderboard` as a TypeScript serverless function:
    - Uses the MongoDB connection pattern from the old `api/leaderboard.js` as reference.
    - Provides `GET` and `POST` behaviors as defined in the spec.
    - Handles DB connection errors with user-friendly messages.
  - (Optional) Recreate an Express `server/index.ts` for easy local dev.

- **5.2 Frontend integration**
  - Implement a typed `leaderboardClient`:
    - `fetchLeaderboard({ limit, page, sortBy, sortOrder })`.
    - `submitScore(payload)`.
  - Wire the client into:
    - Start-screen leaderboard.
    - Win modal’s “Submit Score” action.
    - Game-details modal (read-only replay).

- **5.3 Username handling & light abuse protections**
  - Implement:
    - Max length enforcement.
    - Light bad-word masking (as per Q&A) in backend before persisting.
  - Basic sanity checks on score/time/clicks to avoid obviously impossible values.

---

## 7. Phase 6 – Testing, QA, and Deployment

- **6.1 Automated testing**
  - Unit tests:
    - Title normalization.
    - Redirect resolution with mocked responses.
    - Bingo set generation and constraints.
    - Win detection.
    - Score calculation.
  - Integration tests:
    - End-to-end game loop with mocked Wikipedia/leaderboard APIs.
    - API contract tests for `/api/leaderboard`.

- **6.2 Manual and cross-device QA**
  - Use the checklists in `HANDOFF_PRODUCT_SPEC.md` and `HANDOFF_QUICK_START.md`:
    - All 12 win lines.
    - Mobile vs desktop experience.
    - Article failure and replacement.
    - Leaderboard pagination/sorting.
    - Confetti timing and performance.

- **6.3 Deployment**
  - Configure Vercel project using:
    - Build command: `npm run build`.
    - Output dir: `dist`.
    - Rewrites for SPA + `/api/leaderboard`.
  - Set env vars in Vercel dashboard:
    - `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`.
    - Any analytics or future flags as needed.
  - Perform smoke tests in production and adjust if needed.

---

## 8. Maintenance & Future Enhancements (Out of Scope for Initial Build)

- Add support for:
  - Alternative grid sizes behind feature flags (code paths prepped in game engine).
  - Replayable/shared boards and daily challenges.
  - Analytics events for start/win/score-submitted and (later) link-sharing.
- Optionally harden:
  - Anti-cheat heuristics for leaderboard.
  - More robust error reporting/monitoring for Wikipedia and MongoDB outages.


