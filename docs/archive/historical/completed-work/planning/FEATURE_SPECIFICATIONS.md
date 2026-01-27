# Bingopedia Feature Specifications

**Document Purpose**: This document specifies new features and critical bug fixes for the Bingopedia project following the repository migration and rebuild. These specifications are intended for the architect and development team to review and implement.

**Status**: Pending Implementation  
**Last Updated**: Post-Migration Phase  
**Related Documents**: `PRODUCT_PRD.md`

---

## Overview

This document defines six major areas of work:

1. **Critical Bug Fix**: Timer/State Reset Issue
2. **Light Mode Theme Support**
3. **Enhanced Leaderboard Features**
4. **Game Sharing & Replay System**
5. **Leaderboard Game Type Separation**
6. **Confetti Animation on Match**

---

## 1. Critical Bug Fix: Timer/State Reset Issue

### Problem Statement

The site appears to reset every second, causing:
- Bingo grid cell summary modals to close/reset when viewing them
- Article viewer to scroll to top when tabbing through articles (simulating screen reader navigation)
- Distracting UI refreshes that interrupt user interaction

### Root Cause Analysis Needed

This likely stems from:
- Timer tick causing unnecessary state updates or re-renders
- `useEffect` dependencies causing cascading re-renders
- State management not properly memoized or debounced

### Requirements

**FR-BUG-1: Stable UI During Timer Ticks**
- Article viewer must maintain scroll position when timer increments
- Open modals (bingo cell summaries, article summaries) must remain open during timer ticks
- Tab navigation through article content must not reset scroll position
- No visual "flash" or reset when timer updates

**FR-BUG-2: Optimized State Updates**
- Timer updates should not trigger unnecessary component re-renders
- State updates should be batched or debounced where appropriate
- `useEffect` dependencies should be carefully managed to prevent cascading updates
- Consider using `useRef` for timer state that doesn't need to trigger re-renders

**FR-BUG-3: Screen Reader Compatibility**
- Keyboard navigation (tabbing) through articles must work smoothly
- Focus management must not reset during timer ticks
- Article content must remain accessible and navigable

### Acceptance Criteria

- [ ] Open a bingo grid cell summary modal, verify it stays open for at least 10 seconds without closing
- [ ] Navigate to an article, scroll down, wait 5 seconds, verify scroll position is maintained
- [ ] Tab through article links, verify focus doesn't jump to top of article
- [ ] No visual "flash" or reset when timer increments
- [ ] Performance: No noticeable lag or stutter during timer ticks

### Technical Notes

- Review `useGameTimer.ts` and `useGameState.ts` for timer implementation
- Check `ArticleViewer.tsx` for scroll position management
- Verify `ArticleSummaryModal.tsx` and `BingoGrid.tsx` modal stability
- Consider using `requestAnimationFrame` or debouncing for timer updates
- May need to separate timer display state from game state

---

## 2. Light Mode Theme Support

### Problem Statement

The application currently only supports dark mode. Users need the option to switch to light mode for better accessibility and user preference.

### Requirements

**FR-THEME-1: Theme Toggle UI**
- Theme toggle button/switch accessible from all screens:
  - Start screen (header or prominent location)
  - Game screen (header/score bar)
  - Leaderboard views
- Toggle should be keyboard accessible
- Toggle should have clear visual indicator of current theme (icon or label)

**FR-THEME-2: Theme Persistence**
- User's theme preference must persist across sessions
- Store preference in `localStorage` or similar client-side storage
- Default to system preference if available (prefers-color-scheme media query)
- Fallback to dark mode if no preference detected

**FR-THEME-3: Light Mode Styling**
- All UI components must have light mode variants:
  - Background colors: light backgrounds (white, light gray)
  - Text colors: dark text on light backgrounds
  - Bingo grid: appropriate contrast for matched/unmatched cells
  - Winning line highlight: visible in light mode
  - Article viewer: readable in light mode
  - Modals: light backgrounds with dark text
  - Buttons and controls: appropriate contrast
- Maintain WCAG AA contrast ratios in both themes
- Visual states (matched, winning, loading, error) must be distinguishable in both themes

**FR-THEME-4: Theme Implementation**
- Use CSS custom properties (CSS variables) for theme colors
- Theme switching should be instant (no flash or delay)
- Consider using a theme context/provider in React
- CSS should be organized to support easy theme switching

### Acceptance Criteria

- [ ] Theme toggle visible and functional on all screens
- [ ] Theme preference persists after page refresh
- [ ] Light mode provides sufficient contrast for all UI elements
- [ ] All visual states (matched, winning, etc.) work in both themes
- [ ] No visual artifacts or broken styling in light mode
- [ ] Keyboard navigation works in both themes

### Technical Notes

- Consider using CSS custom properties for color values
- May need to update all CSS files to use theme variables
- Test with browser dev tools to verify contrast ratios
- Consider using a library like `styled-components` or CSS-in-JS if not already in use

---

## 3. Enhanced Leaderboard Features

### Problem Statement

The leaderboard currently has limited functionality. Users need better ways to view, sort, and filter leaderboard entries.

### Requirements

**FR-LEADER-1: Date Display**
- All leaderboard entries must display the date/time of game completion
- Date format: "MMM DD, YYYY" (e.g., "Jan 15, 2024") or relative time ("2 days ago")
- Date column must be visible in leaderboard table
- Date should be sortable (newest first or oldest first)

**FR-LEADER-2: Enhanced Sorting**
- Support sorting by multiple fields:
  - Score (default, ascending - lower is better)
  - Clicks (ascending - lower is better)
  - Time (ascending - lower is better)
  - Date (descending - newer first, or configurable)
- Sort controls accessible via:
  - Dropdown menu, OR
  - Clickable column headers
- Sort state should persist during user session
- Visual indicator of current sort field and direction

**FR-LEADER-3: Time-Based Filtering**
- Filter options:
  - "Best Today" - scores from last 24 hours
  - "Best Past 7 Days" - scores from last week
  - "Best Past 30 Days" - scores from last month
  - "Best Past Year" - scores from last year
  - "All Time" - all scores (default)
- Filter UI: Dropdown or button group
- Filter applies to leaderboard API query
- Filter state persists during session
- Clear indication of active filter

**FR-LEADER-4: Game Details Article Summaries**
- In game details modal (opened from leaderboard row):
  - Each bingo square (matched or unmatched) is clickable
  - Clicking a square opens the article summary modal
  - Article summary modal shows read-only article content for that grid cell
  - Uses the same `ArticleSummaryModal` component as during gameplay
  - Modal can be closed and reopened for different squares

### API Requirements

**FR-LEADER-5: Leaderboard API Enhancements**
- GET `/api/leaderboard` must support:
  - `dateFrom` parameter (ISO date string) for time filtering
  - `dateTo` parameter (ISO date string) for time filtering
  - `sortBy` parameter (already exists, verify all fields work)
  - `sortOrder` parameter (already exists)
- Response must include `createdAt` field in ISO format
- Backend must efficiently query MongoDB with date filters

### Acceptance Criteria

- [ ] Date column visible and sortable in leaderboard table
- [ ] All sort options (score, clicks, time, date) work correctly
- [ ] Time filters (Today, 7 Days, 30 Days, Year, All Time) work correctly
- [ ] Filtered results match expected date ranges
- [ ] Game details modal allows clicking bingo squares to view article summaries
- [ ] Article summaries load correctly in game details modal
- [ ] API responses include proper date formatting

### Technical Notes

- Update `LeaderboardEntry` type to ensure `createdAt` is properly typed
- MongoDB queries need date range filtering
- Consider adding indexes on `createdAt` for performance
- Frontend date formatting should handle timezones appropriately
- May need to update `leaderboardClient.ts` for new API parameters

---

## 4. Game Sharing & Replay System

### Problem Statement

Users want to be able to:
- Share specific game boards with friends
- Replay games from the leaderboard
- Generate new games with shareable links
- Play the same board as others for fair competition

### Requirements

**FR-SHARE-1: Game State Storage**
- Create new MongoDB collection: `bingopedia.games`
- Store game state for each generated game:
  - `gameId`: Unique identifier (UUID or similar, URL-safe)
  - `gridCells`: Array of 25 article titles (in order)
  - `startingArticle`: Article title
  - `gameType`: "fresh" (random) or "linked" (from shareable link)
  - `createdAt`: Timestamp
  - `createdBy`: Optional username (if from leaderboard replay)
- Game state must be retrievable by `gameId`
- Consider TTL or archival strategy for old games (optional)

**FR-SHARE-2: Shareable Game Links**
- On start screen, add "Create New Game" section:
  - Button: "Generate Shareable Game"
  - Clicking generates a new game and creates a shareable link
  - Link format: `{domain}/play/{gameId}` or `{domain}/?game={gameId}`
  - Link displayed in UI with copy-to-clipboard button
  - Link can be shared via URL
- When user visits shareable link:
  - Extract `gameId` from URL
  - Load game state from database
  - Initialize game with that exact board and starting article
  - Mark game type as "linked"
  - If game not found, show error and offer to start fresh game

**FR-SHARE-3: Replay Feature**
- In game details modal (from leaderboard):
  - Add "Replay" button
  - Button visible and accessible
  - Clicking "Replay":
    - Retrieves game state from leaderboard entry (stored in `bingoSquares` and `history`)
    - If game state not stored, reconstruct from leaderboard data
    - OR: Store `gameId` in leaderboard entry when game is submitted
    - Loads exact game state (grid + starting article)
    - Starts new game session with that board
    - Game type marked as "linked"
    - User can play and submit score (will be marked as linked game)

**FR-SHARE-4: Game State in Leaderboard**
- When submitting score to leaderboard:
  - Include `gameId` in submission if available
  - Store `gameId` in leaderboard entry
  - This allows replaying exact games from leaderboard
- If `gameId` not available (legacy entries), reconstruct game state from `bingoSquares` and `history` if possible

**FR-SHARE-5: URL Routing**
- Support URL parameter or path-based game loading:
  - Option A: Query parameter: `/?game={gameId}`
  - Option B: Path-based: `/play/{gameId}`
- Router must handle game ID extraction
- Start screen must check for game ID on load
- If valid game ID found, auto-start that game
- If invalid game ID, show error message

### API Requirements

**FR-SHARE-6: Game API Endpoints**
- POST `/api/games` - Create new game state
  - Request: `{ gridCells: string[], startingArticle: string, gameType: "fresh" | "linked" }`
  - Response: `{ gameId: string, ...gameState }`
- GET `/api/games/:gameId` - Retrieve game state
  - Response: `{ gameId: string, gridCells: string[], startingArticle: string, gameType: string, createdAt: Date }`
  - 404 if game not found

### Acceptance Criteria

- [ ] "Generate Shareable Game" button creates game and displays link
- [ ] Link can be copied to clipboard
- [ ] Visiting shareable link loads the exact game board
- [ ] "Replay" button in game details modal works
- [ ] Replayed games are marked as "linked" type
- [ ] Game state is stored and retrievable from database
- [ ] URL routing handles game IDs correctly
- [ ] Error handling for invalid/missing game IDs

### Technical Notes

- Consider using UUID v4 for game IDs (URL-safe)
- Game state storage should be efficient (don't store full article content, just titles)
- May need to update leaderboard submission to include `gameId`
- Frontend routing may need updates (React Router or similar)
- Consider rate limiting on game creation endpoint
- May want to add expiration/cleanup for old games

---

## 5. Leaderboard Game Type Separation

### Problem Statement

Games played from shareable links (replays, shared boards) can be "speedrun" since players know the board. These should be separated from truly random "fresh" games to maintain competitive integrity.

### Requirements

**FR-TYPE-1: Game Type Field**
- All leaderboard entries must include `gameType` field:
  - "fresh": Truly random game (current default behavior)
  - "linked": Game played from shareable link or replay
- `gameType` set when score is submitted:
  - "fresh" if game was randomly generated
  - "linked" if game was loaded from shareable link or replayed

**FR-TYPE-2: Leaderboard Filtering by Type**
- Leaderboard UI must provide filter/toggle:
  - "Fresh Games" - only random games (default view)
  - "Linked Games" - only games from shareable links/replays
  - "All Games" - both types combined
- Filter UI: Dropdown or toggle buttons
- Filter state persists during session
- Clear indication of active filter

**FR-TYPE-3: API Support for Game Type Filtering**
- GET `/api/leaderboard` must support:
  - `gameType` parameter: "fresh", "linked", or "all" (default: "fresh")
- Backend must filter MongoDB queries by `gameType`
- Filter works in combination with other filters (time, sort, etc.)

**FR-TYPE-4: Database Schema Updates**
- Leaderboard collection must include `gameType` field
- Add index on `gameType` for efficient filtering
- Consider compound index: `(gameType, score, createdAt)`
- Migration needed for existing entries (default to "fresh" for legacy)

### Acceptance Criteria

- [ ] All new leaderboard entries include `gameType` field
- [ ] Leaderboard filter UI allows switching between Fresh/Linked/All
- [ ] Filtered results show only games of selected type
- [ ] API correctly filters by `gameType` parameter
- [ ] Default view shows "Fresh Games"
- [ ] Database indexes support efficient filtering

### Technical Notes

- Need database migration to add `gameType` to existing entries
- Default existing entries to "fresh" type
- Consider adding `gameType` to game state storage as well
- May want to add analytics to track usage of linked vs fresh games

---

## 6. Confetti Animation on Match

### Problem Statement

Confetti should play immediately when a user matches a grid cell (checks off a box), providing immediate positive feedback.

### Requirements

**FR-CONFETTI-1: Confetti on Match**
- Confetti animation must trigger **immediately** when a grid cell is matched
- Trigger occurs when:
  - User navigates to an article that matches a grid cell
  - Match is detected (new match, not re-visit)
- Confetti should play **before** any other UI updates if possible
- Animation should be brief and non-intrusive

**FR-CONFETTI-2: Confetti Implementation**
- Use existing `Confetti` component
- Ensure confetti triggers on **every new match**, not just on win
- Confetti should not interfere with:
  - Article navigation
  - Modal interactions
  - Timer updates
  - Other UI interactions

**FR-CONFETTI-3: Performance**
- Confetti animation must not cause performance issues
- Should work smoothly on mobile devices
- Animation should clean up after completion (no memory leaks)
- Multiple rapid matches should handle confetti appropriately (queue or skip if needed)

### Current State Analysis

Based on code review:
- `Confetti` component exists and uses Lottie animation
- Confetti currently triggers on win (`gameWon` state)
- Need to verify confetti triggers on individual matches

### Acceptance Criteria

- [ ] Confetti plays immediately when a grid cell is matched
- [ ] Confetti plays for each new match (not just on win)
- [ ] Confetti does not interfere with gameplay
- [ ] Animation performs well on mobile
- [ ] No performance degradation from confetti

### Technical Notes

- Review `useGameState.ts` to ensure confetti triggers on match detection
- May need to add state for "new match" to trigger confetti
- Consider debouncing if multiple matches happen rapidly
- Verify `Confetti` component handles rapid triggers correctly

---

## Implementation Priority

1. **Critical**: Bug Fix - Timer/State Reset Issue (blocks usability)
2. **High**: Light Mode (accessibility and user preference)
3. **High**: Enhanced Leaderboard Features (user-requested functionality)
4. **Medium**: Confetti on Match (polish and delight)
5. **Medium**: Game Sharing & Replay System (new feature, requires database work)
6. **Medium**: Leaderboard Game Type Separation (depends on sharing system)

---

## Dependencies

- **Game Sharing & Replay** depends on:
  - New MongoDB collection for game state
  - API endpoints for game creation/retrieval
  - URL routing updates

- **Leaderboard Game Type Separation** depends on:
  - Game Sharing system to mark games as "linked"
  - Database migration for existing entries

- **Enhanced Leaderboard Features** can be implemented independently

- **Light Mode** can be implemented independently

- **Bug Fix** should be prioritized and can be done independently

---

## Open Questions for Architect

1. **Timer Bug**: What is the root cause of the reset issue? Should timer state be separated from game state?

2. **Game Storage**: What's the best approach for storing game state? Full state in MongoDB, or reconstruct from leaderboard data?

3. **URL Routing**: Should we use query parameters (`?game=id`) or path-based routing (`/play/id`)? What routing library is in use?

4. **Database Migration**: How should we handle adding `gameType` to existing leaderboard entries? One-time migration script?

5. **Performance**: Are there concerns about storing game states in MongoDB? Should we add TTL or archival strategy?

6. **Confetti**: Is the current confetti implementation sufficient, or does it need updates to trigger on individual matches?

---

## Notes for Implementation

- All features should maintain backward compatibility where possible
- Database migrations should be reversible
- API changes should be versioned or documented
- Frontend changes should not break existing functionality
- Test all features in both light and dark modes
- Verify accessibility in both themes
- Consider mobile performance for all new features

