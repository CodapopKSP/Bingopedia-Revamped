import { describe, expect, it } from 'vitest';
import {
  validateAndSanitizeUsername,
  validateScoreData,
  maskBadWords,
  calculateScore,
} from '../api/validation';

describe('validateAndSanitizeUsername', () => {
  it('accepts valid usernames', () => {
    const result = validateAndSanitizeUsername('Player1');
    expect(result.username).toBe('Player1');
    expect(result.error).toBeUndefined();
  });

  it('trims whitespace', () => {
    const result = validateAndSanitizeUsername('  Player1  ');
    expect(result.username).toBe('Player1');
    expect(result.error).toBeUndefined();
  });

  it('rejects empty usernames', () => {
    const result = validateAndSanitizeUsername('');
    expect(result.error).toBe('Username cannot be empty');
  });

  it('rejects whitespace-only usernames', () => {
    const result = validateAndSanitizeUsername('   ');
    expect(result.error).toBe('Username cannot be empty');
  });

  it('rejects usernames exceeding max length', () => {
    const longUsername = 'a'.repeat(51);
    const result = validateAndSanitizeUsername(longUsername);
    expect(result.error).toBe('Username must be at most 50 characters');
  });

  it('accepts usernames at max length', () => {
    const maxLengthUsername = 'a'.repeat(50);
    const result = validateAndSanitizeUsername(maxLengthUsername);
    expect(result.username).toBe(maxLengthUsername);
    expect(result.error).toBeUndefined();
  });

  it('masks bad words in usernames', () => {
    const result = validateAndSanitizeUsername('PlayerFuck123');
    expect(result.username).toBe('Player****123');
    expect(result.error).toBeUndefined();
  });
});

describe('validateScoreData', () => {
  it('accepts valid score data', () => {
    const result = validateScoreData(1500, 120, 25);
    expect(result.score).toBe(1500);
    expect(result.time).toBe(120);
    expect(result.clicks).toBe(25);
    expect(result.error).toBeUndefined();
  });

  it('defaults time and clicks to 0 if not provided', () => {
    const result = validateScoreData(1500, undefined, undefined);
    expect(result.score).toBe(1500);
    expect(result.time).toBe(0);
    expect(result.clicks).toBe(0);
    expect(result.error).toBeUndefined();
  });

  it('rejects negative scores', () => {
    const result = validateScoreData(-100, 120, 25);
    expect(result.error).toBe('Score must be a non-negative number');
  });

  it('rejects non-finite scores', () => {
    const result = validateScoreData(NaN, 120, 25);
    expect(result.error).toBe('Score must be a non-negative number');
  });

  it('rejects negative time', () => {
    const result = validateScoreData(1500, -10, 25);
    expect(result.error).toBe('Time and clicks must be non-negative');
  });

  it('rejects negative clicks', () => {
    const result = validateScoreData(1500, 120, -5);
    expect(result.error).toBe('Time and clicks must be non-negative');
  });

  it('accepts zero values', () => {
    const result = validateScoreData(0, 0, 0);
    expect(result.score).toBe(0);
    expect(result.time).toBe(0);
    expect(result.clicks).toBe(0);
    expect(result.error).toBeUndefined();
  });
});

describe('maskBadWords', () => {
  it('masks single bad word', () => {
    expect(maskBadWords('fuck')).toBe('****');
    expect(maskBadWords('shit')).toBe('****');
    expect(maskBadWords('bitch')).toBe('*****');
  });

  it('masks bad words case-insensitively', () => {
    expect(maskBadWords('FUCK')).toBe('****');
    expect(maskBadWords('ShIt')).toBe('****');
    expect(maskBadWords('BiTcH')).toBe('*****');
  });

  it('masks bad words within longer strings', () => {
    expect(maskBadWords('PlayerFuck123')).toBe('Player****123');
    expect(maskBadWords('shittyplayer')).toBe('****typlayer');
    expect(maskBadWords('mybitchusername')).toBe('my*****username');
  });

  it('masks multiple occurrences', () => {
    expect(maskBadWords('fuckfuck')).toBe('********');
    expect(maskBadWords('fuck and shit')).toBe('**** and ****');
  });

  it('leaves clean usernames unchanged', () => {
    expect(maskBadWords('Player1')).toBe('Player1');
    expect(maskBadWords('CleanUsername')).toBe('CleanUsername');
    expect(maskBadWords('123456')).toBe('123456');
  });

  it('handles empty strings', () => {
    expect(maskBadWords('')).toBe('');
  });
});

describe('calculateScore', () => {
  it('calculates score as time * clicks', () => {
    expect(calculateScore(120, 25)).toBe(3000);
    expect(calculateScore(60, 10)).toBe(600);
    expect(calculateScore(30, 5)).toBe(150);
  });

  it('handles zero values', () => {
    expect(calculateScore(0, 0)).toBe(0);
    expect(calculateScore(120, 0)).toBe(0);
    expect(calculateScore(0, 25)).toBe(0);
  });

  it('handles decimal values', () => {
    expect(calculateScore(120.5, 25.5)).toBe(3072.75);
  });
});

