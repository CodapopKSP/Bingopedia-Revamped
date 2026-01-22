# Backend Engineer – Code Quality & Refactoring Tasks

This checklist contains code quality issues and refactoring opportunities for the Backend Engineer. Items are prioritized by impact and risk.

---

## 🟡 High Priority (Should Fix Soon)

### 5. Better Error Messages in API Responses
**Location**: `api/leaderboard.ts`

**Issue**: The API returns generic error messages that don't provide useful debugging information or user-friendly messages. The frontend client (Item 5 in Frontend tasks) will parse these, but the backend should provide structured error responses.

**Impact**: Difficult to debug issues in production; poor user experience.

**Tasks**:
- [x] Review current error responses in `api/leaderboard.ts`:
  - [x] GET endpoint error handling
  - [x] POST endpoint error handling
- [x] Provide structured error responses with:
  - [x] Error code/type (e.g., "VALIDATION_ERROR", "NETWORK_ERROR", "SERVER_ERROR")
  - [x] User-friendly message
  - [x] Detailed error for logging (in development)
- [x] Improve error messages for common scenarios:
  - [x] Validation errors (username too long, invalid score, etc.)
  - [x] MongoDB connection errors
  - [x] Database query errors
  - [ ] Rate limiting (if implemented)
- [x] Ensure error responses follow consistent format:
  ```typescript
  {
    error: {
      code: string,
      message: string,
      details?: any // for debugging in dev
    }
  }
  ```
- [x] Update error handling in `server/index.ts` to match
- [x] Update API documentation if needed

**Files to Modify**:
- `api/leaderboard.ts`
- `server/index.ts`
- `API_LEADERBOARD.md` (update documentation)

**Reference**: See how frontend will parse these in `FRONTEND_CODE_QUALITY_TASKS.md` Item 5.

---

## 🟢 Medium Priority (Nice to Have)

### 10. Minimal Bad Word Filter
**Location**: `api/validation.ts` (line 88)

**Issue**: The bad word filter only has 3 words as an example. Should either be expanded or documented as intentionally minimal.

**Impact**: Very limited profanity filtering.

**Tasks**:
- [x] Decide on approach:
  - [ ] **Option A**: Expand the word list with a reasonable, maintainable set
    - [ ] Research common profanity words to include
    - [ ] Keep list maintainable (not too large)
    - [ ] Consider variations (plural, past tense, etc.)
  - [x] **Option B**: Document that this is intentionally minimal
    - [x] Add clear comments explaining the minimal approach
    - [x] Document that it can be extended later
    - [x] Note that comprehensive filtering would require a library
- [ ] If expanding:
  - [ ] Add words to the `badWords` array
  - [ ] Test that masking still works correctly
  - [ ] Consider case-insensitive matching (already implemented)
  - [ ] Consider word boundaries to avoid false positives
- [ ] If using a library:
  - [ ] Evaluate libraries (e.g., `bad-words`, `profanity-filter`)
  - [ ] Integrate library
  - [ ] Update tests
- [x] Update documentation in `api/validation.ts`

**Files to Modify**:
- `api/validation.ts`
- `tests/validation.test.ts` (update/add tests)

**Current Implementation**:
```typescript
const badWords = ['fuck', 'shit', 'bitch']; // minimal example
```

---

## 🔵 Low Priority (Future Improvements)

### 16. Add JSDoc to All Public Functions
**Location**: Backend files (`api/`, `server/`)

**Issue**: Some functions have excellent JSDoc, others are missing it.

**Tasks**:
- [x] Add JSDoc comments to all exported functions in:
  - [x] `api/leaderboard.ts`
  - [x] `api/config.ts` (already had JSDoc)
  - [x] `api/mongoClient.ts`
  - [x] `api/validation.ts` (already had JSDoc)
  - [x] `server/index.ts`
- [x] Include:
  - [x] Parameter types and descriptions
  - [x] Return types and descriptions
  - [x] Usage examples where helpful
  - [x] @throws documentation for error cases
  - [x] @remarks for important notes

**Files to Modify**: All backend TypeScript files

---

## 📋 Testing Gaps

### 19. Missing Integration Tests (Backend)
**Location**: `tests/` directory

**Issue**: While unit tests exist, there are gaps in integration testing for the API.

**Tasks**:
- [x] Expand integration tests for `/api/leaderboard`:
  - [x] Test error scenarios:
    - [ ] MongoDB connection failures (requires API endpoint testing - see note)
    - [ ] Invalid request bodies (requires API endpoint testing - see note)
    - [ ] Missing required fields (requires API endpoint testing - see note)
    - [x] Edge cases (very large scores, very long usernames)
  - [x] Test pagination edge cases:
    - [x] Empty leaderboard
    - [x] Single page of results
    - [x] Last page with partial results
  - [x] Test sorting edge cases:
    - [x] All scores equal (tie-breaking)
    - [x] Very large datasets
  - [ ] Test concurrent requests (if applicable)
- [x] Add tests for error response formats
- [ ] Test rate limiting (if implemented)
- [ ] Test CORS headers (requires API endpoint testing - see note)

**Note**: Database-level integration tests have been added. Testing actual HTTP endpoints (MongoDB connection failures, invalid request bodies, CORS headers) would require setting up an Express test server or using a framework like supertest. The current tests validate the core database operations that the API depends on.

**Files to Modify**:
- `tests/leaderboard.integration.test.ts` (expand existing)
- Add new test files as needed

---

## 🎯 Summary

**Should Fix Soon:**
5. Better error messages in API responses

**Nice to Have:**
10. Bad word filter expansion/documentation

**Future:**
16. JSDoc documentation

**Testing:**
19. Additional integration test coverage

---

## Notes

- The backend code is generally well-structured
- TypeScript usage is excellent
- Most issues are refinements rather than fundamental problems
- The high priority item (#5) improves user experience and debuggability
- Medium/low priority items can be addressed incrementally
- Backend tasks are fewer than frontend, but still important for code quality

