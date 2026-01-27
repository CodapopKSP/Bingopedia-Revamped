## Bingopedia PRD – Wikipedia Bingo Game (Rebuild)

_Last updated: Sprint 1 – Gameplay Reliability & Core UX Polish_

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
- Play or replay specific boards shared via links (replay feature).
- Toggle between light and dark themes.

---

### 4. Experience & UX Overview

> **Design Reference**: For detailed user flows, visual system, interaction specifications, accessibility guidelines, and microcopy, see [`UI_DESIGN.md`](./UI_DESIGN.md).

#### 4.1 Entry / Start Screen

- **Content**
  - Title: **"Wikipedia Bingo"**.
  - Short, friendly description of how the game works, emphasizing:
    - 5×5 grid of article titles.
    - You start from a given article and navigate only via Wikipedia links.
    - Win with 5 in a row (row/column/diagonal).
  - **Primary CTA**: "Start Game".
  - **Theme toggle**: Light/dark mode switcher (accessible from all screens).
  - **New Game Generator**: Section for creating shareable game links (see FR18).
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
  - **Score bar must remain visible** when viewing Bingo board/History panel (not hidden by overlay).
  - Timer and clicks should always be accessible.
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
- Elements that are determined to be **non-navigational** in the game context (e.g., disabled links or certain template-generated elements) should render with neutral text styling (no underline/“link” color) and default cursor, with **no strikethrough or “crossed out” treatment**.
- **"View on Wikipedia" button**: 
  - Located at top right of article viewer.
  - Opens Wikipedia article in new tab/window.
  - **Confirmation modal required**: "Are you sure? Leaving may clear your game progress." with "Cancel" and "Continue" options.
- **Table of Contents**:
  - Displays Wikipedia-style table of contents extracted from article HTML.
  - Located in a sidebar or collapsible section within the article viewer on larger screens; on smaller viewports or when space is constrained, it may be accessed via a dedicated “Table of Contents” control (button or icon) that opens a modal or overlay.
  - Clickable items jump to corresponding sections with smooth scrolling.
  - Collapsible/expandable for space efficiency and closable when presented as a modal.
  - Styled to match Wikipedia's ToC appearance.
- **Immediate click feedback**:
  - Link clicks provide immediate visual feedback (<50ms) to confirm click registration.
  - Article viewer shows loading state immediately upon link click.
  - Links are disabled/visually distinct while article is loading (prevents double-clicks).
- Visual indicators:
  - Loading state while fetching article content.
  - While loading (and timer paused), display concise copy near the timer indicating that the timer is paused (e.g., “Timer paused while loading article”).
  - If an article fails to load, automatically retry up to 3 times before showing error.
  - After retries fail, show fallback messaging then auto-substitute a replacement behind the scenes.
- **Theme styling**:
  - **Light mode**: Article content area has light background (like Wikipedia), site background is darker.
  - **Dark mode**: Article content area has dark background, site background is darker still (maintains contrast).
  - Article viewer should visually stand out from site background in both themes.

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
  - Triggers **immediately when a grid cell is matched** (when user checks off a box).
  - Triggers **once per newly matched article** (not on repeated re-visits of a matched cell).
  - Full-screen overlay but non-interactive (no impact on clicks).
  - Plays briefly and then self-cleans (no performance leaks).
- Should not significantly impact performance, especially on mobile.

#### 4.9 Leaderboard UX

- Location(s):
  - Prominently embedded in start screen (primary attraction alongside the Start Game CTA).
  - Optional: accessible from game screen (secondary) if space allows.
- Content:
  - Table with columns: Rank, Username, Score, Clicks, Time, Date.
  - **Time column**: Must display in HH:MM:SS format (not just seconds).
  - **Date column**: Shows formatted date/time of game completion (e.g., "Jan 15, 2024" or relative time).
  - **Sorting controls**:
    - Sort by: Score (default), Clicks, Time, Date.
    - **Default sort**: Score ascending (smallest to largest - lower is better).
    - Sort order: Ascending/Descending toggle (lower is better for score/clicks/time).
    - Sort controls visible and accessible via dropdown or column headers.
  - **Time filter options**:
    - "Best Today" - scores from last 24 hours.
    - "Best Past 7 Days" - scores from last week.
    - "Best Past 30 Days" - scores from last month.
    - "Best Past Year" - scores from last year.
    - "All Time" - all scores (default).
    - **Filter must work correctly**: API must properly filter by date range.
  - **Game type filter**:
    - "Random Games" - truly random games (default behavior).
    - "Repeat Games" - games played from shareable links or replayed from leaderboard.
    - "All Games" - both types combined.
    - Filter toggle or dropdown to switch between views.
    - **Terminology**: Use "Random" instead of "Fresh", "Repeat" instead of "Linked".
  - **Pagination**:
    - Show more games per page (increase from current limit).
    - Default page size: 20 or configurable.
    - "Previous" / "Next" controls.
    - Page numbers or "Load More" button option.
- Row click (username):
  - Opens a **read‑only game details modal** showing:
    - User's bingo squares with [Found] marks.
    - **Clickable bingo squares**: Each bingo square can be clicked to open the same article summary modal used during gameplay, showing the article summary.
    - Summary stats (score, clicks, time, date).
    - **Replay button**: Allows user to start a new game with the same board and starting article.
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
  - **Duplicate navigation prevention**:
    - If user navigates to the same article they're currently viewing (normalized comparison), do nothing (no click increment, no history update).
    - If user navigates to an article that matches the previous article in history (normalized comparison), do nothing.
    - Only count unique article navigations toward click counter.
    - Only add unique articles to history (no consecutive duplicates).

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
      - Add the grid article's title to `matchedArticles` set.
      - **Immediately trigger confetti animation** when the match is **new** (when user checks off a box).
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

#### 5.4 Article Viewer Enhancements

- **FR10A – Table of contents**
  - Extract and display Wikipedia-style table of contents from article HTML.
  - Display ToC in sidebar or collapsible section within article viewer.
  - Make ToC items clickable to jump to corresponding sections.
  - Implement smooth scrolling to sections on ToC click.
  - Style ToC to match Wikipedia's appearance.
  - Make ToC collapsible/expandable for space efficiency.
  - Ensure ToC works in both light and dark themes.
  - Ensure ToC works on mobile and desktop layouts.

- **FR10B – Immediate click feedback**
  - Provide immediate visual feedback (<50ms) when user clicks an article link.
  - Show loading state in article viewer immediately upon link click.
  - Disable link clicks while article is loading (prevent double-clicks).
  - Use visual indicators (e.g., link highlight, loading spinner) to confirm click registration.

#### 5.5 Error Handling & Fallback Behaviors

- **FR11 – Article load failures**
  - **Automatic retry logic**:
    - If an article fails to load, automatically retry up to 3 times before showing error.
    - Retry strategy: immediate retry, then 1 second delay, then 2 second delay.
    - Show loading state during retries.
    - Only show error message after all retries fail.
  - If all retries fail (404, error, or parse fail):
    - If it is a **grid article**:
      - Replace that cell's article with a **new random article** not already in use.
    - If it is the **current article** in viewer:
      - Replace with a new random article drawn from curated data (avoid duplicates against grid as feasible).
  - In all cases:
    - Log error (for debugging).
    - Show user-friendly message or subtle indicator, but don't block gameplay.

- **FR12 – Network or API failures**
  - Wikipedia:
    - First attempt: mobile HTML endpoint.
    - If mobile fails, fallback to desktop HTML endpoint.
    - If all fail, treat as article load failure (see FR10).
  - Leaderboard:
    - If GET fails: show an error state in leaderboard component with an understandable message, allow reload.
    - If POST fails: show inline error and allow re-try or skip.

#### 5.6 Leaderboard Behavior

- **FR13 – GET leaderboard**
  - Supports:
    - `limit`, `page`, `sortBy`, `sortOrder` parameters (at minimum; clicks/time required).
  - Returns:
    - Array of entries with `username`, `score`, `time`, `clicks`, `bingoSquares`, `history`, `createdAt`.
    - Pagination metadata: page, limit, totalCount, totalPages.

- **FR14 – POST leaderboard**
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

- **FR15 – Username handling & content filters**
  - Enforce a reasonable maximum length (e.g., 50 characters).
  - Apply a **light bad-word filter** to usernames:
    - Do not reject submissions outright; instead mask or obfuscate detected profanities (e.g., replace characters with random symbols).
    - Be careful not to over-filter or break links/URLs should they appear, though usernames are not expected to contain links.

#### 5.7 Theme & Accessibility

- **FR16 – Light mode support**
  - Theme toggle accessible from all screens (start screen, game screen, leaderboard).
  - Toggle persists user preference (localStorage or similar).
  - Light mode provides:
    - **Article viewer**: Light background (like Wikipedia) with dark text.
    - **Site background**: Darker than article viewer for contrast.
    - Dark text on light backgrounds throughout.
    - Maintains all visual states (matched cells, winning lines, etc.) with appropriate light-mode colors.
  - Dark mode provides:
    - **Article viewer**: Dark background.
    - **Site background**: Darker still for contrast.
    - Light text on dark backgrounds.
  - Default to system preference if available, otherwise default to dark mode.

#### 5.8 Game Sharing & Replay

- **FR17 – Game state persistence**
  - When a game is generated (random or from link), store game state in database:
    - Grid cells (25 articles).
    - Starting article.
    - Game type: "random" or "repeat" (from shareable link or replay).
    - Hashed ID (16 characters, URL-safe) for shareable links.
    - Created timestamp.
  - Game state must be retrievable by hashed ID for replay.
  - **Optional (Phase 5)**: Client-side game persistence in localStorage:
    - Save game state to localStorage on each action.
    - Restore game state on page load if available.
    - Timer continues in real-time (calculate elapsed time from start timestamp).
    - Only clear localStorage when user clicks "New Game".

- **FR18 – Shareable game links**
  - On start screen, provide "Generate Shareable Game" functionality:
    - Button to generate a new game and create a shareable link.
    - **Storage**: Games stored in MongoDB `generated-games` collection.
    - **Game ID**: Hashed ID (16 characters, URL-safe) stored in `hashedId` field.
    - **Link format**: `{domain}/{hashedId}` (e.g., `bingopedia.com/XHZ$G$z4y4zz46`).
    - Link can be copied to clipboard.
    - Link can be shared with others.
    - UI must clearly display the link and provide copy functionality.
  - When a user visits a shareable link:
    - Extract `hashedId` from URL path.
    - Query `generated-games` collection by `hashedId`.
    - Load the specific game state (grid + starting article).
    - Start game with that exact board.
    - Game type is marked as "repeat" for leaderboard filtering.

- **FR19 – Replay feature**
  - In game details modal (from leaderboard):
    - "Replay" button visible.
    - Clicking "Replay":
      - Loads the exact game state (grid + starting article) from that leaderboard entry.
      - Starts a new game session with that board.
      - Game type is marked as "repeat" for leaderboard filtering.
      - User can play the same board and compete fairly with others who replay it.
  - When submitting score from shareable/replay game:
    - Game type must be set to "repeat" in leaderboard entry.
    - This applies to both shareable link games and replayed leaderboard games.

#### 5.9 Enhanced Leaderboard Features

- **FR20 – Leaderboard date display**
  - All leaderboard entries display formatted date/time:
    - Format: "MMM DD, YYYY" or relative time ("2 days ago").
    - Date column sortable and visible in all views.

- **FR21 – Leaderboard sorting**
  - Support sorting by:
    - **Score (default, ascending - lower is better)** - must be default sort order.
    - Clicks (ascending - lower is better).
    - Time (ascending - lower is better).
    - Date (descending - newer first, or ascending - older first).
  - Sort controls accessible via UI (dropdown or column headers).
  - Sort state persists during session.
  - **Time display**: All time values must be formatted as HH:MM:SS (not raw seconds).

- **FR22 – Leaderboard time filters**
  - Filter options:
    - Best Today (last 24 hours).
    - Best Past 7 Days.
    - Best Past 30 Days.
    - Best Past Year.
    - All Time (default).
  - Filters apply to leaderboard queries via API parameters.
  - **Filter must work correctly**: API must properly filter MongoDB queries by `createdAt` date range.
  - Filter state persists during session.
  - **Bug fix required**: Currently filters show all games regardless of selected time period.

- **FR23 – Leaderboard game type separation**
  - Leaderboard entries include `gameType` field: "random" or "repeat".
  - **Terminology**: Use "random" instead of "fresh", "repeat" instead of "linked".
  - **Database migration required**: Add `gameType` field to all existing leaderboard entries (default to "random").
  - API supports filtering by `gameType` parameter.
  - UI provides toggle or dropdown to switch between:
    - "Random Games" - only random games (default view).
    - "Repeat Games" - only games from shareable links/replays.
    - "All Games" - both types combined.
  - Default view shows "Random Games" to maintain competitive integrity.
  - Repeat games are separated to prevent speedrun advantages from replaying known boards.
  - **Bug fix required**: Currently game type filter doesn't work because games aren't distinguished in database.

- **FR24 – Game details article summaries**
  - In game details modal:
    - Each bingo square (matched or unmatched) is clickable.
    - Clicking a square opens the article summary modal (same component used during gameplay).
    - Summary modal shows read-only article content for that grid cell.

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
  - `username`, `score`, `time`, `clicks`, `bingoSquares[]`, `history[]`, `createdAt`, `gameType` ("random" or "repeat"), `gameId` (reference to shared game if repeat).
- **Migration required**: 
  - Add `gameType` field to all existing entries (default to "random").
  - Update terminology from "fresh"/"linked" to "random"/"repeat".
- **Indices**:
  - Index on `score` (descending) at minimum.
  - Index on `createdAt` for time-based filtering.
  - Index on `gameType` for game type filtering.
  - Compound index on `(gameType, score, createdAt)` for efficient filtered queries.

#### 6.4 Game State Storage

- **Storage**: MongoDB `generated-games` collection (already created in cluster).
- **Fields**:
  - `hashedId` (16-character URL-safe hash, unique identifier for shareable URLs).
  - `gridCells[]` (25 article titles).
  - `startingArticle` (article title).
  - `gameType` ("random" or "repeat").
  - `createdAt` (timestamp).
  - `createdBy` (optional: username if from leaderboard replay).
- **Indices**:
  - Unique index on `hashedId` (for URL lookups).
  - Index on `createdAt` for cleanup/archival.
- **URL format**: `{domain}/{hashedId}` (e.g., `bingopedia.com/XHZ$G$z4y4zz46`).

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
  - Theme toggle accessible via keyboard.
  - Article viewer maintains scroll position when navigating (no auto-scroll to top on timer ticks).
- Screen-reader friendly labels:
  - Buttons and icons (grid toggle, close icons, theme toggle).
- Color choices must preserve contrast in both light and dark modes; matched vs. winning states distinguishable with more than color if feasible.
- **Critical bug fix**: Timer/state management must not cause UI resets:
  - Timer updates must not cause page refreshes or full component re-renders.
  - Links must remain stable and not flash on hover during timer ticks.
  - Article viewer must maintain scroll position when timer ticks.
  - Bingo grid cell summary modals must not close/reset on timer ticks.
  - Tab navigation through articles must not reset to top of article.
  - State updates should be debounced or batched to prevent unnecessary re-renders.
  - Timer implementation must not interfere with click event handling.
 - Aim for **"reasonably functional"** accessibility that makes the game enjoyable for keyboard and screen-reader users, without attempting full WCAG certification in this phase.

#### 7.5 Analytics & Logging

- **Event logging to MongoDB time series collection**:
  - Log "game_started" events.
  - Log "game_generated" events (when shareable game is created).
  - Log "game_finished" events (when game is won).
  - Store in time series collection for efficient querying and analysis.
- Track events (via chosen analytics solution) such as:
  - Game started.
  - Game won (with basic anonymized stats: clicks, time).
  - Score submitted (primary metric of interest).
  - Shared-game links created and followed.
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
- **Phase 4 – Polish & New Features** (Current Phase)
  - Fix timer/state reset bugs (critical).
  - Light mode implementation.
  - Enhanced leaderboard features (sorting, filtering, date display).
  - Game sharing and replay functionality.
  - Confetti animation on match confirmation.
- **Phase 5 – Game Persistence** (Optional/Later)
  - Game state persistence in localStorage.
  - Timer continues in real-time (not paused) when user returns.
  - Games persist on page refresh or browser close/reopen.
  - Only reset when user clicks "New Game" button.
  - **Note**: Can be deferred if implementation is complex.

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


