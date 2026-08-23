import { describe, expect, it, vi } from 'vitest';
import { fetchMetWeather, getWeatherPresentation, type WeatherCache } from './weather';

describe('weather presentation', () => {
  it.each([
    ['clearsky_day', 'clear', '/images/weather/pulsing-sun.svg'],
    ['clearsky_night', 'clear', '/images/weather/clear-night.svg'],
    ['fair_day', 'mostly clear', '/images/weather/cloud-sun.svg'],
    ['partlycloudy_night', 'partly cloudy', '/images/weather/cloudy-night.svg'],
    ['cloudy', 'cloudy', '/images/weather/cloud.svg'],
    ['fog', 'fog', '/images/weather/drifting-fog.svg'],
    ['lightrainshowers_day', 'light rain', '/images/weather/drizzle.svg'],
    ['heavyrain_night', 'rain', '/images/weather/rain-night.svg'],
    ['heavysleet_day', 'sleet', '/images/weather/hail.svg'],
    ['snow_night', 'snow', '/images/weather/snow-night.svg'],
    ['lightssleetshowersandthunder_day', 'thunderstorm', '/images/weather/lightning-strike.svg'],
  ])('maps %s by precedence', (code, condition, iconPath) => {
    expect(getWeatherPresentation(code)).toMatchObject({ condition, iconPath });
  });

  it('omits unknown symbols', () => {
    expect(getWeatherPresentation('sandstorm_day')).toBeNull();
  });
});

describe('MET Norway client', () => {
  const now = new Date('2026-08-23T12:00:00.000Z');

  it('normalizes a current condition and identifies the request', async () => {
    const fetcher = vi.fn(async (_url: URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('user-agent')).toContain('postigo.sh');
      return new Response(JSON.stringify({ properties: { timeseries: [{
        time: '2026-08-23T12:00:00Z',
        data: {
          instant: { details: { air_temperature: 22.6 } },
          next_1_hours: { summary: { symbol_code: 'partlycloudy_day' } },
        },
      }] } }), { status: 200, headers: {
        expires: 'Sun, 23 Aug 2026 12:30:00 GMT',
        'last-modified': 'Sun, 23 Aug 2026 11:55:00 GMT',
      } });
    });

    await expect(fetchMetWeather(40.9, -90.4, null, now, fetcher as typeof fetch)).resolves.toMatchObject({
      status: 'updated',
      weather: { symbolCode: 'partlycloudy_day', temperatureC: 22.6 },
    });
  });

  it('revalidates cached data with If-Modified-Since', async () => {
    const cached: WeatherCache = {
      symbolCode: 'cloudy', temperatureC: 20, observedAt: now, fetchedAt: now,
      expiresAt: now, lastModified: 'Sun, 23 Aug 2026 11:55:00 GMT',
    };
    const fetcher = vi.fn(async (_url: URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('if-modified-since')).toBe(cached.lastModified);
      return new Response(null, { status: 304, headers: { expires: 'Sun, 23 Aug 2026 12:30:00 GMT' } });
    });

    await expect(fetchMetWeather(40.9, -90.4, cached, now, fetcher as typeof fetch)).resolves.toMatchObject({
      status: 'not-modified',
    });
  });

  it('rejects unknown weather payloads', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ properties: { timeseries: [{
      time: now.toISOString(),
      data: { instant: { details: { air_temperature: 20 } }, next_1_hours: { summary: { symbol_code: 'unknown' } } },
    }] } })));
    await expect(fetchMetWeather(40.9, -90.4, null, now, fetcher as typeof fetch)).rejects.toThrow('invalid');
  });
});
