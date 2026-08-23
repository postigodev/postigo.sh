import { eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { portfolioLocation } from '../db/schema';

const CURRENT_LOCATION_ID = 'current';

export interface LocationSnapshot {
  city: string;
  region: string | null;
  country: string;
  timezone: string;
}

export interface StoredLocation extends LocationSnapshot {
  updatedAt: Date;
}

export interface LocationRepository {
  getLatest(): Promise<StoredLocation | null>;
  upsert(snapshot: LocationSnapshot, updatedAt: Date): Promise<void>;
}

export interface LocationDependencies {
  getRepository(): Promise<LocationRepository>;
  now(): Date;
  logger: Pick<Console, 'error'>;
}

function decodedHeader(headers: Headers, name: string): string | null {
  const raw = headers.get(name)?.trim();
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded &&
      !['null', 'undefined', 'unknown'].includes(decoded.toLowerCase())
      ? decoded
      : null;
  } catch {
    return null;
  }
}

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function parseVercelLocation(headers: Headers): LocationSnapshot | null {
  const city = decodedHeader(headers, 'x-vercel-ip-city');
  const country = decodedHeader(headers, 'x-vercel-ip-country');
  const timezone = decodedHeader(headers, 'x-vercel-ip-timezone');

  if (
    !city ||
    !country ||
    !/^[a-z]{2}$/i.test(country) ||
    !timezone ||
    !isIanaTimezone(timezone)
  ) {
    return null;
  }

  return {
    city,
    region: decodedHeader(headers, 'x-vercel-ip-country-region'),
    country: country.toUpperCase(),
    timezone,
  };
}

function firstOrNull<T>(rows: T[]): T | null {
  return rows[0] ?? null;
}

export function createDrizzleLocationRepository(
  database: Database,
): LocationRepository {
  return {
    async getLatest() {
      const row = firstOrNull(
        await database
          .select({
            city: portfolioLocation.city,
            region: portfolioLocation.region,
            country: portfolioLocation.country,
            timezone: portfolioLocation.timezone,
            updatedAt: portfolioLocation.updatedAt,
          })
          .from(portfolioLocation)
          .where(eq(portfolioLocation.id, CURRENT_LOCATION_ID))
          .limit(1),
      );
      return row ?? null;
    },

    async upsert(snapshot, updatedAt) {
      await database
        .insert(portfolioLocation)
        .values({ id: CURRENT_LOCATION_ID, ...snapshot, updatedAt })
        .onConflictDoUpdate({
          target: portfolioLocation.id,
          set: { ...snapshot, updatedAt },
        });
    },
  };
}

async function productionRepository(): Promise<LocationRepository> {
  const { getDatabase } = await import('../db/client');
  return createDrizzleLocationRepository(await getDatabase());
}

const productionDependencies: LocationDependencies = {
  getRepository: productionRepository,
  now: () => new Date(),
  logger: console,
};

export async function captureAdminLocation(
  headers: Headers,
  dependencies: LocationDependencies = productionDependencies,
): Promise<boolean> {
  const snapshot = parseVercelLocation(headers);
  if (!snapshot) return false;

  await (await dependencies.getRepository()).upsert(
    snapshot,
    dependencies.now(),
  );
  return true;
}

export async function getLatestLocationOrFallback(
  dependencies: LocationDependencies = productionDependencies,
): Promise<StoredLocation | null> {
  try {
    return await (await dependencies.getRepository()).getLatest();
  } catch (cause) {
    dependencies.logger.error('Unable to load the latest portfolio location.', {
      cause,
    });
    return null;
  }
}
