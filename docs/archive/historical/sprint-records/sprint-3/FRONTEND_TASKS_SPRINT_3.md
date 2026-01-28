# Frontend Tasks - Sprint 3

**Sprint**: Sprint 3 - Article Navigation Reliability & Table of Contents Implementation  
**Engineer**: Senior Frontend Engineer  
**Status**: In Progress  
**Last Updated**: Sprint 3

---

## Overview

This document contains tasks for implementing navigation reliability fixes and completing the Table of Contents feature. All work is frontend-only with no backend changes required.

**Related Documentation**:
- Architecture: `SPRINT_3_ARCHITECTURE.md`
- Product Requirements: `docs/PRODUCT_PRD.md` (FR6, FR10A, FR10B)
- Frontend Skills: `docs/skills/FRONTEND_SKILLS.md`
- React Skills: `docs/skills/REACT_SKILLS.md`

---

## Task List

### S1: Fix Navigation Race Condition from Multiple Rapid Clicks

**Goal**: Prevent navigation to incorrect URLs when links are clicked multiple times rapidly.

**Related Architecture**: Section 1 - Navigation Race Condition Prevention (S1, S2)

#### Task S1.1: Add Navigation Lock Pattern in useGameState Hook
- [x] **Location**: `app/src/features/game/useGameState.ts`
- [ ] **Action**: Implement navigation state lock using refs
- [ ] **Implementation**:
  - Add `isNavigatingRef` ref: `const isNavigatingRef = useRef<boolean>(false)`
  - Add synchronous check at start of `registerNavigation()` function
  - Return early if `isNavigatingRef.current === true`
  - Set lock immediately: `isNavigatingRef.current = true` (before async operations)
  - Clear lock in `finally` block: `isNavigatingRef.current = false`
  - Add console.log for debugging: `'Navigation already in progress, ignoring click'`
- [ ] **Acceptance Criteria**:
  - Navigation lock prevents concurrent navigations
  - Lock is set synchronously (no state update delay)
  - Lock is always cleared in finally block (even on errors)
  - Rapid clicks on same link only trigger one navigation

#### Task S1.2: Add Click Debouncing in ArticleViewer Component
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Implement debounce mechanism for click handler
- [x] **Implementation**:
  - Add ref: `const lastClickTimeRef = useRef<number>(0)`
  - Add constant: `const DEBOUNCE_DELAY = 100` (milliseconds)
  - Update `handleClick` callback to check debounce:
    - Get current timestamp: `const now = Date.now()`
    - If `now - lastClickTimeRef.current < DEBOUNCE_DELAY`, prevent default and return early
    - Update ref: `lastClickTimeRef.current = now`
  - Ensure visual feedback still works (link highlight) even if debounced
  - **CRITICAL FIX**: Call `preventDefault()` IMMEDIATELY when link is detected, before any conditional checks
  - **CRITICAL FIX**: Use capture phase for event listener (`addEventListener('click', handleClick, true)`) to catch clicks earlier
- [x] **Acceptance Criteria**:
  - Clicks within 100ms of previous click are ignored
  - Debounce check happens synchronously (no delay)
  - Visual feedback still works for debounced clicks
  - Debounce doesn't interfere with legitimate rapid clicks on different links
  - **CRITICAL**: Double-clicks never cause browser navigation (preventDefault called immediately)
  - **CRITICAL**: Event listener uses capture phase for earlier event handling

#### Task S1.3: Update Documentation
- [x] **Location**: `docs/skills/FRONTEND_SKILLS.md`
- [ ] **Action**: Document navigation lock pattern and debouncing pattern
- [ ] **Implementation**:
  - Add new section: "Navigation Race Condition Prevention Patterns"
  - Document ref-based navigation lock pattern
  - Document click debouncing pattern
  - Include code examples and key insights
- [ ] **Acceptance Criteria**:
  - Patterns documented with code examples
  - Key insights explained (why refs vs state, why debounce delay)
  - Date and context included

---

### S2: Fix First-Click Reliability on Article Links

**Goal**: Ensure first click on article links always works reliably.

**Related Architecture**: Section 1 - Navigation Race Condition Prevention (S1, S2)

#### Task S2.1: Verify Event Handler Attachment
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [ ] **Action**: Ensure click handlers are properly attached on first render
- [ ] **Implementation**:
  - Review `useEffect` that attaches click handler to contentRef
  - Ensure handler is attached immediately when content is set
  - Verify `handleClick` callback is stable (memoized with useCallback)
  - Check that contentRef is set before handler attachment
- [ ] **Acceptance Criteria**:
  - Click handler attached immediately when content is available
  - Handler is stable (doesn't recreate on every render)
  - First click works reliably on all articles

#### Task S2.2: Test First-Click Scenarios
- [ ] **Location**: Manual testing
- [ ] **Action**: Verify first-click reliability across scenarios
- [ ] **Test Cases**:
  - First click on initial article link
  - First click after article loads
  - First click after navigation completes
  - First click on different article links
- [ ] **Acceptance Criteria**:
  - All first-click scenarios work reliably
  - No missed clicks or navigation failures
  - Immediate visual feedback on first click (per FR10B)

---

### S3: Fix Redirect Resolution Timing

**Goal**: Resolve redirects before article display to prevent title switching and loading hangs.

**Related Architecture**: Section 2 - Redirect Resolution Timing Fix (S3)

#### Task S3.1: Move Redirect Resolution Before Article Fetch
- [x] **Location**: `app/src/features/game/useGameState.ts` - `registerNavigation()` function
- [ ] **Action**: Resolve redirects before fetching article content
- [ ] **Implementation**:
  - Move `resolveRedirect(title)` call to start of `registerNavigation()` (before article fetch)
  - Wrap redirect resolution in `Promise.race()` with 5-second timeout:
    ```typescript
    const resolvedTitle = await Promise.race([
      resolveRedirect(title),
      new Promise<string>((resolve) => 
        setTimeout(() => resolve(title), 5000)
      )
    ])
    ```
  - Use resolved title for all subsequent operations (duplicate check, state update, article fetch)
  - Normalize resolved title: `const normalizedResolved = normalizeTitle(resolvedTitle)`
  - Set `currentArticleTitle` state with resolved title immediately after resolution
- [ ] **Acceptance Criteria**:
  - Redirect resolution happens before article fetch
  - Timeout prevents indefinite hangs (5 seconds)
  - Resolved title used for all operations
  - Title doesn't switch during article display

#### Task S3.2: Update State Management for Pre-Display Resolution
- [x] **Location**: `app/src/features/game/useGameState.ts`
- [ ] **Action**: Update state updates to use resolved title
- [ ] **Implementation**:
  - Set `articleLoading: true` after redirect resolution (before article fetch)
  - Set `currentArticleTitle: resolvedTitle` immediately after resolution
  - Use resolved title for duplicate checking
  - Use resolved title for article fetch: `fetchWikipediaArticle(resolvedTitle)`
- [ ] **Acceptance Criteria**:
  - Loading state set after redirect resolution
  - Current article title set with resolved title immediately
  - No title switching during article display
  - Duplicate checking uses resolved title

#### Task S3.3: Add Error Handling for Redirect Resolution
- [x] **Location**: `app/src/features/game/useGameState.ts`
- [ ] **Action**: Handle redirect resolution failures gracefully
- [ ] **Implementation**:
  - Wrap redirect resolution in try-catch
  - On error or timeout, fallback to original title
  - Log errors for debugging but don't break navigation flow
  - Ensure navigation lock is cleared even on redirect resolution failure
- [ ] **Acceptance Criteria**:
  - Redirect resolution failures don't block navigation
  - Timeout fallback works correctly
  - Errors logged but don't break user experience
  - Navigation lock always cleared

#### Task S3.4: Update Documentation
- [x] **Location**: `docs/skills/FRONTEND_SKILLS.md`
- [ ] **Action**: Document pre-display redirect resolution pattern
- [ ] **Implementation**:
  - Add section: "Pre-Display Redirect Resolution Pattern"
  - Document Promise.race timeout pattern
  - Document fallback behavior
  - Include code examples and key insights
- [ ] **Acceptance Criteria**:
  - Pattern documented with code examples
  - Timeout strategy explained
  - Error handling documented

---

### S4: Implement Table of Contents Modal (Partial - Frontend Integration)

**Goal**: Complete ToC modal implementation (React component work).

**Related Architecture**: Section 3 - Table of Contents Modal Implementation (S4)

**Note**: UI/UX styling and visual design handled in UIUX_TASKS_SPRINT_3.md

#### Task S4.1: Add ToC Button to ArticleViewer Header
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [ ] **Action**: Add "Table of Contents" button in article viewer header/toolbar
- [ ] **Implementation**:
  - Add button in article viewer header area (before or after article title)
  - Button text: "Table of Contents"
  - Button disabled when `loading === true`
  - Button visible on all articles (even if ToC is empty)
  - Add click handler: `onClick={handleTocToggle}`
  - Add `aria-label="Open Table of Contents"` for accessibility
- [ ] **Acceptance Criteria**:
  - Button visible in article viewer
  - Button disabled during article loading
  - Button accessible (aria-label)
  - Button styling matches existing controls (handled in UIUX tasks)

#### Task S4.2: Implement ToC Modal State Management
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [ ] **Action**: Add state and handlers for ToC modal
- [ ] **Implementation**:
  - Add state: `const [showToc, setShowToc] = useState(false)`
  - Add toggle handler: `const handleTocToggle = useCallback(() => { setShowToc(true) }, [])`
  - Add navigation handler: `const handleTocNavigate = useCallback((sectionId: string) => { ... }, [])`
  - In `handleTocNavigate`:
    - Find section element: `contentRef.current?.querySelector(\`#${sectionId}\`)`
    - Scroll to section: `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
    - Close modal: `setShowToc(false)`
- [ ] **Acceptance Criteria**:
  - Modal state managed correctly
  - Modal opens on button click
  - Modal closes on section navigation
  - Smooth scrolling works correctly

#### Task S4.3: Render ToC Modal Component
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [ ] **Action**: Add modal JSX structure
- [ ] **Implementation**:
  - Add conditional rendering: `{showToc && ( ... )}`
  - Modal overlay: `<div className="bp-modal-overlay bp-toc-overlay" onClick={() => setShowToc(false)}>`
  - Modal content: `<div className="bp-modal-content bp-toc-modal-content" onClick={(e) => e.stopPropagation()}>`
  - Modal header with close button
  - Modal body with `TableOfContents` component or loading/empty state
  - Pass `tocItems` and `onNavigate={handleTocNavigate}` to `TableOfContents`
- [ ] **Acceptance Criteria**:
  - Modal renders correctly
  - Modal closes on backdrop click
  - Modal closes on close button click
  - ToC component receives correct props
  - Empty state shows when ToC is empty

---

### General Tasks

#### Task G1: Code Review and Testing
- [ ] **Action**: Review all changes and test navigation reliability
- [ ] **Test Cases**:
  - Rapid clicking on article links (should only navigate once)
  - First click reliability (should always work)
  - Redirect resolution timing (should resolve before display)
  - ToC modal functionality (opens, closes, navigates)
- [ ] **Acceptance Criteria**:
  - All tests pass
  - No console errors
  - Navigation works reliably
  - ToC modal works correctly

#### Task G2: Update Component Documentation
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [ ] **Action**: Update JSDoc comments for new functionality
- [ ] **Implementation**:
  - Document navigation lock and debouncing in component docs
  - Document ToC modal functionality
  - Update performance optimizations section
- [ ] **Acceptance Criteria**:
  - Documentation updated and accurate
  - New patterns documented

#### Task G3: Update Architecture Document (if needed)
- [ ] **Location**: `SPRINT_3_ARCHITECTURE.md`
- [ ] **Action**: Update document if implementation differs from architecture
- [ ] **Implementation**:
  - Note any deviations from architecture
  - Document any additional patterns discovered
- [ ] **Acceptance Criteria**:
  - Architecture document reflects actual implementation

---

## Notes

- All navigation fixes use refs for synchronous checks (no state update delays)
- Redirect resolution now happens before article fetch (prevents title switching)
- ToC modal uses existing modal patterns (consistent with other modals)
- No backend changes required (all frontend-only)
- All changes maintain backward compatibility

---

## Success Criteria

- ✅ Rapid clicking on article links does not cause incorrect URL navigation
- ✅ First click on any article link reliably initiates navigation
- ✅ Articles load without hanging; redirect resolution does not cause title switching
- ✅ ToC button visible and functional in article viewer
- ✅ ToC modal opens, closes, and navigates correctly

