# Bug Fixes Summary

This document summarizes all bug fixes completed for the Bingopedia frontend.

---

## ✅ Bug 1: Timer Not Counting - FIXED

**Issue**: Timer was stuck at 00:00 and not incrementing.

**Root Cause**: Timer was being set to `timerRunning: true` immediately when navigation started, but it should only start after the article finishes loading.

**Fix Applied**:
- Modified `setArticleLoading` to start the timer only when loading completes and it's the first article after game start
- Changed `registerNavigation` to set `timerRunning: false` initially (timer starts when article finishes loading)
- Added logic to stop timer when game is won
- Timer now properly pauses during article loading and resumes when loading completes

**Files Modified**:
- `app/src/features/game/useGameState.ts`

---

## ✅ Bug 2: Wikipedia Articles Partially Loading - FIXED

**Issue**: Articles only showed partial content - missing images, most article body, no sidebar content.

**Root Cause**: The `sanitizeHtml` function was too aggressive, removing too much content including article body paragraphs.

**Fix Applied**:
- Updated `sanitizeHtml` to be less aggressive
- Now preserves article body paragraphs, sections, headings, lists, and internal links
- Still removes navigation elements, sidebars, and edit sections as intended
- Content extraction now properly finds and preserves the main article content area

**Files Modified**:
- `app/src/shared/wiki/wikipediaClient.ts`

---

## ✅ Bug 3: Article Viewer Layout Issue - FIXED

**Issue**: Article viewer only extended to bottom of history panel (about 1/4 from bottom). Both should extend to bottom of screen.

**Root Cause**: Missing height constraints on parent containers and flex layout issues.

**Fix Applied**:
- Added `height: 100%` and `min-height: calc(100vh - 80px)` to `.bp-game-screen`
- Added `height: 100%` and `min-height: 0` to `.bp-game-left` and `.bp-game-right`
- Added `min-height: 0` to `.bp-article-viewer` for proper flex behavior
- Made history panel flex properly with `flex: 1` and `min-height: 0`
- Made bingo grid `flex-shrink: 0` so it doesn't shrink

**Files Modified**:
- `app/src/features/game/GameScreen.css`
- `app/src/features/article-viewer/ArticleViewer.css`
- `app/src/features/game/HistoryPanel.css`
- `app/src/features/game/BingoGrid.css`

---

## ✅ Bug 4: Bingo Square Text Too Small - FIXED

**Issue**: Text in bingo grid cells was too small and hard to read.

**Fix Applied**:
- Increased desktop font size from `0.75rem` (12px) to `0.875rem` (14px)
- Increased mobile font size from `0.65rem` (10.4px) to `0.75rem` (12px)
- Maintained word-break and overflow handling

**Files Modified**:
- `app/src/features/game/BingoGrid.css`

---

## ✅ Bug 5: "In Progress" Indicator Issue - FIXED

**Issue**: Unnecessary "In progress" indicator next to click counter.

**Fix Applied**:
- Removed the "In progress" text when game is not won
- Now only shows "Bingo!" indicator when game is won
- Cleaner, less cluttered UI

**Files Modified**:
- `app/src/features/game/GameScreen.tsx`

---

## ✅ Bug 6: Timer and Click Counter Too Small - FIXED

**Issue**: Timer and click counter text was too small on both desktop and mobile.

**Fix Applied**:
- Increased desktop font size from `0.9rem` (14.4px) to `1rem` (16px)
- Increased mobile font size from `0.85rem` to `0.95rem` (15.2px)
- Applied to both desktop and mobile score bars

**Files Modified**:
- `app/src/features/game/GameScreen.css`

---

## ⏸️ Bug 7: Light Mode Support - DEFERRED

**Status**: This is a feature enhancement, not a critical bug. Deferred for future implementation.

**Reason**: Requires extensive CSS refactoring to use CSS variables and affects all components. Can be implemented after core functionality is stable.

---

## Testing Recommendations

After these fixes, please test:

1. **Timer Functionality**:
   - Start a game and verify timer starts after first article loads
   - Navigate to articles and verify timer pauses during loading
   - Verify timer resumes when article loads complete
   - Verify timer stops when game is won

2. **Article Content**:
   - Load multiple articles and verify full content displays
   - Check that paragraphs, headings, and lists are visible
   - Verify images display (if present in source)

3. **Layout**:
   - Verify both left panel (grid + history) and right panel (article viewer) extend to bottom on desktop
   - Test on mobile to ensure layout still works correctly

4. **Text Readability**:
   - Verify bingo grid text is readable
   - Verify timer and click counter are readable
   - Test on actual mobile devices if possible

---

## Additional Fixes Applied

- Fixed infinite loop in `ArticleViewer` caused by `onLoadingChange` callback dependency
- Made `setArticleLoading` stable using `useCallback` to prevent unnecessary re-renders
- Fixed `articleTitle` undefined error in `HistoryPanel` by using `getCuratedArticleTitle` helper
- Added defensive filtering in `HistoryPanel` to remove null/undefined entries

