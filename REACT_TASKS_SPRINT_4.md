# React Tasks - Sprint 4

**Sprint**: 4  
**Engineer**: Senior React Engineer  
**Status**: In Progress  
**Last Updated**: Sprint 4

---

## Overview

This document contains React implementation tasks for Sprint 4, focusing on Table of Contents scrolling reliability improvements and component state management. All tasks are independent and can be completed autonomously.

**Key Areas:**
- Enhanced ToC scrolling with multiple ID matching strategies
- Improved scroll timing and container targeting
- Better error handling and user feedback

---

## Task 1: Enhance Table of Contents Scrolling Reliability

**Priority**: Critical  
**Complexity**: Medium  
**Estimated Time**: 2-3 hours

### Description

Improve the `handleTocNavigate` function in `ArticleViewer.tsx` to handle section ID matching more robustly. Implement multiple ID matching strategies, URL decoding, and fallback mechanisms for reliable scrolling.

### Requirements

1. **Enhanced ID matching**:
   - Current: Case-insensitive matching with multiple attempts (keep this)
   - Add: URL decoding for section IDs (`decodeURIComponent`)
   - Add: Try multiple ID formats (original, decoded, normalized)
   - Add: Match against both `id` and `name` attributes
   - Add: Use `CSS.escape()` for IDs with special characters

2. **ID variant generation**:
   - Create array of ID variants to try:
     - Original ID
     - URL-decoded ID (`decodeURIComponent`)
     - Lowercase version
     - Hyphen-normalized (replace `_` with `-`)
     - Underscore-normalized (replace `-` with `_`)
   - Try each variant until match found

3. **Scroll target detection**:
   - Find section heading element (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`) with matching ID
   - Fallback: Find any element with matching ID
   - Fallback: Find heading with matching text content (case-insensitive)
   - Handle Wikipedia's section structure (spans, divs, etc.)

4. **Scroll timing**:
   - Ensure content is rendered before scrolling
   - Use `requestAnimationFrame` to wait for DOM updates
   - Verify `contentRef.current` exists before scrolling

5. **Scroll container**:
   - Current: Scrolls within `contentRef.current` (article content container)
   - Verify scroll container is correct (should be article content area)
   - Ensure smooth scrolling works in both light and dark themes

6. **Error handling**:
   - Log warning when section not found (use `console.warn` in development)
   - Provide user feedback: Show toast/notification if scroll fails (optional, low priority)
   - Fallback: Scroll to top of article if section not found (optional, low priority)

### Files to Modify

- `app/src/features/article-viewer/ArticleViewer.tsx` (lines ~706-739, `handleTocNavigate` function)

### Code Pattern Reference

See `SPRINT_4_ARCHITECTURE.md` Section 1.3.2 for detailed implementation approach and code pattern.

### Code Pattern

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
    // Try id attribute
    element = contentRef.current.querySelector(`#${CSS.escape(id)}`) ||
              contentRef.current.querySelector(`[id="${CSS.escape(id)}"]`)
    // Try name attribute
    if (!element) {
      element = contentRef.current.querySelector(`[name="${CSS.escape(id)}"]`)
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Section not found: ${sectionId}`)
    }
  }
}, [])
```

### Testing

- Test scrolling to sections with simple IDs (e.g., "History")
- Test scrolling to sections with URL-encoded IDs (e.g., "History%20of%20Science")
- Test scrolling to sections with special characters
- Test scrolling to nested subsections
- Test scrolling on mobile and desktop
- Test scrolling in both light and dark themes
- Test with articles that have non-standard section structures

### Acceptance Criteria

- ✅ Scrolling works for sections with URL-encoded IDs
- ✅ Scrolling works for sections with special characters
- ✅ Scrolling works for nested subsections
- ✅ Scrolling works reliably on mobile and desktop
- ✅ Scrolling uses smooth behavior
- ✅ ToC modal closes after successful scroll
- ✅ Warnings logged in development when section not found
- ✅ No regressions in existing scrolling functionality

### Documentation

- Update `handleTocNavigate` JSDoc comments with new ID matching strategies
- Document ID variant generation approach in function comments
- Add note about fallback mechanisms in comments

---

## Task 2: Improve TableOfContents Component Click Handling

**Priority**: Medium  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Description

Ensure `TableOfContents` component properly handles click events and calls the navigation callback. Verify the component structure supports the enhanced scrolling logic.

### Requirements

1. **Click handler verification**:
   - Verify `handleClick` in `TableOfContents.tsx` properly calls `onNavigate`
   - Ensure `preventDefault()` is called to prevent default anchor behavior
   - Verify section ID is passed correctly to callback

2. **Component structure**:
   - Verify `ToCItem` component properly passes section ID to click handler
   - Ensure `href` attribute is set correctly (for accessibility)
   - Verify component memoization doesn't interfere with click handling

3. **Error handling**:
   - Ensure component handles missing `onNavigate` callback gracefully
   - Verify component doesn't break if section ID is invalid

### Files to Modify

- `app/src/features/article-viewer/TableOfContents.tsx` (verify existing implementation, minor improvements if needed)

### Testing

- Test clicking ToC items triggers navigation callback
- Test clicking nested ToC items works correctly
- Test component handles missing callback gracefully
- Verify accessibility (keyboard navigation, screen readers)

### Acceptance Criteria

- ✅ Clicking ToC items triggers navigation callback
- ✅ Default anchor behavior is prevented
- ✅ Section ID is passed correctly to callback
- ✅ Component handles edge cases gracefully
- ✅ No regressions in existing functionality

### Documentation

- Add comment explaining click handler behavior
- Document callback requirements in component props

---

## Task 3: Add Scroll Position Debugging (Development Only)

**Priority**: Low  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Description

Add development-only logging to help debug scrolling issues. This will help identify when sections are not found and why.

### Requirements

1. **Debug logging**:
   - Log section ID being searched for (development only)
   - Log which ID variant matched (if any)
   - Log available section IDs in article (development only, verbose mode)
   - Use `console.debug` or `console.log` with development check

2. **Optional verbose mode**:
   - Add flag to enable verbose ToC debugging (e.g., `localStorage.getItem('toc-debug')`)
   - Only log verbose info when flag is set
   - Document flag in code comments

### Files to Modify

- `app/src/features/article-viewer/ArticleViewer.tsx` (`handleTocNavigate` function)

### Code Pattern

```typescript
const handleTocNavigate = useCallback((sectionId: string) => {
  if (!contentRef.current) return
  
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[ToC] Navigating to section: ${sectionId}`)
  }
  
  // ... ID matching logic ...
  
  if (element) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[ToC] Found section element:`, element.id || element.getAttribute('name'))
    }
    // ... scroll logic ...
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ToC] Section not found: ${sectionId}`)
      // Optional: Log available IDs in verbose mode
      if (localStorage.getItem('toc-debug') === 'true') {
        const allIds = Array.from(contentRef.current.querySelectorAll('[id]'))
          .map(el => el.id)
          .filter(id => id)
        console.debug(`[ToC] Available section IDs:`, allIds)
      }
    }
  }
}, [])
```

### Testing

- Test logging appears in development mode
- Test logging doesn't appear in production build
- Test verbose mode when flag is set
- Verify logging doesn't impact performance

### Acceptance Criteria

- ✅ Debug logging appears in development mode only
- ✅ Logging helps identify scrolling issues
- ✅ No performance impact from logging
- ✅ Verbose mode is optional and documented

### Documentation

- Document debug logging in function comments
- Document verbose mode flag in code comments

---

## Task 4: Update React Skills Documentation

**Priority**: Low  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Description

Document new React patterns learned during ToC scrolling improvements.

### Requirements

1. **Document scrolling patterns**:
   - Multiple ID matching strategies with fallbacks
   - Using `requestAnimationFrame` for scroll timing
   - URL decoding and ID normalization patterns
   - Error handling and logging patterns

2. **Document component patterns**:
   - Memoized callback patterns for navigation
   - Ref-based scroll container targeting
   - Development-only debugging patterns

### Files to Modify

- `/docs/skills/REACT_SKILLS.md`

### Content to Add

- New section: "Robust Section Scrolling Patterns"
- New section: "ID Matching and Normalization Patterns"
- Include code examples and use cases

### Acceptance Criteria

- ✅ New patterns documented with code examples
- ✅ Patterns include context and use cases
- ✅ Documentation follows existing format

---

## Summary

**Total Tasks**: 4  
**Critical Tasks**: 1 (Task 1)  
**Estimated Total Time**: 3.5-4.5 hours

**Dependencies**:
- Task 1 is the main critical task
- Task 2 is verification/improvement of existing component
- Task 3 is optional debugging enhancement
- Task 4 is documentation

**Notes**:
- All tasks can be completed independently
- No manual QA required (all tasks have automated testing approaches)
- Code documentation is included in each task
- Skills documentation update is separate task (Task 4)
- Task 3 is optional but recommended for debugging

