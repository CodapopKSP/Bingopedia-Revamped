# Frontend Tasks - Sprint 2

**Sprint**: 2  
**Engineer**: Senior Frontend Engineer  
**Status**: Completed  
**Last Updated**: Sprint 2

---

## Overview

This sprint focuses on fixing critical Table of Contents (ToC) functionality and performance issues, addressing image interaction bugs, and refining UX elements. The frontend engineer will handle HTML processing, DOM manipulation, and component integration work.

---

## Tasks

### S1: Table of Contents Performance Optimization

#### Task S1.1: Move ToC Extraction to HTML Processing Phase
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Extract ToC during `processHtmlLinks` or immediately after HTML is received, not in a separate `useEffect`
- [x] **Implementation**:
  - Call `extractTableOfContents(result.html)` immediately after receiving HTML from Wikipedia API
  - Set both `content` and `tocItems` in the same state update or sequential updates
  - Remove the `useEffect` that watches `content` and extracts ToC
- [x] **Acceptance Criteria**:
  - ToC extraction happens synchronously during HTML processing
  - No delay between content setting and ToC extraction
  - ToC items are available immediately when content is set

#### Task S1.2: Implement ToC Extraction Caching
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Add caching mechanism to avoid re-extracting ToC for the same article
- [x] **Implementation**:
  - Create `tocCacheRef` using `useRef<Map<string, ToCItem[]>>(new Map())`
  - Check cache before extracting: `const cached = tocCacheRef.current.get(articleTitle)`
  - If cached, use cached value; otherwise extract and store in cache
  - Cache key should be normalized article title
- [x] **Acceptance Criteria**:
  - ToC extraction results are cached per article title
  - Re-visiting same article uses cached ToC (no re-extraction)
  - Cache is cleared appropriately (on component unmount or when needed)

#### Task S1.3: Update Modal Display Logic for Immediate Opening
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Modify `handleTocToggle` to open modal immediately, show loading state if ToC not ready
- [x] **Implementation**:
  - Open modal immediately on button click: `setShowToc(!showToc)`
  - If `tocItems` is empty or not yet extracted, show loading state in modal
  - Modal should update automatically when `tocItems` becomes available
- [x] **Acceptance Criteria**:
  - Modal opens instantly (<50ms) when ToC button is clicked
  - Loading state shown if ToC not yet extracted
  - Modal content updates when extraction completes

---

### S2: Table of Contents Display & Functionality Fix

#### Task S2.1: Fix ToC Text Extraction Logic
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (lines 74-141)
- [x] **Action**: Fix `extractTableOfContents` function to correctly extract section titles
- [x] **Implementation**:
  - Ensure text extraction handles nested structures (spans, etc.)
  - Use `link.textContent?.trim() || link.innerText?.trim() || ''` for robust text extraction
  - Verify selector logic matches correct elements (not "v", "t", "e" elements)
  - Add validation to skip items with empty or invalid text
- [x] **Acceptance Criteria**:
  - ToC displays correct section titles (not "v", "t", "e")
  - All valid sections are extracted
  - Invalid or empty items are skipped

#### Task S2.2: Improve ToC Container Detection
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (extractTableOfContents function)
- [x] **Action**: Enhance selector logic to handle both desktop and mobile Wikipedia HTML structures
- [x] **Implementation**:
  - Try multiple selectors in order: `#toc`, `.toc`, `nav.toc`, `[role="navigation"]`
  - Add fallback for mobile Wikipedia structure if needed
  - Log warning if no ToC container found (for debugging)
- [x] **Acceptance Criteria**:
  - ToC container found for both desktop and mobile Wikipedia HTML
  - Graceful handling when ToC doesn't exist
  - No errors thrown when ToC container missing

#### Task S2.3: Implement Robust Section Navigation
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx` or `TableOfContents.tsx`
- [x] **Action**: Implement navigation handler that scrolls to sections correctly
- [x] **Implementation**:
  - Create `handleTocNavigate` callback that tries multiple ID formats (case-insensitive)
  - Use selectors: `#${sectionId}`, `[id="${sectionId}"]`, `[id="${sectionId.toLowerCase()}"]`, `[id="${sectionId.toUpperCase()}"]`
  - Use `scrollIntoView({ behavior: 'smooth', block: 'start' })`
  - Close modal after navigation
- [x] **Acceptance Criteria**:
  - Clicking ToC items scrolls to correct sections
  - Handles case-insensitive section IDs
  - Modal closes after navigation
  - Smooth scrolling works correctly

---

### S3: Image Click Prevention

#### Task S3.1: Add Image Click Detection in Event Handler
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (handleClick function, lines 438-508)
- [x] **Action**: Modify `handleClick` to detect image clicks and prevent navigation
- [x] **Implementation**:
  - Check if click target is an image: `target.tagName === 'IMG' || target.tagName === 'SVG'`
  - Check if click is inside an image: `target.closest('img') !== null || target.closest('svg') !== null || target.closest('picture') !== null`
  - If image click detected, call `e.preventDefault()` and `e.stopPropagation()`, then return early
  - Continue with link navigation logic only for non-image clicks
- [x] **Acceptance Criteria**:
  - Clicking images (including SVGs) does not trigger article navigation
  - Clicking link text (not images) still navigates correctly
  - Event propagation is stopped for image clicks

#### Task S3.2: Process Images During HTML Sanitization (Optional Enhancement)
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx` (processHtmlLinks function)
- [x] **Action**: Optionally add CSS or event handlers to images during HTML processing
- [x] **Implementation**:
  - Add CSS class to images inside links: `img.classList.add('bp-image-non-navigational')`
  - Or add `pointer-events: none` CSS to images within links (optional)
  - Document approach chosen
- [x] **Acceptance Criteria**:
  - Images are marked appropriately during HTML processing
  - Approach is consistent with existing HTML processing patterns
  - No performance degradation

---

## Documentation Tasks

### Doc Task 1: Update Frontend Skills Documentation
- [x] **Location**: `docs/skills/FRONTEND_SKILLS.md`
- [x] **Action**: Document new skills learned from ToC extraction and image click handling
- [x] **Content**:
  - Document ToC extraction caching pattern
  - Document image click prevention pattern
  - Document immediate modal opening pattern
  - Add code examples and key insights
- [x] **Acceptance Criteria**:
  - Skills documented with code patterns
  - Examples are clear and complete
  - Key insights included

### Doc Task 2: Update Component Documentation
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx`
- [x] **Action**: Update JSDoc comments for modified functions
- [x] **Content**:
  - Document ToC extraction timing and caching
  - Document image click handling behavior
  - Document performance optimizations
- [x] **Acceptance Criteria**:
  - All modified functions have updated JSDoc
  - Performance characteristics documented
  - Usage examples included where helpful

---

## Testing Tasks

### Test Task 1: Manual Testing - ToC Performance
- [ ] **Action**: Test ToC modal opening speed
- [ ] **Steps**:
  1. Load an article with ToC
  2. Click ToC button
  3. Measure time from click to modal display (<100ms target)
  4. Verify ToC items display correctly
- [ ] **Acceptance Criteria**:
  - Modal opens instantly (<100ms)
  - ToC items display correct section titles
  - No loading delay visible

### Test Task 2: Manual Testing - Image Click Prevention
- [ ] **Action**: Test that images don't trigger navigation
- [ ] **Steps**:
  1. Load an article with images (including SVGs)
  2. Click on various images
  3. Verify no navigation occurs
  4. Click on link text (not images)
  5. Verify navigation still works
- [ ] **Acceptance Criteria**:
  - Images don't trigger navigation
  - Link text still navigates correctly
  - No console errors

### Test Task 3: Manual Testing - ToC Navigation
- [ ] **Action**: Test ToC section navigation
- [ ] **Steps**:
  1. Open ToC modal
  2. Click on various ToC items
  3. Verify smooth scrolling to correct sections
  4. Verify modal closes after navigation
- [ ] **Acceptance Criteria**:
  - ToC items navigate to correct sections
  - Smooth scrolling works
  - Modal closes after navigation

---

## Notes

- **Performance Target**: ToC modal should open in <100ms (currently 2-3 seconds)
- **Caching Strategy**: Cache ToC extraction results per article title to avoid re-extraction
- **Image Handling**: Images should not trigger navigation, but should remain accessible (alt text, etc.)
- **ToC Parsing**: Must handle both desktop and mobile Wikipedia HTML structures

---

**Status**: Completed  
**Dependencies**: None (all frontend work)  
**Estimated Complexity**: Medium (HTML processing, DOM manipulation, event handling)  
**Last Updated**: Sprint 2 - All tasks completed

