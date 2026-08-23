import { eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { portfolioLocation } from '../db/schema';
import { fetchMetWeather, type WeatherCache } from './weather';

const CURRENT_LOCATION_ID = 'current';

export interface LocationSnapshot {
  city: string;
  region: string | null;
  country: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
}

export interface StoredLocation extends LocationSnapshot {
  updatedAt: Date;
  weather: WeatherCache | null;
}

export interface LocationRepository {
  getLatest(): Promise<StoredLocation | null>;
  upsert(snapshot: LocationSnapshot, updatedAt: Date, clearWeather: boolean): Promise<void>;
  updateWeather(weather: WeatherCache): Promise<void>;
}

export interface LocationDependencies {
  getRepository(): Promise<LocationRepository>;
  now(): Date;
  logger: Pick<Console, 'error'>;
  fetcher?: typeof fetch;
}

function coordinates(headers: Headers): Pick<LocationSnapshot, 'latitude' | 'longitude'> {
  const latitude = Number(decodedHeader(headers, 'x-vercel-ip-latitude'));
  const longitude = Number(decodedHeader(headers, 'x-vercel-ip-longitude'));
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) return { latitude: null, longitude: null };
  return {
    latitude: Math.round(latitude * 10) / 10,
    longitude: Math.round(longitude * 10) / 10,
  };
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
    ...coordinates(headers),
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
            latitude: portfolioLocation.latitude,
            longitude: portfolioLocation.longitude,
            weatherSymbolCode: portfolioLocation.weatherSymbolCode,
            weatherTemperatureC: portfolioLocation.weatherTemperatureC,
            weatherObservedAt: portfolioLocation.weatherObservedAt,
            weatherFetchedAt: portfolioLocation.weatherFetchedAt,
            weatherExpiresAt: portfolioLocation.weatherExpiresAt,
            weatherLastModified: portfolioLocation.weatherLastModified,
            updatedAt: portfolioLocation.updatedAt,
          })
          .from(portfolioLocation)
          .where(eq(portfolioLocation.id, CURRENT_LOCATION_ID))
          .limit(1),
      );
      if (!row) return null;
      const weather =
        row.weatherSymbolCode &&
        row.weatherTemperatureC !== null &&
        row.weatherObservedAt &&
        row.weatherFetchedAt &&
        row.weatherExpiresAt
          ? {
              symbolCode: row.weatherSymbolCode,
              temperatureC: row.weatherTemperatureC,
              observedAt: row.weatherObservedAt,
              fetchedAt: row.weatherFetchedAt,
              expiresAt: row.weatherExpiresAt,
              lastModified: row.weatherLastModified,
            }
          : null;
      return {
        city: row.city,
        region: row.region,
        country: row.country,
        timezone: row.timezone,
        latitude: row.latitude,
        longitude: row.longitude,
        updatedAt: row.updatedAt,
        weather,
      };
    },

    async upsert(snapshot, updatedAt, clearWeather) {
      const cleared = clearWeather
        ? {
            weatherSymbolCode: null,
            weatherTemperatureC: null,
            weatherObservedAt: null,
            weatherFetchedAt: null,
            weatherExpiresAt: null,
            weatherLastModified: null,
          }
        : {};
      await database
        .insert(portfolioLocation)
        .values({ id: CURRENT_LOCATION_ID, ...snapshot, updatedAt })
        .onConflictDoUpdate({
          target: portfolioLocation.id,
          set: { ...snapshot, updatedAt, ...cleared },
        });
    },

    async updateWeather(weather) {
      await database
        .update(portfolioLocation)
        .set({
          weatherSymbolCode: weather.symbolCode,
          weatherTemperatureC: weather.temperatureC,
          weatherObservedAt: weather.observedAt,
          weatherFetchedAt: weather.fetchedAt,
          weatherExpiresAt: weather.expiresAt,
          weatherLastModified: weather.lastModified,
        })
        .where(eq(portfolioLocation.id, CURRENT_LOCATION_ID));
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
  const repository = await dependencies.getRepository();
  const current = await repository.getLatest();
  const clearWeather =
    current?.latitude !== snapshot.latitude || current?.longitude !== snapshot.longitude;
  await repository.upsert(snapshot, dependencies.now(), clearWeather);
  return true;
}

export async function getLatestLocationOrFallback(
  dependencies: LocationDependencies = productionDependencies,
): Promise<StoredLocation | null> {
  try {
    const repository = await dependencies.getRepository();
    const location = await repository.getLatest();
    if (!location || location.latitude === null || location.longitude === null) return location;

    const now = dependencies.now();
    if (location.weather && location.weather.expiresAt > now) return location;
    try {
      const result = await fetchMetWeather(
        location.latitude,
        location.longitude,
        location.weather,
        now,
        dependencies.fetcher,
      );
      const weather = result.status === 'updated'
        ? result.weather
        : location.weather && {
            ...location.weather,
            fetchedAt: result.fetchedAt,
            expiresAt: result.expiresAt,
          };
      if (weather) {
        try {
          await repository.updateWeather(weather);
        } catch (cause) {
          dependencies.logger.error('Unable to persist portfolio weather.', { cause });
        }
      }
      return { ...location, weather: weather ?? null };
    } catch (cause) {
      dependencies.logger.error('Unable to refresh portfolio weather.', { cause });
      const usableStale = location.weather &&
        now.getTime() - location.weather.fetchedAt.getTime() <= 2 * 60 * 60_000;
      return { ...location, weather: usableStale ? location.weather : null };
    }
  } catch (cause) {
    dependencies.logger.error('Unable to load the latest portfolio location.', {
      cause,
    });
    return null;
  }
}
