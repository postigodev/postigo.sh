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

  it('orders location, time, vertical weather, and SVG moon phase', () => {
    const component = read('../components/LocationBox.astro');
    expect(component.indexOf('class="location-place"')).toBeLessThan(component.indexOf('class="location-status"'));
    expect(component.indexOf('class="location-status"')).toBeLessThan(component.indexOf('class="location-weather"'));
    expect(component.indexOf('class="location-weather"')).toBeLessThan(component.indexOf('class="location-moon"'));
    expect(component).toContain('class="weather-copy"');
    expect(component).toContain('flex-direction: column');
    expect(component).toContain('moon-phase-icon--${moon.variant}');
    expect(component).not.toContain('◐');
    expect(component).not.toContain('☾');
    expect(component).toContain('/images/weather/spark-burst-static.svg');
    expect(component).toContain('/images/weather/pixel-rain-static.svg');
  });

  it('ships local animated effects, static fallbacks, and moon assets', () => {
    for (const asset of ['pixel-rain', 'spark-burst']) {
      expect(read(`../../public/images/weather/${asset}.svg`)).toContain('@keyframes');
      expect(read(`../../public/images/weather/${asset}-static.svg`)).not.toContain('@keyframes');
    }
    for (const asset of ['moon-thin', 'moon-thick', 'moon-full']) {
      expect(read(`../../public/images/weather/${asset}.svg`)).toContain('<svg');
    }
  });

  it('links the visible credits route from the homepage footer', () => {
    const surface = read('../components/HomeSurface.astro');
    const credits = read('../pages/credits.astro');

    expect(surface).toContain('href="/credits"');
    expect(credits).toContain('https://pxlkit.xyz');
    expect(credits).toContain('https://api.met.no');
  });
});
