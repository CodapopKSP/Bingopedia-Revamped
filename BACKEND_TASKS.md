# Backend Engineer Tasks

**Document Purpose**: Specific, verifiable tasks for backend engineers implementing bug fixes and features from `ENGINEERING_PLAN.md`.

**Status**: Ready for Assignment  
**Last Updated**: Pre-Implementation  
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

### Task BE-BUG-2: Fix Leaderboard Default Sort

**Priority**: HIGH  
**Feature**: BUG-2 from ENGINEERING_PLAN.md  
**Estimated Time**: 30 minutes

**Description**: Change default sort order from descending to ascending for score in leaderboard API.

**Current State**: 
- API defaults to `sortOrder: 'desc'` (line 32 in `api/leaderboard.ts`)
- Frontend defaults to `sortOrder: 'desc'` (line 82 in `StartScreenLeaderboard.tsx`)

**Files to Modify**:
- `api/leaderboard.ts` (line 32)
- `server/index.ts` (if using Express, check line 26)

**Implementation Steps**:
1. Locate the `sortOrder` parsing logic in `api/leaderboard.ts`
2. Change default from `'desc'` to `'asc'`:
   ```typescript
   const sortOrder: SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';  // Default to 'asc'
   ```
3. Verify the change in `server/index.ts` if it exists and has similar logic
4. Ensure tie-breaking logic still works (earlier `createdAt` ranks higher when scores are equal)

**Acceptance Criteria**:
- [ ] GET `/api/leaderboard` without `sortOrder` parameter returns results sorted by score ascending
- [ ] GET `/api/leaderboard?sortOrder=asc` returns results sorted by score ascending
- [ ] GET `/api/leaderboard?sortOrder=desc` still works (returns descending)
- [ ] Tie-breaking still works: entries with same score are sorted by `createdAt` ascending (earlier dates rank higher)
- [ ] Unit test: `tests/leaderboard.integration.test.ts` includes test for default sort order
- [ ] All existing tests still pass

**Test Requirements**:
- Add test case: GET without sortOrder defaults to ascending
- Add test case: Verify tie-breaking with same scores
- Verify backward compatibility (desc still works)

**Dependencies**: None

**Documentation Requirements**:
- Add JSDoc comment explaining default sort behavior
- Update API documentation if it exists

**Skills Documentation**:
- If you learn something new about MongoDB sorting or query optimization, document it in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task BE-BUG-3: Fix Leaderboard Time Period Filter

**Priority**: HIGH  
**Feature**: BUG-3 from ENGINEERING_PLAN.md  
**Estimated Time**: 2-3 hours

**Description**: Fix date range filtering in leaderboard API so time period filters work correctly.

**Current State**: Filter UI exists but always shows all games regardless of selected period.

**Root Cause Analysis Needed**:
1. Check if `dateFrom`/`dateTo` are being passed correctly from frontend
2. Verify MongoDB query is using date filter correctly
3. Check timezone handling (ISO strings vs Date objects)

**Files to Modify**:
- `api/leaderboard.ts` (lines 129-139)
- `server/index.ts` (if using Express, check similar logic)

**Implementation Steps**:
1. Locate date filter logic in `api/leaderboard.ts` (around lines 129-139)
2. Verify date parsing and conversion:
   ```typescript
   const dateFilter: Record<string, unknown> = {};
   if (dateFrom || dateTo) {
     dateFilter.createdAt = {};
     if (dateFrom) {
       // Ensure dateFrom is a Date object, not string
       const fromDate = dateFrom instanceof Date ? dateFrom : new Date(dateFrom);
       dateFilter.createdAt.$gte = fromDate;
     }
     if (dateTo) {
       const toDate = dateTo instanceof Date ? dateTo : new Date(dateTo);
       // Set to end of day (23:59:59.999)
       dateFilter.createdAt.$lte = new Date(toDate.getTime() + 86400000 - 1);
     }
   }
   ```
3. Verify dates are being parsed from query parameters correctly
4. Add logging to debug date filter application (console.log the filter object)
5. Test with various date ranges

**Acceptance Criteria**:
- [ ] GET `/api/leaderboard?dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z` returns only entries in that date range
- [ ] Invalid date strings return 400 error with clear message
- [ ] Missing `dateFrom`/`dateTo` returns all entries (backward compatible)
- [ ] Date filtering works with existing `sortBy`, `sortOrder`, `limit`, `page` parameters
- [ ] Timezone handling is correct (dates stored/queried in UTC)
- [ ] Unit test: `tests/leaderboard.integration.test.ts` includes date filtering test cases
- [ ] All existing tests still pass

**Test Requirements**:
- Add test cases for valid date ranges (Today, 7 Days, 30 Days, Year)
- Add test cases for invalid date formats
- Add test cases for date filtering combined with sorting
- Verify backward compatibility (no date params = all entries)
- Test edge cases (midnight boundaries, timezone changes)

**Dependencies**: None

**Documentation Requirements**:
- Add JSDoc comments explaining date filter behavior
- Document timezone handling approach
- Update API documentation with date filter examples

**Skills Documentation**:
- Document MongoDB date query patterns learned
- Document timezone handling best practices in `docs/IMPLEMENTATION_SKILLS.md`

---

### Task BE-BUG-4: Add gameType Field and Update Terminology

**Priority**: HIGH  
**Feature**: BUG-4 from ENGINEERING_PLAN.md  
**Estimated Time**: 3-4 hours

**Description**: Add `gameType` field to leaderboard entries and update terminology from "fresh"/"linked" to "random"/"repeat" throughout backend code.

**Current State**: Games not distinguished in database; filter doesn't work.

**Files to Modify**:
- `api/mongoClient.ts` (update types: `'fresh' | 'linked'` → `'random' | 'repeat'`)
- `api/leaderboard.ts` (update validation and filter)
- `api/games.ts` (update validation)
- `api/validation.ts` (if gameType validation exists there)
- `scripts/migrateLeaderboardGameType.js` (update terminology)

**Files to Create**:
- None (migration script already exists)

**Implementation Steps**:
1. **Update TypeScript Types**:
   - In `api/mongoClient.ts`, update `LeaderboardEntry` interface:
     ```typescript
     gameType?: 'random' | 'repeat'  // Changed from 'fresh' | 'linked'
     ```
   - In `api/mongoClient.ts`, update `GameState` interface:
     ```typescript
     gameType: 'random' | 'repeat'  // Changed from 'fresh' | 'linked'
     ```

2. **Update Validation**:
   - In `api/leaderboard.ts`, update gameType validation to accept 'random' or 'repeat'
   - In `api/games.ts`, update gameType validation
   - In `api/validation.ts`, update any gameType validation functions

3. **Update Filter Logic**:
   - In `api/leaderboard.ts`, ensure gameType filter accepts 'random', 'repeat', or 'all'
   - Update MongoDB query to filter by gameType correctly

4. **Update Migration Script**:
   - In `scripts/migrateLeaderboardGameType.js`, add terminology update:
     ```javascript
     // Update terminology
     db.leaderboard.updateMany(
       { gameType: "fresh" },
       { $set: { gameType: "random" } }
     )
     
     db.leaderboard.updateMany(
       { gameType: "linked" },
       { $set: { gameType: "repeat" } }
     )
     
     // Add gameType to entries that don't have it
     db.leaderboard.updateMany(
       { gameType: { $exists: false } },
       { $set: { gameType: "random" } }
     )
     ```

5. **Ensure New Submissions Include gameType**:
   - In `api/leaderboard.ts` POST handler, ensure gameType is set (default to 'random' if not provided)

**Acceptance Criteria**:
- [ ] All TypeScript types use 'random' | 'repeat' instead of 'fresh' | 'linked'
- [ ] Migration script updates terminology correctly
- [ ] Migration script adds gameType to entries that don't have it
- [ ] GET `/api/leaderboard?gameType=random` returns only random games
- [ ] GET `/api/leaderboard?gameType=repeat` returns only repeat games
- [ ] GET `/api/leaderboard?gameType=all` returns all games
- [ ] POST `/api/leaderboard` accepts gameType and stores it correctly
- [ ] POST `/api/leaderboard` defaults gameType to 'random' if not provided
- [ ] Unit test: Test gameType filter with all values
- [ ] Unit test: Test POST with gameType
- [ ] All existing tests still pass

**Test Requirements**:
- Test each gameType filter value ('random', 'repeat', 'all')
- Test gameType with date filtering
- Test gameType with sorting
- Test POST with gameType
- Test POST without gameType (should default to 'random')
- Test invalid gameType values return 400 error

**Dependencies**: None (but frontend tasks depend on this)

**Documentation Requirements**:
- Add JSDoc comments explaining gameType field
- Document terminology change (random/repeat)
- Update API documentation with gameType examples

**Skills Documentation**:
- Document MongoDB migration patterns learned
- Document terminology update strategies in `docs/IMPLEMENTATION_SKILLS.md`

**Migration Notes**:
- **IMPORTANT**: Test migration script on staging/backup database first
- Create database backup before running migration
- Migration script should be idempotent (safe to run multiple times)
- Verify migration results before proceeding with code changes

---

## Phase 2: High Priority Features

### Task BE-FEAT-2: Implement Hashed ID System for Shareable Games

**Priority**: HIGH  
**Feature**: FEAT-2 from ENGINEERING_PLAN.md  
**Estimated Time**: 4-5 hours

**Description**: Implement 16-character hashed ID system for shareable games, replacing UUID v4 system.

**Current State**: Uses UUID v4 for game IDs, query params for URLs.

**Key Changes**:
1. **Hashed ID Generation**: 16-character URL-safe hash
2. **Database Schema Update**: Add `hashedId` field to `generated-games` collection
3. **API Updates**: Support hashed ID lookup
4. **Backward Compatibility**: Support both UUID and hashed ID during transition

**Files to Modify**:
- `api/mongoClient.ts` (update GameState interface)
- `api/games.ts` (generate hashedId on POST)
- `api/games/[gameId].ts` → `api/games/[hashedId].ts` (rename and update to lookup by hashedId)

**Implementation Steps**:

1. **Update GameState Interface**:
   ```typescript
   // api/mongoClient.ts
   export interface GameState {
     _id: ObjectId,
     hashedId: string,          // NEW: 16-char URL-safe hash (unique, required)
     gameId?: string,            // Keep for backward compatibility (UUID v4, optional)
     gridCells: string[],
     startingArticle: string,
     gameType: 'random' | 'repeat',
     createdAt: Date,
     createdBy?: string
   }
   ```

2. **Implement Hashed ID Generation**:
   ```typescript
   // api/games.ts
   import { randomBytes } from 'crypto';
   
   function generateHashedId(): string {
     // Generate 12 random bytes (96 bits)
     const bytes = randomBytes(12);
     // Convert to base64url (URL-safe)
     return bytes.toString('base64url').substring(0, 16);
   }
   ```
   - Handle collision errors gracefully (retry with new ID if unique constraint fails)
   - Add retry logic (max 3 attempts)

3. **Update POST /api/games Endpoint**:
   - Generate hashedId for each new game
   - Store both hashedId (required) and gameId (optional, for backward compatibility)
   - Add unique index on hashedId in MongoDB (see step 4)

4. **Add Unique Index on hashedId**:
   ```typescript
   // In getGamesCollection() or similar function in api/mongoClient.ts
   await collection.createIndex({ hashedId: 1 }, { unique: true });
   ```

5. **Update GET /api/games/:hashedId Endpoint**:
   - Rename file: `api/games/[gameId].ts` → `api/games/[hashedId].ts`
   - Update to lookup by hashedId instead of gameId
   - Support backward compatibility: try hashedId first, then try gameId (UUID) if not found
   - Return 404 if neither found

6. **Update Validation**:
   - Validate hashedId format (16 characters, URL-safe)
   - Update error messages to mention hashedId

**Acceptance Criteria**:
- [ ] POST `/api/games` generates unique 16-character hashedId for each game
- [ ] HashedId is URL-safe (no special characters that need encoding)
- [ ] HashedId is stored in database with unique index
- [ ] GET `/api/games/:hashedId` retrieves game by hashedId
- [ ] GET `/api/games/:hashedId` supports backward compatibility (tries UUID if hashedId not found)
- [ ] Collision handling: If unique constraint fails, retry with new ID (max 3 attempts)
- [ ] Invalid hashedId format returns 400 error
- [ ] Unit test: Test hashed ID generation (uniqueness, URL-safety, length)
- [ ] Unit test: Test game creation with hashed ID
- [ ] Unit test: Test game retrieval by hashed ID
- [ ] Unit test: Test collision handling
- [ ] All existing tests still pass

**Test Requirements**:
- Generate 1000 hashed IDs, verify no collisions
- Test URL-safety (no characters that need encoding)
- Test length (exactly 16 characters)
- Test game creation with hashed ID
- Test game retrieval by hashed ID
- Test backward compatibility (UUID lookup)
- Test error handling (invalid hashed ID, 404)
- Test collision handling (simulate unique constraint failure)

**Dependencies**: None

**Documentation Requirements**:
- Add JSDoc comments explaining hashed ID generation
- Document collision handling strategy
- Document backward compatibility approach
- Update API documentation with hashed ID examples

**Skills Documentation**:
- Document crypto.randomBytes() usage patterns
- Document base64url encoding
- Document MongoDB unique index creation
- Document collision handling strategies in `docs/IMPLEMENTATION_SKILLS.md`

**Risk Mitigation**:
- Use unique index on hashedId to prevent collisions
- Handle collision errors gracefully (retry with new ID)
- Consider using `nanoid` library if collision issues arise (document decision)

---

## Phase 3: Medium Priority Features

### Task BE-FEAT-3: Create Event Logging System

**Priority**: MEDIUM  
**Feature**: FEAT-3 from ENGINEERING_PLAN.md  
**Estimated Time**: 3-4 hours

**Description**: Create logging API endpoint to log game events to MongoDB time series collection.

**Current State**: No event logging system exists.

**Files to Create**:
- `api/logging.ts` (new file)

**Files to Modify**:
- `api/mongoClient.ts` (add `getLoggingCollection()` function)

**Implementation Steps**:

1. **Create Logging Collection Function**:
   ```typescript
   // api/mongoClient.ts
   export async function getLoggingCollection() {
     const db = await getDatabase();
     const collection = db.collection('game_events'); // Time series collection
     return collection;
   }
   ```

2. **Create Logging API Endpoint**:
   ```typescript
   // api/logging.ts
   import type { VercelRequest, VercelResponse } from '@vercel/node';
   import { getLoggingCollection } from './mongoClient';
   import { handleCors } from './errors';
   
   export default async function handler(req: VercelRequest, res: VercelResponse) {
     // Handle CORS preflight
     if (req.method === 'OPTIONS') {
       return handleCors(res);
     }
     
     if (req.method === 'POST') {
       try {
         const { event, timestamp, gameId, hashedId, metadata } = req.body;
         
         // Validate required fields
         if (!event || !timestamp) {
           return res.status(400).json({ error: 'event and timestamp are required' });
         }
         
         // Store in time series collection
         const collection = await getLoggingCollection();
         await collection.insertOne({
           event,
           timestamp: new Date(timestamp),
           gameId: gameId || null,
           hashedId: hashedId || null,
           ...metadata
         });
         
         return res.status(200).json({ success: true });
       } catch (error) {
         console.error('Logging error:', error);
         return res.status(500).json({ error: 'Failed to log event' });
       }
     }
     
     return res.status(405).json({ error: 'Method not allowed' });
   }
   ```

3. **Event Types to Support**:
   - `"game_started"` - when user clicks "Start Game"
   - `"game_generated"` - when shareable game is created
   - `"game_finished"` - when game is won

4. **Error Handling**:
   - Logging failures should not break the game
   - Use try-catch to handle errors gracefully
   - Return success even if logging fails (non-blocking)

**Acceptance Criteria**:
- [ ] POST `/api/logging` accepts event data and stores in MongoDB
- [ ] Event data includes: event, timestamp, gameId (optional), hashedId (optional), metadata (optional)
- [ ] Invalid requests (missing event/timestamp) return 400 error
- [ ] Logging failures don't throw errors (non-blocking)
- [ ] Events are stored in `game_events` time series collection
- [ ] CORS headers are properly set
- [ ] Unit test: Test event logging with valid data
- [ ] Unit test: Test event logging with invalid data (400 error)
- [ ] Unit test: Test error handling (logging failures don't break)

**Test Requirements**:
- Test POST with valid event data
- Test POST with missing required fields (400 error)
- Test POST with optional fields (gameId, hashedId, metadata)
- Test error handling (simulate MongoDB failure)
- Test CORS preflight
- Verify events are stored correctly in database

**Dependencies**: None

**Documentation Requirements**:
- Add JSDoc comments explaining logging endpoint
- Document event types and their metadata
- Document non-blocking error handling approach
- Update API documentation with logging examples

**Skills Documentation**:
- Document MongoDB time series collection usage
- Document non-blocking logging patterns
- Document event schema design in `docs/IMPLEMENTATION_SKILLS.md`

---

## Phase 4: Optional Features

### Task BE-OPT-1: Support Game Persistence (Optional)

**Priority**: LOW (Optional)  
**Feature**: OPT-1 from ENGINEERING_PLAN.md  
**Estimated Time**: 2-3 hours (if implemented)

**Description**: Add API endpoint to save/load game state for persistence (if backend support is needed).

**Note**: This is primarily a frontend feature using localStorage. Backend support may not be needed unless we want server-side persistence. This task can be deferred or skipped.

**If Backend Support is Needed**:
- Add endpoint to save game state: POST `/api/game-state`
- Add endpoint to load game state: GET `/api/game-state/:userId` or similar
- Store game state in MongoDB with user identifier

**Acceptance Criteria**:
- [ ] If implemented, endpoints work correctly
- [ ] Game state is stored and retrieved correctly
- [ ] Unit tests are written

**Dependencies**: None (optional feature)

---

## Testing Requirements Summary

All backend tasks must include:
- [ ] Unit tests for new functionality
- [ ] Integration tests for API endpoints
- [ ] All existing tests still pass
- [ ] Error handling is tested
- [ ] Edge cases are tested

---

## Code Quality Standards

- **TypeScript**: Strict mode, no `any` types
- **Error Handling**: Use structured error responses
- **Validation**: Validate all inputs
- **Logging**: Log errors for debugging
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
- [ ] Documentation updated
- [ ] Skills documented (if applicable)

---

## Notes

- **Database Backups**: Create backups before running migrations
- **Staging Environment**: Test all changes in staging before production
- **Backward Compatibility**: Support both old and new formats during transition
- **Error Handling**: Always handle errors gracefully
- **Logging**: Log important operations for debugging

---

**End of Backend Tasks**

