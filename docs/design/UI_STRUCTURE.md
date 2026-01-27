# Bingopedia Revamp – UI Structure & Component Hierarchy

This document describes the component hierarchy, screen flows, and user interactions in the Bingopedia application.

---

## Component Hierarchy

### Top Level
```
App.tsx
└── AppLayout.tsx
    └── [Screen Component]
```

### Screen Components

#### Start Screen
```
StartScreen.tsx
├── StartScreenLeaderboard.tsx
│   └── GameDetailsModal.tsx (conditional, when row clicked)
│       ├── BingoGrid.tsx (read-only)
│       └── HistoryPanel.tsx (read-only)
└── [Start Game Button]
```

#### Game Screen
```
GameScreen.tsx
├── Confetti.tsx (conditional, when match occurs)
├── WinModal.tsx (conditional, when game won)
├── ArticleSummaryModal.tsx (conditional, when grid cell clicked)
├── [Mobile Toggle Button] (mobile only)
├── [Mobile Overlay] (mobile only)
├── [Mobile Score Bar] (mobile only)
├── bp-game-left (desktop: always visible, mobile: slide-in panel)
│   ├── bp-game-scorebar (desktop only)
│   ├── BingoGrid.tsx
│   └── HistoryPanel.tsx
└── bp-game-right (desktop: always visible, mobile: default view)
    └── ArticleViewer.tsx
```

---

## Screen Flows

### 1. Start Screen Flow

**Entry Point**: User visits the app or clicks "New Game" from game screen.

**Components**:
- `StartScreen.tsx` – Main container
- `StartScreenLeaderboard.tsx` – Displays top 5 scores

**User Actions**:
1. View leaderboard (read-only, top 5 entries)
2. Click leaderboard row → Opens `GameDetailsModal` showing that game's board and history
3. Click "Start Game" → Transitions to `GameScreen`

**State Management**:
- Leaderboard data fetched on mount via `fetchLeaderboard()`
- No game state initialized yet

---

### 2. Game Screen Flow

**Entry Point**: User clicks "Start Game" from start screen.

**Initialization**:
1. `useGameState.startNewGame()` called
2. Loads `curatedArticles.json`
3. Generates bingo set (26 articles)
4. Sets starting article as current
5. Initializes timer (not running yet)

**Layout Behavior**:

**Desktop (≥960px)**:
- Two-column layout: left (grid + history), right (article viewer)
- Both panels always visible
- Score bar visible in left panel

**Mobile (<960px)**:
- Single-column layout
- Score bar fixed at top
- Floating toggle button (bottom-right)
- Default view: article viewer
- Toggle opens slide-in panel with grid + history
- Overlay dims background when panel open

**User Interactions**:

1. **Article Navigation** (via link click in `ArticleViewer`):
   - `ArticleViewer` intercepts link clicks
   - Calls `registerNavigation(title)`
   - Updates history, increments clicks, checks matches
   - Timer starts/resumes if not already running
   - Article loading state managed

2. **Grid Cell Click**:
   - Opens `ArticleSummaryModal` with article summary
   - Does NOT navigate (read-only preview)
   - User can close modal

3. **History Click**:
   - Calls `registerNavigation(title)` (same as link click)
   - Increments clicks, can trigger matches/wins
   - Updates current article

4. **Win Detection**:
   - Triggered automatically when any of 12 winning lines complete
   - Shows confetti animation
   - Opens `WinModal` for score submission

5. **Score Submission** (in `WinModal`):
   - User enters username (max 50 chars)
   - Submits via `submitScore()`
   - On success, shows confirmation
   - User can return to start screen

---

### 3. Modal Components

#### WinModal
- **Trigger**: Automatically when `gameWon === true`
- **Content**: Final stats (time, clicks, score), username input, submit button
- **Actions**: Submit score, skip submission, close (returns to start screen)

#### ArticleSummaryModal
- **Trigger**: Click on grid cell
- **Content**: Wikipedia summary of that article
- **Actions**: Close modal (no navigation)

#### GameDetailsModal
- **Trigger**: Click on leaderboard row
- **Content**: Past game's stats, bingo board (read-only), article history (read-only)
- **Tabs**: Switch between board view and history view
- **Actions**: Close modal

#### Confetti
- **Trigger**: On first-time article match
- **Behavior**: Plays Lottie animation, auto-cleans up

---

## Responsive Breakpoints

- **Desktop**: `≥960px` – Two-column layout
- **Tablet/Mobile**: `<960px` – Single-column with toggle
- **Small Phone**: `<600px` – Adjusted spacing and button sizes

---

## State Flow

### Game State (via `useGameState` hook)
```
GameState {
  gameStarted: boolean
  gameWon: boolean
  gridCells: GameGridCell[] (25 cells)
  startingArticle: CuratedArticle | null
  matchedArticles: Set<string> (normalized titles)
  winningCells: GridIndex[] (0-24)
  clickCount: number
  elapsedSeconds: number
  timerRunning: boolean
  articleLoading: boolean
  articleHistory: string[] (titles in visit order)
  currentArticleTitle: string | null
}
```

### State Transitions
1. **Initial**: `gameStarted: false` → Start screen
2. **Game Start**: `gameStarted: true`, `timerRunning: false` → Game screen, starting article loaded
3. **First Navigation**: `timerRunning: true` → Timer starts
4. **Article Loading**: `articleLoading: true`, `timerRunning: false` → Timer pauses
5. **Match Found**: `matchedArticles` updated → Confetti if first-time
6. **Win**: `gameWon: true`, `winningCells` populated → Win modal opens

---

## Accessibility Considerations

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order: Start button → Leaderboard rows → Game controls → Grid cells → History items → Article links
- Modals trap focus and can be closed with Escape

### ARIA Labels
- Toggle buttons have `aria-label` attributes
- Modal close buttons have `aria-label="Close"`
- Leaderboard rows have descriptive `aria-label` for screen readers
- Article links maintain semantic HTML

### Visual Indicators
- Matched cells have distinct styling (not color-only)
- Winning cells have additional visual indicator
- Timer shows paused state with italic styling
- Loading states clearly indicated

---

## Component Communication

### Props Flow
- `GameScreen` receives `state` and `controls` from `App.tsx` (which uses `useGameState`)
- `ArticleViewer` receives `articleTitle` and callbacks from `GameScreen`
- `BingoGrid` and `HistoryPanel` receive data and callbacks from `GameScreen`
- Modals receive data and `onClose` callbacks

### Callback Chain Example (Article Navigation)
```
ArticleViewer (link click)
  → onArticleClick(title)
    → GameScreen.handleArticleClick(title)
      → controls.registerNavigation(title)
        → useGameState.registerNavigation(title)
          → Updates state, checks matches, triggers win detection
```

---

## Future Enhancements (Out of Scope)

- Replayable/shared boards (would require storing board seed/identifier)
- Daily challenges (would require stable board generation)
- Analytics events (would require event tracking infrastructure)

