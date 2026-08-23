import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');

describe('homepage location boundaries', () => {
  it('keeps location loading server-owned and optional', () => {
    const homepage = read('../pages/index.astro');
    const surface = read('../components/HomeSurface.astro');

    expect(homepage).toContain('getLatestLocationOrFallback()');
    expect(homepage).toContain('latestLocation={latestLocation}');
    expect(surface).toContain('latestLocation = null');
    expect(surface).toContain('{latestLocation && <LocationBox');
    expect(surface).not.toContain('id="updates-mini"');
    expect(surface.indexOf('{latestLocation && <LocationBox')).toBeGreaterThan(
      surface.indexOf('id="album"'),
    );
    expect(surface.indexOf('{latestLocation && <LocationBox')).toBeLessThan(
      surface.indexOf('id="media-box"'),
    );
  });

  it('renders server-owned weather without browser geolocation or fetch', () => {
    const component = read('../components/LocationBox.astro');
    const weather = read('./weather.ts');

    expect(component).toContain('currently posting from');
    expect(component).toContain('data-timezone={location.timezone}');
    expect(component).toContain("Intl.DateTimeFormat('en-US'");
    expect(weather).toContain("const WEATHER_ROOT = '/images/weather'");
    expect(component).toContain('prefers-reduced-motion');
    expect(component).toContain('location-weather');
    expect(component).not.toContain('navigator.geolocation');
    expect(component).not.toContain('fetch(');
  });

  it('links the visible credits route from the homepage footer', () => {
    const surface = read('../components/HomeSurface.astro');
    const credits = read('../pages/credits.astro');

    expect(surface).toContain('href="/credits"');
    expect(credits).toContain('https://pxlkit.xyz');
    expect(credits).toContain('https://api.met.no');
  });
});
