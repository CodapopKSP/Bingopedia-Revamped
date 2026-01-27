# QA Fixes Plan

**Document Purpose**: Engineering plan to fix critical issues found during QA testing after task completion.

**Status**: Ready for Implementation  
**Last Updated**: Post-QA Testing  
**Related Documents**: `BACKEND_TASKS.md`, `FRONTEND_TASKS.md`, `TASK_ASSIGNMENT_GUIDE.md`

---

## Overview

This document outlines the fixes needed for 4 critical issues discovered during QA testing:

1. **BE-FIX-1**: Leaderboard games missing `gameType` field (Database Migration)
2. **BE-FIX-2**: Generate Shareable Game returns 404 error
3. **FE-FIX-1**: Mobile UI layout issues (width, timer/clicks visibility)
4. **FE-FIX-2**: Time Period selector not working in leaderboard

---

## Issue 1: Leaderboard Games Missing gameType Field

**Priority**: HIGH  
**Estimated Time**: 30 minutes  
**Type**: Backend - Database Migration

### Problem
Games in the leaderboard don't have the `gameType` field applied. The migration script exists but either wasn't run or needs to be updated to properly identify random games.

### Root Cause
- Migration script exists at `scripts/migrateLeaderboardGameType.js` but may not have been executed
- Script sets all entries to 'random' by default, which is correct for existing games
- Need to ensure script uses environment variables correctly

### Solution

**Task BE-FIX-1.1: Run/Update Migration Script**

1. **Verify Environment Variables**:
   - Ensure `.env.local` or Vercel environment variables have:
     - `MONGODB_USERNAME`
     - `MONGODB_PASSWORD`
     - `MONGODB_CLUSTER`

2. **Run Migration Script**:
   ```bash
   node scripts/migrateLeaderboardGameType.js
   ```

3. **Verify Results**:
   - Check MongoDB to confirm all entries have `gameType: 'random'`
   - Verify no entries have `gameType: null` or missing field

**Files to Modify**:
- None (script already exists, just needs to be run)

**Files to Verify**:
- `scripts/migrateLeaderboardGameType.js` (already correct)

**Acceptance Criteria**:
- [ ] Migration script runs successfully
- [ ] All leaderboard entries have `gameType` field
- [ ] All existing entries have `gameType: 'random'` (since they're pre-feature games)
- [ ] No entries have `gameType: null` or missing field
- [ ] Game type filter works correctly after migration

**Testing**:
- Run migration script
- Query MongoDB to verify all entries have gameType
- Test game type filter in leaderboard UI

---

## Issue 2: Generate Shareable Game Returns 404 Error

**Priority**: HIGH  
**Estimated Time**: 1-2 hours  
**Type**: Backend/Frontend - API Routing

### Problem
When clicking "Generate Shareable Game", the request fails with:
```
Failed to create shareable game: Error: Failed to create game (HTTP 404)
```

### Root Cause Analysis

Looking at the code:
- `gamesClient.ts` line 84-85 constructs URL incorrectly:
  ```typescript
  const apiBase = getApiBaseUrl().replace('/leaderboard', '')
  const url = new URL(`${apiBase}/games`, window.location.origin)
  ```
- `getApiBaseUrl()` returns `/api/leaderboard`
- After replace: `/api`
- Final URL: `http://localhost:5173/api/games` (should be correct)

**Potential Issues**:
1. URL construction might be creating malformed URL
2. Vercel routing might not be set up correctly
3. API endpoint might not exist at expected path
4. CORS or routing configuration issue

### Solution

**Task BE-FIX-2.1: Fix API URL Construction**

1. **Fix `gamesClient.ts` URL Construction**:
   - Current approach of replacing `/leaderboard` is fragile
   - Should directly construct `/api/games` path
   - Use absolute path construction

2. **Verify API Endpoint Exists**:
   - Confirm `api/games.ts` exists and handles POST requests
   - Verify Vercel routing is correct

3. **Add Error Logging**:
   - Log the actual URL being called
   - Log response status and error details

**Files to Modify**:
- `app/src/shared/api/gamesClient.ts` (lines 82-126)

**Implementation**:
```typescript
// In gamesClient.ts

export async function createGame(payload: CreateGamePayload): Promise<GameStateResponse> {
  // Use absolute path - don't manipulate base URL
  const url = new URL('/api/games', window.location.origin)

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to create game'

      try {
        const errorData = await response.json()
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error?.message || errorData.message || errorMessage
        }
      } catch {
        if (response.status === 400) {
          errorMessage = 'Invalid game data. Please check your input.'
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = `Failed to create game (HTTP ${response.status})`
        }
      }

      throw new Error(errorMessage)
    }

    const json = (await response.json()) as GameStateResponse
    return json
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Unable to connect to the server.')
      throw networkError
    }
    throw error
  }
}

export async function fetchGame(identifier: string): Promise<GameStateResponse> {
  // Use absolute path - don't manipulate base URL
  const url = new URL(`/api/games/${identifier}`, window.location.origin)

  try {
    const response = await fetch(url.toString())

    if (!response.ok) {
      let errorMessage = 'Failed to fetch game'

      try {
        const errorData = await response.json()
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error?.message || errorData.message || errorMessage
        }
      } catch {
        if (response.status === 404) {
          errorMessage = 'Game not found'
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = `Failed to fetch game (HTTP ${response.status})`
        }
      }

      throw new Error(errorMessage)
    }

    const json = (await response.json()) as GameStateResponse
    return json
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error: Unable to connect to the server.')
      throw networkError
    }
    throw error
  }
}
```

**Task BE-FIX-2.2: Verify API Endpoint**

1. **Check `api/games.ts`**:
   - Verify POST handler exists and is correct
   - Verify CORS headers are set
   - Verify error handling

2. **Check Vercel Configuration**:
   - Verify `vercel.json` routes API correctly
   - Check if there are any routing conflicts

**Files to Verify**:
- `api/games.ts` (should be correct)
- `vercel.json` (if exists)

**Acceptance Criteria**:
- [ ] `createGame()` constructs correct URL (`/api/games`)
- [ ] `fetchGame()` constructs correct URL (`/api/games/:hashedId`)
- [ ] POST request to `/api/games` succeeds (201 status)
- [ ] Game is created in MongoDB `generated-games` collection
- [ ] Response includes `hashedId` field
- [ ] Shareable link is generated correctly
- [ ] No 404 errors when generating shareable game

**Testing**:
- Test "Generate Shareable Game" button
- Verify game is created in database
- Verify hashedId is returned
- Verify shareable URL is displayed
- Test loading game from shareable URL

---

## Issue 3: Mobile UI Layout Issues

**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Type**: Frontend - CSS/Layout

### Problem
1. **UI too wide**: Homepage and other screens extend beyond viewport on mobile
2. **Timer/clicks covering bingo board**: Timer and click counter were "lazily added on top" covering the bingo board. User wants them visible but integrated into layout, not literally overlaying.

### Root Cause
1. **Width Issue**:
   - Missing `max-width: 100vw` or `overflow-x: hidden` on containers
   - Padding/margins causing horizontal overflow
   - Grid/flex items not constrained

2. **Timer/Clicks Overlay Issue**:
   - Current implementation uses `position: sticky` with high z-index
   - When bingo board overlay opens, scorebar might be covering content
   - User wants timer/clicks always visible but not blocking the board

### Solution

**Task FE-FIX-1.1: Fix Mobile Width Issues**

1. **Add Viewport Constraints**:
   - Add `max-width: 100vw` to main containers
   - Add `overflow-x: hidden` to prevent horizontal scroll
   - Ensure padding doesn't cause overflow

2. **Fix Homepage Layout**:
   - Check `StartScreen.tsx` and related CSS
   - Ensure containers respect viewport width
   - Fix any flex/grid items that overflow

**Files to Modify**:
- `app/src/app/AppLayout.css`
- `app/src/features/game/StartScreen.tsx` (if has inline styles)
- `app/src/features/game/GameScreen.css`
- Any component CSS that might cause overflow

**Implementation**:

**1. Update `app/src/app/AppLayout.css`**:
```css
.bp-app-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--site-bg);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
  max-width: 100vw; /* ADD THIS */
  width: 100%; /* ADD THIS */
}

.bp-app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-height: 0;
  overflow: hidden;
  max-height: 100%;
  max-width: 100vw; /* ADD THIS */
  width: 100%; /* ADD THIS */
  box-sizing: border-box; /* ADD THIS */
}
```

**2. Update `app/src/features/game/StartScreen.css`**:
```css
.bp-start-screen {
  display: grid;
  gap: 1.5rem;
  max-width: 100%; /* ADD THIS */
  width: 100%; /* ADD THIS */
  box-sizing: border-box; /* ADD THIS */
}

.bp-start-hero {
  padding: 1.5rem;
  border-radius: 1rem;
  background: radial-gradient(circle at top left, var(--color-blue-accent-rgba), var(--bg-card));
  box-shadow: 0 24px 60px var(--bg-card);
  max-width: 100%; /* ADD THIS */
  box-sizing: border-box; /* ADD THIS */
}
```

**Task FE-FIX-1.2: Fix Timer/Clicks Visibility**

1. **Redesign Mobile Score Bar Layout**:
   - Instead of overlaying, integrate into layout properly
   - When bingo board is open, scorebar should be above the overlay but not covering board content
   - Consider moving scorebar to a fixed position at top that doesn't interfere

2. **Update Z-Index Strategy**:
   - Scorebar: `z-index: 1000` (above overlay)
   - Bingo board overlay: `z-index: 998`
   - But ensure scorebar doesn't cover board content area

3. **Alternative Approach**:
   - Keep scorebar visible at top when board is open
   - Ensure board content area accounts for scorebar height
   - Use proper spacing/padding

**Files to Modify**:
- `app/src/features/game/GameScreen.css`
- `app/src/features/game/GameScreen.tsx` (if layout changes needed)

**Implementation** (in `app/src/features/game/GameScreen.css`):

**Option 1: Keep scorebar fixed at top, ensure board content accounts for it**
```css
/* Mobile score bar - fixed at top, always visible */
.bp-game-scorebar-mobile {
  display: none; /* shown on mobile via media query */
  position: fixed; /* Changed from sticky to fixed */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* Above overlay (998) and board (999) */
  background: var(--bg-modal);
  border-bottom: 1px solid var(--border-primary);
  /* Height is approximately 3.5rem (56px) with padding */
}

/* Bingo board overlay - account for scorebar height */
@media (max-width: 959px) {
  .bp-game-left {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, var(--bg-input) 0%, var(--bg-panel) 100%);
    z-index: 999;
    padding: 1rem;
    padding-top: 4.5rem; /* Space for scorebar (3.5rem) + margin (1rem) */
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    max-width: 100vw;
  }
  
  /* When board is open, content starts below scorebar */
  .bp-game-left--open {
    transform: translateX(0);
  }
}
```

**Alternative Option 2: Make scorebar part of board header when open**
If Option 1 doesn't work well, we can make the scorebar part of the board's header area when the board is open, so it's integrated into the layout rather than overlaying.

**Acceptance Criteria**:
- [ ] Homepage fits within mobile viewport (no horizontal scroll)
- [ ] All screens respect viewport width on mobile
- [ ] Timer and clicks are always visible on mobile
- [ ] Timer/clicks don't cover bingo board content
- [ ] When bingo board is open, scorebar is visible but board is fully accessible
- [ ] Layout works on various mobile screen sizes (320px - 959px)
- [ ] No horizontal overflow on any mobile screen

**Testing**:
- Test on mobile devices (or mobile viewport in dev tools)
- Test various screen sizes (320px, 375px, 414px, 768px)
- Verify no horizontal scroll
- Verify timer/clicks visible when board is open
- Verify board content is accessible and not covered

---

## Issue 4: Time Period Selector Not Working

**Priority**: HIGH  
**Estimated Time**: 1-2 hours  
**Type**: Backend - API Filter Logic

### Problem
The "Time Period" selector in the leaderboard doesn't filter results. All time periods show the same results.

### Root Cause Analysis

Looking at the code:
- Frontend: `StartScreenLeaderboard.tsx` correctly calculates date ranges and passes them to API
- Backend: `api/leaderboard.ts` has date filter logic (lines 134-151)
- The filter is built correctly but might not be applied to the query

**Potential Issues**:
1. Date filter object might not be merged correctly with other filters
2. MongoDB query might not be using the date filter
3. Date parsing/conversion might be incorrect
4. Timezone handling might cause issues

### Solution

**Task BE-FIX-4.1: Debug and Fix Date Filter**

1. **Verify Date Filter Application**:
   - Check if `dateFilter` is being merged correctly with other filters
   - Verify MongoDB query uses the filter
   - Add logging to see what filter is being applied

2. **Fix Filter Merging**:
   - Currently `dateFilter` is built separately
   - Need to ensure it's merged with `gameType` filter correctly
   - The code shows `dateFilter.gameType = gameType` which is wrong - should be separate

**Files to Modify**:
- `api/leaderboard.ts` (lines 134-170)

**Current Issue**:
```typescript
// Build date filter
const dateFilter: Record<string, unknown> = {};
if (dateFrom || dateTo) {
  dateFilter.createdAt = {};
  // ... date logic
}

// Build gameType filter
if (gameType !== 'all') {
  dateFilter.gameType = gameType; // WRONG - mixing filters
}

// Query uses dateFilter
const users = (await collection
  .find(dateFilter) // Should merge dateFilter and gameType filter
  .sort(sortObj)
  .skip(skip)
  .limit(limit)
  .toArray());
```

**Fix** (in `api/leaderboard.ts` lines 134-171):
```typescript
// Build date filter
const dateFilter: Record<string, unknown> = {};
if (dateFrom || dateTo) {
  dateFilter.createdAt = {};
  if (dateFrom) {
    const fromDate = dateFrom instanceof Date ? dateFrom : new Date(dateFrom);
    dateFilter.createdAt.$gte = fromDate;
  }
  if (dateTo) {
    const toDate = dateTo instanceof Date ? dateTo : new Date(dateTo);
    const endOfDay = new Date(toDate.getTime() + 86400000 - 1);
    dateFilter.createdAt.$lte = endOfDay;
  }
}

// Build gameType filter separately (don't mix with dateFilter)
const gameTypeFilter: Record<string, unknown> = {};
if (gameType !== 'all') {
  gameTypeFilter.gameType = gameType;
}

// Merge filters properly
const queryFilter = { ...dateFilter, ...gameTypeFilter };

// Use merged filter for both count and find
const totalCount = await collection.countDocuments(queryFilter);
const totalPages = Math.ceil(totalCount / limit);

const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };
if (sortField === 'score') {
  sortObj.createdAt = 1;
}

const users = (await collection
  .find(queryFilter)  // Use merged filter
  .sort(sortObj)
  .skip(skip)
  .limit(limit)
  .toArray()) as LeaderboardEntry[];
```

**Task BE-FIX-4.2: Add Debug Logging**

1. **Add Logging** (temporary, remove after verification):
   ```typescript
   console.log('Date filter:', JSON.stringify(dateFilter, null, 2));
   console.log('GameType filter:', JSON.stringify(gameTypeFilter, null, 2));
   console.log('Merged filter:', JSON.stringify(queryFilter, null, 2));
   ```

2. **Verify Date Parsing**:
   - Ensure dates from frontend are parsed correctly
   - Verify timezone handling

**Files to Modify**:
- `api/leaderboard.ts` (lines 134-170)

**Acceptance Criteria**:
- [ ] "Today" filter shows only games from today
- [ ] "Past 7 Days" filter shows only games from last 7 days
- [ ] "Past 30 Days" filter shows only games from last 30 days
- [ ] "Past Year" filter shows only games from last year
- [ ] "All Time" shows all games (no date filter)
- [ ] Date filtering works with game type filter
- [ ] Date filtering works with sorting
- [ ] Date filtering works with pagination

**Testing**:
- Test each time period option
- Verify results match expected date ranges
- Test date filter combined with game type filter
- Test date filter combined with sorting
- Verify timezone handling (dates stored/queried in UTC)

---

## Implementation Order

### Phase 1: Critical Backend Fixes (Day 1)
1. **BE-FIX-1**: Run migration script (30 min)
2. **BE-FIX-2**: Fix API URL construction (1-2 hours)
3. **BE-FIX-4**: Fix time period filter (1-2 hours)

### Phase 2: Frontend Fixes (Day 1-2)
4. **FE-FIX-1**: Fix mobile UI layout (2-3 hours)

**Total Estimated Time**: 5-8 hours

---

## Testing Checklist

### Backend
- [ ] Migration script runs successfully
- [ ] All leaderboard entries have gameType field
- [ ] Generate shareable game works (no 404)
- [ ] Game is created in database with hashedId
- [ ] Time period filters work correctly
- [ ] All time period options return correct results

### Frontend
- [ ] Homepage fits mobile viewport
- [ ] No horizontal scroll on mobile
- [ ] Timer/clicks visible on mobile
- [ ] Timer/clicks don't cover bingo board
- [ ] Bingo board fully accessible when open
- [ ] Works on various mobile screen sizes

### Integration
- [ ] Generate shareable game → creates game → can load game
- [ ] Time period filter → shows correct results
- [ ] Game type filter → works with time period filter
- [ ] Mobile layout → all features work correctly

---

## Risk Assessment

### High Risk
- **BE-FIX-1 (Migration)**: Database changes - test on staging first
- **BE-FIX-4 (Date Filter)**: Complex date/timezone logic - test thoroughly

### Medium Risk
- **BE-FIX-2 (API URL)**: Routing changes - verify Vercel deployment
- **FE-FIX-1 (Mobile Layout)**: CSS changes - test on multiple devices

---

## Notes

- **Database Backup**: Create backup before running migration script
- **Staging Testing**: Test all fixes on staging before production
- **Mobile Testing**: Test on real devices, not just dev tools
- **Date Testing**: Test time period filters with various dates/timezones

---

**End of QA Fixes Plan**

