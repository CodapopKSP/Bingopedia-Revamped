## Bingopedia Revamp – Product Checklist

This checklist tracks product-level readiness for the Bingopedia rebuild. Mark items as you complete them.

---

### 1. Vision, Scope, and Success

- [x] Goals confirmed: side project, not growth-at-all-costs.
- [x] Primary goals agreed: maintainability, feature polish, experimentation.
- [x] Scope locked: feature parity with existing game is non‑negotiable.
- [x] "Later" items identified (e.g., daily challenges, shareable/replayable boards).
- [x] Success metrics agreed (especially leaderboard submissions).

---

### 2. Product Spec & Documentation

- [x] `PRODUCT_PRD.md` reviewed and accepted as source of truth.
- [x] Decisions from `PRODUCT_QA.md` fully reflected in the PRD.
- [x] `ARCHITECTURE_OVERVIEW.md` aligned with the PRD.
- [x] `ENVIRONMENT_AND_CONFIG.md` describes all required env vars and deployment assumptions.
- [x] `REBUILD_EXECUTION_PLAN.md` (or equivalent) defines phases, milestones, and rough timing.

---

### 3. Core Game Experience

**Start Screen**

- [x] Clear, unobtrusive explanation of rules.
- [x] Prominent **Start Game** button.
- [x] Leaderboard prominently visible on start screen.

**Game Layout**

- [x] Desktop layout: grid + history left, article viewer right.
- [x] Mobile layout: mobile-first, board/viewer toggle; works well on phones and tablets.
- [x] Layout verified at multiple viewport sizes.

**Gameplay Loop**

- [x] New game generation (26 articles, 25 grid + 1 starting) implemented.
- [x] Timer starts **after** first article loads.
- [x] Timer pauses during article loading and resumes correctly.
- [x] Every article change (including history clicks) increments click counter.

**Grid & Summary**

- [x] 5×5 grid implemented in UI; code supports alternate sizes internally.
- [x] Clicking a grid square opens an article **summary modal** (no navigation).
- [x] Matched vs winning state visuals are clear and distinct.

**Article Viewer**

- [x] Wikipedia chrome (nav, sidebars, references, edit buttons) removed.
- [x] Only relevant links styled as links; all other links look like plain text.
- [x] Article load failures handled gracefully with auto-replacement.

**History**

- [x] History shows chronological list with current article highlighted.
- [x] Clicking a history item navigates back and counts as a click.

**Win State**

- [x] 5-in-a-row detection correct for all 12 lines (rows, columns, diagonals).
- [x] Timer stops on win and stays stopped.
- [x] Win modal shows time, clicks, and computed score.
- [x] Score formula `time (s) × clicks` implemented.
- [x] Leaderboard tie-breaking by **earlier completion date** implemented (backend).

**Confetti**

- [x] Confetti plays once per **new** matched article.
- [x] Confetti is non-blocking and cleans itself up.

---

### 4. Data & Content

- [x] `masterArticleList.txt` and backup preserved.
- [x] `categoryGroups.json` preserved and loaded.
- [ ] `curatedArticles.json` generated/validated (if regeneration needed).
- [ ] Occupation group max-per-game constraint enforced.
- [ ] Other groups/constraints match current behavior.
- [x] Data/scripts pipeline verified to run end-to-end (even if used rarely).

---

### 5. Leaderboard & Social Features

**Core Leaderboard**

- [ ] GET `/api/leaderboard` implements pagination and sort fields as per PRD.
- [ ] POST `/api/leaderboard` accepts required fields and validates them.
- [ ] Sorting by clicks and time works (lower is better).
- [ ] Pagination (10 per page) behaves correctly.

**Username & Safety**

- [ ] Maximum username length enforced.
- [ ] Basic character rules enforced (no obviously broken input).
- [ ] Light bad-word filter masks/obfuscates, does not reject.

**Game Details View**

- [x] Clicking a leaderboard username opens game details modal.
- [x] Modal shows full bingo board with [Found] markers.
- [x] Clicking a square in modal opens same article summary as in gameplay (read-only in details view).
- [x] Full article history for the run is visible (scrollable if long).

**Future Social (Not Required at Launch)**

- [ ] Data model supports shareable/replayable boards in the future.
- [ ] API/URL structure will not block future daily challenges.

---

### 6. Accessibility, UX Quality, and Visuals

- [x] Start screen, grid, history, modals, and leaderboard are keyboard navigable.
- [x] Buttons/icons (grid toggle, close, etc.) have descriptive labels.
- [x] Colors chosen with reasonable contrast; matched vs winning states use more than color when possible.
- [x] Visual style is modern, responsive, and consistent across mobile, tablet, and desktop.
- [x] Copy is neutral and clear; no localization beyond English is required.

---

### 7. Infrastructure, Config, and Deployment

- [x] MongoDB credentials stored in environment variables only.
- [x] All necessary env vars documented in `ENVIRONMENT_AND_CONFIG.md`.
- [x] Vercel configured for frontend and API routes (correct rewrites and SPA routing).
- [ ] Production build confirmed to include curated data and assets.
- [x] Manual health check process documented (API + DB + Wikipedia connectivity).

---

### 8. Analytics & Measurement

- [ ] Analytics tool chosen or explicitly deferred.
- [ ] Event tracking implemented for:
  - [ ] Game started.
  - [ ] Game won (with clicks and time).
  - [ ] Score submitted (primary metric).
  - [ ] (Later) Shared-game links created and followed.
- [ ] Simple way to inspect these metrics verified (analytics UI or equivalent).

---

### 9. QA & Launch Readiness

- [ ] All core flows tested end-to-end:
  - [ ] Start → play → win → submit score.
  - [ ] Start → play → win → skip submission.
  - [ ] Article fails to load → replacement behavior.
  - [ ] Leaderboard errors → user-facing error messages.
- [ ] Win detection verified on all 12 possible lines.
- [ ] Cross-device testing on key browsers and mobile devices.
- [ ] Performance checks (first load, article navigation) roughly meet targets.
- [x] All key docs (`PRODUCT_PRD.md`, `PRODUCT_QA.md`, `ARCHITECTURE_OVERVIEW.md`, `ENVIRONMENT_AND_CONFIG.md`, `REBUILD_EXECUTION_PLAN.md`) updated and consistent.


