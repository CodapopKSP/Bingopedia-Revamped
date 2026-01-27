# Incomplete Tasks Analysis

This document lists all unchecked items from `ENGINEERING_CHECKLIST.md`, explains why they're incomplete, and identifies who needs to complete them.

---

## 1. Repository & Project Setup

### ❌ Item 1.13: Ensure `core-assets/` is documented as non-runtime input only
- **Status**: Actually complete (but not checked off)
- **Reason**: `core-assets/README.md` exists and clearly documents that `core-assets/` is for build/setup time only, not runtime. The README states: "At runtime - The running app should **not** read from `core-assets/` directly."
- **Who**: **Engineering Manager** - Just needs to check this off (documentation already exists)

---

## 2. Future Features (Out of Scope for Initial Launch)

### ❌ Item 7.5: Future Social Features Support
- **Status**: Intentionally deferred
- **Reason**: These are explicitly marked as "future" features in the product spec. The current data model stores `bingoSquares` and `history` arrays, which could support replay, but there's no board seed/identifier stored yet. This is a conscious decision to defer until after initial launch.
- **Who**: **Product/Backend Engineer** (future work) - Requires:
  - Decision on board seed/identifier format
  - Schema update to store seed
  - API changes to support sharing/replay
  - Frontend changes to generate/display shareable links

### ❌ Item 8.1 (last bullet): Basic coverage for future-linked concepts
- **Status**: Intentionally deferred
- **Reason**: Related to 7.5 - testing board seed/identifier persistence would require implementing the feature first. Currently no seed is generated or stored.
- **Who**: **Frontend/Backend Engineer** (future work) - Can only be tested once board seed feature is implemented

---

## 3. Manual Testing (QA Required)

### ❌ Item 8.3: Manual Testing
All four sub-items are unchecked:
- Cross-browser checks (Chrome, Firefox, Safari, Edge)
- Mobile device checks (iOS Safari, Chrome Mobile)
- Slow network simulation in DevTools
- Wikipedia outage simulation (forced failures)

- **Status**: Requires manual QA testing
- **Reason**: These require physical device testing and manual verification across different environments. Automated tests can't fully cover browser-specific rendering issues, mobile touch interactions, or real-world network conditions.
- **Who**: **QA Engineer / Frontend Engineer** - Needs:
  - Access to multiple browsers and devices
  - Time to test all main flows on each platform
  - Network throttling setup in DevTools
  - Wikipedia API failure simulation (mock or actual outage)

---

## 4. Analytics Decision (Product/Engineering Decision)

### ❌ Item 9.3: Analytics Approach
- **Status**: Awaiting product decision
- **Reason**: This is a product-level decision about whether to implement analytics now or defer it. The checklist explicitly states "in line with product decisions" - this needs product owner input.
- **Who**: **Product Owner / Engineering Manager** - Needs:
  - Decision: Enable analytics now or defer?
  - If enabled: Choose analytics tool (Google Analytics, Plausible, custom, etc.)
  - If deferred: Document the decision and rationale

### ❌ Item 9.3 (sub-item): If analytics are enabled
- **Status**: Blocked by analytics decision above
- **Reason**: Can't implement analytics events until the decision is made to enable analytics and choose a tool.
- **Who**: **Frontend Engineer** (after product decision) - Would need to:
  - Integrate analytics SDK
  - Add event tracking for: game started, game won, score submitted, future share events

---

## 5. Deployment Tasks (Require Actual Deployment)

### ❌ Item 10.3: Env vars in Vercel settings
- **Status**: Requires Vercel dashboard access
- **Reason**: This requires logging into Vercel and manually configuring environment variables in the project settings. The code is ready, but the deployment platform needs configuration.
- **Who**: **DevOps / Backend Engineer** - Needs:
  - Vercel account access
  - Set `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_CLUSTER` in Vercel project settings
  - Verify variables are set for Production, Preview, and Development environments

### ❌ Item 10.4: Verify a production build
- **Status**: Requires local build test
- **Reason**: This is a simple verification step - just need to run `npm run build` in the `app/` directory and verify it succeeds and includes all assets.
- **Who**: **Frontend Engineer / DevOps** - Quick task:
  ```bash
  cd app
  npm run build
  # Verify dist/ contains curatedArticles.json, Confetti.lottie, globe.png
  ```

### ❌ Item 10.5: After first deploy
- **Status**: Requires actual Vercel deployment
- **Reason**: Can't complete until the app is actually deployed to Vercel. This includes:
  - Smoke-testing all main flows in production
  - Verifying leaderboard entries are being written to MongoDB
- **Who**: **QA Engineer / Frontend Engineer / Backend Engineer** - Needs:
  - Successful Vercel deployment
  - Production URL
  - Time to test: start game, play, win, submit score, check leaderboard
  - MongoDB access to verify entries are being written

---

## Summary by Owner

### Engineering Manager
- ✅ Check off item 1.13 (core-assets documentation - already done)

### Product Owner / Engineering Manager
- ⚠️ Make analytics decision (enable now vs defer)

### DevOps / Backend Engineer
- ⚠️ Configure env vars in Vercel dashboard
- ⚠️ Deploy to Vercel (first time)

### Frontend Engineer
- ⚠️ Verify production build locally (`npm run build`)
- ⚠️ Implement analytics events (if analytics decision is "enable now")

### QA Engineer / Frontend Engineer
- ⚠️ Manual cross-browser testing
- ⚠️ Manual mobile device testing
- ⚠️ Network simulation testing
- ⚠️ Wikipedia outage simulation testing
- ⚠️ Production smoke testing (after deployment)

### Future Work (Post-Launch)
- ⚠️ Future social features (replayable boards, daily challenges)
- ⚠️ Board seed/identifier testing

---

## Priority Recommendations

**Before Launch:**
1. ✅ Check off item 1.13 (documentation exists)
2. ⚠️ Make analytics decision
3. ⚠️ Configure Vercel env vars
4. ⚠️ Verify production build locally
5. ⚠️ Deploy to Vercel
6. ⚠️ Production smoke testing

**Post-Launch (Can Defer):**
- Manual cross-browser/mobile testing (can be done incrementally)
- Future social features
- Analytics implementation (if deferred)

