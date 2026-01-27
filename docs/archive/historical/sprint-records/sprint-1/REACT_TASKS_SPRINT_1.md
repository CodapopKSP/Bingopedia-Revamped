## REACT TASKS – Sprint 1

**Source**: `SPRINT_1_ARCHITECTURE.md`  
**Role**: Senior React Engineer  
**Last Updated**: Sprint 1

---

## 1. Shared Wiki & Article Viewer Integration (S1, S4)

- **RE-S1-1 – Implement `buildWikipediaUrl` and plumbing**
  - Implement or refine `buildWikipediaUrl(title: string)` in `shared/wiki/wikipediaClient.ts` to:
    - Accept a canonical article key from `shared/wiki/normalizeTitle.ts`.
    - Apply Wikipedia capitalization and encoding rules (first-letter uppercasing, spaces → underscores, percent-encoding).
  - Update all React components that construct article URLs to use this helper, including:
    - `features/article-viewer/ArticleViewer.tsx`
    - Any game or leaderboard components that render wiki links.

- **RE-S1-2 – Ensure canonical article identity across React state**
  - Audit `useGameState.ts` to ensure:
    - Current article, history, and grid cells all share the same canonical article key.
  - Ensure `ArticleViewer` receives props keyed by this canonical identity and not by raw display titles.

- **RE-S4-1 – Implement link classification & neutral rendering**
  - Introduce a helper in `shared/wiki` (e.g., `classifyWikiLink(node)`) that determines whether a link is navigable.
  - Update the React side of HTML transformation/rendering so that:
    - Navigational links render as interactive `<a>` elements and hook into game navigation.
    - Non-navigational links render as neutral text or with a `.nonNavigational` class.
  - Ensure `ArticleViewer`’s click handler checks this classification and early-returns for non-navigational elements.

---

## 2. Game Timer & State Isolation (S5, S7)

- **RE-S5-1 – Refactor timer usage into localized React subtrees**
  - In `features/game/useGameTimer.ts` and `useTimerDisplay.ts`, ensure:
    - Timer values are consumed only by dedicated timer UI components.
    - The article viewer and grid components do not depend on `elapsedSeconds`.
  - Use `React.memo`, `useMemo`, `useCallback`, or context separation where needed to avoid rerendering large trees every tick.

- **RE-S5-2 – Validate hover stability with React DevTools**
  - Use React DevTools to inspect:
    - Which components rerender on each timer tick.
    - That `ArticleViewer` and article link components do not rerender every second.
  - Adjust memoization or prop shapes until hover flicker is eliminated.

- **RE-S7-1 – Implement explicit timer paused messaging**
  - In the timer/score panel React component:
    - Derive `isTimerPausedForLoading = !isTimerRunning && articleLoading`.
    - Conditionally render the pause message and static timer value when this flag is true.
  - Ensure state for `articleLoading` and `isTimerRunning` flows from hooks (`useGameTimer`, `useGameState`) via clear, typed props.

---

## 3. Navigation Pipeline & Loading Feedback (S6)

- **RE-S6-1 – Implement a single navigation handler in `useGameState`**
  - Create a function (e.g., `navigateToArticleKey(targetKey: string)`) in `useGameState.ts` that:
    - Updates history and click counts synchronously.
    - Sets `articleLoading = true` before making network calls.
    - On success, updates current article and bingo match state, then sets `articleLoading = false`.
    - On error, handles failure gracefully and clears `articleLoading`.

- **RE-S6-2 – Wire `ArticleViewer` click handling to the navigation handler**
  - Update `ArticleViewer.tsx` to:
    - Call `preventDefault()` on anchor clicks that match in-game navigation rules.
    - Invoke the new navigation handler with the canonical article key.
    - Avoid direct calls to `wikipediaClient` from the component; keep data loading in the hooks/state layer.

- **RE-S6-3 – Implement loading indicators in React**
  - Add a loading UI to `ArticleViewer` and/or surrounding layout that:
    - Binds directly to `articleLoading`.
    - Does not cause full tree unmount/mount cycles of the article content when toggling.
  - Confirm through React DevTools that loading state only rerenders the minimal necessary components.

---

## 4. Leaderboard Modal React Structure (S2)

- **RE-S2-1 – Refactor `GameDetailsModal` into a stable React shell**
  - Ensure `features/leaderboard/GameDetailsModal.tsx`:
    - Uses a shared `Modal` or equivalent component from `shared/components`.
    - Has a consistent JSX structure, with a single inner container that changes between “Board” and “History”.
  - Avoid conditional rendering that mounts/unmounts the outer modal container itself when switching tabs.

- **RE-S2-2 – Ensure accessibility and focus management**
  - Add or verify:
    - Focus trapping inside the modal.
    - `aria-modal`, labeled headers, and proper role attributes.
    - ESC key and overlay click behavior conform to app standards.

---

## 5. Table of Contents Component Wiring (S3)

- **RE-S3-1 – Expose headings data or scroll API from `ArticleViewer`**
  - Choose a pattern:
    - Prop-driven: `ArticleViewer` passes a list of `{ id, level, text }` to `TableOfContents`.
    - Callback-driven: `TableOfContents` receives a `scrollToSection(id)` function.
  - Implement the chosen pattern so that ToC is fully decoupled from the article’s internal DOM representation.

- **RE-S3-2 – Implement ToC overlay/modal behavior**
  - Implement ToC presentation as a React component that:
    - Uses the shared modal/overlay primitive.
    - Supports both desktop and mobile behaviors as defined by UI/UX.
  - Ensure the open/close state is owned by a predictable parent (e.g., `ArticleViewer` or a higher-level screen) and passed via props.

---

## 6. Testing & Code Quality

- **RE-TEST-1 – Add React unit/component tests**
  - Add tests for:
    - Navigation handler behavior (`navigateToArticleKey`) including loading flags.
    - Timer components updating without rerendering `ArticleViewer`.
    - `GameDetailsModal` tab switching without remounting the modal shell.
    - ToC overlay open/close and scroll behavior.

- **RE-QUALITY-1 – Refine types and props**
  - Tighten TypeScript types in:
    - Game state hooks (`useGameState`, `useGameTimer`, `useTimerDisplay`).
    - `ArticleViewer`, `GameDetailsModal`, and ToC components.
  - Remove unused props and ensure consistent naming for keys/ids related to articles.

- **RE-DOC-1 – Document React patterns learned**
  - Add or update an entry in `docs/archive/skills` describing:
    - How timer-driven state was isolated to avoid UI flicker.
    - Patterns for centralizing navigation and loading state in React hooks.
  - Mark the skill doc with “Last Updated: Sprint 1”.


