## Bingopedia Revamp – Leaderboard API Documentation

This document describes the leaderboard API endpoints, request/response formats, and error handling.

---

## Base URL

- **Local development**: `http://localhost:3001` (or the port specified in `PORT` env var)
- **Vercel production**: `https://your-domain.vercel.app`

---

## Endpoints

### GET /api/leaderboard

Retrieves a paginated list of leaderboard entries with optional sorting.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | `10` | Number of entries per page (minimum: 1) |
| `page` | number | `1` | Page number (1-indexed, minimum: 1) |
| `sortBy` | string | `score` | Field to sort by: `score`, `clicks`, `time`, `createdAt`, `username` |
| `sortOrder` | string | `desc` | Sort direction: `asc` or `desc` |
| `dateFrom` | string | - | ISO date string for start of date range (e.g., `2024-01-01T00:00:00Z`) |
| `dateTo` | string | - | ISO date string for end of date range (e.g., `2024-01-31T23:59:59Z`) |
| `gameType` | string | `random` | Filter by game type: `random`, `repeat`, or `all` |

#### Response (200 OK)

```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "Player1",
      "score": 1500,
      "time": 120,
      "clicks": 25,
      "bingoSquares": ["Article1", "Article2", "[Found] Article3"],
      "history": ["Starting Article", "Article1", "Article2"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "gameId": "550e8400-e29b-41d4-a716-446655440000",
      "gameType": "random"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 42,
    "totalPages": 5
  },
  "sort": {
    "sortBy": "score",
    "sortOrder": "desc"
  }
}
```

#### Example Requests

**Get top 10 scores:**
```bash
curl http://localhost:3001/api/leaderboard
```

**Get page 2 with 20 entries, sorted by time ascending:**
```bash
curl "http://localhost:3001/api/leaderboard?limit=20&page=2&sortBy=time&sortOrder=asc"
```

**Get entries sorted by clicks:**
```bash
curl "http://localhost:3001/api/leaderboard?sortBy=clicks&sortOrder=desc"
```

**Get entries from January 2024:**
```bash
curl "http://localhost:3001/api/leaderboard?dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z"
```

**Get only repeat games:**
```bash
curl "http://localhost:3001/api/leaderboard?gameType=repeat"
```

**Get all games from past 7 days:**
```bash
curl "http://localhost:3001/api/leaderboard?dateFrom=2024-01-08T00:00:00Z&dateTo=2024-01-15T23:59:59Z&gameType=all"
```

#### Tie-Breaking

When sorting by `score`, entries with equal scores are further sorted by `createdAt` in ascending order (earlier entries rank higher). This ensures consistent ordering.

---

### POST /api/leaderboard

Submits a new leaderboard entry.

#### Request Body

```json
{
  "username": "Player1",
  "score": 1500,
  "time": 120,
  "clicks": 25,
  "bingoSquares": ["Article1", "Article2", "[Found] Article3"],
  "history": ["Starting Article", "Article1", "Article2"]
}
```

#### Required Fields

- `username` (string): Player username (max 50 characters, trimmed)
- `score` (number): Final game score (non-negative)

#### Optional Fields

- `time` (number): Game time in seconds (defaults to 0, must be non-negative)
- `clicks` (number): Number of clicks/navigations (defaults to 0, must be non-negative)
- `bingoSquares` (string[]): Array of grid article titles (defaults to empty array)
- `history` (string[]): Array of visited article titles in order (defaults to empty array)
- `gameId` (string): UUID of the game state (for repeat/replayed games)
- `gameType` (string): Type of game: `random` or `repeat` (defaults to `random`)

#### Response (201 Created)

Returns the inserted entry with the generated `_id`:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "Player1",
  "score": 1500,
  "time": 120,
  "clicks": 25,
  "bingoSquares": ["Article1", "Article2", "[Found] Article3"],
  "history": ["Starting Article", "Article1", "Article2"],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Example Request

```bash
curl -X POST http://localhost:3001/api/leaderboard \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Player1",
    "score": 1500,
    "time": 120,
    "clicks": 25,
    "bingoSquares": ["Article1", "Article2"],
    "history": ["Starting Article", "Article1"]
  }'
```

#### Username Validation

- Maximum length: 50 characters
- Empty or whitespace-only usernames are rejected
- Bad words are automatically masked (e.g., `f***`, `s***`) but submissions are not rejected

---

## Error Responses

All error responses follow a consistent structured format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": "Additional debugging information (only in development mode)"
  }
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data (e.g., invalid score, username too long) | 400 |
| `MISSING_FIELD` | Required field is missing | 400 |
| `INVALID_VALUE` | Field value is invalid | 400 |
| `DATABASE_ERROR` | Database connection or query error | 503 |
| `NETWORK_ERROR` | Network-related error | 500 |
| `SERVER_ERROR` | General server error | 500 |
| `METHOD_NOT_ALLOWED` | HTTP method not supported | 405 |
| `NOT_FOUND` | Resource not found | 404 |

### 400 Bad Request

Invalid request data (missing required fields, invalid types, negative values):

**Missing required fields:**
```json
{
  "error": {
    "code": "MISSING_FIELD",
    "message": "Username and score are required",
    "details": {
      "missingFields": ["username"],
      "missingScore": true
    }
  }
}
```

**Validation error (username too long):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be at most 50 characters",
    "details": {
      "field": "username",
      "value": "very long username that exceeds the limit..."
    }
  }
}
```

**Validation error (invalid score):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Score must be a non-negative number",
    "details": {
      "field": "score",
      "value": -100,
      "time": 120,
      "clicks": 25
    }
  }
}
```

### 405 Method Not Allowed

Request method not supported:

```json
{
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "Method PUT not allowed. Allowed methods: GET, POST, OPTIONS",
    "details": {
      "method": "PUT",
      "allowedMethods": ["GET", "POST", "OPTIONS"]
    }
  }
}
```

### 500 Internal Server Error

General server error:

```json
{
  "error": {
    "code": "SERVER_ERROR",
    "message": "Failed to fetch leaderboard",
    "details": "Detailed error message (only in development mode)"
  }
}
```

### 503 Service Unavailable

Database connection failure:

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Unable to connect to the database. Please try again later.",
    "details": "MongoDB connection timeout (only in development mode)"
  }
}
```

**Note**: The `details` field is only included when `NODE_ENV=development`. In production, only `code` and `message` are returned for security reasons.

---

## Common Failure Modes

### Missing Environment Variables

If MongoDB credentials are not configured, the API will return a 503 error with a message indicating database connection failure. Check:

1. `.env.local` exists (local dev) or Vercel environment variables are set (production)
2. All three variables are present: `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`

### Database Connection Issues

- **Authentication errors**: Verify MongoDB username and password
- **Cluster not found**: Check `MONGODB_CLUSTER` matches your Atlas cluster hostname
- **IP whitelist**: Ensure MongoDB Atlas Network Access allows connections from Vercel IPs or `0.0.0.0/0`

### Network Timeouts

The MongoDB client is configured with:
- `serverSelectionTimeoutMS: 10000` (10 seconds)
- `connectTimeoutMS: 10000` (10 seconds)

If connections consistently timeout, check network connectivity and MongoDB Atlas status.

---

## Games API Endpoints

### POST /api/games

Creates a new game state that can be shared or replayed.

#### Request Body

```json
{
  "gridCells": ["Article1", "Article2", ..., "Article25"],
  "startingArticle": "Starting Article Title",
  "gameType": "random",
  "createdBy": "Player1"
}
```

#### Required Fields

- `gridCells` (string[]): Array of exactly 25 article titles for the bingo grid
- `startingArticle` (string): The starting article title (non-empty)
- `gameType` (string): Type of game: `random` or `repeat`

#### Optional Fields

- `createdBy` (string): Username of the game creator

#### Response (201 Created)

Returns the created game state with generated `gameId`:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "gridCells": ["Article1", "Article2", ..., "Article25"],
  "startingArticle": "Starting Article Title",
  "gameType": "random",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "Player1"
}
```

#### Example Request

```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "gridCells": ["Article1", "Article2", ..., "Article25"],
    "startingArticle": "Starting Article",
    "gameType": "random",
    "createdBy": "Player1"
  }'
```

#### Validation

- `gridCells` must be an array with exactly 25 elements
- `startingArticle` must be a non-empty string
- `gameType` must be either `random` or `repeat`
- Invalid data returns 400 with `VALIDATION_ERROR`

---

### GET /api/games/:gameId

Retrieves a game state by gameId.

#### Path Parameters

- `gameId` (string): UUID v4 of the game to retrieve

#### Response (200 OK)

Returns the game state:

```json
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "gridCells": ["Article1", "Article2", ..., "Article25"],
  "startingArticle": "Starting Article Title",
  "gameType": "random",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "Player1"
}
```

#### Example Request

```bash
curl http://localhost:3001/api/games/550e8400-e29b-41d4-a716-446655440000
```

#### Error Responses

**404 Not Found** - Game not found:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Game not found",
    "details": {
      "gameId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**400 Bad Request** - Invalid gameId format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid gameId format. Expected UUID v4",
    "details": {
      "field": "gameId",
      "value": "invalid-id"
    }
  }
}
```

#### Notes

- `gameId` must be a valid UUID v4 format
- Game states are stored in a separate `games` collection
- Indexes are created on `gameId` (unique) and `createdAt` for performance

---

## CORS

The API allows cross-origin requests from any origin (`Access-Control-Allow-Origin: *`). This is appropriate for a public leaderboard API.

---

## Notes

- The `createdAt` field is automatically set server-side on POST requests
- The API uses a cached MongoDB connection that is reused across requests for performance
- Indexes are automatically created on first connection:
  - `{ score: -1, createdAt: 1 }` - For score sorting with tie-breaking
  - `{ createdAt: -1 }` - For date filtering
  - `{ createdAt: -1, score: 1 }` - For date filtering with score sorting
  - `{ gameType: 1, score: 1, createdAt: 1 }` - For game type filtering
- Bad word masking is minimal and can be extended as needed
- Date filtering uses UTC timezone (store and query in UTC)
- Game type defaults to `random` if not provided in POST request

---

## Sprint 1 Backend Constraints

**Last Updated**: Sprint 1

### No Schema Changes Required

Sprint 1 focuses on frontend/UI improvements and does **not** require any backend schema or API contract changes. The existing `LeaderboardEntry` schema already supports all fields needed by the frontend:

#### Fields Required for Game Details Modal

The `GameDetailsModal` component requires the following fields from leaderboard entries, all of which are already present in the API response:

- **Board Data**: 
  - `bingoSquares` (string[]) - Array of 25 grid cell titles, may include `[Found]` markers
  - `bingopediaGame` (string[], optional) - Alternative format with 26 articles (25 grid + starting article)
  
- **History Data**:
  - `history` (string[]) - Array of visited article titles in order, may include `[Found]` markers
  
- **Statistics**:
  - `username` (string) - Player username
  - `score` (number) - Final game score
  - `time` (number) - Game time in seconds
  - `clicks` (number) - Number of clicks/navigations
  - `createdAt` (Date) - Game completion timestamp
  
- **Replay Support**:
  - `gameId` (string, optional) - UUID for replaying shared games
  - `gameType` (string, optional) - `'random'` or `'repeat'` to distinguish game types

#### API Contract Stability

- **GET /api/leaderboard**: No changes required. Existing response format fully supports game details modal.
- **POST /api/leaderboard**: No changes required. Existing validation and storage logic handles all required fields.
- **GET /api/games/:hashedId**: No changes required. Game retrieval for replay functionality is already implemented.

#### Performance Considerations

The improved UI responsiveness in Sprint 1 (S6 - immediate click feedback) may result in:
- More frequent leaderboard modal open/close cycles
- More frequent game detail requests

The existing API endpoints are designed to handle these patterns:
- Leaderboard queries use indexed fields (`score`, `createdAt`, `gameType`) for efficient filtering
- MongoDB connection pooling and caching minimize overhead
- No rate limiting is currently implemented (acceptable for current scale)

#### Backward Compatibility

All existing leaderboard entries remain compatible:
- Legacy entries without `gameType` are treated as `'random'` games
- Entries with `bingoSquares` (legacy format) are supported alongside `bingopediaGame` (newer format)
- `[Found]` markers in both `bingoSquares` and `history` arrays are preserved and correctly parsed by the frontend

