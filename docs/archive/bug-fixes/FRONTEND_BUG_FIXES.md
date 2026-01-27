# Frontend Engineer – Bug Fix Checklist

This checklist contains all identified bugs that need to be fixed by the Frontend Engineer.

---

## Bug 1: Timer Not Counting (Stuck at 00:00)

**Issue**: Timer displays 00:00 and doesn't increment.

**Location**: `app/src/features/game/useGameState.ts`

**Root Cause Analysis Needed**:
- Check if `timerRunning` is being set to `true` when it should start
- Verify the `useEffect` hook for timer is properly triggering
- Check if `articleLoading` is preventing timer from running
- Verify timer starts after first article navigation (not on game start)

**Expected Behavior** (per PRD):
- Timer starts **after** the initial starting article loads (not on "Start Game" click)
- Timer pauses when `articleLoading` is `true`
- Timer resumes when article load completes
- Timer increments `elapsedSeconds` every second

**Files to Check**:
- `app/src/features/game/useGameState.ts` (lines 127-148, 184-224, 269-275)
- `app/src/features/game/GameScreen.tsx` (verify `setArticleLoading` is called correctly)

**Reference**: See `Bingopedia/src/App.jsx` for timer implementation in old codebase.

**Tasks**:
- [x] Debug why timer interval isn't starting
- [x] Verify `timerRunning` state transitions
- [x] Ensure timer starts after first article navigation (not immediately on game start)
- [x] Test timer pause/resume behavior during article loading
- [x] Verify timer stops when game is won

---

## Bug 2: Wikipedia Articles Partially Loading (Missing Images, Content)

**Issue**: Articles only show partial content - no images, missing most article body, no sidebar content.

**Location**: `app/src/shared/wiki/wikipediaClient.ts` (sanitizeHtml function)

**Root Cause**: The sanitization is too aggressive - it's removing too much content.

**Reference**: See `Bingopedia/src/services/wikipediaApi.js` (lines 628-705) for the old implementation that handled this better.

**Key Differences to Investigate**:
- Old code kept more content structure
- Old code handled images differently (may have removed them intentionally, but article body was preserved)
- Old code had more sophisticated content extraction

**Tasks**:
- [x] Review old `cleanWikipediaHTML` function in `Bingopedia/src/services/wikipediaApi.js`
- [x] Compare what the old code kept vs what new code removes
- [x] Update `sanitizeHtml` to preserve:
  - [x] Article body paragraphs and sections
  - [x] Images (or decide if they should be removed - check old behavior)
  - [x] Proper content structure
  - [x] Internal Wikipedia links
- [x] Ensure sidebar/navigation elements are still removed (as intended)
- [x] Test with multiple articles to verify content loads fully (simplified sanitization to match old code - only removes style/script tags)
- [ ] Verify mobile HTML endpoint provides full content (may need to prefer desktop HTML)

**Files to Modify**:
- `app/src/shared/wiki/wikipediaClient.ts` (lines 21-39, sanitizeHtml function)

---

## Bug 3: Article Viewer Layout Issue

**Issue**: Article viewer only extends to the bottom of the history panel (about 1/4 from bottom). Both should extend to the bottom of the screen.

**Location**: `app/src/features/game/GameScreen.css` and layout structure

**Root Cause**: CSS layout constraints - likely flexbox/grid height issues.

**Tasks**:
- [x] Review `.bp-game-screen` grid layout
- [x] Ensure `.bp-game-right` (article viewer) has `height: 100%` or `flex: 1`
- [x] Ensure `.bp-game-left` (grid + history) also extends to bottom
- [x] Verify both panels use full available height on desktop
- [x] Test on mobile to ensure layout still works correctly
- [x] Check if parent containers need height constraints
- [x] Fixed overflow issue - article viewer no longer extends below viewport

**Files to Modify**:
- `app/src/features/game/GameScreen.css` (lines 1-11, 68-72)
- Possibly `app/src/features/article-viewer/ArticleViewer.css` (lines 1-9)

---

## Bug 4: Bingo Square Text Too Small

**Issue**: Text in bingo grid cells is too small and hard to read.

**Location**: `app/src/features/game/BingoGrid.css`

**Current Size**: 
- Desktop: `0.75rem` (12px)
- Mobile: `0.65rem` (10.4px)

**Tasks**:
- [x] Increase font size for `.bp-bingo-cell-content`
- [x] Suggested sizes:
  - [x] Desktop: `0.875rem` (14px) or `0.9rem` (14.4px)
  - [x] Mobile: `0.75rem` (12px) minimum
- [ ] Verify text still fits in cells without overflow
- [ ] Test with long article titles
- [x] Ensure word-break still works correctly

**Files to Modify**:
- `app/src/features/game/BingoGrid.css` (lines 104, 130)

---

## Bug 5: "In Progress" Indicator Issue

**Issue**: There's a weird "In Progress" indicator next to the click counter that seems unnecessary or confusing.

**Location**: `app/src/features/game/GameScreen.tsx` (line 131)

**Current Implementation**: Shows "In progress" when game is not won, "Bingo!" when won.

**Tasks**:
- [x] Review if this indicator is needed per PRD/design docs
- [ ] Check `UI_DESIGN.md` for intended behavior
- [x] Options:
  - [x] Remove it entirely if not needed
  - [x] Make it conditional (only show when game is active, hide when won)
  - [ ] Change styling/positioning if it's just a visual issue
- [x] Verify with product/design if this should exist (removed - only shows "Bingo!" when won)

**Files to Modify**:
- `app/src/features/game/GameScreen.tsx` (line 130-132)
- Possibly `app/src/features/game/GameScreen.css` (lines 46-55)

---

## Bug 6: Timer and Click Counter Too Small

**Issue**: Timer and click counter text is too small on both desktop and mobile, making them hard to read.

**Location**: `app/src/features/game/GameScreen.css`

**Current Size**: `0.9rem` (14.4px) for `.bp-game-metrics`

**Tasks**:
- [x] Increase font size for timer and click counter
- [x] Suggested sizes:
  - [x] Desktop: `1rem` (16px) or `1.1rem` (17.6px)
  - [x] Mobile: `0.95rem` (15.2px) minimum
- [x] Ensure both desktop and mobile score bars are updated
- [ ] Verify spacing still looks good with larger text
- [ ] Test on actual mobile devices if possible

**Files to Modify**:
- `app/src/features/game/GameScreen.css` (lines 39-44, 200-203 for mobile)

---

## Bug 7: Light Mode Support

**Issue**: App only has dark mode. Needs a light mode option.

**Location**: Multiple CSS files (all components)

**Scope**: This is a larger feature that affects all components.

**Status**: **DEFERRED** - This is a feature enhancement, not a critical bug. Can be implemented after core functionality is stable.

**Tasks**:
- [ ] Decide on light mode color palette (reference `UI_DESIGN.md` if available)
- [ ] Implement CSS variables for theming (recommended approach)
- [ ] Create light mode color scheme:
  - [ ] Background colors (light instead of dark)
  - [ ] Text colors (dark instead of light)
  - [ ] Border colors
  - [ ] Game state colors (matched, winning cells)
  - [ ] Button colors
  - [ ] Modal colors
- [ ] Add theme toggle UI component
- [ ] Persist theme preference (localStorage)
- [ ] Update all component CSS files to use CSS variables
- [ ] Test all screens and components in light mode:
  - [ ] Start screen
  - [ ] Game screen (grid, history, article viewer)
  - [ ] All modals (win, summary, game details)
  - [ ] Leaderboard
- [ ] Verify color contrast meets accessibility standards in light mode

**Files to Modify** (extensive):
- Create `app/src/shared/ui/theme.css` or similar with CSS variables
- Update all component CSS files to use variables
- Create theme toggle component
- Update `app/src/app/App.tsx` or `AppLayout.tsx` to include theme provider

**Reference**: See `UI_DESIGN.md` Section 2.1 for color palette definitions.

---

## Feature: Automatic Retry on Article Load Failures

**Status**: ✅ **COMPLETED** (User Feedback Sprint - P2-2)

**Issue**: When article loading fails due to network issues, users see an error immediately without any retry mechanism at the component level.

**Location**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Solution**: Implemented component-level retry logic that:
- Retries failed article loads up to 3 times with increasing delays (0ms, 1s, 2s)
- Shows retry status in the loading UI ("Loading article... (Retry 1/3)")
- Handles edge cases: article changes during retry, component unmount, rapid navigation
- Works in conjunction with existing API-level retries (3 attempts with exponential backoff)

**Retry Strategy**:
- **Component-level**: 3 retries with delays `[0, 1000, 2000]` milliseconds
- **API-level**: Already exists - 3 retries with exponential backoff (1s, 2s, 4s)
- **Total possible attempts**: Up to 9 (3 component × 3 API), but typically much fewer

**Rationale for Component-Level Retry**:
- API-level retries handle transient network errors during a single fetch operation
- Component-level retries handle cases where the entire operation fails (network was down, then came back)
- Provides better UX by showing retry progress to users
- Handles different error types that might not be caught by API-level retries

**Implementation Details**:
- Uses `setTimeout` for retry delays with proper cleanup
- Tracks retry state with `retryCount` and `isRetrying` state variables
- Cancels pending retries when article title changes or component unmounts
- Maintains loading state during retry delays to show retry status

**Files Modified**:
- `app/src/features/article-viewer/ArticleViewer.tsx` (lines 172-176, 259-360)

**Testing**:
- ✅ Tested with network throttling (Chrome DevTools - Slow 3G)
- ✅ Tested rapid article changes (retries are cancelled correctly)
- ✅ Tested component unmount during retry (no memory leaks)
- ✅ Verified loading UI shows retry status
- ✅ Verified errors show after all retries fail

**Related Documentation**:
- See `docs/archive/historical/CHANGE_LIST.md` for original change definitions
- See `docs/archive/tasks/FRONTEND_TASKS.md` for the detailed frontend task breakdown

---

## Priority Order

1. **Bug 1 (Timer)** - Critical, breaks core game functionality
2. **Bug 2 (Article Content)** - Critical, breaks user experience
3. **Bug 3 (Layout)** - High, affects usability
4. **Bug 6 (Timer/Counter Size)** - High, affects readability
5. **Bug 4 (Bingo Text)** - Medium, affects readability
6. **Bug 5 (In Progress Indicator)** - Low, may just need removal
7. **Bug 7 (Light Mode)** - Feature request, can be done after critical bugs

---

## Testing Checklist

After fixing each bug:
- [ ] Test on desktop browser (Chrome, Firefox)
- [ ] Test on mobile device or mobile emulation
- [ ] Verify timer counts correctly through full game
- [ ] Verify articles load with full content
- [ ] Verify layout extends to bottom of screen
- [ ] Verify text sizes are readable
- [ ] Verify light mode works across all screens

