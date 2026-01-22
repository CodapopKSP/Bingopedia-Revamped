# Code Quality & Refactoring Checklist

This document identifies code quality issues and refactoring opportunities found during code review. Items are prioritized by impact and risk.

---

## 🔴 Critical Issues (Must Fix Before Launch)

### 1. Missing Group Constraint Enforcement in Bingo Set Generation
**Location**: `app/src/features/game/useGameState.ts` (lines 61-99)

**Issue**: The `generateBingoSet` function does not enforce group constraints (e.g., max 1 occupation category per game). It just shuffles categories randomly without checking `categoryGroups.json` metadata.

**Impact**: Games may have multiple articles from the same group (e.g., multiple occupation categories), violating the product spec.

**Fix Required**:
- Load group metadata from curated articles data
- Track group usage during category selection
- Skip categories that would exceed `maxPerGame` limits
- Add unit tests to verify constraints are enforced

**Reference**: See `Bingopedia/src/services/curatedArticlesApi.js` lines 73-99 for the old implementation.

---

### 2. Incomplete Article Replacement Logic
**Location**: `app/src/features/game/GameScreen.tsx` (line 48)

**Issue**: There's a TODO comment for article replacement when articles fail to load. The `handleArticleLoadFailure` function only logs a warning but doesn't actually replace failed articles.

**Impact**: If a grid article or starting article fails to load, the game may be unplayable.

**Fix Required**:
- Implement article replacement logic in `useGameState` or a separate utility
- When a grid article fails: replace it with a new random article from unused categories
- When the current article fails: replace with a new random article
- Ensure replacements don't duplicate existing articles in the game
- Update `handleArticleLoadFailure` to call the replacement logic

**Reference**: See `Bingopedia/src/App.jsx` lines 359-398 for the old implementation.

---

### 3. Inconsistent Matching Logic in BingoGrid
**Location**: `app/src/features/game/BingoGrid.tsx` (lines 36-39)

**Issue**: The matching logic uses manual string replacement (`replace(/_/g, ' ')`) and lowercase comparison instead of the `normalizeTitle` function used elsewhere. This could lead to false negatives or positives.

**Impact**: Grid cells might not show as matched even when they should be, or vice versa.

**Fix Required**:
- Use `normalizeTitle` from `shared/wiki/normalizeTitle` for consistency
- Ensure matched articles are stored with normalized titles in the state
- Update the comparison logic to use normalized titles consistently

---

### 4. Redirect Resolution Error Handling
**Location**: `app/src/shared/wiki/resolveRedirect.ts` (line 33)

**Issue**: The function throws an error if the API request fails, but according to the PRD and old codebase, it should gracefully fall back to the original title.

**Impact**: Network issues or Wikipedia API problems could break the game unnecessarily.

**Fix Required**:
- Catch fetch errors and return the original title instead of throwing
- Log warnings for debugging but don't break the game flow
- Consider adding retry logic for transient failures

**Reference**: See `Bingopedia/src/App.jsx` lines 142-186 for graceful error handling.

---

## 🟡 High Priority (Should Fix Soon)

### 5. Generic Error Messages in API Client
**Location**: `app/src/shared/api/leaderboardClient.ts` (lines 36, 63)

**Issue**: Error messages are generic ("Failed to fetch leaderboard", "Failed to submit score") and don't provide useful debugging information or user-friendly messages.

**Impact**: Difficult to debug issues in production; poor user experience.

**Fix Required**:
- Parse error responses from the API to extract meaningful error messages
- Provide user-friendly error messages for common scenarios (network errors, validation errors)
- Log detailed errors to console for debugging
- Consider showing error messages to users in the UI

---

### 6. No Cache Size Limits
**Location**: 
- `app/src/shared/wiki/wikipediaClient.ts` (line 12)
- `app/src/shared/wiki/resolveRedirect.ts` (line 7)

**Issue**: Both caches grow unbounded during a game session. In very long sessions, this could cause memory issues.

**Impact**: Potential memory leaks in edge cases (very long games, many article views).

**Fix Required**:
- Implement LRU (Least Recently Used) cache or size limits
- Set reasonable limits (e.g., max 100 articles, max 200 redirects)
- Document cache behavior in comments

---

### 7. Missing Retry Logic for Wikipedia API
**Location**: `app/src/shared/wiki/wikipediaClient.ts`

**Issue**: Wikipedia API calls don't retry on transient failures (network errors, 5xx responses).

**Impact**: Temporary network issues could cause unnecessary article load failures.

**Fix Required**:
- Add exponential backoff retry logic (e.g., 3 attempts with 1s, 2s, 4s delays)
- Only retry on transient errors (network errors, 5xx, timeouts)
- Don't retry on 4xx (client errors like 404)

---

### 8. Article Link Extraction Could Be More Robust
**Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (lines 140-152)

**Issue**: Link extraction logic handles multiple URL patterns but could miss edge cases or be simplified.

**Impact**: Some Wikipedia links might not be clickable when they should be, or vice versa.

**Fix Required**:
- Add unit tests for various link formats
- Consider using a URL parsing library for more robust extraction
- Document expected link formats in comments
- Test with real Wikipedia articles to verify edge cases

---

## 🟢 Medium Priority (Nice to Have)

### 9. Timer Logic Complexity
**Location**: `app/src/features/game/useGameState.ts` (lines 127-148, 271-283)

**Issue**: Timer start/stop logic is spread across multiple places and has some complexity around when to start (after first article loads, not on game start).

**Impact**: Code is harder to understand and maintain; potential for bugs.

**Fix Required**:
- Consider extracting timer logic into a separate hook (`useGameTimer`)
- Simplify the conditions for starting/stopping the timer
- Add comments explaining the timer behavior clearly

---

### 10. Minimal Bad Word Filter
**Location**: `api/validation.ts` (line 88)

**Issue**: The bad word filter only has 3 words as an example. Should either be expanded or documented as intentionally minimal.

**Impact**: Very limited profanity filtering.

**Fix Required**:
- Either expand the word list (with a reasonable, maintainable set)
- Or document that this is intentionally minimal and can be extended later
- Consider using a library if comprehensive filtering is needed

---

### 11. Type Safety: LeaderboardEntry ID Fields
**Location**: `app/src/features/game/types.ts` (lines 25-35)

**Issue**: `LeaderboardEntry` has both `id?` and `_id?` fields, which is confusing. MongoDB returns `_id`, but the type allows both.

**Impact**: Potential confusion about which field to use.

**Fix Required**:
- Standardize on one field name (preferably `_id` to match MongoDB)
- Or create separate types for API responses vs. internal use
- Update all usages to be consistent

---

### 12. Missing Input Validation on Frontend
**Location**: `app/src/features/game/WinModal.tsx` (likely)

**Issue**: Username validation should happen on the frontend before submission to provide immediate feedback.

**Impact**: Users only see validation errors after submitting, which is poor UX.

**Fix Required**:
- Add client-side validation for username (length, basic character rules)
- Show validation errors in real-time as user types
- Reuse validation logic from backend where possible

---

### 13. No Loading States for Leaderboard
**Location**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (likely)

**Issue**: Leaderboard component should show loading states while fetching data.

**Impact**: Poor UX if leaderboard takes time to load.

**Fix Required**:
- Add loading spinner/skeleton while fetching
- Handle error states gracefully
- Consider optimistic updates if appropriate

---

## 🔵 Low Priority (Future Improvements)

### 14. Extract Constants
**Location**: Multiple files

**Issue**: Magic numbers and strings scattered throughout code (e.g., grid size 5, cache keys, API endpoints).

**Fix Required**:
- Create a `constants.ts` file for shared constants
- Extract grid size, API endpoints, cache limits, etc.

---

### 15. Consider Using React Query or SWR
**Location**: `app/src/shared/api/leaderboardClient.ts`

**Issue**: Manual fetch calls could benefit from a data fetching library for caching, retries, and state management.

**Impact**: Would simplify code and add features like automatic retries, caching, etc.

**Fix Required**:
- Evaluate React Query or SWR
- Refactor API calls to use the chosen library
- This is a larger refactor, so defer if current implementation works

---

### 16. Add JSDoc to All Public Functions
**Location**: Multiple files

**Issue**: Some functions have excellent JSDoc, others are missing it.

**Fix Required**:
- Add JSDoc comments to all exported functions
- Include parameter types, return types, and usage examples where helpful

---

### 17. Consider Error Boundaries
**Location**: `app/src/app/App.tsx`

**Issue**: No React error boundaries to catch and handle component errors gracefully.

**Impact**: Unhandled errors could crash the entire app.

**Fix Required**:
- Add error boundaries around major features (game screen, article viewer)
- Show user-friendly error messages
- Log errors for debugging

---

### 18. Performance: Memoize Expensive Computations
**Location**: `app/src/features/game/BingoGrid.tsx` (line 36-39)

**Issue**: Matching logic runs on every render. Could be memoized.

**Impact**: Minor performance improvement, especially with large grids.

**Fix Required**:
- Use `useMemo` for expensive computations
- Only recompute when dependencies change

---

## 📋 Testing Gaps

### 19. Missing Integration Tests
**Location**: Test files

**Issue**: While unit tests exist, there are gaps in integration testing:
- Full game flow (start → play → win → submit)
- Article replacement on failure
- Group constraint enforcement
- Error handling scenarios

**Fix Required**:
- Add integration tests for critical paths
- Test error scenarios (API failures, invalid data)
- Test edge cases (very long games, many matches)

---

### 20. Missing E2E Tests
**Location**: Test files

**Issue**: No end-to-end tests using tools like Playwright or Cypress.

**Impact**: Can't verify full user flows automatically.

**Fix Required**:
- Consider adding E2E tests for critical paths
- Test on multiple browsers
- This is lower priority if manual testing is thorough

---

## 🎯 Summary

**Must Fix Before Launch:**
1. Group constraint enforcement
2. Article replacement logic
3. BingoGrid matching consistency
4. Redirect resolution error handling

**Should Fix Soon:**
5. Better error messages
6. Cache size limits
7. Retry logic
8. Link extraction robustness

**Nice to Have:**
9-13. Various code quality improvements

**Future:**
14-18. Architecture and tooling improvements

**Testing:**
19-20. Additional test coverage

---

## Notes

- The codebase is generally well-structured and follows good practices
- TypeScript usage is excellent throughout
- Most issues are refinements rather than fundamental problems
- The critical issues (#1-4) should be addressed before production launch
- High priority items (#5-8) improve robustness and user experience
- Medium/low priority items can be addressed incrementally

