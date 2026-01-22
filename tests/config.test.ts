import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest';
import { getMongoConfig, getServerPort } from '../api/config';

describe('getMongoConfig', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws when required vars are missing', () => {
    delete process.env.MONGODB_USERNAME;
    delete process.env.MONGODB_PASSWORD;
    delete process.env.MONGODB_CLUSTER;

    expect(() => getMongoConfig()).toThrow(/Missing MongoDB configuration/);
  });

  it('builds a config when vars are present', () => {
    process.env.MONGODB_USERNAME = 'user';
    process.env.MONGODB_PASSWORD = 'pass';
    process.env.MONGODB_CLUSTER = 'cluster.mongodb.net';

    const config = getMongoConfig();

    expect(config.dbName).toBe('bingopedia');
    expect(config.collectionName).toBe('leaderboard');
    expect(config.uri).toContain('user');
    expect(config.uri).toContain('cluster.mongodb.net');
  });
});

describe('getServerPort', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns default port when PORT is not set', () => {
    delete process.env.PORT;
    expect(getServerPort()).toBe(3001);
  });

  it('uses PORT when valid', () => {
    process.env.PORT = '4000';
    expect(getServerPort()).toBe(4000);
  });

  it('throws on invalid PORT', () => {
    process.env.PORT = '-1';
    expect(() => getServerPort()).toThrow(/Invalid PORT/);
  });
});



