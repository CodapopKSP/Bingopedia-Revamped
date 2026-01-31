# UI/UX Tasks - Sprint 4

**Sprint**: 4  
**Engineer**: Senior UI/UX Engineer  
**Status**: ✅ Completed  
**Last Updated**: Sprint 4

---

## Overview

This document contains UI/UX implementation tasks for Sprint 4, focusing on leaderboard modal sizing improvements and mobile layout optimizations. All tasks are independent and can be completed autonomously.

**Key Areas:**
- Leaderboard game review modal and bingo board size increases (15%)
- Mobile leaderboard modal tab visibility fixes
- Mobile article viewer header optimization

---

## Task 1: Increase Leaderboard Game Review Modal and Bingo Board Size

**Priority**: High  
**Complexity**: Low-Medium  
**Estimated Time**: 1-2 hours

### Description

Increase the game review modal height by 15% and the bingo board size by 15% for better visibility. Ensure the modal layout remains stable and functional.

### Requirements

1. **Modal height increase**:
   - Current: `max-height: 85vh`, `min-height: 600px`
   - New: `max-height: min(97vh, 900px)` (15% increase from ~780px base, capped at reasonable max)
   - New: `min-height: 690px` (15% increase from 600px)
   - Ensure modal doesn't overflow viewport on smaller screens

2. **Bingo board size increase**:
   - Current desktop cell size: `min(90px, 18vw, 18vh)`
   - New: `min(104px, 21vw, 21vh)` (15% increase, rounded for cleaner values)
   - Ensure board remains centered and doesn't overflow modal
   - Verify board fits within modal content area

3. **Content area adjustment**:
   - Current: `max-height: calc(85vh - 280px)`
   - New: `max-height: calc(97vh - 280px)` (adjust for new modal height)
   - Ensure Article History tab maintains proper sizing
   - Verify content area doesn't overflow

4. **Responsive behavior**:
   - Mobile: Keep existing mobile sizing (no change needed per requirements)
   - Desktop: Apply 15% increase (use `@media (min-width: 768px)`)
   - Tablet: Consider proportional increase if needed

### Files to Modify

- `app/src/features/leaderboard/GameDetailsModal.css`

### Code Changes

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

### Testing

- Test modal sizing on various desktop screen sizes (1920x1080, 1366x768, etc.)
- Test modal doesn't overflow viewport on smaller screens
- Test bingo board fits within modal and remains centered
- Test Article History tab maintains proper sizing
- Test on tablet sizes (if applicable)
- Verify modal layout remains stable when switching tabs
- Test in both light and dark themes

### Acceptance Criteria

- ✅ Game review modal is 15% taller on desktop
- ✅ Bingo board is 15% larger on desktop
- ✅ Modal layout remains stable and functional
- ✅ Content area adjusts properly for new modal height
- ✅ Mobile sizing remains unchanged
- ✅ No layout overflow issues
- ✅ Works in both light and dark themes

### Status: ✅ COMPLETED

### Documentation

- Add CSS comments explaining the 15% increase calculation
- Document responsive breakpoints used

---

## Task 2: Fix Mobile Leaderboard Modal Tab Visibility

**Priority**: High  
**Complexity**: Medium  
**Estimated Time**: 1-2 hours

### Description

Fix the issue where article history overlays bingo board on mobile even when not selected. Ensure both tabs only display when their tab is actively selected.

### Requirements

1. **Verify tab state management**:
   - Check `activeTab` state in `GameDetailsModal.tsx` updates correctly on tab click
   - Verify conditional classes are applied correctly: `bp-game-details-tab-active` and `bp-game-details-tab-hidden`
   - Ensure state updates trigger re-renders correctly

2. **CSS visibility rules**:
   - Current classes: `.bp-game-details-tab-active` (display: flex) and `.bp-game-details-tab-hidden` (display: none)
   - Ensure these rules have sufficient specificity
   - Add `!important` if needed to override conflicting styles
   - Verify both tabs use absolute positioning correctly
   - Add `visibility: hidden` in addition to `display: none` for extra safety

3. **Mobile-specific fixes**:
   - Ensure tab content containers are properly hidden when not active
   - Verify `position: absolute` doesn't cause overlay issues
   - Test tab switching behavior on various mobile screen sizes
   - Ensure no z-index conflicts

4. **Component verification**:
   - Check JSX conditional rendering of tab classes
   - Verify both `.bp-game-details-board` and `.bp-game-details-history` have proper classes
   - Ensure tab switching logic is correct

### Files to Modify

- `app/src/features/leaderboard/GameDetailsModal.tsx` (verify tab state logic)
- `app/src/features/leaderboard/GameDetailsModal.css` (ensure visibility rules)

### Code Pattern

```css
/* Ensure proper visibility toggling */
.bp-game-details-board.bp-game-details-tab-hidden,
.bp-game-details-history.bp-game-details-tab-hidden {
  display: none !important;
  visibility: hidden !important;
  opacity: 0;
}

.bp-game-details-board.bp-game-details-tab-active,
.bp-game-details-history.bp-game-details-tab-active {
  display: flex !important;
  visibility: visible !important;
  opacity: 1;
}
```

### Testing

- Test switching from Board to History tab (History should appear, Board should hide)
- Test switching from History to Board tab (Board should appear, History should hide)
- Test on various mobile screen sizes (iPhone SE, iPhone 12, Android phones)
- Verify no overlay/stacking issues
- Test tab switching is smooth and responsive
- Verify both tabs work correctly when selected

### Acceptance Criteria

- ✅ Article history only displays when its tab is selected
- ✅ Bingo board only displays when its tab is selected
- ✅ No overlay issues on mobile
- ✅ Tab switching works correctly on all mobile screen sizes
- ✅ No visual glitches or flickering during tab switches
- ✅ Works in both light and dark themes

### Status: ✅ COMPLETED

### Documentation

- Add CSS comments explaining visibility toggling approach
- Document why `!important` is needed (if used)

---

## Task 3: Optimize Mobile Article Viewer Header Layout

**Priority**: High  
**Complexity**: Medium  
**Estimated Time**: 2-3 hours

### Description

Optimize the article viewer header for mobile by converting ToC button to hamburger icon, reducing button sizes, and improving article title handling.

### Requirements

1. **ToC button hamburger icon**:
   - Desktop: Keep current button with text "Table of Contents"
   - Mobile: Replace text with hamburger icon (☰ or three horizontal lines)
   - Use existing SVG icon in button (if available) or add hamburger icon
   - Hide text label on mobile, show icon only
   - Maintain accessibility: Keep `aria-label` with full text
   - Ensure button remains tappable (minimum 44x44px touch target)

2. **Button sizing optimization**:
   - Reduce padding on mobile: `padding: 0.375rem 0.75rem` (from `0.5rem 1rem`)
   - Reduce font size if text still visible: `font-size: 0.8rem` (from `0.875rem`)
   - Ensure buttons remain tappable (minimum 44x44px touch target)
   - Apply to both ToC button and "View on Wiki" button

3. **"View on Wiki" button**:
   - Reduce padding on mobile
   - Consider icon-only or shorter text on very small screens (optional)
   - Keep full text on larger mobile screens if space allows
   - Ensure button remains accessible

4. **Article title handling**:
   - Current: `word-break: break-word` (already implemented)
   - Enhance: Add `hyphens: auto` for better word breaking
   - Ensure title doesn't overflow container
   - Optimize font size on mobile: `font-size: 1.1rem` (from `1.25rem`)
   - Ensure title gets maximum available space

5. **Header layout**:
   - Reduce gap between elements on mobile: `gap: 0.5rem` (from `1rem`)
   - Reduce header padding on mobile: `padding: 0.75rem 1rem` (from `1rem 1.5rem`)
   - Ensure title gets maximum available space
   - Maintain proper alignment and spacing

### Files to Modify

- `app/src/features/article-viewer/ArticleViewer.tsx` (conditional rendering for mobile, if needed)
- `app/src/features/article-viewer/ArticleViewer.css` (mobile responsive styles)

### Code Pattern

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
    min-height: 44px;
  }
  
  .bp-toc-toggle-button span {
    display: none; /* Hide text on mobile */
  }
  
  .bp-toc-toggle-button svg {
    display: block; /* Show icon */
    width: 20px;
    height: 20px;
  }
  
  .bp-view-wikipedia-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    min-height: 44px; /* Touch target */
  }
}
```

### JSX Pattern (if needed)

```tsx
<button className="bp-toc-toggle-button" aria-label="Table of Contents" ...>
  <svg>...</svg>
  <span className="bp-toc-toggle-text">Table of Contents</span>
</button>
```

### Testing

- Test on various mobile screen sizes (iPhone SE, iPhone 12, Android phones)
- Verify hamburger icon displays correctly on mobile
- Verify text is hidden on mobile, shown on desktop
- Test button touch targets are at least 44x44px
- Test article title wrapping and truncation
- Test header layout doesn't overflow
- Test on very small screens (< 375px width)
- Verify accessibility (screen readers, keyboard navigation)
- Test in both light and dark themes

### Acceptance Criteria

- ✅ ToC button is hamburger icon on mobile
- ✅ ToC button shows text on desktop
- ✅ Buttons are appropriately sized for mobile (smaller but still tappable)
- ✅ Article titles display correctly without overflow
- ✅ Header layout is optimized for mobile
- ✅ Touch targets meet accessibility guidelines (44x44px minimum)
- ✅ Works on various mobile screen sizes
- ✅ Works in both light and dark themes

### Status: ✅ COMPLETED

### Documentation

- Add CSS comments explaining mobile optimizations
- Document touch target size requirements
- Document responsive breakpoint used

---

## Task 4: Update UI/UX Skills Documentation

**Priority**: Low  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Description

Document new UI/UX patterns learned during mobile optimization and modal sizing improvements.

### Requirements

1. **Document mobile optimization patterns**:
   - Hamburger icon conversion patterns
   - Mobile button sizing and touch target patterns
   - Responsive header layout patterns
   - Title wrapping and hyphenation patterns

2. **Document modal sizing patterns**:
   - Percentage-based size increases
   - Responsive modal sizing patterns
   - Tab visibility management patterns

### Files to Modify

- `/docs/skills/UI_UX_SKILLS.md`

### Content to Add

- New section: "Mobile Header Optimization Patterns"
- New section: "Modal Sizing and Tab Visibility Patterns"
- Include code examples and use cases

### Acceptance Criteria

- ✅ New patterns documented with code examples
- ✅ Patterns include context and use cases
- ✅ Documentation follows existing format

### Status: ✅ COMPLETED

---

## Summary

**Total Tasks**: 4  
**Critical Tasks**: 3 (Tasks 1, 2, 3)  
**Estimated Total Time**: 4.5-7.5 hours

**Dependencies**:
- Tasks 1, 2, and 3 are independent
- Task 4 is documentation

**Notes**:
- All tasks can be completed independently
- No manual QA required (all tasks have automated testing approaches)
- Code documentation is included in each task
- Skills documentation update is separate task (Task 4)
- Mobile testing should be done on real devices or responsive browser tools

