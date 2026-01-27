## UI/UX TASKS – Sprint 1

**Source**: `SPRINT_1_ARCHITECTURE.md`  
**Role**: Senior UI/UX Engineer  
**Last Updated**: Sprint 1

---

## 1. Leaderboard Game-Details Modal (S2)

- **UX-S2-1 – Specify stable modal layout behavior**
  - Define the desired behavior for the leaderboard game-details modal:
    - Fixed/max width on desktop (e.g., ~960px), with a consistent visual frame.
    - Max-height with internal vertical scrolling for content.
    - No visible “jump” in width/height when switching between Board and History views.
  - Document this in `docs/archive/ui-design/UI_STRUCTURE.md` or `UI_DESIGN.md` with “Last Updated: Sprint 1”.

- **UX-S2-2 – Design tabbed content interaction**
  - Specify how users switch between “Board” and “History”:
    - Clear labeling, active tab indication, and keyboard-focusable controls.
    - Expected animations/transitions (if any) that do not cause layout thrash.
  - Provide guidance on responsive behavior for smaller viewports.

- **UX-S2-3 – Validate implemented modal**
  - After frontend implementation, review the modal across:
    - Desktop (multiple viewport widths).
    - Tablet and mobile.
  - Confirm:
    - Accessibility basics (focus trap, ESC close, ARIA attributes on modal).
    - No disruptive size changes during typical user flows.

---

## 2. Table of Contents Overlay (S3)

- **UX-S3-1 – Define ToC entry and overlay behavior**
  - Specify:
    - Placement of the ToC trigger (button in article header/toolbar).
    - Desktop presentation (centered modal or side-docked overlay with fixed width).
    - Mobile presentation (full-screen/sheet-style overlay with clear close controls).
  - Clarify expected scroll behavior when a ToC entry is clicked:
    - Smooth scroll vs instant.
    - Whether the overlay closes immediately on selection.

- **UX-S3-2 – Interaction & accessibility design**
  - Provide guidelines for:
    - Keyboard navigation within the ToC list.
    - Focus management when opening/closing the overlay.
    - Handling long ToC lists (scrolling, section grouping, or indentation).
  - Update `docs/archive/ui-design/UI_UX_TASKS.md` or related docs to capture ToC UX patterns with “Last Updated: Sprint 1”.

- **UX-S3-3 – Visual design alignment**
  - Ensure ToC overlay styling aligns with:
    - Existing modal theming (colors, typography) from `THEME_COLOR_PALETTE.md`.
    - Overall layout tokens used in the app.
  - Provide updated mocks or lightweight diagrams if necessary.

---

## 3. Article Link & Loading Feedback (S4, S5, S6, S7)

- **UX-S4-1 – Define neutral styling for non-clickable text**
  - Specify how non-navigational text should appear:
    - No underline, standard body color, no hover color change, default cursor.
  - Clarify any exceptions (e.g., footnote markers) and ensure they are documented.

- **UX-S5-1 – Confirm hover behavior expectations**
  - Document the expected hover behavior for clickable article links:
    - Color change, underline on hover, or both.
    - Consistent behavior regardless of timer ticks or other background updates.
  - Review the implemented behavior once engineering completes timer isolation.

- **UX-S6-1 – Design loading feedback for article navigation**
  - Define visual indicators when an article is loading:
    - Spinner, skeleton, dimming, or progress bar near the article content.
    - Clear but not overwhelming; does not block reading of current content.
  - Ensure click feedback feels immediate even before content finishes loading.

- **UX-S7-1 – Timer paused messaging**
  - Specify the exact copy and style for timer pause messaging when articles are loading:
    - Short, clear phrase (e.g., “Timer paused while loading article”).
    - Placement in the score/timer panel.
  - Confirm that the message is readable and does not compete with primary timer information.

---

## 4. Verification & Documentation

- **UX-VERIFY-1 – Cross-device UX regression pass**
  - Perform a focused UX pass after implementation to verify:
    - Leaderboard modal stability.
    - ToC overlay usability.
    - Article link and loading feedback clarity.
    - Timer paused messaging visibility.

- **UX-DOC-1 – Update UI/UX reference docs**
  - For any new patterns (modal shells, ToC overlay, loading indicators, timer messaging), update:
    - `UI_DESIGN.md`
    - `UI_POLISH_CHECKLIST.md`
  - Ensure each updated doc is annotated with “Last Updated: Sprint 1”.


