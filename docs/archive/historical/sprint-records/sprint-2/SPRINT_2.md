## Sprint 2 – Table of Contents Performance & UX Refinements

### 1. Overview

This sprint focuses on **fixing critical Table of Contents functionality and performance issues**, addressing image interaction bugs, and refining UX elements that distract from gameplay. The scope prioritizes making the Table of Contents feature both functional and performant, while improving clarity around game state indicators.

### 2. Goals

- **G1 – Make Table of Contents functional and performant**  
  - Table of Contents must load instantly and display correctly formatted content.
  - ToC links must reliably navigate to article sections.
- **G2 – Fix image interaction bugs**  
  - Prevent images from triggering navigation when clicked.
- **G3 – Improve game state communication clarity**  
  - Timer pause indicator should be less distracting and more contextually placed.
- **G4 – Enhance leaderboard game details modal UX**  
  - Bingo board view should be fully visible and properly sized within the modal.

### 3. In-Scope Work (User Feedback Mapping)

Each item references `USER_FEEDBACK.md` and, where applicable, existing PRD sections.

- **S1 – Fix Table of Contents performance (Critical – 2-3 second delay)**  
  - Map from feedback: **Item 1 – "Table of Contents takes forever to load. Like there's a 2-3 second delay from clicking it to when it opens."**  
  - Investigate and eliminate the performance bottleneck causing the delay.
  - Optimize ToC extraction/rendering to appear instantly (<100ms) upon click.
  - Ensure ToC modal/overlay opens immediately with loading state if needed, rather than blocking on content extraction.
  - Acceptance: ToC opens instantly (<100ms) when clicked; no perceptible delay.

- **S2 – Fix Table of Contents display and functionality (Critical – Broken feature)**  
  - Map from feedback: **Item 2 – "Table of Contents doesn't work. The table is always just 'v', 't', and 'e'. Clicking them does nothing."**  
  - Fix ToC extraction logic to correctly parse and display Wikipedia article sections.
  - Ensure ToC items are properly formatted with readable section titles.
  - Implement smooth scrolling to sections when ToC items are clicked, in line with **FR10A – Table of contents** in `PRODUCT_PRD.md`.
  - Verify ToC works correctly in both light and dark themes.
  - Acceptance: ToC displays correct section titles (not just "v", "t", "e"), and clicking items smoothly scrolls to the corresponding sections.

- **S3 – Prevent image clicks from triggering navigation**  
  - Map from feedback: **Item 3 – "I clicked one of the pictures in an article and it tried to load the SVG. This shouldn't happen."**  
  - Ensure images (including SVGs) within article content are non-clickable or handle clicks gracefully without triggering article navigation.
  - Images should either be disabled links or have click handlers that prevent navigation.
  - Acceptance: Clicking images in articles does not trigger article navigation or SVG loading attempts.

- **S4 – Improve timer pause indicator placement and clarity**  
  - Map from feedback: **Item 4 – "The (paused) text next to the timer is distracting. Instead we should put text under 'Loading article...' that says something about the timer being paused."**  
  - Remove "(paused)" text from timer display area.
  - Add contextual message under "Loading article..." text indicating timer is paused.
  - Ensure message is clear but unobtrusive, aligning with **Section 4.5 – Score Panel & Timer** and **Section 4.4 – Article Viewer UX** in `PRODUCT_PRD.md`.
  - Acceptance: Timer pause indicator appears contextually under loading message, not next to timer; timer area remains clean.

- **S5 – Fix leaderboard game details modal Bingo board view sizing**  
  - Map from feedback: **Item 5 – "In the leaderboard when viewing a previous game, the Bingo board view is too short. Only the top 2 rows are visible on the screen. This modal should be increased in height, the board itself should shrink a bit, the width of the modal should slim down a bit, and the article history tab should not be smaller than the bingo board tab (right now they're the same but I'm worried that won't be the case if we increase the height of the modal)."**  
  - Increase modal height to ensure full Bingo board (all 5 rows) is visible.
  - Reduce Bingo board cell size slightly to fit better within increased modal height.
  - Reduce modal width for better proportions.
  - Ensure Article History tab maintains equal or larger size compared to Bingo Board tab.
  - Verify layout works well on common desktop resolutions.
  - Acceptance: Full 5×5 Bingo board is visible in modal; modal dimensions are balanced; both tabs maintain appropriate sizing.

### 4. Out of Scope for This Sprint

- New features beyond fixing existing functionality.
- Major visual redesigns beyond targeted modal and ToC improvements.
- Backend schema changes.
- Performance optimizations unrelated to ToC loading.

### 5. Success Criteria (Sprint-Level)

- **SC1**: Table of Contents opens instantly (<100ms) and displays correct section titles.
- **SC2**: ToC links reliably scroll to article sections when clicked.
- **SC3**: Images in articles do not trigger navigation when clicked.
- **SC4**: Timer pause indicator is contextually placed and non-distracting.
- **SC5**: Leaderboard game details modal displays full Bingo board with improved proportions.

### 6. Links

- Source feedback: `USER_FEEDBACK.md`  
- Product spec reference: `PRODUCT_PRD.md` (see especially **FR10A – Table of contents**, **Section 4.4 – Article Viewer UX**, **Section 4.5 – Score Panel & Timer**, and **Section 4.9 – Leaderboard UX**).

