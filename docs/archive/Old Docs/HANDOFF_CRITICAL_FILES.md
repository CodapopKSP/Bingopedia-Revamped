# Bingopedia - Critical Files Inventory

## Document Purpose
This document lists all files that **MUST** be preserved and migrated to the new project. These files contain critical data, assets, or configurations that cannot be easily regenerated or recreated.

**⚠️ WARNING**: Loss of these files will result in significant data loss or require extensive rework.

**Note**: While the existing codebase is available for reference, you should rebuild the application from scratch. Only the files listed here need to be preserved - the rest of the codebase is for reference only.

---

## 1. Data Files (CRITICAL - Highest Priority)

### 1.1 Article Data Files

#### `data/masterArticleList.txt`
- **Purpose**: Master list of all Wikipedia articles organized by category
- **Size**: ~37,000 articles across 58+ categories
- **Format**: Plain text with category headers and Wikipedia URLs
- **Criticality**: ⚠️ **CRITICAL** - This is the source of truth for all article data
- **Regeneration**: Can be regenerated using `scripts/compileMasterList.js`, but takes 5-10 minutes and requires Wikipedia API access
- **Backup**: `data/masterArticleList.txt.backup` (also preserve)

**Sample Structure:**
```
MASTER LIST OF ALL ARTICLES
================================================================================

List_of_concert_halls
    https://en.wikipedia.org/wiki/Alabama
    https://en.wikipedia.org/wiki/Alaska
    ...
```

### 1.2 Configuration Files

**Note**: `public/curatedArticles.json` is NOT critical - it can be regenerated from `masterArticleList.txt` using `scripts/generateCuratedData.js`.

#### `categoryGroups.json`
- **Purpose**: Defines category groups and their constraints
- **Format**: JSON
- **Criticality**: ⚠️ **CRITICAL** - Required for proper article selection
- **Example**: Defines "occupations" group with max 1 per game
- **Location**: Root directory

**Structure:**
```json
{
  "groups": {
    "occupations": {
      "maxPerGame": 1,
      "categories": ["List_of_artistic_occupations", ...]
    }
  }
}
```

**Note**: `sampleLists.md` is NOT critical - the master list already contains all articles, and new lists can be added manually if needed.

---

## 2. Asset Files (CRITICAL - High Priority)

### 2.1 Animation Assets

#### `public/Confetti.lottie`
- **Purpose**: Confetti animation played when player matches an article
- **Format**: Lottie animation file (.lottie)
- **Criticality**: ⚠️ **CRITICAL** - Custom animation asset, cannot be easily recreated
- **Usage**: Loaded by `Confetti.jsx` component
- **Library**: Requires `@lottiefiles/dotlottie-react` package
- **Behavior**: Full-screen overlay, plays on article match

**Technical Notes:**
- Animation seeks to 200ms to skip initial delay
- Uses DotLottie format (not JSON Lottie)
- Full-screen, non-interactive overlay

### 2.2 Image Assets

#### `public/globe.png`
- **Purpose**: Wikipedia globe icon used in UI (bingo board toggle button)
- **Format**: PNG image
- **Criticality**: ⚠️ **HIGH** - Used in UI, can be replaced but requires design work
- **Usage**: Referenced in `App.jsx` for bingo board toggle button
- **Alternative**: Can use Wikipedia's official globe icon if needed

---

## 3. Script Files (CRITICAL - Must Preserve All)

**⚠️ ALL SCRIPTS MUST BE PRESERVED** - These are essential for data generation and maintenance.

### 3.1 Data Generation Scripts

#### `scripts/compileMasterList.js`
- **Purpose**: Fetches articles from Wikipedia list pages and compiles master list
- **Criticality**: ⚠️ **IMPORTANT** - Needed to regenerate article data
- **Dependencies**: Node.js, Wikipedia API access
- **Usage**: `npm run compile-master-list`
- **Output**: `data/masterArticleList.txt`
- **Runtime**: 5-10 minutes (depends on number of lists)

#### `scripts/generateCuratedData.js`
- **Purpose**: Converts master list text file to JSON format for app
- **Criticality**: ⚠️ **IMPORTANT** - Needed to regenerate curated articles JSON
- **Dependencies**: Node.js
- **Usage**: `npm run generate-curated-data`
- **Input**: `data/masterArticleList.txt`
- **Output**: `public/curatedArticles.json`
- **Runtime**: < 1 second

#### `scripts/extractFromList.js`
- **Purpose**: Utility to extract articles from a single Wikipedia list
- **Criticality**: ⚠️ **USEFUL** - Helpful for testing and adding new lists
- **Usage**: `npm run extract-from-list "List name"`

#### `scripts/resolveRedirects.js`
- **Purpose**: Utility to resolve Wikipedia redirects (if needed for data preprocessing)
- **Criticality**: ⚠️ **USEFUL** - May be needed for data cleanup

### 3.2 Testing/Utility Scripts

#### `scripts/generateBingoSet.js`
- **Purpose**: Test utility to generate a sample bingo set
- **Criticality**: ⚠️ **USEFUL** - Helpful for testing article selection logic
- **Output**: `data/bingoSet.json`

#### `scripts/generateSampleSet.js`
- **Purpose**: Generate sample set with Wikipedia summaries for testing
- **Criticality**: ⚠️ **USEFUL** - Helpful for testing and documentation

---

## 4. Documentation Files

### 4.1 Keep These

#### `PERFORMANCE_OPTIMIZATIONS.md`
- **Purpose**: Documents performance optimizations made to article viewer
- **Criticality**: ⚠️ **USEFUL** - Helps understand performance considerations
- **Content**: Caching strategies, API optimizations
- **Status**: ✅ **KEEP** - Still relevant

### 4.2 Outdated (Do Not Preserve)

**⚠️ NOTE**: The following README files are outdated and should NOT be preserved:
- `WORKFLOW.md` - Outdated
- `scripts/README.md` - Outdated
- `scripts/README-bingo-set.md` - Outdated
- `scripts/README-extract.md` - Outdated
- `README.md` - Outdated

**Reason**: These documents contain outdated information. Refer to the handoff documentation instead.

### 4.2 Handoff Documentation (New)

#### `HANDOFF_PRODUCT_SPEC.md`
- **Purpose**: Complete product specification (this document set)
- **Criticality**: ⚠️ **CRITICAL** - Primary handoff documentation

#### `HANDOFF_CRITICAL_FILES.md` (this file)
- **Purpose**: Inventory of critical files
- **Criticality**: ⚠️ **CRITICAL** - Lists what must be preserved

---

## 5. Configuration Files (IMPORTANT - For Deployment)

### 5.1 Build & Deployment

#### `vercel.json`
- **Purpose**: Vercel deployment configuration
- **Criticality**: ⚠️ **IMPORTANT** - Required for proper API routing
- **Content**: 
  - Build command
  - Output directory
  - API rewrites
  - SPA routing fallback

#### `package.json`
- **Purpose**: Node.js dependencies and scripts
- **Criticality**: ⚠️ **IMPORTANT** - Defines dependencies and build scripts
- **Key Dependencies**:
  - `@lottiefiles/dotlottie-react`: Confetti animation
  - `react`, `react-dom`: UI framework
  - `express`, `mongodb`: Backend (if rebuilding server)
  - `vite`: Build tool

#### `vite.config.js`
- **Purpose**: Vite build configuration
- **Criticality**: ⚠️ **IMPORTANT** - Required for building frontend
- **Note**: May need adjustment for new project structure

---

## 6. Database & API Configuration (CRITICAL - For Backend)

### 6.1 MongoDB Configuration
- **Database Name**: `bingopedia`
- **Collection Name**: `leaderboard`
- **Index**: `score` field (descending)
- **Criticality**: ⚠️ **CRITICAL** - Contains all leaderboard data

**Important**: The same MongoDB collection will be used in the new system. No export/import needed - just preserve the connection credentials.

**Environment Variables Required:**
- `MONGODB_USERNAME`: MongoDB Atlas username
- `MONGODB_PASSWORD`: MongoDB Atlas password  
- `MONGODB_CLUSTER`: Cluster name (e.g., `cluster0.rvkwijm.mongodb.net`)

**Current Credentials Location** (for reference):
- Hardcoded in `server/index.js` (lines 13-15)
- Hardcoded in `api/leaderboard.js` (lines 23-25)
- **Action Required**: Extract these credentials and configure as environment variables in the new implementation. Never commit credentials to version control.

### 6.2 API Endpoints
- **GET** `/api/leaderboard`: Fetch leaderboard entries
- **POST** `/api/leaderboard`: Submit new score
- **Criticality**: ⚠️ **CRITICAL** - Core functionality

**Reference Implementation:**
- `server/index.js`: Express server implementation
- `api/leaderboard.js`: Vercel serverless function implementation

---

## 7. File Priority Summary

### 🔴 CRITICAL - Must Preserve (Data Loss Risk)
1. `data/masterArticleList.txt` (+ backup) - Source of all article data
2. `categoryGroups.json` - Group constraints configuration
3. `public/Confetti.lottie` - Confetti animation asset
4. `public/globe.png` - Wikipedia globe icon
5. **ALL scripts in `scripts/` directory** - Essential for data generation
6. MongoDB database (`bingopedia.leaderboard` collection) - User scores

### 🟡 HIGH - Important (Can Regenerate But Saves Time)
1. `PERFORMANCE_OPTIMIZATIONS.md` - Performance notes (still relevant)
2. `vercel.json` - Deployment configuration (reference)
3. `package.json` - Dependencies reference (may need updates)

### ❌ DO NOT PRESERVE (Outdated or Regeneratable)
1. `public/curatedArticles.json` - Can be regenerated from master list
2. `sampleLists.md` - Not needed (master list is source of truth)
3. `WORKFLOW.md` - Outdated
4. `README.md` - Outdated
5. All `scripts/README*.md` files - Outdated

---

## 8. Migration Checklist

### Phase 1: Data & Assets (Do First)
- [ ] Copy `data/masterArticleList.txt` and backup
- [ ] Copy `categoryGroups.json`
- [ ] Copy `public/Confetti.lottie`
- [ ] Copy `public/globe.png`
- [ ] **Preserve MongoDB credentials** (extract from `server/index.js` or `api/leaderboard.js`)
  - Username: `MONGODB_USERNAME`
  - Password: `MONGODB_PASSWORD`
  - Cluster: `MONGODB_CLUSTER`
  - **Note**: Same MongoDB collection will be used - no export needed

### Phase 2: Scripts & Tools (CRITICAL - Copy All)
- [ ] Copy **ALL** files from `scripts/` directory:
  - [ ] `compileMasterList.js`
  - [ ] `generateCuratedData.js`
  - [ ] `extractFromList.js`
  - [ ] `generateBingoSet.js`
  - [ ] `generateSampleSet.js`
  - [ ] `resolveRedirects.js`
  - [ ] `addSamplePlayers.js` (if needed)
  - [ ] `cleanLeaderboard.js` (if needed)
  - [ ] `generateArticleList.js` (if needed)
- [ ] Test scripts in new environment
- [ ] Regenerate `curatedArticles.json` using `generateCuratedData.js`

### Phase 3: Configuration
- [ ] Review `package.json` dependencies
- [ ] Review `vercel.json` configuration
- [ ] Set up MongoDB connection (new credentials)
- [ ] Configure environment variables

### Phase 4: Documentation
- [ ] Copy all documentation files
- [ ] Review `WORKFLOW.md` for data update process
- [ ] Review `PERFORMANCE_OPTIMIZATIONS.md` for performance notes

---

## 9. Data Validation

After migration, validate:

### 9.1 Article Data
- [ ] Regenerate `curatedArticles.json` from `masterArticleList.txt` using `scripts/generateCuratedData.js`
- [ ] `curatedArticles.json` loads without errors
- [ ] Total article count matches (~37,000)
- [ ] Total category count matches (58+)
- [ ] Group definitions are present (from `categoryGroups.json`)
- [ ] Can generate bingo set (26 articles)

### 9.2 Assets
- [ ] Confetti animation plays correctly
- [ ] Globe icon displays correctly
- [ ] All image paths resolve

### 9.3 Database
- [ ] MongoDB credentials configured as environment variables
- [ ] MongoDB connection works (using same `bingopedia.leaderboard` collection)
- [ ] Leaderboard collection accessible
- [ ] Index on `score` field exists (or create it: `db.collection('leaderboard').createIndex({ score: -1 })`)
- [ ] Can read/write leaderboard entries

### 9.4 Scripts
- [ ] `compileMasterList.js` runs successfully
- [ ] `generateCuratedData.js` produces valid JSON
- [ ] Output matches expected format

---

## 10. File Size Estimates

| File | Approximate Size | Notes |
|------|-----------------|-------|
| `masterArticleList.txt` | ~2-3 MB | Text file, ~37k articles |
| `curatedArticles.json` | ~3-5 MB | JSON file (regeneratable) |
| `categoryGroups.json` | < 1 KB | Small config file |
| `Confetti.lottie` | ~100-500 KB | Animation file |
| `globe.png` | ~10-50 KB | Small icon |
| `scripts/` directory | ~50-100 KB | All script files |
| MongoDB collection | Variable | Depends on leaderboard entries |

---

## 11. Regeneration Instructions

### Regenerate `curatedArticles.json` (Required After Migration)
```bash
# Requires masterArticleList.txt and categoryGroups.json
npm run generate-curated-data
# Takes < 1 second
# Output: public/curatedArticles.json
```

**Note**: This should be done immediately after copying `masterArticleList.txt` and `categoryGroups.json` to regenerate the production data file.

### Regenerate `masterArticleList.txt` (Only if Lost)
```bash
# Requires scripts/compileMasterList.js
# Note: You'll need to provide source Wikipedia list URLs
# This takes 5-10 minutes and requires Wikipedia API access
node scripts/compileMasterList.js
```

**Warning**: If `masterArticleList.txt` is lost, you'll need to manually identify Wikipedia list pages to use as sources. The original `sampleLists.md` is not preserved, but you can identify similar lists by searching Wikipedia for "List of" pages.

### Cannot Regenerate (Must Preserve)
- `categoryGroups.json` - Manual configuration required
- `public/Confetti.lottie` - Custom animation asset
- `public/globe.png` - Image asset
- All scripts - Essential tools

---

## 12. Security Notes

### ⚠️ Security Warnings

1. **MongoDB Credentials**: 
   - Currently hardcoded in `server/index.js` and `api/leaderboard.js`
   - **MUST** be moved to environment variables in new implementation
   - Never commit credentials to version control
   - Use `.env` files locally, environment variables in production

2. **API Keys**: 
   - No API keys currently required (Wikipedia APIs are public)
   - If adding new APIs, use environment variables

3. **User Input**: 
   - Username input should be sanitized (max 50 chars, no special chars)
   - MongoDB queries should use parameterized queries (already done)
   - Validate and sanitize all user inputs before database operations

4. **CORS Configuration**:
   - Current implementation allows all origins (`*`)
   - Consider restricting to specific domains in production
   - Review CORS headers in API responses

5. **XSS Prevention**:
   - Wikipedia HTML content should be sanitized before rendering
   - Use React's built-in XSS protection (JSX escapes by default)
   - Be careful with `dangerouslySetInnerHTML` if used

6. **Rate Limiting**:
   - Consider adding rate limiting to leaderboard API
   - Prevent abuse of score submission endpoint
   - Monitor for suspicious patterns

---

## 13. Contact & Support

If questions arise during migration:

1. **Data Format Questions**: Refer to `HANDOFF_PRODUCT_SPEC.md` section 4
2. **Script Usage**: Review script files directly (READMEs are outdated)
3. **API Questions**: Refer to `HANDOFF_PRODUCT_SPEC.md` section 5
4. **Performance**: Refer to `PERFORMANCE_OPTIMIZATIONS.md`
5. **Quick Start**: Refer to `HANDOFF_QUICK_START.md`

---

**End of Critical Files Inventory**

