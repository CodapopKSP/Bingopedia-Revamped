# Frontend Tasks - Sprint 4

**Sprint**: 4  
**Engineer**: Senior Frontend Engineer  
**Status**: In Progress  
**Last Updated**: Sprint 4

---

## Overview

This document contains frontend implementation tasks for Sprint 4, focusing on Table of Contents extraction improvements and image cursor styling fixes. All tasks are independent and can be completed autonomously.

**Key Areas:**
- Enhanced ToC extraction with multiple fallback strategies
- Improved text and ID extraction robustness
- Image cursor styling fixes

---

## Task 1: Enhance Table of Contents Extraction Logic

**Priority**: Critical  
**Complexity**: Medium  
**Estimated Time**: 2-3 hours

### Description

Improve the `extractTableOfContents()` function in `ArticleViewer.tsx` to handle Wikipedia HTML structure variations more robustly. Implement multiple extraction strategies and better error handling.

### Requirements

1. **Multiple extraction strategies**:
   - Keep current primary strategy (extract from processed HTML)
   - Add fallback: Extract from raw Wikipedia HTML before processing
   - Add fallback: Extract from article content DOM after rendering (if primary fails)

2. **Improved selector matching**:
   - Expand selector list: Add `nav#toc`, `div.toc`, `aside.toc`, `[id="toc"]`
   - Add validation: Check that container has at least one `<ul>` before proceeding
   - Add logging: Log warnings in development mode when ToC not found (use `console.warn`)

3. **Robust text extraction**:
   - Ensure `textContent` is used (already implemented, verify)
   - Handle nested structures: Strip out icon spans, navigation elements
   - Preserve Unicode characters properly
   - Validate minimum text length: Keep current 2 chars minimum, but add comment explaining why

4. **ID extraction improvements**:
   - Handle URL-encoded section IDs: Decode `%20` → space, `%27` → apostrophe, etc.
   - Support multiple ID formats: Normalize hyphens, underscores, spaces
   - Extract IDs from both `href` attributes (current) and `id` attributes (fallback)
   - Normalize IDs: Convert to lowercase for consistent matching

5. **Error recovery**:
   - Return empty array if all extraction strategies fail (current behavior)
   - Log extraction failures with article title for debugging
   - Ensure graceful degradation (component handles empty ToC)

### Files to Modify

- `app/src/features/article-viewer/ArticleViewer.tsx` (lines ~96-175, `extractTableOfContents` function)

### Code Pattern Reference

See `SPRINT_4_ARCHITECTURE.md` Section 1.3.1 for detailed implementation approach.

### Testing

- Test with articles that have ToC (desktop Wikipedia format)
- Test with articles that have ToC (mobile Wikipedia format)
- Test with articles without ToC (should return empty array gracefully)
- Test with articles with special characters in section names
- Test with articles with URL-encoded section IDs

### Acceptance Criteria

- ✅ ToC extraction works for both desktop and mobile Wikipedia HTML structures
- ✅ ToC extraction handles URL-encoded section IDs correctly
- ✅ ToC extraction logs warnings in development when ToC not found
- ✅ ToC extraction gracefully handles articles without ToC
- ✅ No regressions in existing ToC functionality

### Documentation

- Update `extractTableOfContents` JSDoc comments with new fallback strategies
- Document ID normalization approach in function comments
- Add note about extraction strategy order in comments

---

## Task 2: Fix Image Cursor Styling in Article Viewer

**Priority**: Medium  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Description

Remove pointer/hand cursor from images in article viewer. Images should display with default cursor since they are not clickable.

### Requirements

1. **CSS targeting**:
   - Target all `img` elements within `.bp-article-body`
   - Target `svg` elements within article content
   - Target `picture` elements
   - Target images inside links: `.bp-article-body a img`, `.bp-article-body a svg`

2. **CSS rules**:
   - Set `cursor: default !important` for all image elements
   - Ensure specificity overrides any link cursor styles
   - Verify works in both light and dark themes

3. **Verify behavior**:
   - Images remain non-clickable (existing click prevention logic should remain)
   - Cursor displays as default (not pointer) on hover
   - Works for all image types (img, svg, picture)

### Files to Modify

- `app/src/features/article-viewer/ArticleViewer.css`

### Code Pattern

```css
/* Image cursor styling */
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

### Testing

- Test with articles containing images
- Test with images inside links (should not show pointer cursor)
- Test with SVG images
- Test with picture elements
- Verify cursor is default (not pointer) on hover
- Verify images remain non-clickable (existing behavior)

### Acceptance Criteria

- ✅ Images display with default cursor (not pointer/hand)
- ✅ Images inside links display with default cursor
- ✅ SVG and picture elements display with default cursor
- ✅ Images remain non-clickable (existing behavior preserved)
- ✅ Works in both light and dark themes

### Documentation

- Add CSS comment explaining why `!important` is needed (override link cursor styles)

---

## Task 3: Add Empty State Display for Table of Contents

**Priority**: Low  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Description

Improve user experience when ToC is empty by showing a helpful message in the ToC modal instead of showing nothing.

### Requirements

1. **Empty state display**:
   - Show message when `items.length === 0` in `TableOfContents` component
   - Message: "No table of contents available for this article."
   - Style consistently with existing modal design
   - Use muted text color for message

2. **Component update**:
   - Modify `TableOfContents.tsx` to show empty state instead of returning `null`
   - Keep existing structure (header, list) but show message in list area

### Files to Modify

- `app/src/features/article-viewer/TableOfContents.tsx`

### Code Pattern

```tsx
if (items.length === 0) {
  return (
    <nav className="bp-toc" aria-label="Table of Contents">
      <div className="bp-toc-header">
        <h3>Contents</h3>
      </div>
      <div className="bp-toc-empty">
        <p>No table of contents available for this article.</p>
      </div>
    </nav>
  )
}
```

### Testing

- Test with articles without ToC (should show empty state message)
- Test with articles with ToC (should show normal ToC list)
- Verify styling matches existing modal design

### Acceptance Criteria

- ✅ Empty state message displays when ToC is empty
- ✅ Message is styled consistently with modal design
- ✅ Normal ToC list displays when ToC items are available
- ✅ No visual regressions

### Documentation

- Add comment explaining empty state behavior in component

---

## Task 4: Update Frontend Skills Documentation

**Priority**: Low  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Description

Document new patterns learned during ToC extraction improvements and image cursor styling.

### Requirements

1. **Document ToC extraction patterns**:
   - Multiple fallback extraction strategies
   - ID normalization and URL decoding patterns
   - Robust selector matching patterns
   - Error handling and logging patterns

2. **Document image cursor styling patterns**:
   - Overriding link cursor styles for nested elements
   - Using `!important` for CSS specificity

### Files to Modify

- `/docs/skills/FRONTEND_SKILLS.md`

### Content to Add

- New section: "Table of Contents Extraction Patterns"
- New section: "Image Cursor Override Patterns"
- Include code examples and use cases

### Acceptance Criteria

- ✅ New patterns documented with code examples
- ✅ Patterns include context and use cases
- ✅ Documentation follows existing format

---

## Summary

**Total Tasks**: 4  
**Critical Tasks**: 1 (Task 1)  
**Estimated Total Time**: 4-5 hours

**Dependencies**:
- Task 1 is prerequisite for Task 3 (empty state only useful after extraction improvements)
- Tasks 2 and 4 are independent

**Notes**:
- All tasks can be completed independently
- No manual QA required (all tasks have automated testing approaches)
- Code documentation is included in each task
- Skills documentation update is separate task (Task 4)

