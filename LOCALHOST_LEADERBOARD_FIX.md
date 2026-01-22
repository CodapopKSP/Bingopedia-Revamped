# Localhost Leaderboard Fix

**Issue**: Leaderboard doesn't work on localhost - shows "Unable to load leaderboard right now"

**Root Cause**: 
- Frontend calls `/api/leaderboard` which works on Vercel (serverless functions handle `/api/*`)
- On localhost, Vite dev server has no backend, so `/api/leaderboard` returns 404
- Local Express server runs separately on port 3001, but frontend doesn't know about it

**Solution**: Configure Vite to proxy `/api/leaderboard` requests to the local Express server

---

## Task: Frontend Engineer

### 1. Add Vite Proxy Configuration

**File**: `app/vite.config.ts`

Add proxy configuration to forward `/api/leaderboard` requests to `http://localhost:3001`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/leaderboard': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

**Why this works**:
- In development, Vite will proxy `/api/leaderboard` requests to `http://localhost:3001/api/leaderboard`
- In production (Vercel), the proxy is ignored and serverless functions handle `/api/*` routes
- No environment variables needed for local development

---

### 2. Update Documentation

**Files to update**:
- `app/README.md` - Add note about running both servers
- `QUICK_REFERENCE.md` - Update local dev instructions

**Add to `app/README.md`**:

```markdown
## Local Development

### Running the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).

**Note**: For the leaderboard to work, you also need to run the backend Express server (see root `README.md`).

### Running Both Frontend and Backend

In separate terminals:

**Terminal 1** (Backend):
```bash
# From repo root
npm run dev:server
```

**Terminal 2** (Frontend):
```bash
# From app directory
cd app && npm run dev
```

The Vite dev server is configured to proxy `/api/leaderboard` requests to the Express server on port 3001.
```

**Update `QUICK_REFERENCE.md`**:

Add a note in the "Key Commands" section:

```markdown
## Key Commands

```bash
# Frontend dev (requires backend to be running for leaderboard)
cd app && npm run dev

# Backend dev (local Express) - run this first
npm run dev:server

# To run both:
# Terminal 1: npm run dev:server
# Terminal 2: cd app && npm run dev
```
```

---

### 3. (Optional) Create Convenience Script

**File**: `package.json` (root)

Add a script to run both servers concurrently (requires `concurrently` package):

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"cd app && npm run dev\" --names \"backend,frontend\" --prefix-colors \"blue,green\"",
    "dev:server": "ts-node-dev --respawn --transpile-only server/index.ts",
    "build": "tsc",
    "test": "vitest"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Then users can run:
```bash
npm run dev  # Runs both frontend and backend
```

**Note**: This is optional - running in separate terminals is fine too.

---

## Testing

After implementing:

1. **Start the backend**:
   ```bash
   npm run dev:server
   ```
   Should see: `Leaderboard API server running at http://localhost:3001`

2. **Start the frontend**:
   ```bash
   cd app && npm run dev
   ```
   Should see: Vite dev server URL (usually `http://localhost:5173`)

3. **Test the leaderboard**:
   - Open the frontend URL in browser
   - Check browser console for errors
   - Leaderboard should load (or show "No scores yet" if empty)
   - Network tab should show requests to `/api/leaderboard` going through

4. **Verify proxy is working**:
   - Check Network tab in DevTools
   - Request to `/api/leaderboard` should show status 200 (or 503 if MongoDB not connected)
   - Should NOT show 404

---

## Why This Solution

**Can it work on both?** ✅ Yes!

- **Localhost**: Vite proxy forwards `/api/leaderboard` → `http://localhost:3001/api/leaderboard`
- **Vercel Production**: Serverless functions handle `/api/leaderboard` directly
- **No code changes needed**: The frontend always calls `/api/leaderboard`, proxy handles the routing

**Alternative (not recommended)**: Setting `VITE_API_URL=http://localhost:3001/api/leaderboard` in `.env.local` would work, but:
- Requires environment variable setup
- Doesn't work seamlessly (needs different config for dev vs prod)
- Proxy is cleaner and more standard

---

## Who Should Do This?

**Frontend Engineer** - This is a frontend build configuration change.

**Estimated Time**: 15-30 minutes

**Priority**: High (blocks local development testing)

---

## Checklist

- [ ] Add proxy configuration to `vite.config.ts`
- [ ] Test that leaderboard loads on localhost
- [ ] Update `app/README.md` with instructions
- [ ] Update `QUICK_REFERENCE.md` with instructions
- [ ] (Optional) Add convenience script for running both servers
- [ ] Verify it still works on Vercel (proxy is dev-only, so it should)

