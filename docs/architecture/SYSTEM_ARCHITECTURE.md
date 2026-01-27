# System Architecture

**Document Purpose**: High-level system architecture overview for the Bingopedia application.

**Status**: Active Reference  
**Last Updated**: 2024

---

## Overview

Bingopedia is a Wikipedia-based bingo game built as a single-page application (SPA) with a serverless backend API. The system is designed for deployment on Vercel with MongoDB Atlas as the database.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 18 SPA (Vite)                                  │  │
│  │  - Game logic & state management                      │  │
│  │  - Wikipedia article viewer                           │  │
│  │  - Leaderboard UI                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Vercel Platform                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Serverless Functions (API)                          │  │
│  │  - /api/leaderboard (GET, POST)                      │  │
│  │  - /api/games (GET, POST)                            │  │
│  │  - /api/games/[hashedId] (GET)                       │  │
│  │  - /api/logging (POST)                               │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  MongoDB Atlas                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database: bingopedia                                 │  │
│  │  Collections:                                         │  │
│  │  - leaderboard (game scores)                          │  │
│  │  - generated-games (shareable games)                  │  │
│  │  - game_events (analytics/logging)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Production (Vercel)

- **Frontend**: Static files served from Vercel CDN
- **Backend**: Vercel serverless functions in `/api` directory
- **Database**: MongoDB Atlas (cloud-hosted)
- **Routing**: Vercel rewrites configured in `vercel.json`

### Development

- **Frontend**: Vite dev server (typically `localhost:5173`)
- **Backend**: Express dev server (`server/index.ts`, typically `localhost:3001`)
- **Database**: Same MongoDB Atlas instance (shared with production)
- **Hot Reload**: Both frontend and backend support hot reload

---

## API Architecture

### Endpoints

#### `/api/leaderboard`
- **GET**: Retrieve paginated leaderboard entries
  - Query params: `limit`, `page`, `sortBy`, `sortOrder`, `dateFrom`, `dateTo`, `gameType`
  - Returns: `{ users, pagination, sort }`
- **POST**: Submit new leaderboard entry
  - Body: `{ username, score, time, clicks, bingoSquares[], history[], gameId?, gameType? }`
  - Returns: Created entry with `_id`

#### `/api/games`
- **GET**: Retrieve game by link (query param: `link`)
- **POST**: Create new shareable game
  - Body: `{ bingopediaGame: string[] }` (26 articles)
  - Returns: `{ link, bingopediaGame, createdAt, timesPlayed }`

#### `/api/games/[hashedId]`
- **GET**: Retrieve game by hashed ID (path parameter)
  - Returns: `{ link, bingopediaGame, createdAt, timesPlayed }`

#### `/api/logging`
- **POST**: Log game events (non-blocking)
  - Body: `{ event, timestamp, gameId?, hashedId?, metadata? }`
  - Events: `game_started`, `game_generated`, `game_finished`

### API Patterns

- **CORS**: Enabled for all origins (public API)
- **Error Handling**: Structured error responses with error codes
- **Validation**: Input validation on all endpoints
- **Connection Pooling**: MongoDB connections cached and reused

---

## Database Schema

### Collection: `leaderboard`

```typescript
interface LeaderboardEntry {
  _id: ObjectId;
  username: string;              // Sanitized username
  score: number;                  // Lower is better
  time: number;                   // Seconds
  clicks: number;                 // Total clicks
  bingoSquares: string[];         // Matched article titles
  bingopediaGame?: string[];      // Full 26-article game set (optional)
  history: string[];              // Navigation history
  createdAt: Date;                // Submission timestamp
  gameId?: string;                // Reference to shareable game (optional, legacy)
  gameType?: 'random' | 'repeat'; // Game type (defaults to 'random')
}
```

**Indexes**:
- `{ score: -1, createdAt: 1 }` - Primary sorting
- `{ gameType: 1, score: 1, createdAt: 1 }` - Game type filtering
- `{ createdAt: -1 }` - Date-based queries
- `{ createdAt: -1, score: 1 }` - Date + score queries

### Collection: `generated-games`

```typescript
interface GeneratedGame {
  _id: ObjectId;
  link: string;                   // 16-character URL-safe hash (unique)
  bingopediaGame: string[];       // 26 article titles
  createdAt: Date;                // Creation timestamp
  timesPlayed: number;            // Usage counter
}
```

**Indexes**:
- `{ link: 1 }` (unique) - Fast lookups by link
- `{ createdAt: -1 }` - Recent games queries

### Collection: `game_events`

```typescript
interface GameEvent {
  event: 'game_started' | 'game_generated' | 'game_finished';
  timestamp: Date;
  gameId?: string;
  hashedId?: string;
  metadata?: Record<string, unknown>;
}
```

**Note**: Time series collection (created via MongoDB shell/admin tools)

---

## Frontend Architecture

### Structure

```
app/src/
├── app/                    # Root app component & layout
├── features/               # Feature modules
│   ├── game/              # Game logic & components
│   ├── article-viewer/    # Wikipedia article display
│   └── leaderboard/       # Leaderboard UI
└── shared/                # Shared utilities
    ├── api/               # API clients
    ├── components/        # Reusable components
    ├── data/              # Data loaders & types
    ├── theme/             # Theme system
    ├── utils/             # Utility functions
    └── wiki/              # Wikipedia integration
```

### Key Patterns

- **State Management**: Custom React hooks (`useGameState`, `useGameTimer`, `useTimerDisplay`)
- **Theme System**: React Context + CSS custom properties
- **Routing**: Path-based (`/{hashedId}`) with query param fallback (`?game={id}`)
- **Error Handling**: Error boundaries at component boundaries
- **API Communication**: Typed API clients in `shared/api/`

---

## Routing System

### URL Patterns

1. **Path-based (Primary)**: `/{hashedId}`
   - Example: `/a1b2c3d4e5f6g7h8`
   - Loads game directly from path

2. **Query Parameter (Legacy)**: `?game={hashedId}`
   - Example: `/?game=a1b2c3d4e5f6g7h8`
   - Backward compatibility for old links
   - Automatically converted to path-based on load

3. **Start Screen**: `/` (no game identifier)
   - Shows start screen with leaderboard preview

### Implementation

- **No routing library**: Uses `window.location` and `history.replaceState`
- **URL cleanup**: Query params removed after loading, path normalized
- **Error handling**: Invalid game IDs show error message but allow new game

---

## Game Type System

### Types

- **`random`**: New games generated from curated articles
  - Default for new games
  - Legacy entries without `gameType` treated as `random`
- **`repeat`**: Games loaded from shareable links or replayed from leaderboard
  - Set when loading existing game state
  - Used for leaderboard filtering

### Implementation

- **Frontend**: `gameType` set in `useGameState` based on game source
- **Backend**: Stored in leaderboard entries, used for filtering
- **Migration**: Legacy entries default to `random` if missing

---

## Data Flow

### Game Creation Flow

```
User clicks "Start Game"
  ↓
Frontend: useGameState.startNewGame()
  ↓
Load curatedArticles.json
  ↓
Generate 26-article bingo set
  ↓
Initialize game state (gameType: 'random')
  ↓
User plays game
```

### Shareable Game Flow

```
User clicks "Create Shareable Game"
  ↓
Frontend: POST /api/games { bingopediaGame: [...] }
  ↓
Backend: Generate 16-char hashedId, store in DB
  ↓
Frontend: Update URL to /{hashedId}
  ↓
User shares link
  ↓
Recipient loads /{hashedId}
  ↓
Frontend: GET /api/games/{hashedId}
  ↓
Backend: Return game state
  ↓
Frontend: Load game (gameType: 'repeat')
```

### Score Submission Flow

```
User wins game
  ↓
Frontend: WinModal collects username
  ↓
Frontend: POST /api/leaderboard { username, score, time, clicks, ... }
  ↓
Backend: Validate, insert into leaderboard collection
  ↓
Backend: If gameId provided, increment timesPlayed in games collection
  ↓
Frontend: Show success, update leaderboard display
```

---

## Key Technologies

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool & dev server
- **CSS Custom Properties**: Theme system

### Backend
- **Node.js**: Runtime
- **Express**: Local dev server
- **Vercel Serverless**: Production API
- **MongoDB Node.js Driver**: Database client

### Infrastructure
- **Vercel**: Hosting & serverless functions
- **MongoDB Atlas**: Database hosting
- **Wikipedia API**: External data source

---

## Security Considerations

- **Input Validation**: All API inputs validated and sanitized
- **Username Sanitization**: Usernames filtered for inappropriate content
- **CORS**: Configured for public API access
- **Error Messages**: Generic error messages to prevent information leakage
- **Connection Security**: MongoDB connections use TLS/SSL

---

## Performance Optimizations

- **MongoDB Connection Caching**: Connections reused across requests
- **Indexed Queries**: All queries use indexed fields
- **Timer State Separation**: Timer display isolated from game state to prevent re-renders
- **API Response Caching**: Leaderboard responses marked as no-cache (dynamic data)
- **Static Asset Caching**: Frontend assets cached via Vercel CDN

---

## Development Workflow

1. **Local Development**:
   - Start Express dev server: `npm run dev:server`
   - Start Vite dev server: `cd app && npm run dev`
   - Both connect to same MongoDB Atlas instance

2. **Testing**:
   - Unit tests: `npm test` (Vitest)
   - Integration tests: API endpoint tests
   - Manual testing: Local dev servers

3. **Deployment**:
   - Push to main branch triggers Vercel deployment
   - Vercel builds frontend and deploys serverless functions
   - Environment variables configured in Vercel dashboard

---

## Future Considerations

- **React Router**: Could migrate to React Router if routing needs grow
- **State Management**: Could add Redux/Zustand if state complexity increases
- **Caching**: Could add Redis for frequently accessed data
- **Analytics**: Expand logging collection for more detailed analytics
- **Authentication**: Could add user accounts if needed

