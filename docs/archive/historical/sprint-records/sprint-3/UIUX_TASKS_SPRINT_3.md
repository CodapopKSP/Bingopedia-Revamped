# UI/UX Tasks - Sprint 3

**Sprint**: Sprint 3 - Article Navigation Reliability & Table of Contents Implementation  
**Engineer**: Senior UI/UX Engineer  
**Status**: In Progress  
**Last Updated**: Sprint 3

---

## Overview

This document contains UI/UX tasks for implementing the Table of Contents modal styling and increasing the Bingo board size in the leaderboard game details modal.

**Related Documentation**:
- Architecture: `SPRINT_3_ARCHITECTURE.md`
- Product Requirements: `docs/PRODUCT_PRD.md` (FR10A, Section 4.9)
- UI/UX Skills: `docs/skills/UI_UX_SKILLS.md`
- Design Reference: `docs/design/UI_DESIGN.md`

---

## Task List

### S4: Implement Table of Contents Modal (UI/UX Styling)

**Goal**: Style the ToC modal to match existing modal patterns and ensure good UX.

**Related Architecture**: Section 3 - Table of Contents Modal Implementation (S4)

**Note**: React component implementation handled in FRONTEND_TASKS_SPRINT_3.md

#### Task S4.1: Style ToC Button
- [ ] **Location**: `app/src/features/article-viewer/ArticleViewer.css`
- [ ] **Action**: Add styling for ToC button to match existing article viewer controls
- [ ] **Implementation**:
  - Add `.bp-toc-button` class styles
  - Match existing button styles (if any) or create consistent styling
  - Ensure button is visible and accessible
  - Add hover and active states
  - Ensure disabled state is visually clear
  - Support light/dark theme (use CSS variables)
- [ ] **Acceptance Criteria**:
  - Button matches existing article viewer controls
  - Button has clear hover/active/disabled states
  - Button works in both light and dark themes
  - Button is accessible (sufficient contrast, clear focus state)

#### Task S4.2: Style ToC Modal Overlay and Container
- [ ] **Location**: `app/src/features/article-viewer/ArticleViewer.css`
- [ ] **Action**: Style modal overlay and content container
- [ ] **Implementation**:
  - Add `.bp-toc-overlay` styles (consistent with other modals)
  - Add `.bp-toc-modal-content` styles
  - Ensure modal is centered and properly sized
  - Add backdrop blur/overlay effect (consistent with other modals)
  - Ensure modal is responsive (mobile and desktop)
  - Support light/dark theme
- [ ] **Acceptance Criteria**:
  - Modal overlay matches other modals (WinModal, ArticleSummaryModal)
  - Modal is centered and properly sized
  - Modal is responsive (works on mobile and desktop)
  - Modal supports light/dark theme

#### Task S4.3: Style ToC Modal Header
- [ ] **Location**: `app/src/features/article-viewer/ArticleViewer.css`
- [ ] **Action**: Style modal header with title and close button
- [ ] **Implementation**:
  - Style `.bp-modal-header` (if not already styled globally)
  - Style close button (`.bp-modal-close`)
  - Ensure close button is clearly visible and accessible
  - Add hover/active states for close button
  - Ensure header is consistent with other modals
- [ ] **Acceptance Criteria**:
  - Header matches other modal headers
  - Close button is clearly visible and accessible
  - Close button has hover/active states
  - Header supports light/dark theme

#### Task S4.4: Style ToC Modal Body and Content
- [ ] **Location**: `app/src/features/article-viewer/ArticleViewer.css` or `app/src/features/article-viewer/TableOfContents.css`
- [ ] **Action**: Style modal body and ToC content
- [ ] **Implementation**:
  - Ensure modal body is scrollable if ToC is long
  - Style ToC items for readability
  - Ensure proper spacing and hierarchy
  - Add hover states for ToC items
  - Ensure ToC items are keyboard accessible
  - Support light/dark theme
- [ ] **Acceptance Criteria**:
  - Modal body scrolls correctly when ToC is long
  - ToC items are readable and well-spaced
  - ToC items have hover states
  - ToC items are keyboard accessible
  - ToC supports light/dark theme

#### Task S4.5: Style ToC Empty/Loading State
- [ ] **Location**: `app/src/features/article-viewer/ArticleViewer.css`
- [ ] **Action**: Style empty and loading states in modal
- [ ] **Implementation**:
  - Style empty state message (when ToC is empty)
  - Style loading state (when ToC is being extracted)
  - Ensure states are visually clear and user-friendly
  - Support light/dark theme
- [ ] **Acceptance Criteria**:
  - Empty state is clear and user-friendly
  - Loading state is clear and user-friendly
  - States support light/dark theme

#### Task S4.6: Ensure Accessibility
- [ ] **Location**: `app/src/features/article-viewer/ArticleViewer.tsx` and CSS
- [ ] **Action**: Ensure ToC modal is fully accessible
- [ ] **Implementation**:
  - Verify focus management (focus trap in modal)
  - Ensure keyboard navigation works (ESC to close)
  - Verify ARIA labels are correct
  - Test with screen reader
  - Ensure sufficient color contrast
- [ ] **Acceptance Criteria**:
  - Modal has proper focus management
  - Keyboard navigation works (ESC closes modal)
  - ARIA labels are correct
  - Screen reader compatible
  - Sufficient color contrast

---

### S5: Increase Bingo Board Size in Leaderboard Game Details Modal

**Goal**: Increase Bingo board size by ~50% on desktop while maintaining mobile usability.

**Related Architecture**: Section 4 - Leaderboard Bingo Board Sizing (S5)

#### Task S5.1: Add Desktop Media Query for Larger Board
- [ ] **Location**: `app/src/features/leaderboard/GameDetailsModal.css`
- [ ] **Action**: Add media query to increase board size on desktop
- [ ] **Implementation**:
  - Add media query: `@media (min-width: 768px) { ... }`
  - Target `.bp-game-details-board .bp-bingo-grid`
  - Increase cell size: `--cell-size: min(90px, 18vw, 18vh)` (50% larger than 60px)
  - Update grid template: `grid-template-columns: repeat(5, var(--cell-size))`
  - Update gap: `gap: calc(var(--cell-size) * 0.1)`
- [ ] **Acceptance Criteria**:
  - Desktop board is ~50% larger (90px vs 60px)
  - Mobile board maintains original size (60px)
  - Breakpoint at 768px (tablet/desktop boundary)
  - Grid layout remains correct

#### Task S5.2: Ensure Modal Layout Accommodates Larger Board
- [ ] **Location**: `app/src/features/leaderboard/GameDetailsModal.css`
- [ ] **Action**: Verify modal layout works with larger board
- [ ] **Implementation**:
  - Review modal height constraints
  - Ensure board container accommodates larger board
  - Verify Article History tab maintains appropriate sizing
  - Ensure board remains centered
  - Test on common desktop resolutions (1920x1080, 1366x768)
- [ ] **Acceptance Criteria**:
  - Modal layout doesn't break with larger board
  - Board remains centered
  - Article History tab maintains appropriate sizing
  - Layout works on common desktop resolutions

#### Task S5.3: Test Responsive Behavior
- [ ] **Location**: Manual testing
- [ ] **Action**: Test board sizing across viewport sizes
- [ ] **Test Cases**:
  - Desktop (≥768px): Board should be ~50% larger
  - Tablet (768px): Board should be larger (desktop size)
  - Mobile (<768px): Board should maintain original size (60px)
  - Very large screens: Board should scale appropriately
- [ ] **Acceptance Criteria**:
  - Board sizes correctly at all breakpoints
  - No layout breaks or overflow issues
  - Board remains usable and readable

---

### General Tasks

#### Task G1: Visual Consistency Check
- [ ] **Action**: Ensure all new UI elements match existing design system
- [ ] **Checklist**:
  - ToC button matches existing controls
  - ToC modal matches other modals (WinModal, ArticleSummaryModal)
  - Board sizing is consistent with design system
  - Colors, spacing, typography are consistent
- [ ] **Acceptance Criteria**:
  - All UI elements match design system
  - No visual inconsistencies

#### Task G2: Mobile Responsiveness Check
- [ ] **Action**: Verify all changes work well on mobile devices
- [ ] **Checklist**:
  - ToC modal works on mobile (proper sizing, scrolling)
  - ToC button is accessible on mobile
  - Board sizing works correctly on mobile (maintains original size)
  - Touch interactions work correctly
- [ ] **Acceptance Criteria**:
  - All features work well on mobile
  - No mobile-specific issues

#### Task G3: Theme Support Verification
- [ ] **Action**: Verify all new UI elements support light/dark themes
- [ ] **Checklist**:
  - ToC button works in both themes
  - ToC modal works in both themes
  - Board sizing works in both themes
  - All colors use CSS variables
- [ ] **Acceptance Criteria**:
  - All features work in both light and dark themes
  - No hardcoded colors

#### Task G4: Update UI/UX Skills Documentation
- [ ] **Location**: `docs/skills/UI_UX_SKILLS.md`
- [ ] **Action**: Document new UI/UX patterns learned
- [ ] **Implementation**:
  - Document ToC modal styling patterns
  - Document responsive board sizing pattern
  - Include code examples and key insights
- [ ] **Acceptance Criteria**:
  - Patterns documented with code examples
  - Key insights explained
  - Date and context included

---

## Notes

- ToC modal should match existing modal patterns (WinModal, ArticleSummaryModal)
- Board sizing uses CSS media queries for responsive design
- All styling should use CSS variables for theme support
- Mobile-first approach: maintain mobile usability while enhancing desktop experience

---

## Success Criteria

- ✅ ToC button styled and matches existing controls
- ✅ ToC modal styled consistently with other modals
- ✅ ToC modal is accessible and keyboard navigable
- ✅ Bingo board is ~50% larger on desktop (≥768px)
- ✅ Board maintains original size on mobile (<768px)
- ✅ Modal layout remains stable with larger board
- ✅ All features support light/dark themes
- ✅ All features work well on mobile devices

