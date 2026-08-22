import { describe, expect, it } from 'vitest';
import { relativeGitHubTime } from './GitHubWidget';

describe('relativeGitHubTime', () => {
  const now = Date.parse('2026-08-21T12:00:00Z');

  it.each([
    ['2026-08-21T11:59:45Z', 'now'],
    ['2026-08-21T11:52:00Z', '8m'],
    ['2026-08-21T09:00:00Z', '3h'],
    ['2026-08-19T12:00:00Z', '2d'],
  ])('formats %s as %s', (createdAt, expected) => {
    expect(relativeGitHubTime(createdAt, now)).toBe(expected);
  });
});
