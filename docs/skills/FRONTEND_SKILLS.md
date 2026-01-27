# Frontend Skills

This document captures frontend skills and techniques learned during the Bingopedia implementation, including React hooks patterns, state management, performance optimization, component patterns, and error recovery.

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

## Frontend API Client Patterns

### 17. Direct API Path Construction Pattern
**Context**: Fixing 404 errors from fragile URL manipulation (BE-FIX-2)

**Technique**:
- Use direct absolute paths instead of manipulating base URLs
- Avoid string replacement on API base URLs (fragile and error-prone)
- Use `new URL()` constructor with absolute paths
- Remove dependencies on base URL configuration when not needed

**Code Pattern**:
```typescript
// ❌ Fragile approach (avoid)
const apiBase = getApiBaseUrl().replace('/leaderboard', '')
const url = new URL(`${apiBase}/games`, window.location.origin)

// ✅ Direct approach (preferred)
const url = new URL('/api/games', window.location.origin)
```

**Application**: `app/src/shared/api/gamesClient.ts`

**Key Insight**: When API paths are known and stable, use direct paths instead of manipulating base URLs. This is more reliable and easier to understand. Only use base URL configuration when you need dynamic API endpoints.

---

### 18. Error Response Parsing Pattern
**Context**: Improving error message extraction from API responses (BE-FIX-2)

**Technique**:
- Handle structured error responses with nested error objects
- Use optional chaining to safely access nested properties
- Provide fallback error messages
- Handle both structured (`{ error: { message: ... } }`) and simple (`{ message: ... }`) error formats

**Code Pattern**:
```typescript
try {
  const errorData = await response.json()
  if (errorData.error || errorData.message) {
    // Handle nested error structure
    errorMessage = errorData.error?.message || errorData.message || errorMessage
  }
} catch {
  // Fallback for non-JSON responses
  errorMessage = `Failed (HTTP ${response.status})`
}
```

**Application**: `app/src/shared/api/gamesClient.ts`

**Key Insight**: API error responses can have different structures. Use optional chaining and fallbacks to handle both nested and flat error structures safely.

---

## Retry Patterns and Error Recovery

### 1. Component-Level Retry Strategy
**Context**: Implementing automatic retry for article loading failures (User Feedback Sprint - P2-2)

**Technique**:
- Implement retry logic at component level in addition to API-level retries
- Use state variables to track retry attempts (`retryCount`, `isRetrying`)
- Schedule retries with `setTimeout` and proper cleanup
- Show retry status in UI for better user experience
- Handle edge cases: article changes during retry, component unmount, rapid navigation

**Code Pattern**:
```typescript
const [retryCount, setRetryCount] = useState(0)
const [isRetrying, setIsRetrying] = useState(false)
const retryTimeoutRef = useRef<number | null>(null)

const MAX_RETRIES = 3
const RETRY_DELAYS: readonly number[] = [0, 1000, 2000] as const

const loadArticle = async (attemptNumber: number = 0) => {
  try {
    const result = await fetchWikipediaArticle(articleTitle)
    // Success - reset retry state
    setRetryCount(0)
    setIsRetrying(false)
  } catch (err) {
    if (attemptNumber < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attemptNumber] ?? 2000
      setIsRetrying(true)
      setRetryCount(attemptNumber + 1)
      
      retryTimeoutRef.current = window.setTimeout(() => {
        loadArticle(attemptNumber + 1)
      }, delay)
    } else {
      // All retries failed - show error
      setError(errorMessage)
    }
  }
}

// Cleanup on unmount or article change
useEffect(() => {
  return () => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }
}, [articleTitle])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insights**:
- Component-level retries complement API-level retries for different failure scenarios
- Always clean up timeouts to prevent memory leaks
- Show retry status to users for better UX
- Cancel retries when article changes to prevent race conditions
- Use refs for timeout IDs to avoid stale closures

---

### 2. Timeout Management and Cleanup
**Context**: Managing retry timeouts in React components

**Technique**:
- Store timeout IDs in refs (not state) to avoid unnecessary re-renders
- Always clear timeouts in `useEffect` cleanup function
- Verify article hasn't changed before executing retry callback
- Handle component unmount gracefully

**Code Pattern**:
```typescript
const retryTimeoutRef = useRef<number | null>(null)

// Schedule retry
retryTimeoutRef.current = window.setTimeout(() => {
  // Verify article hasn't changed
  const currentNormalized = normalizeTitle(articleTitle)
  if (currentNormalized === normalized) {
    loadArticle(attemptNumber + 1)
  } else {
    // Article changed - cancel retry
    setRetryCount(0)
    setIsRetrying(false)
  }
}, delay)

// Cleanup
useEffect(() => {
  return () => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }
}, [articleTitle])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insights**:
- Use refs for timeout IDs to avoid re-renders
- Always verify state hasn't changed before executing delayed callbacks
- Cleanup is critical to prevent memory leaks and race conditions
- Check for component/article changes in timeout callbacks

---

### 3. Retry State Management
**Context**: Tracking retry attempts and showing status to users

**Technique**:
- Separate state for retry count and retry status
- Reset retry state on successful load or article change
- Show retry status in loading UI
- Keep loading state true during retry delays

**Code Pattern**:
```typescript
const [retryCount, setRetryCount] = useState(0)
const [isRetrying, setIsRetrying] = useState(false)

// In loading UI:
{loading && (
  <div className="bp-article-loading">
    <div className="bp-spinner"></div>
    <p>
      {isRetrying 
        ? `Loading article... (Retry ${retryCount}/${MAX_RETRIES})`
        : 'Loading article...'}
    </p>
  </div>
)}
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insights**:
- Separate retry state from loading state for better UX
- Show retry progress to users so they know the system is working
- Reset retry state appropriately (on success, on article change, on error)

---

### 4. Handling Race Conditions in Async Operations
**Context**: Preventing stale retries when article changes during retry delay

**Technique**:
- Check if article has changed before executing retry
- Cancel pending retries when article changes
- Use normalized titles for comparison
- Verify state in both timeout callback and retry function

**Code Pattern**:
```typescript
const loadArticle = async (attemptNumber: number = 0) => {
  // If article title changed during retry, cancel the retry
  const currentNormalized = normalizeTitle(articleTitle)
  if (attemptNumber > 0 && currentNormalized !== normalized) {
    // Article changed - cancel retry
    setRetryCount(0)
    setIsRetrying(false)
    setLoading(false)
    return
  }
  
  // ... rest of retry logic
}

// In timeout callback:
retryTimeoutRef.current = window.setTimeout(() => {
  const currentNormalized = normalizeTitle(articleTitle)
  if (currentNormalized === normalized) {
    loadArticle(attemptNumber + 1)
  } else {
    // Article changed - cancel retry
    setRetryCount(0)
    setIsRetrying(false)
  }
}, delay)
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insights**:
- Always verify state hasn't changed before executing delayed callbacks
- Check both in the retry function and timeout callback
- Use normalized values for comparison to handle edge cases
- Cancel operations gracefully when state changes

---

**Date**: User Feedback Sprint - Frontend Engineer Tasks (P2-2)  
**Status**: Skills documented for future reference

