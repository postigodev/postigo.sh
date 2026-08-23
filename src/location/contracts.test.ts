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
  });

  it('uses the approved copy and omits temperature and geolocation APIs', () => {
    const component = read('../components/LocationBox.astro');

    expect(component).toContain('currently posting from');
    expect(component).toContain('data-timezone={location.timezone}');
    expect(component).toContain("Intl.DateTimeFormat('en-US'");
    expect(component).not.toContain('location-temp');
    expect(component).not.toContain('navigator.geolocation');
    expect(component).not.toContain('fetch(');
  });
});
