# Bingopedia Quick Reference

Essential information for working on this project. For detailed specs, see archived docs in `docs/archive/`.

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + MongoDB Atlas (Vercel serverless functions)
- **Deployment**: Vercel

---

## Key Environment Variables

**Backend (server-side only):**
- `MONGODB_USERNAME` - MongoDB Atlas username
- `MONGODB_PASSWORD` - MongoDB Atlas password  
- `MONGODB_CLUSTER` - Cluster hostname (e.g., `cluster0.rvkwijm.mongodb.net`)

**Frontend (optional):**
- `VITE_API_URL` - API base URL (defaults to same-origin `/api/leaderboard`)

**Local dev:**
- `PORT` - Express server port (default: 3001)

Create `.env.local` in repo root with these variables.

---

## Project Structure

```
app/                    # Frontend React app
  src/
    features/            # Feature modules (game, article-viewer, leaderboard)
    shared/              # Shared utilities (api, data, wiki)
api/                     # Vercel serverless functions
  leaderboard.ts         # Leaderboard API endpoint
server/                  # Local Express dev server (optional)
core-assets/             # Preserved data/assets (masterArticleList.txt, scripts, etc.)
Bingopedia/              # Old codebase (reference-only)
docs/archive/            # Archived documentation
```

---

## Key Commands

```bash
# Frontend dev (requires backend to be running for leaderboard)
cd app && npm run dev

# Backend dev (local Express) - run this first
npm run dev:server

# To run both for local development:
# Terminal 1: npm run dev:server
# Terminal 2: cd app && npm run dev

# Build
cd app && npm run build

# Tests
npm test
```

---

## MongoDB

- **Database**: `bingopedia`
- **Collection**: `leaderboard`
- **Index**: `{ score: -1 }` (required)

---

## API Endpoints

- `GET /api/leaderboard` - Paginated leaderboard (query params: `limit`, `page`, `sortBy`, `sortOrder`)
- `POST /api/leaderboard` - Submit score (body: `username`, `score`, `time`, `clicks`, `bingoSquares[]`, `history[]`)

---

## Critical Data Files

- `core-assets/data/masterArticleList.txt` - Source of truth for articles (~37k articles)
- `core-assets/categoryGroups.json` - Group constraints (e.g., max 1 occupation per game)
- `app/public/curatedArticles.json` - Generated JSON used by app (regenerate via scripts if needed)

---

## For More Details

- **Architecture details**: `docs/archive/ARCHITECTURE_OVERVIEW.md`
- **Full config guide**: `docs/archive/ENVIRONMENT_AND_CONFIG.md`
- **API documentation**: `docs/archive/API_LEADERBOARD.md`
- **Backend setup**: `docs/archive/README-backend.md`

