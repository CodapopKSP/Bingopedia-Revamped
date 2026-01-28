# React Skills

This document captures React-specific skills and techniques learned during the Bingopedia implementation, including performance optimization, memoization patterns, refs, hooks dependency management, state management patterns, and preventing cascading re-renders.

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

## Preventing Cascading Re-renders from Timer Updates

**Date**: Sprint 3 - Critical Bug Fix  
**Context**: Fixing link flashing and click delay caused by timer re-renders every second

### 10. Cascading Re-render Prevention Pattern
**Context**: Timer updates every second caused entire component tree to re-render, causing link flashing and click delays

**Problem**:
- Timer updates `elapsedSeconds` every second → `useGameState` re-renders
- `registerNavigation` function recreated (not memoized)
- `controls` object recreated (depends on `registerNavigation`)
- `handleArticleClick` in GameScreen recreated (depends on `registerNavigation`)
- `onMatch` callback recreated (not memoized in App.tsx)
- ArticleViewer re-rendered (props changed)
- Links flashed and click handlers re-attached (causing delays)

**Technique**:
- Memoize ALL callbacks in the chain with `useCallback`
- Memoize options objects passed to hooks with `useMemo`
- Use custom comparison function in `React.memo` to prevent unnecessary re-renders
- Ensure dependency arrays only include values that actually need to trigger recreation

**Code Pattern**:
```typescript
// 1. Memoize callback in parent component (App.tsx)
const onMatch = useCallback((title: string) => {
  if (onMatchRef.current) {
    onMatchRef.current(title)
  }
}, []) // Empty deps - uses ref for latest value

// 2. Memoize options object passed to hook
const gameStateOptions = useMemo(() => ({ onMatch }), [onMatch])

// 3. Memoize function in hook (useGameState.ts)
const registerNavigation = useCallback(async (title: string) => {
  // ... function body uses refs for state access
}, [onMatch]) // Only depends on onMatch

// 4. Memoize controls object
const controls = useMemo(
  () => ({
    registerNavigation,
    // ... other functions
  }),
  [registerNavigation, /* other deps */]
)

// 5. Memoize callback in child component (GameScreen.tsx)
const handleArticleClick = useCallback(async (title: string) => {
  await registerNavigation(title)
}, [registerNavigation])

// 6. Memoize computed props
const isPausedForLoading = useMemo(() => {
  return !state.timerRunning && articleLoading
}, [state.timerRunning, articleLoading])

// 7. Use custom comparison in React.memo (ArticleViewer.tsx)
export const ArticleViewer = memo(ArticleViewerComponent, (prevProps, nextProps) => {
  return (
    prevProps.articleTitle === nextProps.articleTitle &&
    prevProps.gameWon === nextProps.gameWon &&
    prevProps.isPausedForLoading === nextProps.isPausedForLoading &&
    prevProps.onArticleClick === nextProps.onArticleClick &&
    prevProps.onLoadingChange === nextProps.onLoadingChange &&
    prevProps.onArticleLoadFailure === nextProps.onArticleLoadFailure
  )
})
```

**Key Insights**:
- Every function in the callback chain must be memoized, or the entire chain breaks
- Options objects passed to hooks should be memoized to prevent hook re-execution
- Custom comparison functions in `React.memo` provide fine-grained control over re-renders
- Empty dependency arrays are safe when using refs for latest values
- Timer updates should NOT cause re-renders of components that don't display timer

**Debugging Checklist**:
1. Check if parent component re-renders on timer tick
2. Check if callbacks are memoized with `useCallback`
3. Check if options objects are memoized with `useMemo`
4. Check if child components use `React.memo` with custom comparison
5. Verify dependency arrays only include values that should trigger recreation
6. Use React DevTools Profiler to identify unnecessary re-renders

**Application**: 
- `app/src/app/App.tsx` - Memoize `onMatch` and options
- `app/src/features/game/useGameState.ts` - Memoize `registerNavigation` and controls
- `app/src/features/game/GameScreen.tsx` - Memoize `handleArticleClick` and computed props
- `app/src/features/article-viewer/ArticleViewer.tsx` - Custom `React.memo` comparison

**Date**: Sprint 3 - Critical Bug Fix  
**Status**: Skills documented for future reference

---

### 11. Best Practices for Preventing Timer-Related Re-renders

**Guidelines**:
1. **Always memoize callbacks passed to child components** - Use `useCallback` with correct dependencies
2. **Memoize options objects passed to hooks** - Use `useMemo` to prevent hook re-execution
3. **Use custom comparison in React.memo** - Fine-grained control over when components re-render
4. **Memoize computed props** - Values derived from state should use `useMemo`
5. **Use refs for values that don't need to trigger re-renders** - Timer values, latest callbacks, etc.
6. **Verify callback chains are stable** - Every function in the chain must be memoized

**Prevention Checklist**:
- [ ] All callbacks use `useCallback` with correct dependencies
- [ ] Options objects passed to hooks use `useMemo`
- [ ] Child components use `React.memo` with custom comparison if needed
- [ ] Computed props use `useMemo`
- [ ] Timer updates don't cause unnecessary re-renders (verify with React DevTools)
- [ ] Event handlers are stable (don't recreate on every render)

**Debugging Steps**:
1. Use React DevTools Profiler to identify components re-rendering on timer ticks
2. Check if callbacks are being recreated (compare function references)
3. Verify dependency arrays are correct (not missing deps, not including unnecessary deps)
4. Check if options objects are being recreated
5. Verify `React.memo` comparison functions are working correctly

**Date**: Sprint 3 - Critical Bug Fix  
**Status**: Skills documented for future reference

---

## Navigation Reliability Patterns

**Date**: Sprint 3 - Article Navigation Reliability & Table of Contents Implementation  
**Context**: Fixing navigation race conditions and first-click reliability issues

### 9. Navigation Lock Pattern with Refs
**Context**: Preventing concurrent navigations from rapid clicks causing incorrect URL navigation

**Technique**:
- Use ref for synchronous navigation lock check (no state update delay)
- Set lock immediately before async operations
- Clear lock in finally block (ensures unlock even on errors)
- Check lock synchronously at start of navigation function

**Code Pattern**:
```typescript
// In useGameState.ts
const isNavigatingRef = useRef<boolean>(false)

const registerNavigation = async (title: string) => {
  // Synchronous check using ref (no state update delay)
  if (isNavigatingRef.current) {
    console.log('Navigation already in progress, ignoring click')
    return
  }
  
  // Set lock immediately (before any async operations)
  isNavigatingRef.current = true
  
  try {
    // ... navigation logic ...
  } finally {
    // Always clear lock, even on error
    isNavigatingRef.current = false
  }
}
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: Refs provide synchronous access for lock checks without state update delays. Using refs prevents race conditions where state updates might not be processed before the next click arrives.

---

### 10. Click Debouncing with Refs
**Context**: Preventing rapid clicks from triggering multiple navigations

**Technique**:
- Use ref to track last click timestamp (synchronous access)
- Compare current time with last click time
- Ignore clicks within debounce delay (100ms)
- Still provide visual feedback even if debounced

**Code Pattern**:
```typescript
// In ArticleViewer.tsx
const lastClickTimeRef = useRef<number>(0)
const DEBOUNCE_DELAY = 100 // milliseconds

const handleClick = useCallback((e: MouseEvent) => {
  // Debounce check: ignore clicks within DEBOUNCE_DELAY of previous click
  const now = Date.now()
  if (now - lastClickTimeRef.current < DEBOUNCE_DELAY) {
    e.preventDefault()
    e.stopPropagation()
    // Still provide visual feedback even if debounced
    const link = target.closest('a')
    if (link) {
      link.classList.add('bp-link-clicked')
      setTimeout(() => link.classList.remove('bp-link-clicked'), 200)
    }
    return
  }
  lastClickTimeRef.current = now
  
  // ... rest of click handling ...
}, []) // Empty deps - uses refs for latest values
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Debouncing with refs prevents rapid clicks while maintaining responsive UI feedback. The ref provides synchronous timestamp access without triggering re-renders.

---

### 11. Pre-Display Redirect Resolution Pattern
**Context**: Preventing article title switching during display by resolving redirects before fetching article content

**Technique**:
- Resolve redirects BEFORE fetching article content
- Use Promise.race with timeout to prevent indefinite hangs
- Set loading state and current article title with resolved title immediately
- Fallback to original title if redirect resolution fails or times out

**Code Pattern**:
```typescript
// In useGameState.ts - registerNavigation()
const registerNavigation = async (title: string) => {
  // ... navigation lock check ...
  
  try {
    // STEP 1: Resolve redirect FIRST (before fetching article)
    let resolvedTitle: string
    try {
      resolvedTitle = await Promise.race([
        resolveRedirect(title),
        new Promise<string>((resolve) => 
          setTimeout(() => resolve(title), 5000) // 5 second timeout
        )
      ])
    } catch (error) {
      // On error, fallback to original title
      console.warn('Redirect resolution failed, using original title:', error)
      resolvedTitle = title
    }
    
    // STEP 2: Set loading state with resolved title (after redirect resolution)
    setState((prev) => ({
      ...prev,
      articleLoading: true,
      currentArticleTitle: resolvedTitle // Use resolved title immediately
    }))
    
    // STEP 3: Article fetch will happen in ArticleViewer using resolvedTitle
    // The resolved title is already set in state, so ArticleViewer will fetch the correct article
  } finally {
    // Clear navigation lock
  }
}
```

**Application**: `app/src/features/game/useGameState.ts`

**Key Insight**: Resolving redirects before article fetch prevents title switching during display. Promise.race with timeout ensures redirect resolution doesn't cause indefinite hangs. Setting state with resolved title immediately provides consistent UI.

---

### 12. Stable Event Handler Attachment Pattern
**Context**: Ensuring first-click reliability by attaching handlers immediately when content is available

**Technique**:
- Use useEffect with content dependency to attach handler when content is available
- Handler is memoized with useCallback (empty deps, uses refs for latest values)
- Handler uses refs to access latest callbacks without causing re-renders
- Attach handler immediately when content is set (not delayed)

**Code Pattern**:
```typescript
// In ArticleViewer.tsx
// Stable refs for click handler
const onArticleClickRef = useRef(onArticleClick)
const gameWonRef = useRef(gameWon)

// Update refs without causing re-renders
useEffect(() => {
  onArticleClickRef.current = onArticleClick
}, [onArticleClick])

// Memoized click handler using refs
const handleClick = useCallback((e: MouseEvent) => {
  if (gameWonRef.current) return
  // ... handler logic using onArticleClickRef.current ...
}, []) // Empty deps - uses refs for latest values

// Attach handler immediately when content is available
useEffect(() => {
  if (!contentRef.current || !content) return
  
  const container = contentRef.current
  container.addEventListener('click', handleClick)
  return () => {
    container.removeEventListener('click', handleClick)
  }
}, [content, handleClick])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Attaching handlers immediately when content is available ensures first-click reliability. Using refs in handlers allows empty dependency arrays, preventing unnecessary handler recreations and re-attachments.

---

### 13. Modal State Management with useCallback
**Context**: Implementing Table of Contents modal with proper state management

**Technique**:
- Use useState for modal visibility state
- Memoize toggle handler with useCallback (use functional setState to avoid dependencies)
- Memoize navigation handler with useCallback
- Ensure handlers are stable to prevent unnecessary re-renders

**Code Pattern**:
```typescript
// In ArticleViewer.tsx
const [showToc, setShowToc] = useState(false)

// Memoized toggle handler (uses functional setState to avoid showToc dependency)
const handleTocToggle = useCallback(() => {
  setShowToc((prev) => !prev)
}, [])

// Memoized navigation handler
const handleTocNavigate = useCallback((sectionId: string) => {
  if (contentRef.current) {
    const element = contentRef.current.querySelector(`#${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setShowToc(false) // Close modal after navigation
    }
  }
}, [])

// Modal event handlers
// Backdrop click: onClick={() => setShowToc(false)}
// Content click: onClick={(e) => e.stopPropagation()}
// Close button: onClick={() => setShowToc(false)}
// ESC key: useEffect with keyboard event listener
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Using functional setState in useCallback allows empty dependency arrays, keeping handlers stable. This prevents unnecessary re-renders while maintaining correct state updates.

---

**Date**: Sprint 3 - Article Navigation Reliability & Table of Contents Implementation completion  
**Status**: Skills documented for future reference

---

## Robust Section Scrolling Patterns

**Date**: Sprint 4 - Table of Contents Scrolling Reliability Improvements  
**Context**: Fixing ToC scrolling failures with multiple ID matching strategies

### 14. Multiple ID Variant Matching for Robust Scrolling
**Context**: Section IDs in HTML may not match ToC IDs due to URL encoding, case differences, or separator variations (hyphens vs underscores)

**Technique**:
- Generate multiple ID variants to try (original, decoded, normalized)
- Try each variant with CSS.escape for safety
- Prefer section heading elements (h1-h6) over generic elements
- Match against both `id` and `name` attributes
- Use case-insensitive matching as fallback
- Final fallback: match by text content

**Code Pattern**:
```typescript
const handleTocNavigate = useCallback((sectionId: string) => {
  if (!contentRef.current) return
  
  // Generate ID variants to try
  const idVariants = [
    sectionId, // Original (already normalized from extraction)
    decodeURIComponent(sectionId), // URL-decoded version
    sectionId.toLowerCase(), // Ensure lowercase
    sectionId.replace(/_/g, '-'), // Hyphen-normalized
    sectionId.replace(/-/g, '_'), // Underscore-normalized
  ]
  
  const uniqueVariants = Array.from(new Set(idVariants.filter(id => id && id.trim())))
  
  let element: Element | null = null
  
  // Strategy 1: Try each variant, prefer headings
  for (const id of uniqueVariants) {
    try {
      const escapedId = CSS.escape(id)
      // Prefer section headings first
      element = contentRef.current.querySelector(
        `h1#${escapedId}, h2#${escapedId}, h3#${escapedId}, h4#${escapedId}, h5#${escapedId}, h6#${escapedId}`
      )
      if (element) break
      
      // Fallback to any element with id attribute
      element = contentRef.current.querySelector(`#${escapedId}`)
      if (element) break
      
      // Try name attribute
      element = contentRef.current.querySelector(`[name="${escapedId}"]`)
      if (element) break
    } catch (e) {
      continue // CSS.escape failed, try next variant
    }
  }
  
  // Strategy 2: Case-insensitive matching
  if (!element) {
    const allElements = contentRef.current.querySelectorAll('[id], [name]')
    const normalizedSectionId = normalizeSectionIdForMatching(sectionId)
    
    for (const el of Array.from(allElements)) {
      const elId = el.getAttribute('id') || el.getAttribute('name') || ''
      const normalizedElId = normalizeSectionIdForMatching(elId)
      
      if (normalizedElId === normalizedSectionId) {
        // Prefer heading elements
        if (el.tagName.match(/^H[1-6]$/i)) {
          element = el
          break
        } else if (!element) {
          element = el // Store as fallback
        }
      }
    }
  }
  
  // Strategy 3: Text content matching (last resort)
  if (!element) {
    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const normalizedSectionId = normalizeSectionIdForMatching(sectionId)
    
    for (const heading of Array.from(headings)) {
      const headingText = heading.textContent?.trim() || ''
      const normalizedHeadingText = normalizeSectionIdForMatching(headingText)
      
      if (normalizedHeadingText === normalizedSectionId) {
        element = heading
        break
      }
    }
  }
  
  if (element) {
    requestAnimationFrame(() => {
      if (element && contentRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }
}, [normalizeSectionIdForMatching])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Multiple matching strategies with fallbacks ensure scrolling works even when IDs don't match exactly. Preferring heading elements ensures scrolling to the correct section structure. Using `requestAnimationFrame` ensures DOM is ready before scrolling.

---

### 15. Development-Only Debug Logging Pattern
**Context**: Need to debug scrolling issues without impacting production performance

**Technique**:
- Use `process.env.NODE_ENV === 'development'` checks for all debug logs
- Use `console.debug` for informational logs, `console.warn` for failures
- Support optional verbose mode via localStorage flag
- Log section IDs being searched, matched variants, and available IDs

**Code Pattern**:
```typescript
const handleTocNavigate = useCallback((sectionId: string) => {
  if (!contentRef.current) return
  
  // Development-only debug logging
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[ToC] Navigating to section: ${sectionId}`)
  }
  
  // ... ID matching logic ...
  
  if (element) {
    if (process.env.NODE_ENV === 'development') {
      const elementId = element.id || element.getAttribute('name') || 'no-id'
      console.debug(`[ToC] Found section element: ${elementId} (matched variant: ${matchedVariant})`)
      
      // Optional verbose mode
      if (localStorage.getItem('toc-debug') === 'true') {
        const allIds = Array.from(contentRef.current.querySelectorAll('[id]'))
          .map(el => el.id)
          .filter(id => id)
        console.debug(`[ToC] Available section IDs:`, allIds)
      }
    }
    // ... scroll logic ...
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ToC] Section not found: ${sectionId}`)
      
      // Optional verbose mode
      if (localStorage.getItem('toc-debug') === 'true') {
        const allIds = Array.from(contentRef.current.querySelectorAll('[id]'))
          .map(el => el.id)
          .filter(id => id)
        console.debug(`[ToC] Available section IDs:`, allIds)
      }
    }
  }
}, [normalizeSectionIdForMatching])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Development-only logging helps debug issues without performance impact in production. Optional verbose mode via localStorage allows deeper debugging when needed. Using consistent prefixes (`[ToC]`) makes logs easier to filter.

---

### 16. ID Normalization for Consistent Matching
**Context**: Section IDs may have different formats (URL-encoded, with spaces, hyphens, underscores)

**Technique**:
- Decode URL encoding (`decodeURIComponent`)
- Normalize separators (convert underscores and spaces to hyphens)
- Convert to lowercase for case-insensitive matching
- Remove leading/trailing separators

**Code Pattern**:
```typescript
const normalizeSectionIdForMatching = useCallback((id: string): string => {
  if (!id) return ''
  
  // Decode URL encoding (e.g., %20 → space, %27 → apostrophe)
  let normalized = decodeURIComponent(id)
  
  // Normalize separators: convert underscores and spaces to hyphens
  normalized = normalized.replace(/[_\s]+/g, '-')
  
  // Convert to lowercase for consistent matching
  normalized = normalized.toLowerCase()
  
  // Remove leading/trailing hyphens
  normalized = normalized.replace(/^-+|-+$/g, '')
  
  return normalized
}, [])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Normalizing IDs before comparison ensures consistent matching regardless of how the ID is formatted in the HTML. This handles Wikipedia's various ID formats and URL encoding.

---

**Date**: Sprint 4 - Table of Contents Scrolling Reliability Improvements completion  
**Status**: Skills documented for future reference

---

## Frontend UI/UX Skills
