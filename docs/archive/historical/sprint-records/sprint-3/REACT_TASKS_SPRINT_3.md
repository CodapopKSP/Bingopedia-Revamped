# React Tasks - Sprint 3

**Sprint**: Sprint 3 - Article Navigation Reliability & Table of Contents Implementation  
**Engineer**: Senior React Engineer  
**Status**: Completed  
**Last Updated**: Sprint 3

---

## Overview

This document contains React-specific tasks for implementing navigation reliability fixes using React hooks, refs, and state management patterns.

**Related Documentation**:
- Architecture: `SPRINT_3_ARCHITECTURE.md`
- Product Requirements: `docs/PRODUCT_PRD.md` (FR6, FR10B)
- React Skills: `docs/skills/REACT_SKILLS.md`
- Frontend Skills: `docs/skills/FRONTEND_SKILLS.md`

---

## Task List

### S1: Navigation Race Condition Prevention (React Patterns)

**Goal**: Implement navigation lock using React refs for synchronous state checks.

**Related Architecture**: Section 1 - Navigation Race Condition Prevention (S1, S2)

#### Task S1.1: Implement Navigation Lock with useRef
- [x] **Location**: `app/src/features/game/useGameState.ts`
- [x] **Action**: Add navigation lock using refs for synchronous access
- [x] **Implementation**:
  - Add ref: `const isNavigatingRef = useRef<boolean>(false)`
  - Add synchronous check at start of `registerNavigation()`:
    ```typescript
    if (isNavigatingRef.current) {
      console.log('Navigation already in progress, ignoring click')
      return
    }
    ```
  - Set lock immediately: `isNavigatingRef.current = true`
  - Clear lock in `finally` block: `isNavigatingRef.current = false`
  - Ensure lock is cleared even on errors
- [x] **Acceptance Criteria**:
  - Navigation lock uses ref (synchronous access, no state update delay)
  - Lock prevents concurrent navigations
  - Lock is always cleared in finally block
  - No race conditions between rapid clicks

#### Task S1.2: Implement Click Debouncing with useRef
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Add debounce mechanism using refs for timestamp tracking
- [x] **Implementation**:
  - Add ref: `const lastClickTimeRef = useRef<number>(0)`
  - Add constant: `const DEBOUNCE_DELAY = 100`
  - Update `handleClick` callback:
    ```typescript
    const now = Date.now()
    if (now - lastClickTimeRef.current < DEBOUNCE_DELAY) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    lastClickTimeRef.current = now
    ```
  - Ensure callback is memoized with `useCallback` (empty deps array, uses refs)
- [x] **Acceptance Criteria**:
  - Debounce uses ref for timestamp (synchronous access)
  - Debounce prevents clicks within 100ms
  - Callback is memoized correctly (no unnecessary recreations)
  - Debounce doesn't interfere with legitimate clicks

#### Task S1.3: Ensure Stable Event Handlers
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Ensure click handler is stable and properly memoized
- [x] **Implementation**:
  - Verify `handleClick` uses `useCallback` with empty dependency array
  - Ensure handler uses refs for latest values (onArticleClickRef, gameWonRef)
  - Update refs in `useEffect` without causing re-renders
  - Verify handler is attached correctly in `useEffect`
- [x] **Acceptance Criteria**:
  - Handler is stable (doesn't recreate on every render)
  - Handler uses refs for latest values
  - Handler attached correctly in useEffect
  - No unnecessary re-attachments

---

### S2: First-Click Reliability (React Patterns)

**Goal**: Ensure event handlers are properly attached and stable for first-click reliability.

**Related Architecture**: Section 1 - Navigation Race Condition Prevention (S1, S2)

#### Task S2.1: Verify Event Handler Attachment Timing
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Ensure click handler is attached immediately when content is available
- [x] **Implementation**:
  - Review `useEffect` that attaches click handler
  - Ensure handler is attached when `content` is set (not delayed)
  - Verify `contentRef.current` is set before handler attachment
  - Check that handler attachment doesn't depend on other state
- [x] **Acceptance Criteria**:
  - Handler attached immediately when content is available
  - No delay between content setting and handler attachment
  - Handler works on first click

#### Task S2.2: Ensure Callback Stability
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Ensure callbacks passed to ArticleViewer are stable
- [x] **Implementation**:
  - Review parent component (GameScreen) to ensure `onArticleClick` is memoized
  - Verify `onArticleClick` doesn't recreate on every render
  - Check that refs are updated correctly when callbacks change
- [x] **Acceptance Criteria**:
  - Callbacks are stable (memoized in parent)
  - Refs updated correctly when callbacks change
  - First click works reliably

---

### S3: Redirect Resolution Timing (React Async Patterns)

**Goal**: Implement pre-display redirect resolution using React async patterns.

**Related Architecture**: Section 2 - Redirect Resolution Timing Fix (S3)

#### Task S3.1: Implement Promise.race for Timeout
- [x] **Location**: `app/src/features/game/useGameState.ts` - `registerNavigation()` function
- [x] **Action**: Wrap redirect resolution in Promise.race with timeout
- [x] **Implementation**:
  - Wrap `resolveRedirect(title)` in `Promise.race()`:
    ```typescript
    const resolvedTitle = await Promise.race([
      resolveRedirect(title),
      new Promise<string>((resolve) => 
        setTimeout(() => resolve(title), 5000)
      )
    ])
    ```
  - Handle timeout gracefully (fallback to original title)
  - Log timeout warnings for debugging
- [x] **Acceptance Criteria**:
  - Redirect resolution has 5-second timeout
  - Timeout fallback works correctly
  - No indefinite hangs
  - Errors logged but don't break flow

#### Task S3.2: Update Async Flow for Pre-Display Resolution
- [x] **Location**: `app/src/features/game/useGameState.ts`
- [x] **Action**: Restructure async flow to resolve redirects before article fetch
- [x] **Implementation**:
  - Move redirect resolution to start of `registerNavigation()` (before article fetch)
  - Set loading state after redirect resolution: `setArticleLoading(true)`
  - Set current article title with resolved title immediately
  - Use resolved title for all subsequent operations
  - Ensure navigation lock is set before async operations
- [x] **Acceptance Criteria**:
  - Redirect resolution happens before article fetch
  - Loading state set after redirect resolution
  - Current article title set with resolved title
  - No title switching during article display

#### Task S3.3: Handle Async Errors Gracefully
- [x] **Location**: `app/src/features/game/useGameState.ts`
- [x] **Action**: Ensure async errors don't break navigation flow
- [x] **Implementation**:
  - Wrap redirect resolution in try-catch
  - On error, fallback to original title
  - Ensure navigation lock is cleared in finally block
  - Log errors for debugging but continue navigation
- [x] **Acceptance Criteria**:
  - Redirect resolution errors don't block navigation
  - Navigation lock always cleared (even on errors)
  - Errors logged but don't break user experience

---

### S4: Table of Contents Modal (React Component Patterns)

**Goal**: Implement ToC modal using React component patterns.

**Related Architecture**: Section 3 - Table of Contents Modal Implementation (S4)

**Note**: UI/UX styling handled in UIUX_TASKS_SPRINT_3.md

#### Task S4.1: Implement Modal State Management
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Add state and handlers for ToC modal
- [x] **Implementation**:
  - Add state: `const [showToc, setShowToc] = useState(false)`
  - Add toggle handler: `const handleTocToggle = useCallback(() => { setShowToc((prev) => !prev) }, [])`
  - Add navigation handler: `const handleTocNavigate = useCallback((sectionId: string) => { ... }, [])`
  - Ensure handlers are memoized correctly
- [x] **Acceptance Criteria**:
  - Modal state managed with useState
  - Handlers memoized with useCallback
  - Handlers have correct dependencies

#### Task S4.2: Implement Section Navigation with Refs
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Implement section scrolling using refs
- [x] **Implementation**:
  - Use `contentRef` to find section element: `contentRef.current?.querySelector(\`#${sectionId}\`)`
  - Implement case-insensitive ID matching (try exact, lowercase, uppercase)
  - Use `scrollIntoView` with smooth behavior
  - Close modal after navigation: `setShowToc(false)`
- [x] **Acceptance Criteria**:
  - Section navigation uses refs correctly
  - Case-insensitive matching works
  - Smooth scrolling works
  - Modal closes after navigation

#### Task S4.3: Implement Modal Event Handlers
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Add event handlers for modal interactions
- [x] **Implementation**:
  - Backdrop click handler: `onClick={() => setShowToc(false)}`
  - Content click handler: `onClick={(e) => e.stopPropagation()}`
  - Close button handler: `onClick={() => setShowToc(false)}`
  - ESC key handler (optional): `useEffect` with keyboard event listener
- [x] **Acceptance Criteria**:
  - Modal closes on backdrop click
  - Modal doesn't close on content click
  - Close button works correctly
  - ESC key closes modal (if implemented)

---

### General Tasks

#### Task G1: Verify React Performance
- [x] **Action**: Ensure navigation fixes don't impact performance
- [x] **Checklist**:
  - Refs used for synchronous checks (no unnecessary re-renders)
  - Callbacks memoized correctly (no unnecessary recreations)
  - No memory leaks (cleanup in useEffect)
  - No unnecessary re-renders
- [x] **Acceptance Criteria**:
  - No performance regressions
  - Refs used appropriately
  - Callbacks memoized correctly

#### Task G2: Update React Skills Documentation
- [x] **Location**: `docs/skills/REACT_SKILLS.md`
- [x] **Action**: Document new React patterns learned
- [x] **Implementation**:
  - Document navigation lock pattern with refs
  - Document click debouncing pattern
  - Document pre-display async resolution pattern
  - Document Promise.race timeout pattern
  - Include code examples and key insights
- [x] **Acceptance Criteria**:
  - Patterns documented with code examples
  - Key insights explained (why refs vs state, why Promise.race)
  - Date and context included

#### Task G3: Code Review
- [x] **Action**: Review React code for best practices
- [x] **Checklist**:
  - Hooks used correctly (no violations)
  - Refs used appropriately (synchronous access)
  - Callbacks memoized correctly
  - Dependencies correct in useEffect/useCallback
  - No memory leaks
- [x] **Acceptance Criteria**:
  - Code follows React best practices
  - No hook violations
  - No memory leaks

---

## Notes

- All navigation locks use refs for synchronous access (no state update delays)
- Debouncing uses refs for timestamp tracking (synchronous access)
- Redirect resolution uses Promise.race for timeout (prevents indefinite hangs)
- All async operations wrapped in try-catch with proper error handling
- Navigation lock always cleared in finally block (even on errors)

---

## Success Criteria

- ✅ Navigation lock prevents concurrent navigations (using refs)
- ✅ Click debouncing prevents rapid clicks (using refs)
- ✅ Redirect resolution has timeout (using Promise.race)
- ✅ Redirect resolution happens before article fetch
- ✅ ToC modal state managed correctly (useState, useCallback)
- ✅ Section navigation uses refs correctly
- ✅ All React patterns follow best practices
- ✅ No performance regressions
- ✅ No memory leaks

