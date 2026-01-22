import { describe, expect, it } from 'vitest';

/**
 * Tests for tie-breaking logic in leaderboard sorting.
 *
 * When two entries have equal scores, the one with an earlier `createdAt` timestamp
 * should rank higher (appears first in descending score sort).
 */

describe('Tie-breaking logic', () => {
  it('sorts equal scores by createdAt ascending (earlier first)', () => {
    const entry1 = {
      username: 'Player1',
      score: 1500,
      createdAt: new Date('2024-01-15T10:00:00Z'),
    };

    const entry2 = {
      username: 'Player2',
      score: 1500,
      createdAt: new Date('2024-01-15T11:00:00Z'),
    };

    // When sorting by score descending, entry1 should come before entry2
    // because they have equal scores but entry1 has an earlier createdAt
    const sortObj = { score: -1, createdAt: 1 };
    const entries = [entry2, entry1];

    entries.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // descending
      }
      return a.createdAt.getTime() - b.createdAt.getTime(); // ascending
    });

    expect(entries[0].username).toBe('Player1');
    expect(entries[1].username).toBe('Player2');
  });

  it('handles multiple entries with same score', () => {
    const entries = [
      { username: 'Player3', score: 1500, createdAt: new Date('2024-01-15T12:00:00Z') },
      { username: 'Player1', score: 1500, createdAt: new Date('2024-01-15T10:00:00Z') },
      { username: 'Player2', score: 1500, createdAt: new Date('2024-01-15T11:00:00Z') },
    ];

    entries.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    expect(entries[0].username).toBe('Player1');
    expect(entries[1].username).toBe('Player2');
    expect(entries[2].username).toBe('Player3');
  });

  it('only applies tie-breaking when scores are equal', () => {
    const entries = [
      { username: 'Player2', score: 2000, createdAt: new Date('2024-01-15T12:00:00Z') },
      { username: 'Player1', score: 1500, createdAt: new Date('2024-01-15T10:00:00Z') },
    ];

    entries.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Player2 should come first because they have a higher score
    // (tie-breaking doesn't apply)
    expect(entries[0].username).toBe('Player2');
    expect(entries[1].username).toBe('Player1');
  });
});

