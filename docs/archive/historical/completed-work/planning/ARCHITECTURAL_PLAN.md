# Bingopedia Feature Implementation - Architectural Plan

**Document Purpose**: This document provides the architectural plan for implementing the features specified in `FEATURE_SPECIFICATIONS.md`. It addresses technical decisions, system design, dependencies, and implementation considerations.

**Status**: Architectural Planning Complete  
**Last Updated**: Post-Migration Phase  
**Related Documents**: `FEATURE_SPECIFICATIONS.md`, `PRODUCT_PRD.md`

---

## Executive Summary

This plan covers six major feature areas:
1. **Critical Bug Fix**: Timer/State Reset Issue (Priority 1)
2. **Light Mode Theme Support** (Priority 2)
3. **Enhanced Leaderboard Features** (Priority 3)
4. **Confetti Animation on Match** (Priority 4)
5. **Game Sharing & Replay System** (Priority 5)
6. **Leaderboard Game Type Separation** (Priority 6)

Each feature is broken down with architectural decisions, technical approach, dependencies, and implementation considerations.

---

## 1. Critical Bug Fix: Timer/State Reset Issue

### Problem Analysis

**Root Cause Hypothesis**:
The timer tick (`onTick` callback in `useGameTimer`) triggers a state update in `useGameState` every second. This state update causes React to re-render components, which may be:
1. Resetting scroll position in `ArticleViewer` (no scroll preservation logic)
2. Closing modals (state not properly isolated from timer updates)
3. Causing focus loss during keyboard navigation

**Current Implementation**:
- `useGameTimer` calls `onTick` every second
- `onTick` updates `elapsedSeconds` via `setState` in `useGameState`
- This triggers a full state update and re-render of all components consuming `state`

### Architectural Solution

**Approach**: Separate timer display state from game logic state

**Key Decisions**:
1. **Timer Display State**: Move `elapsedSeconds` to a separate state that doesn't trigger game logic re-renders
2. **Scroll Preservation**: Implement scroll position preservation in `ArticleViewer` using refs
3. **Modal State Isolation**: Ensure modal state is independent of timer updates
4. **Memoization**: Use `React.memo` and `useMemo` to prevent unnecessary re-renders

### Technical Implementation

#### 1.1 Timer State Separation

**Location**: `app/src/features/game/useGameState.ts`

**Changes**:
- Create a separate timer display hook: `useTimerDisplay(elapsedSeconds)`
- Keep `elapsedSeconds` in game state for scoring, but update display separately
- Use `useRef` for timer value that doesn't need to trigger re-renders
- Only update display state when needed (debounced or batched)

**Alternative Approach** (if separation is insufficient):
- Use `useReducer` with careful action types to minimize re-renders
- Implement state batching for timer updates
- Consider using a state management library (Zustand/Jotai) for timer state

#### 1.2 Scroll Position Preservation

**Location**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Changes**:
- Add `scrollPositionRef` using `useRef` to store scroll position
- Use `useEffect` to save scroll position before content changes
- Restore scroll position after content updates
- Only restore if article title hasn't changed (prevent restoring on timer tick)

**Implementation Pattern**:
```typescript
const scrollPositionRef = useRef<number>(0)
const articleTitleRef = useRef<string | null>(null)

useEffect(() => {
  if (contentRef.current && articleTitle === articleTitleRef.current) {
    // Only restore if same article (timer tick, not navigation)
    contentRef.current.scrollTop = scrollPositionRef.current
  }
}, [content, articleTitle])

useEffect(() => {
  const container = contentRef.current
  if (!container) return
  
  const handleScroll = () => {
    scrollPositionRef.current = container.scrollTop
  }
  
  container.addEventListener('scroll', handleScroll, { passive: true })
  return () => container.removeEventListener('scroll', handleScroll)
}, [])
```

#### 1.3 Modal State Isolation

**Location**: `app/src/features/game/GameScreen.tsx`, `app/src/features/game/BingoGrid.tsx`

**Changes**:
- Ensure modal state (`summaryModalTitle`, `showWinModal`) is not dependent on timer state
- Use `React.memo` for modal components to prevent re-renders from parent state updates
- Verify modal components don't re-mount on timer ticks

**Verification**:
- Check that `ArticleSummaryModal` and `WinModal` are memoized
- Ensure modal open/close state is managed independently

#### 1.4 Focus Management

**Location**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Changes**:
- Preserve focus state during timer updates
- Use `document.activeElement` to track focus
- Restore focus if it was within article content and article hasn't changed

### Dependencies

- No external dependencies required
- May need React DevTools Profiler to verify re-render behavior

### Testing Strategy

1. **Timer Stability Test**: Open modal, wait 10+ seconds, verify it stays open
2. **Scroll Preservation Test**: Scroll article, wait 5 seconds, verify scroll position
3. **Focus Test**: Tab through article links, wait during timer ticks, verify focus doesn't jump
4. **Performance Test**: Use React Profiler to verify re-render frequency

### Risk Assessment

**Low Risk**: Changes are isolated to state management and don't affect game logic. Can be rolled back if issues arise.

---

## 2. Light Mode Theme Support

### Architectural Approach

**Decision**: Use CSS Custom Properties (CSS Variables) with a React Context for theme management

**Rationale**:
- CSS variables provide efficient theme switching without re-renders
- React Context provides clean API for theme toggle
- No need for CSS-in-JS library (keeps bundle size small)
- Maintains separation of concerns (styling vs. logic)

### Technical Implementation

#### 2.1 Theme System Architecture

**New Files**:
- `app/src/shared/theme/ThemeContext.tsx` - Theme context and provider
- `app/src/shared/theme/theme.css` - CSS variable definitions for both themes
- `app/src/shared/components/ThemeToggle.tsx` - Theme toggle component

**Theme Context Structure**:
```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}
```

**CSS Variable Structure**:
```css
:root {
  /* Dark theme (default) */
  --bg-primary: #0b1120;
  --bg-secondary: #020617;
  --text-primary: #e5e7eb;
  /* ... */
}

[data-theme="light"] {
  /* Light theme overrides */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #1a1a1a;
  /* ... */
}
```

#### 2.2 Color Palette Design

**Light Mode Colors** (based on dark mode palette):
- **Backgrounds**: White (#ffffff), light gray (#f8f9fa), off-white (#fafafa)
- **Text**: Dark gray (#1a1a1a), medium gray (#4a4a4a), light gray (#6b6b6b)
- **Bingo Grid**:
  - Neutral: Light gray background (#e5e7eb), darker border (#cbd5e1)
  - Matched: Light green background (#d1fae5), green border (#10b981)
  - Winning: Light yellow background (#fef3c7), yellow border (#f59e0b)
- **Buttons**: Maintain gradient approach but adjust for light mode
- **Modals**: White background (#ffffff) with subtle shadow

**Contrast Requirements**:
- All text must meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Interactive elements must have clear visual distinction
- Use browser dev tools to verify contrast ratios

#### 2.3 Implementation Steps

1. **Create Theme Context**:
   - Context provider with theme state
   - localStorage persistence
   - System preference detection (`prefers-color-scheme`)
   - Apply theme via `data-theme` attribute on root element

2. **Define CSS Variables**:
   - Create `theme.css` with all color variables
   - Define both dark and light theme values
   - Import in `index.css` or `AppLayout.tsx`

3. **Update All CSS Files**:
   - Replace hardcoded colors with CSS variables
   - Files to update:
     - `AppLayout.css`
     - `GameScreen.css`
     - `BingoGrid.css`
     - `ArticleViewer.css`
     - `WinModal.css`
     - `ArticleSummaryModal.css`
     - `GameDetailsModal.css`
     - `StartScreen.css`
     - `HistoryPanel.css`
     - All other component CSS files

4. **Create Theme Toggle Component**:
   - Accessible button/switch
   - Icon or label indicating current theme
   - Keyboard accessible
   - Place in `AppLayout` header (visible on all screens)

5. **Test All Components**:
   - Visual inspection of all screens in both themes
   - Contrast ratio verification
   - Interactive element visibility
   - Modal readability

#### 2.4 Theme Toggle Placement

**Decision**: Place in `AppLayout` header (visible on all screens)

**UI Design**:
- Icon-based toggle (sun/moon icons)
- Or text-based: "Light" / "Dark"
- Position: Top-right of header
- Mobile: Ensure touch target is adequate (44x44px minimum)

### Dependencies

- No external dependencies required
- May want icon library (e.g., `react-icons`) for theme toggle icons (optional)

### Migration Strategy

1. **Phase 1**: Create theme system and context (no UI changes)
2. **Phase 2**: Update CSS files to use variables (maintains dark mode)
3. **Phase 3**: Add light mode color definitions
4. **Phase 4**: Add theme toggle UI
5. **Phase 5**: Test and refine

### Risk Assessment

**Medium Risk**: Extensive CSS changes required. Need thorough testing to ensure no visual regressions. Can be implemented incrementally.

---

## 3. Enhanced Leaderboard Features

### Architectural Approach

**Decision**: Extend existing leaderboard API and frontend components with new filtering/sorting capabilities

### Technical Implementation

#### 3.1 Date Display

**Backend Changes**: `api/leaderboard.ts`
- `createdAt` field already exists in `LeaderboardEntry` interface
- Ensure `createdAt` is always included in responses (currently is)
- No backend changes needed

**Frontend Changes**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- Add date column to leaderboard table
- Format date using `Intl.DateTimeFormat` or date-fns
- Support both absolute ("Jan 15, 2024") and relative ("2 days ago") formats
- Make date column sortable

**Date Formatting**:
```typescript
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}

function formatRelativeDate(date: Date | string): string {
  // Use date-fns or custom logic
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  // ... etc
}
```

#### 3.2 Enhanced Sorting

**Backend Changes**: `api/leaderboard.ts`
- Already supports `sortBy` and `sortOrder` parameters
- Verify all fields work: `score`, `clicks`, `time`, `createdAt`, `username`
- Add compound sorting for tie-breaking (e.g., `score` then `createdAt`)

**Frontend Changes**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- Add sort dropdown or clickable column headers
- Store sort state in component state or URL params
- Update API calls with sort parameters
- Visual indicator of current sort field and direction

**Sort UI Design**:
- Dropdown: "Sort by: Score (Low to High)" with options
- Or: Clickable column headers with sort indicators (↑↓)
- Show current sort state clearly

#### 3.3 Time-Based Filtering

**Backend Changes**: `api/leaderboard.ts`
- Add `dateFrom` and `dateTo` query parameters
- Parse ISO date strings
- Add MongoDB query filter: `{ createdAt: { $gte: dateFrom, $lte: dateTo } }`
- Combine with existing filters (sort, pagination)

**Frontend Changes**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx`
- Add filter dropdown: "All Time", "Today", "Past 7 Days", etc.
- Calculate date ranges client-side
- Update API calls with `dateFrom`/`dateTo` parameters
- Store filter state (localStorage or component state)

**Date Range Calculation**:
```typescript
function getDateRange(filter: string): { dateFrom?: Date; dateTo?: Date } {
  const now = new Date()
  switch (filter) {
    case 'today':
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      return { dateFrom: todayStart, dateTo: new Date() }
    case '7days':
      return { dateFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), dateTo: new Date() }
    // ... etc
    default:
      return {}
  }
}
```

#### 3.4 Game Details Article Summaries

**Frontend Changes**: `app/src/features/leaderboard/GameDetailsModal.tsx`
- Make bingo grid cells clickable (currently read-only)
- On cell click, open `ArticleSummaryModal` with that article's content
- Reuse existing `ArticleSummaryModal` component
- Fetch article content on demand (may need to add API or use Wikipedia client)

**Implementation**:
- Add `onCellClick` handler to `BingoGrid` in `GameDetailsModal`
- Extract article title from clicked cell
- Fetch article summary using existing Wikipedia client utilities
- Display in `ArticleSummaryModal`

**Note**: May need to add article fetching capability to game details modal context, or pass it as a prop.

### Database Considerations

**Indexes**:
- Ensure index on `createdAt` for efficient date filtering
- Compound index: `{ createdAt: -1, score: 1 }` for sorted queries
- Verify existing `{ score: -1, createdAt: 1 }` index is optimal

**Migration**: No database migration needed (fields already exist)

### Dependencies

- Optional: `date-fns` for date formatting (or use native `Intl` API)
- No other external dependencies

### Risk Assessment

**Low Risk**: Mostly frontend changes with minimal backend modifications. Well-scoped feature.

---

## 4. Confetti Animation on Match

### Current State Analysis

**Existing Implementation**:
- `Confetti` component exists and uses Lottie animation
- Currently triggers on `gameWon` state
- Needs to trigger on individual matches

### Architectural Approach

**Decision**: Trigger confetti when a new match is detected in `useGameState`

### Technical Implementation

#### 4.1 Match Detection Enhancement

**Location**: `app/src/features/game/useGameState.ts`

**Changes**:
- Track "new matches" separately from existing matches
- Add `newMatchDetected` state or callback
- Trigger confetti when `updated === true` in `registerNavigation` (line 289)

**Implementation Pattern**:
```typescript
// In registerNavigation, when match is found:
if (updated) {
  // New match detected - trigger confetti
  // Option 1: Return new match info from registerNavigation
  // Option 2: Add callback prop to useGameState
  // Option 3: Add state flag for "new match" that GameScreen watches
}
```

**Recommended Approach**: Add optional callback prop to `useGameState`:
```typescript
interface UseGameStateOptions {
  onMatch?: (articleTitle: string) => void
}

export function useGameState(options?: UseGameStateOptions): [...]
```

#### 4.2 Confetti Integration

**Location**: `app/src/features/game/GameScreen.tsx`

**Changes**:
- Add state for "show confetti on match"
- Listen for match events from `useGameState`
- Trigger confetti animation when match detected
- Ensure confetti doesn't interfere with gameplay

**Implementation**:
```typescript
const [showMatchConfetti, setShowMatchConfetti] = useState(false)

// In useGameState options:
onMatch: (articleTitle) => {
  setShowMatchConfetti(true)
  // Auto-hide after animation
  setTimeout(() => setShowMatchConfetti(false), 2000)
}

// In render:
{showMatchConfetti && <Confetti play={true} onComplete={() => setShowMatchConfetti(false)} />}
```

#### 4.3 Performance Considerations

**Optimizations**:
- Debounce rapid matches (if user matches multiple cells quickly)
- Limit confetti to one animation at a time
- Ensure Lottie animation is optimized (already using DotLottie)
- Test on mobile devices for performance

**Debouncing Strategy**:
- If confetti is already playing, queue next match or skip
- Or: Allow multiple confetti instances (test performance impact)

### Dependencies

- No new dependencies (using existing `Confetti` component)

### Risk Assessment

**Low Risk**: Simple state management change. Performance impact should be minimal.

---

## 5. Game Sharing & Replay System

### Architectural Approach

**Decision**: 
- Store game state in new MongoDB collection `bingopedia.games`
- Use UUID v4 for game IDs (URL-safe)
- Support query parameter routing (`?game={gameId}`) initially (no router library needed)
- Store `gameId` in leaderboard entries for replay capability

### Technical Implementation

#### 5.1 Database Schema

**New Collection**: `bingopedia.games`

**Schema**:
```typescript
interface GameState {
  gameId: string // UUID v4, unique index
  gridCells: string[] // 25 article titles
  startingArticle: string // Article title
  gameType: 'fresh' | 'linked'
  createdAt: Date
  createdBy?: string // Optional username if from replay
}
```

**Indexes**:
- Unique index on `gameId`
- Index on `createdAt` for cleanup/archival

#### 5.2 Backend API

**New Endpoint**: `api/games.ts`

**Endpoints**:
1. **POST `/api/games`** - Create new game state
   - Request: `{ gridCells: string[], startingArticle: string, gameType: 'fresh' | 'linked' }`
   - Response: `{ gameId: string, ...gameState }`
   - Generate UUID v4 for `gameId`

2. **GET `/api/games/:gameId`** - Retrieve game state
   - Response: `{ gameId, gridCells, startingArticle, gameType, createdAt }`
   - 404 if not found

**Implementation**:
- Create `api/games.ts` similar to `api/leaderboard.ts`
- Use `crypto.randomUUID()` or `uuid` package for game IDs
- Add MongoDB collection helper in `api/mongoClient.ts`

#### 5.3 Frontend Game State Management

**Location**: `app/src/features/game/useGameState.ts`

**Changes**:
- Add `gameId` to `GameState` interface
- Add `gameType` to `GameState` interface
- Modify `startNewGame` to accept optional `gameState` parameter
- Add function to load game from `gameId`
- Store `gameId` when creating shareable games

**New Functions**:
```typescript
interface UseGameStateControls {
  // ... existing
  startNewGame: (gameState?: { gridCells, startingArticle, gameId, gameType }) => Promise<void>
  loadGameFromId: (gameId: string) => Promise<void>
  createShareableGame: () => Promise<{ gameId: string, url: string }>
}
```

#### 5.4 Shareable Game Generation

**Location**: `app/src/features/game/StartScreen.tsx`

**Changes**:
- Add "Generate Shareable Game" button
- On click:
  1. Generate new game (using existing `generateBingoSet`)
  2. POST to `/api/games` to store game state
  3. Display shareable link with copy-to-clipboard button
- Link format: `{window.location.origin}?game={gameId}`

**Copy to Clipboard**:
- Use `navigator.clipboard.writeText()` API
- Show success feedback

#### 5.5 URL Parameter Handling

**Location**: `app/src/app/App.tsx`

**Changes**:
- On mount, check for `?game={gameId}` URL parameter
- If present:
  1. Fetch game state from `/api/games/:gameId`
  2. If found, auto-start game with that state
  3. If not found, show error and allow starting fresh game
- Use `URLSearchParams` or `window.location.search` to parse

**Implementation**:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const gameId = params.get('game')
  if (gameId) {
    // Load and start game
    loadGameFromId(gameId).then(() => setView('game'))
  }
}, [])
```

#### 5.6 Replay Feature

**Location**: `app/src/features/leaderboard/GameDetailsModal.tsx`

**Changes**:
- Add "Replay" button to game details modal
- On click:
  1. Extract `gameId` from leaderboard entry (if available)
  2. If `gameId` exists, load game from API
  3. If not, reconstruct from `bingoSquares` and `history` (first item is starting article)
  4. Start new game with that state
  5. Mark as `gameType: 'linked'`

**Game State Reconstruction**:
- If `gameId` not available, use `bingoSquares` array (25 items)
- First item in `history` is starting article
- Reconstruct `GameGridCell[]` from `bingoSquares`

#### 5.7 Leaderboard Integration

**Backend Changes**: `api/leaderboard.ts`

**POST Endpoint Changes**:
- Accept optional `gameId` in request body
- Store `gameId` in leaderboard entry
- Store `gameType` in leaderboard entry (from game state or request)

**Frontend Changes**: `app/src/features/game/WinModal.tsx`

**Changes**:
- Include `gameId` and `gameType` when submitting score
- Pass from `GameState` to submission

### Database Migration

**Leaderboard Collection**:
- Add `gameId?: string` field (optional for backward compatibility)
- Add `gameType: 'fresh' | 'linked'` field (default to 'fresh' for existing entries)
- Migration script to set `gameType: 'fresh'` for all existing entries

**Migration Script**: Create `scripts/migrateLeaderboardGameType.js`
```javascript
// Set gameType to 'fresh' for all existing entries
db.leaderboard.updateMany(
  { gameType: { $exists: false } },
  { $set: { gameType: 'fresh' } }
)
```

### Dependencies

- Optional: `uuid` package for UUID generation (or use `crypto.randomUUID()`)
- No routing library needed (using URL params)

### Risk Assessment

**Medium Risk**: New database collection and API endpoints. Requires careful testing of game state persistence and retrieval. URL parameter handling needs to be robust.

---

## 6. Leaderboard Game Type Separation

### Architectural Approach

**Decision**: Add `gameType` filtering to existing leaderboard API and UI

### Technical Implementation

#### 6.1 Database Schema Updates

**Leaderboard Collection**:
- Add `gameType: 'fresh' | 'linked'` field (from Feature 5)
- Add index on `gameType` for efficient filtering
- Compound index: `{ gameType: 1, score: 1, createdAt: 1 }`

**Migration**: Handled in Feature 5 migration

#### 6.2 Backend API Changes

**Location**: `api/leaderboard.ts`

**GET Endpoint Changes**:
- Add `gameType` query parameter: `'fresh' | 'linked' | 'all'` (default: `'fresh'`)
- Filter MongoDB query by `gameType` if not `'all'`
- Combine with existing filters (date, sort, pagination)

**Implementation**:
```typescript
const gameType = (req.query.gameType as string) || 'fresh'
const filter: any = {}
if (gameType !== 'all') {
  filter.gameType = gameType
}
// Combine with date filters, etc.
```

#### 6.3 Frontend UI Changes

**Location**: `app/src/features/leaderboard/StartScreenLeaderboard.tsx`

**Changes**:
- Add game type filter dropdown/toggle
- Options: "Fresh Games", "Linked Games", "All Games"
- Default: "Fresh Games"
- Update API calls with `gameType` parameter
- Store filter state (component state or localStorage)

**UI Design**:
- Dropdown: "Game Type: Fresh Games" with options
- Or: Toggle buttons/segmented control
- Clear visual indication of active filter

#### 6.4 Default Behavior

**Decision**: Default view shows "Fresh Games" to maintain competitive integrity

**Rationale**: Prevents speedrun advantages from replaying known boards

### Dependencies

- Depends on Feature 5 (Game Sharing) for `gameType` field in database

### Risk Assessment

**Low Risk**: Straightforward filtering addition. Depends on Feature 5 completion.

---

## Implementation Dependencies & Sequencing

### Dependency Graph

```
Feature 1 (Timer Bug Fix)
  └─ Independent, can start immediately

Feature 2 (Light Mode)
  └─ Independent, can start immediately

Feature 3 (Enhanced Leaderboard)
  └─ Independent, can start immediately

Feature 4 (Confetti on Match)
  └─ Independent, can start immediately

Feature 5 (Game Sharing)
  └─ Independent, but enables Feature 6

Feature 6 (Game Type Separation)
  └─ Depends on Feature 5 (needs gameType field)
```

### Recommended Implementation Order

1. **Feature 1** (Timer Bug Fix) - Critical, blocks usability
2. **Feature 4** (Confetti) - Quick win, improves UX
3. **Feature 2** (Light Mode) - High value, independent
4. **Feature 3** (Enhanced Leaderboard) - User-requested, independent
5. **Feature 5** (Game Sharing) - New feature, requires database work
6. **Feature 6** (Game Type Separation) - Depends on Feature 5

### Parallel Work Opportunities

- Features 1, 2, 3, 4 can be worked on in parallel (different engineers)
- Feature 5 and 6 should be sequential (6 depends on 5)
- Backend work (API endpoints) can be done in parallel with frontend work

---

## Technical Decisions Summary

### State Management
- **Timer State**: Separate display state from game logic state
- **Theme State**: React Context with CSS variables
- **Game State**: Extend existing `useGameState` hook

### Routing
- **Decision**: Use URL query parameters (`?game={gameId}`) instead of path-based routing
- **Rationale**: No routing library needed, simpler implementation, works with current SPA setup
- **Future Consideration**: Could migrate to React Router if more routing needs arise

### Database
- **New Collection**: `bingopedia.games` for game state storage
- **Migration Strategy**: Add optional fields to leaderboard, default existing entries
- **Indexing**: Compound indexes for efficient filtering

### Styling
- **Theme System**: CSS custom properties (variables)
- **No CSS-in-JS**: Keep bundle size small, maintain separation of concerns
- **Migration**: Incremental update of CSS files

### API Design
- **RESTful**: Follow existing pattern (`/api/leaderboard`, `/api/games`)
- **Error Handling**: Use existing error response format
- **CORS**: Already configured, no changes needed

---

## Open Questions & Decisions Needed

### 1. Timer Bug Root Cause
**Question**: Should we profile the application to identify exact re-render causes before implementing fixes?

**Recommendation**: Yes, use React DevTools Profiler to identify components re-rendering on timer ticks. This will inform the exact fix needed.

### 2. Game State Storage Strategy
**Question**: Store full game state or reconstruct from leaderboard data?

**Decision**: Store full game state in `bingopedia.games` collection. This provides:
- Reliable replay capability
- Shareable links that work independently
- Better performance (no reconstruction needed)

**Alternative Considered**: Reconstruct from `bingoSquares` and `history` - rejected because:
- Less reliable (data may be incomplete)
- More complex logic
- Doesn't support shareable links well

### 3. URL Routing Approach
**Question**: Query parameters vs. path-based routing?

**Decision**: Query parameters (`?game={gameId}`) for now.

**Rationale**:
- No routing library needed
- Works with current SPA setup
- Simpler implementation
- Can migrate to path-based later if needed

### 4. Database Migration Timing
**Question**: When to run migration for `gameType` field?

**Recommendation**: 
- Run migration before deploying Feature 5/6
- Migration script should be idempotent (safe to run multiple times)
- Test migration on staging/dev database first

### 5. Game State TTL/Archival
**Question**: Should we add TTL or archival for old games?

**Recommendation**: 
- **Phase 1**: No TTL (keep all games)
- **Phase 2**: Add TTL if storage becomes an issue (e.g., 1 year)
- **Monitoring**: Track collection size and growth rate

### 6. Confetti Performance
**Question**: Should we limit confetti to prevent performance issues?

**Recommendation**: 
- Test on mobile devices first
- If performance issues arise, implement debouncing (one confetti at a time)
- Current Lottie implementation should be performant

---

## Testing Strategy

### Unit Tests
- Timer state management
- Theme context and persistence
- Date formatting utilities
- Game state loading/saving

### Integration Tests
- Leaderboard API with filters
- Game API endpoints
- URL parameter parsing
- Game state reconstruction

### E2E Tests
- Full game flow with shareable link
- Replay from leaderboard
- Theme switching
- Timer stability during gameplay

### Performance Tests
- Confetti animation performance
- Leaderboard query performance with filters
- Game state storage/retrieval performance

---

## Deployment Considerations

### Database Migrations
- Run migration scripts before deploying code changes
- Ensure migrations are reversible
- Test on staging first

### API Versioning
- No API versioning needed (backward compatible changes)
- New endpoints (`/api/games`) are additive

### Feature Flags
- Consider feature flags for:
  - Game sharing (if want to test gradually)
  - Light mode (if want A/B test)
- Not required for initial implementation

### Rollback Plan
- Each feature can be rolled back independently
- Database migrations should be reversible
- Keep old code paths until new features are stable

---

## Success Metrics

### Feature 1 (Timer Bug)
- Zero modal closures during timer ticks (10+ second test)
- Scroll position maintained during timer updates
- No focus loss during keyboard navigation

### Feature 2 (Light Mode)
- Theme preference persists across sessions
- All components readable in light mode
- WCAG AA contrast ratios met

### Feature 3 (Enhanced Leaderboard)
- All sort options work correctly
- Date filters return correct results
- Article summaries load in game details

### Feature 4 (Confetti)
- Confetti plays on every new match
- No performance degradation
- Animation doesn't interfere with gameplay

### Feature 5 (Game Sharing)
- Shareable links work correctly
- Game state persists and retrieves correctly
- Replay feature works from leaderboard

### Feature 6 (Game Type Separation)
- Filter correctly separates fresh vs. linked games
- Default view shows fresh games
- API filtering works correctly

---

## Appendix: File Change Summary

### New Files
- `app/src/shared/theme/ThemeContext.tsx`
- `app/src/shared/theme/theme.css`
- `app/src/shared/components/ThemeToggle.tsx`
- `api/games.ts`
- `scripts/migrateLeaderboardGameType.js`

### Modified Files
- `app/src/features/game/useGameState.ts` (timer fix, game loading, confetti trigger)
- `app/src/features/game/useGameTimer.ts` (timer optimization)
- `app/src/features/article-viewer/ArticleViewer.tsx` (scroll preservation)
- `app/src/features/game/GameScreen.tsx` (confetti on match, modal stability)
- `app/src/features/game/StartScreen.tsx` (shareable game generation)
- `app/src/features/leaderboard/StartScreenLeaderboard.tsx` (sorting, filtering, date display)
- `app/src/features/leaderboard/GameDetailsModal.tsx` (replay, article summaries)
- `app/src/app/App.tsx` (URL parameter handling, theme provider)
- `app/src/app/AppLayout.tsx` (theme toggle)
- `api/leaderboard.ts` (gameType filtering, date filtering)
- `api/mongoClient.ts` (games collection helper)
- All CSS files (theme variables)

### Database Changes
- New collection: `bingopedia.games`
- Leaderboard collection: Add `gameType` and `gameId` fields
- New indexes on both collections

---

## Conclusion

This architectural plan provides a comprehensive roadmap for implementing all six features specified in `FEATURE_SPECIFICATIONS.md`. The plan addresses technical decisions, dependencies, risks, and implementation considerations for each feature.

Key architectural decisions:
- CSS variables for theming (no CSS-in-JS)
- Query parameters for routing (no router library)
- Full game state storage (not reconstruction)
- Separate timer display state (performance optimization)

The plan is designed to be implemented incrementally, with clear dependencies and parallel work opportunities identified.

