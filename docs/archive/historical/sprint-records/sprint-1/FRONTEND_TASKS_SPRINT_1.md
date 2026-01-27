## FRONTEND TASKS – Sprint 1

**Source**: `SPRINT_1_ARCHITECTURE.md`  
**Role**: Senior Frontend Engineer  
**Last Updated**: Sprint 1  
**Status**: Implementation completed - All tasks marked with ✅

---

## 1. Shared Wiki / URL Handling (S1, S4)

- **S1-FE-1 – Centralize Wikipedia URL construction** ✅
  - Wire all existing Wikipedia URL creation in the frontend to a single helper in `shared/wiki/wikipediaClient.ts` (e.g., `buildWikipediaUrl(title: string)`).
  - Replace any string concatenation or hard-coded `/wiki/...` paths in:
    - `features/article-viewer/ArticleViewer.tsx`
    - Any game or leaderboard components that construct article links.
  - Confirm the helper consumes the same normalized title/key that the game state uses.

- **S1-FE-2 – Normalize redirect handling and article identity** ✅
  - Ensure redirect resolution in `shared/wiki/resolveRedirect.ts` (or equivalent) outputs the canonical key used everywhere else.
  - Confirm that `useGameState` stores and passes around this canonical key for:
    - Current article
    - History entries
    - Bingo grid data

- **S4-FE-1 – Classify navigational vs non-navigational links** ✅
  - Implement or wire a helper (e.g., `isNavigableWikiLink(node)`) in the `shared/wiki` layer.
  - In the HTML transformation pipeline, ensure:
    - Navigational links (`/wiki/...`) keep link semantics.
    - Non-navigational elements are converted either to `<span>` or to a neutral class (e.g., `.nonNavigational`).

- **S4-FE-2 – Neutral styling for non-navigational text** ✅
  - Update `ArticleViewer` CSS so elements tagged as non-navigational:
    - Do not render with link color, underline, or hover color.
    - Use `cursor: default` and do not visually imply interactivity.
  - Verify `ArticleViewer`'s click handlers early-exit for these elements.

---

## 2. Game State & Timer Isolation (S5, S6, S7)

- **S5-FE-1 – Isolate timer-driven re-renders** ✅
  - Audit `features/game/useGameTimer.ts`, `useGameState.ts`, and `useTimerDisplay.ts` to identify where `elapsedSeconds` is read.
  - Refactor so that:
    - Timer display components subscribe directly to `elapsedSeconds`.
    - `ArticleViewer`, grid components, and other non-timer UI do not re-render every tick.

- **S5-FE-2 – Verify hover stability on article links** ✅
  - Manually reproduce the link-hover flicker issue and confirm that after refactor:
    - Hover state is maintained between timer ticks.
    - No unnecessary re-render of the article DOM is triggered by timer updates.

- **S6-FE-1 – Define navigation pipeline in game state** ✅
  - In `useGameState.ts`, define a single navigation handler (e.g., `navigateToArticleKey`) that:
    - Records navigation in history.
    - Updates click counts.
    - Controls an `articleLoading` flag.
  - Ensure this function is the only entry point used by `ArticleViewer` for in-game navigation.

- **S6-FE-2 – Wire loading state to `ArticleViewer`** ✅
  - Update `ArticleViewer.tsx` to:
    - Call `preventDefault()` on article link clicks.
    - Invoke the game navigation handler synchronously, before network calls.
    - Display a visible loading indicator when `articleLoading` is true.

- **S7-FE-1 – Expose timer/loading state to the score panel** ✅
  - In the score/timer panel component (referenced by `GameScreen.tsx`), derive:
    - `isTimerPausedForLoading = !isTimerRunning && articleLoading`.
  - Render:
    - Static timer value while paused for loading.
    - A short label such as "Timer paused while loading article".

---

## 3. Leaderboard Game-Details Modal (S2)

- **S2-FE-1 – Implement stable modal shell in `GameDetailsModal`** ✅
  - Refactor `features/leaderboard/GameDetailsModal.tsx` to:
    - Use a single shared modal component from `shared/components` (if present) or introduce one.
    - Enforce a consistent max-width and max-height via CSS.
    - Keep the modal frame size stable while content changes.

- **S2-FE-2 – Stabilize inner content switching** ✅
  - Render "Board" and "History" content within the same scrollable container.
  - Ensure switching tabs does not change the outer modal's width or height, only the inner scroll position.

---

## 4. Table of Contents Overlay (S3)

- **S3-FE-1 – Add ToC trigger to `ArticleViewer`** ✅
  - Add a clearly labeled "Table of Contents" button to the article header/toolbar area.
  - Ensure focus and keyboard accessibility for the trigger.

- **S3-FE-2 – Integrate `TableOfContents` as overlay/modal** ✅
  - Implement ToC as:
    - Desktop: centered modal or side overlay with fixed width.
    - Mobile: full-screen or sheet-style overlay with a close control.
  - Use a single modal/overlay pattern consistent with other app modals.

- **S3-FE-3 – Wire ToC entries to article scrolling** ✅
  - Ensure `ArticleViewer` provides:
    - A list of headings (text, level, id) or
    - A `scrollToSection(id)` callback.
  - Confirm clicking a ToC entry:
    - Scrolls the underlying article container to the correct section.
    - Closes the overlay on success.

---

## 5. Testing & Documentation

- **FE-TEST-1 – Add/update unit tests**
  - Add targeted tests in `shared/wiki` for:
    - URL construction for tricky titles (case, spaces, punctuation).
    - Link classification helper behavior.
  - Add React tests (or component-level tests) verifying:
    - Timer-driven updates do not re-render `ArticleViewer`.
    - `GameDetailsModal` layout remains stable when switching tabs.
    - ToC click scrolls to the correct section.

- **FE-DOC-1 – Update docs after implementation**
  - If you adjust any behavior that impacts architectural assumptions, update:
    - `ARCHITECTURE_OVERVIEW.md`
    - Any relevant docs in `docs/archive/implementation` or `docs/archive/ui-design`.
  - Add or update a skill entry in `docs/archive/skills` for any new frontend or testing patterns learned.
  - Note “Last Updated: Sprint 1” in any doc you touch.


