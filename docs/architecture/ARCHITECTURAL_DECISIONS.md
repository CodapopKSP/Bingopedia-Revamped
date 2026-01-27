# Architectural Decisions

**Document Purpose**: This document captures key architectural decisions and technical patterns from the Bingopedia project. These decisions remain relevant as reference material for future development.

**Source**: Extracted from `ARCHITECTURAL_PLAN.md` and `ENGINEERING_PLAN.md`  
**Status**: Active Reference  
**Last Updated**: 2024

---

## State Management Patterns

### Timer State
- **Decision**: Separate display state from game logic state
- **Rationale**: Prevents unnecessary re-renders that cause UI resets
- **Implementation**: Use `useRef` for timer value that doesn't need to trigger re-renders, or separate timer display hook

### Theme State
- **Decision**: React Context with CSS variables
- **Rationale**: 
  - CSS variables provide efficient theme switching without re-renders
  - React Context provides clean API for theme toggle
  - No need for CSS-in-JS library (keeps bundle size small)
  - Maintains separation of concerns (styling vs. logic)

### Game State
- **Decision**: Extend existing `useGameState` hook
- **Pattern**: Custom React hooks for game state management
- **Note**: No Redux/Zustand needed for current scope

---

## Routing

### Path-Based Routing (Primary)
- **Decision**: Use path-based routing (`/{hashedId}`) as primary method
- **Rationale**: 
  - Cleaner URLs for sharing
  - Better SEO (if needed in future)
  - More intuitive user experience
- **Implementation**: `window.location.pathname` parsing, `history.replaceState` for URL updates
- **Fallback**: Query parameter (`?game={hashedId}`) supported for backward compatibility

### Hashed ID System
- **Decision**: Use 16-character URL-safe hashed IDs for shareable games
- **Implementation**: `crypto.randomBytes(12)` with base64url encoding, truncated to 16 characters
- **Collision Handling**: Retry up to 3 times if duplicate key error occurs
- **Alternative Considered**: `nanoid` library (better collision resistance, but adds dependency)
- **Format**: `[A-Za-z0-9_-]{16}` (URL-safe base64url characters)

---

## Database Design

### Game State Storage
- **Decision**: Store full game state in `bingopedia.generated-games` collection
- **Rationale**:
  - Reliable replay capability
  - Shareable links that work independently
  - Better performance (no reconstruction needed)
- **Schema**: `{ link: string, bingopediaGame: string[], createdAt: Date, timesPlayed: number }`
- **Collection Name**: `generated-games` (not `games`)

### Leaderboard Schema
- **Collection**: `leaderboard`
- **Key Fields**: `username`, `score`, `time`, `clicks`, `bingoSquares[]`, `history[]`, `createdAt`
- **Optional Fields**: `bingopediaGame[]`, `gameId` (legacy), `gameType` ('random' | 'repeat')
- **Game Type**: Defaults to 'random' if not provided; legacy entries treated as 'random'

### Migration Strategy
- **Approach**: Add optional fields to leaderboard, default existing entries
- **Pattern**: Idempotent migration scripts (safe to run multiple times)
- **Indexing**: 
  - Primary: `{ score: -1, createdAt: 1 }`
  - Game type filtering: `{ gameType: 1, score: 1, createdAt: 1 }`
  - Date queries: `{ createdAt: -1 }`, `{ createdAt: -1, score: 1 }`
  - Games collection: `{ link: 1 }` (unique), `{ createdAt: -1 }`

### Connection Management
- **Decision**: Cache MongoDB connections across requests
- **Implementation**: Connection health checked with `ping` before reuse
- **Rationale**: Reduces connection overhead in serverless environment
- **Timeout**: 10 second connection and server selection timeouts

---

## Styling Architecture

### Theme System
- **Decision**: CSS custom properties (CSS variables)
- **Rationale**: 
  - Efficient theme switching without re-renders
  - No CSS-in-JS library needed
  - Maintains separation of concerns
- **Implementation**: Theme switching via `data-theme` attribute on root element

### CSS Organization
- **Approach**: Incremental update of CSS files to use theme variables
- **Pattern**: Replace hardcoded colors with CSS variables
- **No CSS-in-JS**: Keep bundle size small, maintain separation of concerns

---

## API Design

### RESTful Pattern
- **Decision**: Follow RESTful conventions with clear endpoint structure
- **Endpoints**: 
  - `GET /api/leaderboard` - Retrieve paginated leaderboard (supports filtering, sorting)
  - `POST /api/leaderboard` - Submit new score
  - `GET /api/games?link={hashedId}` - Retrieve game by link (query param)
  - `POST /api/games` - Create shareable game
  - `GET /api/games/[hashedId]` - Retrieve game by hashed ID (path param)
  - `POST /api/logging` - Log game events (non-blocking)

### Error Handling
- **Pattern**: Structured error responses with error codes
- **Error Codes**: `VALIDATION_ERROR`, `MISSING_FIELD`, `NOT_FOUND`, `DATABASE_ERROR`, `SERVER_ERROR`, `METHOD_NOT_ALLOWED`
- **Status Codes**: 400 (validation), 404 (not found), 405 (method not allowed), 500 (server), 503 (database)
- **CORS**: Configured for all origins (public API)

### API Patterns
- **Validation**: All inputs validated before processing
- **Username Sanitization**: Usernames filtered for inappropriate content
- **Query Parsing**: Robust parsing with defaults and validation
- **Pagination**: Limit and page-based pagination with total count
- **Sorting**: Multi-field sorting with tie-breaking (e.g., score + createdAt)
- **Filtering**: Date range and game type filtering with proper MongoDB queries

---

## Performance Optimizations

### Timer Updates
- **Pattern**: Separate timer display state from game logic state
- **Technique**: Dedicated `useTimerDisplay` hook with debouncing
- **Implementation**: `useRef` for timer value, separate display state
- **Goal**: Prevent UI resets during timer ticks

### Scroll Preservation
- **Pattern**: Use refs to store scroll position
- **Implementation**: Save scroll position before content changes, restore after updates
- **Consideration**: Only restore if article title hasn't changed

### Modal State Isolation
- **Pattern**: Ensure modal state is independent of timer updates
- **Technique**: Use `React.memo` for modal components
- **Goal**: Prevent modals from closing on timer ticks

### Database Connection Caching
- **Pattern**: Cache MongoDB connections across serverless function invocations
- **Implementation**: Module-level cached client with health checks
- **Benefit**: Reduces connection overhead in serverless environment

### Query Optimization
- **Pattern**: All queries use indexed fields
- **Implementation**: Compound indexes for common query patterns
- **Benefit**: Fast leaderboard queries even with large datasets

---

## Testing Strategy

### Unit Tests
- Timer state management
- Theme context and persistence
- Date formatting utilities
- Game state loading/saving

### Integration Tests
- Leaderboard API with filters
- Game API endpoints
- URL parameter parsing
- Game state reconstruction

### E2E Tests
- Full game flow with shareable link
- Replay from leaderboard
- Theme switching
- Timer stability during gameplay

---

## Code Quality Standards

### TypeScript
- **Strict mode**: Enabled
- **Type safety**: All functions typed, no `any` types
- **Interfaces**: Use interfaces for data structures
- **Enums**: Use string literal types for constants

### Error Handling
- **API errors**: Use structured error responses
- **User-facing errors**: Show friendly error messages
- **Logging**: Log errors for debugging
- **Validation**: Validate all inputs

### Performance
- **API calls**: Minimize unnecessary calls
- **Caching**: Use existing caching patterns
- **Rendering**: Avoid unnecessary re-renders
- **Bundle size**: Keep bundle size reasonable

---

## Game Type System

### Terminology
- **Decision**: Use 'random' and 'repeat' instead of 'fresh' and 'linked'
- **Rationale**: More intuitive terminology for users
- **Implementation**: 
  - `random`: New games generated from curated articles (default)
  - `repeat`: Games loaded from shareable links or replayed from leaderboard

### Game Type Assignment
- **New Games**: Automatically set to `random`
- **Shared Games**: Set to `repeat` when loading from hashed ID
- **Replayed Games**: Set to `repeat` when replaying from leaderboard
- **Legacy Entries**: Treated as `random` if `gameType` field missing

### Filtering
- **API Support**: `gameType` query parameter accepts `random`, `repeat`, or `all`
- **Default Behavior**: Legacy entries without `gameType` included in `random` filter
- **Indexing**: Compound index on `{ gameType: 1, score: 1, createdAt: 1 }` for efficient filtering

---

## Logging & Analytics

### Event Logging
- **Decision**: Non-blocking event logging to MongoDB time series collection
- **Implementation**: `POST /api/logging` endpoint
- **Event Types**: `game_started`, `game_generated`, `game_finished`
- **Rationale**: Analytics without impacting user experience
- **Error Handling**: Logging failures don't break main application flow

### Collection Design
- **Collection**: `game_events` (time series collection)
- **Schema**: `{ event, timestamp, gameId?, hashedId?, metadata? }`
- **Note**: Time series collection created via MongoDB shell/admin tools

---

## Deployment Architecture

### Production (Vercel)
- **Frontend**: Static files served from Vercel CDN
- **Backend**: Vercel serverless functions in `/api` directory
- **Routing**: Vercel rewrites configured in `vercel.json`
- **Environment**: Environment variables in Vercel dashboard

### Development
- **Frontend**: Vite dev server (typically `localhost:5173`)
- **Backend**: Express dev server (`server/index.ts`, typically `localhost:3001`)
- **Database**: Same MongoDB Atlas instance (shared with production)
- **Hot Reload**: Both frontend and backend support hot reload

### Dual Server Setup
- **Rationale**: Local Express server mirrors Vercel serverless functions for development
- **Benefit**: Consistent API behavior between dev and production
- **Note**: Both use same MongoDB connection and validation logic

---

## Notes

- These decisions reflect the current implementation as of 2024
- For historical planning context, see documents in `archive/historical/completed-work/planning/`
- These patterns remain relevant for future development and maintenance
- See `SYSTEM_ARCHITECTURE.md` for high-level system overview

