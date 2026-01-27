# Performance Testing Guide

This document outlines how to validate performance for the Bingopedia frontend application.

## Performance Targets

- **First article load**: < 2 seconds from "Start Game" click to first article display (on typical broadband)
- **Cached article loads**: Should be instant (< 100ms)
- **Redirect resolution**: Should only make one API call per unique redirect (cached after first resolution)

## Testing Steps

### 1. First Article Load Performance

1. Open browser DevTools (Network tab)
2. Clear cache and hard reload
3. Click "Start Game"
4. Measure time from click to first article content display
5. **Expected**: < 2 seconds on typical broadband connection

**What to check:**
- Initial `curatedArticles.json` load
- First Wikipedia article fetch (mobile HTML endpoint)
- HTML sanitization and rendering

### 2. Cached Article Load Performance

1. Navigate to a new article (click a link)
2. Navigate to another article
3. Navigate back to the first article (via history or link)
4. **Expected**: Second load should be instant (< 100ms) - served from cache

**What to check:**
- No network request for the cached article
- Article content appears immediately

### 3. Redirect Cache Validation

1. Open DevTools Network tab
2. Navigate to an article that redirects (e.g., "USA" → "United States")
3. Navigate away and back to the same redirect
4. **Expected**: Only one redirect resolution API call should be made

**What to check:**
- Wikipedia Query API calls in Network tab
- Subsequent navigations to the same redirect should not trigger new API calls

### 4. Article Content Cache Validation

1. Navigate to an article
2. Navigate away
3. Navigate back to the same article (via history or link)
4. **Expected**: No Wikipedia API call for the second visit

**What to check:**
- Wikipedia REST API calls in Network tab
- Cached articles should not trigger new fetches

## Performance Monitoring

### Browser DevTools

Use Chrome/Firefox DevTools to monitor:
- **Network tab**: API calls, response times, cache hits
- **Performance tab**: Rendering performance, JavaScript execution time
- **Memory tab**: Memory usage (check for leaks during long sessions)

### Key Metrics to Track

1. **Time to Interactive (TTI)**: When the app becomes fully interactive
2. **First Contentful Paint (FCP)**: When first content appears
3. **Largest Contentful Paint (LCP)**: When main content loads
4. **Total Blocking Time (TBT)**: JavaScript execution blocking time

## Known Performance Optimizations

### Implemented

- ✅ Article content caching (in-memory, per session)
- ✅ Redirect resolution caching (in-memory, per session)
- ✅ Curated articles JSON caching (loaded once per session)
- ✅ HTML sanitization performed client-side (no server round-trip)

### Future Optimizations (Not Implemented)

- Service worker for offline article caching
- Prefetching likely next articles
- Lazy loading of non-critical components
- Code splitting for faster initial load

## Troubleshooting

### Slow First Load

- Check network connection speed
- Verify `curatedArticles.json` is not too large
- Check if Wikipedia API is responding quickly
- Verify no blocking third-party scripts

### Cached Articles Not Loading Fast

- Verify cache is working (check Network tab for cache hits)
- Check browser console for errors
- Ensure cache is not being cleared unexpectedly

### Memory Issues

- Monitor memory usage during long game sessions
- Check for memory leaks (articles not being cleared from cache)
- Consider implementing cache size limits if needed

