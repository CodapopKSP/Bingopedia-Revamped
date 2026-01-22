# Implementation Skills - Backend Tasks

This document captures skills and techniques learned during the backend implementation phase (BE-1 through BE-5).

---

## Backend Skills

### 1. MongoDB Schema Evolution Pattern
**Context**: Adding optional fields to existing schema (BE-4: gameId, gameType)

**Technique**:
- Add optional fields to TypeScript interface for backward compatibility
- Default values in application logic (not database)
- Migration scripts are idempotent (safe to run multiple times)
- Compound indexes for efficient filtering queries

**Code Pattern**:
```typescript
export interface LeaderboardEntry {
  // ... existing fields
  gameId?: string; // Optional for backward compatibility
  gameType?: 'fresh' | 'linked'; // Optional, defaults to 'fresh'
}

// In POST handler:
const entry: LeaderboardEntry = {
  // ... existing fields
  ...(gameId && { gameId: String(gameId) }),
  gameType: validGameType, // Always set, defaults to 'fresh'
};
```

**Application**: `api/mongoClient.ts`, `api/leaderboard.ts`

**Key Insight**: Optional fields allow gradual migration without breaking existing data or API consumers.

---

### 2. Date Range Filtering with Validation
**Context**: Adding date filtering to leaderboard API (BE-1)

**Technique**:
- Parse ISO date strings with validation
- Validate date range (dateFrom <= dateTo)
- Build MongoDB query filter conditionally
- Maintain backward compatibility (missing params = all entries)
- Handle timezone considerations (store/query in UTC)

**Code Pattern**:
```typescript
// Parse and validate dates
let dateFrom: Date | undefined;
if (query.dateFrom) {
  dateFrom = new Date(query.dateFrom);
  if (isNaN(dateFrom.getTime())) {
    throw new Error('Invalid dateFrom format. Expected ISO date string');
  }
}

// Build filter conditionally
const dateFilter: Record<string, unknown> = {};
if (dateFrom || dateTo) {
  dateFilter.createdAt = {};
  if (dateFrom) dateFilter.createdAt.$gte = dateFrom;
  if (dateTo) dateFilter.createdAt.$lte = dateTo;
}
```

**Application**: `api/leaderboard.ts`

**Key Insight**: Always validate date inputs and build filters conditionally to maintain backward compatibility.

---

### 3. MongoDB Index Strategy for Query Performance
**Context**: Optimizing date filtering queries (BE-5)

**Technique**:
- Create single-field indexes for common filters (`createdAt: -1`)
- Create compound indexes for common query patterns (`{ createdAt: -1, score: 1 }`)
- Index creation is idempotent (errors logged, not thrown)
- Compound indexes support multiple filter/sort combinations

**Code Pattern**:
```typescript
try {
  await db.collection(collectionName).createIndex({ createdAt: -1 });
  await db.collection(collectionName).createIndex({ createdAt: -1, score: 1 });
  await db.collection(collectionName).createIndex({ gameType: 1, score: 1, createdAt: 1 });
} catch (error) {
  console.log('Index creation note:', (error as Error).message);
}
```

**Application**: `api/mongoClient.ts`

**Key Insight**: Indexes should match query patterns. Compound indexes support filtering + sorting efficiently.

---

### 4. Vercel Serverless Function Routing Pattern
**Context**: Creating dynamic routes for games API (BE-3)

**Technique**:
- Use file-based routing: `api/games.ts` for POST, `api/games/[gameId].ts` for GET with parameter
- Route parameters available in `req.query` (not `req.params`)
- Update `vercel.json` with explicit rewrites for clarity
- Separate handlers for different HTTP methods on same resource

**Code Pattern**:
```typescript
// api/games.ts - POST handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Create game
  }
}

// api/games/[gameId].ts - GET handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const gameId = req.query.gameId as string; // Route param in query
  if (req.method === 'GET') {
    // Retrieve game
  }
}
```

**Application**: `api/games.ts`, `api/games/[gameId].ts`, `vercel.json`

**Key Insight**: Vercel uses file-based routing. Dynamic segments are in `req.query`, not `req.params`.

---

### 5. UUID v4 Validation Pattern
**Context**: Validating gameId format in games API (BE-3)

**Technique**:
- Use regex pattern for UUID v4 validation
- Validate before database query (fail fast)
- Return clear error messages for invalid formats
- Use `crypto.randomUUID()` for generation (Node.js built-in)

**Code Pattern**:
```typescript
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Usage
if (!isValidUUID(gameId)) {
  res.status(400).json(
    createErrorResponse('VALIDATION_ERROR', 'Invalid gameId format. Expected UUID v4')
  );
  return;
}
```

**Application**: `api/games/[gameId].ts`

**Key Insight**: Validate format before expensive operations (database queries). UUID v4 has specific format requirements.

---

### 6. Idempotent Migration Script Pattern
**Context**: Creating migration script for schema updates (BE-4)

**Technique**:
- Check for existing values before updating
- Use `$or` query to find documents missing field or with null
- Count before and after for verification
- Safe to run multiple times (idempotent)
- Provide clear console output for progress

**Code Pattern**:
```javascript
// Count entries without gameType
const countBefore = await collection.countDocuments({
  $or: [
    { gameType: { $exists: false } },
    { gameType: null }
  ]
});

// Update only missing values
const result = await collection.updateMany(
  {
    $or: [
      { gameType: { $exists: false } },
      { gameType: null }
    ]
  },
  {
    $set: { gameType: 'fresh' }
  }
);
```

**Application**: `scripts/migrateLeaderboardGameType.js`

**Key Insight**: Migration scripts should be idempotent. Always check what needs updating before updating.

---

### 7. Query Parameter Parsing with Type Safety
**Context**: Parsing and validating multiple query parameters (BE-1, BE-2)

**Technique**:
- Define interface for query parameters
- Parse with type validation
- Provide defaults for optional parameters
- Throw errors for invalid values (caught and returned as 400)
- Return typed object for use in handlers

**Code Pattern**:
```typescript
interface LeaderboardQuery {
  limit?: string;
  page?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  dateFrom?: string;
  dateTo?: string;
  gameType?: 'fresh' | 'linked' | 'all';
}

function parseQuery(query: LeaderboardQuery) {
  // Parse with validation
  const limit = Math.max(parseInt(query.limit ?? '10', 10) || 10, 1);
  const gameType = query.gameType || 'fresh';
  
  // Validate enum values
  if (gameType !== 'fresh' && gameType !== 'linked' && gameType !== 'all') {
    throw new Error("gameType must be 'fresh', 'linked', or 'all'");
  }
  
  return { limit, page, sortField, sortOrder, dateFrom, dateTo, gameType };
}
```

**Application**: `api/leaderboard.ts`

**Key Insight**: Centralize query parsing with validation. Throw errors that are caught and returned as structured API errors.

---

### 8. Compound Filter Building Pattern
**Context**: Combining multiple filters (date, gameType) in MongoDB queries (BE-1, BE-2)

**Technique**:
- Build filter object conditionally
- Combine multiple filter conditions
- Use MongoDB operators (`$gte`, `$lte`) for ranges
- Apply filter to both `countDocuments` and `find` queries

**Code Pattern**:
```typescript
// Build date filter
const dateFilter: Record<string, unknown> = {};
if (dateFrom || dateTo) {
  dateFilter.createdAt = {};
  if (dateFrom) dateFilter.createdAt.$gte = dateFrom;
  if (dateTo) dateFilter.createdAt.$lte = dateTo;
}

// Add gameType filter
if (gameType !== 'all') {
  dateFilter.gameType = gameType;
}

// Use in queries
const totalCount = await collection.countDocuments(dateFilter);
const users = await collection.find(dateFilter).sort(sortObj).toArray();
```

**Application**: `api/leaderboard.ts`

**Key Insight**: Build filters conditionally and reuse the same filter object for count and find queries to ensure consistency.

---

### 9. Error Code Extension Pattern
**Context**: Adding new error codes for new API endpoints (BE-3)

**Technique**:
- Extend existing error code type union
- Use descriptive error codes
- Map error codes to appropriate HTTP status codes
- Maintain consistency with existing error handling

**Code Pattern**:
```typescript
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'MISSING_FIELD'
  | 'INVALID_VALUE'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_FOUND'; // New error code

// Map to status codes
let status = 500;
if (errorResponse.error.code === 'NOT_FOUND') {
  status = 404;
} else if (errorResponse.error.code === 'VALIDATION_ERROR') {
  status = 400;
}
```

**Application**: `api/errors.ts`, `api/games/[gameId].ts`

**Key Insight**: Extend error types systematically. Map error codes to appropriate HTTP status codes consistently.

---

### 10. Collection Connection Caching Pattern
**Context**: Reusing MongoDB connections across requests (BE-3: getGamesCollection)

**Technique**:
- Cache client and database connections
- Check connection health with ping before reuse
- Reset cache on connection failure
- Create indexes during connection setup
- Return typed collection interface

**Code Pattern**:
```typescript
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getGamesCollection(): Promise<Collection<GameState>> {
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return cachedDb.collection<GameState>('games');
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }
  
  // Create new connection and indexes
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  
  try {
    await db.collection('games').createIndex({ gameId: 1 }, { unique: true });
  } catch (error) {
    console.log('Index creation note:', (error as Error).message);
  }
  
  cachedClient = client;
  cachedDb = db;
  return db.collection<GameState>('games');
}
```

**Application**: `api/mongoClient.ts`

**Key Insight**: Connection caching improves performance. Always check health before reuse and reset on failure.

---

## Architectural Decisions

### 1. Why Optional Fields for Schema Evolution
**Decision**: Made `gameId` and `gameType` optional in `LeaderboardEntry` interface

**Rationale**:
- Backward compatibility with existing data
- Gradual migration without breaking changes
- Default values in application logic (not database constraints)
- Migration script handles existing data

**Trade-offs**:
- Application must handle undefined values
- Requires migration script for existing data
- Default values must be applied consistently

---

### 2. Why Separate Files for Dynamic Routes
**Decision**: Created `api/games.ts` and `api/games/[gameId].ts` as separate files

**Rationale**:
- Vercel file-based routing requires separate files for different routes
- Clear separation of concerns (POST vs GET)
- Easier to maintain and test independently
- Follows Vercel conventions

**Trade-offs**:
- Some code duplication (CORS, error handling)
- Requires explicit routing in `vercel.json`

---

### 3. Why Full Game State Storage
**Decision**: Store complete game state (gridCells, startingArticle) in games collection

**Rationale**:
- Enables exact game replay
- No need to reconstruct from leaderboard data
- Supports game sharing feature
- Simple retrieval by gameId

**Trade-offs**:
- More storage space
- Requires separate collection
- Must keep game state in sync if rules change

---

## Best Practices

### 1. Index Creation
- Always create indexes during collection initialization
- Make index creation idempotent (catch errors, don't throw)
- Create compound indexes for common query patterns
- Document index purpose in code comments

### 2. Query Parameter Validation
- Validate all user inputs (dates, enums, numbers)
- Provide clear error messages
- Use TypeScript interfaces for type safety
- Throw errors that are caught and returned as structured API errors

### 3. Migration Scripts
- Always make migrations idempotent
- Check what needs updating before updating
- Provide clear console output
- Verify results after migration

### 4. Error Handling
- Use structured error responses consistently
- Map error codes to appropriate HTTP status codes
- Include details only in development mode
- Log errors for debugging

### 5. Backward Compatibility
- Add optional fields to interfaces
- Default values in application logic
- Maintain existing API behavior when adding new features
- Test with and without new fields

---

## Key Takeaways

1. **Schema Evolution**: Use optional fields and migration scripts for backward compatibility
2. **Query Performance**: Create indexes matching query patterns, especially compound indexes
3. **Validation**: Validate inputs early, provide clear error messages
4. **Routing**: Understand platform-specific routing (Vercel uses file-based routing)
5. **Idempotency**: Make migrations and index creation idempotent
6. **Error Handling**: Use structured error responses consistently
7. **Connection Management**: Cache database connections with health checks
8. **Type Safety**: Use TypeScript interfaces for query parameters and responses

---

---

## Frontend Skills

### 1. Timer Display State Separation Pattern
**Context**: Fixing timer bug that caused UI resets (FE-1)

**Technique**:
- Separate timer display state from game logic state
- Use `useRef` to store timer value without causing re-renders
- Batch display updates using `requestAnimationFrame` to minimize re-renders
- Keep actual `elapsedSeconds` in state for scoring, but update display less frequently

**Code Pattern**:
```typescript
export function useTimerDisplay(elapsedSeconds: number): number {
  const [displaySeconds, setDisplaySeconds] = useState(elapsedSeconds)
  const lastUpdateRef = useRef<number>(elapsedSeconds)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    lastUpdateRef.current = elapsedSeconds // Update ref immediately (no re-render)
    
    // Schedule display update on next animation frame (batched)
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplaySeconds(lastUpdateRef.current)
        rafRef.current = null
      })
    }
  }, [elapsedSeconds])
  
  return displaySeconds
}
```

**Application**: `app/src/features/game/useTimerDisplay.ts`

**Key Insight**: Separating display state from logic state prevents unnecessary re-renders that can cause UI issues (modals closing, scroll reset, focus loss).

---

### 2. Scroll Position Preservation Pattern
**Context**: Preserving scroll position during timer updates (FE-1)

**Technique**:
- Track scroll position in `useRef` (doesn't cause re-renders)
- Save scroll position on scroll events
- Track previous article title to detect article changes
- Only restore scroll position if article hasn't changed (i.e., just a re-render)
- Use `requestAnimationFrame` to ensure DOM is ready before restoring

**Code Pattern**:
```typescript
const scrollPositionRef = useRef<number>(0)
const previousArticleTitleRef = useRef<string | null>(null)

// Save on scroll
useEffect(() => {
  const container = contentRef.current
  if (!container) return
  const handleScroll = () => {
    scrollPositionRef.current = container.scrollTop
  }
  container.addEventListener('scroll', handleScroll, { passive: true })
  return () => container.removeEventListener('scroll', handleScroll)
}, [])

// Restore only if article unchanged
useEffect(() => {
  if (!contentRef.current || !content || loading || !articleTitle) return
  const normalized = normalizeTitle(articleTitle)
  const articleUnchanged = previousArticleTitleRef.current === normalized
  
  if (articleUnchanged && scrollPositionRef.current > 0) {
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = scrollPositionRef.current
      }
    })
  }
}, [content, loading, articleTitle])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Track what changed (article vs. re-render) to decide when to restore scroll position. Use refs to avoid re-renders.

---

### 3. Focus Preservation Pattern
**Context**: Preventing focus loss during timer updates (FE-1)

**Technique**:
- Store active element in `useRef` before article changes
- Only restore focus if element is still within the content container
- Check if article has changed before restoring (don't restore on new article)

**Code Pattern**:
```typescript
const activeElementRef = useRef<Element | null>(null)

// Save before article changes
if (articleChanged && contentRef.current) {
  activeElementRef.current = document.activeElement
}

// Restore if article unchanged
if (articleUnchanged && activeElementRef.current) {
  if (contentRef.current.contains(activeElementRef.current)) {
    (activeElementRef.current as HTMLElement).focus()
  }
}
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Only restore focus if the element is still valid and within the container. Don't restore on new articles.

---

### 4. React.memo for Modal Components
**Context**: Preventing modal re-renders from timer updates (FE-1)

**Technique**:
- Wrap modal components with `React.memo` to prevent re-renders when props haven't changed
- Modals only re-render when their specific props change (articleTitle, onClose, etc.)
- Timer updates no longer cause modal re-renders

**Code Pattern**:
```typescript
function ModalComponent({ articleTitle, onClose }: ModalProps) {
  // Component implementation
}

// Memoize to prevent re-renders from timer updates
export const Modal = memo(ModalComponent)
```

**Application**: `app/src/features/game/ArticleSummaryModal.tsx`, `app/src/features/game/WinModal.tsx`

**Key Insight**: Use `React.memo` for components that shouldn't re-render on parent state changes. Especially useful for modals and other isolated UI components.

---

### 5. requestAnimationFrame for DOM Updates
**Context**: Ensuring DOM is ready before restoring scroll/focus (FE-1)

**Technique**:
- Use `requestAnimationFrame` to defer DOM updates until browser is ready
- Prevents race conditions where DOM might not be fully rendered
- Ensures scroll position and focus restoration happen at the right time

**Code Pattern**:
```typescript
requestAnimationFrame(() => {
  if (contentRef.current) {
    contentRef.current.scrollTop = scrollPositionRef.current
    if (activeElementRef.current && contentRef.current.contains(activeElementRef.current)) {
      (activeElementRef.current as HTMLElement).focus()
    }
  }
})
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Use `requestAnimationFrame` when you need to ensure DOM is ready before manipulating it. Better than `setTimeout` for visual updates.

---

## Frontend Architectural Decisions

### 1. Why Separate Timer Display State
**Decision**: Created `useTimerDisplay` hook to separate display from logic state

**Rationale**:
- Timer updates every second cause re-renders
- Re-renders cause UI issues (modals closing, scroll reset, focus loss)
- Display doesn't need to update every second (batched updates are fine)
- Game logic still needs accurate `elapsedSeconds` for scoring

**Trade-offs**:
- Slightly more complex (two timer values)
- Display might lag by one frame (acceptable for timer display)
- Need to ensure display stays in sync (safety check every second)

---

### 2. Why React.memo for Modals
**Decision**: Wrapped modal components with `React.memo`

**Rationale**:
- Modals shouldn't re-render when parent state changes (timer, etc.)
- Prevents modal closing/resetting during timer updates
- Minimal performance impact (shallow prop comparison)
- Clear intent: modals are isolated components

**Trade-offs**:
- Need to ensure props are stable (use callbacks correctly)
- Slightly more code (export memoized component)

---

## Frontend Best Practices

### 1. State Separation
- Separate display state from logic state when display updates cause issues
- Use refs for values that don't need to trigger re-renders
- Batch display updates to minimize re-renders

### 2. Scroll Position Management
- Track scroll position in refs (not state)
- Only restore scroll position when appropriate (not on article changes)
- Use `requestAnimationFrame` for DOM updates

### 3. Focus Management
- Save focus before state changes that might affect it
- Only restore focus if element is still valid
- Don't restore focus on intentional navigation (new article)

### 4. Performance Optimization
- Use `React.memo` for components that shouldn't re-render frequently
- Batch updates using `requestAnimationFrame`
- Use refs instead of state when values don't need to trigger re-renders

---

### 6. Callback Registration Pattern with Refs
**Context**: Implementing confetti on match callback (FE-8)

**Technique**:
- Use refs to handle callback registration timing issues
- Parent component (App) holds ref, child (GameScreen) registers callback
- Allows useGameState to be called before callback is ready
- Callback is called via ref.current when available

**Code Pattern**:
```typescript
// In App.tsx
const onMatchRef = useRef<((title: string) => void) | undefined>(undefined)

const [state, controls] = useGameState({
  onMatch: (title: string) => {
    if (onMatchRef.current) {
      onMatchRef.current(title)
    }
  },
})

// Pass registration function to child
<GameScreen onMatchCallbackReady={(callback) => {
  onMatchRef.current = callback
}} />

// In GameScreen.tsx
useEffect(() => {
  if (onMatchCallbackReady) {
    onMatchCallbackReady(handleMatch)
  }
}, [handleMatch, onMatchCallbackReady])
```

**Application**: `app/src/app/App.tsx`, `app/src/features/game/GameScreen.tsx`

**Key Insight**: Use refs when callbacks need to be registered after component initialization but before they're used.

---

### 7. Table Sorting with Clickable Headers
**Context**: Adding sortable columns to leaderboard (FE-4, FE-5)

**Technique**:
- Make table headers clickable buttons
- Track sort state (field and direction) in component state
- Toggle direction when clicking same field, set new field when clicking different
- Provide visual indicators (↑↓) for current sort
- Default sort directions based on field semantics

**Code Pattern**:
```typescript
const [sortBy, setSortBy] = useState<'score' | 'time' | 'clicks' | 'createdAt' | 'username'>('score')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

const handleSort = (field: SortField) => {
  if (sortBy === field) {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  } else {
    setSortBy(field)
    // Set appropriate default direction
    setSortOrder(field === 'createdAt' ? 'desc' : 'asc')
  }
}

const getSortIndicator = (field: SortField) => {
  if (sortBy !== field) return null
  return sortOrder === 'asc' ? ' ↑' : ' ↓'
}
```

**Application**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx`

**Key Insight**: Clickable headers provide better UX than dropdowns. Use semantic default sort directions (e.g., date desc for newest first, username asc for alphabetical).

---

### 8. Date Formatting with Intl.DateTimeFormat
**Context**: Displaying dates in leaderboard (FE-4)

**Technique**:
- Use `Intl.DateTimeFormat` for locale-aware date formatting
- Handle both string and Date object inputs
- Choose appropriate format for context (short date for tables)

**Code Pattern**:
```typescript
function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj)
}
```

**Application**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx`

**Key Insight**: `Intl.DateTimeFormat` provides locale-aware formatting without external libraries. Handle both string and Date inputs for flexibility.

---

### 9. Match Detection Callback Pattern
**Context**: Triggering confetti on new matches (FE-8)

**Technique**:
- Track newly matched articles separately from existing matches
- Call callback only for new matches (not re-visits)
- Handle matches from both direct and redirect-based detection
- Debounce or batch multiple matches if needed

**Code Pattern**:
```typescript
// Track new matches
const newlyMatchedTitles: string[] = []

// In state update
if (!nextMatched.has(gridTitle)) {
  nextMatched.add(gridTitle)
  newlyMatchedTitles.push(gridTitle)
}

// After state update
if (onMatch && newlyMatchedTitles.length > 0) {
  newlyMatchedTitles.forEach((matchedTitle) => {
    onMatch(matchedTitle)
  })
}
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: Track what's new (not just what exists) to trigger callbacks only for new events. Handle both synchronous and asynchronous match detection.

---

### 10. Modal Component Reuse Pattern
**Context**: Reusing ArticleSummaryModal in GameDetailsModal (FE-7)

**Technique**:
- Reuse existing modal components across different contexts
- Pass same props interface for consistency
- Manage modal state (open/close) in parent component
- Handle optional callbacks gracefully

**Code Pattern**:
```typescript
// In GameDetailsModal
const [summaryModalTitle, setSummaryModalTitle] = useState<string | null>(null)

const handleCellClick = (articleTitle: string) => {
  setSummaryModalTitle(articleTitle)
}

// Reuse existing modal
{summaryModalTitle && (
  <ArticleSummaryModal
    articleTitle={summaryModalTitle}
    onClose={() => setSummaryModalTitle(null)}
  />
)}
```

**Application**: `app/src/features/leaderboard/GameDetailsModal.tsx`

**Key Insight**: Reuse modal components by managing their state in the parent. Keep modal components stateless and controlled.

---

## Frontend Architectural Decisions (Continued)

### 3. Why Clickable Headers Over Dropdown for Sorting
**Decision**: Used clickable column headers instead of dropdown for sorting

**Rationale**:
- Better UX: Direct interaction with data columns
- More discoverable: Users see sortable columns immediately
- Less UI clutter: No additional dropdown component
- Standard pattern: Common in data tables
- Visual feedback: Sort indicators show current state

**Trade-offs**:
- Takes more horizontal space (but acceptable for 5 columns)
- Requires more CSS for button styling
- Less obvious for users unfamiliar with sortable tables

---

### 4. Why Separate Match Confetti from Win Confetti
**Decision**: Separate state for match confetti vs win confetti

**Rationale**:
- Different triggers: Matches happen during gameplay, win happens at end
- Different durations: Match confetti is brief, win confetti can be longer
- Independent control: Can show both or neither independently
- Clearer code: Separate concerns

**Trade-offs**:
- Two confetti components can overlap (but acceptable)
- Slightly more state management

---

## Frontend Best Practices (Continued)

### 5. Sort State Management
- Store sort field and direction separately
- Use semantic default directions (date desc, username asc, score asc)
- Toggle direction when clicking same field
- Provide clear visual indicators
- Update API calls when sort changes

### 6. Date Handling
- Always handle both string and Date object inputs
- Use Intl.DateTimeFormat for locale-aware formatting
- Consider timezone implications
- Format appropriately for context (short for tables, full for details)

### 7. Callback Patterns
- Use refs when callbacks need registration timing flexibility
- Track "new" vs "existing" for event callbacks
- Handle optional callbacks gracefully
- Document callback signatures clearly

---

**Date**: After backend tasks BE-1 through BE-5 completion, after frontend tasks FE-1 through FE-8 completion  
**Status**: Skills documented for future reference

