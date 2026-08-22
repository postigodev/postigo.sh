import { describe, expect, it, vi } from 'vitest';
import { getGitHubActivity, normalizeGitHubEvent } from '../../src/lib/presence/github';

const createdAt = '2026-08-22T12:00:00Z';
const sha = (value: string) => value.repeat(40).slice(0, 40);
const hexSha = (value: number) => value.toString(16).padStart(40, '0');

function event(type: string, payload: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) {
  return { id: `${type}-1`, type, actor: { login: 'postigodev' }, repo: { name: 'postigodev/postigo.sh' }, payload, public: true, created_at: createdAt, ...overrides };
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function comparedCommit(id: string, date: string) {
  return { sha: sha(id), commit: { committer: { date }, author: { date } } };
}

function comparePage(commits: readonly unknown[], total = commits.length, status = 'ahead') {
  return { status, total_commits: total, commits };
}

function githubFetch(events: readonly unknown[], compare: (url: string) => unknown = () => comparePage([])) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    return url.includes('/events/public') ? response(events) : response(compare(url));
  }) as unknown as typeof fetch;
}

describe('normalizeGitHubEvent', () => {
  it('never emits raw push activity', () => {
    expect(normalizeGitHubEvent(event('PushEvent', { ref: 'refs/heads/main', before: sha('1'), head: sha('2') }))).toBeUndefined();
  });

  it.each([
    ['IssuesEvent', { action: 'closed', issue: { number: 7, title: 'Fix feed', html_url: 'https://github.com/postigodev/postigo.sh/issues/7' } }, 'issue', 'closed issue #7 in'],
    ['IssueCommentEvent', { action: 'created', issue: { number: 9, title: 'Review', pull_request: {} }, comment: { html_url: 'https://github.com/postigodev/postigo.sh/pull/9#issuecomment-1' } }, 'comment', 'commented on PR #9 in'],
    ['PullRequestReviewEvent', { action: 'created', pull_request: { number: 10, title: 'Review target' }, review: { state: 'approved' } }, 'review', 'approved PR #10 in'],
    ['ReleaseEvent', { action: 'published', release: { tag_name: 'v1.0.0' } }, 'release', 'published a release for'],
    ['ForkEvent', { forkee: { full_name: 'postigodev/fork' } }, 'fork', 'forked'],
    ['WatchEvent', { action: 'started' }, 'star', 'starred'],
    ['CreateEvent', { ref_type: 'repository', description: 'Tool' }, 'repository-created', 'created repository'],
    ['PublicEvent', {}, 'repository-public', 'made repository public'],
  ] as const)('maps %s to useful discrete activity', (type, payload, kind, phrase) => {
    expect(normalizeGitHubEvent(event(type, payload))).toMatchObject({ kind, phrase, target: 'postigodev/postigo.sh' });
  });

  it('normalizes both merged event representations', () => {
    const pull = { number: 4, title: 'Merged work', html_url: 'https://github.com/postigodev/postigo.sh/pull/4' };
    expect(normalizeGitHubEvent(event('PullRequestEvent', { action: 'merged', number: 4, pull_request: pull }))).toMatchObject({ phrase: 'merged PR #4 in' });
    expect(normalizeGitHubEvent(event('PullRequestEvent', { action: 'closed', number: 4, pull_request: { ...pull, merged: true } }))).toMatchObject({ phrase: 'merged PR #4 in' });
  });

  it('rejects unsupported or unsafe events', () => {
    expect(normalizeGitHubEvent(event('DeploymentEvent'))).toBeUndefined();
    expect(normalizeGitHubEvent(event('WatchEvent', { action: 'started' }, { actor: { login: 'attacker' } }))).toBeUndefined();
  });
});

describe('getGitHubActivity', () => {
  it('derives one verified commit row with the newest real commit timestamp', async () => {
    const events = [
      event('PushEvent', { ref: 'refs/heads/main', before: sha('1'), head: sha('2') }, { id: 'new', created_at: '2026-08-22T12:00:00Z' }),
      event('PushEvent', { ref: 'refs/heads/main', before: sha('3'), head: sha('4') }, { id: 'old', created_at: '2026-08-21T12:00:00Z' }),
    ];
    const fetchImpl = githubFetch(events, () => comparePage([
      comparedCommit('a', '2026-08-21T13:00:00Z'),
      comparedCommit('b', '2026-08-22T11:59:00Z'),
    ]));
    const result = await getGitHubActivity(fetchImpl, 'token', 'now');
    if (result.state !== 'ready') throw new Error('expected ready');
    expect(result.entries).toEqual([expect.objectContaining({ kind: 'commit', phrase: '2 commits to', target: 'postigodev/postigo.sh', url: 'https://github.com/postigodev/postigo.sh/commits', createdAt: '2026-08-22T11:59:00Z' })]);
    expect(JSON.stringify(result)).not.toContain('pushed to');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('deduplicates commit SHAs across refs before grouping by repository', async () => {
    const events = [
      event('PushEvent', { ref: 'refs/heads/main', before: sha('1'), head: sha('2') }, { id: 'main' }),
      event('PushEvent', { ref: 'refs/heads/topic', before: sha('3'), head: sha('4') }, { id: 'topic', created_at: '2026-08-22T11:00:00Z' }),
    ];
    const shared = comparedCommit('a', '2026-08-22T10:00:00Z');
    const fetchImpl = githubFetch(events, (url) => url.includes(`${sha('1')}...${sha('2')}`)
      ? comparePage([shared, comparedCommit('b', '2026-08-22T11:00:00Z')])
      : comparePage([shared, comparedCommit('c', '2026-08-22T09:00:00Z')]));
    const result = await getGitHubActivity(fetchImpl, undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ phrase: '3 commits to', createdAt: '2026-08-22T11:00:00Z' });
  });

  it('prioritizes the eight newest repo+ref groups', async () => {
    const events = Array.from({ length: 10 }, (_, index) => event('PushEvent', {
      ref: `refs/heads/topic-${index}`, before: hexSha(index + 1), head: hexSha(index + 101),
    }, { id: `push-${index}`, created_at: `2026-08-22T${String(20 - index).padStart(2, '0')}:00:00Z` }));
    const fetchImpl = githubFetch(events, (url) => comparePage([comparedCommit(url.includes('topic') ? 'e' : 'f', '2026-08-22T12:00:00Z')]));
    await getGitHubActivity(fetchImpl, undefined, 'now');
    const compareUrls = vi.mocked(fetchImpl).mock.calls.slice(1).map(([url]) => String(url));
    expect(compareUrls).toHaveLength(8);
    expect(compareUrls.join('\n')).not.toContain(`${hexSha(9)}...`);
    expect(compareUrls.join('\n')).not.toContain(`${hexSha(10)}...`);
  });

  it('paginates comparisons and requires exact completeness', async () => {
    const events = [event('PushEvent', { ref: 'refs/heads/main', before: sha('1'), head: sha('2') })];
    const commits = Array.from({ length: 105 }, (_, index) => comparedCommit(index.toString(16).padStart(2, '0'), `2026-08-22T${String(index % 24).padStart(2, '0')}:00:00Z`));
    const completeFetch = githubFetch(events, (url) => comparePage(url.endsWith('page=1') ? commits.slice(0, 100) : commits.slice(100), 105));
    const complete = await getGitHubActivity(completeFetch, undefined, 'now');
    if (complete.state !== 'ready') throw new Error('expected ready');
    expect(complete.entries[0]).toMatchObject({ phrase: '105 commits to' });
    expect(completeFetch).toHaveBeenCalledTimes(3);

    const incompleteFetch = githubFetch(events, (url) => comparePage(url.endsWith('page=1') ? commits.slice(0, 100) : commits.slice(100, 104), 105));
    const incomplete = await getGitHubActivity(incompleteFetch, undefined, 'now');
    if (incomplete.state !== 'ready') throw new Error('expected ready');
    expect(incomplete.entries).toEqual([]);
  });

  it('suppresses an opened PR only when a later event confirms its merge', async () => {
    const mergedPull = { number: 4, title: 'Merged', html_url: 'https://github.com/postigodev/postigo.sh/pull/4', merged: true };
    const openPull = { number: 5, title: 'Still open', html_url: 'https://github.com/postigodev/postigo.sh/pull/5' };
    const events = [
      event('PullRequestEvent', { action: 'closed', number: 4, pull_request: mergedPull }, { id: 'merged', created_at: '2026-08-22T12:00:00Z' }),
      event('PullRequestEvent', { action: 'opened', number: 5, pull_request: openPull }, { id: 'open-live', created_at: '2026-08-22T11:00:00Z' }),
      event('PullRequestEvent', { action: 'opened', number: 4, pull_request: mergedPull }, { id: 'open-merged', created_at: '2026-08-22T10:00:00Z' }),
    ];
    const result = await getGitHubActivity(githubFetch(events), undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready');
    expect(result.entries.map(({ phrase }) => phrase)).toEqual(['merged PR #4 in', 'opened PR #5 in']);
  });

  it('filters unsupported events before the 15-row cap and orders globally', async () => {
    const unsupported = Array.from({ length: 30 }, (_, index) => event('DeleteEvent', {}, { id: `bad-${index}` }));
    const supported = Array.from({ length: 20 }, (_, index) => event('WatchEvent', { action: 'started' }, {
      id: `star-${index}`, repo: { name: `postigodev/repo-${index}` }, created_at: `2026-08-22T${String(20 - index).padStart(2, '0')}:00:00Z`,
    }));
    const result = await getGitHubActivity(githubFetch([...unsupported, ...supported]), undefined, 'now');
    if (result.state !== 'ready') throw new Error('expected ready');
    expect(result.entries).toHaveLength(15);
    expect(result.entries[0]?.id).toBe('star-0');
    expect(result.entries.every(({ id, phrase, target }) => id && phrase && target)).toBe(true);
  });

  it.each([403, 429, 500])('returns the stable fallback for GitHub %s responses', async (status) => {
    const fetchImpl = vi.fn(async () => response({ message: 'private detail' }, status)) as unknown as typeof fetch;
    expect(await getGitHubActivity(fetchImpl, undefined, 'now')).toEqual({ state: 'unavailable', profileUrl: 'https://github.com/postigodev', login: 'postigodev' });
  });
});
