# Bingopedia Project Overview

**Last Updated**: Post-Implementation Phase  
**Status**: ✅ Production Ready

---

## What is Bingopedia?

Bingopedia is a web-based game that combines Wikipedia exploration with bingo mechanics. Players navigate from a random starting article to find 5 articles in a row on their 5×5 bingo grid. Every click and every second counts toward the final score.

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + MongoDB Atlas (Vercel serverless functions)
- **Deployment**: Vercel
- **Styling**: CSS Custom Properties (theme system)

---

## Key Features

✅ **Core Gameplay**
- 5×5 bingo grid with curated Wikipedia articles
- Wikipedia article viewer with link navigation
- Real-time timer and click counter
- Win detection (rows, columns, diagonals)

✅ **Leaderboard**
- Global leaderboard with pagination
- Sorting by score, clicks, time, date, username
- Time-based filtering (Today, 7 Days, 30 Days, Year, All Time)
- Game type filtering (Fresh, Linked, All)
- Game details modal with replay capability

✅ **Game Sharing**
- Generate shareable game links
- Replay games from leaderboard
- URL parameter game loading (`?game={gameId}`)

✅ **Theme Support**
- Light and dark mode
- System preference detection
- Persistent theme preference

✅ **Accessibility**
- Keyboard navigation
- ARIA labels
- Screen reader support
- WCAG AA contrast ratios

---

## Project Structure

```
app/                    # Frontend React app
  src/
    features/           # Feature modules (game, article-viewer, leaderboard)
    shared/             # Shared utilities (api, data, wiki, theme)
api/                    # Vercel serverless functions
  leaderboard.ts       # Leaderboard API
  games.ts             # Games API (POST)
  games/[gameId].ts    # Games API (GET)
core-assets/            # Preserved data/assets
  data/                # Master article list
  scripts/             # Data generation scripts
docs/                   # Documentation
  archive/             # Historical/archived docs
  PROJECT_OVERVIEW.md  # This file
  IMPLEMENTATION_SKILLS.md  # Skills learned
```

---

## Quick Start

1. **Environment Setup**: Create `.env.local` with MongoDB credentials
2. **Frontend**: `cd app && npm run dev`
3. **Backend** (local dev): `npm run dev:server`

See `QUICK_REFERENCE.md` for detailed setup instructions.

---

## Key Documentation

- **PRODUCT_PRD.md** - Product requirements and specifications
- **QUICK_REFERENCE.md** - Essential commands, config, and structure
- **docs/IMPLEMENTATION_SKILLS.md** - Technical skills and patterns learned
- **docs/archive/** - Historical documentation and reference

---

## Database Schema

**MongoDB Database**: `bingopedia`

**Collections**:
- `leaderboard` - Game scores and metadata
- `games` - Shareable game states

**Key Indexes**:
- `{ score: -1, createdAt: 1 }` - Leaderboard sorting
- `{ gameType: 1, score: 1, createdAt: 1 }` - Game type filtering
- `{ createdAt: -1 }` - Date filtering
- `{ gameId: 1 }` (unique) - Games collection

---

## API Endpoints

**Leaderboard**:
- `GET /api/leaderboard` - Paginated leaderboard with filtering/sorting
- `POST /api/leaderboard` - Submit score

**Games**:
- `POST /api/games` - Create shareable game
- `GET /api/games/:gameId` - Retrieve game state

---

## Development Status

✅ **Completed Features** (Post-Implementation Phase):
- Timer bug fix (scroll/focus preservation)
- Light mode theme support
- Enhanced leaderboard features
- Game sharing & replay system
- Confetti animation on match
- Leaderboard game type separation

All features have been implemented, tested, and verified. See `docs/archive/implementation-tasks/` for detailed task breakdown.

---

## Future Considerations

- Additional game modes (3×3, 7×7 grids)
- User accounts and personal game history
- Advanced analytics
- Admin UI for data maintenance

---

## Contributing

This is a small side project. For questions or contributions, refer to:
- `PRODUCT_PRD.md` for product requirements
- `docs/IMPLEMENTATION_SKILLS.md` for technical patterns
- `QUICK_REFERENCE.md` for development setup

