## Bingopedia Revamp – Environment & Configuration

This document centralizes all environment variables, secrets handling, and deployment configuration for the rebuild. It is meant to replace ad-hoc comments in code about env vars.

---

## 1. Overview

- **Secrets** (MongoDB credentials) live only in:
  - Local: untracked `.env.local` (or similar) files.
  - Vercel/project env settings.
- **Public config** (safe for client) lives as `VITE_*` variables and in checked-in config files like `vercel.json`.
- The **old hardcoded credentials** present in `Bingopedia/server/index.js` and `Bingopedia/api/leaderboard.js` must be treated as legacy and should not be reused directly.

---

## 2. Environment Variables (Canonical List)

### 2.1 Backend / Database

- **`MONGODB_USERNAME`**
  - Description: MongoDB Atlas database user name.
  - Scope: Server-side only (Vercel functions, local Express server).

- **`MONGODB_PASSWORD`**
  - Description: MongoDB Atlas user password (URL-encoded by the app when constructing the URI).
  - Scope: Server-side only.

- **`MONGODB_CLUSTER`**
  - Description: Atlas cluster hostname, e.g. `cluster0.rvkwijm.mongodb.net`.
  - Scope: Server-side only.

- **`PORT`**
  - Description: Local Express server port for dev (e.g. `3001`).
  - Scope: Local development only; not used by Vercel.

### 2.2 Frontend

- **`VITE_API_URL`**
  - Description: Base URL for the leaderboard API.
  - Examples:
    - Local Express: `http://localhost:3001`.
    - Vercel dev/prod: leave empty to use same-origin `/api/leaderboard`.
  - Scope: Exposed to the client via Vite (safe, points to your own API).

---

## 3. Local Development Setup

### 3.1 Creating Your `.env.local` File

1. **Copy the template**: Start with the `.env.example` file in the repository root:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values**: Edit `.env.local` and replace the placeholder values with your actual MongoDB Atlas credentials.

The `.env.local` file is gitignored and will not be committed to the repository.

### 3.2 Environment Variables Template

The `.env.example` file contains the following template:

```bash
MONGODB_USERNAME=your_atlas_username
MONGODB_PASSWORD=your_atlas_password
MONGODB_CLUSTER=cluster0.rvkwijm.mongodb.net
PORT=3001

# Optional – only if you want to hit a separate local API origin
VITE_API_URL=http://localhost:3001
```

### 3.3 Notes

- The new codebase should **not** include any hardcoded credentials; it should always read from env vars.
- When running a local Express server, it should consume the same `MONGODB_*` variables as the Vercel function.
- The `.env.example` file is committed to the repository as a template; `.env.local` is gitignored.

---

## 4. Vercel Configuration

### 4.1 Vercel Environment Variables

In Vercel’s project settings, configure:

- `MONGODB_USERNAME`
- `MONGODB_PASSWORD`
- `MONGODB_CLUSTER`
- (Optional) `VITE_API_URL` – usually left unset so the frontend uses same-origin `/api/leaderboard`.

These values should mirror the ones currently working for the existing `bingopedia.leaderboard` collection.

### 4.2 `vercel.json` (Conceptual)

The existing `Bingopedia/vercel.json` is conceptually correct and should be mirrored for the new app:

- Build command: `npm run build`.
- Output directory: `dist`.
- Rewrites:
  - `/api/leaderboard` → `/api/leaderboard` (new TS function file).
  - `/(.*)` → `/index.html` for SPA routing.

The exact file will be updated once the new app’s directory structure is created.

---

## 5. MongoDB Atlas Expectations

- **Database**: `bingopedia`.
- **Collection**: `leaderboard`.
- **Indexes**:
  - At minimum, `{ score: -1 }`.
- **Network Access**:
  - Allow Vercel IP ranges or `0.0.0.0/0` (for simplicity, as per the existing implementation’s guidance).

Any new implementation of the leaderboard API should assume the collection is pre-populated and avoid destructive migrations.

---

## 6. Security Practices

- Do **not**:
  - Check `.env*` files into git.
  - Log full MongoDB URIs or passwords.
  - Expose `MONGODB_*` values to the client.
- Do:
  - Keep a single, well-documented env var contract (this file).
  - Use type-safe access patterns in backend code (e.g., validate presence of required env vars on boot). In the current JS app, this is handled by the `getMongoConfig` helper in `Bingopedia/api/config.js`, which validates required variables before constructing the MongoDB URI.
  - Provide clear error messages when env vars are missing or misconfigured, without leaking secrets. The backend config module throws human-readable errors that reference this document instead of echoing secrets or full connection strings.

---

## 7. Backend Config Implementation Notes

- **Config module (new rebuild)**:
  - Location: `api/config.ts`.
  - Responsibilities:
    - Validate `MONGODB_USERNAME`, `MONGODB_PASSWORD`, and `MONGODB_CLUSTER` at startup.
    - Construct the MongoDB connection URI and expose `dbName` and `collectionName` via `getMongoConfig()`.
    - Provide a `getServerPort()` helper for the local Express dev server.
- **Mongo connection helper**:
  - Location: `api/mongoClient.ts`.
  - Responsibilities:
    - Reuse a cached `MongoClient` across calls (both for the Vercel function and local Express server).
    - Ensure the `{ score: -1, createdAt: 1 }` index exists on the `leaderboard` collection (idempotent).
- **Usage**:
  - Vercel serverless function (`api/leaderboard.ts`) calls `getLeaderboardCollection()` to obtain a typed collection handle.
  - Local Express server (`server/index.ts`) shares the same helpers so its behavior and schema match the serverless environment.

---

## 8. Health Checks & Operations

### 8.1 Manual Health Checks

#### Simple API Endpoint Ping

Test that the leaderboard API is responding:

```bash
# Local development
curl http://localhost:3001/api/leaderboard?limit=1

# Production (replace with your domain)
curl https://your-domain.vercel.app/api/leaderboard?limit=1
```

**Expected response**: HTTP 200 with JSON containing `users`, `pagination`, and `sort` fields.

#### Database Connectivity Check

Verify MongoDB connection by checking if the API can read from the database:

```bash
curl http://localhost:3001/api/leaderboard?limit=1
```

If the database is connected, you'll get a successful response (even if the collection is empty, you'll get `users: []`).

If the database connection fails, you'll get:
- HTTP 503 (Service Unavailable)
- Error message: "Database connection failed. Please check server configuration."

#### Sample Wikipedia Connectivity Test

The backend does not directly call Wikipedia APIs (that's handled by the frontend). However, if you need to test Wikipedia connectivity from a backend context:

```bash
curl "https://en.wikipedia.org/api/rest_v1/page/summary/Test"
```

**Expected response**: HTTP 200 with JSON containing article summary.

### 8.2 Automated Health Check Endpoint (Future Enhancement)

Consider adding a dedicated `/api/health` endpoint that returns:
- API status: `ok`
- Database status: `connected` or `disconnected`
- Timestamp

This would be useful for monitoring tools and automated health checks.

### 8.3 Logging & Monitoring

- **Local development**: Check terminal output where `npm run dev:server` is running.
- **Vercel production**: Check Vercel dashboard → Functions → View logs.
- **What to look for**:
  - `"MongoDB connection successful"` - Connection established
  - `"Leaderboard API error:"` - API-level errors
  - `"Index creation note:"` - Index already exists (normal, safe to ignore)

**Security note**: Logs should never contain:
- Full MongoDB URIs (with passwords)
- Sensitive user data
- Complete request payloads (only error messages)

