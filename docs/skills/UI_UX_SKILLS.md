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
