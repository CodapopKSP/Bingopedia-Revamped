# Bingopedia Engineering Plan
## Bug Fixes & Feature Implementation

**Document Purpose**: Comprehensive engineering plan for implementing bug fixes and new features identified in `CHANGE_LIST.md` and `PRODUCT_PRD.md`.

**Status**: Planning Phase  
**Last Updated**: Pre-Implementation  
**Related Documents**: `PRODUCT_PRD.md`, `CHANGE_LIST.md`, `QUICK_REFERENCE.md`

**Task Lists**: 
- `BACKEND_TASKS.md` - Detailed tasks for backend engineers
- `FRONTEND_TASKS.md` - Detailed tasks for frontend engineers
- `TASK_ASSIGNMENT_GUIDE.md` - Guide for assigning tasks to engineers

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Overview](#current-architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [Technical Decisions](#technical-decisions)
5. [Dependencies & Sequencing](#dependencies--sequencing)
6. [Risk Assessment](#risk-assessment)
7. [Testing Strategy](#testing-strategy)
8. [Code Quality Standards](#code-quality-standards)

---

## Executive Summary

This plan addresses **4 critical bugs** and **4 feature enhancements** across the Bingopedia application. The work is organized into 4 phases, prioritizing critical bug fixes first, followed by high-priority features, then medium-priority improvements.

### Key Deliverables

- **Phase 1**: Fix all critical leaderboard bugs (time format, sorting, filtering)
- **Phase 2**: Implement shareable game system with hashed IDs
- **Phase 3**: Add pagination, logging, and UI improvements
- **Phase 4**: Optional game persistence (deferred if complex)

### Estimated Timeline

- **Phase 1**: 2-3 days
- **Phase 2**: 3-4 days
- **Phase 3**: 2-3 days
- **Phase 4**: 2-3 days (optional)

**Total**: 7-10 days for Phases 1-3, +2-3 days if Phase 4 is included.

---

## Current Architecture Overview

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + MongoDB Atlas (Vercel serverless functions)
- **Deployment**: Vercel
- **State Management**: React hooks (no Redux/Zustand)

### Key Components

#### Frontend Structure
```
app/src/
├── features/
│   ├── game/              # Core game logic
│   │   ├── useGameState.ts      # Main game state hook
│   │   ├── useGameTimer.ts      # Timer management
│   │   ├── types.ts             # Game state types
│   │   ├── StartScreen.tsx      # Start screen UI
│   │   └── GameScreen.tsx       # Game screen UI
│   ├── article-viewer/    # Wikipedia article display
│   │   └── ArticleViewer.tsx
│   └── leaderboard/       # Leaderboard UI
│       ├── StartScreenLeaderboard.tsx
│       └── GameDetailsModal.tsx
├── shared/
│   ├── api/               # API clients
│   │   ├── leaderboardClient.ts
│   │   └── gamesClient.ts
│   ├── wiki/              # Wikipedia integration
│   └── theme/             # Theme system
└── app/
    └── App.tsx            # Root component
```

#### Backend Structure
```
api/
├── leaderboard.ts         # Leaderboard API (GET/POST)
├── games.ts               # Games API (POST)
├── games/[gameId].ts      # Games API (GET by UUID)
├── mongoClient.ts         # MongoDB connection & types
├── validation.ts          # Input validation
└── errors.ts              # Error handling
```

### Current Data Model

#### LeaderboardEntry (MongoDB)
```typescript
{
  _id: ObjectId,
  username: string,
  score: number,
  time: number,              // seconds
  clicks: number,
  bingoSquares: string[],
  history: string[],
  createdAt: Date,
  gameId?: string,           // UUID v4 (optional)
  gameType?: 'fresh' | 'linked'  // Optional, needs migration
}
```

#### GameState (MongoDB - `games` collection)
```typescript
{
  _id: ObjectId,
  gameId: string,            // UUID v4 (currently used)
  gridCells: string[],       // 25 article titles
  startingArticle: string,
  gameType: 'fresh' | 'linked',
  createdAt: Date,
  createdBy?: string
}
```

**Note**: Current implementation uses UUID v4 for `gameId`, but PRD requires **16-character hashed ID** for shareable links.

### Current Issues

1. **Leaderboard time format**: Displays raw seconds instead of HH:MM:SS
2. **Default sort**: Not set to score ascending
3. **Time period filter**: Not working (always shows all games)
4. **Game type filter**: Not working (games not distinguished in DB)
5. **Shareable games**: Uses UUID v4, needs hashed ID system
6. **URL routing**: Uses query params (`?game=uuid`), needs path-based (`/{hashedId}`)

---

## Implementation Phases

### Phase 1: Critical Bug Fixes (Priority: HIGH)

**Goal**: Fix all critical leaderboard bugs that affect user experience.

#### BUG-1: Leaderboard Time Format

**Current State**: Time displayed as raw seconds (e.g., "5025")

**Solution**:
- Create utility function `formatTime(seconds: number): string` in `app/src/shared/utils/timeFormat.ts`
- Format: `HH:MM:SS` (e.g., "01:23:45")
- Update all time displays:
  - `StartScreenLeaderboard.tsx` (line 294)
  - `GameDetailsModal.tsx` (wherever time is displayed)
  - `WinModal.tsx` (if time is shown)

**Implementation**:
```typescript
// app/src/shared/utils/timeFormat.ts
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
```

**Files to Modify**:
- `app/src/shared/utils/timeFormat.ts` (new)
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/features/leaderboard/GameDetailsModal.tsx`
- `app/src/features/game/WinModal.tsx` (if applicable)

**Testing**:
- Unit test for `formatTime()` with edge cases (0, <60, <3600, >3600)
- Visual verification in leaderboard UI

---

#### BUG-2: Leaderboard Default Sort

**Current State**: Default sort is `score` descending (line 32 in `api/leaderboard.ts`)

**Solution**:
- Change default `sortOrder` to `'asc'` in API
- Update frontend default state to `'asc'`
- Ensure tie-breaking logic still works (earlier `createdAt` ranks higher)

**Implementation**:
```typescript
// api/leaderboard.ts (line 32)
const sortOrder: SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';  // Default to 'asc'

// app/src/features/leaderboard/StartScreenLeaderboard.tsx (line 82)
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')  // Change from 'desc'
```

**Files to Modify**:
- `api/leaderboard.ts` (line 32)
- `server/index.ts` (if using Express, line 26)
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (line 82)

**Testing**:
- Verify leaderboard loads with score ascending by default
- Verify tie-breaking still works (earlier dates rank higher)

---

#### BUG-3: Leaderboard Time Period Filter Not Working

**Current State**: Filter UI exists but always shows all games

**Root Cause Analysis Needed**:
1. Check if `dateFrom`/`dateTo` are being passed correctly from frontend
2. Verify MongoDB query is using date filter correctly
3. Check timezone handling (ISO strings vs Date objects)

**Solution**:
- Verify `getDateRange()` function in `StartScreenLeaderboard.tsx` (lines 38-70)
- Ensure dates are converted to ISO strings correctly
- Fix MongoDB query in `api/leaderboard.ts` (lines 129-139)
- Add logging to debug date filter application

**Implementation**:
```typescript
// api/leaderboard.ts - Verify date filter logic
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
    dateFilter.createdAt.$lte = toDate;
  }
}
```

**Files to Modify**:
- `api/leaderboard.ts` (lines 129-139)
- `server/index.ts` (if using Express)
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (verify `getDateRange()`)

**Testing**:
- Test each time filter option (Today, 7 Days, 30 Days, Year, All Time)
- Verify correct date ranges are applied
- Test edge cases (midnight boundaries, timezone changes)

---

#### BUG-4: Game Type Filter Not Working

**Current State**: Games not distinguished in database; filter doesn't work

**Solution**:
1. **Database Migration**: Add `gameType` field to all existing entries
2. **Update Terminology**: Change "fresh"/"linked" → "random"/"repeat" throughout codebase
3. **Fix API Filter**: Ensure `gameType` filter works correctly
4. **Update Frontend**: Update terminology in UI

**Database Migration**:
```javascript
// scripts/migrateLeaderboardGameType.js (already exists, needs update)
// Add terminology update:
db.leaderboard.updateMany(
  { gameType: "fresh" },
  { $set: { gameType: "random" } }
)

db.leaderboard.updateMany(
  { gameType: "linked" },
  { $set: { gameType: "repeat" } }
)
```

**Implementation**:
1. Run migration script to add `gameType: "random"` to all entries
2. Update types throughout codebase:
   - `api/mongoClient.ts`: `'fresh' | 'linked'` → `'random' | 'repeat'`
   - `api/leaderboard.ts`: Update gameType validation
   - `app/src/features/game/types.ts`: Update GameState type
   - `app/src/features/leaderboard/StartScreenLeaderboard.tsx`: Update UI labels
3. Ensure new submissions include `gameType` field

**Files to Modify**:
- `scripts/migrateLeaderboardGameType.js` (update terminology)
- `api/mongoClient.ts` (update types)
- `api/leaderboard.ts` (update validation and filter)
- `api/games.ts` (update validation)
- `app/src/features/game/types.ts` (update types)
- `app/src/features/game/useGameState.ts` (update gameType values)
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (update UI)
- `app/src/shared/api/gamesClient.ts` (update types)

**Testing**:
- Run migration script and verify all entries have `gameType`
- Test game type filter (Random/Repeat/All)
- Verify new submissions include correct `gameType`
- Test terminology is consistent throughout UI

---

### Phase 2: High Priority Features

#### FEAT-2: Generate Shareable Game System

**Current State**: Uses UUID v4 for game IDs, query params for URLs

**Goal**: Implement hashed ID system with path-based routing (`/{hashedId}`)

**Key Changes**:
1. **Hashed ID Generation**: 16-character URL-safe hash
2. **Database Schema Update**: Add `hashedId` field to `generated-games` collection
3. **API Updates**: Support hashed ID lookup
4. **URL Routing**: Handle `/{hashedId}` paths
5. **Frontend Updates**: Use hashed IDs instead of UUIDs

**Hashed ID Generation**:
```typescript
// api/games.ts
import { randomBytes } from 'crypto';

function generateHashedId(): string {
  // Generate 12 random bytes (96 bits)
  const bytes = randomBytes(12);
  // Convert to base64url (URL-safe)
  return bytes.toString('base64url').substring(0, 16);
  // Alternative: use nanoid library for better collision resistance
}
```

**Database Schema Update**:
```typescript
// api/mongoClient.ts - Update GameState interface
export interface GameState {
  _id: ObjectId,
  hashedId: string,          // NEW: 16-char URL-safe hash (unique)
  gameId?: string,            // Keep for backward compatibility (UUID v4)
  gridCells: string[],
  startingArticle: string,
  gameType: 'random' | 'repeat',
  createdAt: Date,
  createdBy?: string
}
```

**API Endpoints**:
```typescript
// POST /api/games
// Request: { gridCells, startingArticle, gameType }
// Response: { hashedId, gridCells, startingArticle, ... }

// GET /api/games/:hashedId
// Response: { hashedId, gridCells, startingArticle, ... }
// 404 if not found
```

**URL Routing**:
- Vercel: Use `api/games/[hashedId].ts` (already exists as `[gameId].ts`, needs update)
- Frontend: Handle `/{hashedId}` paths in `App.tsx`
- Update `gamesClient.ts` to use hashed IDs

**Implementation Steps**:
1. Update `GameState` interface to include `hashedId`
2. Update `api/games.ts` to generate hashed ID on POST
3. Update `api/games/[gameId].ts` → `api/games/[hashedId].ts` to lookup by hashedId
4. Add unique index on `hashedId` in MongoDB
5. Update `gamesClient.ts` to use hashed IDs
6. Update `useGameState.ts` to use hashed IDs
7. Update `App.tsx` to handle `/{hashedId}` paths
8. Update `StartScreen.tsx` to display hashed ID URLs

**Files to Modify**:
- `api/mongoClient.ts` (update GameState interface)
- `api/games.ts` (generate hashedId)
- `api/games/[gameId].ts` → `api/games/[hashedId].ts` (rename and update)
- `app/src/shared/api/gamesClient.ts` (use hashedId)
- `app/src/features/game/useGameState.ts` (use hashedId)
- `app/src/app/App.tsx` (handle path-based routing)
- `app/src/features/game/StartScreen.tsx` (display hashed ID URLs)

**Testing**:
- Test hashed ID generation (uniqueness, URL-safety)
- Test game creation with hashed ID
- Test game retrieval by hashed ID
- Test URL routing (`/{hashedId}`)
- Test error handling (invalid hashed ID, 404)

---

#### FEAT-4: Article Viewer "View on Wikipedia" Button

**Current State**: No button to view article on Wikipedia

**Solution**:
- Add button in top-right of article viewer
- Show confirmation modal before opening external link
- Open Wikipedia in new tab

**Implementation**:
```typescript
// app/src/features/article-viewer/ArticleViewer.tsx
const [showConfirmModal, setShowConfirmModal] = useState(false);

const handleViewOnWikipedia = () => {
  setShowConfirmModal(true);
};

const confirmViewOnWikipedia = () => {
  const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle?.replace(/ /g, '_') || '')}`;
  window.open(wikipediaUrl, '_blank', 'noopener,noreferrer');
  setShowConfirmModal(false);
};
```

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.tsx`
- `app/src/features/article-viewer/ArticleViewer.css` (button styling)
- Create confirmation modal component (or reuse existing)

**Testing**:
- Test button visibility and positioning
- Test confirmation modal appears
- Test "Continue" opens Wikipedia in new tab
- Test "Cancel" closes modal
- Test URL encoding (spaces → underscores)

---

### Phase 3: Medium Priority Features

#### FEAT-1: Leaderboard Pagination

**Current State**: Shows 5 entries, no pagination

**Solution**:
- Increase default page size to 20
- Add pagination controls (Previous/Next, page numbers)
- Update API to support larger limits

**Implementation**:
```typescript
// app/src/features/leaderboard/StartScreenLeaderboard.tsx
const [page, setPage] = useState(1);
const [limit] = useState(20);  // Increase from 5

// Add pagination UI
<div className="bp-pagination">
  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
    Previous
  </button>
  <span>Page {page} of {totalPages}</span>
  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
    Next
  </button>
</div>
```

**Files to Modify**:
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- `app/src/features/leaderboard/StartScreenLeaderboard.css` (pagination styles)

**Testing**:
- Test pagination controls work correctly
- Test page navigation
- Test edge cases (first page, last page, empty results)

---

#### FEAT-3: Event Logging System

**Current State**: No event logging

**Solution**:
- Create logging API endpoint
- Log events to MongoDB time series collection
- Log: "game_started", "game_generated", "game_finished"

**Implementation**:
```typescript
// api/logging.ts (new file)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { event, timestamp, gameId, hashedId, metadata } = req.body;
    
    // Store in time series collection
    const collection = await getLoggingCollection();
    await collection.insertOne({
      event,
      timestamp: new Date(timestamp),
      gameId,
      hashedId,
      ...metadata
    });
  }
}

// app/src/shared/api/loggingClient.ts (new file)
export async function logEvent(event: string, metadata?: Record<string, unknown>) {
  await fetch('/api/logging', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  });
}
```

**Files to Create/Modify**:
- `api/logging.ts` (new)
- `api/mongoClient.ts` (add `getLoggingCollection()`)
- `app/src/shared/api/loggingClient.ts` (new)
- `app/src/features/game/useGameState.ts` (add logging calls)
- `app/src/features/game/StartScreen.tsx` (log game_started)
- `app/src/features/game/WinModal.tsx` (log game_finished)

**Testing**:
- Test events are logged correctly
- Test logging doesn't block user interactions
- Test error handling (logging failures don't break game)

---

#### UX-1: Light Mode Styling Update

**Current State**: Light mode needs better contrast

**Solution**:
- Update CSS variables for light mode
- Article viewer: Light background (like Wikipedia)
- Site background: Darker than article viewer
- Maintain contrast in both themes

**Implementation**:
```css
/* app/src/shared/theme/theme.css */
:root[data-theme="light"] {
  --article-bg: #ffffff;
  --site-bg: #f5f5f5;
  --article-text: #000000;
}

:root[data-theme="dark"] {
  --article-bg: #1a1a1a;
  --site-bg: #0d0d0d;
  --article-text: #ffffff;
}
```

**Files to Modify**:
- `app/src/shared/theme/theme.css` (or theme files)
- `app/src/features/article-viewer/ArticleViewer.css`
- `app/src/app/AppLayout.css`

**Testing**:
- Visual verification in both themes
- Test contrast ratios (WCAG AA)
- Test all UI components in both themes

---

#### UX-2: Mobile Timer/Clicks Visibility

**Current State**: Timer/clicks may be hidden by overlay

**Solution**:
- Ensure score bar has higher z-index than overlay
- Keep score bar visible when board overlay is open

**Files to Modify**:
- `app/src/features/game/GameScreen.tsx`
- `app/src/features/game/GameScreen.css`

**Testing**:
- Test on mobile devices
- Verify timer/clicks always visible
- Test overlay interactions

---

### Phase 4: Optional Features (Can Defer)

#### OPT-1: Game Persistence in localStorage

**Complexity**: High (requires careful state management)

**Solution**:
- Save game state to localStorage on each action
- Restore on page load
- Handle timer calculation (real-time vs paused)
- Clear on "New Game" click

**Implementation Notes**:
- Use `useEffect` to save state changes
- Use `useEffect` on mount to restore state
- Calculate elapsed time from start timestamp
- Handle edge cases (corrupted data, version mismatches)

**Files to Modify**:
- `app/src/features/game/useGameState.ts`
- `app/src/features/game/useGameTimer.ts`
- Create `app/src/shared/utils/localStorage.ts`

**Testing**:
- Test state persistence across page refreshes
- Test timer calculation
- Test edge cases (corrupted data, version changes)

---

## Technical Decisions

### 1. Hashed ID Generation

**Decision**: Use `crypto.randomBytes()` with base64url encoding

**Rationale**:
- Native Node.js crypto module (no dependencies)
- URL-safe encoding
- 16 characters provides sufficient uniqueness for expected scale
- Alternative: `nanoid` library (better collision resistance, but adds dependency)

**Code**:
```typescript
import { randomBytes } from 'crypto';

function generateHashedId(): string {
  const bytes = randomBytes(12);
  return bytes.toString('base64url').substring(0, 16);
}
```

### 2. Database Collection for Shareable Games

**Decision**: Use `generated-games` collection (already created)

**Rationale**:
- Collection already exists in MongoDB
- Matches PRD requirements
- Separate from `games` collection (if different purpose)

**Schema**:
```typescript
{
  _id: ObjectId,
  hashedId: string,        // Unique, indexed
  gridCells: string[],
  startingArticle: string,
  gameType: 'random' | 'repeat',
  createdAt: Date,
  createdBy?: string
}
```

### 3. URL Routing for Shareable Games

**Decision**: Use path-based routing (`/{hashedId}`) instead of query params

**Rationale**:
- Cleaner URLs
- Better SEO (if applicable)
- Matches PRD requirements

**Implementation**:
- Vercel: `api/games/[hashedId].ts`
- Frontend: Parse `window.location.pathname` in `App.tsx`
- Handle both old query param format (backward compatibility) and new path format

### 4. Terminology Update

**Decision**: Change "fresh"/"linked" → "random"/"repeat"

**Rationale**:
- Clearer terminology
- "Random" better describes new games
- "Repeat" better describes shared/replayed games

**Migration**:
- Update all code references
- Update database values
- Update UI labels

### 5. Time Format Utility

**Decision**: Create shared utility function

**Rationale**:
- DRY principle
- Consistent formatting across app
- Easy to test

**Location**: `app/src/shared/utils/timeFormat.ts`

### 6. Event Logging

**Decision**: Use MongoDB time series collection

**Rationale**:
- Efficient for time-based queries
- Matches PRD requirements
- Can be analyzed later

**Collection**: `bingopedia.game_events` (time series)

---

## Dependencies & Sequencing

### Phase 1 Dependencies

- **BUG-1** (Time Format): No dependencies
- **BUG-2** (Default Sort): No dependencies
- **BUG-3** (Time Filter): No dependencies
- **BUG-4** (Game Type Filter): Requires database migration

**Sequence**:
1. BUG-1, BUG-2, BUG-3 can be done in parallel
2. BUG-4 requires migration script first, then code updates

### Phase 2 Dependencies

- **FEAT-2** (Shareable Games): Requires database schema update
- **FEAT-4** (View on Wikipedia): No dependencies

**Sequence**:
1. FEAT-2: Database schema → API updates → Frontend updates
2. FEAT-4: Can be done in parallel with FEAT-2

### Phase 3 Dependencies

- **FEAT-1** (Pagination): No dependencies
- **FEAT-3** (Logging): Requires MongoDB collection setup
- **UX-1** (Light Mode): No dependencies
- **UX-2** (Mobile Visibility): No dependencies

**Sequence**:
- All can be done in parallel after Phase 1 & 2

### Phase 4 Dependencies

- **OPT-1** (Game Persistence): No dependencies, but complex

**Sequence**:
- Can be deferred if time is limited

---

## Risk Assessment

### High Risk

1. **Database Migration (BUG-4)**
   - **Risk**: Data loss or corruption during migration
   - **Mitigation**: 
     - Test migration on staging/backup first
     - Create database backup before migration
     - Migration script is idempotent (safe to run multiple times)
     - Verify migration results before proceeding

2. **Hashed ID Collision (FEAT-2)**
   - **Risk**: Two games could get same hashed ID
   - **Mitigation**:
     - Use unique index on `hashedId` in MongoDB
     - Handle collision errors gracefully (retry with new ID)
     - Consider using `nanoid` library for better collision resistance

3. **URL Routing Changes (FEAT-2)**
   - **Risk**: Breaking existing shareable links
   - **Mitigation**:
     - Support both old (query param) and new (path) formats
     - Add backward compatibility layer
     - Document migration path for existing links

### Medium Risk

1. **Time Filter Bug (BUG-3)**
   - **Risk**: Complex date/timezone handling
   - **Mitigation**:
     - Use ISO date strings consistently
     - Test across timezones
     - Add logging to debug date filter application

2. **Game Type Terminology (BUG-4)**
   - **Risk**: Missing some references during update
   - **Mitigation**:
     - Use find/replace with careful review
     - Search codebase for all occurrences
     - Test thoroughly after changes

### Low Risk

1. **Time Format (BUG-1)**: Simple utility function, low risk
2. **Default Sort (BUG-2)**: Simple change, low risk
3. **Pagination (FEAT-1)**: Standard implementation, low risk
4. **UI Improvements (UX-1, UX-2)**: CSS changes, low risk

---

## Testing Strategy

### Unit Tests

**Priority**: High for critical logic

1. **Time Format Utility** (`timeFormat.ts`)
   - Test with 0 seconds
   - Test with <60 seconds
   - Test with <3600 seconds
   - Test with >3600 seconds
   - Test with edge cases (negative, NaN)

2. **Hashed ID Generation**
   - Test uniqueness (generate 1000 IDs, check for collisions)
   - Test URL-safety (no special characters)
   - Test length (exactly 16 characters)

3. **Date Range Calculation** (`getDateRange()`)
   - Test each time filter option
   - Test timezone handling
   - Test edge cases (midnight boundaries)

### Integration Tests

**Priority**: High for API endpoints

1. **Leaderboard API**
   - Test time format in responses
   - Test default sort (score ascending)
   - Test time period filters
   - Test game type filters
   - Test pagination

2. **Games API**
   - Test hashed ID generation
   - Test game creation
   - Test game retrieval by hashed ID
   - Test error handling (404, invalid ID)

### End-to-End Tests

**Priority**: Medium for critical user flows

1. **Game Flow**
   - Start new game
   - Navigate articles
   - Win game
   - Submit score
   - Verify leaderboard entry

2. **Shareable Game Flow**
   - Generate shareable game
   - Copy link
   - Visit link in new session
   - Verify game loads correctly
   - Play and submit score
   - Verify game type is "repeat"

3. **Leaderboard Flow**
   - View leaderboard
   - Test sorting
   - Test time filters
   - Test game type filters
   - Test pagination
   - View game details
   - Replay game

### Manual Testing Checklist

**Phase 1**:
- [ ] Time displays as HH:MM:SS in all locations
- [ ] Leaderboard defaults to score ascending
- [ ] Time period filters work correctly
- [ ] Game type filters work correctly

**Phase 2**:
- [ ] Shareable game generation works
- [ ] Hashed ID URLs work correctly
- [ ] "View on Wikipedia" button works

**Phase 3**:
- [ ] Pagination works correctly
- [ ] Events are logged correctly
- [ ] Light mode styling is correct
- [ ] Mobile timer/clicks are visible

---

## Code Quality Standards

### TypeScript

- **Strict mode**: Enabled
- **Type safety**: All functions typed, no `any` types
- **Interfaces**: Use interfaces for data structures
- **Enums**: Use string literal types for constants

### Code Organization

- **File structure**: Follow existing patterns
- **Naming**: Use descriptive names, follow existing conventions
- **Comments**: Add JSDoc comments for public functions
- **Imports**: Organize imports (external, internal, relative)

### Error Handling

- **API errors**: Use structured error responses
- **User-facing errors**: Show friendly error messages
- **Logging**: Log errors for debugging
- **Validation**: Validate all inputs

### Performance

- **API calls**: Minimize unnecessary calls
- **Caching**: Use existing caching patterns
- **Rendering**: Avoid unnecessary re-renders
- **Bundle size**: Keep bundle size reasonable

### Accessibility

- **Keyboard navigation**: All interactive elements keyboard accessible
- **ARIA labels**: Add labels where needed
- **Color contrast**: Maintain WCAG AA contrast ratios
- **Screen readers**: Test with screen reader

---

## Implementation Checklist

### Phase 1: Critical Bug Fixes

- [ ] **BUG-1**: Create `timeFormat.ts` utility
- [ ] **BUG-1**: Update all time displays
- [ ] **BUG-1**: Add unit tests
- [ ] **BUG-2**: Update API default sort
- [ ] **BUG-2**: Update frontend default sort
- [ ] **BUG-2**: Test tie-breaking
- [ ] **BUG-3**: Debug date filter issue
- [ ] **BUG-3**: Fix MongoDB query
- [ ] **BUG-3**: Test all time filters
- [ ] **BUG-4**: Update migration script
- [ ] **BUG-4**: Run database migration
- [ ] **BUG-4**: Update terminology throughout codebase
- [ ] **BUG-4**: Test game type filter

### Phase 2: High Priority Features

- [ ] **FEAT-2**: Update GameState interface
- [ ] **FEAT-2**: Implement hashed ID generation
- [ ] **FEAT-2**: Update API endpoints
- [ ] **FEAT-2**: Update URL routing
- [ ] **FEAT-2**: Update frontend to use hashed IDs
- [ ] **FEAT-2**: Test shareable game flow
- [ ] **FEAT-4**: Add "View on Wikipedia" button
- [ ] **FEAT-4**: Add confirmation modal
- [ ] **FEAT-4**: Test button functionality

### Phase 3: Medium Priority Features

- [ ] **FEAT-1**: Increase page size to 20
- [ ] **FEAT-1**: Add pagination controls
- [ ] **FEAT-1**: Test pagination
- [ ] **FEAT-3**: Create logging API
- [ ] **FEAT-3**: Add logging calls
- [ ] **FEAT-3**: Test event logging
- [ ] **UX-1**: Update light mode CSS
- [ ] **UX-1**: Test both themes
- [ ] **UX-2**: Fix mobile timer visibility
- [ ] **UX-2**: Test on mobile devices

### Phase 4: Optional Features

- [ ] **OPT-1**: Implement localStorage persistence
- [ ] **OPT-1**: Test state restoration
- [ ] **OPT-1**: Test timer calculation

---

## Notes

- **Backward Compatibility**: Support both old (UUID) and new (hashed ID) formats during transition
- **Database Backups**: Create backups before running migrations
- **Staging Environment**: Test all changes in staging before production
- **Documentation**: Update documentation as changes are made
- **Code Review**: All changes should be code reviewed before merging

---

## Open Questions

1. **Hashed ID Algorithm**: Use `crypto.randomBytes()` or `nanoid` library?
   - **Recommendation**: Start with `crypto.randomBytes()`, switch to `nanoid` if collision issues arise

2. **Pagination UI**: Page numbers or "Load More" button?
   - **Recommendation**: Start with Previous/Next, add page numbers if needed

3. **Game Persistence**: Implement in Phase 4 or defer?
   - **Recommendation**: Defer if time is limited, implement if user feedback requests it

4. **Logging Metadata**: What additional fields to log?
   - **Recommendation**: Start with event type, timestamp, gameId/hashedId. Add more as needed.

---

**End of Engineering Plan**

