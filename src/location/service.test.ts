import { drizzle } from 'drizzle-orm/neon-http';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../db/client';
import * as schema from '../db/schema';
import {
  captureAdminLocation,
  createDrizzleLocationRepository,
  getLatestLocationOrFallback,
  parseVercelLocation,
  type LocationDependencies,
  type LocationRepository,
  type StoredLocation,
} from './service';

function locationHeaders(overrides: Record<string, string> = {}) {
  return new Headers({
    'x-vercel-ip-city': 'Galesburg',
    'x-vercel-ip-country-region': 'IL',
    'x-vercel-ip-country': 'US',
    'x-vercel-ip-timezone': 'America/Chicago',
    ...overrides,
  });
}

function dependencies(repository: LocationRepository): LocationDependencies {
  return {
    getRepository: vi.fn(async () => repository),
    now: () => new Date('2026-08-22T12:00:00.000Z'),
    logger: { error: vi.fn() },
  };
}

describe('Vercel location headers', () => {
  it('decodes a coarse location and normalizes the country code', () => {
    expect(
      parseVercelLocation(
        locationHeaders({
          'x-vercel-ip-city': 'San%20Jos%C3%A9',
          'x-vercel-ip-country': 'cr',
        }),
      ),
    ).toEqual({
      city: 'San José',
      region: 'IL',
      country: 'CR',
      timezone: 'America/Chicago',
    });
  });

  it.each([
    ['missing city', { 'x-vercel-ip-city': '' }],
    ['missing country', { 'x-vercel-ip-country': '' }],
    ['missing timezone', { 'x-vercel-ip-timezone': '' }],
    ['invalid timezone', { 'x-vercel-ip-timezone': 'Local/Development' }],
    ['malformed city', { 'x-vercel-ip-city': '%E0%A4%A' }],
  ])('rejects %s without fabricating a replacement', (_, overrides) => {
    expect(parseVercelLocation(locationHeaders(overrides))).toBeNull();
  });
});

describe('location persistence', () => {
  it('does not access the database when geo headers are unavailable', async () => {
    const repository: LocationRepository = {
      getLatest: vi.fn(),
      upsert: vi.fn(),
    };
    const deps = dependencies(repository);

    await expect(captureAdminLocation(new Headers(), deps)).resolves.toBe(false);
    expect(deps.getRepository).not.toHaveBeenCalled();
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('upserts one current snapshot with the supplied timestamp', async () => {
    const repository: LocationRepository = {
      getLatest: vi.fn(),
      upsert: vi.fn(async () => undefined),
    };
    const deps = dependencies(repository);

    await expect(captureAdminLocation(locationHeaders(), deps)).resolves.toBe(true);
    expect(repository.upsert).toHaveBeenCalledWith(
      {
        city: 'Galesburg',
        region: 'IL',
        country: 'US',
        timezone: 'America/Chicago',
      },
      new Date('2026-08-22T12:00:00.000Z'),
    );
  });

  it('returns null when public location storage is unavailable', async () => {
    const logger = { error: vi.fn() };
    const deps: LocationDependencies = {
      ...dependencies({ getLatest: vi.fn(), upsert: vi.fn() }),
      getRepository: vi.fn(async () => {
        throw new Error('database unavailable');
      }),
      logger,
    };

    await expect(getLatestLocationOrFallback(deps)).resolves.toBeNull();
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('uses a fixed conflict key so repeated writes cannot create history', async () => {
    const queries: Array<{ sql: string; params: unknown[] }> = [];
    const client = async (sql: string, params: unknown[]) => {
      queries.push({ sql, params });
      return { rows: [] };
    };
    const database = drizzle(client as never, { schema }) as Database;
    const repository = createDrizzleLocationRepository(database);

    await repository.upsert(
      {
        city: 'Galesburg',
        region: 'IL',
        country: 'US',
        timezone: 'America/Chicago',
      },
      new Date('2026-08-22T12:00:00.000Z'),
    );

    expect(queries).toHaveLength(1);
    expect(queries[0]?.sql).toContain('on conflict ("id") do update');
    expect(queries[0]?.params).toContain('current');
  });

  it('returns the stored snapshot unchanged', async () => {
    const stored: StoredLocation = {
      city: 'Galesburg',
      region: 'IL',
      country: 'US',
      timezone: 'America/Chicago',
      updatedAt: new Date('2026-08-22T12:00:00.000Z'),
    };
    const deps = dependencies({
      getLatest: vi.fn(async () => stored),
      upsert: vi.fn(),
    });

    await expect(getLatestLocationOrFallback(deps)).resolves.toBe(stored);
  });
});
