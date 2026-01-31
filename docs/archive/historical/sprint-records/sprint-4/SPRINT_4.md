## Sprint 4 – Table of Contents Fixes & Mobile UX Improvements

### 1. Overview

This sprint focuses on **fixing critical Table of Contents functionality** that is currently broken and **improving mobile user experience** for article viewing and leaderboard game review. The scope addresses ToC loading issues, scrolling behavior, image cursor styling, and mobile layout improvements for better usability.

### 2. Goals

- **G1 – Fix Table of Contents functionality**  
  - Fix ToC loading issues (sometimes nothing loads, sometimes incorrect data).
  - Ensure ToC displays correct section headers from articles.
  - Implement proper smooth scrolling to sections when ToC items are clicked.
- **G2 – Improve article viewer image interaction**  
  - Remove pointer cursor from images in article viewer.
  - Ensure images display with default cursor behavior.
- **G3 – Enhance leaderboard game review modal sizing**  
  - Increase modal height by 15% for better visibility.
  - Increase bingo board size by 15% within the modal.
- **G4 – Fix mobile leaderboard game review modal layout**  
  - Fix article history overlay issue on mobile view.
  - Ensure article history only displays when its tab is selected.
- **G5 – Improve mobile article viewer header layout**  
  - Optimize ToC and View on Wiki button sizing for mobile.
  - Convert ToC button to hamburger menu icon on mobile.
  - Improve article title handling and display on mobile viewports.

### 3. In-Scope Work (User Feedback Mapping)

Each item references `USER_FEEDBACK.md` and, where applicable, existing PRD sections.

- **S1 – Fix Table of Contents loading and data display (Critical – Feature broken)**  
  - Map from feedback: **Item 1 – "The Table of Contents appears to be broken. Sometimes nothing loads. Sometimes it loads seemingly incorrect data. But no matter what it doesn't actually scroll the page. It needs to show the right section headers and scroll to the right place."**  
  - Investigate and fix root causes of ToC loading failures:
    - Debug why ToC sometimes fails to load (check parsing logic, HTML extraction).
    - Fix incorrect data display (ensure section headers are correctly extracted from article HTML).
    - Verify ToC extraction logic matches Wikipedia's ToC structure.
  - Fix scrolling behavior:
    - Implement proper smooth scrolling to article sections when ToC items are clicked.
    - Ensure section anchors are correctly identified and scrolled to.
    - Verify scroll behavior works in both light and dark themes.
    - Test scrolling on both mobile and desktop layouts.
  - Align with **FR10A – Table of contents** in `PRODUCT_PRD.md`, ensuring ToC displays correctly and scrolling works reliably.
  - Acceptance: ToC always loads correctly with proper section headers; clicking ToC items smoothly scrolls to the correct section; no incorrect or missing data.

- **S2 – Fix image cursor styling in article viewer**  
  - Map from feedback: **Item 2 – "Images in the article viewer shouldn't have the mouse pointer hand. Just be the normal pointer."**  
  - Remove pointer cursor styling from images within article viewer content.
  - Ensure images display with default cursor (not hand/pointer cursor).
  - Verify images remain non-clickable (per existing behavior) but with correct cursor styling.
  - Update CSS to target images within article viewer and set cursor to default.
  - Acceptance: Images in article viewer display with default cursor (not pointer hand); images remain non-clickable as intended.

- **S3 – Increase leaderboard game review modal and bingo board size**  
  - Map from feedback: **Item 3 – "The game review modal from the leaderboard should be 15% longer. The bingo board in that view can also be 15% larger."**  
  - Increase modal height by 15% for better content visibility.
  - Increase bingo board dimensions by 15% within the modal.
  - Ensure modal layout accommodates larger board without breaking.
  - Verify that Article History tab maintains appropriate sizing relative to Bingo Board tab.
  - Ensure larger modal and board remain visible and usable on common desktop resolutions.
  - Align with **Section 4.9 – Leaderboard UX** in `PRODUCT_PRD.md`, which specifies modal sizing requirements.
  - Acceptance: Game review modal is 15% taller; bingo board is 15% larger; modal layout remains stable and functional.

- **S4 – Fix mobile leaderboard game review modal article history overlay**  
  - Map from feedback: **Item 4 – "In mobile view, the leaderboard game review modal shows the article history on top of the bingo board, obscuring the board. It should only be visible when the tab is selected."**  
  - Fix tab visibility logic in mobile view:
    - Ensure Article History tab content only displays when its tab is actively selected.
    - Ensure Bingo Board tab content displays when its tab is selected.
    - Prevent article history from overlaying or obscuring bingo board when not selected.
  - Verify tab switching works correctly on mobile viewports.
  - Ensure modal layout properly handles tab content switching without overlay issues.
  - Test on various mobile screen sizes to ensure consistent behavior.
  - Acceptance: Article history only displays when its tab is selected; bingo board is not obscured; tab switching works correctly on mobile.

- **S5 – Improve mobile article viewer header layout**  
  - Map from feedback: **Item 5 – "Titles of articles in the viewer in mobile view are very poorly handled. The ToC and View on Wiki buttons take up a lot of horizontal space. They can be much smaller (ToC can be a hamburger menu icon) and the titles can have better handling."**  
  - Optimize button sizing for mobile:
    - Reduce size of "View on Wiki" button on mobile viewports.
    - Convert Table of Contents button to hamburger menu icon (☰) on mobile.
    - Ensure buttons remain accessible and tappable on mobile.
  - Improve article title display:
    - Better handling of long article titles on mobile (text wrapping, truncation, or responsive sizing).
    - Ensure title remains readable and doesn't overflow or get cut off.
    - Optimize header layout to maximize space for title while keeping buttons accessible.
  - Test on various mobile screen sizes to ensure consistent layout.
  - Acceptance: ToC button is hamburger icon on mobile; buttons are appropriately sized; article titles display correctly without overflow; header layout is optimized for mobile.

### 4. Out of Scope for This Sprint

- New features beyond fixing ToC and mobile UX issues.
- Major visual redesigns beyond targeted sizing and layout improvements.
- Backend schema changes.
- Performance optimizations unrelated to ToC and mobile layout functionality.

### 5. Success Criteria (Sprint-Level)

- **SC1**: Table of Contents loads correctly with proper section headers; clicking items scrolls to correct sections.
- **SC2**: Images in article viewer display with default cursor (not pointer hand).
- **SC3**: Leaderboard game review modal is 15% taller; bingo board is 15% larger.
- **SC4**: Article history in mobile leaderboard modal only displays when tab is selected; no overlay issues.
- **SC5**: Mobile article viewer header is optimized with hamburger ToC icon and improved title handling.

### 6. Links

- Source feedback: `USER_FEEDBACK.md`  
- Product spec reference: `PRODUCT_PRD.md` (see especially **FR10A – Table of contents**, **Section 4.4 – Article Viewer UX**, and **Section 4.9 – Leaderboard UX**).

