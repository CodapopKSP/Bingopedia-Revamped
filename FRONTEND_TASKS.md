# Frontend Engineer Tasks

**Document Purpose**: Specific, verifiable tasks for frontend engineers implementing bug fixes and features from `ENGINEERING_PLAN.md`.

**Status**: Completed  
**Last Updated**: Post-Implementation  
**Related Documents**: `ENGINEERING_PLAN.md`, `CHANGE_LIST.md`, `PRODUCT_PRD.md`

---

## Task Organization

Tasks are organized by phase from `ENGINEERING_PLAN.md`:
- **Phase 1**: Critical Bug Fixes
- **Phase 2**: High Priority Features
- **Phase 3**: Medium Priority Features
- **Phase 4**: Optional Features

Each task includes:
- Clear acceptance criteria (verifiable by code review/testing)
- Files to modify/create
- Dependencies
- Test requirements
- Documentation requirements
- Skills documentation requirements

---

## Phase 1: Critical Bug Fixes

### Task FE-BUG-1: Fix Leaderboard Time Format

**Priority**: HIGH  
**Feature**: BUG-1 from ENGINEERING_PLAN.md  
**Estimated Time**: 1-2 hours

**Description**: Create shared time formatting utility and update all time displays to show HH:MM:SS format instead of raw seconds.

**Current State**: 
- Time displayed as raw seconds (e.g., "5025s" in `StartScreenLeaderboard.tsx` line 294)
- `formatTime` function exists in `GameDetailsModal.tsx` and `WinModal.tsx` but not shared

**Files to Create**:
- `app/src/shared/utils/timeFormat.ts` (new file)

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (line 294)
- `app/src/features/leaderboard/GameDetailsModal.tsx` (replace local formatTime)
- `app/src/features/game/WinModal.tsx` (replace local formatTime if exists)

**Implementation Steps**:

1. **Create Shared Time Format Utility**:
   ```typescript
   // app/src/shared/utils/timeFormat.ts
   /**
    * Formats seconds into HH:MM:SS format
    * @param seconds - Number of seconds to format
    * @returns Formatted time string (e.g., "01:23:45")
    */
   export function formatTime(seconds: number): string {
     const hours = Math.floor(seconds / 3600);
     const minutes = Math.floor((seconds % 3600) / 60);
     const secs = Math.floor(seconds % 60);
     
     return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
   }
   ```

2. **Update StartScreenLeaderboard.tsx**:
   - Import `formatTime` from shared utils
   - Replace `{entry.time}s` with `{formatTime(entry.time)}`
   - Remove any local time formatting logic

3. **Update GameDetailsModal.tsx**:
   - Import `formatTime` from shared utils
   - Remove local `formatTime` function (lines 15-23)
   - Use imported `formatTime` function

4. **Update WinModal.tsx** (if applicable):
   - Import `formatTime` from shared utils
   - Remove local `formatTime` function if it exists
   - Use imported `formatTime` function

**Acceptance Criteria**:
- [x] `timeFormat.ts` utility function exists and exports `formatTime`
- [x] `formatTime(0)` returns `"00:00:00"`
- [x] `formatTime(59)` returns `"00:00:59"`
- [x] `formatTime(3661)` returns `"01:01:01"`
- [x] `formatTime(5025)` returns `"01:23:45"`
- [x] Leaderboard table shows time as "01:23:45" format, not "5025s"
- [x] GameDetailsModal shows time in HH:MM:SS format
- [x] WinModal shows time in HH:MM:SS format (if applicable)
- [x] All time displays use the shared utility function
- [x] Unit test: `timeFormat.test.ts` includes tests for edge cases (0, <60, <3600, >3600)
- [x] All existing tests still pass

**Test Requirements**:
- Create `app/src/shared/utils/timeFormat.test.ts`
- Test with 0 seconds
- Test with <60 seconds
- Test with <3600 seconds
- Test with >3600 seconds
- Test with edge cases (negative numbers, NaN - should handle gracefully)

**Dependencies**: None

**Documentation Requirements**:
- Add JSDoc comment to `formatTime` function
- Document the format (HH:MM:SS) in the comment

**Skills Documentation**:
- Document utility function organization patterns in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task FE-BUG-2: Fix Leaderboard Default Sort

**Priority**: HIGH  
**Feature**: BUG-2 from ENGINEERING_PLAN.md  
**Estimated Time**: 30 minutes

**Description**: Update frontend default sort order to ascending for score.

**Current State**: Frontend defaults to `sortOrder: 'desc'` (line 82 in `StartScreenLeaderboard.tsx`)

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (line 82)

**Implementation Steps**:
1. Locate the `sortOrder` state initialization in `StartScreenLeaderboard.tsx`
2. Change default from `'desc'` to `'asc'`:
   ```typescript
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')  // Change from 'desc'
   ```

**Acceptance Criteria**:
- [x] Leaderboard component initializes with `sortOrder: 'asc'`
- [x] Leaderboard loads with score sorted ascending by default
- [x] Sort controls still work (can change to descending)
- [x] Visual sort indicator shows ascending on initial load
- [x] Unit test: Test default sort order is ascending
- [x] All existing tests still pass

**Test Requirements**:
- Test component initializes with ascending sort
- Test sort controls still work
- Test API call includes correct sortOrder parameter

**Dependencies**: BE-BUG-2 (backend must also default to ascending)

**Documentation Requirements**:
- Add comment explaining default sort behavior

**Skills Documentation**:
- None required (simple state change)

---

### Task FE-BUG-3: Fix Leaderboard Time Period Filter

**Priority**: HIGH  
**Feature**: BUG-3 from ENGINEERING_PLAN.md  
**Estimated Time**: 1-2 hours

**Description**: Verify and fix date range calculation in frontend to ensure time period filters work correctly.

**Current State**: Filter UI exists but may not be passing dates correctly to API.

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (verify `getDateRange()` function, lines 38-70)

**Implementation Steps**:
1. Locate `getDateRange()` function in `StartScreenLeaderboard.tsx`
2. Verify date calculation logic:
   - "Today": Start of today to end of today (UTC)
   - "Past 7 Days": 7 days ago to end of today
   - "Past 30 Days": 30 days ago to end of today
   - "Past Year": 1 year ago to end of today
   - "All Time": No date filter (null values)
3. Ensure dates are converted to ISO strings correctly:
   ```typescript
   const dateFrom = startDate.toISOString();
   const dateTo = endDate.toISOString();
   ```
4. Verify dates are passed to API correctly in API call
5. Add console.log for debugging (remove before final commit)

**Acceptance Criteria**:
- [x] `getDateRange()` function calculates correct date ranges for each option
- [x] Dates are converted to ISO strings before sending to API
- [x] "Today" filter shows only games from last 24 hours
- [x] "Past 7 Days" filter shows only games from last week
- [x] "Past 30 Days" filter shows only games from last month
- [x] "Past Year" filter shows only games from last year
- [x] "All Time" filter shows all games (no date filter)
- [x] Date ranges are calculated in UTC to match backend
- [x] Unit test: Test date range calculation for each filter option
- [x] All existing tests still pass

**Test Requirements**:
- Test each time filter option calculates correct date range
- Test date range calculation for edge cases (timezone, day boundaries)
- Test ISO string conversion
- Test API integration with date filters

**Dependencies**: BE-BUG-3 (backend must fix date filtering)

**Documentation Requirements**:
- Add JSDoc comment explaining date range calculation
- Document timezone handling approach

**Skills Documentation**:
- Document date range calculation patterns
- Document timezone handling best practices in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task FE-BUG-4: Update Game Type Terminology

**Priority**: HIGH  
**Feature**: BUG-4 from ENGINEERING_PLAN.md  
**Estimated Time**: 1-2 hours

**Description**: Update terminology from "fresh"/"linked" to "random"/"repeat" throughout frontend code.

**Current State**: Code uses "fresh"/"linked" terminology.

**Files to Modify**:
- `app/src/features/game/types.ts` (update GameState type)
- `app/src/features/game/useGameState.ts` (update gameType values)
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (update UI labels)
- `app/src/shared/api/gamesClient.ts` (update types)
- Any other files referencing "fresh" or "linked"

**Implementation Steps**:
1. **Update Types**:
   - In `app/src/features/game/types.ts`, change `'fresh' | 'linked'` → `'random' | 'repeat'`
   - In `app/src/shared/api/gamesClient.ts`, update any type definitions

2. **Update Game Logic**:
   - In `app/src/features/game/useGameState.ts`, update gameType values:
     - "fresh" → "random" (for new games)
     - "linked" → "repeat" (for shared/replayed games)

3. **Update UI Labels**:
   - In `app/src/features/leaderboard/StartScreenLeaderboard.tsx`, update filter labels:
     - "Fresh Games" → "Random Games"
     - "Linked Games" → "Repeat Games"

4. **Search for All References**:
   - Use grep to find all occurrences of "fresh" and "linked" in frontend code
   - Update all references to use new terminology

**Acceptance Criteria**:
- [x] All TypeScript types use 'random' | 'repeat' instead of 'fresh' | 'linked'
- [x] Game logic uses 'random' for new games and 'repeat' for shared games
- [x] UI labels show "Random Games" and "Repeat Games"
- [x] No references to "fresh" or "linked" remain in frontend code (grep verification)
- [x] Game type filter works correctly with new terminology
- [x] Unit test: Test gameType values are correct
- [x] All existing tests still pass

**Test Requirements**:
- Test gameType is set to 'random' for new games
- Test gameType is set to 'repeat' for shared/replayed games
- Test game type filter works with new terminology
- Grep for "fresh" and "linked" to verify all references updated

**Dependencies**: BE-BUG-4 (backend must update terminology first)

**Documentation Requirements**:
- Add comments explaining terminology (random = new games, repeat = shared games)
- Update any user-facing documentation

**Skills Documentation**:
- Document terminology update strategies in `docs/IMPLEMENTATION_SKILLS.md`

---

## Phase 2: High Priority Features

### Task FE-FEAT-2: Update Frontend for Hashed ID System

**Priority**: HIGH  
**Feature**: FEAT-2 from ENGINEERING_PLAN.md  
**Estimated Time**: 3-4 hours

**Description**: Update frontend to use hashed IDs instead of UUIDs for shareable games, and implement path-based routing.

**Current State**: Uses UUID v4 for game IDs, query params for URLs (`?game=uuid`).

**Key Changes**:
1. Update API client to use hashed IDs
2. Update game state management to use hashed IDs
3. Implement path-based routing (`/{hashedId}`)
4. Update UI to display hashed ID URLs

**Files to Modify**:
- `app/src/shared/api/gamesClient.ts` (use hashedId)
- `app/src/features/game/useGameState.ts` (use hashedId)
- `app/src/app/App.tsx` (handle path-based routing)
- `app/src/features/game/StartScreen.tsx` (display hashed ID URLs)

**Implementation Steps**:

1. **Update gamesClient.ts**:
   - Update `createGame()` to expect `hashedId` in response instead of `gameId`
   - Update `getGame()` to accept `hashedId` parameter
   - Update types to use `hashedId` instead of `gameId`

2. **Update useGameState.ts**:
   - Update `GameState` interface to include `hashedId` (and keep `gameId` optional for backward compatibility)
   - Update `createShareableGame()` to use `hashedId` from API response
   - Update `loadGameFromId()` to accept `hashedId` parameter
   - Update any logic that uses `gameId` to prefer `hashedId`

3. **Update App.tsx for Path-Based Routing**:
   ```typescript
   // In App.tsx, handle /{hashedId} paths
   useEffect(() => {
     const pathname = window.location.pathname;
     // Remove leading slash
     const hashedId = pathname.substring(1);
     
     // Check if it's a valid hashed ID (16 characters, URL-safe)
     if (hashedId && hashedId.length === 16 && /^[A-Za-z0-9_-]+$/.test(hashedId)) {
       // Load game from hashed ID
       loadGameFromHashedId(hashedId);
     }
   }, []);
   ```
   - Support both old query param format (`?game=uuid`) and new path format (`/{hashedId}`)
   - Try path-based first, then fall back to query param for backward compatibility

4. **Update StartScreen.tsx**:
   - Update shareable link display to use path-based format: `{window.location.origin}/{hashedId}`
   - Update copy-to-clipboard to use new format
   - Show hashed ID in UI (e.g., "Shareable Game: XHZ$G$z4y4zz46")

**Acceptance Criteria**:
- [x] `gamesClient.ts` uses `hashedId` instead of `gameId`
- [x] `useGameState.ts` stores and uses `hashedId`
- [x] `App.tsx` handles `/{hashedId}` paths correctly
- [x] `App.tsx` supports backward compatibility (query param format)
- [x] Shareable links use path-based format: `/{hashedId}`
- [x] Shareable links are displayed correctly in UI
- [x] Copy-to-clipboard copies correct URL format
- [x] Visiting `/{hashedId}` loads the correct game
- [x] Error handling for invalid hashed IDs (404, show error message)
- [x] Unit test: Test path-based routing
- [x] Unit test: Test backward compatibility (query param)
- [x] Unit test: Test shareable link generation
- [x] All existing tests still pass

**Test Requirements**:
- Test path-based routing (`/{hashedId}`)
- Test backward compatibility (query param `?game=uuid`)
- Test shareable link generation
- Test game loading from hashed ID
- Test error handling (invalid hashed ID, 404)
- Test URL parsing and validation

**Dependencies**: BE-FEAT-2 (backend must implement hashed ID system first)

**Documentation Requirements**:
- Add JSDoc comments explaining hashed ID usage
- Document path-based routing approach
- Document backward compatibility strategy

**Skills Documentation**:
- Document path-based routing patterns
- Document URL parsing and validation
- Document backward compatibility strategies in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task FE-FEAT-4: Add "View on Wikipedia" Button

**Priority**: MEDIUM  
**Feature**: FEAT-4 from ENGINEERING_PLAN.md  
**Estimated Time**: 2-3 hours

**Description**: Add button to article viewer that opens Wikipedia article in new tab with confirmation modal.

**Current State**: No button to view article on Wikipedia.

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.tsx`
- `app/src/features/article-viewer/ArticleViewer.css` (button styling)

**Files to Create** (if needed):
- Confirmation modal component (or reuse existing modal)

**Implementation Steps**:

1. **Add Button to ArticleViewer**:
   ```typescript
   // In ArticleViewer.tsx
   const [showConfirmModal, setShowConfirmModal] = useState(false);
   
   const handleViewOnWikipedia = () => {
     setShowConfirmModal(true);
   };
   
   const confirmViewOnWikipedia = () => {
     const articleTitle = currentArticle?.title || '';
     const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle.replace(/ /g, '_'))}`;
     window.open(wikipediaUrl, '_blank', 'noopener,noreferrer');
     setShowConfirmModal(false);
   };
   ```

2. **Add Button to UI**:
   - Position button in top-right of article viewer
   - Style button to match existing design
   - Add appropriate ARIA labels

3. **Create Confirmation Modal**:
   - Show modal: "Are you sure? Leaving may clear your game progress."
   - "Cancel" button: Closes modal
   - "Continue" button: Opens Wikipedia and closes modal
   - Reuse existing modal component if available

4. **URL Encoding**:
   - Replace spaces with underscores
   - Use `encodeURIComponent` for special characters
   - Handle edge cases (empty title, special characters)

**Acceptance Criteria**:
- [x] "View on Wikipedia" button is visible in top-right of article viewer
- [x] Button is styled appropriately (matches existing design)
- [x] Clicking button shows confirmation modal
- [x] Modal message: "Are you sure? Leaving may clear your game progress."
- [x] "Cancel" button closes modal without opening Wikipedia
- [x] "Continue" button opens Wikipedia in new tab and closes modal
- [x] Wikipedia URL is correctly formatted (spaces → underscores, encoded)
- [x] Button works in both light and dark modes
- [x] Button is keyboard accessible (Enter/Space)
- [x] Button has proper ARIA labels
- [x] Unit test: Test button click shows modal
- [x] Unit test: Test "Continue" opens Wikipedia
- [x] Unit test: Test "Cancel" closes modal
- [x] Unit test: Test URL encoding
- [x] All existing tests still pass

**Test Requirements**:
- Test button visibility and positioning
- Test confirmation modal appears
- Test "Continue" opens Wikipedia in new tab
- Test "Cancel" closes modal
- Test URL encoding (spaces → underscores, special characters)
- Test keyboard accessibility
- Test ARIA labels

**Dependencies**: None

**Documentation Requirements**:
- Add JSDoc comment explaining button functionality
- Document URL encoding approach

**Skills Documentation**:
- Document external link handling patterns
- Document confirmation modal patterns in `docs/IMPLEMENTATION_SKILLS.md`

---

## Phase 3: Medium Priority Features

### Task FE-FEAT-1: Add Leaderboard Pagination

**Priority**: MEDIUM  
**Feature**: FEAT-1 from ENGINEERING_PLAN.md  
**Estimated Time**: 2-3 hours

**Description**: Add pagination controls to leaderboard to show more games per page.

**Current State**: Shows 5 entries, no pagination.

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/features/leaderboard/StartScreenLeaderboard.css` (pagination styles)

**Implementation Steps**:

1. **Update State**:
   ```typescript
   const [page, setPage] = useState(1);
   const [limit] = useState(20);  // Increase from 5
   ```

2. **Calculate Total Pages**:
   ```typescript
   const totalPages = Math.ceil((totalEntries || 0) / limit);
   ```

3. **Add Pagination UI**:
   ```typescript
   <div className="bp-pagination">
     <button 
       disabled={page === 1} 
       onClick={() => setPage(p => p - 1)}
       aria-label="Previous page"
     >
       Previous
     </button>
     <span>Page {page} of {totalPages}</span>
     <button 
       disabled={page >= totalPages} 
       onClick={() => setPage(p => p + 1)}
       aria-label="Next page"
     >
       Next
     </button>
   </div>
   ```

4. **Update API Call**:
   - Pass `page` and `limit` to API
   - Update API call when page changes

5. **Style Pagination**:
   - Add CSS for pagination controls
   - Style disabled buttons
   - Ensure pagination is visible and accessible

**Acceptance Criteria**:
- [x] Default page size is 20 (increased from 5)
- [x] Pagination controls are visible (Previous/Next buttons, page indicator)
- [x] "Previous" button is disabled on first page
- [x] "Next" button is disabled on last page
- [x] Page indicator shows "Page X of Y"
- [x] Clicking "Previous" decreases page number
- [x] Clicking "Next" increases page number
- [x] API call includes correct `page` and `limit` parameters
- [x] Leaderboard updates when page changes
- [x] Pagination works with all filters (time period, game type, sort)
- [x] Unit test: Test pagination controls
- [x] Unit test: Test page navigation
- [x] Unit test: Test edge cases (first page, last page, empty results)
- [x] All existing tests still pass

**Test Requirements**:
- Test pagination controls work correctly
- Test page navigation (Previous/Next)
- Test edge cases (first page, last page, empty results)
- Test pagination with filters
- Test API integration with page/limit params

**Dependencies**: None (but API should support larger limits)

**Documentation Requirements**:
- Add JSDoc comment explaining pagination behavior

**Skills Documentation**:
- Document pagination UI patterns in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task FE-FEAT-3: Integrate Event Logging

**Priority**: MEDIUM  
**Feature**: FEAT-3 from ENGINEERING_PLAN.md  
**Estimated Time**: 2-3 hours

**Description**: Add logging calls to frontend to log game events to backend logging API.

**Current State**: No event logging.

**Files to Create**:
- `app/src/shared/api/loggingClient.ts` (new file)

**Files to Modify**:
- `app/src/features/game/useGameState.ts` (add logging calls)
- `app/src/features/game/StartScreen.tsx` (log game_started)
- `app/src/features/game/WinModal.tsx` (log game_finished)

**Implementation Steps**:

1. **Create Logging Client**:
   ```typescript
   // app/src/shared/api/loggingClient.ts
   export async function logEvent(
     event: 'game_started' | 'game_generated' | 'game_finished',
     metadata?: Record<string, unknown>
   ): Promise<void> {
     try {
       await fetch('/api/logging', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           event,
           timestamp: new Date().toISOString(),
           ...metadata
         })
       });
     } catch (error) {
       // Logging failures should not break the game
       console.error('Failed to log event:', error);
     }
   }
   ```

2. **Add Logging Calls**:
   - In `StartScreen.tsx`, when "Start Game" is clicked: `logEvent('game_started')`
   - In `useGameState.ts`, when shareable game is created: `logEvent('game_generated', { hashedId })`
   - In `WinModal.tsx`, when game is won: `logEvent('game_finished', { score, time, clicks, hashedId })`

3. **Error Handling**:
   - Logging failures should not block user interactions
   - Use try-catch to handle errors gracefully
   - Log errors to console for debugging

**Acceptance Criteria**:
- [x] `loggingClient.ts` exists and exports `logEvent` function
- [x] `logEvent('game_started')` is called when game starts
- [x] `logEvent('game_generated')` is called when shareable game is created (with hashedId)
- [x] `logEvent('game_finished')` is called when game is won (with score, time, clicks, hashedId)
- [x] Logging failures don't block user interactions
- [x] Events are sent to `/api/logging` endpoint
- [x] Event data includes: event, timestamp, and relevant metadata
- [x] Unit test: Test logging calls are made correctly
- [x] Unit test: Test error handling (logging failures don't break game)
- [x] All existing tests still pass

**Test Requirements**:
- Test logging calls are made at correct times
- Test event data is correct (event type, timestamp, metadata)
- Test error handling (simulate network failure)
- Test logging doesn't block user interactions
- Mock fetch to verify API calls

**Dependencies**: BE-FEAT-3 (backend must implement logging API first)

**Documentation Requirements**:
- Add JSDoc comment explaining logging client
- Document event types and their metadata

**Skills Documentation**:
- Document non-blocking logging patterns
- Document event tracking strategies in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task FE-UX-1: Update Light Mode Styling

**Priority**: MEDIUM  
**Feature**: UX-1 from ENGINEERING_PLAN.md  
**Estimated Time**: 2-3 hours

**Description**: Update light mode CSS to improve contrast and make article viewer lighter than site background.

**Current State**: Light mode needs better contrast.

**Files to Modify**:
- `app/src/shared/theme/theme.css` (or theme files)
- `app/src/features/article-viewer/ArticleViewer.css`
- `app/src/app/AppLayout.css`

**Implementation Steps**:

1. **Update Theme CSS Variables**:
   ```css
   /* app/src/shared/theme/theme.css */
   :root[data-theme="light"] {
     --article-bg: #ffffff;
     --site-bg: #f5f5f5;
     --article-text: #000000;
     --article-border: #e0e0e0;
   }
   
   :root[data-theme="dark"] {
     --article-bg: #1a1a1a;
     --site-bg: #0d0d0d;
     --article-text: #ffffff;
     --article-border: #333333;
   }
   ```

2. **Update Article Viewer CSS**:
   - Ensure article viewer uses `--article-bg` for background
   - Ensure article viewer text uses `--article-text`
   - Add border using `--article-border` for visual distinction

3. **Update Site Background**:
   - Ensure site background uses `--site-bg`
   - Article viewer should be visually distinct from site background

4. **Verify Contrast**:
   - Check contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
   - Use browser dev tools or online contrast checker

**Acceptance Criteria**:
- [x] Light mode: Article has light background (#ffffff or similar)
- [x] Light mode: Site has darker background (#f5f5f5 or similar)
- [x] Dark mode: Article has dark background (#1a1a1a or similar)
- [x] Dark mode: Site has darker background (#0d0d0d or similar)
- [x] Clear visual distinction between article and site background in both themes
- [x] All text meets WCAG AA contrast ratios
- [x] All UI components work correctly in both themes
- [x] Visual verification: Article viewer stands out from site background
- [x] Unit test: CSS variables are defined correctly (can verify with grep)
- [x] All existing tests still pass

**Test Requirements**:
- Visual verification in both themes
- Test contrast ratios with browser dev tools (WCAG AA)
- Test all UI components in both themes
- Verify CSS variables are used (grep for hardcoded colors)

**Dependencies**: None

**Documentation Requirements**:
- Update `docs/THEME_COLOR_PALETTE.md` with new color values
- Document contrast ratios

**Skills Documentation**:
- Document CSS variable organization patterns
- Document contrast ratio verification techniques in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task FE-UX-2: Fix Mobile Timer/Clicks Visibility

**Priority**: MEDIUM  
**Feature**: UX-2 from ENGINEERING_PLAN.md  
**Estimated Time**: 1-2 hours

**Description**: Ensure timer and clicks remain visible when Bingo board overlay is open on mobile.

**Current State**: Timer/clicks may be hidden by overlay.

**Files to Modify**:
- `app/src/features/game/GameScreen.tsx`
- `app/src/features/game/GameScreen.css`

**Implementation Steps**:

1. **Check Z-Index**:
   - Ensure score bar (timer + clicks) has higher z-index than overlay
   - Update CSS to ensure score bar is always visible

2. **Update CSS**:
   ```css
   /* GameScreen.css */
   .bp-score-bar {
     z-index: 1000; /* Higher than overlay */
     position: relative; /* or fixed/sticky as needed */
   }
   
   .bp-board-overlay {
     z-index: 900; /* Lower than score bar */
   }
   ```

3. **Test on Mobile**:
   - Verify timer/clicks are visible when overlay is open
   - Verify score bar doesn't interfere with overlay interactions

**Acceptance Criteria**:
- [x] Score bar (timer + clicks) has higher z-index than overlay
- [x] Timer and clicks are visible when Bingo board overlay is open
- [x] Score bar doesn't interfere with overlay interactions
- [x] Works correctly on mobile devices
- [x] Works correctly on desktop
- [x] Visual verification: Timer/clicks always visible
- [x] All existing tests still pass

**Test Requirements**:
- Test on mobile devices (or mobile viewport in dev tools)
- Test overlay interactions (can still interact with overlay)
- Test score bar visibility in all states
- Visual verification

**Dependencies**: None

**Documentation Requirements**:
- Add comment explaining z-index strategy

**Skills Documentation**:
- Document z-index management patterns in `docs/IMPLEMENTATION_SKILLS.md`

---

## Phase 4: Optional Features

### Task FE-OPT-1: Implement Game Persistence in localStorage

**Priority**: LOW (Optional)  
**Feature**: OPT-1 from ENGINEERING_PLAN.md  
**Estimated Time**: 4-6 hours (if implemented)

**Description**: Save game state to localStorage and restore on page load.

**Complexity**: High (requires careful state management)

**Files to Modify**:
- `app/src/features/game/useGameState.ts`
- `app/src/features/game/useGameTimer.ts`
- Create `app/src/shared/utils/localStorage.ts`

**Implementation Steps**:

1. **Create localStorage Utility**:
   ```typescript
   // app/src/shared/utils/localStorage.ts
   const GAME_STATE_KEY = 'bingopedia_game_state';
   const GAME_START_TIME_KEY = 'bingopedia_game_start_time';
   
   export function saveGameState(state: GameState): void {
     try {
       localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
       localStorage.setItem(GAME_START_TIME_KEY, Date.now().toString());
     } catch (error) {
       console.error('Failed to save game state:', error);
     }
   }
   
   export function loadGameState(): GameState | null {
     try {
       const stateStr = localStorage.getItem(GAME_STATE_KEY);
       const startTimeStr = localStorage.getItem(GAME_START_TIME_KEY);
       if (!stateStr || !startTimeStr) return null;
       
       const state = JSON.parse(stateStr);
       const startTime = parseInt(startTimeStr, 10);
       
       // Calculate elapsed time from start timestamp
       const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
       
       return { ...state, elapsedSeconds };
     } catch (error) {
       console.error('Failed to load game state:', error);
       return null;
     }
   }
   
   export function clearGameState(): void {
     localStorage.removeItem(GAME_STATE_KEY);
     localStorage.removeItem(GAME_START_TIME_KEY);
   }
   ```

2. **Update useGameState.ts**:
   - Save state to localStorage on each action (use `useEffect`)
   - Load state from localStorage on mount
   - Clear localStorage on "New Game" click

3. **Update useGameTimer.ts**:
   - Calculate elapsed time from start timestamp when restoring
   - Handle timer calculation correctly (real-time vs paused)

4. **Handle Edge Cases**:
   - Corrupted data (invalid JSON)
   - Version mismatches (game state structure changes)
   - localStorage quota exceeded

**Acceptance Criteria**:
- [ ] Game state is saved to localStorage on each action
- [ ] Game state is restored on page load
- [ ] Timer continues correctly when user returns (calculates elapsed time)
- [ ] Game only resets on "New Game" click
- [ ] Handles edge cases gracefully (corrupted data, version mismatches)
- [ ] Unit test: Test state persistence across page refreshes
- [ ] Unit test: Test timer calculation
- [ ] Unit test: Test edge cases (corrupted data, version changes)
- [ ] All existing tests still pass

**Test Requirements**:
- Test state persistence across page refreshes
- Test timer calculation (elapsed time from start timestamp)
- Test edge cases (corrupted data, version changes, quota exceeded)
- Test "New Game" clears localStorage

**Dependencies**: None (optional feature)

**Documentation Requirements**:
- Add JSDoc comments explaining localStorage usage
- Document edge case handling

**Skills Documentation**:
- Document localStorage persistence patterns
- Document state restoration strategies in `docs/IMPLEMENTATION_SKILLS.md`

---

## Testing Requirements Summary

All frontend tasks must include:
- [ ] Unit tests for new functionality
- [ ] Component tests for UI changes
- [ ] All existing tests still pass
- [ ] Error handling is tested
- [ ] Edge cases are tested
- [ ] Accessibility is tested (keyboard navigation, ARIA labels)

---

## Code Quality Standards

- **TypeScript**: Strict mode, no `any` types
- **React**: Use hooks correctly, avoid unnecessary re-renders
- **Accessibility**: Keyboard navigation, ARIA labels, WCAG AA contrast
- **Error Handling**: Handle errors gracefully, show user-friendly messages
- **Documentation**: JSDoc comments for public functions
- **Testing**: Unit tests for all new code

---

## Skills Documentation

After completing each task, update `docs/IMPLEMENTATION_SKILLS.md` with:
- New techniques learned
- Patterns discovered
- Best practices identified
- Any architectural decisions made

---

## Verification Checklist

Before marking any task complete:
- [ ] All acceptance criteria met
- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New tests written and passing
- [ ] No linter errors
- [ ] Code follows project style guidelines
- [ ] Accessibility requirements met
- [ ] Documentation updated
- [ ] Skills documented (if applicable)

---

## Notes

- **Backward Compatibility**: Support both old and new formats during transition
- **Error Handling**: Always handle errors gracefully
- **Accessibility**: Ensure all interactive elements are keyboard accessible
- **Performance**: Avoid unnecessary re-renders, optimize API calls
- **Testing**: Write tests for all new functionality

---

**End of Frontend Tasks**

