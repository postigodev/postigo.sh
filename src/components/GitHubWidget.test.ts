import { describe, expect, it } from 'vitest';
import { relativeGitHubRange, relativeGitHubTime } from './GitHubWidget';

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

describe('relativeGitHubRange', () => {
  const now = Date.parse('2026-08-21T12:00:00Z');

  it('formats grouped activity from newest to oldest', () => {
    expect(relativeGitHubRange('2026-08-21T11:59:45Z', '2026-08-21T07:00:00Z', now)).toBe('now–5h');
  });

  it('keeps grouped ranges visible and leaves ungrouped activity singular', () => {
    expect(relativeGitHubRange('2026-08-21T11:58:30Z', '2026-08-21T11:58:10Z', now)).toBe('1m–1m');
    expect(relativeGitHubRange('2026-08-21T09:00:00Z', undefined, now)).toBe('3h');
  });
});
