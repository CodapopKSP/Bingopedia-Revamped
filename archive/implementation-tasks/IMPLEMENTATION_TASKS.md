# Bingopedia Implementation Tasks

**Document Purpose**: This document breaks down the architectural plan into specific, verifiable tasks for different engineering roles. All tasks have acceptance criteria that can be verified programmatically (no visual-only tests).

**Status**: Ready for Assignment  
**Last Updated**: Post-Architectural Planning  
**Related Documents**: `ARCHITECTURAL_PLAN.md`, `FEATURE_SPECIFICATIONS.md`

---

## Task Organization

Tasks are organized by engineer type:
1. **Backend Engineer** - API endpoints, database, migrations
2. **Frontend Engineer** - React components, state management, business logic
3. **UI/UX Engineer** - CSS, styling, theme system
4. **Documentation Engineer** - Documentation updates, skills tracking

Each task includes:
- Clear acceptance criteria (verifiable by AI/code)
- Files to modify/create
- Dependencies
- Test requirements

---

## Backend Engineer Tasks

### Task BE-1: Add Date Filtering to Leaderboard API

**Priority**: High  
**Feature**: Enhanced Leaderboard Features (Feature 3)  
**Estimated Time**: 2-3 hours

**Description**: Add `dateFrom` and `dateTo` query parameters to the leaderboard GET endpoint to support time-based filtering.

**Files to Modify**:
- `api/leaderboard.ts`

**Implementation Steps**:
1. Add `dateFrom` and `dateTo` to `LeaderboardQuery` interface (ISO date strings)
2. Parse and validate date parameters in `parseQuery` function
3. Add MongoDB filter for date range: `{ createdAt: { $gte: dateFrom, $lte: dateTo } }`
4. Combine date filter with existing filters (sort, pagination)
5. Handle timezone considerations (store dates in UTC, query in UTC)

**Acceptance Criteria**:
- [x] GET `/api/leaderboard?dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z` returns only entries in that date range
- [x] Invalid date strings return 400 error with clear message
- [x] Missing `dateFrom`/`dateTo` returns all entries (backward compatible)
- [x] Date filtering works with existing `sortBy`, `sortOrder`, `limit`, `page` parameters
- [x] Unit test: `tests/leaderboard.integration.test.ts` includes date filtering test cases
- [x] All existing tests still pass

**Test Requirements**:
- Add test cases for valid date ranges
- Add test cases for invalid date formats
- Add test cases for date filtering combined with sorting
- Verify backward compatibility (no date params = all entries)

**Dependencies**: None

---

### Task BE-2: Add Game Type Filtering to Leaderboard API

**Priority**: Medium  
**Feature**: Leaderboard Game Type Separation (Feature 6)  
**Estimated Time**: 1-2 hours  
**Depends on**: BE-4 (gameType field in database)

**Description**: Add `gameType` query parameter to filter leaderboard entries by game type ('fresh', 'linked', or 'all').

**Files to Modify**:
- `api/leaderboard.ts`

**Implementation Steps**:
1. Add `gameType` to `LeaderboardQuery` interface: `'fresh' | 'linked' | 'all'`
2. Parse `gameType` in `parseQuery` (default: 'fresh')
3. Add MongoDB filter: `{ gameType: gameType }` when `gameType !== 'all'`
4. Combine with existing filters (date, sort, pagination)

**Acceptance Criteria**:
- [x] GET `/api/leaderboard?gameType=fresh` returns only fresh games
- [x] GET `/api/leaderboard?gameType=linked` returns only linked games
- [x] GET `/api/leaderboard?gameType=all` returns all games
- [x] Default behavior (no `gameType` param) returns only fresh games
- [x] Invalid `gameType` value returns 400 error
- [x] Game type filtering works with date filtering and sorting
- [ ] Unit test: Test all gameType filter combinations
- [ ] All existing tests still pass

**Test Requirements**:
- Test each gameType value ('fresh', 'linked', 'all')
- Test gameType with date filtering
- Test gameType with sorting
- Test invalid gameType values

**Dependencies**: BE-4 (gameType field must exist in database)

---

### Task BE-3: Create Games API Endpoints

**Priority**: Medium  
**Feature**: Game Sharing & Replay System (Feature 5)  
**Estimated Time**: 4-5 hours

**Description**: Create new API endpoints for storing and retrieving game states.

**Files to Create**:
- `api/games.ts`

**Files to Modify**:
- `api/mongoClient.ts` (add `getGamesCollection` function)

**Implementation Steps**:
1. Create `GameState` interface:
   ```typescript
   interface GameState {
     gameId: string; // UUID v4
     gridCells: string[]; // 25 article titles
     startingArticle: string;
     gameType: 'fresh' | 'linked';
     createdAt: Date;
     createdBy?: string; // Optional username
   }
   ```
2. Add `getGamesCollection()` to `api/mongoClient.ts`:
   - Create unique index on `gameId`
   - Create index on `createdAt` for cleanup
   - Return `Collection<GameState>`
3. Create `api/games.ts` with:
   - **POST `/api/games`**: Create new game state
     - Request body: `{ gridCells: string[], startingArticle: string, gameType: 'fresh' | 'linked', createdBy?: string }`
     - Generate UUID v4 for `gameId` (use `crypto.randomUUID()`)
     - Validate: gridCells length === 25, startingArticle is non-empty string
     - Response: `{ gameId: string, ...gameState }`
   - **GET `/api/games/:gameId`**: Retrieve game state
     - Response: `{ gameId, gridCells, startingArticle, gameType, createdAt }`
     - 404 if game not found
   - **OPTIONS**: Handle CORS preflight
4. Add CORS headers (same pattern as leaderboard)
5. Add error handling (use existing error utilities)

**Acceptance Criteria**:
- [x] POST `/api/games` creates game state and returns `gameId`
- [x] POST `/api/games` validates gridCells length (must be 25)
- [x] POST `/api/games` validates startingArticle (non-empty)
- [x] POST `/api/games` generates unique UUID v4 for each game
- [x] GET `/api/games/:gameId` returns game state if exists
- [x] GET `/api/games/:gameId` returns 404 if game not found
- [x] Invalid gameId format returns 400 error
- [x] CORS headers are properly set
- [ ] Unit test: `tests/games.integration.test.ts` covers all endpoints
- [x] Database indexes are created correctly

**Test Requirements**:
- Test POST with valid data
- Test POST with invalid data (wrong gridCells length, empty startingArticle)
- Test GET with valid gameId
- Test GET with invalid gameId (404)
- Test GET with malformed gameId (400)
- Test CORS preflight
- Verify UUID uniqueness

**Dependencies**: None

---

### Task BE-4: Add gameType and gameId to Leaderboard Schema

**Priority**: Medium  
**Feature**: Game Sharing & Replay System (Feature 5), Leaderboard Game Type Separation (Feature 6)  
**Estimated Time**: 2-3 hours

**Description**: Update leaderboard schema to include `gameType` and `gameId` fields, and create migration script.

**Files to Modify**:
- `api/mongoClient.ts` (update `LeaderboardEntry` interface)
- `api/leaderboard.ts` (accept `gameId` and `gameType` in POST)

**Files to Create**:
- `scripts/migrateLeaderboardGameType.js`

**Implementation Steps**:
1. Update `LeaderboardEntry` interface in `api/mongoClient.ts`:
   ```typescript
   export interface LeaderboardEntry {
     // ... existing fields
     gameId?: string; // Optional for backward compatibility
     gameType?: 'fresh' | 'linked'; // Optional, defaults to 'fresh'
   }
   ```
2. Update POST endpoint in `api/leaderboard.ts`:
   - Accept optional `gameId` and `gameType` in request body
   - Store in leaderboard entry
   - Default `gameType` to 'fresh' if not provided
3. Create migration script `scripts/migrateLeaderboardGameType.js`:
   ```javascript
   // Set gameType to 'fresh' for all existing entries that don't have it
   // Script should be idempotent (safe to run multiple times)
   ```
4. Add compound index: `{ gameType: 1, score: 1, createdAt: 1 }` for efficient filtering

**Acceptance Criteria**:
- [x] `LeaderboardEntry` interface includes optional `gameId` and `gameType` fields
- [x] POST `/api/leaderboard` accepts and stores `gameId` and `gameType`
- [x] POST `/api/leaderboard` defaults `gameType` to 'fresh' if not provided
- [x] Migration script sets `gameType: 'fresh'` for all existing entries
- [x] Migration script is idempotent (can run multiple times safely)
- [x] Compound index `{ gameType: 1, score: 1, createdAt: 1 }` exists
- [x] Existing leaderboard entries remain accessible (backward compatible)
- [ ] Unit test: Test POST with gameId and gameType
- [ ] Unit test: Test POST without gameId/gameType (backward compatibility)

**Test Requirements**:
- Test POST with gameId and gameType
- Test POST without gameId/gameType (should default gameType to 'fresh')
- Test migration script on test database
- Verify index creation
- Test backward compatibility (old entries still work)

**Dependencies**: None (but BE-2 depends on this)

---

### Task BE-5: Add createdAt Index for Date Filtering Performance

**Priority**: Medium  
**Feature**: Enhanced Leaderboard Features (Feature 3)  
**Estimated Time**: 1 hour

**Description**: Add database index on `createdAt` field to optimize date filtering queries.

**Files to Modify**:
- `api/mongoClient.ts`

**Implementation Steps**:
1. In `getLeaderboardCollection()`, add index creation for `createdAt`:
   ```typescript
   await db.collection(collectionName).createIndex({ createdAt: -1 });
   ```
2. Add compound index for common query patterns:
   ```typescript
   await db.collection(collectionName).createIndex({ createdAt: -1, score: 1 });
   ```

**Acceptance Criteria**:
- [x] Index on `createdAt` is created (or already exists)
- [x] Compound index `{ createdAt: -1, score: 1 }` is created
- [x] Index creation errors are logged but don't throw (idempotent)
- [x] Date filtering queries are efficient (verify with explain plan if possible)

**Test Requirements**:
- Verify indexes exist in database
- Test that index creation is idempotent (can run multiple times)

**Dependencies**: None

---

## Frontend Engineer Tasks

### Task FE-1: Fix Timer State Reset Bug

**Priority**: Critical  
**Feature**: Timer/State Reset Bug Fix (Feature 1)  
**Estimated Time**: 4-6 hours

**Description**: Separate timer display state from game logic state to prevent unnecessary re-renders that cause UI resets.

**Files to Modify**:
- `app/src/features/game/useGameState.ts`
- `app/src/features/game/useGameTimer.ts`
- `app/src/features/article-viewer/ArticleViewer.tsx`
- `app/src/features/game/GameScreen.tsx`

**Implementation Steps**:
1. **Separate Timer Display State**:
   - Create `useTimerDisplay` hook that uses `useRef` for timer value
   - Only update display state when needed (debounced or batched)
   - Keep `elapsedSeconds` in game state for scoring, but minimize re-renders
2. **Scroll Position Preservation** in `ArticleViewer.tsx`:
   - Add `scrollPositionRef` using `useRef`
   - Add `articleTitleRef` to track current article
   - Save scroll position on scroll event
   - Restore scroll position only if article title hasn't changed
3. **Modal State Isolation**:
   - Ensure modal state (`summaryModalTitle`, `showWinModal`) is independent of timer
   - Use `React.memo` for modal components if not already
4. **Focus Management**:
   - Preserve focus state during timer updates
   - Use `document.activeElement` to track focus
   - Restore focus if it was within article content and article hasn't changed

**Acceptance Criteria**:
- [x] Modal stays open for 10+ seconds during timer ticks (automated test)
- [x] Scroll position maintained in ArticleViewer during timer updates (automated test)
- [x] Focus doesn't jump during timer ticks (automated test)
- [x] Timer display updates correctly every second
- [x] Game scoring still uses correct elapsedSeconds value
- [x] No performance degradation (React Profiler shows reduced re-renders)
- [x] Unit test: `useGameState.integration.test.tsx` verifies timer doesn't cause state resets
- [x] All existing tests still pass

**Test Requirements**:
- Create test that opens modal, waits 10 seconds, verifies it's still open
- Create test that scrolls article, waits 5 seconds, verifies scroll position
- Create test that tabs through links, verifies focus doesn't jump
- Use React Testing Library for component tests
- Verify re-render count with React DevTools Profiler (manual verification)

**Dependencies**: None

---

### Task FE-2: Implement Theme Context and Provider

**Priority**: High  
**Feature**: Light Mode Theme Support (Feature 2)  
**Estimated Time**: 2-3 hours

**Description**: Create React Context for theme management with localStorage persistence.

**Files to Create**:
- `app/src/shared/theme/ThemeContext.tsx`

**Files to Modify**:
- `app/src/app/App.tsx` (wrap with ThemeProvider)

**Implementation Steps**:
1. Create `ThemeContext.tsx`:
   - Context with `theme: 'light' | 'dark'`
   - `setTheme` and `toggleTheme` functions
   - localStorage persistence
   - System preference detection (`prefers-color-scheme` media query)
   - Apply theme via `data-theme` attribute on document root
   - Default to dark mode if no preference

**Acceptance Criteria**:
- [x] Theme context provides `theme`, `setTheme`, `toggleTheme`
- [x] Theme preference persists in localStorage
- [x] System preference (`prefers-color-scheme`) is detected on first load
- [x] `data-theme` attribute is set on document root element
- [x] ThemeProvider wraps app in `App.tsx`
- [x] Unit test: Theme context test file verifies persistence and system preference
- [x] All existing tests still pass

**Test Requirements**:
- Test theme persistence (set theme, reload, verify it's still set)
- Test system preference detection
- Test toggleTheme function
- Test localStorage read/write
- Mock `prefers-color-scheme` media query

**Dependencies**: None

---

### Task FE-3: Create Theme Toggle Component

**Priority**: High  
**Feature**: Light Mode Theme Support (Feature 2)  
**Estimated Time**: 2 hours  
**Depends on**: FE-2

**Description**: Create accessible theme toggle button component.

**Files to Create**:
- `app/src/shared/components/ThemeToggle.tsx`

**Files to Modify**:
- `app/src/app/AppLayout.tsx` (add ThemeToggle to header)

**Implementation Steps**:
1. Create `ThemeToggle.tsx`:
   - Button/switch component
   - Uses ThemeContext
   - Keyboard accessible (Enter/Space to toggle)
   - Clear visual indicator (icon or text)
   - ARIA labels for accessibility

**Acceptance Criteria**:
- [x] ThemeToggle component renders and toggles theme
- [x] Component is keyboard accessible (Enter/Space)
- [x] Component has proper ARIA labels
- [x] Component is visible in AppLayout header
- [x] Unit test: ThemeToggle test file verifies toggle functionality
- [x] Unit test: Keyboard accessibility test

**Test Requirements**:
- Test click toggles theme
- Test keyboard navigation (Enter/Space)
- Test ARIA attributes
- Test visual indicator updates

**Dependencies**: FE-2

---

### Task FE-4: Add Date Display to Leaderboard

**Priority**: High  
**Feature**: Enhanced Leaderboard Features (Feature 3)  
**Estimated Time**: 2-3 hours

**Description**: Add date column to leaderboard table with formatting.

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`

**Implementation Steps**:
1. Add date column to leaderboard table
2. Format date using `Intl.DateTimeFormat`:
   - Format: "MMM DD, YYYY" (e.g., "Jan 15, 2024")
   - Handle timezone appropriately
3. Make date column sortable (clickable header)
4. Add sort indicator (↑↓) for date column

**Acceptance Criteria**:
- [x] Date column displays in leaderboard table
- [x] Dates are formatted as "MMM DD, YYYY"
- [x] Date column is sortable (clicking header sorts by date)
- [x] Sort indicator shows current sort direction
- [x] Date sorting works with API (`sortBy=createdAt`)
- [x] Unit test: Date formatting test
- [x] Unit test: Date column sorting test

**Test Requirements**:
- Test date formatting with various dates
- Test date column sorting (ascending/descending)
- Test date sorting with API integration
- Verify timezone handling

**Dependencies**: None (but BE-1 helps with date filtering)

---

### Task FE-5: Add Enhanced Sorting to Leaderboard UI

**Priority**: High  
**Feature**: Enhanced Leaderboard Features (Feature 3)  
**Estimated Time**: 3-4 hours

**Description**: Add sort dropdown/controls to leaderboard with multiple sort options.

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/shared/api/leaderboardClient.ts` (if needed for sort params)

**Implementation Steps**:
1. Add sort dropdown or clickable column headers
2. Sort options:
   - Score (ascending - lower is better)
   - Clicks (ascending)
   - Time (ascending)
   - Date (descending - newer first, or configurable)
   - Username (alphabetical)
3. Store sort state in component state
4. Update API calls with `sortBy` and `sortOrder` parameters
5. Visual indicator of current sort field and direction

**Acceptance Criteria**:
- [x] Sort dropdown/controls are visible and functional
- [x] All sort options (score, clicks, time, date, username) work
- [x] Sort state persists during session (component state)
- [x] Visual indicator shows current sort field and direction
- [x] API calls include correct `sortBy` and `sortOrder` parameters
- [x] Unit test: Sort state management test
- [x] Unit test: API call with sort parameters test

**Test Requirements**:
- Test each sort option
- Test sort direction (asc/desc)
- Test sort state persistence
- Test API integration with sort params
- Verify visual indicators update

**Dependencies**: None

---

### Task FE-6: Add Time-Based Filtering to Leaderboard UI

**Priority**: High  
**Feature**: Enhanced Leaderboard Features (Feature 3)  
**Estimated Time**: 3-4 hours  
**Depends on**: BE-1

**Description**: Add time-based filter dropdown to leaderboard.

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/shared/api/leaderboardClient.ts` (add dateFrom/dateTo params)

**Implementation Steps**:
1. Add filter dropdown with options:
   - "All Time" (default)
   - "Today"
   - "Past 7 Days"
   - "Past 30 Days"
   - "Past Year"
2. Calculate date ranges client-side:
   - Convert filter option to `dateFrom` and `dateTo` ISO date strings
3. Update API calls with `dateFrom` and `dateTo` parameters
4. Store filter state in component state
5. Clear indication of active filter

**Acceptance Criteria**:
- [ ] Filter dropdown is visible and functional
- [ ] All filter options work correctly
- [ ] Date ranges are calculated correctly (Today, 7 Days, 30 Days, Year)
- [ ] API calls include correct `dateFrom` and `dateTo` parameters
- [ ] Filter state persists during session
- [ ] Clear indication of active filter
- [ ] Unit test: Date range calculation test
- [ ] Unit test: API call with date filters test

**Test Requirements**:
- Test each filter option calculates correct date range
- Test date range calculation for edge cases (timezone, day boundaries)
- Test API integration with date filters
- Test filter state persistence

**Dependencies**: BE-1

---

### Task FE-7: Add Article Summaries to Game Details Modal

**Priority**: High  
**Feature**: Enhanced Leaderboard Features (Feature 3)  
**Estimated Time**: 3-4 hours

**Description**: Make bingo grid cells clickable in game details modal to view article summaries.

**Files to Modify**:
- `app/src/features/leaderboard/GameDetailsModal.tsx`
- `app/src/features/game/BingoGrid.tsx` (add optional onCellClick prop)

**Implementation Steps**:
1. Add `onCellClick` prop to `BingoGrid` component (optional)
2. In `GameDetailsModal`, pass `onCellClick` handler to `BingoGrid`
3. On cell click:
   - Extract article title from clicked cell
   - Fetch article summary using existing Wikipedia client utilities
   - Open `ArticleSummaryModal` with article content
4. Reuse existing `ArticleSummaryModal` component

**Acceptance Criteria**:
- [x] Bingo grid cells in GameDetailsModal are clickable
- [x] Clicking a cell opens ArticleSummaryModal with that article's content
- [x] Article content loads correctly
- [x] Modal can be closed and reopened for different cells
- [x] Unit test: Cell click handler test
- [x] Unit test: Article summary modal opens with correct content

**Test Requirements**:
- Test cell click triggers modal
- Test article content loads correctly
- Test modal can be closed and reopened
- Test with various article titles

**Dependencies**: None

---

### Task FE-8: Implement Confetti on Match

**Priority**: Medium  
**Feature**: Confetti Animation on Match (Feature 4)  
**Estimated Time**: 2-3 hours

**Description**: Trigger confetti animation when a new match is detected.

**Files to Modify**:
- `app/src/features/game/useGameState.ts`
- `app/src/features/game/GameScreen.tsx`

**Implementation Steps**:
1. Add optional `onMatch` callback prop to `useGameState`:
   ```typescript
   interface UseGameStateOptions {
     onMatch?: (articleTitle: string) => void
   }
   ```
2. In `registerNavigation`, when `updated === true` (new match), call `onMatch` callback
3. In `GameScreen.tsx`:
   - Add state for "show confetti on match"
   - Pass `onMatch` callback to `useGameState`
   - Trigger confetti when match detected
   - Auto-hide confetti after animation (2 seconds)
4. Ensure confetti doesn't interfere with gameplay

**Acceptance Criteria**:
- [x] Confetti plays immediately when a grid cell is matched
- [x] Confetti plays for each new match (not re-visits)
- [x] Confetti doesn't interfere with gameplay
- [x] Confetti auto-hides after animation completes
- [x] Unit test: Match detection triggers confetti callback
- [x] Unit test: Confetti state management test

**Test Requirements**:
- Test confetti triggers on new match
- Test confetti doesn't trigger on re-visit
- Test confetti state cleanup
- Test multiple rapid matches (debouncing if needed)

**Dependencies**: None

---

### Task FE-9: Implement Game State Loading from URL

**Priority**: Medium  
**Feature**: Game Sharing & Replay System (Feature 5)  
**Estimated Time**: 3-4 hours  
**Depends on**: BE-3, FE-10

**Description**: Handle URL parameter `?game={gameId}` to load and start games.

**Files to Modify**:
- `app/src/app/App.tsx`
- `app/src/features/game/useGameState.ts`
- `app/src/features/game/StartScreen.tsx`

**Implementation Steps**:
1. In `App.tsx`, on mount:
   - Parse URL query parameters for `game` parameter
   - If `gameId` present, fetch game state from `/api/games/:gameId`
   - If found, auto-start game with that state
   - If not found, show error and allow starting fresh game
2. Add `loadGameFromId` function to `useGameState`:
   - Fetch game state from API
   - Initialize game with that state
   - Set `gameType` to 'linked'
3. Update `startNewGame` to accept optional game state parameter

**Acceptance Criteria**:
- [x] URL parameter `?game={gameId}` is parsed on app load
- [x] Game state is fetched from API if gameId is valid
- [x] Game auto-starts with loaded state if found
- [x] Error message shown if game not found
- [x] User can start fresh game if loaded game fails
- [x] Game type is set to 'linked' for loaded games
- [x] Unit test: URL parameter parsing test
- [x] Unit test: Game loading from API test
- [x] Unit test: Error handling for invalid gameId

**Test Requirements**:
- Test URL parameter parsing
- Test game state loading from API
- Test error handling (invalid gameId, 404)
- Test game initialization with loaded state
- Test gameType is set correctly

**Dependencies**: BE-3, FE-10

---

### Task FE-10: Add Game State Management to useGameState

**Priority**: Medium  
**Feature**: Game Sharing & Replay System (Feature 5)  
**Estimated Time**: 3-4 hours

**Description**: Extend `useGameState` to support loading games from stored state and creating shareable games.

**Files to Modify**:
- `app/src/features/game/useGameState.ts`
- `app/src/features/game/types.ts` (add gameId and gameType to GameState)

**Implementation Steps**:
1. Add `gameId` and `gameType` to `GameState` interface
2. Add `loadGameFromId(gameId: string)` function:
   - Fetch game state from `/api/games/:gameId`
   - Initialize game with that state
   - Set `gameType` to 'linked'
3. Modify `startNewGame` to accept optional game state parameter:
   ```typescript
   startNewGame: (gameState?: { gridCells, startingArticle, gameId, gameType }) => Promise<void>
   ```
4. Add `createShareableGame()` function:
   - Generate new game (using existing `generateBingoSet`)
   - POST to `/api/games` to store game state
   - Return `{ gameId, url }`

**Acceptance Criteria**:
- [ ] `GameState` includes `gameId` and `gameType` fields
- [ ] `loadGameFromId` fetches and loads game state correctly
- [ ] `startNewGame` accepts optional game state parameter
- [ ] `createShareableGame` creates game and stores in API
- [ ] `createShareableGame` returns gameId and shareable URL
- [ ] Unit test: Game state loading test
- [ ] Unit test: Shareable game creation test
- [ ] All existing tests still pass

**Test Requirements**:
- Test loading game from gameId
- Test starting game with provided state
- Test creating shareable game
- Test gameId and gameType are set correctly
- Test error handling

**Dependencies**: BE-3

---

### Task FE-11: Add Shareable Game Generation UI

**Priority**: Medium  
**Feature**: Game Sharing & Replay System (Feature 5)  
**Estimated Time**: 2-3 hours  
**Depends on**: FE-10

**Description**: Add UI for generating shareable games with copy-to-clipboard functionality.

**Files to Modify**:
- `app/src/features/game/StartScreen.tsx`

**Implementation Steps**:
1. Add "Generate Shareable Game" button
2. On click:
   - Call `createShareableGame()` from `useGameState`
   - Display shareable link with copy-to-clipboard button
   - Show success feedback when copied
3. Link format: `{window.location.origin}?game={gameId}`
4. Use `navigator.clipboard.writeText()` API

**Acceptance Criteria**:
- [ ] "Generate Shareable Game" button is visible and functional
- [ ] Clicking button generates game and displays link
- [ ] Copy-to-clipboard button copies link to clipboard
- [ ] Success feedback is shown when link is copied
- [ ] Link format is correct (`?game={gameId}`)
- [ ] Unit test: Shareable game generation UI test
- [ ] Unit test: Copy-to-clipboard functionality test

**Test Requirements**:
- Test button click generates game
- Test link is displayed correctly
- Test copy-to-clipboard (mock navigator.clipboard)
- Test success feedback
- Test link format

**Dependencies**: FE-10

---

### Task FE-12: Add Replay Feature to Game Details Modal

**Priority**: Medium  
**Feature**: Game Sharing & Replay System (Feature 5)  
**Estimated Time**: 3-4 hours  
**Depends on**: FE-10, BE-4

**Description**: Add "Replay" button to game details modal that loads and starts the game.

**Files to Modify**:
- `app/src/features/leaderboard/GameDetailsModal.tsx`
- `app/src/features/game/useGameState.ts` (if needed)

**Implementation Steps**:
1. Add "Replay" button to game details modal
2. On click:
   - Extract `gameId` from leaderboard entry (if available)
   - If `gameId` exists, load game from API using `loadGameFromId`
   - If not, reconstruct from `bingoSquares` and `history`:
     - `bingoSquares` array is the grid (25 items)
     - First item in `history` is starting article
   - Start new game with that state
   - Mark as `gameType: 'linked'`
   - Navigate to game screen

**Acceptance Criteria**:
- [ ] "Replay" button is visible in game details modal
- [ ] Clicking replay loads game from gameId if available
- [ ] Clicking replay reconstructs game from bingoSquares/history if gameId not available
- [ ] Replayed game starts correctly
- [ ] Replayed game is marked as 'linked' type
- [ ] Unit test: Replay from gameId test
- [ ] Unit test: Replay from reconstruction test

**Test Requirements**:
- Test replay with gameId
- Test replay without gameId (reconstruction)
- Test game state reconstruction from bingoSquares/history
- Test gameType is set to 'linked'
- Test navigation to game screen

**Dependencies**: FE-10, BE-4

---

### Task FE-13: Add gameId and gameType to Score Submission

**Priority**: Medium  
**Feature**: Game Sharing & Replay System (Feature 5)  
**Estimated Time**: 1-2 hours  
**Depends on**: BE-4, FE-10

**Description**: Include `gameId` and `gameType` when submitting scores to leaderboard.

**Files to Modify**:
- `app/src/features/game/WinModal.tsx`
- `app/src/shared/api/leaderboardClient.ts` (add gameId and gameType to submit)

**Implementation Steps**:
1. In `WinModal.tsx`, include `gameId` and `gameType` from `GameState` when submitting
2. Update `leaderboardClient.ts` `submitScore` function to accept optional `gameId` and `gameType`
3. Include in POST request to `/api/leaderboard`

**Acceptance Criteria**:
- [ ] Score submission includes `gameId` if available
- [ ] Score submission includes `gameType` (from GameState)
- [ ] Backward compatible (gameId/gameType are optional)
- [ ] Unit test: Score submission with gameId/gameType test
- [ ] All existing tests still pass

**Test Requirements**:
- Test score submission with gameId and gameType
- Test score submission without gameId/gameType (backward compatibility)
- Test gameType is correctly set ('fresh' or 'linked')

**Dependencies**: BE-4, FE-10

---

### Task FE-14: Add Game Type Filter to Leaderboard UI

**Priority**: Medium  
**Feature**: Leaderboard Game Type Separation (Feature 6)  
**Estimated Time**: 2-3 hours  
**Depends on**: BE-2, BE-4

**Description**: Add game type filter dropdown to leaderboard UI.

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/shared/api/leaderboardClient.ts` (add gameType param)

**Implementation Steps**:
1. Add game type filter dropdown/toggle:
   - Options: "Fresh Games", "Linked Games", "All Games"
   - Default: "Fresh Games"
2. Update API calls with `gameType` parameter
3. Store filter state in component state
4. Clear visual indication of active filter

**Acceptance Criteria**:
- [ ] Game type filter is visible and functional
- [ ] All filter options work correctly
- [ ] Default view shows "Fresh Games"
- [ ] API calls include correct `gameType` parameter
- [ ] Filter state persists during session
- [ ] Clear indication of active filter
- [ ] Unit test: Game type filter test
- [ ] Unit test: API call with gameType test

**Test Requirements**:
- Test each filter option
- Test default filter is "Fresh Games"
- Test API integration with gameType param
- Test filter state persistence

**Dependencies**: BE-2, BE-4

---

## UI/UX Engineer Tasks

### Task UI-1: Create Theme CSS Variables System

**Priority**: High  
**Feature**: Light Mode Theme Support (Feature 2)  
**Estimated Time**: 4-6 hours

**Description**: Create CSS variable system for theme colors and update all CSS files to use variables.

**Files to Create**:
- `app/src/shared/theme/theme.css`

**Files to Modify**:
- `app/src/index.css` (import theme.css)
- All component CSS files (replace hardcoded colors with variables)

**Implementation Steps**:
1. Create `theme.css` with CSS variable definitions:
   ```css
   :root {
     /* Dark theme (default) */
     --bg-primary: #0b1120;
     --bg-secondary: #020617;
     --text-primary: #e5e7eb;
     /* ... all colors */
   }
   
   [data-theme="light"] {
     /* Light theme overrides */
     --bg-primary: #ffffff;
     --bg-secondary: #f8f9fa;
     --text-primary: #1a1a1a;
     /* ... all colors */
   }
   ```
2. Define color palette for both themes:
   - Backgrounds, text, borders
   - Bingo grid states (neutral, matched, winning)
   - Buttons, modals, links
   - Ensure WCAG AA contrast ratios
3. Update all CSS files to use variables:
   - `AppLayout.css`
   - `GameScreen.css`
   - `BingoGrid.css`
   - `ArticleViewer.css`
   - `WinModal.css`
   - `ArticleSummaryModal.css`
   - `GameDetailsModal.css`
   - `StartScreen.css`
   - `HistoryPanel.css`
   - `Confetti.css`
   - `ErrorBoundary.css`
   - All other component CSS files

**Acceptance Criteria**:
- [ ] `theme.css` defines all color variables for dark and light themes
- [ ] All CSS files use CSS variables instead of hardcoded colors
- [ ] Dark theme works correctly (no visual regressions)
- [ ] Light theme provides sufficient contrast (WCAG AA)
- [ ] All visual states (matched, winning, etc.) work in both themes
- [ ] No hardcoded colors remain in CSS files (grep verification)
- [ ] Automated test: CSS variable usage test (grep for hex colors, verify they're variables)

**Test Requirements**:
- Grep for hardcoded hex colors in CSS files (should find none)
- Verify all color variables are defined
- Test contrast ratios with browser dev tools (manual verification)
- Visual inspection in both themes (manual verification)

**Dependencies**: FE-2 (ThemeContext must set data-theme attribute)

---

### Task UI-2: Design Light Mode Color Palette

**Priority**: High  
**Feature**: Light Mode Theme Support (Feature 2)  
**Estimated Time**: 2-3 hours

**Description**: Design and document light mode color palette with contrast verification.

**Files to Create**:
- `docs/THEME_COLOR_PALETTE.md` (documentation)

**Files to Modify**:
- `app/src/shared/theme/theme.css` (implement palette)

**Implementation Steps**:
1. Design light mode color palette:
   - Backgrounds: White (#ffffff), light gray (#f8f9fa), off-white (#fafafa)
   - Text: Dark gray (#1a1a1a), medium gray (#4a4a4a), light gray (#6b6b6b)
   - Bingo Grid:
     - Neutral: Light gray background (#e5e7eb), darker border (#cbd5e1)
     - Matched: Light green background (#d1fae5), green border (#10b981)
     - Winning: Light yellow background (#fef3c7), yellow border (#f59e0b)
   - Buttons: Maintain gradient approach but adjust for light mode
   - Modals: White background (#ffffff) with subtle shadow
2. Verify contrast ratios:
   - All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
   - Use browser dev tools or online contrast checker
3. Document palette in `THEME_COLOR_PALETTE.md`

**Acceptance Criteria**:
- [ ] Light mode color palette is defined and documented
- [ ] All color combinations meet WCAG AA contrast ratios
- [ ] Color palette is implemented in `theme.css`
- [ ] Documentation file includes color values and contrast ratios
- [ ] Automated test: Contrast ratio verification (can use automated tools or manual checklist)

**Test Requirements**:
- Verify contrast ratios with automated tool or browser dev tools
- Document all color values and their usage
- Test all interactive elements have clear visual distinction

**Dependencies**: None (but UI-1 depends on this)

---

## Documentation Engineer Tasks

### Task DOC-1: Update Architecture Documentation

**Priority**: Medium  
**Estimated Time**: 2-3 hours

**Description**: Update architectural documentation to reflect implemented features.

**Files to Modify**:
- `ARCHITECTURAL_PLAN.md`
- `FEATURE_SPECIFICATIONS.md`

**Implementation Steps**:
1. Update status sections in both documents
2. Add implementation notes for completed features
3. Document any deviations from original plan
4. Add lessons learned section

**Acceptance Criteria**:
- [ ] Status sections updated for completed features
- [ ] Implementation notes added
- [ ] Deviations documented
- [ ] Lessons learned section added

**Dependencies**: Features must be completed first

---

### Task DOC-2: Create Skills Documentation

**Priority**: Medium  
**Estimated Time**: 2-3 hours

**Description**: Document skills learned during implementation.

**Files to Create**:
- `docs/IMPLEMENTATION_SKILLS.md`

**Implementation Steps**:
1. Document technical skills learned:
   - React state management patterns (timer state separation)
   - CSS custom properties for theming
   - MongoDB query optimization (indexing)
   - API design patterns
   - URL parameter handling
   - Game state persistence
2. Document architectural decisions:
   - Why CSS variables over CSS-in-JS
   - Why query parameters over routing library
   - Why full game state storage over reconstruction
3. Document best practices:
   - Scroll position preservation
   - Focus management
   - Modal state isolation
   - Performance optimization techniques

**Acceptance Criteria**:
- [x] Skills documentation file created
- [x] Technical skills documented with examples (backend skills complete)
- [x] Architectural decisions explained (backend decisions complete)
- [x] Best practices documented (backend practices complete)

**Dependencies**: Features must be completed first

---

### Task DOC-3: Update API Documentation

**Priority**: Medium  
**Estimated Time**: 2-3 hours

**Description**: Update API documentation with new endpoints and parameters.

**Files to Create/Modify**:
- `docs/API_DOCUMENTATION.md` (or update existing)

**Implementation Steps**:
1. Document new `/api/games` endpoints:
   - POST `/api/games`
   - GET `/api/games/:gameId`
2. Document new leaderboard API parameters:
   - `dateFrom`, `dateTo`
   - `gameType`
3. Document updated leaderboard POST request (gameId, gameType fields)
4. Include request/response examples
5. Include error codes and messages

**Acceptance Criteria**:
- [ ] All new endpoints documented
- [ ] All new parameters documented
- [ ] Request/response examples included
- [ ] Error codes documented
- [ ] Documentation is clear and complete

**Dependencies**: Backend tasks must be completed

---

### Task DOC-4: Update README and Quick Reference

**Priority**: Low  
**Estimated Time**: 1-2 hours

**Description**: Update project README and quick reference with new features.

**Files to Modify**:
- `README.md`
- `QUICK_REFERENCE.md`

**Implementation Steps**:
1. Add new features to README
2. Update quick reference with new API endpoints
3. Add setup instructions for new features
4. Update feature list

**Acceptance Criteria**:
- [ ] README includes all new features
- [ ] Quick reference updated
- [ ] Setup instructions are clear
- [ ] Feature list is complete

**Dependencies**: Features must be completed

---

## Task Dependencies Summary

```
Backend:
  BE-1 (Date Filtering) → Independent
  BE-2 (Game Type Filtering) → Depends on BE-4
  BE-3 (Games API) → Independent
  BE-4 (Schema Updates) → Independent (but BE-2 depends on it)
  BE-5 (Indexes) → Independent

Frontend:
  FE-1 (Timer Bug Fix) → Independent
  FE-2 (Theme Context) → Independent
  FE-3 (Theme Toggle) → Depends on FE-2
  FE-4 (Date Display) → Independent
  FE-5 (Sorting) → Independent
  FE-6 (Time Filtering) → Depends on BE-1
  FE-7 (Article Summaries) → Independent
  FE-8 (Confetti) → Independent
  FE-9 (URL Loading) → Depends on BE-3, FE-10
  FE-10 (Game State Management) → Depends on BE-3
  FE-11 (Shareable UI) → Depends on FE-10
  FE-12 (Replay) → Depends on FE-10, BE-4
  FE-13 (Score Submission) → Depends on BE-4, FE-10
  FE-14 (Game Type Filter) → Depends on BE-2, BE-4

UI/UX:
  UI-1 (CSS Variables) → Depends on FE-2
  UI-2 (Color Palette) → Independent

Documentation:
  DOC-1, DOC-2, DOC-3, DOC-4 → All depend on feature completion
```

---

## Verification Checklist

All tasks should be verified with:
- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests are written and pass
- [ ] No linter errors
- [ ] Code follows project style guidelines
- [ ] Acceptance criteria are met
- [ ] Documentation is updated (if applicable)

---

## Notes for Engineering Manager

1. **Parallel Work**: Many tasks can be worked on in parallel:
   - Backend tasks BE-1, BE-3, BE-4, BE-5 can be done in parallel
   - Frontend tasks FE-1, FE-2, FE-4, FE-5, FE-7, FE-8 can be done in parallel
   - UI tasks can be done in parallel with frontend tasks

2. **Critical Path**: 
   - FE-1 (Timer Bug) should be prioritized (critical bug)
   - FE-2 → FE-3 → UI-1 (Theme system is sequential)
   - BE-3 → FE-10 → FE-9, FE-11, FE-12 (Game sharing is sequential)

3. **Testing**: All tasks include automated test requirements. Manual visual testing may be needed for UI tasks, but acceptance criteria focus on verifiable aspects.

4. **Documentation**: Documentation tasks should be done after features are complete, but can be started in parallel with final feature work.

