# Bingopedia - Product Specification Document

## Document Purpose
This document serves as a comprehensive product specification for the Bingopedia Wikipedia Bingo game, prepared for handoff to a new development team.

**Important**: The existing codebase is available in this repository for **reference only**. The new team should **rebuild the application from scratch** based on this specification, using the existing code as a reference for understanding behavior and edge cases, but writing fresh, clean code.

**Last Updated:** January 2025  
**Project Status:** Retired - Being rebuilt due to accumulated tech debt

---

## 1. Product Overview

### 1.1 What is Bingopedia?
Bingopedia is a web-based game that combines Wikipedia exploration with bingo mechanics. Players are given a 5x5 bingo grid containing 25 Wikipedia articles and must navigate from a starting article to find articles on their grid by clicking links within Wikipedia pages.

### 1.2 Core Value Proposition
- **Educational**: Encourages exploration of diverse Wikipedia content
- **Engaging**: Game mechanics make learning fun and competitive
- **Accessible**: Free to play, no registration required (optional leaderboard)
- **Diverse Content**: Uses curated article lists covering 58+ categories

### 1.3 Target Audience
- Wikipedia enthusiasts
- Casual gamers seeking educational entertainment
- People who enjoy exploration and discovery
- Competitive players (via leaderboard)

---

## 2. Core Features

### 2.1 Game Mechanics

#### 2.1.1 Game Setup
1. Player clicks "Start Game" button
2. System generates a bingo set:
   - Selects 26 random categories from curated article pool
   - Picks 1 article from each category (respecting group constraints)
   - First 25 articles populate the 5x5 bingo grid
   - 26th article becomes the starting article
3. Starting article loads in the article viewer
4. Timer begins counting up (format: HH:MM:SS)
5. Click counter initializes at 0

#### 2.1.2 Gameplay
- **Article Navigation**: Player clicks links within Wikipedia articles to navigate
- **Bingo Grid**: 5x5 grid displays 25 target articles
- **Matching**: When player navigates to an article that matches a grid article, it's marked as "found"
- **Winning Condition**: Player wins by finding 5 articles in a row (horizontal, vertical, or diagonal)
- **Tracking**: System tracks:
  - Total clicks (each article navigation = 1 click)
  - Elapsed time (pauses during article loading)
  - Article history (chronological list of visited articles)

#### 2.1.3 Article Matching Logic
**Critical**: The matching system must handle Wikipedia redirects and title normalization:

1. **Title Normalization**:
   - Convert spaces to underscores
   - Remove leading/trailing whitespace
   - Normalize multiple consecutive underscores to single underscore
   - Example: "New York" → "New_York" → "New_York"

2. **Redirect Resolution**:
   - Wikipedia articles can redirect to canonical titles
   - System must resolve redirects for both clicked articles and grid articles
   - Cache redirect resolutions to avoid repeated API calls
   - Example: "USA" redirects to "United States"

3. **Matching Rules**:
   - Direct title match (after normalization)
   - Match via redirect resolution (both directions)
   - Case-insensitive comparison
   - Handles URL encoding/decoding

#### 2.1.4 Winning Detection
- Check for 5 consecutive matches in:
  - Rows (5 rows)
  - Columns (5 columns)
  - Diagonals (2 diagonals)
- Total: 12 possible winning lines
- Game ends immediately when any winning line is detected
- Timer stops
- Win modal appears

#### 2.1.5 Scoring System
- **Score Formula**: `time (seconds) × clicks`
- **Lower is better**: Players want to complete the game quickly with few clicks
- Score is calculated when game is won
- Score can be submitted to leaderboard (optional)

### 2.2 User Interface Components

#### 2.2.1 Start Screen
- **Title**: "Wikipedia Bingo"
- **Description**: Explains game rules
- **Start Game Button**: Initiates new game
- **Leaderboard**: Displays top scores (visible before game starts)

#### 2.2.2 Game Screen Layout

**Desktop Layout:**
- **Left Panel**: Bingo grid (5x5) + score panel + article history
- **Right Panel**: Article viewer (Wikipedia content)
- **Header**: Game title/logo

**Mobile Layout:**
- **Toggle Button**: Switches between bingo grid and article viewer
- **Score Panel**: Fixed at top (mobile) or in sidebar (desktop)
- **Article Viewer**: Full-width when visible
- **Bingo Grid**: Overlay/modal when toggled open

#### 2.2.3 Bingo Grid Component
- **Grid Size**: 5x5 (25 cells)
- **Cell States**:
  - Default: White background, article title
  - Matched: Highlighted (e.g., green background), "Found" indicator
  - Winning Line: Special highlight (e.g., gold/yellow)
- **Cell Interaction**: Click to view article summary (non-cheating, read-only)
- **Visual Feedback**: Clear distinction between matched/unmatched articles

#### 2.2.4 Article Viewer Component
- **Content Source**: Wikipedia Mobile HTML API (preferred) or Desktop HTML API (fallback)
- **Features**:
  - Displays full Wikipedia article content
  - All links are clickable (navigates to linked article)
  - Removes Wikipedia navigation elements
  - Removes infoboxes, sidebars, references section
  - Removes edit buttons and Wikipedia-specific UI
  - Converts external links to non-clickable spans
  - Handles article load failures gracefully (replaces with new article)
- **Performance**: Client-side caching for previously viewed articles

#### 2.2.5 Score Panel
- **Clicks Counter**: Displays total number of article navigations
- **Timer**: Displays elapsed time (HH:MM:SS format)
- **Timer Behavior**: Pauses when article is loading, resumes when loaded

#### 2.2.6 Article History Panel
- **Purpose**: Shows chronological list of visited articles
- **Display**: Scrollable list, most recent at bottom
- **Interaction**: Clicking history item navigates back to that article
- **Visual**: Highlights current article, shows which articles are in grid

#### 2.2.7 Win Modal
- **Trigger**: Appears automatically when winning condition is met
- **Content**:
  - Congratulations message
  - Game statistics (clicks, time, score)
  - Username input field
  - Submit Score button
  - Skip button (allows closing without submitting)
- **Submission**: Sends score to leaderboard API
- **Post-Submission**: Shows success message, "Home" button to restart

#### 2.2.8 Confetti Animation
- **Trigger**: Plays when a new article is matched (not on every match, only new ones)
- **Asset**: Lottie animation file (`Confetti.lottie`)
- **Behavior**:
  - Full-screen overlay
  - Non-interactive (pointer-events: none)
  - Plays once per match
  - Auto-completes and removes itself
- **Technical**: Uses DotLottie React library, seeks to 200ms to skip initial delay

#### 2.2.9 Leaderboard Component
- **Display**: Table showing top scores
- **Columns**: Rank, Username, Score, Clicks, Time, Date
- **Sorting**: Default by score (ascending - lower is better)
- **Pagination**: Supports pagination (default 10 per page)
- **Location**: Visible on start screen, can be integrated into game screen

### 2.3 Data Management

#### 2.3.1 Article Data Source
- **Primary Source**: Curated article lists from Wikipedia
- **Source Data**: `data/masterArticleList.txt` (master list of all articles)
- **Production Format**: JSON file (`public/curatedArticles.json`)
- **Structure**: Categories containing article titles
- **Total**: ~37,000 articles across 58+ categories
- **Generation**: `curatedArticles.json` is generated from `masterArticleList.txt` using `scripts/generateCuratedData.js`
- **Update Frequency**: Manual (via scripts)

#### 2.3.2 Category Groups & Constraints
- **Purpose**: Prevent too many similar articles in one game
- **Example**: "occupations" group - max 1 occupation-related category per game
- **Configuration**: Defined in `categoryGroups.json`
- **Implementation**: Selection algorithm respects group limits

#### 2.3.3 Article Selection Algorithm
1. Load curated articles data
2. Filter categories with articles
3. Shuffle all valid categories
4. Select categories respecting group constraints:
   - Track group usage count
   - Skip categories if group limit reached
   - Continue until 26 categories selected
5. Pick 1 random article from each selected category
6. Return array of 26 articles

### 2.4 Error Handling

#### 2.4.1 Article Load Failures
- **Scenario**: Article doesn't exist, deleted, or API error
- **Behavior**: 
  - If article is in grid: Replace with new random article from unused categories
  - If article is currently viewed: Replace with new random article
  - Log error for debugging

#### 2.4.2 Network Failures
- **Leaderboard API**: Show error message, allow retry
- **Wikipedia API**: Fallback to alternative endpoint, show error if all fail
- **Article Data**: Show error message, provide retry button

#### 2.4.3 Invalid Game States
- **Game Won**: Disable article navigation
- **Missing Data**: Show loading spinner or error message
- **Invalid Articles**: Auto-replace with valid alternatives

---

## 3. Technical Requirements

### 3.1 Frontend Technology Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)
- **Styling**: CSS (component-scoped)
- **Animation**: DotLottie React (`@lottiefiles/dotlottie-react`)

### 3.2 Backend/API Requirements
- **Leaderboard API**: 
  - GET `/api/leaderboard` - Fetch leaderboard entries
  - POST `/api/leaderboard` - Submit new score
  - Supports pagination, sorting
- **Database**: MongoDB (Atlas)
  - Collection: `leaderboard`
  - Index: `score` (descending)
  - Fields: `username`, `score`, `time`, `clicks`, `bingoSquares[]`, `history[]`, `createdAt`

### 3.3 External APIs
- **Wikipedia Mobile HTML API**: 
  - Endpoint: `https://en.wikipedia.org/api/rest_v1/page/mobile-html/{title}`
  - Preferred for smaller payload size
- **Wikipedia Desktop HTML API**:
  - Endpoint: `https://en.wikipedia.org/api/rest_v1/page/html/{title}`
  - Fallback if mobile API fails
- **Wikipedia Query API** (for redirect resolution):
  - Endpoint: `https://en.wikipedia.org/w/api.php?action=query&titles={title}&redirects=1&format=json&origin=*`

### 3.4 Performance Requirements
- **Article Loading**: < 2 seconds for first load (cached articles instant)
- **Matching Logic**: < 100ms per article click
- **Redirect Resolution**: Cached after first resolution
- **Mobile Performance**: Optimized for mobile devices (responsive design)

### 3.5 Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design (mobile-first approach)

---

## 4. Data Structures

### 4.1 Curated Articles JSON Structure
```json
{
  "generatedAt": "ISO 8601 timestamp",
  "totalCategories": 58,
  "totalArticles": 37039,
  "groups": {
    "occupations": {
      "maxPerGame": 1,
      "categories": ["List_of_artistic_occupations", ...]
    }
  },
  "categories": [
    {
      "name": "List_of_concert_halls",
      "articleCount": 3476,
      "articles": ["Alabama", "Alaska", ...],
      "group": "occupations" // optional
    }
  ]
}
```

### 4.2 Leaderboard Entry Structure
```json
{
  "_id": "MongoDB ObjectId",
  "username": "string (max 50 chars)",
  "score": "number (time * clicks)",
  "time": "number (seconds)",
  "clicks": "number",
  "bingoSquares": ["article1", "[Found] article2", ...],
  "history": ["article1", "article2", ...],
  "createdAt": "ISO 8601 date"
}
```

### 4.3 Game State Structure
```javascript
{
  gameStarted: boolean,
  articles: Array<Article>, // 26 articles
  gridArticles: Array<Article>, // First 25 articles
  selectedArticle: string, // Current article title
  matchedArticles: Set<string>, // Titles of matched articles
  winningCells: Set<number>, // Indices of winning line cells
  clickCount: number,
  timer: number, // seconds
  timerRunning: boolean,
  articleHistory: Array<string>, // Chronological list
  gameWon: boolean
}
```

### 4.4 Article Object Structure
```javascript
{
  title: string, // Wikipedia article title
  category: string, // Category name
  group: string | null, // Optional group name
  rank: number, // 1-26
  // Legacy fields (for compatibility):
  views: 0,
  averageViews: 0,
  averageRank: 0,
  linkCount: 0
}
```

---

## 5. API Specifications

### 5.1 Leaderboard API

#### GET `/api/leaderboard`
**Query Parameters:**
- `limit` (optional): Number of entries per page (default: 10)
- `page` (optional): Page number (default: 1)
- `sortBy` (optional): Field to sort by - `score`, `clicks`, `time`, `createdAt`, `username` (default: `score`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "users": [/* leaderboard entries */],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 150,
    "totalPages": 15
  },
  "sort": {
    "sortBy": "score",
    "sortOrder": "desc"
  }
}
```

#### POST `/api/leaderboard`
**Request Body:**
```json
{
  "username": "string (required, max 50 chars)",
  "score": "number (required)",
  "time": "number (seconds)",
  "clicks": "number",
  "bingoSquares": ["array of strings"],
  "history": ["array of strings"]
}
```

**Response:**
```json
{
  "_id": "MongoDB ObjectId",
  "username": "string",
  "score": "number",
  "time": "number",
  "clicks": "number",
  "bingoSquares": [],
  "history": [],
  "createdAt": "ISO 8601 date"
}
```

**Error Responses:**
- `400`: Missing required fields
- `500`: Server error
- `503`: Database connection failed

---

## 6. Deployment Configuration

### 6.1 Environment Variables
- `MONGODB_USERNAME`: MongoDB Atlas username
- `MONGODB_PASSWORD`: MongoDB Atlas password
- `MONGODB_CLUSTER`: MongoDB cluster name (e.g., `cluster0.rvkwijm.mongodb.net`)
- `PORT`: Server port (default: 3001)
- `VITE_API_URL`: Frontend API base URL (optional, defaults to relative)

### 6.2 Build Configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite (React)

### 6.3 Vercel Configuration
- **Rewrites**: 
  - `/api/leaderboard` → `/api/leaderboard.js`
  - All other routes → `/index.html` (SPA routing)

### 6.4 MongoDB Setup
- **Database Name**: `bingopedia`
- **Collection Name**: `leaderboard`
- **Index**: Create index on `score` field (descending)
- **Network Access**: Must allow Vercel IPs (or 0.0.0.0/0 for development)

---

## 7. User Flows

### 7.1 New Game Flow
1. User visits site → Sees start screen
2. User clicks "Start Game"
3. System generates bingo set (26 articles)
4. Starting article loads
5. Timer starts
6. User begins navigating Wikipedia

### 7.2 Article Navigation Flow
1. User clicks link in article
2. System increments click counter
3. System loads new article (checks cache first)
4. System checks if article matches grid
5. If match: Mark as found, play confetti, check for win
6. If win: Stop timer, show win modal
7. Add article to history

### 7.3 Winning Flow
1. System detects 5-in-a-row match
2. Timer stops
3. Game state set to "won"
4. Win modal appears
5. User enters username (optional)
6. User submits score (or skips)
7. Score saved to leaderboard
8. User can start new game

### 7.4 Leaderboard Flow
1. User views leaderboard (start screen or game screen)
2. System fetches top scores from API
3. Scores displayed in table
4. User can sort by different fields
5. User can paginate through results

---

## 8. Business Rules

### 8.1 Article Selection Rules
- Must select exactly 26 categories
- Must respect group constraints (e.g., max 1 occupation category)
- Each category must have at least 1 article
- Articles must be unique within a game

### 8.2 Scoring Rules
- Score = time × clicks
- Lower score is better
- Timer pauses during article loading
- Timer starts after articles load (not when button clicked)

### 8.3 Matching Rules
- Must handle Wikipedia redirects
- Must normalize titles (spaces → underscores)
- Case-insensitive matching
- Both directions: grid article → clicked article, clicked article → grid article

### 8.4 Winning Rules
- Exactly 5 consecutive matches required
- Can be horizontal, vertical, or diagonal
- Game ends immediately on win
- No partial wins (4-in-a-row doesn't count)

---

## 9. Known Issues & Technical Debt

### 9.1 Performance Optimizations Needed
- Article caching implemented but could be improved
- Redirect resolution could be pre-computed
- Large article lists could be paginated

### 9.2 Code Quality Issues
- Some duplicate logic between components
- Error handling could be more comprehensive
- TypeScript migration recommended

### 9.3 Feature Gaps
- No user accounts/authentication
- No game history per user
- No difficulty levels
- No custom bingo board sizes

---

## 10. Future Enhancements (Not Required for MVP)

### 10.1 Potential Features
- User authentication and profiles
- Custom game modes (3x3, 7x7 grids)
- Difficulty levels (easy/medium/hard categories)
- Achievement system
- Social sharing of scores
- Daily challenges
- Multiplayer mode

### 10.2 Technical Improvements
- Migrate to TypeScript
- Add comprehensive test coverage
- Implement service worker for offline play
- Add analytics tracking
- Improve mobile performance

---

## 10.3 Testing Recommendations

### Unit Tests
- Article title normalization logic
- Redirect resolution (with mocked API responses)
- Win detection algorithm (all 12 winning lines)
- Article selection (group constraints)
- Score calculation

### Integration Tests
- Article matching end-to-end (with real redirects)
- Bingo set generation (verify constraints)
- Leaderboard API (read/write operations)
- Article loading and caching

### E2E Tests
- Complete game flow (start → win → submit score)
- Article navigation and matching
- Win detection triggers correctly
- Error handling (failed articles, network errors)

### Manual Testing Checklist
- [ ] Test on mobile devices (iOS Safari, Chrome Mobile)
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test article matching with various redirect scenarios
- [ ] Test win detection with all 12 possible winning lines
- [ ] Test leaderboard with many entries (pagination, sorting)
- [ ] Test error scenarios (deleted articles, API failures)

---

## 11. Success Metrics

### 11.1 Key Performance Indicators
- **Game Completion Rate**: % of started games that are completed
- **Average Game Time**: Mean time to complete a game
- **Average Clicks**: Mean clicks per completed game
- **Leaderboard Participation**: % of wins that submit scores
- **User Retention**: % of users who play multiple games

### 11.2 Technical Metrics
- **Article Load Time**: < 2 seconds (first load)
- **API Response Time**: < 500ms (leaderboard)
- **Error Rate**: < 1% of article loads fail
- **Uptime**: > 99.5%

---

## 12. Support & Maintenance

### 12.1 Data Updates
- Article lists can be updated by running scripts (see `scripts/` directory)
- Process: Compile master list → Generate curated data → Deploy
- **Key Scripts**:
  - `scripts/compileMasterList.js` - Compiles master list from Wikipedia
  - `scripts/generateCuratedData.js` - Generates `curatedArticles.json` from master list

### 12.2 Monitoring
- Monitor MongoDB connection health
- Track API error rates
- Monitor Wikipedia API rate limits
- Watch for article load failures

### 12.3 Common Issues
- **Article not found**: Auto-replace with new article
- **API timeout**: Retry with exponential backoff
- **Database connection**: Check MongoDB Atlas network access
- **CORS errors**: Verify API configuration

---

## Appendix A: Glossary

- **Bingo Set**: Collection of 26 articles (25 for grid + 1 starting article)
- **Category**: A curated list of Wikipedia articles (e.g., "List of concert halls")
- **Group**: Collection of related categories with constraints (e.g., "occupations")
- **Grid Article**: One of the 25 articles displayed in the bingo grid
- **Matched Article**: A grid article that the player has navigated to
- **Winning Line**: 5 consecutive matched articles (row, column, or diagonal)
- **Redirect Resolution**: Process of finding canonical Wikipedia article title
- **Title Normalization**: Converting article titles to consistent format for comparison

---

## Appendix B: Related Documentation

- **Critical Files Inventory**: See `HANDOFF_CRITICAL_FILES.md`
- **Quick Start Guide**: See `HANDOFF_QUICK_START.md`
- **Performance Notes**: See `PERFORMANCE_OPTIMIZATIONS.md`
- **Script Files**: See `scripts/` directory (README files are outdated, refer to scripts directly)

---

**End of Product Specification**

