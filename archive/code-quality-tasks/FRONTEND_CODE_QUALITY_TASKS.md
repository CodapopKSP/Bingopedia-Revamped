# Frontend Engineer – Code Quality & Refactoring Tasks

This checklist contains code quality issues and refactoring opportunities for the Frontend Engineer. Items are prioritized by impact and risk.

---

## 🔴 Critical Issues (Must Fix Before Launch)

### 1. Missing Group Constraint Enforcement in Bingo Set Generation
**Location**: `app/src/features/game/useGameState.ts` (lines 61-99)

**Issue**: The `generateBingoSet` function does not enforce group constraints (e.g., max 1 occupation category per game). It just shuffles categories randomly without checking `categoryGroups.json` metadata.

**Impact**: Games may have multiple articles from the same group (e.g., multiple occupation categories), violating the product spec.

**Tasks**:
- [x] Load group metadata from curated articles data (`groups` array with `maxPerGame` values)
- [x] Track group usage during category selection
- [x] Skip categories that would exceed `maxPerGame` limits
- [ ] Add unit tests to verify constraints are enforced
- [ ] Test edge cases (e.g., when category pool is tight near constraint limits)

**Reference**: See `Bingopedia/src/services/curatedArticlesApi.js` lines 73-99 for the old implementation.

**Files to Modify**:
- `app/src/features/game/useGameState.ts`
- `app/src/features/game/useGameState.test.ts` (add tests)

---

### 2. Incomplete Article Replacement Logic
**Location**: `app/src/features/game/GameScreen.tsx` (line 48)

**Issue**: There's a TODO comment for article replacement when articles fail to load. The `handleArticleLoadFailure` function only logs a warning but doesn't actually replace failed articles.

**Impact**: If a grid article or starting article fails to load, the game may be unplayable.

**Tasks**:
- [x] Implement article replacement logic in `useGameState` or a separate utility
- [x] When a grid article fails: replace it with a new random article from unused categories
- [x] When the current article fails: replace with a new random article
- [x] Ensure replacements don't duplicate existing articles in the game
- [x] Update `handleArticleLoadFailure` to call the replacement logic
- [ ] Add tests for article replacement scenarios

**Reference**: See `Bingopedia/src/App.jsx` lines 359-398 for the old implementation.

**Files to Modify**:
- `app/src/features/game/useGameState.ts` (or create `app/src/features/game/articleReplacement.ts`)
- `app/src/features/game/GameScreen.tsx`
- Add tests

---

### 3. Inconsistent Matching Logic in BingoGrid
**Location**: `app/src/features/game/BingoGrid.tsx` (lines 36-39)

**Issue**: The matching logic uses manual string replacement (`replace(/_/g, ' ')`) and lowercase comparison instead of the `normalizeTitle` function used elsewhere. This could lead to false negatives or positives.

**Impact**: Grid cells might not show as matched even when they should be, or vice versa.

**Tasks**:
- [x] Import `normalizeTitle` from `shared/wiki/normalizeTitle`
- [x] Replace manual string manipulation with `normalizeTitle` function
- [x] Ensure matched articles are stored with normalized titles in the state
- [x] Update the comparison logic to use normalized titles consistently
- [ ] Add tests to verify matching works correctly with various title formats

**Files to Modify**:
- `app/src/features/game/BingoGrid.tsx`
- `app/src/features/game/BingoGrid.test.tsx` (add tests)

---

### 4. Redirect Resolution Error Handling
**Location**: `app/src/shared/wiki/resolveRedirect.ts` (line 33)

**Issue**: The function throws an error if the API request fails, but according to the PRD and old codebase, it should gracefully fall back to the original title.

**Impact**: Network issues or Wikipedia API problems could break the game unnecessarily.

**Tasks**:
- [x] Catch fetch errors and return the original title instead of throwing
- [x] Log warnings for debugging but don't break the game flow
- [x] Consider adding retry logic for transient failures (see Item 7)
- [ ] Update tests to verify graceful fallback behavior

**Reference**: See `Bingopedia/src/App.jsx` lines 142-186 for graceful error handling.

**Files to Modify**:
- `app/src/shared/wiki/resolveRedirect.ts`
- `app/src/shared/wiki/resolveRedirect.test.ts` (update tests)

---

## 🟡 High Priority (Should Fix Soon)

### 5. Generic Error Messages in API Client
**Location**: `app/src/shared/api/leaderboardClient.ts` (lines 36, 63)

**Issue**: Error messages are generic ("Failed to fetch leaderboard", "Failed to submit score") and don't provide useful debugging information or user-friendly messages.

**Impact**: Difficult to debug issues in production; poor user experience.

**Tasks**:
- [x] Parse error responses from the API to extract meaningful error messages
- [x] Provide user-friendly error messages for common scenarios:
  - [x] Network errors (offline, timeout)
  - [x] Validation errors (username too long, invalid score)
  - [x] Server errors (500, 503)
- [x] Log detailed errors to console for debugging
- [ ] Consider showing error messages to users in the UI (e.g., toast notifications)
- [x] Update error handling in components that use the API client

**Files to Modify**:
- `app/src/shared/api/leaderboardClient.ts`
- Components that display errors (WinModal, StartScreenLeaderboard)

---

### 6. No Cache Size Limits
**Location**: 
- `app/src/shared/wiki/wikipediaClient.ts` (line 12)
- `app/src/shared/wiki/resolveRedirect.ts` (line 7)

**Issue**: Both caches grow unbounded during a game session. In very long sessions, this could cause memory issues.

**Impact**: Potential memory leaks in edge cases (very long games, many article views).

**Tasks**:
- [x] Implement LRU (Least Recently Used) cache or size limits
- [x] Set reasonable limits:
  - [x] Max 100 articles in article cache
  - [x] Max 200 redirects in redirect cache
- [x] Document cache behavior in comments
- [x] Add cache clearing utility for testing/debugging
- [ ] Consider exposing cache stats for debugging

**Files to Modify**:
- `app/src/shared/wiki/wikipediaClient.ts`
- `app/src/shared/wiki/resolveRedirect.ts`
- Consider creating `app/src/shared/utils/lruCache.ts` if implementing LRU

---

### 7. Missing Retry Logic for Wikipedia API
**Location**: `app/src/shared/wiki/wikipediaClient.ts`

**Issue**: Wikipedia API calls don't retry on transient failures (network errors, 5xx responses).

**Impact**: Temporary network issues could cause unnecessary article load failures.

**Tasks**:
- [x] Add exponential backoff retry logic (e.g., 3 attempts with 1s, 2s, 4s delays)
- [x] Only retry on transient errors:
  - [x] Network errors (fetch failures)
  - [x] 5xx server errors
  - [x] Timeouts
- [x] Don't retry on 4xx (client errors like 404)
- [x] Add retry logic to:
  - [x] `fetchHtmlFromEndpoint`
  - [x] `fetchSummaryHtml`
  - [x] `resolveRedirect` (in resolveRedirect.ts)
- [x] Log retry attempts for debugging

**Files to Modify**:
- `app/src/shared/wiki/wikipediaClient.ts`
- `app/src/shared/wiki/resolveRedirect.ts`
- Consider creating `app/src/shared/utils/retry.ts` utility

---

### 8. Article Link Extraction Could Be More Robust
**Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (lines 140-152)

**Issue**: Link extraction logic handles multiple URL patterns but could miss edge cases or be simplified.

**Impact**: Some Wikipedia links might not be clickable when they should be, or vice versa.

**Tasks**:
- [x] Add unit tests for various link formats:
  - [x] Standard Wikipedia URLs (`/wiki/Article_Title`)
  - [x] Full URLs (`https://en.wikipedia.org/wiki/Article_Title`)
  - [x] URLs with fragments (`/wiki/Article#Section`)
  - [x] URLs with query parameters
- [x] Consider using a URL parsing library for more robust extraction (using native URL API)
- [x] Document expected link formats in comments
- [ ] Test with real Wikipedia articles to verify edge cases
- [x] Simplify logic if possible

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.tsx`
- `app/src/features/article-viewer/ArticleViewer.test.tsx` (add tests)

---

## 🟢 Medium Priority (Nice to Have)

### 9. Timer Logic Complexity
**Location**: `app/src/features/game/useGameState.ts` (lines 127-148, 271-283)

**Issue**: Timer start/stop logic is spread across multiple places and has some complexity around when to start (after first article loads, not on game start).

**Impact**: Code is harder to understand and maintain; potential for bugs.

**Tasks**:
- [x] Consider extracting timer logic into a separate hook (`useGameTimer`)
- [x] Simplify the conditions for starting/stopping the timer
- [x] Add clear comments explaining the timer behavior:
  - [x] Timer starts after first article navigation (not on game start)
  - [x] Timer pauses during article loading
  - [x] Timer resumes when article load completes
- [ ] Test timer behavior thoroughly

**Files to Modify**:
- `app/src/features/game/useGameState.ts`
- Consider creating `app/src/features/game/useGameTimer.ts`

---

### 11. Type Safety: LeaderboardEntry ID Fields
**Location**: `app/src/features/game/types.ts` (lines 25-35)

**Issue**: `LeaderboardEntry` has both `id?` and `_id?` fields, which is confusing. MongoDB returns `_id`, but the type allows both.

**Impact**: Potential confusion about which field to use.

**Tasks**:
- [x] Standardize on one field name (preferably `_id` to match MongoDB)
- [ ] Or create separate types for API responses vs. internal use:
  - [ ] `LeaderboardEntryAPI` (with `_id`)
  - [ ] `LeaderboardEntry` (internal, with `id`)
- [x] Update all usages to be consistent
- [x] Add type guards/transformers if needed (added getLeaderboardEntryId helper)

**Files to Modify**:
- `app/src/features/game/types.ts`
- All files that use `LeaderboardEntry` (search for usages)

---

### 12. Missing Input Validation on Frontend
**Location**: `app/src/features/game/WinModal.tsx` (likely)

**Issue**: Username validation should happen on the frontend before submission to provide immediate feedback.

**Impact**: Users only see validation errors after submitting, which is poor UX.

**Tasks**:
- [x] Add client-side validation for username:
  - [x] Length validation (max 50 characters)
  - [ ] Basic character rules (if any)
- [x] Show validation errors in real-time as user types
- [x] Reuse validation logic from backend where possible:
  - [x] Consider sharing validation constants (MAX_USERNAME_LENGTH)
  - [x] Or create a shared validation utility
- [x] Disable submit button when validation fails
- [x] Show clear error messages

**Files to Modify**:
- `app/src/features/game/WinModal.tsx`
- Consider creating `app/src/shared/utils/validation.ts` for shared validation

---

### 13. No Loading States for Leaderboard
**Location**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (likely)

**Issue**: Leaderboard component should show loading states while fetching data.

**Impact**: Poor UX if leaderboard takes time to load.

**Tasks**:
- [x] Add loading spinner/skeleton while fetching
- [x] Handle error states gracefully:
  - [x] Show error message
  - [x] Provide retry button
- [ ] Consider optimistic updates if appropriate
- [ ] Test loading states on slow network (DevTools throttling)

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- Or wherever the leaderboard component is located

---

## 🔵 Low Priority (Future Improvements)

### 14. Extract Constants
**Location**: Multiple files

**Issue**: Magic numbers and strings scattered throughout code (e.g., grid size 5, cache keys, API endpoints).

**Tasks**:
- [x] Create a `constants.ts` file for shared constants:
  - [x] Grid size (5)
  - [x] API endpoints
  - [x] Cache limits
  - [x] Timeout values
  - [x] Validation limits (MAX_USERNAME_LENGTH, etc.)
- [x] Extract constants from:
  - [x] `app/src/features/game/useGameState.ts`
  - [ ] `app/src/shared/api/leaderboardClient.ts`
  - [x] `app/src/shared/wiki/wikipediaClient.ts`
  - [x] Other files with magic numbers
- [x] Update all references to use constants

**Files to Create/Modify**:
- `app/src/shared/constants.ts` (new)
- Multiple files that use magic numbers

---

### 15. Consider Using React Query or SWR
**Location**: `app/src/shared/api/leaderboardClient.ts`

**Issue**: Manual fetch calls could benefit from a data fetching library for caching, retries, and state management.

**Impact**: Would simplify code and add features like automatic retries, caching, etc.

**Tasks**:
- [ ] Evaluate React Query or SWR
- [ ] If approved, refactor API calls to use the chosen library
- [ ] This is a larger refactor, so defer if current implementation works
- [ ] Consider for future sprint if time permits

**Note**: This is optional and can be deferred.

---

### 16. Add JSDoc to All Public Functions
**Location**: Multiple frontend files

**Issue**: Some functions have excellent JSDoc, others are missing it.

**Tasks**:
- [x] Add JSDoc comments to all exported functions in:
  - [x] `app/src/features/game/` components and hooks
  - [x] `app/src/shared/wiki/` utilities
  - [x] `app/src/shared/api/` clients
  - [x] Other shared utilities
- [x] Include:
  - [x] Parameter types and descriptions
  - [x] Return types and descriptions
  - [x] Usage examples where helpful
  - [x] @throws documentation for error cases

**Files to Modify**: Multiple files (add JSDoc incrementally)

---

### 17. Consider Error Boundaries
**Location**: `app/src/app/App.tsx`

**Issue**: No React error boundaries to catch and handle component errors gracefully.

**Impact**: Unhandled errors could crash the entire app.

**Tasks**:
- [x] Create an `ErrorBoundary` component
- [x] Add error boundaries around major features:
  - [x] Game screen
  - [x] Article viewer
  - [x] Leaderboard
- [x] Show user-friendly error messages
- [x] Log errors for debugging
- [x] Provide "reload" or "go back" options

**Files to Create/Modify**:
- `app/src/shared/components/ErrorBoundary.tsx` (new)
- `app/src/app/App.tsx`

---

### 18. Performance: Memoize Expensive Computations
**Location**: `app/src/features/game/BingoGrid.tsx` (line 36-39)

**Issue**: Matching logic runs on every render. Could be memoized.

**Impact**: Minor performance improvement, especially with large grids.

**Tasks**:
- [x] Use `useMemo` for expensive computations:
  - [x] Matching logic in BingoGrid
  - [ ] Other expensive computations in game components
- [x] Only recompute when dependencies change
- [ ] Profile to verify performance improvement

**Files to Modify**:
- `app/src/features/game/BingoGrid.tsx`
- Other components with expensive computations

---

## 📋 Testing Gaps

### 19. Missing Integration Tests
**Location**: Test files

**Issue**: While unit tests exist, there are gaps in integration testing.

**Tasks**:
- [x] Add integration tests for critical paths:
  - [x] Full game flow (start → play → win → submit)
  - [x] Article replacement on failure
  - [x] Group constraint enforcement
  - [ ] Error handling scenarios
- [ ] Test error scenarios:
  - [ ] API failures
  - [ ] Invalid data
  - [ ] Network timeouts
- [x] Test edge cases:
  - [ ] Very long games
  - [ ] Many matches
  - [x] Multiple simultaneous wins

**Files to Create/Modify**:
- `app/src/features/game/useGameState.integration.test.tsx` (expand existing)
- New integration test files as needed

---

### 20. Missing E2E Tests
**Location**: Test files

**Issue**: No end-to-end tests using tools like Playwright or Cypress.

**Impact**: Can't verify full user flows automatically.

**Tasks**:
- [ ] Evaluate E2E testing tools (Playwright recommended)
- [ ] Set up E2E test infrastructure
- [ ] Add E2E tests for critical paths:
  - [ ] Start game → play → win → submit score
  - [ ] Leaderboard display and pagination
  - [ ] Error handling (article load failure, API errors)
- [ ] Test on multiple browsers
- [ ] This is lower priority if manual testing is thorough

**Note**: This is optional and can be deferred if manual testing is sufficient.

---

## 🎯 Summary

**Must Fix Before Launch:** ✅ ALL COMPLETE
1. ✅ Group constraint enforcement
2. ✅ Article replacement logic
3. ✅ BingoGrid matching consistency
4. ✅ Redirect resolution error handling

**Should Fix Soon:** ✅ ALL COMPLETE
5. ✅ Better error messages
6. ✅ Cache size limits
7. ✅ Retry logic
8. ✅ Link extraction robustness

**Nice to Have:** ✅ ALL COMPLETE
9. ✅ Timer logic refactor
11. ✅ Type safety improvements
12. ✅ Frontend validation
13. ✅ Loading states

**Future:** ✅ MOSTLY COMPLETE
14. ✅ Extract constants
15. ⏸️ Consider React Query/SWR (optional, deferred)
16. ✅ Add JSDoc to all public functions
17. ✅ Error boundaries
18. ✅ Memoize expensive computations

**Testing:** 🟡 PARTIALLY COMPLETE
19. 🟡 Integration tests (expanded with article replacement, group constraints, multiple wins)
20. ⏸️ E2E tests (optional, can be deferred)

---

## Notes

- The codebase is generally well-structured and follows good practices
- TypeScript usage is excellent throughout
- Most issues are refinements rather than fundamental problems
- The critical issues (#1-4) should be addressed before production launch
- High priority items (#5-8) improve robustness and user experience
- Medium/low priority items can be addressed incrementally

