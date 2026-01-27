## Bingopedia Revamp – Backend (Leaderboard API)

This backend provides the leaderboard API for the Bingopedia revamp. It is a fresh TypeScript implementation that replaces the legacy code under `Bingopedia/`, while keeping the old app as reference-only.

### Local Development

- Install dependencies:

```bash
npm install
```

- Create `.env.local` in the repo root (see `ENVIRONMENT_AND_CONFIG.md` for details) with:
  - `MONGODB_USERNAME`
  - `MONGODB_PASSWORD`
  - `MONGODB_CLUSTER`
  - `PORT` (optional, defaults to `3001`)

- Run the local Express API:

```bash
npm run dev:server
```

This starts an Express server exposing:

- `GET /api/leaderboard`
- `POST /api/leaderboard`

The request/response contracts match the Vercel serverless function.

### Vercel Serverless Function

- The production/deployable API lives at `api/leaderboard.ts`.
- Vercel will compile this TypeScript file and expose it at `/api/leaderboard`.
- It uses the same MongoDB config and connection helpers as the local Express server.

### Testing

- Basic tests can be run with:

```bash
npm test
```

Test files live under `tests/` and cover env config validation and core leaderboard behaviors.

### Troubleshooting

#### Typical Connection Errors

- **"Missing MongoDB configuration"**
  - Ensure `.env.local` exists in the repo root with all three required variables: `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER`
  - For Vercel deployments, verify these are set in the project's environment variables settings

- **"MongoDB authentication failed"**
  - Verify your `MONGODB_USERNAME` and `MONGODB_PASSWORD` are correct
  - Check that the MongoDB user has appropriate permissions on the `bingopedia` database
  - Ensure the password doesn't contain special characters that need URL encoding (the code handles this automatically)

- **"MongoDB cluster not found" or "ENOTFOUND"**
  - Verify `MONGODB_CLUSTER` matches your Atlas cluster hostname exactly (e.g., `cluster0.rvkwijm.mongodb.net`)
  - Check your network connection

- **"MongoDB connection blocked" or IP whitelist errors**
  - In MongoDB Atlas, go to Network Access and ensure `0.0.0.0/0` is allowed (or add Vercel's IP ranges)
  - For local development, ensure your IP is whitelisted or use `0.0.0.0/0` for testing

#### How to Verify Environment Variables

**Local development:**
```bash
# Check if .env.local exists and has the required variables
cat .env.local | grep MONGODB
```

**Vercel:**
- Go to your project settings → Environment Variables
- Verify `MONGODB_USERNAME`, `MONGODB_PASSWORD`, and `MONGODB_CLUSTER` are set for the appropriate environments (Production, Preview, Development)

#### Where to Look in Logs

- **Local Express server**: Logs appear in the terminal where you ran `npm run dev:server`
- **Vercel serverless functions**: Check the Vercel dashboard → Functions → View logs
- **MongoDB connection issues**: Look for error messages starting with "MongoDB" or "Database connection failed"
- **API errors**: Check for HTTP status codes and error messages in the response body

Common log patterns:
- `"MongoDB connection successful"` - Connection established
- `"Leaderboard API error:"` - API-level errors (check the error message)
- `"Index creation note:"` - Index already exists (this is normal and safe to ignore)


