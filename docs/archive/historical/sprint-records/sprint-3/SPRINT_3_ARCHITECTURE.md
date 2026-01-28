# Sprint 3 Architecture – Article Navigation Reliability & Table of Contents Implementation

**Document Purpose**: Technical architecture document for Sprint 3, focusing on fixing critical article navigation bugs and completing the Table of Contents modal implementation.

**Status**: Active Reference  
**Last Updated**: Sprint 3

---

## Overview

This sprint addresses critical reliability issues in article navigation and completes the Table of Contents feature. The work focuses on:

1. **Navigation Race Condition Fixes**: Preventing incorrect URL navigation from rapid clicks
2. **First-Click Reliability**: Ensuring article links work on first click
3. **Redirect Resolution Stability**: Fixing article loading hangs caused by redirect resolution timing
4. **Table of Contents Modal**: Completing the missing ToC modal UI and interaction
5. **Leaderboard Board Sizing**: Increasing Bingo board size in game details modal

---

## Architecture Overview

### System Context

The article navigation system involves multiple layers:
- **ArticleViewer Component**: Handles link clicks and article display
- **useGameState Hook**: Manages navigation state and redirect resolution
- **Wikipedia Client**: Fetches article content and resolves redirects
- **Redirect Resolution**: Asynchronous API calls to Wikipedia Query API

Current issues stem from:
- Race conditions between rapid clicks and async operations
- Redirect resolution happening during article display (causing title switching)
- Missing navigation state locking mechanism
- Incomplete ToC modal implementation

---

## Technical Architecture

### 1. Navigation Race Condition Prevention (S1, S2)

#### Problem Analysis

**Current Flow**:
```
User clicks link → handleClick() → onArticleClick() → registerNavigation() → 
  [Async redirect resolution] → [Article fetch] → [State update]
```

**Issues**:
- Multiple rapid clicks can trigger multiple `registerNavigation()` calls
- Each call initiates async redirect resolution independently
- No mechanism to prevent concurrent navigations
- First click may fail if event handler isn't fully attached

#### Solution Architecture

**Navigation State Lock Pattern**:
- Add `isNavigating` state flag in `useGameState` hook
- Set flag synchronously at start of `registerNavigation()`
- Check flag at start of `registerNavigation()` and return early if already navigating
- Clear flag after navigation completes (success or failure)
- Use ref for synchronous checks (avoid state update delays)

**Click Debouncing Pattern**:
- Add debounce mechanism in `ArticleViewer` click handler
- Use ref to track last click timestamp
- Ignore clicks within 100ms of previous click
- Provide immediate visual feedback (link highlight) even if debounced

**Implementation Details**:

```typescript
// In useGameState.ts
const isNavigatingRef = useRef<boolean>(false)

const registerNavigation = async (title: string) => {
  // Synchronous check using ref (no state update delay)
  if (isNavigatingRef.current) {
    console.log('Navigation already in progress, ignoring click')
    return
  }
  
  // Set lock immediately
  isNavigatingRef.current = true
  
  try {
    // ... existing navigation logic ...
  } finally {
    // Always clear lock, even on error
    isNavigatingRef.current = false
  }
}
```

```typescript
// In ArticleViewer.tsx
const lastClickTimeRef = useRef<number>(0)
const DEBOUNCE_DELAY = 100 // milliseconds

const handleClick = useCallback((e: MouseEvent) => {
  const now = Date.now()
  if (now - lastClickTimeRef.current < DEBOUNCE_DELAY) {
    e.preventDefault()
    e.stopPropagation()
    return
  }
  lastClickTimeRef.current = now
  
  // ... rest of click handling ...
}, [])
```

#### State Management

- **Navigation Lock**: Managed via `useRef` in `useGameState` (synchronous access)
- **Debounce Tracking**: Managed via `useRef` in `ArticleViewer` (synchronous access)
- **Loading State**: Existing `articleLoading` state in `useGameState` (for UI feedback)

#### Error Handling

- Navigation lock cleared in `finally` block (ensures unlock on errors)
- Failed navigations don't block subsequent attempts
- Error messages logged but don't break navigation flow

---

### 2. Redirect Resolution Timing Fix (S3)

#### Problem Analysis

**Current Flow**:
```
registerNavigation() → resolveRedirect() [async] → fetchWikipediaArticle() → 
  [Article displayed] → [Redirect resolution completes] → [Title switches]
```

**Issues**:
- Redirect resolution happens asynchronously after article fetch
- Article may be displayed with original title before redirect resolves
- Title switching during display causes confusion and potential hangs
- No timeout mechanism for redirect resolution

#### Solution Architecture

**Pre-Display Redirect Resolution Pattern**:
- Resolve redirects **before** fetching article content
- Block article display until redirect resolution completes
- Use timeout mechanism (5 seconds) for redirect resolution
- Fallback to original title if redirect resolution times out or fails

**Implementation Details**:

```typescript
// In useGameState.ts - registerNavigation()
const registerNavigation = async (title: string) => {
  if (isNavigatingRef.current) return
  
  isNavigatingRef.current = true
  
  try {
    // STEP 1: Resolve redirect FIRST (before fetching article)
    const resolvedTitle = await Promise.race([
      resolveRedirect(title),
      new Promise<string>((resolve) => 
        setTimeout(() => resolve(title), 5000) // 5 second timeout
      )
    ])
    
    // STEP 2: Use resolved title for all subsequent operations
    const normalizedResolved = normalizeTitle(resolvedTitle)
    
    // STEP 3: Check duplicates using resolved title
    // ... duplicate check logic ...
    
    // STEP 4: Set loading state with resolved title
    setState((prev) => ({
      ...prev,
      articleLoading: true,
      currentArticleTitle: resolvedTitle // Use resolved title immediately
    }))
    
    // STEP 5: Fetch article using resolved title
    // ... article fetch logic ...
    
  } finally {
    isNavigatingRef.current = false
  }
}
```

**Redirect Resolution Caching**:
- Existing `REDIRECT_CACHE` in `resolveRedirect.ts` already caches results
- Cache key uses normalized title (handles case/whitespace variations)
- Cache prevents redundant API calls for same redirects

**Timeout Strategy**:
- Use `Promise.race()` to implement timeout
- 5 second timeout for redirect resolution (reasonable for Wikipedia API)
- Fallback to original title if timeout occurs (prevents indefinite hangs)
- Log timeout warnings for debugging

#### State Management

- **Resolved Title**: Stored in `currentArticleTitle` state immediately after resolution
- **Loading State**: Set to `true` after redirect resolution (before article fetch)
- **Error State**: Handle redirect resolution failures gracefully (use original title)

#### Error Handling

- Redirect resolution failures don't block navigation (fallback to original title)
- Timeout prevents indefinite hangs
- Errors logged for debugging but don't break user experience

---

### 3. Table of Contents Modal Implementation (S4)

#### Problem Analysis

**Current State**:
- ToC extraction logic exists (`extractTableOfContents()`)
- ToC component exists (`TableOfContents.tsx`)
- Modal structure exists but not fully integrated
- Missing: ToC button/control in article viewer
- Missing: Proper modal open/close behavior

#### Solution Architecture

**ToC Button Integration**:
- Add "Table of Contents" button in `ArticleViewer` header/toolbar
- Button visible on all articles (even if ToC is empty)
- Button shows loading state if ToC not yet extracted
- Button disabled during article loading

**Modal Implementation**:
- Use existing modal overlay pattern (consistent with other modals)
- Modal opens on button click
- Modal closes on:
  - Close button click
  - Backdrop/overlay click (blur)
  - ToC item click (after scrolling to section)
- Modal content shows `TableOfContents` component

**Section Navigation**:
- Existing `handleTocNavigate()` callback handles scrolling
- Smooth scroll to section using `scrollIntoView()`
- Case-insensitive ID matching (already implemented)
- Close modal after navigation for better UX

**Implementation Details**:

```typescript
// In ArticleViewer.tsx
const [showToc, setShowToc] = useState(false)

const handleTocToggle = useCallback(() => {
  setShowToc(true) // Open modal
}, [])

const handleTocNavigate = useCallback((sectionId: string) => {
  // Scroll to section (existing logic)
  const element = contentRef.current?.querySelector(`#${sectionId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setShowToc(false) // Close modal after navigation
  }
}, [])

// In render:
<div className="bp-article-header">
  <button 
    className="bp-toc-button"
    onClick={handleTocToggle}
    disabled={loading}
    aria-label="Open Table of Contents"
  >
    Table of Contents
  </button>
</div>

{showToc && (
  <div 
    className="bp-modal-overlay bp-toc-overlay" 
    onClick={() => setShowToc(false)}
  >
    <div 
      className="bp-modal-content bp-toc-modal-content" 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bp-modal-header">
        <h3>Table of Contents</h3>
        <button 
          className="bp-modal-close"
          onClick={() => setShowToc(false)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="bp-modal-body">
        {tocItems.length > 0 ? (
          <TableOfContents 
            items={tocItems} 
            onNavigate={handleTocNavigate} 
          />
        ) : (
          <div className="bp-article-loading">
            <p>No table of contents available for this article.</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

#### Styling Considerations

- ToC button matches existing article viewer controls
- Modal styling consistent with other modals (WinModal, ArticleSummaryModal)
- ToC content scrollable if long
- Responsive design for mobile and desktop
- Theme support (light/dark mode)

#### Accessibility

- Button has `aria-label` for screen readers
- Modal has proper focus management (focus trap)
- Keyboard navigation support (ESC to close)
- ToC items keyboard accessible

---

### 4. Leaderboard Bingo Board Sizing (S5)

#### Problem Analysis

**Current State**:
- Bingo board in `GameDetailsModal` uses responsive sizing
- Cell size: `min(60px, 12vw, 12vh)` (too small for desktop)
- Board constrained by modal height
- User feedback: board should be ~50% larger on desktop

#### Solution Architecture

**Responsive Sizing Strategy**:
- Increase cell size for desktop viewports (min-width: 768px)
- Keep mobile sizing unchanged (maintains usability)
- Use CSS media queries for viewport-specific sizing
- Ensure modal accommodates larger board without breaking layout

**Implementation Details**:

```css
/* In GameDetailsModal.css */

/* Desktop: Larger board (50% increase) */
@media (min-width: 768px) {
  .bp-game-details-board .bp-bingo-grid {
    --cell-size: min(90px, 18vw, 18vh); /* 50% larger than 60px */
    grid-template-columns: repeat(5, var(--cell-size));
    gap: calc(var(--cell-size) * 0.1);
  }
}

/* Mobile: Keep existing size */
.bp-game-details-board .bp-bingo-grid {
  --cell-size: min(60px, 12vw, 12vh);
  grid-template-columns: repeat(5, var(--cell-size));
  gap: calc(var(--cell-size) * 0.1);
}
```

**Modal Layout Considerations**:
- Modal height must accommodate larger board
- Ensure Article History tab maintains appropriate sizing
- Board container uses flexbox for centering
- Overflow handling for very large boards

#### Layout Preservation

- Board remains centered in modal
- Article History tab maintains equal or larger size (per PRD requirement)
- Modal doesn't break on common desktop resolutions (1920x1080, 1366x768)
- Responsive breakpoint at 768px (tablet/desktop boundary)

---

## Data Flow Diagrams

### Navigation Flow (Fixed)

```
User clicks link
  ↓
[Debounce check] → If < 100ms since last click → Ignore
  ↓
[Navigation lock check] → If navigating → Ignore
  ↓
Set navigation lock (synchronous)
  ↓
Resolve redirect (with timeout)
  ↓
Update state with resolved title
  ↓
Fetch article content
  ↓
Update state with article content
  ↓
Clear navigation lock
```

### Redirect Resolution Flow (Fixed)

```
registerNavigation(title)
  ↓
Promise.race([
  resolveRedirect(title),
  timeout(5000)
])
  ↓
[If resolved] → Use resolved title
[If timeout] → Use original title
  ↓
Continue with article fetch using resolved/original title
```

### ToC Modal Flow

```
User clicks ToC button
  ↓
Open modal (setShowToc(true))
  ↓
Display ToC items (if available)
  ↓
User clicks ToC item
  ↓
Scroll to section
  ↓
Close modal (setShowToc(false))
```

---

## Component Architecture

### ArticleViewer Component Updates

**New State**:
- `showToc: boolean` - Controls ToC modal visibility

**New Refs**:
- `lastClickTimeRef: number` - Tracks last click time for debouncing

**New Callbacks**:
- `handleTocToggle()` - Opens ToC modal
- `handleTocNavigate(sectionId)` - Scrolls to section and closes modal

**Updated Callbacks**:
- `handleClick()` - Adds debounce logic

### useGameState Hook Updates

**New Refs**:
- `isNavigatingRef: boolean` - Navigation lock flag

**Updated Functions**:
- `registerNavigation()` - Adds navigation lock and pre-display redirect resolution

### GameDetailsModal Component Updates

**CSS Updates**:
- Media query for desktop board sizing
- Increased cell size for desktop viewports

---

## Performance Considerations

### Navigation Lock Performance

- **Synchronous Checks**: Using refs for navigation lock (no state update delay)
- **Debounce Overhead**: Minimal (single timestamp comparison)
- **Impact**: Negligible performance impact, prevents race conditions

### Redirect Resolution Performance

- **Caching**: Existing redirect cache prevents redundant API calls
- **Timeout**: 5 second timeout prevents indefinite hangs
- **Pre-resolution**: Resolving before article fetch adds ~100-500ms delay (acceptable for reliability)

### ToC Modal Performance

- **Extraction**: Already cached per article (no re-extraction)
- **Modal Rendering**: Lightweight (just list of links)
- **Impact**: Minimal performance impact

---

## Error Handling Strategy

### Navigation Errors

- **Lock Not Cleared**: Use `finally` block to ensure lock always cleared
- **Redirect Timeout**: Fallback to original title (doesn't break navigation)
- **Article Fetch Failure**: Existing retry logic handles failures
- **Concurrent Clicks**: Debounce and lock prevent multiple navigations

### Redirect Resolution Errors

- **API Failure**: Fallback to original title (logged but doesn't break flow)
- **Timeout**: Use original title after 5 seconds (prevents hangs)
- **Network Issues**: Existing retry logic in `resolveRedirect.ts` handles retries

### ToC Modal Errors

- **Missing ToC**: Show "No table of contents available" message
- **Section Not Found**: Log warning but don't break modal
- **Scroll Failure**: Modal still closes (graceful degradation)

---

## Testing Considerations

### Navigation Race Condition Tests

- **Rapid Click Test**: Click same link 10 times rapidly → Should only navigate once
- **Different Link Test**: Click link A, then link B rapidly → Should navigate to B
- **First Click Test**: First click on any link should always work

### Redirect Resolution Tests

- **Redirect Article Test**: Navigate to redirect article → Should resolve before display
- **Timeout Test**: Simulate slow redirect API → Should timeout after 5 seconds
- **Title Switching Test**: Navigate to redirect → Title should not switch during display

### ToC Modal Tests

- **Button Visibility**: ToC button visible on all articles
- **Modal Open/Close**: Modal opens on button click, closes on backdrop/close button
- **Section Navigation**: Clicking ToC item scrolls to section and closes modal
- **Empty ToC**: Modal shows appropriate message when ToC is empty

### Board Sizing Tests

- **Desktop Size**: Board is ~50% larger on desktop (≥768px width)
- **Mobile Size**: Board maintains original size on mobile (<768px width)
- **Modal Layout**: Modal layout doesn't break with larger board

---

## Migration & Deployment

### No Database Changes

- All changes are frontend-only
- No schema migrations required
- No API changes required

### Backward Compatibility

- All changes are backward compatible
- Existing functionality preserved
- No breaking changes

### Rollout Strategy

- Deploy all changes together (navigation fixes and ToC completion)
- Monitor for navigation errors in production
- Verify redirect resolution timing improvements

---

## Dependencies

### Existing Dependencies

- React hooks (`useState`, `useRef`, `useCallback`)
- Existing `resolveRedirect()` function
- Existing `TableOfContents` component
- Existing modal styling patterns

### No New Dependencies

- All solutions use existing React patterns
- No new libraries required
- No new API endpoints required

---

## Success Criteria

### Navigation Reliability

- ✅ Rapid clicking on article links does not cause incorrect URL navigation
- ✅ First click on any article link reliably initiates navigation
- ✅ Only one navigation occurs per click (no duplicate navigations)

### Redirect Resolution

- ✅ Articles load without hanging
- ✅ Redirect resolution does not cause title switching during article display
- ✅ Loading completes or fails gracefully with timeout fallback

### Table of Contents

- ✅ ToC button visible in article viewer
- ✅ Clicking button opens modal with correct section titles
- ✅ Clicking ToC items smoothly scrolls to sections
- ✅ Modal closes appropriately on blur/click

### Board Sizing

- ✅ Bingo board in leaderboard game details modal is ~50% larger on desktop
- ✅ Modal layout remains stable and functional
- ✅ Mobile sizing unchanged

---

## Related Documentation

- **Product Requirements**: `docs/PRODUCT_PRD.md` (FR6, FR10A, FR10B)
- **System Architecture**: `docs/architecture/SYSTEM_ARCHITECTURE.md`
- **Architectural Decisions**: `docs/architecture/ARCHITECTURAL_DECISIONS.md`
- **Frontend Skills**: `docs/skills/FRONTEND_SKILLS.md`
- **Sprint Plan**: `SPRINT_3.md`

---

## Notes

- All solutions follow existing code patterns and architectural decisions
- No major refactoring required (incremental improvements)
- Focus on reliability and user experience improvements
- Maintains backward compatibility with existing features

