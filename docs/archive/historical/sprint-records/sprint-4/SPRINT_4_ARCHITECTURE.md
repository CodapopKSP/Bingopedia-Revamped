# Sprint 4 Architecture – Table of Contents Fixes & Mobile UX Improvements

**Document Purpose**: Technical architecture and implementation approach for Sprint 4, focusing on fixing Table of Contents functionality and improving mobile user experience.

**Status**: Active Reference  
**Last Updated**: Sprint 4

---

## Overview

This sprint addresses critical Table of Contents (ToC) functionality issues and mobile UX improvements identified in user feedback. The work spans frontend components, CSS styling, and mobile-responsive design patterns.

**Key Areas:**
1. Table of Contents extraction, loading, and scrolling reliability
2. Image cursor styling in article viewer
3. Leaderboard game review modal sizing
4. Mobile leaderboard modal tab visibility
5. Mobile article viewer header optimization

---

## 1. Table of Contents Architecture

### 1.1 Current Implementation Analysis

**Existing Components:**
- `ArticleViewer.tsx`: Contains `extractTableOfContents()` function and ToC state management
- `TableOfContents.tsx`: Renders ToC items with navigation
- ToC extraction happens synchronously during HTML processing
- ToC results are cached per article title
- Scrolling uses `scrollIntoView()` with case-insensitive ID matching

**Known Issues:**
1. **Loading failures**: ToC sometimes fails to load (empty results)
2. **Incorrect data**: ToC sometimes displays wrong section headers
3. **Scrolling failures**: Clicking ToC items doesn't scroll to sections

### 1.2 Root Cause Analysis

**Issue 1: Loading Failures**
- **Potential causes**:
  - Wikipedia HTML structure variations (desktop vs. mobile)
  - ToC container selector failures (`#toc`, `.toc`, `nav.toc`, `[role="navigation"]`)
  - HTML parsing timing issues (ToC extracted before DOM is ready)
  - Empty or malformed ToC structures in some articles

**Issue 2: Incorrect Data**
- **Potential causes**:
  - Text extraction issues (nested spans, special characters)
  - ID extraction failures (href parsing, URL encoding)
  - Filtering logic too aggressive (skipping valid items)
  - Nested structure parsing errors

**Issue 3: Scrolling Failures**
- **Potential causes**:
  - Section IDs don't match between ToC and article content
  - Case sensitivity mismatches (ID matching may fail)
  - Section elements not present in DOM when scrolling
  - Scroll container targeting incorrect element
  - Timing issues (scrolling before content is rendered)

### 1.3 Technical Approach

#### 1.3.1 Enhanced ToC Extraction

**Strategy**: Improve robustness of extraction logic with better error handling and fallback mechanisms.

**Implementation Plan**:
1. **Multiple extraction strategies**:
   - Primary: Extract from processed HTML (current approach)
   - Fallback: Extract from raw Wikipedia HTML before processing
   - Fallback: Extract from article content DOM after rendering

2. **Improved selector matching**:
   - Expand selector list for ToC container detection
   - Add validation for container structure before extraction
   - Log warnings for debugging when ToC not found

3. **Robust text extraction**:
   - Use `textContent` with `innerText` fallback (already implemented)
   - Handle nested structures (spans, icons, etc.)
   - Preserve special characters and Unicode properly
   - Validate minimum text length (currently 2 chars, may need adjustment)

4. **ID extraction improvements**:
   - Handle URL-encoded section IDs (`%20` → space, etc.)
   - Support multiple ID formats (hyphens, underscores, spaces)
   - Normalize IDs for consistent matching
   - Extract IDs from both `href` attributes and `id` attributes

5. **Error recovery**:
   - Return empty array if extraction fails (current behavior)
   - Log extraction failures for debugging
   - Show user-friendly message in ToC modal when empty

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.tsx` (extractTableOfContents function)
- `app/src/features/article-viewer/TableOfContents.tsx` (display empty state)

#### 1.3.2 Scrolling Reliability

**Strategy**: Implement robust section scrolling with multiple fallback mechanisms.

**Implementation Plan**:
1. **Enhanced ID matching**:
   - Current: Case-insensitive matching with multiple attempts
   - Enhancement: Add URL decoding for section IDs
   - Enhancement: Try multiple ID formats (original, decoded, normalized)
   - Enhancement: Match against both `id` and `name` attributes

2. **Scroll target detection**:
   - Find section heading element (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`)
   - Fallback to any element with matching ID
   - Handle Wikipedia's section structure (spans, divs, etc.)

3. **Scroll timing**:
   - Ensure content is rendered before scrolling
   - Use `requestAnimationFrame` or `setTimeout` if needed
   - Wait for article content to be fully loaded

4. **Scroll container**:
   - Current: Scrolls within `contentRef.current` (article content container)
   - Verify scroll container is correct (should be article content area)
   - Ensure smooth scrolling works in both light and dark themes

5. **Error handling**:
   - Log when section not found for debugging
   - Provide user feedback if scroll fails
   - Fallback: Scroll to top of article if section not found

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.tsx` (handleTocNavigate function)
- `app/src/features/article-viewer/TableOfContents.tsx` (onClick handler)

**Code Pattern**:
```typescript
const handleTocNavigate = useCallback((sectionId: string) => {
  if (!contentRef.current) return
  
  // Try multiple ID formats
  const idVariants = [
    sectionId,
    decodeURIComponent(sectionId),
    sectionId.toLowerCase(),
    sectionId.replace(/_/g, '-'),
    sectionId.replace(/-/g, '_'),
  ]
  
  let element: Element | null = null
  for (const id of idVariants) {
    element = contentRef.current.querySelector(`#${CSS.escape(id)}`) ||
              contentRef.current.querySelector(`[name="${CSS.escape(id)}"]`)
    if (element) break
  }
  
  // Fallback: find heading with matching text
  if (!element) {
    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
    for (const heading of headings) {
      if (heading.textContent?.trim().toLowerCase() === sectionId.toLowerCase()) {
        element = heading
        break
      }
    }
  }
  
  if (element) {
    // Ensure content is rendered
    requestAnimationFrame(() => {
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setShowToc(false)
    })
  } else {
    console.warn(`Section not found: ${sectionId}`)
  }
}, [])
```

---

## 2. Image Cursor Styling

### 2.1 Current State

**Issue**: Images in article viewer display pointer/hand cursor, indicating they're clickable, but they should not be.

**Root Cause**: Images may be wrapped in `<a>` tags (from Wikipedia HTML), causing browser default cursor behavior. CSS may not be properly overriding cursor for images.

### 2.2 Technical Approach

**Strategy**: Explicitly set cursor to `default` for all images within article content.

**Implementation Plan**:
1. **CSS targeting**:
   - Target all `img` elements within `.bp-article-body`
   - Target `svg` elements within article content
   - Target `picture` elements
   - Ensure specificity overrides any link cursor styles

2. **CSS rules**:
   ```css
   .bp-article-body img,
   .bp-article-body svg,
   .bp-article-body picture {
     cursor: default !important;
   }
   
   /* Also target images inside links */
   .bp-article-body a img,
   .bp-article-body a svg {
     cursor: default !important;
   }
   ```

3. **Verify behavior**:
   - Images remain non-clickable (existing click prevention logic)
   - Cursor displays as default (not pointer)
   - Works in both light and dark themes

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.css`

**Note**: Existing click prevention logic in `ArticleViewer.tsx` already prevents image navigation. This change only affects cursor display.

---

## 3. Leaderboard Game Review Modal Sizing

### 3.1 Current State

**Issue**: Modal and bingo board need to be 15% larger for better visibility.

**Current Implementation**:
- Modal: `max-height: 85vh`, `min-height: 600px`
- Bingo board: Cell size `min(90px, 18vw, 18vh)` on desktop

### 3.2 Technical Approach

**Strategy**: Increase modal height and bingo board size by 15% using CSS calculations.

**Implementation Plan**:
1. **Modal height increase**:
   - Current: `max-height: 85vh`
   - New: `max-height: calc(85vh * 1.15)` ≈ `97.75vh` (but cap at reasonable max)
   - Better: `max-height: min(97vh, 900px)` (15% increase from ~780px base)
   - Update `min-height` proportionally: `min-height: 690px` (15% increase from 600px)

2. **Bingo board size increase**:
   - Current desktop cell size: `min(90px, 18vw, 18vh)`
   - New: `min(103.5px, 20.7vw, 20.7vh)` (15% increase)
   - Round to: `min(104px, 21vw, 21vh)` for cleaner values
   - Ensure board remains centered and doesn't overflow modal

3. **Content area adjustment**:
   - Current: `max-height: calc(85vh - 280px)`
   - New: `max-height: calc(97vh - 280px)` (adjust for new modal height)
   - Ensure Article History tab maintains proper sizing

4. **Responsive behavior**:
   - Mobile: Keep existing mobile sizing (no change needed per requirements)
   - Desktop: Apply 15% increase
   - Tablet: Consider proportional increase

**Files to Modify**:
- `app/src/features/leaderboard/GameDetailsModal.css`

**Code Changes**:
```css
/* Modal height increase */
.bp-game-details-content {
  max-height: min(97vh, 900px); /* 15% increase */
  min-height: 690px; /* 15% increase from 600px */
}

/* Bingo board size increase */
@media (min-width: 768px) {
  .bp-game-details-board .bp-bingo-grid {
    --cell-size: min(104px, 21vw, 21vh); /* 15% increase */
  }
}

/* Content area adjustment */
.bp-game-details-content-area {
  max-height: calc(97vh - 280px); /* Adjusted for new modal height */
}
```

---

## 4. Mobile Leaderboard Modal Tab Visibility

### 4.1 Current State

**Issue**: On mobile, article history overlays bingo board even when not selected. Both tabs should only display when active.

**Current Implementation**:
- Tabs use CSS classes: `bp-game-details-tab-active` and `bp-game-details-tab-hidden`
- Both board and history use `position: absolute` for stable layout
- Tab visibility controlled by conditional classes

**Root Cause**: Tab visibility logic may not be working correctly on mobile, or CSS specificity issues.

### 4.2 Technical Approach

**Strategy**: Ensure proper tab visibility toggling with CSS that works reliably on mobile.

**Implementation Plan**:
1. **Verify tab state management**:
   - Current: `activeTab` state controls which tab is visible
   - Ensure state updates correctly on tab click
   - Verify conditional classes are applied correctly

2. **CSS visibility rules**:
   - Current classes: `.bp-game-details-tab-active` (display: flex) and `.bp-game-details-tab-hidden` (display: none)
   - Ensure these rules have sufficient specificity
   - Add `!important` if needed to override conflicting styles
   - Verify both tabs use absolute positioning correctly

3. **Mobile-specific fixes**:
   - Ensure tab content containers are properly hidden when not active
   - Verify `position: absolute` doesn't cause overlay issues
   - Test tab switching behavior on various mobile screen sizes

4. **Testing scenarios**:
   - Switch from Board to History tab (History should appear, Board should hide)
   - Switch from History to Board tab (Board should appear, History should hide)
   - Verify no overlay/stacking issues

**Files to Modify**:
- `app/src/features/leaderboard/GameDetailsModal.tsx` (verify tab state logic)
- `app/src/features/leaderboard/GameDetailsModal.css` (ensure visibility rules)

**Code Pattern**:
```css
/* Ensure proper visibility toggling */
.bp-game-details-board.bp-game-details-tab-hidden,
.bp-game-details-history.bp-game-details-tab-hidden {
  display: none !important;
  visibility: hidden !important;
}

.bp-game-details-board.bp-game-details-tab-active,
.bp-game-details-history.bp-game-details-tab-active {
  display: flex !important;
  visibility: visible !important;
}
```

**Note**: May need to verify React state updates and ensure conditional classes are applied correctly in JSX.

---

## 5. Mobile Article Viewer Header Optimization

### 5.1 Current State

**Issue**: On mobile, ToC and "View on Wiki" buttons take too much horizontal space, and article titles are poorly handled.

**Current Implementation**:
- Header: `display: flex`, `justify-content: space-between`
- Title: `flex: 1`, `word-break: break-word`
- Buttons: `padding: 0.5rem 1rem`, full text labels

### 5.2 Technical Approach

**Strategy**: Optimize button sizing and convert ToC button to hamburger icon on mobile.

**Implementation Plan**:
1. **ToC button hamburger icon**:
   - Desktop: Keep current button with text "Table of Contents"
   - Mobile: Replace text with hamburger icon (☰ or three horizontal lines)
   - Use SVG icon (already exists in button)
   - Hide text label on mobile, show icon only
   - Maintain accessibility (aria-label still present)

2. **Button sizing optimization**:
   - Reduce padding on mobile: `padding: 0.375rem 0.75rem` (from `0.5rem 1rem`)
   - Reduce font size if text still visible: `font-size: 0.8rem` (from `0.875rem`)
   - Ensure buttons remain tappable (minimum 44x44px touch target)

3. **"View on Wiki" button**:
   - Reduce padding on mobile
   - Consider icon-only or shorter text on very small screens
   - Keep full text on larger mobile screens if space allows

4. **Article title handling**:
   - Current: `word-break: break-word` (already implemented)
   - Enhance: Add `hyphens: auto` for better word breaking
   - Ensure title doesn't overflow container
   - Optimize font size on mobile if needed: `font-size: 1.1rem` (from `1.25rem`)

5. **Header layout**:
   - Reduce gap between elements on mobile: `gap: 0.5rem` (from `1rem`)
   - Reduce header padding on mobile: `padding: 0.75rem 1rem` (from `1rem 1.5rem`)
   - Ensure title gets maximum available space

**Files to Modify**:
- `app/src/features/article-viewer/ArticleViewer.tsx` (conditional rendering for mobile)
- `app/src/features/article-viewer/ArticleViewer.css` (mobile responsive styles)

**Code Pattern**:
```css
/* Mobile optimizations */
@media (max-width: 768px) {
  .bp-article-header {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .bp-article-title {
    font-size: 1.1rem;
    hyphens: auto;
  }
  
  .bp-toc-toggle-button {
    padding: 0.375rem 0.75rem;
    min-width: 44px; /* Touch target */
  }
  
  .bp-toc-toggle-button span {
    display: none; /* Hide text on mobile */
  }
  
  .bp-toc-toggle-button svg {
    display: block; /* Show icon */
  }
  
  .bp-view-wikipedia-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }
}
```

**JSX Pattern**:
```tsx
<button className="bp-toc-toggle-button" ...>
  <svg>...</svg>
  <span className="bp-toc-toggle-text">Table of Contents</span>
</button>
```

```css
.bp-toc-toggle-text {
  display: inline; /* Desktop */
}

@media (max-width: 768px) {
  .bp-toc-toggle-text {
    display: none; /* Mobile */
  }
}
```

---

## 6. Implementation Dependencies

### 6.1 Component Dependencies

**ArticleViewer Component**:
- Depends on: `TableOfContents` component
- Affects: Article display, ToC functionality, mobile header layout

**GameDetailsModal Component**:
- Depends on: `BingoGrid`, `HistoryPanel` components
- Affects: Leaderboard game review experience

### 6.2 CSS Architecture

**Theme System**:
- All changes use CSS custom properties (theme variables)
- No hardcoded colors or values
- Maintains light/dark theme compatibility

**Responsive Breakpoints**:
- Mobile: `max-width: 768px` (standard breakpoint)
- Desktop: `min-width: 768px`
- Consistent breakpoint usage across all changes

### 6.3 Testing Considerations

**ToC Testing**:
- Test with articles that have ToC
- Test with articles without ToC
- Test scrolling to various section levels
- Test on mobile and desktop

**Modal Testing**:
- Test modal sizing on various screen sizes
- Test tab switching on mobile
- Verify board and history display correctly

**Mobile Header Testing**:
- Test on various mobile screen sizes
- Verify hamburger icon displays correctly
- Verify title wrapping and truncation
- Test button touch targets

---

## 7. Risk Assessment

### 7.1 Technical Risks

**ToC Extraction Failures**:
- **Risk**: Some Wikipedia articles may have non-standard ToC structures
- **Mitigation**: Multiple fallback extraction strategies, graceful degradation

**Scrolling Issues**:
- **Risk**: Section IDs may not match due to Wikipedia HTML variations
- **Mitigation**: Multiple ID matching strategies, text-based fallback

**Mobile Layout Issues**:
- **Risk**: Button sizing changes may break layout on some devices
- **Mitigation**: Test on multiple screen sizes, use flexible units (rem, vw, vh)

### 7.2 User Experience Risks

**ToC Reliability**:
- **Risk**: Users may still experience ToC failures
- **Mitigation**: Improved error handling, user feedback, logging for debugging

**Mobile Usability**:
- **Risk**: Smaller buttons may be harder to tap
- **Mitigation**: Maintain minimum 44x44px touch targets, test on real devices

---

## 8. Success Criteria

### 8.1 ToC Functionality
- ✅ ToC loads correctly for all articles that have ToC
- ✅ ToC displays correct section headers
- ✅ Clicking ToC items scrolls to correct sections
- ✅ Scrolling works smoothly on mobile and desktop

### 8.2 Image Cursor
- ✅ Images display with default cursor (not pointer)
- ✅ Images remain non-clickable

### 8.3 Modal Sizing
- ✅ Game review modal is 15% taller
- ✅ Bingo board is 15% larger within modal
- ✅ Modal layout remains stable and functional

### 8.4 Mobile Tab Visibility
- ✅ Article history only displays when tab is selected
- ✅ Bingo board only displays when tab is selected
- ✅ No overlay issues on mobile

### 8.5 Mobile Header
- ✅ ToC button is hamburger icon on mobile
- ✅ Buttons are appropriately sized for mobile
- ✅ Article titles display correctly without overflow
- ✅ Header layout is optimized for mobile

---

## 9. Documentation Updates

### 9.1 Skills Documentation

**Potential Updates**:
- ToC extraction patterns and error handling
- Mobile responsive design patterns
- Tab visibility management patterns
- Image cursor styling patterns

**Files to Update**:
- `/docs/skills/FRONTEND_SKILLS.md` (if new patterns learned)
- `/docs/skills/UI_UX_SKILLS.md` (mobile optimization patterns)

### 9.2 Architecture Documentation

**Potential Updates**:
- Component interaction patterns (ToC scrolling)
- Mobile layout patterns
- Modal sizing patterns

**Files to Update**:
- `/docs/architecture/ARCHITECTURAL_DECISIONS.md` (if new decisions made)
- `/docs/design/UI_DESIGN.md` (if design patterns change)

---

## 10. Implementation Order

### Phase 1: Critical Fixes (ToC)
1. Fix ToC extraction logic
2. Fix ToC scrolling behavior
3. Test ToC functionality thoroughly

### Phase 2: Styling Fixes
1. Fix image cursor styling
2. Increase modal and board sizes
3. Test sizing on various screen sizes

### Phase 3: Mobile Optimizations
1. Fix mobile tab visibility
2. Optimize mobile header layout
3. Test on mobile devices

### Phase 4: Testing & Refinement
1. Cross-browser testing
2. Mobile device testing
3. Edge case testing
4. Documentation updates

---

## References

- **Sprint Plan**: `SPRINT_4.md`
- **User Feedback**: `USER_FEEDBACK.md`
- **Product Requirements**: `/docs/PRODUCT_PRD.md`
- **System Architecture**: `/docs/architecture/SYSTEM_ARCHITECTURE.md`
- **Architectural Decisions**: `/docs/architecture/ARCHITECTURAL_DECISIONS.md`
- **Frontend Skills**: `/docs/skills/FRONTEND_SKILLS.md`
- **UI/UX Skills**: `/docs/skills/UI_UX_SKILLS.md`

