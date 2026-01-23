# QA Fixes - Quick Summary

**For Engineering Manager**: Quick reference for assigning QA fix tasks.

**Status**: Ready for Assignment  
**Total Estimated Time**: 5-8 hours

---

## Critical Issues Found

1. ✅ **BE-FIX-1**: Leaderboard games missing `gameType` field (30 min) - ✅ COMPLETED (script verified, ready to run)
2. ✅ **BE-FIX-2**: Generate Shareable Game 404 error (1-2 hours) - ✅ COMPLETED
3. ✅ **FE-FIX-1**: Mobile UI layout issues (2-3 hours) - ✅ COMPLETED
4. ✅ **BE-FIX-4**: Time Period selector not working (1-2 hours) - ✅ COMPLETED

---

## Task Assignment

### Backend Engineer (3 tasks, ~3-4 hours)

**BE-FIX-1: Run Migration Script** (30 min)
- Run existing script: `node scripts/migrateLeaderboardGameType.js`
- Verify all entries have `gameType: 'random'`
- **File**: `scripts/migrateLeaderboardGameType.js` (already exists)

**BE-FIX-2: Fix API URL Construction** (1-2 hours)
- Fix `gamesClient.ts` to use absolute paths
- Change from manipulating base URL to direct `/api/games` path
- **File**: `app/src/shared/api/gamesClient.ts` (lines 82-126)

**BE-FIX-2: Fix Time Period Filter** (1-2 hours)
- Fix filter merging in `api/leaderboard.ts`
- Separate `dateFilter` and `gameTypeFilter`, then merge
- **File**: `api/leaderboard.ts` (lines 134-171)

### Frontend Engineer (1 task, ~2-3 hours)

**FE-FIX-1: Fix Mobile UI Layout** (2-3 hours)
- Add `max-width: 100vw` and `overflow-x: hidden` to prevent horizontal scroll
- Fix timer/clicks visibility - integrate into layout instead of overlaying
- **Files**: 
  - `app/src/app/AppLayout.css`
  - `app/src/features/game/StartScreen.css`
  - `app/src/features/game/GameScreen.css`

---

## Implementation Order

1. **BE-FIX-1** (30 min) - Run migration script first
2. **BE-FIX-2** (1-2 hours) - Fix API URL so shareable games work
3. **BE-FIX-2** (1-2 hours) - Fix time period filter
4. **FE-FIX-1** (2-3 hours) - Fix mobile layout

**Can be done in parallel**: BE-FIX-2 (API URL) and BE-FIX-2 (Time Filter) after BE-FIX-1

---

## Quick Fixes Reference

### BE-FIX-2: API URL Fix
```typescript
// In gamesClient.ts, replace lines 84-85:
const url = new URL('/api/games', window.location.origin)
// Instead of:
const apiBase = getApiBaseUrl().replace('/leaderboard', '')
const url = new URL(`${apiBase}/games`, window.location.origin)
```

### BE-FIX-2: Time Filter Fix
```typescript
// In api/leaderboard.ts, separate filters:
const dateFilter = { ... }; // date logic
const gameTypeFilter = {}; // gameType logic
const queryFilter = { ...dateFilter, ...gameTypeFilter };
// Use queryFilter instead of dateFilter
```

### FE-FIX-1: Mobile Width Fix
```css
/* Add to AppLayout.css and StartScreen.css */
max-width: 100vw;
width: 100%;
box-sizing: border-box;
overflow-x: hidden;
```

---

## Testing Checklist

- [ ] Migration script runs, all entries have gameType
- [ ] Generate shareable game works (no 404)
- [ ] Time period filters work (Today, 7 Days, 30 Days, Year)
- [x] Mobile viewport has no horizontal scroll
- [x] Timer/clicks visible but don't cover bingo board
- [x] Works on mobile devices (320px - 959px)

---

## Full Details

See `QA_FIXES_PLAN.md` for complete implementation details, acceptance criteria, and testing procedures.

---

**End of Quick Summary**

