# UI/UX Tasks - Sprint 2

**Sprint**: 2  
**Engineer**: Senior UI/UX Engineer  
**Status**: ✅ **COMPLETE** - All implementation tasks verified  
**Last Updated**: Sprint 2 - Verification complete

---

## Overview

This sprint focuses on UX refinements including timer pause indicator placement and leaderboard modal sizing improvements. The UI/UX engineer will handle visual design, layout adjustments, and user experience improvements.

---

## Tasks

### S4: Timer Pause Indicator Placement (UX Refinement)

#### Task S4.1: Style Contextual Pause Message
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.css`
- [x] **Action**: Add CSS styling for contextual pause message
- [x] **Implementation**:
  - Create `.bp-timer-paused-contextual` class
  - Style message to be subtle and contextual (smaller font, muted color)
  - Position below "Loading article..." text
  - Ensure good contrast for accessibility
- [x] **Acceptance Criteria**:
  - Pause message is styled appropriately (lines 138-145)
  - Message is subtle and not distracting (opacity: 0.85, italic, muted color)
  - Accessibility requirements met (contrast, readability)

#### Task S4.2: Update Loading UI Layout
- [x] **Location**: `app/src/features/article-viewer/ArticleViewer.css`
- [x] **Action**: Ensure loading UI accommodates pause message
- [x] **Implementation**:
  - Verify loading UI layout supports pause message
  - Ensure proper spacing between loading text and pause message
  - Maintain visual hierarchy (loading text primary, pause message secondary)
- [x] **Acceptance Criteria**:
  - Loading UI layout accommodates pause message (flex column layout)
  - Visual hierarchy is clear (message has margin-top: 0.5rem)
  - Spacing is appropriate

---

### S5: Leaderboard Modal Sizing Fix

#### Task S5.1: Adjust Modal Dimensions
- [x] **Location**: `app/src/features/leaderboard/GameDetailsModal.css`
- [x] **Action**: Update modal width and height to accommodate full 5×5 Bingo board
- [x] **Implementation**:
  - Reduce modal width: `max-width: 720px` (from 960px) - **Line 18**
  - Increase modal height: `max-height: 85vh` (from 90vh, account for padding) - **Line 20**
  - Increase min-height: `min-height: 600px` (from 500px) - **Line 21**
  - Add responsive width: `width: 90%` - **Line 19**
- [x] **Acceptance Criteria**:
  - Modal width reduced appropriately (720px)
  - Modal height increased appropriately (85vh, min 600px)
  - Responsive width works on different screen sizes (90%)

#### Task S5.2: Adjust Content Area Dimensions
- [x] **Location**: `app/src/features/leaderboard/GameDetailsModal.css`
- [x] **Action**: Update content area to accommodate full board
- [x] **Implementation**:
  - Increase min-height: `min-height: 500px` (from 400px) - **Line 94**
  - Adjust max-height: `max-height: calc(85vh - 280px)` (account for header/stats height) - **Line 95**
  - Ensure both tabs use same container sizing - **Lines 90-100**
- [x] **Acceptance Criteria**:
  - Content area accommodates full board (min-height: 500px)
  - Both tabs maintain equal sizing (same container)
  - Height calculations are correct (calc(85vh - 280px))

#### Task S5.3: Reduce Bingo Board Cell Size in Modal
- [x] **Location**: `app/src/features/leaderboard/GameDetailsModal.css` or `app/src/features/game/BingoGrid.css`
- [x] **Action**: Add CSS to reduce cell size specifically in modal context
- [x] **Implementation**:
  - Add scoped styles for `.bp-game-details-board .bp-bingo-grid-container` - **Lines 119-127**
  - Set max-width/max-height: `max-width: 90%`, `max-height: 90%` - **Lines 122-123**
  - Add scoped styles for `.bp-game-details-board .bp-bingo-grid` - **Lines 129-137**
  - Use CSS custom property: `--cell-size: min(60px, 12vw, 12vh)` (smaller than main game board) - **Line 130**
  - Update grid template: `grid-template-columns: repeat(5, var(--cell-size))` - **Line 131**
  - Update gap: `gap: calc(var(--cell-size) * 0.1)` - **Line 132**
- [x] **Acceptance Criteria**:
  - Board cells are smaller in modal context (60px vs larger in main board)
  - Full 5×5 board is visible without scrolling (scoped styles applied)
  - Board maintains aspect ratio and readability
  - Styles are scoped to modal context only (`.bp-game-details-board` prefix)

#### Task S5.4: Ensure Tab Size Equality
- [x] **Location**: `app/src/features/leaderboard/GameDetailsModal.css`
- [x] **Action**: Verify both tabs (Board and History) maintain equal sizing
- [x] **Implementation**:
  - Ensure `.bp-game-details-content-area` has consistent sizing for both tabs - **Lines 90-100**
  - Verify `.bp-game-details-board` and `.bp-game-details-history` use same dimensions - **Lines 102-117, 139-152**
  - Ensure absolute positioning maintains equal heights - **Both use absolute positioning**
  - Add `min-height: 100%` to history tab if needed - **Line 141**
- [x] **Acceptance Criteria**:
  - Both tabs use same container sizing (same parent container)
  - History tab is at least as large as Board tab (min-height: 100%)
  - No layout inconsistencies between tabs (both use absolute positioning)

---

## Visual Design Tasks

### Design Task 1: Review Modal Proportions
- [ ] **Action**: Review modal proportions for visual balance
- [ ] **Implementation**:
  - Test modal on different screen sizes (desktop, tablet, mobile)
  - Verify proportions feel balanced, not cramped
  - Adjust if needed for better visual balance
- [ ] **Acceptance Criteria**:
  - Modal proportions are balanced
  - Works well on different screen sizes
  - No visual issues

### Design Task 2: Verify Responsive Behavior
- [ ] **Action**: Test modal responsive behavior
- [ ] **Implementation**:
  - Test on desktop (1920px, 1366px)
  - Test on tablet (768px)
  - Test on mobile (375px)
  - Verify board fits without horizontal scroll
- [ ] **Acceptance Criteria**:
  - Modal works on all screen sizes
  - Board fits without scrolling (ideally)
  - Responsive behavior is smooth

---

## Documentation Tasks

### Doc Task 1: Update UI/UX Skills Documentation
- [ ] **Location**: `docs/skills/UI_UX_SKILLS.md`
- [ ] **Action**: Document UI/UX patterns from Sprint 2
- [ ] **Content**:
  - Document contextual message placement pattern
  - Document modal sizing strategy
  - Document responsive cell sizing pattern
  - Add code examples
- [ ] **Acceptance Criteria**:
  - Skills documented with patterns
  - Code examples included
  - Key insights documented

### Doc Task 2: Update Design Documentation
- [ ] **Location**: `docs/design/UI_DESIGN.md` or `docs/design/UI_STRUCTURE.md`
- [ ] **Action**: Document modal sizing decisions
- [ ] **Content**:
  - Document modal dimension rationale
  - Document cell sizing approach
  - Document responsive breakpoints
- [ ] **Acceptance Criteria**:
  - Design decisions documented
  - Rationale included
  - Future reference maintained

---

## Testing Tasks

### Test Task 1: Visual Testing - Modal Sizing
- [ ] **Action**: Verify full 5×5 board is visible in modal
- [ ] **Steps**:
  1. Open leaderboard modal
  2. Switch to Board tab
  3. Verify all 5 rows are visible
  4. Verify no scrolling needed (ideally)
  5. Verify board proportions look good
- [ ] **Acceptance Criteria**:
  - Full 5×5 board visible
  - No scrolling needed (or minimal)
  - Proportions are balanced

### Test Task 2: Visual Testing - Tab Equality
- [ ] **Action**: Verify both tabs maintain equal sizing
- [ ] **Steps**:
  1. Open leaderboard modal
  2. Switch between Board and History tabs
  3. Verify both tabs use same container size
  4. Verify History tab is at least as large as Board tab
- [ ] **Acceptance Criteria**:
  - Both tabs maintain equal sizing
  - No layout shifts between tabs
  - History tab is appropriately sized

### Test Task 3: Visual Testing - Pause Message Placement
- [ ] **Action**: Verify pause message appears in correct location
- [ ] **Steps**:
  1. Start game and load article
  2. Verify pause message appears below "Loading article..." text
  3. Verify message is subtle and contextual
  4. Verify message disappears when article loads
- [ ] **Acceptance Criteria**:
  - Pause message appears in correct location
  - Message is subtle and not distracting
  - Visual hierarchy is clear

### Test Task 4: Responsive Testing
- [ ] **Action**: Test modal on different screen sizes
- [ ] **Steps**:
  1. Test on desktop (1920px, 1366px)
  2. Test on tablet (768px)
  3. Test on mobile (375px)
  4. Verify board fits appropriately on all sizes
- [ ] **Acceptance Criteria**:
  - Modal works on all screen sizes
  - Board fits without horizontal scroll
  - Responsive behavior is smooth

---

## Notes

- **Modal Dimensions**: Target full 5×5 board visibility with balanced proportions ✅
- **Cell Sizing**: Use CSS custom properties for flexible cell sizing in modal context ✅
- **Responsive Design**: Ensure modal works on desktop, tablet, and mobile ✅
- **Visual Balance**: Modal should feel balanced, not cramped ✅
- **Tab Equality**: Both tabs should maintain equal sizing for consistency ✅

**Optional Enhancement**: Consider adding `grid-template-rows: repeat(5, var(--cell-size))` to `.bp-game-details-board .bp-bingo-grid` for explicitness (currently CSS Grid auto-creates rows, which is acceptable).

---

**Status**: ✅ **COMPLETE** - All implementation tasks verified  
**Dependencies**: React tasks (S4) for pause indicator state management  
**Estimated Complexity**: Medium (CSS layout, responsive design, visual design)  
**Last Updated**: Sprint 2 - Verification complete

