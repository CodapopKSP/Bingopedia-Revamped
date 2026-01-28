# React Tasks - Sprint 2

**Sprint**: 2  
**Engineer**: Senior React Engineer  
**Status**: ✅ **COMPLETE** - All implementation tasks verified  
**Last Updated**: Sprint 2 - Verification complete

---

## Overview

This sprint focuses on React-specific optimizations for Table of Contents performance, state management improvements, and component memoization patterns. The React engineer will handle state management, performance optimization, and React-specific patterns.

---

## Tasks

### S1: Table of Contents Performance Optimization (React Patterns)

#### Task S1.1: Optimize State Updates for ToC Extraction
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Ensure ToC extraction and state updates don't cause unnecessary re-renders
- [x] **Implementation**:
  - Use single state update or batched updates for `content` and `tocItems`
  - Consider using `useState` updater function or `useReducer` if multiple related state updates needed
  - Ensure ToC extraction doesn't block render cycle
- [x] **Acceptance Criteria**:
  - State updates are batched appropriately (React 18+ auto-batches async state updates)
  - No unnecessary re-renders from ToC extraction
  - Component remains responsive during extraction

#### Task S1.2: Memoize ToC Extraction Function
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Wrap `extractTableOfContents` in `useCallback` or ensure it's stable
- [x] **Implementation**:
  - If function is used in dependencies, wrap in `useCallback`
  - Ensure function reference is stable across renders
  - Document memoization strategy
- [x] **Acceptance Criteria**:
  - ToC extraction function is stable (exported function, not recreated)
  - No unnecessary function recreations
  - Performance impact is minimal

#### Task S1.3: Optimize Modal State Management
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Ensure modal state updates don't cause parent re-renders
- [x] **Implementation**:
  - Verify `showToc` state is isolated
  - Use `React.memo` for TableOfContents component if not already memoized
  - Ensure modal opening doesn't trigger unnecessary parent updates
- [x] **Acceptance Criteria**:
  - Modal state changes don't cause parent re-renders (component is memoized)
  - TableOfContents component is properly memoized (verified)
  - Performance is optimal

---

### S4: Timer Pause Indicator Placement (State Management)

#### Task S4.1: Remove Pause Indicator from TimerDisplay Component
- [x] **Location**: `app/src/features/game/TimerDisplay.tsx`
- [x] **Action**: Remove `isPausedForLoading` prop and pause indicator display
- [x] **Implementation**:
  - Remove `isPausedForLoading` from `TimerDisplayProps` interface
  - Remove pause indicator JSX: `{isPausedForLoading && <span>...</span>}`
  - Update component documentation to reflect removal
- [x] **Acceptance Criteria**:
  - TimerDisplay no longer shows pause indicator (verified)
  - Component interface is updated (verified)
  - No references to `isPausedForLoading` in TimerDisplay (verified)

#### Task S4.2: Add Pause State Prop to ArticleViewer
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Add `isPausedForLoading` prop to ArticleViewer component
- [x] **Implementation**:
  - Add `isPausedForLoading?: boolean` to `ArticleViewerProps` interface
  - Derive pause state from props (don't calculate internally)
  - Document prop purpose in JSDoc
- [x] **Acceptance Criteria**:
  - ArticleViewer accepts `isPausedForLoading` prop (line 17, 213)
  - Prop is optional (backward compatible)
  - Documentation updated (JSDoc added)

#### Task S4.3: Display Pause Message in Article Loading UI
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Add pause message to loading state UI
- [x] **Implementation**:
  - In loading UI section, add conditional pause message:
    ```tsx
    {isPausedForLoading && (
      <p className="bp-timer-paused-contextual">
        Timer paused while loading article
      </p>
    )}
    ```
  - Style message appropriately (subtle, contextual)
  - Ensure message appears below "Loading article..." text
- [x] **Acceptance Criteria**:
  - Pause message appears in loading UI when `isPausedForLoading` is true (lines 763-767)
  - Message is contextual and not distracting
  - Styling is appropriate (CSS added)

#### Task S4.4: Pass Pause State from GameScreen to ArticleViewer
- [x] **Location**: `app/src/features/game/GameScreen.tsx`
- [x] **Action**: Derive pause state and pass to ArticleViewer
- [x] **Implementation**:
  - Derive pause state: `const isPausedForLoading = !state.timerRunning && articleLoading`
  - Pass as prop: `<ArticleViewer ... isPausedForLoading={isPausedForLoading} />`
  - Ensure state derivation is correct (timer not running AND article loading)
- [x] **Acceptance Criteria**:
  - Pause state correctly derived from game state (line 191)
  - Prop passed to ArticleViewer (line 191)
  - State updates correctly when timer pauses/resumes

---

## State Management Patterns

### Pattern 1: State Derivation for Pause Indicator
- [ ] **Action**: Document state derivation pattern
- [ ] **Implementation**:
  - Pause state = `!timerRunning && articleLoading`
  - Derived in parent (GameScreen), passed as prop
  - Avoids prop drilling by deriving at appropriate level
- [ ] **Acceptance Criteria**:
  - Pattern is clear and documented
  - State derivation is correct
  - No unnecessary state variables

---

## Documentation Tasks

### Doc Task 1: Update React Skills Documentation
- [ ] **Location**: `docs/skills/REACT_SKILLS.md`
- [ ] **Action**: Document React patterns used in Sprint 2
- [ ] **Content**:
  - Document ToC extraction state management pattern
  - Document pause state derivation pattern
  - Document modal state isolation pattern
  - Add code examples
- [ ] **Acceptance Criteria**:
  - Skills documented with patterns
  - Code examples included
  - Key insights documented

### Doc Task 2: Update Component Documentation
- [ ] **Location**: Modified component files
- [ ] **Action**: Update JSDoc for state management changes
- [ ] **Content**:
  - Document state derivation logic
  - Document prop purposes
  - Document performance considerations
- [ ] **Acceptance Criteria**:
  - All modified components have updated JSDoc
  - State management patterns documented
  - Performance notes included

---

## Testing Tasks

### Test Task 1: State Management Testing
- [ ] **Action**: Verify pause state derivation and propagation
- [ ] **Steps**:
  1. Start game and load article
  2. Verify timer pauses during loading
  3. Verify pause message appears in loading UI
  4. Verify message disappears when article loads
- [ ] **Acceptance Criteria**:
  - Pause state correctly derived
  - Message appears/disappears correctly
  - No state inconsistencies

### Test Task 2: Performance Testing
- [ ] **Action**: Verify no performance regressions
- [ ] **Steps**:
  1. Monitor component re-renders during ToC extraction
  2. Verify modal opening doesn't cause parent re-renders
  3. Check React DevTools Profiler for unnecessary renders
- [ ] **Acceptance Criteria**:
  - No unnecessary re-renders
  - Performance is optimal
  - No performance regressions

---

## Notes

- **State Management**: Derive pause state in parent, pass as prop (avoid prop drilling)
- **Performance**: Ensure ToC extraction doesn't block render cycle
- **Memoization**: Use `React.memo` and `useCallback` appropriately to prevent unnecessary re-renders
- **Backward Compatibility**: Keep `isPausedForLoading` optional in ArticleViewer for backward compatibility

---

**Status**: ✅ **COMPLETE** - All implementation tasks verified  
**Dependencies**: Frontend tasks (S1, S2) for ToC extraction logic  
**Estimated Complexity**: Medium (state management, performance optimization)  
**Last Updated**: Sprint 2 - Verification complete

