# Bingopedia Change List

**Document Purpose**: This document lists all necessary changes for bugfixes and features identified during post-migration review.

**Status**: Pending Implementation  
**Last Updated**: Post-Migration Review  
**Related Documents**: `PRODUCT_PRD.md`

---

## Overview

This document categorizes changes into:
1. **Critical Bug Fixes** - Issues that must be fixed immediately
2. **Feature Enhancements** - New functionality or improvements
3. **Database Changes** - Schema updates and migrations
4. **UI/UX Improvements** - Visual and interaction updates
5. **Optional Features** - Can be deferred if complex

---

## 1. Critical Bug Fixes

### BUG-1: Leaderboard Time Format
**Priority**: High  
**Issue**: Time column displays raw seconds instead of HH:MM:SS format.

**Required Changes**:
- Update leaderboard display to format time as HH:MM:SS
- Ensure all time displays throughout the app use this format
- Backend can continue storing seconds, frontend handles formatting

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/features/leaderboard/GameDetailsModal.tsx`
- Any other components displaying time values

**Acceptance Criteria**:
- [ ] Time column shows "01:23:45" format, not "5025" seconds
- [ ] All time displays use consistent HH:MM:SS format

---

### BUG-2: Leaderboard Default Sort
**Priority**: High  
**Issue**: Leaderboard doesn't default to score ascending (smallest to largest).

**Required Changes**:
- Change default sort to `sortBy: 'score'`, `sortOrder: 'asc'`
- Update initial state in leaderboard components
- Ensure API defaults match

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/shared/api/leaderboardClient.ts`
- `api/leaderboard.ts` (backend default)
- `server/index.ts` (if using Express server)

**Acceptance Criteria**:
- [ ] Leaderboard loads with score sorted ascending (best scores first)
- [ ] Default sort is score ascending on page load

---

### BUG-3: Leaderboard Time Period Filter Not Working
**Priority**: High  
**Issue**: Time period filter always shows all games regardless of selected period.

**Required Changes**:
- Fix date range filtering in API
- Verify MongoDB query correctly filters by `createdAt` date range
- Test all time period options (Today, 7 Days, 30 Days, Year, All Time)

**Files to Modify**:
- `api/leaderboard.ts` - Fix date filter query logic
- `server/index.ts` - Fix date filter query logic (if using Express)
- Verify `getDateRange()` function in frontend correctly calculates dates

**Root Cause Analysis Needed**:
- Check if date filters are being applied to MongoDB query
- Verify date format conversion (ISO strings, Date objects)
- Ensure timezone handling is correct

**Acceptance Criteria**:
- [ ] "Best Today" shows only games from last 24 hours
- [ ] "Best Past 7 Days" shows only games from last week
- [ ] "Best Past 30 Days" shows only games from last month
- [ ] "Best Past Year" shows only games from last year
- [ ] "All Time" shows all games

---

### BUG-4: Game Type Filter Not Working
**Priority**: High  
**Issue**: Game type filter doesn't work because games aren't distinguished in database.

**Required Changes**:
- Add `gameType` field to all existing leaderboard entries (default to "random")
- Update terminology: "fresh" → "random", "linked" → "repeat"
- Ensure new game submissions include `gameType` field
- Update API to filter by `gameType` correctly

**Database Migration Required**:
```javascript
// Migration script needed
db.leaderboard.updateMany(
  { gameType: { $exists: false } },
  { $set: { gameType: "random" } }
)
// Also update any "fresh" to "random", "linked" to "repeat"
```

**Files to Modify**:
- Database: Add `gameType` field to all entries
- `api/leaderboard.ts` - Update gameType filter logic
- `server/index.ts` - Update gameType filter logic
- `app/src/features/game/useGameState.ts` - Set gameType on submission
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` - Update terminology
- All references to "fresh"/"linked" → "random"/"repeat"

**Acceptance Criteria**:
- [ ] All existing leaderboard entries have `gameType` field
- [ ] New game submissions include `gameType` ("random" or "repeat")
- [ ] Game type filter works correctly (Random/Repeat/All)
- [ ] Terminology updated throughout codebase

---

## 2. Feature Enhancements

### FEAT-1: Leaderboard Pagination
**Priority**: Medium  
**Issue**: Leaderboard needs to show more games and support pagination.

**Required Changes**:
- Increase default page size (from 5 to 20 or configurable)
- Add pagination controls (Previous/Next, or page numbers)
- Update API to support larger limits
- Consider "Load More" button as alternative

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/shared/api/leaderboardClient.ts`
- `api/leaderboard.ts` - Support larger limits
- `server/index.ts` - Support larger limits

**Acceptance Criteria**:
- [ ] Leaderboard shows more games per page (20+)
- [ ] Pagination controls work correctly
- [ ] Can navigate through multiple pages
- [ ] Performance remains acceptable with larger result sets

---

### FEAT-2: Generate Shareable Game System
**Priority**: High  
**Issue**: Shareable game feature doesn't work. Need complete implementation.

**Required Changes**:
- Implement game storage in `generated-games` collection
- Generate 16-character hashed ID (URL-safe)
- Store game state: `hashedId`, `gridCells[]`, `startingArticle`, `gameType`, `createdAt`
- Create API endpoints: POST `/api/games` (create), GET `/api/games/:hashedId` (retrieve)
- Update URL routing to handle `/{hashedId}` format
- Update UI to display shareable link with copy functionality
- Ensure games from shareable links are marked as "repeat" type

**API Endpoints Needed**:
- `POST /api/games` - Create new shareable game
  - Request: `{ gridCells: string[], startingArticle: string, gameType: "random" }`
  - Response: `{ hashedId: string, ...gameState }`
- `GET /api/games/:hashedId` - Retrieve game by hashed ID
  - Response: `{ hashedId: string, gridCells: string[], startingArticle: string, ... }`
  - 404 if not found

**Files to Modify**:
- `api/games.ts` (new file) - API endpoints for game storage
- `server/index.ts` - Add game routes (if using Express)
- `app/src/shared/api/gamesClient.ts` - Update to use hashedId
- `app/src/features/game/useGameState.ts` - Update `createShareableGame()` to use hashedId
- `app/src/features/game/StartScreen.tsx` - Update UI for link display
- URL routing configuration - Handle `/{hashedId}` paths

**Hashed ID Generation**:
- 16 characters, URL-safe
- Can use crypto.randomBytes or similar
- Store in `hashedId` field in database
- Use in URL: `bingopedia.com/{hashedId}`

**Acceptance Criteria**:
- [ ] "Generate Shareable Game" button creates game and stores in database
- [ ] Shareable link is displayed with copy-to-clipboard functionality
- [ ] Visiting `/{hashedId}` loads the correct game
- [ ] Games from shareable links are marked as "repeat" type
- [ ] Error handling for invalid/missing game IDs

---

### FEAT-3: Event Logging System
**Priority**: Medium  
**Issue**: Need to log game events to MongoDB time series collection.

**Required Changes**:
- Create logging utility/function
- Log events to MongoDB time series collection:
  - "game_started" - when user clicks "Start Game"
  - "game_generated" - when shareable game is created
  - "game_finished" - when game is won
- Include relevant metadata (timestamp, gameId if available, etc.)

**Files to Create/Modify**:
- `api/logging.ts` (new file) - Logging API endpoint
- `app/src/shared/api/loggingClient.ts` (new file) - Frontend logging client
- `app/src/features/game/useGameState.ts` - Add logging calls
- `app/src/features/game/StartScreen.tsx` - Log game started
- `app/src/features/game/WinModal.tsx` - Log game finished

**Log Event Structure**:
```typescript
{
  event: "game_started" | "game_generated" | "game_finished",
  timestamp: Date,
  gameId?: string,
  hashedId?: string,
  // other relevant metadata
}
```

**Acceptance Criteria**:
- [ ] Events are logged to time series collection
- [ ] "game_started" logged when game begins
- [ ] "game_generated" logged when shareable game created
- [ ] "game_finished" logged when game is won
- [ ] Logging doesn't block user interactions

---

### FEAT-4: Article Viewer "View on Wikipedia" Button
**Priority**: Medium  
**Issue**: Need to add button to view article on Wikipedia with confirmation.

**Required Changes**:
- Add "View on Wikipedia" button to top right of article viewer
- Button opens Wikipedia article in new tab/window
- Show confirmation modal before leaving: "Are you sure? Leaving may clear your game progress."
- Modal has "Cancel" and "Continue" options

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.tsx`
- Create confirmation modal component (or reuse existing)
- Update CSS for button positioning

**Wikipedia URL Format**:
- `https://en.wikipedia.org/wiki/{articleTitle}` (replace spaces with underscores)

**Acceptance Criteria**:
- [ ] "View on Wikipedia" button visible in top right of article viewer
- [ ] Clicking button shows confirmation modal
- [ ] "Continue" opens Wikipedia in new tab
- [ ] "Cancel" closes modal and stays on page
- [ ] Button works in both light and dark modes

---

## 3. UI/UX Improvements

### UX-1: Light Mode Styling Update
**Priority**: Medium  
**Issue**: Light mode should be lighter, like Wikipedia. Article should be lighter than site background.

**Required Changes**:
- Update light mode CSS:
  - Article viewer: Light background (like Wikipedia)
  - Site background: Darker than article viewer for contrast
- Update dark mode CSS:
  - Article viewer: Dark background
  - Site background: Darker still for contrast
- Ensure article viewer visually stands out from site background in both themes

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.css`
- `app/src/app/AppLayout.css`
- Theme CSS variables/files
- All component styles that affect article viewer

**Acceptance Criteria**:
- [ ] Light mode: Article has light background, site has darker background
- [ ] Dark mode: Article has dark background, site has darker background
- [ ] Clear visual distinction between article and site background
- [ ] Maintains good contrast and readability

---

### UX-2: Mobile Timer/Clicks Visibility
**Priority**: Medium  
**Issue**: Timer and clicks should remain visible when viewing Bingo board/History panel on mobile.

**Required Changes**:
- Ensure score bar (timer + clicks) remains visible when Bingo board overlay is open
- Score bar should not be hidden by overlay
- May need to adjust z-index or positioning

**Files to Modify**:
- `app/src/features/game/GameScreen.tsx`
- `app/src/features/game/GameScreen.css`
- Mobile-specific CSS

**Acceptance Criteria**:
- [ ] Timer and clicks visible when Bingo board is open on mobile
- [ ] Score bar not hidden by overlay
- [ ] User can always see their progress

---

## 4. Database Changes

### DB-1: Add gameType Field to Leaderboard
**Priority**: High  
**Issue**: Leaderboard entries need `gameType` field to distinguish random vs repeat games.

**Migration Script Needed**:
```javascript
// MongoDB migration
db.leaderboard.updateMany(
  { gameType: { $exists: false } },
  { $set: { gameType: "random" } }
)

// Update terminology if needed
db.leaderboard.updateMany(
  { gameType: "fresh" },
  { $set: { gameType: "random" } }
)

db.leaderboard.updateMany(
  { gameType: "linked" },
  { $set: { gameType: "repeat" } }
)

// Add index
db.leaderboard.createIndex({ gameType: 1 })
```

**Files to Create**:
- `scripts/migrateGameType.js` (migration script)

**Acceptance Criteria**:
- [ ] All leaderboard entries have `gameType` field
- [ ] Existing entries default to "random"
- [ ] Index created on `gameType` field
- [ ] Terminology updated (random/repeat)

---

### DB-2: Use generated-games Collection
**Priority**: High  
**Issue**: Need to store shareable games in `generated-games` collection.

**Schema**:
```typescript
{
  _id: ObjectId,
  hashedId: string, // 16 characters, unique, indexed
  gridCells: string[], // 25 article titles
  startingArticle: string,
  gameType: "random" | "repeat",
  createdAt: Date,
  createdBy?: string // optional username
}
```

**Indices Needed**:
- Unique index on `hashedId`
- Index on `createdAt` (for cleanup/archival)

**Files to Modify**:
- `api/mongoClient.ts` - Add function to get generated-games collection
- `api/games.ts` - Use generated-games collection
- `server/index.ts` - Use generated-games collection (if using Express)

**Acceptance Criteria**:
- [ ] Games stored in `generated-games` collection
- [ ] Unique index on `hashedId`
- [ ] Can retrieve games by `hashedId`
- [ ] Games include all required fields

---

## 5. Optional Features (Can Be Deferred)

### OPT-1: Game Persistence in localStorage
**Priority**: Low (Optional)  
**Issue**: Games should persist if user refreshes or leaves and comes back.

**Required Changes**:
- Save game state to localStorage on each action
- Restore game state on page load if available
- Timer continues in real-time (calculate elapsed from start timestamp)
- Only clear localStorage when user clicks "New Game"
- Handle edge cases (corrupted data, version mismatches)

**Complexity Notes**:
- Requires careful state management
- Need to handle timer calculation (real-time vs paused)
- Must handle data migration if game state structure changes
- Can be deferred if implementation is complex

**Files to Modify**:
- `app/src/features/game/useGameState.ts` - Add localStorage save/load
- `app/src/features/game/useGameTimer.ts` - Handle real-time timer calculation
- Create localStorage utility functions

**Acceptance Criteria**:
- [ ] Game state saved to localStorage on each action
- [ ] Game state restored on page load
- [ ] Timer continues correctly when user returns
- [ ] Game only resets on "New Game" click
- [ ] Handles edge cases gracefully

---

## Implementation Priority

### Phase 1: Critical Bug Fixes (Do First)
1. BUG-1: Leaderboard Time Format
2. BUG-2: Leaderboard Default Sort
3. BUG-3: Leaderboard Time Period Filter
4. BUG-4: Game Type Filter (includes DB migration)

### Phase 2: High Priority Features
1. FEAT-2: Generate Shareable Game System
2. FEAT-4: Article Viewer "View on Wikipedia" Button

### Phase 3: Medium Priority
1. FEAT-1: Leaderboard Pagination
2. FEAT-3: Event Logging System
3. UX-1: Light Mode Styling Update
4. UX-2: Mobile Timer/Clicks Visibility

### Phase 4: Optional (Can Defer)
1. OPT-1: Game Persistence in localStorage

---

## Testing Requirements

For each change, verify:
- [ ] Feature works as expected
- [ ] No regressions in existing functionality
- [ ] Works in both light and dark modes
- [ ] Works on mobile and desktop
- [ ] Error handling is appropriate
- [ ] Performance is acceptable

---

## Notes

- **Terminology Update**: Throughout codebase, replace:
  - "fresh" → "random"
  - "linked" → "repeat"
  - "Fresh Games" → "Random Games"
  - "Linked Games" → "Repeat Games"

- **Database Collections**:
  - `bingopedia.leaderboard` - Existing, needs `gameType` field
  - `generated-games` - Already created, needs implementation
  - Time series collection - Already created, needs logging implementation

- **URL Format**: Shareable games use `/{hashedId}` format (e.g., `bingopedia.com/XHZ$G$z4y4zz46`)

- **Game Type Logic**:
  - "random": Games started via "Start Game" button
  - "repeat": Games from shareable links or replayed from leaderboard

---

## Dependencies

- FEAT-2 (Shareable Games) depends on DB-2 (generated-games collection)
- BUG-4 (Game Type Filter) depends on DB-1 (gameType migration)
- FEAT-3 (Logging) is independent but should be implemented early for tracking

---

## Open Questions

1. **Hashed ID Generation**: What algorithm/library should be used? (crypto.randomBytes, nanoid, etc.)
2. **Pagination UI**: Prefer page numbers or "Load More" button?
3. **Game Persistence**: Should this be Phase 4 or deferred further?
4. **Logging Metadata**: What additional fields should be logged beyond event type and timestamp?

