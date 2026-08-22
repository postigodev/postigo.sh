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
  it('uses one 100-event request, preserves order and caps normalized entries at 20', async () => {
    const payload = Array.from({ length: 24 }, (_, index) => event('WatchEvent', { action: 'started' }, { id: String(index) }));
    const fetchImpl = vi.fn(async () => githubResponse(payload)) as typeof fetch;
    const result = await getGitHubActivity(fetchImpl, 'server-token', 'now');
    expect(result.state).toBe('ready');
    if (result.state !== 'ready') throw new Error('expected ready state');
    expect(result.entries).toHaveLength(20);
    expect(result.entries.map((entry) => entry.id).slice(0, 2)).toEqual(['0', '1']);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(fetchImpl).mock.calls[0]?.[0])).toBe('https://api.github.com/users/postigodev/events/public?per_page=100');
    expect(new Headers(vi.mocked(fetchImpl).mock.calls[0]?.[1]?.headers).get('authorization')).toBe('Bearer server-token');
  });

  it.each([403, 429, 500])('returns the stable fallback for GitHub %s responses', async (status) => {
    const result = await getGitHubActivity(vi.fn(async () => githubResponse({ message: 'private detail' }, status)) as typeof fetch, undefined, 'now');
    expect(result).toEqual({ state: 'unavailable', profileUrl: 'https://github.com/postigodev', login: 'postigodev' });
    expect(JSON.stringify(result)).not.toContain('private detail');
  });
});
