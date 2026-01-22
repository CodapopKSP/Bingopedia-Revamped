## Bingopedia – Frontend App (React + TypeScript + Vite)

This directory contains the new Bingopedia frontend SPA implemented with React 18, TypeScript, and Vite,
following the architecture in `ARCHITECTURE_OVERVIEW.md`.

### Frontend Development

- **Install dependencies**

  ```bash
  cd app
  npm install
  ```

- **Run the dev server**

  ```bash
  npm run dev
  ```

- **Build for production**

  ```bash
  npm run build
  ```

- **Lint**

  ```bash
  npm run lint
  ```

- **Run tests**

  ```bash
  npm run test
  ```

- **Run tests with UI**

  ```bash
  npm run test:ui
  ```

- **Run tests with coverage**

  ```bash
  npm run test:coverage
  ```

### Testing

The test suite includes:
- **Unit tests** for core game logic (win detection, title normalization, redirect resolution, leaderboard client)
- **Integration tests** for full game flows (start → navigate → match → win, history navigation, score submission)

Tests are located alongside their source files with `.test.ts` or `.test.tsx` extensions.

### Performance Checks

To validate performance:
1. **First article load**: Start a game and measure time from "Start Game" click to first article display (target: < 2 seconds on typical broadband)
2. **Cached article loads**: Navigate to previously visited articles and verify they load instantly from cache
3. **Redirect cache**: Verify that resolving the same redirect multiple times only makes one API call
4. **Article content cache**: Verify that visiting the same article twice only fetches once

Use browser DevTools Network tab to monitor API calls and verify caching behavior.

### Data & Assets

- The app expects the following files in `public/`:
  - `curatedArticles.json` – curated article data used to generate bingo boards.
  - `Confetti.lottie` – animation used by the confetti component.
  - `globe.png` – asset used in the grid/article toggle UI.
- TypeScript contracts for curated articles and game/leaderboard data live in:
  - `src/shared/data/types.ts`
  - `src/shared/data/curatedArticles.ts`

### Environment & API Configuration

- The frontend talks to the leaderboard API via a configurable base URL:
  - `VITE_API_URL` (optional) – full base URL for API requests.
  - If unset, the app falls back to same-origin `/api/leaderboard`.
- The helper for this lives in `src/shared/api/config.ts`.

### High-Level Structure

- `src/app/` – app shell, layout.
- `src/features/game/` – game engine and main game UI (start screen, game screen, modals).
- `src/features/article-viewer/` – Wikipedia article viewer and sanitization.
- `src/features/leaderboard/` – leaderboard screens and game details modal.
- `src/shared/api/` – API clients and config (leaderboard, Wikipedia).
- `src/shared/data/` – data contracts and curated article loader.
- `src/shared/ui/` – shared UI primitives.
