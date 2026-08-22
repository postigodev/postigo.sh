import { describe, expect, it, vi } from 'vitest';
import { getGitHubActivity, normalizeGitHubEvent } from '../../src/lib/presence/github';

const createdAt = '2026-08-21T12:00:00Z';
const shaBefore = '1'.repeat(40);
const shaHead = '2'.repeat(40);

function event(type: string, payload: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) {
  return { id: `${type}-1`, type, actor: { login: 'postigodev' }, repo: { name: 'postigodev/postigo.sh' }, payload, public: true, created_at: createdAt, ...overrides };
}

function githubResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('normalizeGitHubEvent', () => {
  it('maps normal pushes to compare and zero-SHA pushes to the head commit', () => {
    expect(normalizeGitHubEvent(event('PushEvent', { ref: 'refs/heads/main', before: shaBefore, head: shaHead }))).toMatchObject({
      kind: 'push', phrase: 'pushed to', detail: 'main branch', url: `https://github.com/postigodev/postigo.sh/compare/${shaBefore}...${shaHead}`,
    });
    expect(normalizeGitHubEvent(event('PushEvent', { ref: 'refs/heads/new', before: '0'.repeat(40), head: shaHead }))).toMatchObject({
      url: `https://github.com/postigodev/postigo.sh/commit/${shaHead}`,
    });
  });

  it.each([
    ['PullRequestEvent', { action: 'opened', number: 42, pull_request: { number: 42, title: 'Improve activity log', html_url: 'https://github.com/postigodev/postigo.sh/pull/42' } }, 'pull-request', 'opened PR #42 in'],
    ['PullRequestEvent', { action: 'closed', number: 42, pull_request: { number: 42, merged: true, title: 'Merged work', html_url: 'https://github.com/postigodev/postigo.sh/pull/42' } }, 'pull-request', 'merged PR #42 in'],
    ['IssuesEvent', { action: 'closed', issue: { number: 7, title: 'Fix feed', html_url: 'https://github.com/postigodev/postigo.sh/issues/7' } }, 'issue', 'closed issue #7 in'],
    ['IssueCommentEvent', { action: 'created', issue: { number: 9, title: 'Review this', pull_request: {}, html_url: 'https://github.com/postigodev/postigo.sh/pull/9' }, comment: { html_url: 'https://github.com/postigodev/postigo.sh/pull/9#issuecomment-1' } }, 'comment', 'commented on PR #9 in'],
    ['PullRequestReviewEvent', { action: 'created', pull_request: { number: 10, title: 'Review target', html_url: 'https://github.com/postigodev/postigo.sh/pull/10' }, review: { state: 'approved', html_url: 'https://github.com/postigodev/postigo.sh/pull/10#pullrequestreview-1' } }, 'review', 'approved PR #10 in'],
    ['PullRequestReviewCommentEvent', { action: 'created', pull_request: { number: 11, title: 'Inline note', html_url: 'https://github.com/postigodev/postigo.sh/pull/11' }, comment: { html_url: 'https://github.com/postigodev/postigo.sh/pull/11#discussion_r1' } }, 'comment', 'commented on PR #11 in'],
    ['ReleaseEvent', { action: 'published', release: { tag_name: 'v1.0.0', html_url: 'https://github.com/postigodev/postigo.sh/releases/tag/v1.0.0' } }, 'release', 'published a release for'],
    ['ForkEvent', { forkee: { full_name: 'postigodev/fork', html_url: 'https://github.com/postigodev/fork' } }, 'fork', 'forked'],
    ['WatchEvent', { action: 'started' }, 'star', 'starred'],
    ['CreateEvent', { ref_type: 'repository', description: 'New public tool' }, 'repository-created', 'created repository'],
    ['PublicEvent', {}, 'repository-public', 'made repository public'],
  ] as const)('maps %s to a compact public activity entry', (type, payload, kind, phrase) => {
    expect(normalizeGitHubEvent(event(type, payload))).toMatchObject({ kind, phrase, target: 'postigodev/postigo.sh', createdAt });
  });

  it('ignores unsupported activity, unsafe actors and unsafe event URLs', () => {
    expect(normalizeGitHubEvent(event('DeploymentEvent'))).toBeUndefined();
    expect(normalizeGitHubEvent(event('CreateEvent', { ref_type: 'branch', ref: 'topic' }))).toBeUndefined();
    expect(normalizeGitHubEvent(event('WatchEvent', { action: 'started' }, { actor: { login: 'attacker' } }))).toBeUndefined();
    expect(normalizeGitHubEvent(event('ReleaseEvent', { action: 'published', release: { tag_name: 'v1', html_url: 'https://evil.test/release' } }))).toMatchObject({ url: 'https://github.com/postigodev/postigo.sh/releases' });
  });
});
describe('getGitHubActivity', () => {
  it('uses one 100-event request, filters before grouping and caps renderable groups at 20', async () => {
    const unsupported = Array.from({ length: 30 }, (_, index) => event('DeleteEvent', {}, { id: `unsupported-${index}` }));
    const supported = Array.from({ length: 24 }, (_, index) => event('WatchEvent', { action: 'started' }, {
      id: `supported-${index}`,
      repo: { name: `postigodev/repo-${index}` },
      created_at: `2026-08-${String(21 - Math.floor(index / 10)).padStart(2, '0')}T${String(12 - (index % 10)).padStart(2, '0')}:00:00Z`,
    }));
    const payload = [...unsupported, ...supported];
    const fetchImpl = vi.fn(async () => githubResponse(payload)) as typeof fetch;
    const result = await getGitHubActivity(fetchImpl, 'server-token', 'now');
    expect(result.state).toBe('ready');
    if (result.state !== 'ready') throw new Error('expected ready state');
    expect(result.entries).toHaveLength(20);
    expect(result.entries.every((entry) => entry.id.trim() && entry.phrase.trim() && entry.target.trim())).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(fetchImpl).mock.calls[0]?.[0])).toBe('https://api.github.com/users/postigodev/events/public?per_page=100');
    expect(new Headers(vi.mocked(fetchImpl).mock.calls[0]?.[1]?.headers).get('authorization')).toBe('Bearer server-token');
  });

  it('groups nonconsecutive pushes by repository and branch at the newest position', async () => {
    const payload = [
      event('PushEvent', { ref: 'refs/heads/main', before: '1'.repeat(40), head: '2'.repeat(40), size: 5 }, { id: 'push-new', created_at: '2026-08-21T12:00:00Z' }),
      event('WatchEvent', { action: 'started' }, { id: 'star-between', repo: { name: 'shuqikhor/pixel-icons' }, created_at: '2026-08-21T10:00:00Z' }),
      event('PushEvent', { ref: 'refs/heads/main', before: '3'.repeat(40), head: '4'.repeat(40), size: 7 }, { id: 'push-old', created_at: '2026-08-21T07:00:00Z' }),
    ];
    const result = await getGitHubActivity(vi.fn(async () => githubResponse(payload)) as typeof fetch, undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready state');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      kind: 'push',
      phrase: '12 commits pushed to',
      target: 'postigodev/postigo.sh',
      detail: 'main',
      url: 'https://github.com/postigodev/postigo.sh/tree/main',
      createdAt: '2026-08-21T12:00:00Z',
      oldestCreatedAt: '2026-08-21T07:00:00Z',
    });
    expect(result.entries[0]?.id).toBe('group:["push-new","push-old"]');
    expect(result.entries[1]?.id).toBe('star-between');
    expect(result.entries[0]?.url).not.toContain('/compare/');
  });

  it('falls back to push count when any commit count is absent and never mixes refs or repositories', async () => {
    const payload = [
      event('PushEvent', { ref: 'refs/heads/main', before: shaBefore, head: shaHead, size: 2 }, { id: 'main-sized', created_at: '2026-08-21T12:00:00Z' }),
      event('PushEvent', { ref: 'refs/heads/main', before: shaBefore, head: shaHead }, { id: 'main-unsized', created_at: '2026-08-21T11:00:00Z' }),
      event('PushEvent', { ref: 'refs/heads/dev', before: shaBefore, head: shaHead, size: 3 }, { id: 'dev', created_at: '2026-08-21T10:00:00Z' }),
      event('PushEvent', { ref: 'refs/heads/main', before: shaBefore, head: shaHead, size: 4 }, { id: 'other-repo', repo: { name: 'postigodev/koba' }, created_at: '2026-08-21T09:00:00Z' }),
    ];
    const result = await getGitHubActivity(vi.fn(async () => githubResponse(payload)) as typeof fetch, undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready state');
    expect(result.entries).toHaveLength(3);
    expect(result.entries[0]).toMatchObject({ phrase: '2 pushes to', detail: 'main' });
    expect(result.entries[1]).toMatchObject({ phrase: 'pushed to', detail: 'dev branch' });
    expect(result.entries[2]).toMatchObject({ target: 'postigodev/koba' });
  });

  it('groups equivalent actions but keeps different PR actions distinct', async () => {
    const pullRequest = { number: 3, title: 'Activity work', html_url: 'https://github.com/postigodev/postigo.sh/pull/3' };
    const payload = [
      event('PullRequestEvent', { action: 'opened', number: 3, pull_request: pullRequest }, { id: 'opened-new', created_at: '2026-08-21T12:00:00Z' }),
      event('IssuesEvent', { action: 'opened', issue: { number: 9, title: 'Interruption', html_url: 'https://github.com/postigodev/postigo.sh/issues/9' } }, { id: 'issue', created_at: '2026-08-21T11:00:00Z' }),
      event('PullRequestEvent', { action: 'opened', number: 3, pull_request: pullRequest }, { id: 'opened-old', created_at: '2026-08-21T10:00:00Z' }),
      event('PullRequestEvent', { action: 'closed', number: 3, pull_request: { ...pullRequest, merged: true } }, { id: 'merged', created_at: '2026-08-21T09:00:00Z' }),
    ];
    const result = await getGitHubActivity(vi.fn(async () => githubResponse(payload)) as typeof fetch, undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready state');
    expect(result.entries.map(({ phrase }) => phrase)).toEqual(['opened PR #3 2 times in', 'opened issue #9 in', 'merged PR #3 in']);
  });

  it('groups PR comments across both public comment event types', async () => {
    const pullRequest = { number: 8, title: 'Same subject', html_url: 'https://github.com/postigodev/postigo.sh/pull/8' };
    const payload = [
      event('IssueCommentEvent', { action: 'created', issue: { ...pullRequest, pull_request: {} }, comment: { html_url: 'https://github.com/postigodev/postigo.sh/pull/8#issuecomment-2' } }, { id: 'issue-comment', created_at: '2026-08-21T12:00:00Z' }),
      event('PullRequestReviewCommentEvent', { action: 'created', pull_request: pullRequest, comment: { html_url: 'https://github.com/postigodev/postigo.sh/pull/8#discussion_r1' } }, { id: 'review-comment', created_at: '2026-08-21T08:00:00Z' }),
    ];
    const result = await getGitHubActivity(vi.fn(async () => githubResponse(payload)) as typeof fetch, undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready state');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ phrase: 'commented 2 times on PR #8 in', oldestCreatedAt: '2026-08-21T08:00:00Z' });
  });

  it('groups repeated stars for one repository without merging other repositories', async () => {
    const payload = [
      event('WatchEvent', { action: 'started' }, { id: 'star-new', created_at: '2026-08-21T12:00:00Z' }),
      event('WatchEvent', { action: 'started' }, { id: 'star-other', repo: { name: 'postigodev/koba' }, created_at: '2026-08-21T11:00:00Z' }),
      event('WatchEvent', { action: 'started' }, { id: 'star-old', created_at: '2026-08-21T10:00:00Z' }),
    ];
    const result = await getGitHubActivity(vi.fn(async () => githubResponse(payload)) as typeof fetch, undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready state');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({ phrase: 'starred 2 times', target: 'postigodev/postigo.sh', oldestCreatedAt: '2026-08-21T10:00:00Z' });
    expect(result.entries[1]).toMatchObject({ phrase: 'starred', target: 'postigodev/koba' });
  });

  it.each([403, 429, 500])('returns the stable fallback for GitHub %s responses', async (status) => {
    const result = await getGitHubActivity(vi.fn(async () => githubResponse({ message: 'private detail' }, status)) as typeof fetch, undefined, 'now');
    expect(result).toEqual({ state: 'unavailable', profileUrl: 'https://github.com/postigodev', login: 'postigodev' });
    expect(JSON.stringify(result)).not.toContain('private detail');
  });
});
