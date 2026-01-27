## Sprint 1 – Gameplay Reliability & Core UX Polish

### 1. Overview

This sprint focuses on **making the core game reliably playable** and smoothing out the most disruptive UX issues reported by users. Scope is intentionally narrow: fix the game-breaking article loading bug, address the most jarring UI behaviors, and improve clarity around loading and navigation.

### 2. Goals

- **G1 – Make the game reliably playable**  
  - Article navigation must consistently load the correct Wikipedia page (case handling, redirects, and URL construction).
- **G2 – Reduce UX friction in core flows**  
  - Leaderboard/game details modal should feel stable and not jump in size when switching tabs.  
  - Table of Contents should be useful without permanently consuming too much space.  
  - Hover and click feedback should feel smooth and responsive.
- **G3 – Communicate game state clearly**  
  - Players should always understand when the timer is paused during article loads.

### 3. In-Scope Work (User Feedback Mapping)

Each item references `USER_FEEDBACK.md` and, where applicable, existing PRD sections.

- **S1 – Fix article loading case/URL issues (Critical – Gameplay blocker)**  
  - Map from feedback: **Item 1 – “articles seem to load with all lower case … game is unplayable.”**  
  - Ensure article URLs are generated using a **normalized but case-correct title** so that Wikipedia resolves to the intended article (e.g., `Sony_Music` not `Sony_music`).  
  - Verify behavior for redirects and canonicalization is aligned with **FR5 – Title normalization** and **FR6 – Redirect resolution** in `PRODUCT_PRD.md`.  
  - Acceptance: Known problematic examples (e.g., “Sony Music”) load correctly and article load failure rate remains within PRD targets.

- **S2 – Stabilize leaderboard game-details modal layout**  
  - Map from feedback: **Item 2 – Modal too wide, height jumps when toggling Bingo Board / Article History.**  
  - Define a consistent modal max-width and height behavior so that switching tabs does not cause disruptive layout jumps.  
  - Ensure this aligns with the leaderboard UX described in **Section 4.9 – Leaderboard UX** while keeping visuals responsive on desktop.  
  - Acceptance: Switching between tabs within the modal does not cause noticeable window size jumps on typical desktop resolutions.

- **S3 – Rework Table of Contents into a toggleable/modal experience**  
  - Map from feedback: **Items 3 & 7 – ToC takes too much space and “doesn’t work” when clicked.**  
  - On desktop and mobile, ToC should be **accessed via a clearly labeled control** (e.g., “Table of Contents” button or icon) that opens a modal or overlay containing the ToC.  
  - Clicking ToC entries should smoothly scroll the article to the correct section, in line with **FR10A – Table of contents**.  
  - Modal should close on explicit close and on background/blur click where appropriate.  
  - Acceptance: ToC no longer permanently occupies excessive horizontal space, and ToC links reliably scroll to sections.

- **S4 – Neutral styling for non-article / non-clickable text in articles**  
  - Map from feedback: **Item 4 – Non-articles shouldn’t be crossed out or styled as links; pointer shouldn’t change.**  
  - Define and document which elements are treated as “non-navigational” (e.g., disabled links, certain templates) and ensure they render as **plain text** with default cursor.  
  - Acceptance: Non-navigable items do not show link color, underline, or pointer cursor, and no “crossed out” visual treatment is used.

- **S5 – Fix hover color flicker on article links**  
  - Map from feedback: **Item 5 – Hover color flashes to default every second.**  
  - Identify and eliminate timer or state updates that cause unnecessary re-renders leading to hover style resets, consistent with non-functional requirements in **Section 7.4 – Accessibility (timer/state management)**.  
  - Acceptance: Hover styles on article links remain stable while the timer runs; no rhythmic flickering every second.

- **S6 – Improve perceived responsiveness of article clicks**  
  - Map from feedback: **Item 6 – Clicking an article has a delay; loading state feels late.**  
  - Ensure that on link click, the UI **immediately**:  
    - Shows loading state in the article viewer, and  
    - Provides clear visual feedback that the click was registered, in line with **FR10B – Immediate click feedback**.  
  - Acceptance: Subjective “click feels delayed” feedback is addressed; internal QA confirms loading state appears immediately on link click.

- **S7 – Make timer pause explicit during article loading**  
  - Map from feedback: **Item 8 – “There should be some text to indicate that the timer has paused.”**  
  - When article content is loading (and timer is paused per **Section 4.5 – Score Panel & Timer**), show a concise message near the timer (e.g., “Timer paused while loading article”).  
  - Acceptance: During loading, users see a clear indicator that the timer is paused; after load, the message disappears.

### 4. Out of Scope for This Sprint

- New game modes, grid sizes, or replay features beyond what’s already defined in the PRD.  
- Major visual redesign of the site or theme system beyond targeted changes to ToC, modal layout, and link/hover behaviors.  
- Backend schema changes not strictly required to support the above fixes.

### 5. Success Criteria (Sprint-Level)

- **SC1**: Core gameplay is no longer blocked by mis-constructed article URLs; representative problematic titles load successfully in manual tests.  
- **SC2**: Desktop UX for leaderboard/game details feels stable (no major layout jumps when toggling tabs).  
- **SC3**: ToC is both functional (clicks scroll correctly) and unobtrusive (does not permanently consume too much space).  
- **SC4**: Users can clearly see when the timer is paused during loading, and link hover/click feedback feels smooth and reliable.

### 6. Links

- Source feedback: `USER_FEEDBACK.md`  
- Product spec reference: `PRODUCT_PRD.md` (see especially **FR5**, **FR6**, **FR10A**, **FR10B**, and **Section 7.4 – Accessibility**).


