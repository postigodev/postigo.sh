import { describe, expect, it } from 'vitest';
import { githubActivityWindow, presentGitHubActivity, relativeGitHubTime } from './githubActivityPresentation';

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

describe('presentGitHubActivity', () => {
  const createdAt = '2026-08-21T12:00:00Z';
  const base = { id: '1', target: 'postigodev/postigo.sh', url: 'https://github.com/postigodev/postigo.sh', createdAt };

  it.each([
    ['commit', '20 commits to', '20 commits'],
    ['pull-request', 'merged PR #4 in', 'merged PR #4'],
    ['issue', 'opened issue #2 in', 'opened issue #2'],
    ['comment', 'commented on PR #4 in', 'commented on PR #4'],
    ['review', 'approved PR #4 in', 'approved PR #4'],
    ['release', 'published a release for', 'published a release'],
    ['repository-created', 'created repository', 'created repository'],
    ['repository-public', 'made repository public', 'made repository public'],
    ['fork', 'forked', 'forked'],
    ['star', 'starred', 'postigodev / starred'],
  ] as const)('projects %s activity', (kind, phrase, action) => {
    expect(presentGitHubActivity([{ ...base, kind, phrase }], Date.parse(createdAt))[0]).toMatchObject({ repository: 'postigo.sh', owner: 'postigodev', action, dateLabel: '21 AUG', age: 'now' });
  });

  it('preserves an unexpected normalized phrase and includes detail in its accessible label', () => {
    const [item] = presentGitHubActivity([{ ...base, kind: 'commit', phrase: 'unexpected copy', detail: 'Context' }]);
    expect(item).toMatchObject({ action: 'unexpected copy', accessibleLabel: 'unexpected copy postigodev/postigo.sh: Context' });
  });
});

describe('githubActivityWindow', () => {
  it.each([
    [0, 15, { start: 0, end: 6 }],
    [5, 15, { start: 0, end: 6 }],
    [6, 15, { start: 1, end: 7 }],
    [14, 15, { start: 9, end: 15 }],
    [2, 3, { start: 0, end: 3 }],
  ])('keeps selection %i visible among %i entries', (selected, total, expected) => {
    expect(githubActivityWindow(selected, total)).toEqual(expected);
  });
});
