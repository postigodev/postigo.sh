import { describe, expect, it } from 'vitest';
import { getDayPeriod, getMoonPresentation } from './celestial';

describe('celestial presentation', () => {
  it('maps all eight lunar phases and local SVG variants', () => {
    const newMoon = Date.UTC(2000, 0, 6, 18, 14);
    const phaseStep = (29.53058867 * 86_400_000) / 8;
    const expected = [
      ['new moon', 'moon-full.svg', 'new'],
      ['waxing crescent', 'moon-thin.svg', 'waxing-crescent'],
      ['first quarter', 'moon-full.svg', 'first-quarter'],
      ['waxing gibbous', 'moon-thick.svg', 'waxing-gibbous'],
      ['full moon', 'moon-full.svg', 'full'],
      ['waning gibbous', 'moon-thick.svg', 'waning-gibbous'],
      ['last quarter', 'moon-full.svg', 'last-quarter'],
      ['waning crescent', 'moon-thin.svg', 'waning-crescent'],
    ];

    expected.forEach(([label, filename, variant], index) => {
      expect(getMoonPresentation(new Date(newMoon + phaseStep * index))).toEqual({
        label,
        iconPath: `/images/weather/${filename}`,
        variant,
      });
    });
  });

  it.each([
    ['2026-08-23T10:59:00Z', 'America/Chicago', 'night'],
    ['2026-08-23T11:00:00Z', 'America/Chicago', 'day'],
    ['2026-08-23T22:59:00Z', 'America/Chicago', 'day'],
    ['2026-08-23T23:00:00Z', 'America/Chicago', 'night'],
    ['2026-08-23T05:00:00Z', 'UTC', 'night'],
    ['2026-08-23T12:00:00Z', 'UTC', 'day'],
  ])('classifies %s in %s as %s', (iso, timeZone, expected) => {
    expect(getDayPeriod(new Date(iso), timeZone)).toBe(expected);
  });
});
