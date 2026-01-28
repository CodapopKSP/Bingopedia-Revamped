# UI/UX Skills

This document captures UI/UX skills and techniques learned during the Bingopedia implementation, including visual feedback patterns, DOM manipulation, CSS patterns, accessibility patterns, and mobile layout techniques.

---

## Mobile Layout Patterns

### 6. Mobile Viewport Width Constraints Pattern
**Context**: Fixing mobile horizontal scroll issues (FE-FIX-1.1)

**Technique**:
- Add `max-width: 100vw` to root containers to prevent overflow
- Use `width: 100%` with `box-sizing: border-box` to ensure proper sizing
- Apply constraints at multiple levels (root, main, feature containers)
- Ensure padding doesn't cause overflow by using `box-sizing: border-box`

**Code Pattern**:
```css
/* Root container */
.bp-app-root {
  max-width: 100vw;
  width: 100%;
  overflow: hidden;
}

/* Main content area */
.bp-app-main {
  max-width: 100vw;
  width: 100%;
  box-sizing: border-box; /* Include padding in width calculation */
}

/* Feature containers */
.bp-start-screen {
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}
```

**Application**: `app/src/app/AppLayout.css`, `app/src/features/game/StartScreen.css`, `app/src/features/game/GameScreen.css`

**Key Insight**: Mobile viewport overflow is often caused by missing width constraints and padding not being included in box-sizing. Apply constraints at multiple levels for defense in depth.

---

### 7. Fixed Position Scorebar with Content Offset Pattern
**Context**: Fixing mobile timer/clicks visibility without covering content (FE-FIX-1.2)

**Technique**:
- Use `position: fixed` for always-visible UI elements (scorebar)
- Calculate exact height of fixed element (padding + content)
- Add matching `padding-top` to content areas below fixed element
- Ensure z-index hierarchy: fixed element > overlay > content
- Remove negative margins that were used with sticky positioning

**Code Pattern**:
```css
/* Fixed scorebar at top */
.bp-game-scorebar-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* Above overlay (998) and content (999) */
  /* Height: ~3.5rem with padding */
}

/* Content below fixed element */
.bp-game-left {
  padding-top: 4.5rem; /* Space for scorebar (3.5rem) + margin (1rem) */
}

.bp-game-right {
  padding-top: 3.5rem; /* Space for fixed scorebar */
}
```

**Application**: `app/src/features/game/GameScreen.css`

**Key Insight**: Fixed positioning requires explicit spacing in content areas. Calculate exact heights and account for padding/margins. Z-index hierarchy ensures proper layering without covering content.

---

### 8. Mobile Layout Integration vs Overlay Pattern
**Context**: Integrating scorebar into layout instead of overlaying (FE-FIX-1.2)

**Technique**:
- Change from `position: sticky` with negative margins to `position: fixed`
- Remove margin hacks that were compensating for sticky positioning
- Ensure content areas account for fixed element height
- Use consistent padding calculations across breakpoints

**Code Pattern**:
```css
/* Before: Sticky with margin hack */
.bp-game-scorebar-mobile {
  position: sticky;
  margin: -1rem -1rem 1rem -1rem; /* Hack to extend beyond container */
}

/* After: Fixed with proper spacing */
.bp-game-scorebar-mobile {
  position: fixed;
  /* No margin hack needed */
}

/* Content accounts for fixed element */
.bp-game-left {
  padding-top: 4.5rem; /* Explicit spacing */
}
```

**Application**: `app/src/features/game/GameScreen.css`

**Key Insight**: Fixed positioning is cleaner than sticky with margin hacks. Explicit spacing in content areas is more maintainable and predictable than negative margins.

---

**Date**: After QA fixes FE-FIX-1 completion  
**Status**: Skills documented for future reference

---

## UI/UX Interaction Patterns

### 9. Optimistic UI Updates and Immediate Feedback
**Context**: Adding immediate visual feedback on article link clicks (P1-1)

**Technique**:
- Set loading/navigation state synchronously before async operations begin
- Use CSS classes for instant visual feedback
- Prevent multiple clicks during navigation using state flags
- Reset feedback state when operation completes

**Code Pattern**:
```typescript
// Set state synchronously for immediate feedback
const handleClick = useCallback((e: MouseEvent) => {
  if (isNavigatingRef.current) return // Prevent double-clicks
  
  // IMMEDIATE FEEDBACK: Set state synchronously
  setIsNavigating(true)
  setClickedLinkTitle(title)
  
  // Add visual feedback class
  link.classList.add('bp-link-clicked')
  
  // Trigger async navigation
  onArticleClickRef.current(title)
}, [])

// Reset state when article loads
useEffect(() => {
  if (!loading && !error && content) {
    setIsNavigating(false)
    setClickedLinkTitle(null)
    // Remove visual feedback
    contentRef.current?.querySelectorAll('.bp-link-clicked').forEach(link => {
      link.classList.remove('bp-link-clicked')
    })
  }
}, [loading, error, content])
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: Users perceive better performance when they see immediate feedback. Setting state synchronously before async operations provides instant visual confirmation and prevents user confusion.

---

### 10. Visual Feedback Patterns with CSS Classes
**Context**: Styling clicked links for immediate user feedback

**Technique**:
- Use CSS classes for visual state changes
- Apply classes directly to DOM elements for instant feedback
- Use CSS transitions for smooth visual changes
- Combine state management with DOM manipulation for optimal UX

**Code Pattern**:
```css
/* Immediate feedback for clicked links */
.bp-article-body a.bp-link-clicked {
  background-color: var(--color-primary-light, rgba(0, 123, 255, 0.2));
  transition: background-color 0.1s ease;
}

/* Disabled links during navigation */
.bp-article-body a.bp-link-disabled {
  pointer-events: none;
  opacity: 0.6;
  cursor: not-allowed;
}
```

**Application**: `app/src/features/article-viewer/ArticleViewer.css`

**Key Insight**: Direct DOM manipulation (classList.add/remove) combined with CSS provides faster visual feedback than React state updates alone. Use this pattern for immediate visual feedback that doesn't need to persist across renders.

---

**Date**: User Feedback Sprint - UI/UX Engineer Tasks (P1-1)  
**Status**: Skills documented for future reference

---

### 11. HTML Parsing and DOM Manipulation with DOMParser
**Context**: Extracting table of contents from Wikipedia article HTML (P2-1)

**Technique**:
- Use `DOMParser` to parse HTML strings into DOM documents
- Query DOM elements using standard selectors (getElementById, querySelector)
- Extract structured data recursively from nested HTML structures
- Handle edge cases (missing elements, malformed HTML)

**Code Pattern**:
```typescript
function extractTableOfContents(html: string): ToCItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Find ToC container with multiple fallback selectors
  const tocContainer = 
    doc.getElementById('toc') || 
    doc.querySelector('.toc') ||
    doc.querySelector('[role="navigation"]')
  
  if (!tocContainer) return []
  
  // Recursive extraction function
  function extractItems(listElement: HTMLUListElement, level: number = 1): ToCItem[] {
    const items: ToCItem[] = []
    const listItems = listElement.querySelectorAll(':scope > li')
    
    listItems.forEach((li) => {
      const link = li.querySelector('a')
      if (!link) return
      
      const href = link.getAttribute('href')
      const text = link.textContent?.trim() || ''
      const id = href ? href.replace(/^#/, '') : ''
      
      const item: ToCItem = {
        id,
        text,
        level,
        children: [],
      }
      
      // Recursively extract nested items
      const nestedList = li.querySelector(':scope > ul')
      if (nestedList instanceof HTMLUListElement) {
        item.children = extractItems(nestedList, level + 1)
      }
      
      items.push(item)
    })
    
    return items
  }
  
  const mainList = tocContainer.querySelector('ul')
  return mainList instanceof HTMLUListElement ? extractItems(mainList) : []
}
```

**Application**: `app/src/features/article-viewer/ArticleViewer.tsx`

**Key Insight**: `DOMParser` allows parsing HTML strings without affecting the document DOM. Use `:scope` selector to limit queries to direct children, preventing unintended matches in nested structures.

---

### 12. Recursive Component Patterns for Nested UI
**Context**: Building table of contents with nested subsections (P2-1)

**Technique**:
- Create recursive components that render themselves for nested data
- Use TypeScript interfaces to define recursive data structures
- Memoize recursive components to prevent unnecessary re-renders
- Handle edge cases (empty children, deeply nested structures)

**Code Pattern**:
```typescript
interface ToCItem {
  id: string
  text: string
  level: number
  children: ToCItem[] // Recursive structure
}

const ToCItem = memo(({ item, onClick }: ToCItemProps) => {
  return (
    <li className={`bp-toc-item bp-toc-item--level-${item.level}`}>
      <a href={`#${item.id}`} onClick={(e) => onClick(e, item.id)}>
        {item.text}
      </a>
      {item.children.length > 0 && (
        <ul className="bp-toc-sublist">
          {item.children.map((child) => (
            <ToCItem key={child.id} item={child} onClick={onClick} />
          ))}
        </ul>
      )}
    </li>
  )
})
```

**Application**: `app/src/features/article-viewer/TableOfContents.tsx`

**Key Insight**: Recursive components are perfect for rendering tree-like data structures. Memoization prevents re-renders when parent updates, and TypeScript ensures type safety for nested structures.

---

### 13. CSS Grid Layout for Responsive Sidebars
**Context**: Creating article layout with table of contents sidebar (P2-1)

**Technique**:
- Use CSS Grid for two-column layout (sidebar + content)
- Make layout responsive with media queries
- Use sticky positioning for sidebar to keep it visible while scrolling
- Handle overflow and scrolling for both columns independently

**Code Pattern**:
```css
.bp-article-layout {
  display: grid;
  grid-template-columns: 250px 1fr; /* Sidebar width + flexible content */
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.bp-toc {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

/* Responsive: Single column on smaller screens */
@media (max-width: 1024px) {
  .bp-article-layout {
    grid-template-columns: 1fr;
  }
  
  .bp-toc {
    display: none; /* Hide ToC on mobile */
  }
}
```

**Application**: `app/src/features/article-viewer/ArticleViewer.css`, `TableOfContents.css`

**Key Insight**: CSS Grid provides clean, responsive layouts. Sticky positioning keeps navigation elements visible while scrolling. Use `min-height: 0` on grid containers to allow proper scrolling in flex layouts.

---

### 14. Smooth Scrolling and Section Navigation
**Context**: Implementing smooth scrolling to article sections from ToC (P2-1)

**Technique**:
- Use `scrollIntoView` with smooth behavior
- Handle anchor links and section IDs
- Prevent default link behavior and implement custom scrolling
- Ensure sections exist before scrolling

**Code Pattern**:
```typescript
const handleClick = useCallback(
  (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    
    // Scroll to section smoothly
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }
    
    // Optional: Call navigation callback
    if (onNavigate) {
      onNavigate(sectionId)
    }
  },
  [onNavigate],
)
```

**Application**: `app/src/features/article-viewer/TableOfContents.tsx`

**Key Insight**: `scrollIntoView` with `behavior: 'smooth'` provides native smooth scrolling without JavaScript animations. Always check if element exists before scrolling to handle edge cases gracefully.

---

**Date**: User Feedback Sprint - UI/UX Engineer Tasks (P2-1)  
**Status**: Skills documented for future reference

---

## Frontend Skills - Retry Patterns and Error Recovery

---

## Mobile Header Optimization Patterns

### 15. Mobile Button Icon-Only Pattern
**Context**: Optimizing article viewer header for mobile by converting text buttons to icon-only (Sprint 4, Task 3)

**Technique**:
- Use CSS media queries to hide text labels on mobile while keeping icons visible
- Maintain accessibility with `aria-label` attributes (always present, not hidden)
- Ensure touch targets meet minimum 44x44px requirement
- Reduce padding and font sizes on mobile for space efficiency
- Keep full text visible on desktop for clarity

**Code Pattern**:
```css
/* Mobile optimizations */
@media (max-width: 768px) {
  .bp-toc-toggle-button {
    padding: 0.375rem 0.75rem; /* Reduced from 0.5rem 1rem */
    min-width: 44px; /* Touch target minimum */
    min-height: 44px;
  }
  
  /* Hide text on mobile, show icon only */
  .bp-toc-toggle-button span {
    display: none;
  }
  
  /* Ensure icon is visible */
  .bp-toc-toggle-button svg {
    display: block;
    width: 20px;
    height: 20px;
  }
}
```

**JSX Pattern**:
```tsx
<button
  className="bp-toc-toggle-button"
  aria-label="Open Table of Contents" // Always present for accessibility
  title="Table of Contents"
>
  <svg>...</svg>
  <span>Table of Contents</span> {/* Hidden on mobile via CSS */}
</button>
```

**Application**: `app/src/features/article-viewer/ArticleViewer.css`, `ArticleViewer.tsx`

**Key Insight**: Icon-only buttons save space on mobile while maintaining accessibility through ARIA labels. Always ensure touch targets meet accessibility guidelines (44x44px minimum). Text can be hidden with CSS while remaining accessible to screen readers.

---

### 16. Mobile Header Layout Optimization Pattern
**Context**: Reducing header padding and gaps for mobile efficiency (Sprint 4, Task 3)

**Technique**:
- Reduce header padding on mobile: `padding: 0.75rem 1rem` (from `1rem 1.5rem`)
- Reduce gap between elements: `gap: 0.5rem` (from `1rem`)
- Optimize font sizes: `font-size: 1.1rem` (from `1.25rem` for titles)
- Add hyphenation for better word breaking: `hyphens: auto`
- Ensure title gets maximum available space with `flex: 1`

**Code Pattern**:
```css
.bp-article-header {
  padding: 1rem 1.5rem;
  gap: 1rem;
}

.bp-article-title {
  font-size: 1.25rem;
  word-break: break-word;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .bp-article-header {
    padding: 0.75rem 1rem; /* Reduced padding */
    gap: 0.5rem; /* Reduced gap */
  }
  
  .bp-article-title {
    font-size: 1.1rem; /* Smaller font */
    hyphens: auto; /* Better word breaking */
  }
}
```

**Application**: `app/src/features/article-viewer/ArticleViewer.css`

**Key Insight**: Mobile screens require tighter spacing and smaller fonts. Use `hyphens: auto` for better word breaking in titles. Reduce padding and gaps proportionally to maximize content space while maintaining readability.

---

### 17. Mobile Button Sizing and Touch Target Pattern
**Context**: Ensuring buttons remain tappable while reducing size on mobile (Sprint 4, Task 3)

**Technique**:
- Reduce padding: `padding: 0.375rem 0.75rem` (from `0.5rem 1rem`)
- Reduce font size: `font-size: 0.8rem` (from `0.875rem`)
- Enforce minimum touch target: `min-width: 44px`, `min-height: 44px`
- Apply to all interactive buttons consistently

**Code Pattern**:
```css
.bp-view-wikipedia-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .bp-view-wikipedia-button {
    padding: 0.375rem 0.75rem; /* Reduced padding */
    font-size: 0.8rem; /* Smaller font */
    min-height: 44px; /* Touch target minimum */
  }
}
```

**Application**: `app/src/features/article-viewer/ArticleViewer.css`

**Key Insight**: Mobile buttons can be smaller but must meet accessibility touch target requirements (44x44px minimum). Reduce padding and font size proportionally while maintaining minimum dimensions for usability.

---

## Modal Sizing and Tab Visibility Patterns

### 18. Percentage-Based Modal Size Increase Pattern
**Context**: Increasing modal height by percentage for better visibility (Sprint 4, Task 1)

**Technique**:
- Calculate percentage increase: 15% increase = multiply base by 1.15
- Use `min()` function to cap maximum size: `max-height: min(97vh, 900px)`
- Adjust related calculations proportionally: `max-height: calc(97vh - 280px)`
- Add CSS comments explaining the calculation for maintainability
- Ensure modal doesn't overflow viewport on smaller screens

**Code Pattern**:
```css
.bp-game-details-content {
  /* 15% increase: from 85vh to 97vh (capped at 900px for reasonable max) */
  max-height: min(97vh, 900px);
  /* 15% increase: from 600px to 690px */
  min-height: 690px;
}

.bp-game-details-content-area {
  /* Adjusted for new modal height: from calc(85vh - 280px) to calc(97vh - 280px) */
  max-height: calc(97vh - 280px);
}
```

**Application**: `app/src/features/leaderboard/GameDetailsModal.css`

**Key Insight**: Percentage-based increases require updating all related calculations. Use `min()` to cap maximum sizes and prevent viewport overflow. Document calculations in CSS comments for future maintainers.

---

### 19. Responsive Board Size Increase Pattern
**Context**: Increasing bingo board size proportionally on desktop only (Sprint 4, Task 1)

**Technique**:
- Calculate 15% increase: `90px * 1.15 = 103.5px` → round to `104px`
- Apply increase to viewport-based calculations: `18vw → 21vw`, `18vh → 21vh`
- Use media queries to apply only on desktop: `@media (min-width: 768px)`
- Keep mobile sizing unchanged
- Round values for cleaner CSS

**Code Pattern**:
```css
/* Mobile: Keep existing size */
.bp-game-details-board .bp-bingo-grid {
  --cell-size: min(60px, 12vw, 12vh);
}

/* Desktop: 15% increase from 90px to 104px (rounded for cleaner values) */
@media (min-width: 768px) {
  .bp-game-details-board .bp-bingo-grid {
    /* 15% increase: from min(90px, 18vw, 18vh) to min(104px, 21vw, 21vh) */
    --cell-size: min(104px, 21vw, 21vh);
  }
}
```

**Application**: `app/src/features/leaderboard/GameDetailsModal.css`

**Key Insight**: Responsive size increases should only apply where appropriate (desktop). Round calculated values for cleaner CSS. Use CSS custom properties (variables) for maintainability.

---

### 20. Tab Visibility Management with Enhanced Specificity Pattern
**Context**: Fixing mobile tab visibility issues where inactive tabs were still visible (Sprint 4, Task 2)

**Technique**:
- Use combined class selectors for higher specificity: `.bp-game-details-board.bp-game-details-tab-active`
- Add `!important` if needed to override conflicting styles
- Use multiple CSS properties for extra safety: `display: none`, `visibility: hidden`, `opacity: 0`
- Ensure both active and hidden states are explicitly defined
- Apply to all tab content containers consistently

**Code Pattern**:
```css
/* Ensure proper visibility toggling with sufficient specificity */
.bp-game-details-board.bp-game-details-tab-active,
.bp-game-details-history.bp-game-details-tab-active {
  display: flex !important;
  visibility: visible !important;
  opacity: 1;
}

.bp-game-details-board.bp-game-details-tab-hidden,
.bp-game-details-history.bp-game-details-tab-hidden {
  display: none !important;
  visibility: hidden !important;
  opacity: 0;
}
```

**Application**: `app/src/features/leaderboard/GameDetailsModal.css`

**Key Insight**: Tab visibility issues often stem from insufficient CSS specificity or conflicting styles. Use combined class selectors and `!important` when necessary. Multiple CSS properties (`display`, `visibility`, `opacity`) provide defense in depth against visibility bugs.

---

**Date**: Sprint 4 - UI/UX Engineer Tasks  
**Status**: Skills documented for future reference
