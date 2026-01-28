# Sprint 2 Architecture – Table of Contents Performance & UX Refinements

**Document Purpose**: High-level technical architecture for implementing Sprint 2 improvements.

**Status**: Active Reference  
**Last Updated**: Sprint 2

---

## Overview

This sprint focuses on fixing critical Table of Contents (ToC) functionality and performance issues, addressing image interaction bugs, and refining UX elements. The architecture document outlines the technical approach for each sprint goal, connecting implementation patterns with existing codebase architecture.

---

## Architecture Goals

1. **Performance**: Eliminate ToC loading delay (2-3 seconds → <100ms)
2. **Functionality**: Fix ToC parsing to display correct section titles
3. **Interaction**: Prevent images from triggering article navigation
4. **UX Clarity**: Improve timer pause indicator placement
5. **Layout**: Fix leaderboard modal sizing for full Bingo board visibility

---

## 1. Table of Contents Performance Optimization (S1)

### Current Architecture

**Location**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Current Flow**:
1. Article HTML loads → `setContent(processed)`
2. `useEffect` watches `content` → calls `extractTableOfContents(content)`
3. ToC extraction runs synchronously on main thread
4. Extraction result → `setTocItems(extracted)`
5. User clicks ToC button → modal opens with `tocItems`

**Performance Bottleneck**:
- ToC extraction happens **after** article content is set
- Extraction runs synchronously, blocking UI
- Modal only opens after extraction completes
- User perceives 2-3 second delay from click to modal display

### Target Architecture

**Performance Requirement**: ToC modal opens instantly (<100ms) when clicked

**Architectural Approach**:

#### 1.1 Lazy Extraction Pattern
- Extract ToC **during** article HTML processing, not after
- Process ToC extraction in parallel with link processing
- Store extracted ToC in same state update as content

**Implementation Pattern**:
```typescript
// Extract ToC during HTML processing (not in separate useEffect)
const processed = processHtmlLinks(result.html)
const extractedToc = extractTableOfContents(result.html) // Extract immediately

// Single state update for both content and ToC
setContent(processed)
setTocItems(extractedToc) // Set immediately, not in useEffect
```

#### 1.2 Immediate Modal Display Pattern
- Open modal **immediately** on button click (<50ms)
- Show loading state in modal if ToC not yet extracted
- Update modal content when extraction completes

**Implementation Pattern**:
```typescript
const handleTocToggle = () => {
  setShowToc(!showToc) // Open immediately
  
  // If ToC not extracted yet, show loading state
  // Modal will update when tocItems becomes available
}
```

#### 1.3 Optimized Extraction Algorithm
- Use efficient DOM parsing (DOMParser is already fast)
- Cache extraction results per article title
- Avoid re-extraction if article hasn't changed

**Implementation Pattern**:
```typescript
// Cache ToC extraction results
const tocCacheRef = useRef<Map<string, ToCItem[]>>(new Map())

const extractWithCache = (html: string, articleTitle: string) => {
  const cached = tocCacheRef.current.get(articleTitle)
  if (cached) return cached
  
  const extracted = extractTableOfContents(html)
  tocCacheRef.current.set(articleTitle, extracted)
  return extracted
}
```

### Technical Considerations

- **Memory**: ToC cache is small (few KB per article), acceptable trade-off
- **Synchronization**: Ensure ToC extraction completes before modal content renders
- **Error Handling**: Handle extraction failures gracefully (show empty ToC)

---

## 2. Table of Contents Display & Functionality Fix (S2)

### Current Architecture

**Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (lines 74-141)

**Current Issue**: ToC displays "v", "t", "e" instead of section titles

**Root Cause Analysis**:
- `extractTableOfContents` function may be parsing incorrect elements
- Text extraction from `<a>` tags may be incorrect
- Selector logic may be matching wrong elements

### Target Architecture

**Functional Requirement**: ToC displays correct section titles and navigates properly

**Architectural Approach**:

#### 2.1 Robust Parsing Strategy
- Handle both desktop and mobile Wikipedia HTML structures
- Use multiple selector fallbacks for ToC container
- Extract text content correctly from nested structures

**Implementation Pattern**:
```typescript
export function extractTableOfContents(html: string): ToCItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Try multiple selectors for ToC container
  const tocContainer = 
    doc.getElementById('toc') || 
    doc.querySelector('.toc') ||
    doc.querySelector('nav.toc') ||
    doc.querySelector('[role="navigation"]')
  
  if (!tocContainer) return []
  
  // Extract items with proper text extraction
  function extractItems(listElement: HTMLUListElement, level: number = 1): ToCItem[] {
    const items: ToCItem[] = []
    const listItems = listElement.querySelectorAll(':scope > li')
    
    listItems.forEach((li) => {
      const link = li.querySelector('a')
      if (!link) return
      
      // Extract text correctly (handle nested spans, etc.)
      const text = link.textContent?.trim() || link.innerText?.trim() || ''
      const href = link.getAttribute('href') || ''
      const id = href.replace(/^#/, '')
      
      if (!id || !text) return // Skip invalid items
      
      // ... rest of extraction logic
    })
  }
}
```

#### 2.2 Navigation Implementation
- Use smooth scrolling to section anchors
- Handle section ID matching (case-insensitive, normalized)
- Close modal after navigation

**Implementation Pattern**:
```typescript
const handleTocNavigate = useCallback((sectionId: string) => {
  if (contentRef.current) {
    // Try multiple ID formats (case-insensitive)
    const selectors = [
      `#${sectionId}`,
      `[id="${sectionId}"]`,
      `[id="${sectionId.toLowerCase()}"]`,
      `[id="${sectionId.toUpperCase()}"]`
    ]
    
    let element: Element | null = null
    for (const selector of selectors) {
      element = contentRef.current.querySelector(selector)
      if (element) break
    }
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setShowToc(false) // Close modal
    }
  }
}, [])
```

### Technical Considerations

- **Wikipedia HTML Variability**: Handle different Wikipedia HTML structures (desktop vs mobile)
- **Section ID Format**: Wikipedia uses various ID formats (spaces, underscores, special chars)
- **Accessibility**: Ensure ToC navigation works with keyboard navigation

---

## 3. Image Click Prevention (S3)

### Current Architecture

**Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (lines 438-508)

**Current Issue**: Images (including SVGs) trigger article navigation when clicked

**Root Cause**: 
- `handleClick` event handler checks for `<a>` tags via `target.closest('a')`
- Images inside links are treated as link clicks
- No distinction between image clicks and link text clicks

### Target Architecture

**Functional Requirement**: Images do not trigger article navigation when clicked

**Architectural Approach**:

#### 3.1 Image Click Handler Pattern
- Detect image clicks specifically (img, svg, picture elements)
- Prevent navigation when image is clicked
- Allow link navigation when link text (not image) is clicked

**Implementation Pattern**:
```typescript
const handleClick = useCallback((e: MouseEvent) => {
  if (gameWonRef.current || isNavigatingRef.current) return

  const target = e.target as HTMLElement
  
  // Check if click target is an image or inside an image
  const isImageClick = 
    target.tagName === 'IMG' ||
    target.tagName === 'SVG' ||
    target.closest('img') !== null ||
    target.closest('svg') !== null ||
    target.closest('picture') !== null
  
  if (isImageClick) {
    // Prevent navigation for image clicks
    e.preventDefault()
    e.stopPropagation()
    return
  }
  
  // Continue with link navigation logic for non-image clicks
  const link = target.closest('a')
  if (!link) return
  
  // ... rest of navigation logic
}, [])
```

#### 3.2 Image Link Processing Pattern
- Process images during HTML sanitization
- Remove click handlers from images inside links
- Add CSS to prevent pointer events on images (optional)

**Implementation Pattern**:
```typescript
function processHtmlLinks(htmlString: string): string {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlString

  // Process images inside links
  const links = tempDiv.querySelectorAll('a')
  links.forEach((link) => {
    const images = link.querySelectorAll('img, svg, picture')
    images.forEach((img) => {
      // Prevent image clicks from triggering link navigation
      img.addEventListener('click', (e) => {
        e.stopPropagation() // Stop event from bubbling to link
      }, { capture: true })
    })
  })

  // ... rest of link processing
  return tempDiv.innerHTML
}
```

### Technical Considerations

- **Event Bubbling**: Use `stopPropagation()` to prevent image clicks from reaching link handlers
- **Accessibility**: Ensure images remain accessible (alt text, etc.) but non-navigational
- **SVG Handling**: Handle both inline SVGs and SVG images

---

## 4. Timer Pause Indicator Placement (S4)

### Current Architecture

**Location**: `app/src/features/game/TimerDisplay.tsx` (lines 45-49)

**Current Issue**: "(paused)" text appears next to timer, which is distracting

**Current Implementation**:
```typescript
{isPausedForLoading && (
  <span className="bp-timer-paused-message" title="Timer paused while loading article">
    {' '}(paused)
  </span>
)}
```

### Target Architecture

**UX Requirement**: Timer pause indicator appears contextually under "Loading article..." text, not next to timer

**Architectural Approach**:

#### 4.1 Contextual Message Pattern
- Remove pause indicator from `TimerDisplay` component
- Add pause message in article loading UI
- Pass pause state from game state to article viewer

**Implementation Pattern**:
```typescript
// In TimerDisplay.tsx - Remove pause indicator
export const TimerDisplay = memo(({ elapsedSeconds, className, prefix }: TimerDisplayProps) => {
  const displaySeconds = useTimerDisplay(elapsedSeconds)
  const formattedTime = formatTime(displaySeconds)
  
  return (
    <span className={className}>
      {prefix && <span>{prefix}</span>}
      {formattedTime}
      {/* Remove pause indicator - moved to article loading UI */}
    </span>
  )
})

// In ArticleViewer.tsx - Add contextual pause message
{loading && (
  <div className="bp-article-loading">
    <div className="bp-spinner"></div>
    <p>
      {isRetrying 
        ? `Loading article... (Retry ${retryCount}/${MAX_RETRIES})`
        : 'Loading article...'}
    </p>
    {isPausedForLoading && (
      <p className="bp-timer-paused-contextual">
        Timer paused while loading article
      </p>
    )}
  </div>
)}
```

#### 4.2 State Propagation Pattern
- Pass `isPausedForLoading` prop from `GameScreen` to `ArticleViewer`
- Derive pause state from `articleLoading` and `timerRunning` in game state

**Implementation Pattern**:
```typescript
// In GameScreen.tsx
<ArticleViewer
  articleTitle={state.currentArticleTitle}
  onArticleClick={handleArticleClick}
  onArticleLoadFailure={handleArticleLoadFailure}
  onLoadingChange={setArticleLoading}
  gameWon={state.gameWon}
  isPausedForLoading={!state.timerRunning && articleLoading} // Pass pause state
/>

// In ArticleViewer.tsx
interface ArticleViewerProps {
  // ... existing props
  isPausedForLoading?: boolean
}
```

### Technical Considerations

- **State Management**: Ensure pause state is correctly derived from game state
- **Visual Design**: Pause message should be subtle and contextual
- **Accessibility**: Maintain screen reader announcements for pause state

---

## 5. Leaderboard Modal Sizing Fix (S5)

### Current Architecture

**Location**: `app/src/features/leaderboard/GameDetailsModal.css`

**Current Issue**: 
- Modal height too short (only top 2 rows of Bingo board visible)
- Modal width too wide
- Bingo board cells too large for modal
- Article History tab same size as Bingo Board tab (may shrink if modal height increases)

**Current CSS**:
```css
.bp-game-details-content {
  max-width: 960px;
  max-height: 90vh;
  min-height: 500px;
}

.bp-game-details-content-area {
  min-height: 400px;
  max-height: calc(90vh - 250px);
}
```

### Target Architecture

**Layout Requirements**:
- Full 5×5 Bingo board visible (all rows)
- Increased modal height
- Reduced modal width
- Reduced Bingo board cell size
- Article History tab maintains equal or larger size compared to Bingo Board tab

**Architectural Approach**:

#### 5.1 Modal Dimension Strategy
- Increase modal height to accommodate full board
- Reduce modal width for better proportions
- Use viewport-based sizing with appropriate constraints

**Implementation Pattern**:
```css
.bp-game-details-content {
  max-width: 720px; /* Reduced from 960px */
  max-height: 85vh; /* Increased from 90vh, but account for padding */
  min-height: 600px; /* Increased from 500px */
  width: 90%; /* Responsive width */
}

.bp-game-details-content-area {
  min-height: 500px; /* Increased from 400px */
  max-height: calc(85vh - 280px); /* Adjusted for new header/stats height */
}
```

#### 5.2 Bingo Board Cell Sizing Strategy
- Reduce cell size within modal context
- Use CSS to scale board appropriately
- Maintain aspect ratio and readability

**Implementation Pattern**:
```css
/* In GameDetailsModal.css or BingoGrid.css */
.bp-game-details-board .bp-bingo-grid-container {
  max-width: 90%;
  max-height: 90%;
  /* Ensure board scales down to fit */
}

.bp-game-details-board .bp-bingo-grid {
  /* Reduce cell size for modal context */
  --cell-size: min(60px, 12vw, 12vh); /* Smaller than main game board */
  grid-template-columns: repeat(5, var(--cell-size));
  grid-template-rows: repeat(5, var(--cell-size));
  gap: calc(var(--cell-size) * 0.1);
}
```

#### 5.3 Tab Size Equality Strategy
- Ensure both tabs use same container sizing
- Use absolute positioning for tab content (already implemented)
- Maintain equal heights for both tabs

**Implementation Pattern**:
```css
.bp-game-details-content-area {
  /* Both tabs use same container */
  position: relative;
  min-height: 500px; /* Same for both tabs */
}

.bp-game-details-board,
.bp-game-details-history {
  /* Both use absolute positioning with same dimensions */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* Ensure history tab is at least as large as board tab */
  min-height: 100%;
}
```

### Technical Considerations

- **Responsive Design**: Ensure modal works on different screen sizes
- **Scroll Behavior**: Board should scroll if needed, but ideally fits without scrolling
- **Visual Balance**: Modal proportions should feel balanced, not cramped

---

## Implementation Dependencies

### Component Dependencies

1. **ArticleViewer** (`app/src/features/article-viewer/ArticleViewer.tsx`)
   - ToC extraction and display
   - Image click handling
   - Timer pause indicator

2. **TableOfContents** (`app/src/features/article-viewer/TableOfContents.tsx`)
   - ToC rendering and navigation

3. **TimerDisplay** (`app/src/features/game/TimerDisplay.tsx`)
   - Remove pause indicator

4. **GameScreen** (`app/src/features/game/GameScreen.tsx`)
   - Pass pause state to ArticleViewer

5. **GameDetailsModal** (`app/src/features/leaderboard/GameDetailsModal.tsx`)
   - Modal sizing and layout

### CSS Dependencies

1. **ArticleViewer.css** - Loading state styling for pause message
2. **GameDetailsModal.css** - Modal and board sizing
3. **BingoGrid.css** - Cell sizing in modal context

---

## Testing Strategy

### Performance Testing
- Measure ToC extraction time (should be <50ms)
- Measure modal open time (should be <100ms)
- Verify no UI blocking during extraction

### Functional Testing
- Verify ToC displays correct section titles
- Verify ToC navigation scrolls to correct sections
- Verify images don't trigger navigation
- Verify pause indicator appears in correct location

### Layout Testing
- Verify full 5×5 board visible in modal
- Verify modal proportions are balanced
- Verify both tabs maintain equal sizing
- Test on different screen sizes (desktop, tablet, mobile)

---

## Performance Considerations

### ToC Extraction Performance
- **Current**: 2-3 seconds (blocking)
- **Target**: <100ms (non-blocking)
- **Optimization**: Extract during HTML processing, cache results

### Modal Display Performance
- **Current**: Delayed until extraction completes
- **Target**: Instant (<100ms)
- **Optimization**: Open modal immediately, show loading state if needed

### Image Click Handling Performance
- **Impact**: Minimal (event handler check)
- **Optimization**: Early return for image clicks

---

## Accessibility Considerations

### ToC Navigation
- Ensure keyboard navigation works
- Maintain focus management
- Screen reader announcements for section navigation

### Timer Pause Indicator
- Screen reader announcement for pause state
- Visual indicator is clear but not distracting

### Modal Layout
- Keyboard navigation for tabs
- Focus management when modal opens/closes
- Screen reader announcements for modal content

---

## Migration Notes

### Breaking Changes
- None (all changes are internal improvements)

### Backward Compatibility
- Existing ToC functionality preserved (just fixed)
- Modal layout changes are visual only (no API changes)

### Rollout Strategy
- All changes can be deployed together
- No database migrations required
- No API changes required

---

## Related Documentation

- **Product Requirements**: `docs/PRODUCT_PRD.md` (Sections 4.4, 4.5, 4.9, FR10A)
- **System Architecture**: `docs/architecture/SYSTEM_ARCHITECTURE.md`
- **Architectural Decisions**: `docs/architecture/ARCHITECTURAL_DECISIONS.md`
- **Frontend Skills**: `docs/skills/FRONTEND_SKILLS.md`
- **React Skills**: `docs/skills/REACT_SKILLS.md`

---

## Success Criteria

1. ✅ ToC opens instantly (<100ms) when clicked
2. ✅ ToC displays correct section titles (not "v", "t", "e")
3. ✅ ToC links navigate to correct sections
4. ✅ Images don't trigger article navigation
5. ✅ Timer pause indicator appears under loading message
6. ✅ Full 5×5 Bingo board visible in leaderboard modal
7. ✅ Modal dimensions are balanced
8. ✅ Both tabs maintain equal sizing

---

**Document Status**: Ready for Engineering Manager task breakdown

