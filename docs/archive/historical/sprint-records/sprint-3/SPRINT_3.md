## Sprint 3 – Article Navigation Reliability & Table of Contents Implementation

### 1. Overview

This sprint focuses on **fixing critical article navigation bugs** that prevent reliable gameplay and **implementing the missing Table of Contents feature** as a modal. The scope addresses race conditions in link navigation, redirect resolution issues, and completes the Table of Contents functionality that was partially implemented but missing from the UI.

### 2. Goals

- **G1 – Fix article navigation race conditions and reliability**  
  - Prevent navigation to incorrect URLs when links are clicked multiple times rapidly.
  - Ensure first click on article links always works reliably.
  - Fix redirect resolution logic that causes article loading hangs.
- **G2 – Implement Table of Contents modal**  
  - Add Table of Contents button/control to article viewer.
  - Implement modal that opens on button press and closes on blur/click.
  - Enable smooth scrolling to article sections when ToC items are clicked.
- **G3 – Enhance leaderboard game details Bingo board display**  
  - Increase Bingo board size in leaderboard game details modal for better visibility on desktop.

### 3. In-Scope Work (User Feedback Mapping)

Each item references `USER_FEEDBACK.md` and, where applicable, existing PRD sections.

- **S1 – Fix navigation race condition from multiple rapid clicks (Critical – Gameplay blocker)**  
  - Map from feedback: **Item 1 – "http://localhost:5173/Outline_of_political_science this link was navigated to from the article viewer. This shouldn't be possible. It happens if I click the link multiple times before it has a chance to start loading in the article viewer."**  
  - Implement proper link click debouncing/throttling to prevent multiple navigation attempts.
  - Ensure that once a navigation is initiated, subsequent clicks on the same or different links are ignored until the current navigation completes.
  - Add loading state management to prevent race conditions between rapid clicks.
  - Ensure navigation state is properly locked during article loading, consistent with **FR10B – Immediate click feedback** in `PRODUCT_PRD.md`.
  - Acceptance: Rapid clicking on article links does not cause navigation to incorrect URLs; only the intended article loads.

- **S2 – Fix first-click reliability on article links**  
  - Map from feedback: **Item 4 – "Clicking the first time on an article link doesn't always work."**  
  - Investigate and fix the root cause of first-click failures (may be related to event handling, state initialization, or link processing).
  - Ensure click handlers are properly attached and event propagation is handled correctly.
  - Verify that immediate click feedback (per **FR10B**) works on first click as well as subsequent clicks.
  - Acceptance: First click on any article link reliably initiates navigation; no missed clicks.

- **S3 – Fix redirect resolution logic causing article loading hangs**  
  - Map from feedback: **Item 5 – "On article never finished loading. I tried again on a repeat of the game, and the highlighted link was 'City' and it first loaded 'List of cities in Illinois' and then later changed the article title to 'List of municipalities in Illinois'. I think the earlier hang up had to do with this switching logic, which was probably implemented to fix link redirects."**  
  - Review and fix redirect resolution logic to prevent article title switching during load.
  - Ensure redirect resolution happens **before** article content is displayed, not during rendering.
  - Implement proper error handling and timeout for redirect resolution to prevent infinite loading states.
  - Align with **FR6 – Redirect resolution** in `PRODUCT_PRD.md`, ensuring redirects are resolved efficiently without causing UI instability.
  - Add fallback behavior if redirect resolution takes too long or fails.
  - Acceptance: Articles load reliably without hanging; redirect resolution does not cause title switching during article display; loading completes or fails gracefully with retry logic.

- **S4 – Implement Table of Contents modal (Critical – Missing feature)**  
  - Map from feedback: **Item 3 – "Table of Contents in article viewer is missing. It needs to be in a modal that pops up on a button press and disappears on blur (or click). When the user clicks one of the items on the table, it should scroll them to that part of the article."**  
  - Add a "Table of Contents" button or icon control to the article viewer (visible on all articles).
  - Implement modal/overlay that opens when ToC button is clicked.
  - Modal should display the Wikipedia-style table of contents extracted from article HTML.
  - Modal should close when:
    - User clicks the close button/icon.
    - User clicks outside the modal (blur/backdrop click).
    - User clicks a ToC item (after scrolling to section).
  - Implement smooth scrolling to article sections when ToC items are clicked, per **FR10A – Table of contents** in `PRODUCT_PRD.md`.
  - Ensure ToC modal works correctly in both light and dark themes.
  - Ensure ToC modal is accessible and works well on mobile and desktop.
  - Verify ToC extraction and display logic is correct (not showing "v", "t", "e" as in previous bug).
  - Acceptance: ToC button is visible in article viewer; clicking it opens a modal with correct section titles; clicking ToC items smoothly scrolls to sections; modal closes appropriately on blur/click.

- **S5 – Increase Bingo board size in leaderboard game details modal**  
  - Map from feedback: **Item 2 – "Bingo board in leaderboard games on desktop can be about 50% larger in height and width."**  
  - Increase Bingo board dimensions in the leaderboard game details modal by approximately 50% in both height and width.
  - Ensure modal layout accommodates the larger board without breaking.
  - Verify that Article History tab maintains appropriate sizing relative to Bingo Board tab.
  - Ensure larger board remains visible and usable on common desktop resolutions.
  - Acceptance: Bingo board in leaderboard game details modal is approximately 50% larger in both dimensions; modal layout remains stable and functional.

### 4. Out of Scope for This Sprint

- New features beyond fixing navigation reliability and implementing ToC modal.
- Major visual redesigns beyond targeted Bingo board size increase.
- Backend schema changes.
- Performance optimizations unrelated to navigation and ToC functionality.

### 5. Success Criteria (Sprint-Level)

- **SC1**: Article navigation is reliable; rapid clicking does not cause incorrect URL navigation.
- **SC2**: First click on article links works consistently.
- **SC3**: Articles load without hanging; redirect resolution does not cause title switching during display.
- **SC4**: Table of Contents modal is implemented and functional; ToC items scroll to sections correctly.
- **SC5**: Bingo board in leaderboard game details modal is approximately 50% larger and displays properly.

### 6. Links

- Source feedback: `USER_FEEDBACK.md`  
- Product spec reference: `PRODUCT_PRD.md` (see especially **FR6 – Redirect resolution**, **FR10A – Table of contents**, **FR10B – Immediate click feedback**, and **Section 4.9 – Leaderboard UX**).

