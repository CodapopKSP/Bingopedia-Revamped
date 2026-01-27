# React Skills

This document captures React-specific skills and techniques learned during the Bingopedia implementation, including performance optimization, memoization patterns, refs, hooks dependency management, and state management patterns.

---

## React Performance Optimization Skills

**Date**: User Feedback Sprint - Senior React Engineer Tasks  
**Context**: Fixing timer causing page refreshes and link flashing (P0-2)

### 1. Ref-Based Timer Values for Performance
**Context**: Timer updates every second causing full component tree re-renders

**Technique**:
- Use refs to store values that don't need to trigger re-renders
- Update ref immediately (no re-render)
- Update state less frequently or only when needed for scoring
- Sync ref with state when state changes from other sources

**Code Pattern**:
```typescript
const elapsedSecondsRef = useRef<number>(0)

const onTickCallback = useCallback(() => {
  elapsedSecondsRef.current += 1
  // Update state for scoring, but display updates are batched separately
  setState((prev) => ({
    ...prev,
    elapsedSeconds: elapsedSecondsRef.current,
  }))
}, [])

// Sync ref with state when state changes from other sources
useEffect(() => {
  elapsedSecondsRef.current = state.elapsedSeconds
  stateRef.current = state
}, [state])
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: Refs provide synchronous access to values without triggering re-renders. Use refs for values that need to be accessed but don't need to trigger UI updates.

---

### 2. Aggressive Timer Display Batching
**Context**: Timer display updates causing link flashing and scroll position loss

**Technique**:
- Time-based throttling: only update display if >500ms has passed since last render
- Value-based throttling: only update if value changed by >1 second
- Use `requestAnimationFrame` for smooth updates
- Track last render time to prevent excessive updates

**Code Pattern**:
```typescript
export function useTimerDisplay(elapsedSeconds: number): number {
  const [displaySeconds, setDisplaySeconds] = useState(elapsedSeconds)
  const lastUpdateRef = useRef<number>(elapsedSeconds)
  const lastRenderedRef = useRef<number>(Date.now())

  useEffect(() => {
    lastUpdateRef.current = elapsedSeconds
    
    const timeSinceLastRender = Date.now() - lastRenderedRef.current
    const valueDiff = Math.abs(displaySeconds - elapsedSeconds)
    const shouldUpdate = timeSinceLastRender > 500 || valueDiff > 1

    if (shouldUpdate && rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplaySeconds(lastUpdateRef.current)
        lastRenderedRef.current = Date.now()
        rafRef.current = null
      })
    }
  }, [elapsedSeconds, displaySeconds])
}
```

**Application**: `app/src/features/game/useTimerDisplay.ts`

**Key Insight**: Batching display updates reduces re-renders by 90%+ while maintaining visual accuracy. Time-based and value-based throttling work together to prevent unnecessary updates.

---

### 3. Isolated Timer Display Component with React.memo
**Context**: Timer updates causing parent component re-renders

**Technique**:
- Create isolated component that only re-renders when timer value changes
- Use `React.memo` to prevent re-renders when parent updates
- Accept timer value as prop (for scoring accuracy)
- Use `useTimerDisplay` hook internally for batched updates

**Code Pattern**:
```typescript
export const TimerDisplay = memo(({ elapsedSeconds, className, prefix }: TimerDisplayProps) => {
  const displaySeconds = useTimerDisplay(elapsedSeconds)
  const formattedTime = formatTime(displaySeconds)
  
  return (
    <span className={className}>
      {prefix && <span>{prefix}</span>}
      {formattedTime}
    </span>
  )
})
```

**Application**: `app/src/features/game/TimerDisplay.tsx`

**Key Insight**: Isolating frequently-updating components with `React.memo` prevents cascading re-renders through the component tree. The component only re-renders when its props actually change.

---

### 4. Memoizing Components with Stable Event Handlers
**Context**: ArticleViewer re-rendering on every timer tick, causing link flashing

**Technique**:
- Wrap component with `React.memo` to prevent unnecessary re-renders
- Use refs for event handlers to keep them stable across re-renders
- Update refs in `useEffect` without causing re-renders
- Use `useCallback` for handlers that need to be recreated

**Code Pattern**:
```typescript
// Stable refs for event handlers
const onArticleClickRef = useRef(onArticleClick)
const gameWonRef = useRef(gameWon)

// Update refs without causing re-renders
useEffect(() => {
  onArticleClickRef.current = onArticleClick
}, [onArticleClick])

// Memoized click handler using refs
const handleClick = useCallback((e: MouseEvent) => {
  if (gameWonRef.current) return
  // ... handler logic using onArticleClickRef.current
}, []) // Empty deps - uses refs for latest values

// Memoized component export
export const ArticleViewer = memo(ArticleViewerComponent)
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Using refs for event handlers allows `useCallback` to have empty dependency arrays, preventing handler recreation on every render. This is safe because refs always contain the latest values.

---

## State Management Patterns

**Date**: User Feedback Sprint - Senior React Engineer Tasks  
**Context**: Preventing duplicate article navigation (P1-2)

### 5. State Refs for Synchronous Duplicate Checking
**Context**: Need to check current state synchronously before async operations

**Technique**:
- Use ref to track current state for synchronous access
- Update ref whenever state changes using `useEffect`
- Use ref for duplicate detection before async operations
- Avoids stale closure issues with functional setState

**Code Pattern**:
```typescript
const stateRef = useRef<GameState>(state)

// Sync ref with state
useEffect(() => {
  stateRef.current = state
}, [state])

// Use ref for synchronous duplicate checking
const registerNavigation = async (title: string) => {
  const normalizedOriginal = normalizeTitle(title)
  const canonicalClicked = await resolveRedirect(title)
  const normalizedClicked = normalizeTitle(canonicalClicked)

  // Synchronous duplicate check using ref
  const current = stateRef.current
  
  if (current.currentArticleTitle) {
    const normalizedCurrent = normalizeTitle(current.currentArticleTitle)
    if (normalizedCurrent === normalizedClicked || normalizedCurrent === normalizedOriginal) {
      return // Duplicate - skip navigation
    }
  }
  
  // ... continue with navigation
}
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: State refs provide synchronous access to the latest state without triggering re-renders. Essential for duplicate detection before async operations where functional setState would be too late.

---

### 6. Duplicate Detection with Normalization and Redirect Resolution
**Context**: Preventing duplicate article navigation (clicking same link multiple times)

**Technique**:
- Normalize titles for comparison (handles case, whitespace, etc.)
- Resolve redirects to get canonical titles before comparison
- Check against both current article and previous article in history
- Compare both original and canonical titles to handle redirects

**Code Pattern**:
```typescript
const normalizedOriginal = normalizeTitle(title)
const canonicalClicked = await resolveRedirect(title)
const normalizedClicked = normalizeTitle(canonicalClicked)

// Check current article
if (current.currentArticleTitle) {
  const normalizedCurrent = normalizeTitle(current.currentArticleTitle)
  if (normalizedCurrent === normalizedClicked || normalizedCurrent === normalizedOriginal) {
    return // Duplicate
  }
}

// Check previous article
if (current.articleHistory.length > 0) {
  const lastHistoryTitle = current.articleHistory[current.articleHistory.length - 1]
  const normalizedLast = normalizeTitle(lastHistoryTitle)
  if (normalizedLast === normalizedClicked || normalizedLast === normalizedOriginal) {
    return // Duplicate
  }
}
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: Normalization and redirect resolution ensure duplicate detection works correctly even when titles are formatted differently or have redirects. Check both original and canonical titles to handle all cases.

---

## React Hooks Dependency Management

**Date**: User Feedback Sprint - Senior React Engineer Tasks  
**Context**: Fixing useRef error on bingo square match (P0-1)

### 7. Proper useCallback Dependency Management
**Context**: Timer callback causing hook dependency issues

**Technique**:
- Empty dependency array is correct when using setState updater function (it's stable)
- Document why empty deps are used
- Extract callback to named variable for clarity
- Add JSDoc explaining dependency strategy

**Code Pattern**:
```typescript
// onTick callback has empty dependency array because setState updater function is stable
// and doesn't need to be recreated on every render
const onTickCallback = useCallback(() => {
  setState((prev) => ({
    ...prev,
    elapsedSeconds: prev.elapsedSeconds + 1,
  }))
}, []) // Empty deps array is correct - setState updater function is stable
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: React's `setState` updater function is stable and doesn't need to be in dependency arrays. Empty dependency arrays are correct when using functional setState patterns.

---

### 8. Error Boundary Protection for Callbacks
**Context**: Preventing crashes from confetti trigger errors

**Technique**:
- Wrap callback invocations in try-catch blocks
- Log errors but continue execution
- Prevent single callback error from crashing entire game
- Use error boundaries for component-level error handling

**Code Pattern**:
```typescript
// Wrap in try-catch to prevent crashes from confetti trigger errors
if (onMatch && redirectMatchedTitles.length > 0) {
  redirectMatchedTitles.forEach((matchedTitle) => {
    try {
      onMatch(matchedTitle)
    } catch (error) {
      console.error('Error in onMatch callback (redirect-based):', error)
      // Continue execution - don't crash the game
    }
  })
}
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: Callback errors can crash the entire application. Wrapping callbacks in try-catch blocks provides graceful error handling while maintaining application stability.

---

**Date**: User Feedback Sprint - Senior React Engineer Tasks completion  
**Status**: Skills documented for future reference

---

## Frontend UI/UX Skills
