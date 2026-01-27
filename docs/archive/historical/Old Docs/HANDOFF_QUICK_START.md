# Bingopedia - Quick Start Guide for New Team

## Overview
This guide provides a rapid onboarding path for the new development team rebuilding Bingopedia. It assumes you've read the Product Specification and Critical Files Inventory.

**Important**: The existing codebase is available for **reference only**. Rebuild from scratch using these specifications. Reference the existing code to understand behavior, but write fresh code.

---

## 1. Immediate Actions (First Day)

### 1.1 Preserve Critical Data
**⚠️ DO THIS FIRST - Data loss is irreversible**

1. **Export Article Data**:
   ```bash
   # Copy these files immediately:
   - data/masterArticleList.txt
   - data/masterArticleList.txt.backup
   - categoryGroups.json
   ```
   
   **Note**: `curatedArticles.json` will be regenerated from `masterArticleList.txt` after migration.

2. **Export Assets**:
   ```bash
   - public/Confetti.lottie
   - public/globe.png
   ```

3. **Preserve MongoDB Credentials**:
   ```bash
   # Extract credentials from server/index.js or api/leaderboard.js
   # Then configure as environment variables:
   
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_password
   MONGODB_CLUSTER=cluster0.rvkwijm.mongodb.net
   ```
   
   **Note**: The same MongoDB collection (`bingopedia.leaderboard`) will be used in the new system. No export/import needed - just preserve the connection credentials and configure them as environment variables.

### 1.2 Set Up Development Environment

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Key Dependencies**:
   - React 18+
   - Vite
   - @lottiefiles/dotlottie-react (for confetti)
   - express, mongodb (if rebuilding server)

3. **Environment Variables**:
   Create `.env` file with MongoDB credentials (extract from `server/index.js` or `api/leaderboard.js`):
   ```
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_password
   MONGODB_CLUSTER=cluster0.rvkwijm.mongodb.net
   PORT=3001
   ```
   
   **Note**: The same MongoDB collection (`bingopedia.leaderboard`) will be used - no data migration needed, just configure the connection credentials.

---

## 2. Understanding the Core System

### 2.1 Data Flow
```
masterArticleList.txt (source data - ~37k articles)
    ↓
generateCuratedData.js (converts to JSON)
    ↓
curatedArticles.json (app loads this - regenerated)
    ↓
Frontend generates bingo set (26 articles)
```

**Note**: `curatedArticles.json` is regenerated from `masterArticleList.txt` using `scripts/generateCuratedData.js`. The master list is the source of truth.

### 2.2 Game Flow
1. User clicks "Start Game"
2. System selects 26 random categories
3. Picks 1 article from each category
4. First 25 → bingo grid
5. 26th → starting article
6. User navigates Wikipedia by clicking links
7. System matches clicked articles to grid
8. Win when 5-in-a-row found

### 2.3 Critical Algorithms

#### Article Matching (Most Complex)
```javascript
// Pseudocode for matching logic
1. Normalize titles (spaces → underscores)
2. Resolve Wikipedia redirects (cache results)
3. Check direct match
4. Check redirect match (both directions)
5. Mark as matched if found
```

**Key Files to Study:**
- `src/App.jsx` - Main game logic, matching algorithm
- `src/services/curatedArticlesApi.js` - Article selection
- `src/components/ArticleViewer.jsx` - Wikipedia content display

---

## 3. Key Technical Decisions

### 3.1 Why Curated Articles?
- **Performance**: No slow Wikipedia API calls during gameplay
- **Control**: Can filter inappropriate content
- **Consistency**: Same quality articles every game
- **Offline-friendly**: Data pre-loaded

### 3.2 Why Mobile HTML API?
- **Smaller payloads**: 50-70% smaller than desktop
- **Faster loading**: Better user experience
- **Fallback**: Desktop API if mobile fails

### 3.3 Why Client-Side Caching?
- **Performance**: Instant article switching after first view
- **Reduced API calls**: Less load on Wikipedia servers
- **Better UX**: No loading delays for repeat views

### 3.4 Why Group Constraints?
- **Diversity**: Prevents too many similar articles
- **Example**: Max 1 occupation category per game
- **Better gameplay**: More interesting article combinations

---

## 4. Testing the System

### 4.1 Test Article Selection
```bash
# Generate a test bingo set
npm run generate-bingo-set

# Check output
cat data/bingoSet.json
```

**Expected Output:**
- 26 articles
- Each from different category
- Respects group constraints (max 1 occupation)

### 4.2 Test Data Generation
```bash
# Test extracting from single list
npm run extract-from-list "List of animal names"

# Test full compilation (takes 5-10 min)
npm run compile-master-list

# Generate curated data
npm run generate-curated-data
```

### 4.3 Test Article Matching
1. Start a game
2. Click a link in starting article
3. Navigate to an article that's in your grid
4. Verify it gets marked as "found"
5. Verify confetti plays
6. Verify win detection works

---

## 5. Common Issues & Solutions

### 5.1 Articles Not Matching
**Problem**: Clicked article doesn't match grid article even though they're the same

**Solutions**:
- Check redirect resolution (may need to resolve both ways)
- Verify title normalization (spaces vs underscores)
- Check console for redirect cache hits/misses
- Verify both articles resolve to same canonical title

### 5.2 Article Load Failures
**Problem**: Article fails to load (404, deleted, etc.)

**Current Behavior**: Auto-replaces with new random article
- If in grid: Replaces grid cell
- If current article: Replaces current view

**Improvement Opportunity**: Could pre-validate articles during selection

### 5.3 Performance Issues
**Problem**: Slow article loading

**Check**:
- Is caching enabled?
- Are you using mobile API first?
- Check network tab for API response times
- Verify redirect cache is working

### 5.4 Leaderboard Not Working
**Problem**: Can't fetch/submit scores

**Check**:
- MongoDB connection (check environment variables)
- Network access (MongoDB Atlas IP whitelist)
- API endpoint routing (check vercel.json)
- CORS configuration

---

## 6. Architecture Decisions to Consider

### 6.1 Current Architecture
- **Frontend**: React SPA (Vite)
- **Backend**: Express server OR Vercel serverless functions
- **Database**: MongoDB Atlas
- **Deployment**: Vercel

### 6.2 Potential Improvements
1. **TypeScript**: Current codebase is JavaScript
2. **State Management**: Consider Redux/Zustand for complex state
3. **Testing**: Add unit/integration tests
4. **Error Boundaries**: Better error handling
5. **Service Worker**: Offline support
6. **Analytics**: User behavior tracking

---

## 7. Critical Code Sections (For Reference)

**Note**: These sections reference the existing codebase for understanding. **Do not copy this code** - use it as a reference to understand the logic, then implement it fresh.

### 7.1 Article Matching Logic
**Reference Location**: `src/App.jsx` lines ~275-346

**Key Functions to Understand**:
- `normalizeTitle()`: Converts titles to consistent format (spaces → underscores, etc.)
- `resolveRedirect()`: Gets canonical Wikipedia title (handles redirects)
- `handleArticleClick()`: Main matching logic (checks if clicked article matches grid)

**Why Critical**: This is the core game mechanic. Must work perfectly. Study the existing implementation to understand edge cases, then write fresh code.

### 7.2 Article Selection
**Reference Location**: `src/services/curatedArticlesApi.js`

**Key Functions to Understand**:
- `generateBingoSet()`: Selects 26 articles respecting group constraints
- `getRandomArticle()`: Gets single random article (for replacements)
- Group constraint logic: Prevents too many similar categories

**Why Critical**: Determines game difficulty and variety. Reference the existing logic, then implement cleanly.

### 7.3 Win Detection
**Reference Location**: `src/App.jsx` lines ~189-273

**Key Logic to Understand**:
- Checks rows (5 rows)
- Checks columns (5 columns)
- Checks diagonals (2 diagonals)
- Total: 12 possible winning lines

**Why Critical**: Must detect wins accurately and immediately. Study the existing implementation, then write fresh code.

---

## 8. Data Update Process

### 8.1 Adding New Categories
1. Use `scripts/compileMasterList.js` to add articles from new Wikipedia lists
2. Run `npm run generate-curated-data` (updates JSON from master list)
3. Deploy

**Note**: The master list (`masterArticleList.txt`) is the source of truth. To add new categories, you'll need to identify Wikipedia list pages and use the compilation script.

### 8.2 Updating Group Constraints
1. Edit `categoryGroups.json`
2. Run `npm run generate-curated-data` (regenerates JSON with new constraints)
3. Deploy

### 8.3 Removing Categories
1. Edit `masterArticleList.txt` manually or regenerate from source
2. Run `npm run generate-curated-data` (regenerates JSON)
3. Deploy

---

## 9. Deployment Checklist

### 9.1 Pre-Deployment
- [ ] All critical files copied
- [ ] Environment variables set
- [ ] MongoDB connection tested
- [ ] Article data validated
- [ ] Assets (confetti, globe) included

### 9.2 Build
- [ ] Regenerate `curatedArticles.json` from `masterArticleList.txt` using `npm run generate-curated-data`
- [ ] `npm run build` succeeds
- [ ] No build errors/warnings
- [ ] `curatedArticles.json` included in build (should be in `public/` directory)
- [ ] Assets included in build (`Confetti.lottie`, `globe.png`)

### 9.3 Post-Deployment
- [ ] Site loads correctly
- [ ] Can start a game
- [ ] Articles load correctly
- [ ] Matching works
- [ ] Win detection works
- [ ] Leaderboard loads
- [ ] Can submit scores
- [ ] Confetti animation plays

---

## 10. First Week Priorities

### Day 1-2: Setup & Understanding
- [ ] Read all handoff documentation
- [ ] Set up development environment
- [ ] Test data generation scripts
- [ ] Understand article matching logic

### Day 3-4: Core Functionality
- [ ] Implement article selection
- [ ] Implement article matching
- [ ] Implement win detection
- [ ] Test end-to-end game flow

### Day 5: Polish & Deploy
- [ ] Fix any bugs found
- [ ] Test on multiple devices
- [ ] Deploy to staging
- [ ] User acceptance testing

---

## 11. Questions to Answer Early

1. **Technology Stack**: Will you use the same stack (React/Vite) or migrate?
2. **TypeScript**: Will you migrate to TypeScript?
3. **State Management**: Will you add Redux/Zustand?
4. **Testing**: What testing framework will you use?
5. **Deployment**: Will you use Vercel or different platform?
6. **Database**: Will you keep MongoDB or migrate?

---

## 11.5 Suggested Implementation Order

**Phase 1: Foundation (Week 1)**
1. Set up project structure and dependencies
2. Implement article data loading (`curatedArticles.json`)
3. Implement article selection logic (bingo set generation)
4. Create basic bingo grid component (static, no interaction)

**Phase 2: Core Gameplay (Week 2)**
1. Implement Wikipedia article viewer
2. Implement article navigation (clicking links)
3. Implement article matching logic (most complex part)
4. Implement win detection

**Phase 3: Polish (Week 3)**
1. Add confetti animation
2. Implement timer and click counter
3. Add article history panel
4. Implement win modal and score submission

**Phase 4: Backend & Deployment (Week 4)**
1. Set up MongoDB connection
2. Implement leaderboard API
3. Add error handling and edge cases
4. Deploy and test

---

## 11.6 Important Edge Cases to Handle

### Wikipedia-Specific Edge Cases
- **Redirects**: Articles can redirect (e.g., "USA" → "United States")
- **Disambiguation pages**: Some titles lead to disambiguation pages
- **Special characters**: Titles may contain quotes, parentheses, colons
- **URL encoding**: Spaces become `%20` or `_` in URLs
- **Case sensitivity**: Wikipedia titles are case-sensitive except for first letter
- **Missing articles**: Articles may be deleted or not exist

### Matching Edge Cases
- **Both directions**: Grid article → clicked article AND clicked article → grid article
- **Normalization**: "New York" vs "New_York" vs "New%20York" must all match
- **Redirect chains**: Some articles redirect through multiple steps
- **Cache invalidation**: Redirect cache must handle edge cases

### Game State Edge Cases
- **Multiple wins**: What if player gets multiple winning lines simultaneously?
- **Timer precision**: Timer should pause during article loading
- **History navigation**: What happens if user clicks history item while game is won?
- **Article replacement**: If article fails to load, replacement must not break game state

### Performance Edge Cases
- **Large article lists**: `curatedArticles.json` is ~3-5 MB
- **Many redirects**: Some games may trigger many redirect resolutions
- **Cache size**: Article cache grows during gameplay - consider limits
- **Mobile performance**: Test on actual mobile devices, not just responsive view

---

## 11.7 Wikipedia API Considerations

### Rate Limits
- Wikipedia REST API: Generally permissive, but avoid excessive requests
- Query API: More restrictive - use redirect caching to minimize calls
- **Best Practice**: Cache redirect resolutions aggressively

### CORS
- Wikipedia APIs support CORS with `origin=*` parameter
- Mobile HTML API: `https://en.wikipedia.org/api/rest_v1/page/mobile-html/{title}`
- Query API: Add `&origin=*` to enable CORS

### Error Handling
- **404**: Article doesn't exist - replace with new article
- **429**: Rate limited - implement exponential backoff
- **Network errors**: Retry with fallback (mobile → desktop)
- **Timeout**: Set reasonable timeouts (5-10 seconds)

### API Reliability
- Mobile HTML API is generally more reliable than desktop
- Always have fallback to desktop API
- Consider pre-validating articles during selection (future improvement)

---

## 12. Resources

### Documentation
- `HANDOFF_PRODUCT_SPEC.md` - Complete product specification
- `HANDOFF_CRITICAL_FILES.md` - File inventory
- `HANDOFF_QUICK_START.md` - This guide
- `PERFORMANCE_OPTIMIZATIONS.md` - Performance notes (still relevant)
- `scripts/` directory - Script files (READMEs are outdated, refer to scripts directly)

### Code Reference
- **Existing codebase** - Available in this repository for reference only
- Use to understand behavior, edge cases, and implementation patterns
- **Do not copy-paste** - Write fresh code based on specifications
- Key files to reference:
  - `src/App.jsx` - Main game logic, article matching, win detection
  - `src/services/curatedArticlesApi.js` - Article selection logic
  - `src/components/ArticleViewer.jsx` - Wikipedia content display
  - `src/components/BingoGrid.jsx` - Grid display and interaction
  - `api/leaderboard.js` or `server/index.js` - Backend API reference

### External APIs
- Wikipedia Mobile HTML: `https://en.wikipedia.org/api/rest_v1/page/mobile-html/{title}`
- Wikipedia Desktop HTML: `https://en.wikipedia.org/api/rest_v1/page/html/{title}`
- Wikipedia Query API: `https://en.wikipedia.org/w/api.php?action=query&titles={title}&redirects=1&format=json&origin=*`

### Libraries
- React: https://react.dev
- Vite: https://vitejs.dev
- DotLottie: https://lottiefiles.com/dotlottie-web

---

## 13. Getting Help

### If Stuck on:
- **Data Format**: See `HANDOFF_PRODUCT_SPEC.md` section 4
- **Matching Logic**: See `HANDOFF_PRODUCT_SPEC.md` section 2.1.3
- **API Issues**: See `HANDOFF_PRODUCT_SPEC.md` section 5
- **Scripts**: Review script files directly in `scripts/` directory (READMEs are outdated)
- **Performance**: See `PERFORMANCE_OPTIMIZATIONS.md`

---

## 14. Success Criteria

You'll know the rebuild is successful when:

✅ Games can be started and completed  
✅ Articles match correctly (handles redirects)  
✅ Win detection works (all 12 winning lines)  
✅ Leaderboard displays and accepts submissions  
✅ Confetti animation plays on matches  
✅ Performance is acceptable (< 2s article load)  
✅ Mobile experience is smooth  
✅ No critical bugs in production  

---

---

## 15. Lessons Learned & Common Pitfalls

### Article Matching Gotchas
- **Redirect resolution is bidirectional**: "USA" redirects to "United States", but you also need to check if "United States" matches a grid article that's stored as "USA"
- **Title normalization is critical**: "New York" and "New_York" must match, but normalization must be consistent
- **Cache redirects aggressively**: Each redirect resolution is an API call - cache results to avoid rate limits
- **Test with real Wikipedia articles**: Don't assume titles match - test with actual redirect scenarios

### Performance Gotchas
- **Mobile HTML first**: Always try mobile API first (smaller payloads)
- **Cache article content**: Don't re-fetch articles that were already viewed
- **Lazy load confetti**: Don't load animation until needed
- **Debounce rapid clicks**: Prevent users from clicking links too quickly

### State Management Gotchas
- **Timer pauses during loading**: Timer should pause when article is loading, resume when loaded
- **Game state on article failure**: If article fails to load, don't break game state
- **Win detection timing**: Check for wins AFTER updating matched articles, not before
- **History preservation**: Don't lose article history when replacing failed articles

### Wikipedia API Gotchas
- **URL encoding**: Wikipedia titles with special characters need proper encoding
- **CORS**: Add `origin=*` to Query API calls
- **Error handling**: 404s are common (deleted articles) - handle gracefully
- **Rate limits**: Don't make excessive redirect resolution calls - cache aggressively

### Deployment Gotchas
- **Environment variables**: Don't forget to set MongoDB credentials in production
- **CORS configuration**: Verify CORS headers work in production
- **Build output**: Ensure `curatedArticles.json` is included in build
- **MongoDB IP whitelist**: Add deployment platform IPs to MongoDB Atlas whitelist

---

**Good luck with the rebuild!**

**End of Quick Start Guide**

