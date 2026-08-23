export type WeatherCondition =
  | 'clear'
  | 'mostly clear'
  | 'partly cloudy'
  | 'cloudy'
  | 'fog'
  | 'light rain'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'thunderstorm';

export type WeatherMotion = 'native' | 'twinkle' | 'drift' | 'fall' | 'bounce';

export interface WeatherPresentation {
  condition: WeatherCondition;
  iconPath: string;
  reducedMotionIconPath: string;
  motion: WeatherMotion;
}

export interface WeatherCache {
  symbolCode: string;
  temperatureC: number;
  observedAt: Date;
  fetchedAt: Date;
  expiresAt: Date;
  lastModified: string | null;
}

export type WeatherFetchResult =
  | { status: 'updated'; weather: WeatherCache }
  | { status: 'not-modified'; expiresAt: Date; fetchedAt: Date };

const WEATHER_ROOT = '/images/weather';

export function getWeatherPresentation(symbolCode: string): WeatherPresentation | null {
  const night = /_(night|polartwilight)$/.test(symbolCode);
  const code = symbolCode.replace(/_(day|night|polartwilight)$/, '');

  if (code.includes('thunder')) {
    return icon('thunderstorm', 'lightning-strike.svg', 'thunder.svg', 'native');
  }
  if (code.includes('sleet')) return icon('sleet', 'hail.svg', 'hail.svg', 'bounce');
  if (code.includes('snow')) {
    return night
      ? icon('snow', 'snow-night.svg', 'snow-night.svg', 'fall')
      : icon('snow', 'falling-snow.svg', 'snow.svg', 'native');
  }
  if (code.includes('rain')) {
    if (code.startsWith('lightrain')) return icon('light rain', 'drizzle.svg', 'drizzle.svg', 'fall');
    const filename = night ? 'rain-night.svg' : 'rain.svg';
    return icon('rain', filename, filename, 'fall');
  }
  if (code === 'fog') return icon('fog', 'drifting-fog.svg', 'fog.svg', 'native');
  if (code === 'partlycloudy') {
    const filename = night ? 'cloudy-night.svg' : 'cloud-sun.svg';
    return icon('partly cloudy', filename, filename, 'drift');
  }
  if (code === 'fair') {
    const filename = night ? 'cloudy-night.svg' : 'cloud-sun.svg';
    return icon('mostly clear', filename, filename, 'drift');
  }
  if (code === 'cloudy') return icon('cloudy', 'cloud.svg', 'cloud.svg', 'drift');
  if (code === 'clearsky') {
    return night
      ? icon('clear', 'clear-night.svg', 'clear-night.svg', 'twinkle')
      : icon('clear', 'pulsing-sun.svg', 'sun.svg', 'native');
  }
  return null;
}

function icon(
  condition: WeatherCondition,
  filename: string,
  reducedFilename: string,
  motion: WeatherMotion,
): WeatherPresentation {
  return {
    condition,
    iconPath: `${WEATHER_ROOT}/${filename}`,
    reducedMotionIconPath: `${WEATHER_ROOT}/${reducedFilename}`,
    motion,
  };
}

function responseExpiry(response: Response, now: Date): Date {
  const parsed = Date.parse(response.headers.get('expires') ?? '');
  return Number.isFinite(parsed) && parsed > now.getTime()
    ? new Date(parsed)
    : new Date(now.getTime() + 30 * 60_000);
}

export async function fetchMetWeather(
  latitude: number,
  longitude: number,
  cached: WeatherCache | null,
  now: Date,
  fetcher: typeof fetch = fetch,
): Promise<WeatherFetchResult> {
  const url = new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact');
  url.searchParams.set('lat', latitude.toFixed(1));
  url.searchParams.set('lon', longitude.toFixed(1));
  const headers = new Headers({
    accept: 'application/json',
    'user-agent': 'postigo.sh/weather (+https://postigo.sh/contact)',
  });
  if (cached?.lastModified) headers.set('if-modified-since', cached.lastModified);

  const response = await fetcher(url, {
    headers,
    signal: AbortSignal.timeout(2_000),
  });
  if (response.status === 304 && cached) {
    return { status: 'not-modified', expiresAt: responseExpiry(response, now), fetchedAt: now };
  }
  if (!response.ok) throw new Error(`MET Norway returned ${response.status}.`);

  const body = (await response.json()) as {
    properties?: { timeseries?: Array<{
      time?: string;
      data?: {
        instant?: { details?: { air_temperature?: number } };
        next_1_hours?: { summary?: { symbol_code?: string } };
      };
    }> };
  };
  const point = body.properties?.timeseries?.find((entry) => {
    const temperature = entry.data?.instant?.details?.air_temperature;
    return Number.isFinite(temperature) && typeof entry.data?.next_1_hours?.summary?.symbol_code === 'string';
  });
  const temperatureC = point?.data?.instant?.details?.air_temperature;
  const symbolCode = point?.data?.next_1_hours?.summary?.symbol_code;
  const observedAt = new Date(point?.time ?? '');
  if (
    !Number.isFinite(temperatureC) ||
    typeof symbolCode !== 'string' ||
    !getWeatherPresentation(symbolCode) ||
    Number.isNaN(observedAt.getTime())
  ) {
    throw new Error('MET Norway returned an invalid current-weather payload.');
  }

  return {
    status: 'updated',
    weather: {
      symbolCode,
      temperatureC: temperatureC as number,
      observedAt,
      fetchedAt: now,
      expiresAt: responseExpiry(response, now),
      lastModified: response.headers.get('last-modified'),
    },
  };
}
