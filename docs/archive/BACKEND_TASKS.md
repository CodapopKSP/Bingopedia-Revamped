### 11.1 Backend Engineer Checklist

#### Stage 1 – Foundations & Environment

- [x] **Repo & Project Setup**
  - [x] Confirm new app directory structure (e.g. `app/` or `web/`) matches `ARCHITECTURE_OVERVIEW.md` and `REBUILD_EXECUTION_PLAN.md`.
  - [x] Ensure TypeScript, ESLint, Prettier, and testing tooling are configured for backend code areas (`api/`, `server/`).
    - Note: TypeScript and Vitest are configured. ESLint/Prettier can be added later if needed.
- [x] **Environment & Config**
  - [x] Implement a backend config module (e.g. `api/config.ts` or similar) that:
    - [x] Reads `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`, `PORT` from environment variables.
    - [x] Validates required env vars at startup and throws clear, non-secret-leaking errors if missing.
  - [x] Verify local `.env.local` layout conforms to `ENVIRONMENT_AND_CONFIG.md`.
- [x] **Documentation**
  - [x] Update `ENVIRONMENT_AND_CONFIG.md` to reference the actual backend config module/file names and any implementation-specific notes.
  - [x] Add short in-code docs (docstrings/comments) in the config module explaining:
    - [x] Where env vars are defined.
    - [x] How to rotate/change credentials safely.
  - [x] Add a "Backend Setup" subsection to the main `README` (or a backend-specific README) that covers:
    - [x] How to run the local API server (e.g. `npm run dev:server`).
    - [x] Required env vars and a pointer back to `ENVIRONMENT_AND_CONFIG.md`.

#### Stage 2 – Leaderboard API Core

- [x] **Vercel Serverless API**
  - [x] Implement `/api/leaderboard` as a TypeScript handler that:
    - [x] Reuses a cached MongoDB client connection across invocations.
    - [x] Uses the schema described in `ARCHITECTURE_OVERVIEW.md` (`username`, `score`, `time`, `clicks`, `bingoSquares`, `history`, `createdAt`).
    - [x] Ensures an index on `{ score: -1 }` is present (create if missing).
  - [x] Implement `GET /api/leaderboard`:
    - [x] Supports `limit`, `page`, `sortBy`, `sortOrder`.
    - [x] Returns `users`, `pagination`, and `sort` metadata consistent with the existing product.
  - [x] Implement `POST /api/leaderboard`:
    - [x] Validates `username` and `score` as required fields.
    - [x] Accepts `time`, `clicks`, `bingoSquares`, `history`.
    - [x] Sets `createdAt` server-side.
    - [x] Implements tie-breaking so that for equal scores, earlier `createdAt` ranks higher.
- [x] **Local Express Server (Optional but Recommended)**
  - [x] Implement `server/index.ts` that:
    - [x] Reuses the same MongoDB connection/config logic as the Vercel function.
    - [x] Exposes `GET` and `POST` endpoints identical in behavior and contract to `/api/leaderboard`.
  - [x] Wire local dev so the frontend can target either:
    - [x] Local Express (`VITE_API_URL=http://localhost:<PORT>`), or
    - [x] Vercel dev server (same-origin `/api/leaderboard`).
- [x] **Validation & Safety**
  - [x] Enforce maximum username length and basic character rules on the server.
  - [x] Implement light bad-word masking:
    - [x] Obfuscate or mask detected words.
    - [x] Avoid rejecting otherwise valid submissions.
  - [x] Add sanity checks to filter obviously bogus payloads (e.g. negative or impossible `time`, `clicks`, `score`).
- [x] **Documentation**
  - [x] Document leaderboard API contracts in `ARCHITECTURE_OVERVIEW.md` or a dedicated `API_LEADERBOARD.md`:
    - [x] Request/response shapes for `GET` and `POST`.
    - [x] Error response format and common failure modes (missing env vars, DB connection issues).
  - [x] Provide at least one concrete example (e.g. `curl` or HTTP snippet) for each endpoint in the docs.

#### Stage 3 – Backend Testing, Ops, and Deployment

- [x] **Automated Testing**
  - [x] Add unit tests for:
    - [x] Env config validation (missing/invalid variables).
    - [x] Score calculation and tie-breaking.
    - [x] Username validation and bad-word masking.
  - [x] Add integration/API tests for `/api/leaderboard` using a test database or collection.
- [x] **Operations & Monitoring**
  - [x] Define manual health checks (document in `ENVIRONMENT_AND_CONFIG.md` or a small ops section):
    - [x] Simple `/api/leaderboard` ping.
    - [x] Basic DB connectivity sanity check.
    - [x] Sample Wikipedia connectivity test (if backend ever needs it).
  - [x] Verify logging does not leak secrets, full URIs, or sensitive payloads.
- [x] **Deployment**
  - [x] Confirm `vercel.json` / Vercel project settings reflect:
    - [x] Build command `cd app && npm run build`.
    - [x] Output directory `app/dist`.
    - [x] Rewrites for SPA routing and `/api/leaderboard`.
  - [ ] Smoke-test `/api/leaderboard` in Vercel dev/prod environments.
    - Note: Requires actual Vercel deployment to complete.
- [x] **Documentation**
  - [x] Update `ENVIRONMENT_AND_CONFIG.md` and `ARCHITECTURE_OVERVIEW.md` with final backend implementation details and any deviations from earlier assumptions.
  - [x] Add a short "Backend Troubleshooting" subsection to the main README (or backend README) that covers:
    - [x] Typical connection errors.
    - [x] How to verify env vars.
    - [x] Where to look in logs.