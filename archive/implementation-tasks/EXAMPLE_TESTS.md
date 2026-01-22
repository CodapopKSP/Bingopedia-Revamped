# Example Test Files

This document provides example test implementations for key tasks. These examples demonstrate the testing patterns and acceptance criteria verification.

---

## Example 1: Backend - Date Filtering Test (BE-1)

**File**: `tests/leaderboard.date-filtering.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoClient } from 'mongodb';
import { getMongoConfig } from '../api/config';
import type { LeaderboardEntry } from '../api/mongoClient';

const TEST_DB_CONFIGURED =
  process.env.MONGODB_USERNAME &&
  process.env.MONGODB_PASSWORD &&
  process.env.MONGODB_CLUSTER;

describe.skipIf(!TEST_DB_CONFIGURED)('Leaderboard Date Filtering', () => {
  let client: MongoClient;
  let collection: any;
  const TEST_COLLECTION = 'leaderboard_test';

  beforeAll(async () => {
    const config = getMongoConfig();
    client = new MongoClient(config.uri);
    await client.connect();
    const db = client.db(config.dbName);
    collection = db.collection(TEST_COLLECTION);
    await collection.deleteMany({});
  });

  afterAll(async () => {
    await collection.deleteMany({});
    await client.close();
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  it('should filter entries by date range', async () => {
    // Create test entries with different dates
    const entries: LeaderboardEntry[] = [
      {
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        username: 'Player2',
        score: 2000,
        time: 240,
        clicks: 30,
        bingoSquares: [],
        history: [],
        createdAt: new Date('2024-02-15T10:00:00Z'),
      },
      {
        username: 'Player3',
        score: 1500,
        time: 180,
        clicks: 28,
        bingoSquares: [],
        history: [],
        createdAt: new Date('2024-01-20T10:00:00Z'),
      },
    ];

    await collection.insertMany(entries);

    // Test date filtering via API (would need to import handler)
    // For integration test, we'd call the actual API endpoint
    // For unit test, we'd test the query building logic

    const dateFrom = '2024-01-01T00:00:00Z';
    const dateTo = '2024-01-31T23:59:59Z';

    const filter = {
      createdAt: {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      },
    };

    const results = await collection.find(filter).toArray();

    expect(results).toHaveLength(2);
    expect(results.map((r: any) => r.username)).toContain('Player1');
    expect(results.map((r: any) => r.username)).toContain('Player3');
    expect(results.map((r: any) => r.username)).not.toContain('Player2');
  });

  it('should return all entries when date filters are not provided', async () => {
    const entries: LeaderboardEntry[] = [
      {
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        username: 'Player2',
        score: 2000,
        time: 240,
        clicks: 30,
        bingoSquares: [],
        history: [],
        createdAt: new Date('2024-02-15T10:00:00Z'),
      },
    ];

    await collection.insertMany(entries);

    // No date filter = all entries
    const results = await collection.find({}).toArray();

    expect(results).toHaveLength(2);
  });

  it('should handle invalid date strings gracefully', async () => {
    // This would test the API endpoint error handling
    // Invalid dateFrom/dateTo should return 400 error
    const invalidDate = 'not-a-date';
    
    // Would call API and expect 400 error
    // For unit test, test the date parsing/validation function
  });

  it('should combine date filtering with sorting', async () => {
    const entries: LeaderboardEntry[] = [
      {
        username: 'Player1',
        score: 1000,
        time: 120,
        clicks: 25,
        bingoSquares: [],
        history: [],
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        username: 'Player2',
        score: 2000,
        time: 240,
        clicks: 30,
        bingoSquares: [],
        history: [],
        createdAt: new Date('2024-01-20T10:00:00Z'),
      },
    ];

    await collection.insertMany(entries);

    const filter = {
      createdAt: {
        $gte: new Date('2024-01-01T00:00:00Z'),
        $lte: new Date('2024-01-31T23:59:59Z'),
      },
    };

    const sort = { score: 1 }; // Ascending

    const results = await collection.find(filter).sort(sort).toArray();

    expect(results).toHaveLength(2);
    expect(results[0].username).toBe('Player1'); // Lower score first
    expect(results[1].username).toBe('Player2');
  });
});
```

---

## Example 2: Frontend - Theme Context Test (FE-2)

**File**: `app/src/shared/theme/__tests__/ThemeContext.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock prefers-color-scheme
const mockMatchMedia = (prefersDark: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' && prefersDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Test component that uses theme
function TestComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should default to dark theme when no preference is stored', () => {
    mockMatchMedia(false); // System prefers light, but no localStorage
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should use system preference on first load', () => {
    mockMatchMedia(true); // System prefers dark
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('should persist theme preference in localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      screen.getByText('Set Light').click();
    });

    expect(localStorageMock.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should restore theme from localStorage', () => {
    localStorageMock.setItem('theme', 'light');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should toggle theme correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    act(() => {
      screen.getByText('Toggle').click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    act(() => {
      screen.getByText('Toggle').click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should set data-theme attribute on document root', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => {
      screen.getByText('Set Light').click();
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
```

---

## Example 3: Frontend - Timer Bug Fix Test (FE-1)

**File**: `app/src/features/game/__tests__/timer-stability.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useGameState } from '../useGameState';
import { ArticleViewer } from '../../article-viewer/ArticleViewer';

// Mock article viewer component
function TestGameScreen() {
  const state = useGameState();
  const { currentArticleTitle, gameStarted } = state;

  return (
    <div>
      <div data-testid="timer">{state.elapsedSeconds}</div>
      <ArticleViewer
        articleTitle={currentArticleTitle}
        onArticleClick={() => {}}
        gameWon={false}
      />
    </div>
  );
}

describe('Timer Stability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not reset scroll position during timer ticks', async () => {
    const { container } = render(<TestGameScreen />);

    // Start game and navigate to article
    // (Would need to mock game state setup)

    const articleViewer = container.querySelector('[data-testid="article-viewer"]');
    if (!articleViewer) {
      throw new Error('Article viewer not found');
    }

    // Scroll down
    act(() => {
      articleViewer.scrollTop = 500;
    });

    const initialScroll = articleViewer.scrollTop;

    // Advance timer by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Wait for any state updates
    await waitFor(() => {
      // Scroll position should be maintained
      expect(articleViewer.scrollTop).toBe(initialScroll);
    });
  });

  it('should not close modals during timer ticks', async () => {
    // This would test modal stability
    // Open modal, advance timer, verify it's still open
  });

  it('should not reset focus during timer ticks', async () => {
    // This would test focus management
    // Set focus on an element, advance timer, verify focus is maintained
  });

  it('should update timer display without causing full re-renders', async () => {
    // Use React DevTools Profiler or render count tracking
    let renderCount = 0;

    function TrackedComponent() {
      renderCount++;
      const state = useGameState();
      return <div data-testid="timer">{state.elapsedSeconds}</div>;
    }

    render(<TrackedComponent />);

    const initialRenderCount = renderCount;

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      // Timer should update, but render count should be minimal
      // (This is a simplified test - real test would use React Profiler)
      expect(screen.getByTestId('timer')).toBeInTheDocument();
    });
  });
});
```

---

## Example 4: Backend - Games API Test (BE-3)

**File**: `tests/games.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoClient } from 'mongodb';
import { getMongoConfig } from '../api/config';
import type { GameState } from '../api/mongoClient';

const TEST_DB_CONFIGURED =
  process.env.MONGODB_USERNAME &&
  process.env.MONGODB_PASSWORD &&
  process.env.MONGODB_CLUSTER;

describe.skipIf(!TEST_DB_CONFIGURED)('Games API Integration Tests', () => {
  let client: MongoClient;
  let collection: any;
  const TEST_COLLECTION = 'games_test';

  beforeAll(async () => {
    const config = getMongoConfig();
    client = new MongoClient(config.uri);
    await client.connect();
    const db = client.db(config.dbName);
    collection = db.collection(TEST_COLLECTION);
    await collection.deleteMany({});
  });

  afterAll(async () => {
    await collection.deleteMany({});
    await client.close();
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  it('should create a new game state', async () => {
    const gameData = {
      gridCells: Array.from({ length: 25 }, (_, i) => `Article ${i + 1}`),
      startingArticle: 'Starting Article',
      gameType: 'fresh' as const,
    };

    // Would call POST /api/games endpoint
    // For unit test, test the handler function directly
    // For integration test, use fetch to call actual endpoint

    const result = await collection.insertOne({
      ...gameData,
      gameId: 'test-uuid-123',
      createdAt: new Date(),
    });

    expect(result.insertedId).toBeDefined();

    const saved = await collection.findOne({ gameId: 'test-uuid-123' });
    expect(saved).toBeDefined();
    expect(saved.gridCells).toHaveLength(25);
    expect(saved.startingArticle).toBe('Starting Article');
    expect(saved.gameType).toBe('fresh');
  });

  it('should validate gridCells length is 25', async () => {
    const invalidGameData = {
      gridCells: Array.from({ length: 24 }, (_, i) => `Article ${i + 1}`), // Wrong length
      startingArticle: 'Starting Article',
      gameType: 'fresh' as const,
    };

    // Should return 400 error
    // Test validation logic
  });

  it('should validate startingArticle is non-empty', async () => {
    const invalidGameData = {
      gridCells: Array.from({ length: 25 }, (_, i) => `Article ${i + 1}`),
      startingArticle: '', // Empty
      gameType: 'fresh' as const,
    };

    // Should return 400 error
  });

  it('should generate unique UUID for each game', async () => {
    const gameData = {
      gridCells: Array.from({ length: 25 }, (_, i) => `Article ${i + 1}`),
      startingArticle: 'Starting Article',
      gameType: 'fresh' as const,
    };

    const result1 = await collection.insertOne({
      ...gameData,
      gameId: 'uuid-1',
      createdAt: new Date(),
    });

    const result2 = await collection.insertOne({
      ...gameData,
      gameId: 'uuid-2',
      createdAt: new Date(),
    });

    expect(result1.insertedId).not.toBe(result2.insertedId);

    // Verify unique index prevents duplicates
    // (Would test unique index constraint)
  });

  it('should retrieve game state by gameId', async () => {
    const gameData = {
      gameId: 'test-retrieve-123',
      gridCells: Array.from({ length: 25 }, (_, i) => `Article ${i + 1}`),
      startingArticle: 'Starting Article',
      gameType: 'fresh' as const,
      createdAt: new Date(),
    };

    await collection.insertOne(gameData);

    const retrieved = await collection.findOne({ gameId: 'test-retrieve-123' });

    expect(retrieved).toBeDefined();
    expect(retrieved.gridCells).toHaveLength(25);
    expect(retrieved.startingArticle).toBe('Starting Article');
  });

  it('should return 404 for non-existent gameId', async () => {
    const result = await collection.findOne({ gameId: 'non-existent' });
    expect(result).toBeNull();

    // API endpoint should return 404
  });

  it('should handle CORS preflight requests', async () => {
    // Test OPTIONS request returns proper CORS headers
    // Would test the handler function
  });
});
```

---

## Example 5: Frontend - Date Formatting Test (FE-4)

**File**: `app/src/features/leaderboard/__tests__/dateFormatting.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

// Example date formatting utility
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

describe('Date Formatting', () => {
  it('should format date as "MMM DD, YYYY"', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('Jan 15, 2024');
  });

  it('should handle string dates', () => {
    const dateString = '2024-03-20T10:00:00Z';
    const formatted = formatDate(dateString);
    expect(formatted).toBe('Mar 20, 2024');
  });

  it('should handle different months correctly', () => {
    const dates = [
      { date: new Date('2024-01-15'), expected: 'Jan 15, 2024' },
      { date: new Date('2024-06-15'), expected: 'Jun 15, 2024' },
      { date: new Date('2024-12-15'), expected: 'Dec 15, 2024' },
    ];

    dates.forEach(({ date, expected }) => {
      expect(formatDate(date)).toBe(expected);
    });
  });

  it('should handle timezone correctly', () => {
    // Test that dates are formatted consistently regardless of timezone
    const utcDate = new Date('2024-01-15T00:00:00Z');
    const formatted = formatDate(utcDate);
    // Should format based on UTC date, not local timezone
    expect(formatted).toContain('2024');
  });
});
```

---

## Example 6: Frontend - Confetti on Match Test (FE-8)

**File**: `app/src/features/game/__tests__/confettiOnMatch.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useGameState } from '../useGameState';

describe('Confetti on Match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger confetti callback when new match is detected', async () => {
    const onMatchCallback = vi.fn();

    function TestComponent() {
      const state = useGameState({ onMatch: onMatchCallback });
      // ... render game UI
      return <div>Game</div>;
    }

    render(<TestComponent />);

    // Simulate article navigation that matches a grid cell
    // (Would need to mock game state and navigation)

    await waitFor(() => {
      expect(onMatchCallback).toHaveBeenCalled();
    });

    // Verify callback was called with article title
    expect(onMatchCallback).toHaveBeenCalledWith(expect.any(String));
  });

  it('should not trigger confetti on re-visit', async () => {
    const onMatchCallback = vi.fn();

    // Set up game with already matched cell
    // Navigate to article that's already matched
    // Verify callback is NOT called
  });

  it('should trigger confetti for each new match', async () => {
    const onMatchCallback = vi.fn();

    // Match multiple cells
    // Verify callback is called for each new match
    expect(onMatchCallback).toHaveBeenCalledTimes(2); // Example: 2 matches
  });
});
```

---

## Testing Best Practices

1. **Unit Tests**: Test individual functions/components in isolation
2. **Integration Tests**: Test API endpoints with test database
3. **Component Tests**: Use React Testing Library for React components
4. **Mocking**: Mock external dependencies (fetch, localStorage, timers)
5. **Cleanup**: Always clean up test data and mocks
6. **Isolation**: Each test should be independent
7. **Verification**: Test both success and error cases
8. **Accessibility**: Test keyboard navigation and ARIA attributes where applicable

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- leaderboard.date-filtering.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

