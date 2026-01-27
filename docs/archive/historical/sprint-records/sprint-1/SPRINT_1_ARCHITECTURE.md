## Sprint 1 – Architecture & Implementation Guide

**Last Updated**: Sprint 1  
**Source Sprint Doc**: `SPRINT_1.md`  
**Related Architecture Docs**: `docs/archive/architecture/ARCHITECTURE_OVERVIEW.md`, `ENVIRONMENT_AND_CONFIG.md`

---

## 1. Scope & Architectural Themes

- **Primary focus**: Make the existing React/Vite/TS frontend (in `app/`) reliably playable and reduce disruptive UX issues **without changing the overall system architecture**.
- **Key technical themes**:
  - Centralize **Wikipedia URL/title handling** in `shared/wiki` so S1 and S3 fixes are consistent.
  - Tighten **render boundaries and state lifecycles** in `features/game` and `features/article-viewer` to eliminate timer-driven UI thrash (S5, S6).
  - Standardize **layout primitives and modals** for predictable sizing (S2, S3).
  - Make **timer state and messaging** explicit in game state and UI (S7).

No backend schema or env-var changes are required for this sprint; `api/leaderboard.ts` and MongoDB usage remain as documented in `ARCHITECTURE_OVERVIEW.md`.

---

## 2. S1 – Article Loading Case/URL Issues

**Goal**: Ensure article URLs are generated using a normalized but case-correct title so Wikipedia resolves to the intended article (e.g., `Sony_Music` not `Sony_music`).

- **Ownership & Flow**
  - Source of truth for article identity: **normalized title string** from `shared/wiki/normalizeTitle.ts`.
  - URL construction and fetch logic: `shared/wiki/wikipediaClient.ts` (and any helpers it uses).
  - Game integration points:
    - `features/game/useGameState.ts` for recording current article and history.
    - `features/article-viewer/ArticleViewer.tsx` for rendering and link interception.

- **Architectural Decisions**
  - Introduce/confirm a single **`buildWikipediaUrl(title: string)`** helper (in `wikipediaClient.ts`) that:
    - Accepts a **canonical article key** (normalized form).
    - Returns a desktop or REST API URL using Wikipedia’s own rules for capitalization (first letter uppercase, spaces → underscores, percent-encoding for special chars).
  - Ensure redirect resolution (`resolveRedirect.ts`) outputs the same **canonical key** used throughout the app, so:
    - History, grid cells, and current article all use the same normalization.
    - URL construction is always based on that canonical key.

- **Implementation Notes**
  - Update any direct string concatenation of Wikipedia URLs in `ArticleViewer` or elsewhere to use the centralized helper.
  - Add targeted tests in `shared/wiki` to lock in behavior for problem titles (e.g., “Sony Music”, mixed case, punctuation).

---

## 3. S2 – Stabilize Leaderboard Game-Details Modal Layout

**Goal**: Prevent disruptive width/height jumps when toggling between Bingo Board and Article History in the leaderboard game-details modal.

- **Ownership & Flow**
  - Primary component: `features/leaderboard/GameDetailsModal.tsx`.
  - Likely subcomponents: grid/board renderer, history list, article summary modal.

- **Architectural Decisions**
  - Treat `GameDetailsModal` as a **layout shell** with:
    - Fixed/max width (e.g., CSS variable or utility class).
    - A **content area** that can scroll vertically but does not change the shell’s overall size.
  - Use a **single modal component** (e.g., shared modal from `shared/components`) for consistency with other modals (win modal, article summary), configured via props rather than custom one-off styling.

- **Implementation Notes**
  - Introduce CSS for a **stable modal frame**:
    - Fixed max-width on desktop (e.g., 960px).
    - Max-height with `overflow-y: auto` for the inner content region.
  - Within the content, switch between “Board” and “History” via conditional rendering **inside the same container**, avoiding layout-affecting DOM re-parenting.

---

## 4. S3 – Table of Contents as Toggleable/Modal Experience

**Goal**: Move the Table of Contents (ToC) out of permanent side-rail layout into a toggleable overlay/modal that scrolls the article correctly when entries are clicked.

- **Ownership & Flow**
  - Article rendering & link interception: `features/article-viewer/ArticleViewer.tsx`.
  - ToC UI: `features/article-viewer/TableOfContents.tsx` + `TableOfContents.css`.

- **Architectural Decisions**
  - **Trigger location**: A clearly labeled control co-located with the article header area or ArticleViewer toolbar (e.g., “Table of Contents” button).
  - **Presentation**:
    - Desktop: centered modal or side-docked overlay with fixed width; scrollable list of headings.
    - Mobile: full-screen sheet-style overlay with dismiss control.
  - **Scroll behavior**:
    - Maintain a single source of truth for section anchors (e.g., `id` attributes added to headings during HTML sanitization or as part of DOM transform).
    - ToC click → `scrollIntoView` (or equivalent) on the underlying article container, then close ToC.

- **Implementation Notes**
  - Ensure `ArticleViewer` exposes either:
    - A list of headings (level, text, id) as props to `TableOfContents`, or
    - A callback-based API where `TableOfContents` triggers a “scroll to section” function defined in `ArticleViewer`.
  - Remove or deprecate any persistent ToC column layout in `ArticleViewer.css` that reserves horizontal space.

---

## 5. S4 – Neutral Styling for Non-Article / Non-Clickable Text

**Goal**: Ensure non-navigational text in articles is styled as plain text (no link decoration, no pointer cursor, no strikethrough).

- **Ownership & Flow**
  - HTML sanitization and transformation: `shared/wiki/wikipediaClient.ts` (or a sanitizer helper it calls).
  - Rendering: `ArticleViewer.tsx`.

- **Architectural Decisions**
  - During the **HTML transform step**, normalize link-like elements into two categories:
    - **Navigational links**: valid article links (`/wiki/...`) that the game should treat as clickable.
    - **Non-navigational elements**: external links, anchors without valid targets, or elements the game rules disallow.
  - For non-navigational elements, either:
    - Strip `href` and `role="link"` attributes and render as `<span>` with body text styles, or
    - Retain them but add a CSS class (e.g., `.nonNavigational`) with neutral styling and `cursor: default`.

- **Implementation Notes**
  - Centralize the classification logic in a single helper function (e.g., `isNavigableWikiLink(node)`).
  - Ensure `ArticleViewer`’s click handler early-exits for non-navigational elements so they never trigger state changes.

---

## 6. S5 – Fix Hover Color Flicker on Article Links

**Goal**: Stop article link hover styles from flickering every second (likely caused by timer-driven re-renders).

- **Ownership & Flow**
  - Timer lifecycle: `features/game/useGameTimer.ts`.
  - Game state: `features/game/useGameState.ts`.
  - Timer display: `features/game/useTimerDisplay.ts`.
  - Article rendering: `ArticleViewer.tsx`.

- **Architectural Decisions**
  - Treat **timer ticks as a low-priority, localized update**:
    - Game state’s canonical time (`elapsedSeconds`) can update, but only a **small subtree** that renders the timer should re-render.
  - Ensure `ArticleViewer`:
    - Does **not depend directly** on raw `elapsedSeconds`.
    - Receives props that are stable across timer ticks (use `useMemo`, `React.memo`, or context segregation as needed).

- **Implementation Notes**
  - Verify that `useTimerDisplay` already isolates visual timer updates; if not, adjust it so:
    - Timer display subscribes to `elapsedSeconds`.
    - Broader game UI (grid, article viewer) does not subscribe to every tick.
  - Confirm `ArticleViewer` and grid components do not derive any props from timer tick state that would cause rerender-induced hover loss.

---

## 7. S6 – Improve Perceived Responsiveness of Article Clicks

**Goal**: Make article clicks feel immediate by showing loading state and click feedback as soon as the user interacts.

- **Ownership & Flow**
  - Game navigation: `useGameState.ts` (e.g., `registerNavigation`/navigation handlers).
  - Article viewer: `ArticleViewer.tsx` (captures link clicks, triggers navigation).

- **Architectural Decisions**
  - Define a **single navigation pipeline**:
    - `ArticleViewer` intercepts link click → calls a game navigation function with the target article key.
    - Game navigation:
      - Immediately:
        - Records pending navigation in history.
        - Increments click count.
        - Sets `articleLoading = true`.
      - Asynchronously:
        - Calls `wikipediaClient` to load content.
        - Resolves redirects and updates match state.
        - Sets `articleLoading = false` on completion.
  - UI elements bound to `articleLoading` (e.g., loading spinner/skeleton, disabled interactions) should live in components that are **already re-rendering on navigation**, not tied to the timer mechanism.

- **Implementation Notes**
  - Ensure the click handler in `ArticleViewer`:
    - Calls `preventDefault()` immediately.
    - Notifies game state synchronously before awaiting any network calls.
  - Add a clearly visible loading indicator in/near `ArticleViewer` and ensure it binds directly to `articleLoading`.

---

## 8. S7 – Explicit Timer Pause Messaging During Loads

**Goal**: Clearly communicate that the timer is paused while articles are loading.

- **Ownership & Flow**
  - Timer state: `useGameTimer.ts` (`isRunning`, `elapsedSeconds`).
  - Game state: `useGameState.ts` (`articleLoading`, win state).
  - Timer UI: score/timer panel component (in `features/game`, referenced in `GameScreen.tsx`).

- **Architectural Decisions**
  - Define a **derived UI flag** for the timer panel, e.g., `isTimerPausedForLoading = !isTimerRunning && articleLoading`.
  - Timer panel component should:
    - Render standard timer display when `isTimerRunning` is true.
    - When `isTimerPausedForLoading` is true, render:
      - Timer value (static).
      - A concise text label (e.g., “Timer paused while loading article”).

- **Implementation Notes**
  - Ensure `useGameTimer` pauses on `articleLoading = true` as already described in `ARCHITECTURE_OVERVIEW.md`, and that this flag is reliably propagated to the score panel.
  - Avoid coupling the pause message to any transient fetch implementation details; it should rely solely on durable state (`articleLoading`, `isTimerRunning`).

---

## 9. Non-Goals & Guardrails for Sprint 1

- No changes to:
  - MongoDB schema or indexes.
  - Leaderboard API contract beyond what is needed for existing clients.
  - Core game rules (match detection, win conditions) as defined in `ARCHITECTURE_OVERVIEW.md`.
- Any refactors performed to support this sprint should:
  - Preserve public component and hook interfaces where feasible.
  - Be localized to `features/game`, `features/article-viewer`, `features/leaderboard`, and `shared/wiki` unless absolutely necessary.


