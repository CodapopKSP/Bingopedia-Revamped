# Bingopedia – UI/UX Design Reference

This document serves as the comprehensive design reference for the Bingopedia rebuild. It defines user flows, visual system, interaction specifications, accessibility guidelines, and microcopy.

**Last Updated**: Sprint 1 (Gameplay Reliability & Core UX Polish)

---

## Table of Contents

1. [User Flows](#1-user-flows)
2. [Visual System](#2-visual-system)
3. [Wireframes & Layouts](#3-wireframes--layouts)
4. [Interaction Specifications](#4-interaction-specifications)
5. [Accessibility Guidelines](#5-accessibility-guidelines)
6. [Microcopy & Messaging](#6-microcopy--messaging)
7. [Design Rationale](#7-design-rationale)
8. [Known Tradeoffs & Future Improvements](#8-known-tradeoffs--future-improvements)

---

## 1. User Flows

### 1.1 Primary Flow: Start → Play → Win → Submit Score

```
[Start Screen]
  ↓ User clicks "Start Game"
[Game Screen - Starting Article Loads]
  ↓ Timer starts after article loads
[User navigates via Wikipedia links]
  ↓ Each click increments counter, checks for matches
[Match detected → Confetti animation]
  ↓ User continues navigating
[Winning line detected (5 in a row)]
  ↓ Timer stops, win modal appears
[Win Modal - User enters username]
  ↓ User clicks "Submit Score"
[Score submitted successfully]
  ↓ Success message shown
[User clicks "Home" or page reloads]
[Start Screen - Updated leaderboard]
```

**Key Decision Points:**
- Timer starts **after** initial article loads (not on "Start Game" click)
- Confetti triggers only on **new** matches (not re-visits)
- Win detection happens immediately after match updates
- Score submission is optional (user can skip)

### 1.2 Alternative Flow: Start → Play → Win → Skip Submission

```
[Start Screen]
  ↓ User clicks "Start Game"
[Game Screen]
  ↓ User plays and wins
[Win Modal appears]
  ↓ User clicks "Skip" or closes modal
[Game Screen remains visible]
  ↓ User can click "New Game" to return to start
[Start Screen]
```

**Key Decision Points:**
- Skipping submission does not block user from playing again
- Game state remains visible after skipping (user can see their final board)

### 1.3 Leaderboard Exploration Flow

```
[Start Screen - Leaderboard visible]
  ↓ User scrolls/paginates leaderboard
[User clicks on a leaderboard entry (username or row)]
  ↓ Game Details Modal opens in a stable frame
[Modal shows: stats + tabbed content: Bingo Board / Article History]
  ↓ User switches tabs
[Content switches inside fixed-size shell; outer modal width/height remain stable]
  ↓ User clicks on a bingo square (optional)
[Article Summary Modal opens (read-only), layered above Game Details]
  ↓ User closes summary modal
[Game Details Modal still visible at same size/position]
  ↓ User closes game details modal
[Start Screen - Leaderboard still visible]
```

**Key Decision Points:**
- Leaderboard is prominently displayed on start screen.
- Game details are read-only (no editing or replay from modal).
- GameDetails modal uses a **stable layout shell** (fixed/max width, max-height with internal scroll).
- Switching between **Bingo Board** and **Article History** occurs inside a single content region and must **not change the outer modal size**.
- Bingo squares in game details can be clicked to see summaries in a secondary modal.

### 1.4 Error State Flows

#### 1.4.1 Article Load Failure

```
[User navigates to article]
  ↓ Article fetch fails (404, network error, etc.)
[Article replacement triggered automatically]
  ↓ New article selected from curated pool
[New article loads successfully]
  ↓ User continues playing
[No blocking error message - seamless replacement]
```

**Key Decision Points:**
- Failures are handled silently with automatic replacement
- User is not blocked from gameplay
- Replacement happens behind the scenes

#### 1.4.2 Leaderboard API Failure

**GET Failure (Start Screen):**
```
[Start Screen loads]
  ↓ Leaderboard API call fails
[Error message displayed in leaderboard area]
  ↓ "Unable to load leaderboard. Please try again."
[Retry button available]
  ↓ User clicks retry
[Leaderboard reloads]
```

**POST Failure (Win Modal):**
```
[User submits score]
  ↓ API call fails
[Error message shown inline in modal]
  ↓ "Failed to submit score: [error message]"
[Submit button re-enabled]
  ↓ User can retry or skip
```

**Key Decision Points:**
- Errors are user-friendly and actionable
- Users can retry failed operations
- Gameplay is never blocked by leaderboard failures

---

## 2. Visual System

### 2.1 Color Palette

#### Primary Colors
- **Background**: Dark gradient
  - Primary: `#0b1120` (slate-900)
  - Secondary: `#020617` (slate-950)
  - Gradient: Radial from top, `#0b1120` → `#020617 60%`

- **Text Primary**: `#e5e7eb` (gray-200)
- **Text Secondary**: `#cbd5f5` (slate-200)
- **Text Muted**: `#94a3b8` (slate-400)

#### Interactive Colors
- **Primary CTA**: Gradient `#facc15` (yellow-400) → `#f97316` (orange-500)
  - Hover: Brightness +5%, shadow enhancement
  - Active: Reduced shadow, slight translate down

- **Links**: `#93c5fd` (blue-300)
  - Hover: Underline

#### Game State Colors
- **Neutral Cell**: 
  - Background: `rgba(30, 41, 59, 0.8)` (slate-800 with opacity)
  - Border: `rgba(148, 163, 184, 0.3)` (slate-400 with opacity)
  - Hover: Border `rgba(250, 204, 21, 0.5)` (yellow-400)

- **Matched Cell**:
  - Background: `rgba(34, 197, 94, 0.3)` (green-500 with opacity)
  - Border: `rgba(34, 197, 94, 0.6)` (green-500)
  - Text: `#86efac` (green-300)
  - Hover: Background `rgba(34, 197, 94, 0.4)`, border `rgba(34, 197, 94, 0.8)`

- **Winning Cell**:
  - Background: Linear gradient `135deg, rgba(250, 204, 21, 0.4), rgba(251, 191, 36, 0.3)`
  - Border: `#facc15` (yellow-400)
  - Text: `#fef08a` (yellow-200)
  - Box Shadow: `0 0 12px rgba(250, 204, 21, 0.5)` with pulse animation
  - Animation: Pulse effect (1.5s infinite)

#### Status Colors
- **Game Won Badge**: Border `#22c55e` (green-500), text `#bbf7d0` (green-200)
- **Timer Paused**: Opacity 0.7, italic style

#### Modal & Overlay
- **Overlay Background**: `rgba(0, 0, 0, 0.7)` (semi-transparent black)
- **Modal Background**: `rgba(15, 23, 42, 0.95)` (slate-900 with high opacity)
- **Modal Border**: `rgba(148, 163, 184, 0.2)` (slate-400)

### 2.2 Typography

#### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### Type Scale
- **H1 / App Title**: `1.4rem`, uppercase, letter-spacing `0.08em`, color `#facc15`
- **H2 / Section Headers**: `1.75rem`
- **H3 / Modal Titles**: `1.1rem`
- **Body / Default**: `1rem` (16px base)
- **Small Text**: `0.9rem`
- **Bingo Cell Text**: `0.75rem` (desktop), `0.65rem` (mobile)
- **Button Text**: `1rem`, weight `600`

#### Line Height
- Default: `1.5`
- Bingo Cell: `1.2` (tighter for small cells)

#### Font Weight
- Normal: `400`
- Medium: `500` (matched cells)
- Semibold: `600` (buttons, winning cells)

### 2.3 Spacing System

Based on 4px base unit (0.25rem):

- **XS**: `0.25rem` (4px)
- **SM**: `0.5rem` (8px)
- **MD**: `0.75rem` (12px)
- **Base**: `1rem` (16px)
- **LG**: `1.5rem` (24px)
- **XL**: `2rem` (32px)

#### Component-Specific Spacing
- **Grid Gap**: `0.5rem` (desktop), `0.375rem` (mobile)
- **Grid Padding**: `0.5rem` (desktop), `0.375rem` (mobile)
- **Section Gap**: `1.5rem` (start screen), `1rem` (game screen)
- **Modal Padding**: `1.5rem` (header/body)
- **Button Padding**: `0.75rem 1.75rem`

### 2.4 Border Radius

- **Small**: `0.375rem` (6px) - cells, small buttons
- **Medium**: `0.5rem` (8px) - grids, containers
- **Large**: `0.75rem` (12px) - panels, modals
- **Pill**: `999px` - buttons, badges

### 2.5 Shadows & Effects

- **Start Button**: `0 16px 35px rgba(234, 179, 8, 0.5)`
  - Hover: `0 18px 40px rgba(234, 179, 8, 0.6)`
  - Active: `0 10px 24px rgba(234, 179, 8, 0.4)`

- **Winning Cell**: `0 0 12px rgba(250, 204, 21, 0.5)` with pulse animation
  - Hover: `0 0 16px rgba(250, 204, 21, 0.7)`

- **Hero Section**: `0 24px 60px rgba(15, 23, 42, 0.9)`

- **Backdrop Blur**: `blur(10px)` (header)

### 2.6 Iconography

#### Icons Used
- **Close Button**: `✕` (multiplication sign, Unicode U+2715)
- **Back/New Game**: `←` (left arrow, Unicode U+2190)

#### Icon Sizing
- **Close Button**: `1.2rem` font size
- **Close Button Size**: `2rem × 2rem` (32px square)

#### Icon Behavior
- All icons are text-based (no icon library dependency)
- Icons have hover states (background color change)
- Icons are keyboard accessible (role="button", tabIndex)

---

## 3. Wireframes & Layouts

### 3.1 Start Screen

**Desktop Layout (≥900px):**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: "WIKIPEDIA BINGO"                                   │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                   │
│  Hero Section            │  Leaderboard Section             │
│  ┌────────────────────┐  │  ┌──────────────────────────┐  │
│  │ Wiki Bingo,        │  │  │ Rank │ User │ Clicks │ ... │  │
│  │ Reimagined         │  │  ├──────────────────────────┤  │
│  │                    │  │  │  1   │ ...  │   ...  │ ... │  │
│  │ [Description text] │  │  │  2   │ ...  │   ...  │ ... │  │
│  │                    │  │  │ ...  │ ...  │   ...  │ ... │  │
│  │ [Start Game]       │  │  │                          │  │
│  └────────────────────┘  │  │ [Previous] [Next]        │  │
│                          │  └──────────────────────────┘  │
│                          │                                   │
└──────────────────────────┴──────────────────────────────────┘
```

**Mobile Layout (<900px):**
```
┌─────────────────────────┐
│ Header: "WIKIPEDIA BINGO"│
├─────────────────────────┤
│                         │
│  Hero Section           │
│  ┌───────────────────┐ │
│  │ Wiki Bingo,       │ │
│  │ Reimagined        │ │
│  │                   │ │
│  │ [Description]     │ │
│  │                   │ │
│  │ [Start Game]      │ │
│  └───────────────────┘ │
│                         │
│  Leaderboard Section    │
│  ┌───────────────────┐ │
│  │ Rank │ User │ ... │ │
│  ├───────────────────┤ │
│  │  1   │ ...  │ ... │ │
│  │  2   │ ...  │ ... │ │
│  │ ...  │ ...  │ ... │ │
│  └───────────────────┘ │
│                         │
└─────────────────────────┘
```

### 3.2 Game Screen

**Desktop Layout (≥960px):**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: "WIKIPEDIA BINGO"                                   │
├──────────────────────────┬──────────────────────────────────┤
│ Left Column (3fr)        │ Right Column (4fr)              │
│                          │                                   │
│  Score Bar               │  Article Viewer                  │
│  [← New Game] Time: 0:05 │  ┌──────────────────────────┐  │
│            Clicks: 12     │  │ [Article Title]           │  │
│            [In progress]  │  │                           │  │
│                          │  │ [Article content with     │  │
│  Bingo Grid (5×5)        │  │  clickable links...]      │  │
│  ┌────────────────────┐  │  │                           │  │
│  │ [Cell] [Cell] ...  │  │  │                           │  │
│  │ [Cell] [Cell] ...  │  │  └──────────────────────────┘  │
│  │ ...                │  │                                   │
│  └────────────────────┘  │                                   │
│                          │                                   │
│  History Panel           │                                   │
│  ┌────────────────────┐  │                                   │
│  │ 1. Starting Article│  │                                   │
│  │ 2. Article 2      │  │                                   │
│  │ 3. Article 3 ←    │  │                                   │
│  │ ...               │  │                                   │
│  └────────────────────┘  │                                   │
│                          │                                   │
└──────────────────────────┴──────────────────────────────────┘
```

**Mobile Layout (<960px):**
```
┌─────────────────────────┐
│ Header: "WIKIPEDIA BINGO"│
├─────────────────────────┤
│ Sticky Score Bar        │
│ Time: 0:05 │ Clicks: 12 │
│ [Toggle Board]          │
├─────────────────────────┤
│                         │
│  Article Viewer         │
│  ┌───────────────────┐ │
│  │ [Article Title]   │ │
│  │                   │ │
│  │ [Content...]      │ │
│  │                   │ │
│  └───────────────────┘ │
│                         │
│  [Floating Toggle]      │
│  [📋 View Board]        │
│                         │
└─────────────────────────┘

When Board Toggle is Open:
┌─────────────────────────┐
│ [Overlay Background]    │
│                         │
│  ┌───────────────────┐ │
│  │ [✕ Close]         │ │
│  │                   │ │
│  │  Bingo Grid (5×5) │ │
│  │  ┌─────────────┐  │ │
│  │  │ [Cell] ...  │  │ │
│  │  │ ...         │  │ │
│  │  └─────────────┘  │ │
│  │                   │ │
│  │  History Panel    │ │
│  │  ┌─────────────┐  │ │
│  │  │ 1. Article  │  │ │
│  │  │ 2. Article  │  │ │
│  │  └─────────────┘  │ │
│  └───────────────────┘ │
│                         │
└─────────────────────────┘
```

### 3.3 Win Modal

```
┌─────────────────────────────────────┐
│ [Overlay: rgba(0,0,0,0.7)]         │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 🎉 Congratulations! You Won! 🎉 │
│  │                          [✕] │ │
│  ├─────────────────────────────┤ │
│  │                             │ │
│  │  Stats:                     │ │
│  │  Time: 0:05:23              │ │
│  │  Clicks: 42                 │ │
│  │  Score: 13,566              │ │
│  │                             │ │
│  │  Enter username:            │ │
│  │  [________________]          │ │
│  │                             │ │
│  │  [Submit Score] [Skip]      │ │
│  │                             │ │
│  └─────────────────────────────┘ │
│                                   │
└───────────────────────────────────┘
```

### 3.4 Article Summary Modal

```
┌─────────────────────────────────────┐
│ [Overlay]                           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Article Title              [✕] │ │
│  ├───────────────────────────────┤ │
│  │                               │ │
│  │  [Summary text from Wikipedia │ │
│  │   summary API or truncated    │ │
│  │   article content...]         │ │
│  │                               │ │
│  │  [Close]                      │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 3.5 Game Details Modal (Stable Layout Shell)

```
┌─────────────────────────────────────────────────────────┐
│ [Overlay]                                               │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Game Details: Username                       [✕] │ │
│  ├───────────────────────────────────────────────┤ │
│  │                                               │ │
│  │  Stats Row (non-scrolling)                    │ │
│  │  Time: 0:05:23  ·  Clicks: 42  ·  Score: …   │ │
│  │                                               │ │
│  │  Tab Bar (non-scrolling)                      │ │
│  │  [ Bingo Board ]   [ Article History ]        │ │
│  │                                               │ │
│  │  Scrollable Content Region (max-height)       │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │ (Board View OR History View rendered   │ │ │
│  │  │  inside this same container)           │ │ │
│  │  │  - Board: 5×5 grid, read-only         │ │ │
│  │  │  - History: scrollable list of clicks │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Layout Requirements (Sprint 1 – S2):**
- Modal uses a **fixed/max width** on desktop (target: ~960px) with `max-width` and centered alignment.
- Modal has a **max-height** (e.g., 80–90% of viewport height) with `overflow-y: hidden` on the shell and **`overflow-y: auto` only in the inner content region**.
- Tab bar and stats row remain pinned at the top of the modal; only the content region scrolls.
- Switching tabs does **not** change the overall modal width or height; content differences are absorbed by the scrollable region.
- On smaller viewports, the same principles apply (stable outer shell, inner scroll), with width constrained to the viewport minus safe margins.

---

## 4. Interaction Specifications

### 4.1 Timer Behavior

**Start Condition:**
- Timer starts **after** the initial starting article is fully loaded
- Timer does NOT start on "Start Game" button click
- Timer does NOT start during article loading state

**Pause Conditions:**
- Timer pauses automatically when `articleLoading` is `true`
- Timer pauses during any article fetch operation
- Timer pauses during redirect resolution (if blocking)

**Resume Conditions:**
- Timer resumes when article load completes (`articleLoading` becomes `false`)
- Timer resumes immediately after article content is rendered

**Stop Conditions:**
- Timer stops permanently when `gameWon` is `true`
- Timer does NOT resume after win, even if user continues viewing

**Display Format:**
- Format: `MM:SS` for times < 1 hour, `H:MM:SS` for times ≥ 1 hour
- Paused state: Opacity 0.7, italic style
- Always visible in score bar (desktop and mobile)

### 4.2 Confetti Animation

**Trigger Conditions:**
- Confetti triggers **only** when a **new** match is detected
- Confetti does NOT trigger on:
  - Re-visiting a matched article
  - Re-clicking a history item that was already matched
  - Initial article load (even if it matches a grid cell)

**Animation Behavior:**
- Full-screen overlay (non-interactive)
- Plays Lottie animation from `Confetti.lottie`
- Duration: ~2-3 seconds (determined by animation file)
- Self-cleans after completion (no memory leaks)

**Performance Considerations:**
- Animation should not block user interactions
- Animation should not cause frame drops on mobile
- Animation can be disabled if performance issues occur

### 4.3 History Interaction

**Display:**
- Chronological list (oldest to newest, top to bottom)
- Current article highlighted (visual indicator)
- Grid articles have subtle indicator (icon or color)

**Click Behavior:**
- History clicks **always** increment click counter
- History clicks trigger navigation (same as link clicks)
- History clicks can trigger matches (if article matches grid)
- History clicks can trigger wins (if match completes a line)
- History clicks update `currentArticleTitle` and article viewer

**Edge Cases:**
- Long history: Panel becomes scrollable
- Very long titles: Text truncates with ellipsis
- Current article: Always visible and highlighted

### 4.4 Article Replacement UX

**When Replacement Occurs:**
- Grid article fails to load → Cell article replaced
- Current article fails to load → Viewer article replaced

**User Experience:**
- Replacement happens automatically (no user action required)
- No blocking error modal
- Subtle indicator (optional): Brief toast or console log
- New article selected from curated pool (ensures uniqueness)

**Fallback Behavior:**
- If replacement article also fails: Retry with another article
- If all articles fail: Show error message (rare edge case)

### 4.5 Grid Cell Interaction

**Click Behavior:**
- Grid cell clicks open **Article Summary Modal** (read-only)
- Grid cell clicks do **NOT** navigate to article
- Grid cell clicks do **NOT** increment click counter
- Grid cell clicks do **NOT** trigger matches

**Keyboard Interaction:**
- Grid cells are keyboard accessible (tabIndex, role="button")
- Enter or Space key triggers click
- Focus visible with outline

**Visual Feedback:**
- Hover: Border color change, slight scale (1.02)
- Focus: Yellow outline (`#facc15`)
- Matched: Green background and border
- Winning: Gold gradient with pulse animation

### 4.6 Modal Interactions

**Open Behavior:**
- Modals appear with overlay (semi-transparent black).
- Modals are centered on screen and use a **stable layout shell** if they contain tabbed content or large scrollable regions (e.g., Game Details, ToC overlay).
- Body scroll is locked when modal is open.

**Close Behavior:**
- Click overlay: Closes modal (if not submitting/loading).
- Click close button (✕): Closes modal.
- Press Escape key: Closes modal (if not submitting/loading).
- Submit/Skip actions: Close modal after completion.

**Focus Management:**
- Focus moves to modal on open.
- Focus returns to trigger element on close.
- Tab order is trapped within modal.
- For tabbed content (e.g., Game Details Board/History), tabs must be reachable by keyboard and clearly indicate which tab is active via both visual state and ARIA attributes.

### 4.7 Leaderboard Interactions

**Pagination:**
- Default page size: 10 entries
- "Previous" button: Disabled on first page
- "Next" button: Disabled on last page
- Page numbers: Optional (not implemented in initial version)

**Sorting:**
- Default sort: By score (ascending, lower is better)
- Sortable columns: Clicks, Time (ascending = better)
- Sort indicators: Visual arrows or text labels

**Row Click:**
- Clicking username/row opens Game Details Modal
- Modal shows read-only game data
- Bingo squares in modal are clickable (opens summary)

---

## 5. Accessibility Guidelines

### 5.1 Keyboard Navigation

#### Tab Order (Start Screen)
1. "Start Game" button
2. Leaderboard table (if interactive)
3. Pagination controls (Previous/Next)
4. Leaderboard row items (usernames)

#### Tab Order (Game Screen - Desktop)
1. "New Game" link
2. Bingo grid cells (25 cells, left-to-right, top-to-bottom)
3. History panel items (chronological order)
4. Article viewer links (natural document order)
5. Floating toggle (mobile only)

#### Tab Order (Win Modal)
1. Username input field
2. "Submit Score" button
3. "Skip" button
4. Close button (✕)

#### Tab Order (Article Summary Modal)
1. Close button (✕)
2. Close button (if present in body)

#### Keyboard Shortcuts
- **Escape**: Close any open modal
- **Enter/Space**: Activate focused button or cell
- **Tab**: Move to next focusable element
- **Shift+Tab**: Move to previous focusable element

### 5.2 ARIA Labels & Roles

#### Buttons
- **Start Game**: `aria-label="Start a new game"`
- **Close Buttons**: `aria-label="Close"`
- **Bingo Cell**: `aria-label="Bingo cell: [Title][matched][winning]"`
- **New Game Link**: Text content "← New Game" (no additional label needed)

#### Modals
- **Win Modal**: `role="dialog"`, `aria-labelledby="win-modal-title"`
- **Article Summary Modal**: `role="dialog"`, `aria-labelledby="summary-modal-title"`
- **Game Details Modal**: `role="dialog"`, `aria-labelledby="details-modal-title"`

#### Regions
- **Bingo Grid**: `role="grid"` (optional, or `role="region"` with `aria-label="Bingo grid"`)
- **History Panel**: `role="region"`, `aria-label="Article history"`
- **Article Viewer**: `role="article"`, `aria-label="Wikipedia article"`

#### Status Indicators
- **Game Status Badge**: `aria-live="polite"` (announces "Bingo!" when win occurs)
- **Timer**: `aria-label="Game timer: [time]"` (optional)
- **Click Counter**: `aria-label="Click count: [number]"` (optional)

### 5.3 Color Contrast

#### Minimum Contrast Ratios (WCAG AA)
- **Normal Text**: 4.5:1 contrast ratio
- **Large Text (18pt+)**: 3:1 contrast ratio
- **Interactive Elements**: 3:1 contrast ratio

#### Current Implementation
- **Text on Dark Background**: `#e5e7eb` on `#0b1120` = ~12:1 ✓
- **Matched Cell Text**: `#86efac` on `rgba(34, 197, 94, 0.3)` = ~4.8:1 ✓
- **Winning Cell Text**: `#fef08a` on gradient = ~5.2:1 ✓
- **Button Text**: `#1f2937` on `#facc15` = ~8:1 ✓

### 5.4 Non-Color Indicators

#### Matched Cells
- **Visual**: Green background (`rgba(34, 197, 94, 0.3)`)
- **Text**: Green text color (`#86efac`)
- **Border**: Green border (`rgba(34, 197, 94, 0.6)`)
- **ARIA**: "matched" in aria-label

#### Winning Cells
- **Visual**: Gold gradient background
- **Text**: Yellow text color (`#fef08a`)
- **Border**: Yellow border (`#facc15`)
- **Animation**: Pulse effect (box-shadow animation)
- **ARIA**: "winning" in aria-label

#### Focus Indicators
- **Default**: Browser default outline (yellow `#facc15` for cells)
- **Visible**: 2px solid outline with 2px offset
- **Always Visible**: No `outline: none` without replacement

### 5.5 Screen Reader Support

#### Semantic HTML
- Use `<button>` for interactive elements (not `<div>` with onClick)
- Use `<nav>`, `<main>`, `<article>` for landmarks
- Use `<form>` for score submission

#### Live Regions
- Win detection: `aria-live="polite"` on status badge
- Match detection: Optional `aria-live="off"` (confetti is visual only)

#### Hidden Text
- Icon-only buttons: `aria-label` with descriptive text
- Decorative elements: `aria-hidden="true"`

---

## 6. Microcopy & Messaging

### 6.1 Start Screen

**Hero Section:**
- **Title**: "Wiki Bingo, Reimagined"
- **Description**: "Navigate Wikipedia from a random starting article to complete a 5×5 bingo card of target articles. Every click and every second counts toward your final score."
- **CTA Button**: "Start Game"
  - `aria-label`: "Start a new game"

### 6.2 Game Screen

**Score Bar:**
- **New Game Link**: "← New Game"
- **Time Label**: "Time: [MM:SS or H:MM:SS]"
- **Clicks Label**: "Clicks: [number]"
- **Status Badge**: "In progress" (default) or "Bingo!" (when won)

**Mobile Toggle:**
- **Button Text**: "📋 View Board" or "📄 View Article" (context-dependent)
- **Button Label**: `aria-label="Toggle between bingo board and article viewer"`

**Loading States:**
- **Grid Loading**: "Loading articles for bingo grid..."
- **Article Loading**: (Handled by ArticleViewer component)

### 6.3 Win Modal

**Header:**
- **Title**: "🎉 Congratulations! You Won! 🎉"

**Stats Display:**
- **Time Label**: "Time:"
- **Clicks Label**: "Clicks:"
- **Score Label**: "Score:"
- **Time Value**: Formatted as `MM:SS` or `H:MM:SS`
- **Score Value**: Formatted with thousands separator (e.g., "13,566")

**Form:**
- **Label**: "Enter your username to submit your score:"
- **Input Placeholder**: "Username (max 50 characters)"
- **Input aria-label**: "Username input"
- **Submit Button**: "Submit Score" (default) or "Submitting..." (loading)
- **Skip Button**: "Skip"

**Success State:**
- **Message**: "Your score has been submitted to the leaderboard!"
- **Home Button**: "Home"

**Error States:**
- **Empty Username**: "Please enter a username"
- **Username Too Long**: "Username must be 50 characters or less"
- **Submission Failure**: "Failed to submit score: [error message]"
  - Example: "Failed to submit score: Network error. Please try again."

### 6.4 Article Summary Modal

**Header:**
- **Title**: "[Article Title]"
- **Close Button**: `aria-label="Close"`

**Body:**
- **Content**: Wikipedia summary text or truncated article content
- **Loading State**: "Loading summary..." (with loading indicator)
- **Error State**: Summary text shows with error styling (no separate error message)

**Footer:**
- **Close Button**: "Close" (if present)

### 6.5 Game Details Modal

**Header:**
- **Title**: "Game Details: [Username]"
- **Close Button**: `aria-label="Close"`

**Stats Section:**
- **Score Label**: "Score:"
- **Time Label**: "Time:"
- **Clicks Label**: "Clicks:"
- **Date Label**: "Date:" (if available)

**Tabs:**
- **Board Tab**: "Bingo Board" (`aria-label="View bingo board"`)
- **History Tab**: "Article History" (`aria-label="View article history"`)

**Content Areas:**
- **Board View**: Displays BingoGrid component (read-only)
- **History View**: Displays HistoryPanel component (read-only)
- **Empty Board State**: "No board data available for this entry."
- **Empty History State**: "No history data available for this entry."

### 6.6 Leaderboard

**Table Headers:**
- **Rank**: "Rank"
- **Username**: "Username"
- **Clicks**: "Clicks"
- **Time**: "Time"
- **Date**: "Date" (if shown)

**Pagination:**
- **Previous Button**: "Previous"
- **Next Button**: "Next"
- **Page Info**: "Page [current] of [total]" (if shown)

**Error States:**
- **Load Failure**: "Unable to load leaderboard right now."
- **Retry Button**: (Not currently implemented - error is static)
- **Empty State**: "No scores yet. Be the first!"

**Loading State:**
- **Message**: "Loading…" (with ellipsis)

### 6.7 Article Viewer

**Loading State:**
- **Message**: "Loading article..."

**Error States:**
- **Load Failure**: "Unable to load article. A replacement article will be loaded automatically."
- **Replacement Message**: (Optional toast) "Article replaced due to load error."

### 6.8 History Panel

**Section Title:**
- **Label**: "Article History" (optional, if shown)

**Empty State:**
- **Message**: "No articles visited yet."

**Current Article Indicator:**
- **Visual**: Highlighted background or border
- **ARIA**: "Current article" in aria-label (optional)

**Grid Article Indicator:**
- **Visual**: Icon or color accent
- **ARIA**: "Grid article" in aria-label (optional)

---

## 7. Design Rationale

### 7.1 Summary Modal vs Direct Navigation

**Decision**: Grid cells open a read-only summary modal instead of navigating directly.

**Rationale**:
- Prevents "cheating" by allowing users to see article summaries without navigating
- Maintains game integrity (users must navigate via Wikipedia links)
- Provides helpful context without breaking game rules
- Aligns with bingo game mechanics (you can see what you need, but must navigate to it)

### 7.2 Timer Starts After Article Load

**Decision**: Timer starts after the initial article loads, not on "Start Game" click.

**Rationale**:
- Fair timing: Users shouldn't be penalized for slow network connections
- Consistent with pause behavior: Timer pauses during loads
- Better user experience: No anxiety about timer starting before content is ready

### 7.3 History Clicks Count as Clicks

**Decision**: Clicking history items increments the click counter and can trigger matches.

**Rationale**:
- Prevents gaming the system: Users can't avoid click penalties by using history
- Consistent behavior: All navigation increments counter
- Maintains score integrity: Score reflects actual navigation effort

### 7.4 Confetti Only on New Matches

**Decision**: Confetti triggers only when a new match is detected, not on re-visits.

**Rationale**:
- Prevents spam: Users can't trigger confetti repeatedly by re-visiting
- Clear feedback: Confetti signals progress, not just navigation
- Performance: Reduces unnecessary animation triggers

### 7.5 Mobile Toggle Design

**Decision**: Mobile uses a toggle between grid/history and article viewer, not side-by-side.

**Rationale**:
- Screen space: Mobile screens are too narrow for side-by-side layout
- Focus: Users can focus on one view at a time
- Touch-friendly: Larger touch targets, easier interaction

### 7.6 Dark Theme

**Decision**: App uses a dark theme with high contrast.

**Rationale**:
- Modern aesthetic: Dark themes are popular and reduce eye strain
- Visual hierarchy: High contrast makes game states clear
- Performance: Dark backgrounds can reduce battery usage on OLED screens

---

## 8. Known Tradeoffs & Future Improvements

### 8.1 Current Limitations

**Accessibility:**
- No full WCAG AAA compliance (aiming for AA)
- Limited screen reader testing (needs real device testing)
- No high contrast mode toggle

**Performance:**
- Large `curatedArticles.json` file (several MB) loaded upfront
- No lazy loading of article data
- Confetti animation may impact low-end devices

**UX:**
- No undo/redo for navigation
- No game pause feature
- No save/resume game state

### 8.2 Future Enhancements

**Planned Features:**
- **Shared/Replayable Boards**: Users can share board seeds or play daily challenges
- **Game History**: Per-user game history (requires authentication)
- **Analytics**: Event tracking for game started, won, score submitted
- **Alternative Grid Sizes**: 3×3, 7×7 (code supports it, UI doesn't expose it)

**UX Improvements:**
- **Game Pause**: Allow users to pause timer during gameplay
- **Undo Navigation**: Allow users to undo last navigation (with click penalty)
- **Save State**: Save game state to localStorage for resume
- **Tutorial/Onboarding**: First-time user guide

**Visual Enhancements:**
- **Animations**: Smooth transitions between states
- **Themes**: Light mode option
- **Customization**: User-selectable color schemes

**Accessibility Improvements:**
- **High Contrast Mode**: Toggle for high contrast
- **Font Size Controls**: User-adjustable text size
- **Reduced Motion**: Respect `prefers-reduced-motion`

---

## Appendix: Design Tokens Reference

### Colors (CSS Variables - Recommended for Future)

```css
:root {
  /* Backgrounds */
  --bg-primary: #0b1120;
  --bg-secondary: #020617;
  --bg-card: rgba(30, 41, 59, 0.8);
  --bg-modal: rgba(15, 23, 42, 0.95);
  --bg-overlay: rgba(0, 0, 0, 0.7);

  /* Text */
  --text-primary: #e5e7eb;
  --text-secondary: #cbd5f5;
  --text-muted: #94a3b8;

  /* Interactive */
  --link-color: #93c5fd;
  --button-primary-start: #facc15;
  --button-primary-end: #f97316;

  /* Game States */
  --cell-neutral-bg: rgba(30, 41, 59, 0.8);
  --cell-neutral-border: rgba(148, 163, 184, 0.3);
  --cell-matched-bg: rgba(34, 197, 94, 0.3);
  --cell-matched-border: rgba(34, 197, 94, 0.6);
  --cell-matched-text: #86efac;
  --cell-winning-bg-start: rgba(250, 204, 21, 0.4);
  --cell-winning-bg-end: rgba(251, 191, 36, 0.3);
  --cell-winning-border: #facc15;
  --cell-winning-text: #fef08a;

  /* Status */
  --status-won-border: #22c55e;
  --status-won-text: #bbf7d0;
}
```

### Spacing (CSS Variables - Recommended for Future)

```css
:root {
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 0.75rem;  /* 12px */
  --space-base: 1rem;   /* 16px */
  --space-lg: 1.5rem;   /* 24px */
  --space-xl: 2rem;     /* 32px */
}
```

---

**Document Status**: Complete for initial rebuild. Will be updated as features are added and UX is refined based on user feedback.

