## Bingopedia PRD – Wikipedia Bingo Game (Rebuild)

### 1. Background & Purpose

Bingopedia is a web-based game that combines Wikipedia exploration with bingo mechanics. This PRD defines the requirements for **rebuilding** Bingopedia using the existing app and scripts as behavioral reference, not as source code.

- **Business context**: Current implementation is being retired due to tech debt and code quality issues.
- **Scale & intent**: The product is expected to remain a **small side project**, not a heavily marketed or rapidly scaling product.
- **Goal of rebuild**: Preserve the loved gameplay and curated content while improving **maintainability**, **feature polish**, and **room for experimentation**, and keeping all critical data (article lists, groups, leaderboard).

---

### 2. Goals, Non‑Goals, and Success Criteria

#### 2.1 Product Goals

- **Make Wikipedia exploration fun and sticky** via a light, replayable game.
- **Deliver a smooth, performant experience** on mobile and desktop (fast article loading, responsive UI).
- **Preserve curated content value**: keep the existing curated article ecosystem and category/group constraints.
- **Enable friendly competition** via a global leaderboard.
- **Improve long‑term maintainability**: clean architecture, clear data flow, testability, and CSS that is straightforward to work with (avoid fragile nesting and ad‑hoc overrides).

#### 2.2 Non‑Goals (for this rebuild)

- User accounts, authentication, or profiles.
- Game history per user beyond leaderboard entries.
- Alternate game modes exposed in UI (different grid sizes, difficulties, multiplayer).  
  - **Note:** Internally, the implementation should make it straightforward to support alternate grid sizes (e.g., 3×3, 7×7) later, even if they are not selectable in the UI for this phase.
- Advanced analytics beyond basic event tracking.
- Admin UI for data maintenance (data is maintained via scripts/CLI).

#### 2.3 Success Criteria (Product & Technical)

- **Product KPIs**
  - Game completion rate: meaningful share of started games are completed.
  - Leaderboard participation: noticeable fraction of wins submit scores (primary success metric).
  - (Later) Shared-game links usage, if/when game-sharing is implemented.
  - Mobile usage: game is comfortably playable on mobile.

- **Technical KPIs**
  - First article load < **2 seconds** on typical broadband.
  - Article-to-article navigation perceptually fast after caching (< ~500ms).
  - Leaderboard API median response < **500ms**.
  - Article load failure rate < **1%**.
  - Uptime > **99.5%**.

---

### 3. Target Users & Use Cases

#### 3.1 Personas

- **Explorer Eve (Primary)**
  - Enjoys falling down Wikipedia rabbit holes.
  - Motivated by discovery and learning; lightly competitive.
- **Casual Gamer Gabe**
  - Wants short, self-contained sessions during breaks.
  - Motivated by clear goals and visible progress (bingo lines, confetti).
- **Competitor Casey**
  - Plays repeatedly to optimize score and climb leaderboard.
  - Motivated by time/click minimization and rank, and may eventually compete on **shared/replayable boards** with friends.

#### 3.2 Core Use Cases

- Start a new game and understand the rules at a glance.
- Navigate Wikipedia articles naturally by clicking in-article links.
- See which grid squares have been found and when a bingo line is completed.
- View visited articles history and jump back to previous articles.
- Upon winning, see performance stats and optionally submit score to leaderboard.
- Browse top scores, sort and paginate leaderboard entries.
 - (Future) Play or replay specific boards shared via links or daily challenges.

---

### 4. Experience & UX Overview

> **Design Reference**: For detailed user flows, visual system, interaction specifications, accessibility guidelines, and microcopy, see [`UI_DESIGN.md`](./UI_DESIGN.md).

#### 4.1 Entry / Start Screen

- **Content**
  - Title: **“Wikipedia Bingo”**.
  - Short, friendly description of how the game works, emphasizing:
    - 5×5 grid of article titles.
    - You start from a given article and navigate only via Wikipedia links.
    - Win with 5 in a row (row/column/diagonal).
  - **Primary CTA**: “Start Game”.
  - **Leaderboard** section visible below the fold or alongside the CTA (depending on viewport width).

- **Behavior**
  - Clicking **Start Game**:
    - Triggers generation of a new game (article set + starting article).
    - Transitions to game layout.
    - Starts timer **after** initial article is fully loaded.

#### 4.2 Game Layout

**Desktop:**

- **Left Column**:
  - **Score panel**: clicks + timer.
  - **Bingo grid** (5×5) with clear states.
  - **Article history panel** under or alongside the grid.

- **Right Column**:
  - **Article viewer** showing live Wikipedia content.

**Mobile:**

- **Fixed top score bar** (clicks + time).
- **Toggle control** to switch between:
  - **Bingo board + history view**.
  - **Article viewer view**.
- Grid displayed as a full-height panel / overlay when active, with a clear close/“back to article” affordance.
- Layout and interactions should be **mobile-first** and feel great across phones, tablets, and varied viewport sizes.

#### 4.3 Bingo Grid UX

- Each cell shows **human‑readable article title** (underscores converted to spaces).
- **States**:
  - Default: neutral card.
  - Matched: visually distinct (e.g., green fill or border).
  - Winning line: higher-contrast highlight (e.g., gold overlay or thicker border).
- Cell click:
  - Opens a **read‑only article summary modal** (non-navigational; no cheating).
- No direct navigation from grid into Wikipedia; navigation only via article links in viewer or via history.

#### 4.4 Article Viewer UX

- Shows the Wikipedia article corresponding to the current title.
- Removes non-essential Wikipedia chrome (nav, sidebars, references, edit buttons, etc.).
- All internal links remain clickable and drive game navigation.
- External links either disabled or converted to non-interactive spans.
- Visual indicators:
  - Loading state while fetching article content.
  - If an article fails to load, show fallback messaging then auto-substitute a replacement behind the scenes.

#### 4.5 Score Panel & Timer

- Always visible (mobile and desktop).
- Shows:
  - **Clicks**: integer count of article navigations (including history clicks).
  - **Time**: HH:MM:SS.
- Timer behavior:
  - Starts **after** initial starting article loads.
  - Increments every second.
  - Pauses whenever article content is loading.
  - Stops permanently once a win is registered.

#### 4.6 Article History Panel

- Scrollable list of visited article titles in chronological order.
- Current article highlighted.
- Entries that are also grid articles have a subtle indicator (e.g., icon or color).
- Clicking a history item:
  - Navigates back to that article and **always counts as a click** (any article change increments the counter).
  - Updates selected article and viewer.
  - Does **not** reset grid, matches, or timer.

#### 4.7 Win Experience

- When a winning line is detected:
  - Timer stops.
  - Board remains visible with winning line highlighted.
  - **Win modal** appears with:
    - Congratulatory message.
    - Summary stats: clicks, time, computed score.
    - Input for **username** (text, max ~50 chars, simple allowed chars).
    - Actions:
      - “Submit Score” – posts to leaderboard.
      - “Skip” / “Close” – dismisses modal without submission.
  - After successful submission:
    - Short confirmation message.
    - Option to return “Home” (start screen) or “Play Again”.

#### 4.8 Confetti & Delight

- Confetti animation:
  - Triggers **once per newly matched article** (not on repeated re-visits of a matched cell).
  - Full-screen overlay but non-interactive (no impact on clicks).
  - Plays briefly and then self-cleans (no performance leaks).
- Should not significantly impact performance, especially on mobile.

#### 4.9 Leaderboard UX

- Location(s):
  - Prominently embedded in start screen (primary attraction alongside the Start Game CTA).
  - Optional: accessible from game screen (secondary) if space allows.
- Content:
  - Table with columns: Rank, Username, Clicks, Time, Date.
  - Sorting:
    - Clicks and Time: default ascending (lower is better).
    - Potential support for sorting by score or createdAt as needed; UX prioritizes **simplicity** (likely keep sort affordance limited to clicks/time).
  - Pagination:
    - Default page size: 10.
    - “Previous” / “Next” controls.
- Row click (username):
  - Opens a **read‑only game details modal** showing:
    - User’s bingo squares with [Found] marks, where each bingo square can be clicked to open the same article summary modal used during gameplay.
    - Summary stats.
    - Full article history for that run (even if long), potentially scrollable.

---

### 5. Functional Requirements

#### 5.1 Game Setup & Data

- **FR1 – Load curated articles**
  - System loads `curatedArticles` from a JSON source generated via the existing scripts.
  - Must include metadata: categories, article titles, and group memberships (e.g., “occupations”).
- **FR2 – Category group constraints**
  - Use `categoryGroups` configuration (e.g., from `categoryGroups.json`) to restrict category selection:
    - Example: “occupations” group with `maxPerGame = 1`.
  - Enforce all configured group `maxPerGame` values when selecting categories.

- **FR3 – Bingo set generation**
  - For each new game:
    - Randomly select **26 distinct categories** respecting group constraints.
    - For each selected category, randomly pick **1 article**.
    - Shuffle and assign:
      - First 25 → grid cells.
      - 26th → starting article.
    - All 26 article titles must be unique within the game.

#### 5.2 Article Navigation & Matching

- **FR4 – Navigation model**
  - All primary navigation happens by:
    - Clicking internal links inside the article viewer content.
    - Clicking items in article history (go-back).
  - Each navigation increments the **click** counter.

- **FR5 – Title normalization**
  - Normalize titles before comparison:
    - Trim whitespace.
    - Replace one or more spaces with `_`.
    - Collapse multiple underscores to a single `_`.
    - Strip leading/trailing underscores.
    - Comparison is case-insensitive.

- **FR6 – Redirect resolution**
  - On match checks, resolve Wikipedia redirects using the Wikipedia Query API with `redirects=1`.
  - Maintain an in-memory **redirect cache**, keyed by normalized title.
  - Resolve redirects for:
    - Clicked article.
    - Grid articles (pre-resolve in background for performance).
  - Matching must work both:
    - **Clicked → grid** (canonical clicked matches stored grid title or its canonical form).
    - **Grid → clicked** (grid article that redirects to the clicked canonical title).

- **FR7 – Match detection**
  - After each navigation:
    - Compute canonical forms of clicked and grid titles.
    - If a grid article matches:
      - Add the grid article’s title to `matchedArticles` set.
      - Only trigger confetti when the match is **new**.
    - If no grid article matches, do nothing beyond logging (for debugging).

#### 5.3 Winning Logic & Scoring

- **FR8 – Win detection**
  - Grid is always 5×5.
  - Winning lines:
    - 5 rows.
    - 5 columns.
    - 2 diagonals.
  - Consider an index winning if its article title is in the matched set (by normalized comparison).
  - If any line is fully matched (5 cells):
    - Mark these cells as winning.
    - Set `gameWon = true`.
    - Stop timer.
    - Open win modal.

- **FR9 – Score formula**
  - Score is a **derived metric**: `score = timeInSeconds × clicks`.
  - Lower is strictly better.
  - Time used must be the final timer value at win.
  - **Tie-breaking on leaderboard** when scores are identical:
    - Earlier `createdAt` (earlier completion date/time) ranks **higher**.

#### 5.4 Error Handling & Fallback Behaviors

- **FR10 – Article load failures**
  - If an article fails to load (404, error, or parse fail):
    - If it is a **grid article**:
      - Replace that cell’s article with a **new random article** not already in use.
    - If it is the **current article** in viewer:
      - Replace with a new random article drawn from curated data (avoid duplicates against grid as feasible).
  - In all cases:
    - Log error (for debugging).
    - Show user-friendly message or subtle indicator, but don’t block gameplay.

- **FR11 – Network or API failures**
  - Wikipedia:
    - First attempt: mobile HTML endpoint.
    - If mobile fails, fallback to desktop HTML endpoint.
    - If all fail, treat as article load failure (see FR10).
  - Leaderboard:
    - If GET fails: show an error state in leaderboard component with an understandable message, allow reload.
    - If POST fails: show inline error and allow re-try or skip.

#### 5.5 Leaderboard Behavior

- **FR12 – GET leaderboard**
  - Supports:
    - `limit`, `page`, `sortBy`, `sortOrder` parameters (at minimum; clicks/time required).
  - Returns:
    - Array of entries with `username`, `score`, `time`, `clicks`, `bingoSquares`, `history`, `createdAt`.
    - Pagination metadata: page, limit, totalCount, totalPages.

- **FR13 – POST leaderboard**
  - Request body fields:
    - username (required).
    - score (required).
    - time (seconds).
    - clicks.
    - bingoSquares (array of titles, marking found squares if desired).
    - history (array of visited article titles).
  - Validation:
    - Reject if required fields missing or invalid (e.g., username empty, score not numeric).
    - Enforce username length and basic character set.
  - Response: created record with server timestamp and ID.

- **FR14 – Username handling & content filters**
  - Enforce a reasonable maximum length (e.g., 50 characters).
  - Apply a **light bad-word filter** to usernames:
    - Do not reject submissions outright; instead mask or obfuscate detected profanities (e.g., replace characters with random symbols).
    - Be careful not to over-filter or break links/URLs should they appear, though usernames are not expected to contain links.

---

### 6. Data & Integration Requirements

#### 6.1 Curated Articles & Groups

- **Source of truth**: `masterArticleList.txt` (plus backup).
- **Derived JSON**: `curatedArticles.json` generated via `generateCuratedData` script.
- **Groups**: `categoryGroups` configuration (e.g., “occupations”) with `maxPerGame` constraints.

#### 6.2 External APIs

- **Wikipedia REST Mobile HTML API**
  - Primary content source.
- **Wikipedia REST Desktop HTML API**
  - Fallback for content.
- **Wikipedia Query API**
  - Redirect resolution with `redirects=1` and `origin=*`.

#### 6.3 Leaderboard Data

- **Storage**: MongoDB `bingopedia.leaderboard`.
- **Fields**:
  - `username`, `score`, `time`, `clicks`, `bingoSquares[]`, `history[]`, `createdAt`.
- **Indices**:
  - Index on `score` (descending) at minimum.

---

### 7. Non‑Functional Requirements

#### 7.1 Performance

- Initial load:
  - Time from “Start Game” click to visible starting article: **< 2 seconds** on typical connections.
- Navigation:
  - Subsequent article loads should leverage client-side cache where possible.
  - Redirect resolution calls cached to avoid repeated network hits.
- Page weight:
  - Curated articles JSON can be several MB; loading must not block rendering unnecessarily (e.g., streaming, lazy usage if needed).
  - The article data/scripts pipeline already produced the current curated article pool; script reruns are **rare** and not a focus for this phase.

#### 7.2 Reliability & Resilience

- Game should gracefully handle:
  - Wikipedia outages or slow responses (fallback, retries).
  - Individual article issues (auto-replacements).
  - MongoDB outages (leaderboard may be temporarily read-only or unavailable without crashing game).

#### 7.3 Security & Privacy

- No PII beyond username; usernames stored as plain text.
- MongoDB credentials must be in environment variables; no secrets in code or repo.
- CORS configured to allow front-end origin(s) but not arbitrary open patterns in production if avoidable.
- Sanitize all user input used in leaderboard or logs.
 - Assume modest traffic (tens to hundreds of users/day) with no aggressive rate-limiting needed initially, but be mindful of not exposing trivial score-injection vectors on the client.

#### 7.4 Accessibility

- Keyboard navigable:
  - Start button, leaderboard controls, grid cells, history items, modals.
- Screen-reader friendly labels:
  - Buttons and icons (grid toggle, close icons).
- Color choices must preserve contrast; matched vs. winning states distinguishable with more than color if feasible.
 - Aim for **“reasonably functional”** accessibility that makes the game enjoyable for keyboard and screen-reader users, without attempting full WCAG certification in this phase.

#### 7.5 Analytics (Minimum)

- Track events (via chosen analytics solution) such as:
  - Game started.
  - Game won (with basic anonymized stats: clicks, time).
  - Score submitted (primary metric of interest).
  - (When implemented) Shared-game links created and followed.
- No cross-session user identification required beyond standard analytics practices.

---

### 8. Constraints & Dependencies

- **Must re-use** existing **data and scripts**:
  - `masterArticleList.txt`, backup.
  - `categoryGroups.json`.
  - `Confetti.lottie`, `globe.png`.
  - All scripts in `scripts/` for article data lifecycle.
- **Wikipedia APIs** must remain the sole content source.
- **MongoDB Atlas** remains the backing store for leaderboard, with existing collection reused.

---

### 9. Rollout & Phasing (High-Level)

- **Phase 1 – Core Rebuild**
  - Game loop (start → navigate → match → win).
  - Article viewer and matching logic.
  - Win detection and basic UI.
- **Phase 2 – Leaderboard & Polish**
  - Leaderboard integration (GET/POST).
  - Confetti, history panel, refined mobile UX.
  - Accessibility & performance tuning.
- **Phase 3 – Hardening**
  - Edge-case coverage: redirects, missing pages, occupation constraints.
  - E2E tests of full flow.
  - Load and error testing of leaderboard.

---

### 10. Open Questions / Decisions

- **Tech stack details**:
  - Remain on React + Vite + JS, or adopt TypeScript and a richer state management library?
- **Analytics vendor**:
  - Which tool to use and which specific events/props to log?
- **Leaderboard abuse controls**:
  - Do we need rate limiting or basic anti-abuse heuristics for score submissions?
- **Game restart UX**:
  - From win state, should we allow “Play Again” without returning to start screen?

Once these decisions are made, they should be appended as PRD addenda or clarified in the implementation plan.


