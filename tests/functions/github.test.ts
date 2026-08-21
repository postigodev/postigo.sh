import { describe, expect, it, vi } from 'vitest';
import { getGitHubSnapshot } from '../../src/lib/presence/github';

function githubResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function profile(overrides: Record<string, unknown> = {}) {
  return {
    login: 'postigodev',
    html_url: 'https://github.com/postigodev',
    avatar_url: 'https://avatars.githubusercontent.com/u/1',
    public_repos: 4,
    followers: 3,
    ...overrides,
  };
}

function sequenceFetch(responses: Response[]): typeof fetch {
  return vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error('unexpected fetch');
    return next;
  }) as typeof fetch;
}

describe('getGitHubSnapshot', () => {
  it('keeps raw public repos but excludes forks and archived repos from derived values', async () => {
    const result = await getGitHubSnapshot(sequenceFetch([
      githubResponse(profile()),
      githubResponse([
        { fork: false, archived: false, stargazers_count: 5, language: 'TypeScript' },
        { fork: true, archived: false, stargazers_count: 99, language: 'JavaScript' },
        { fork: false, archived: true, stargazers_count: 50, language: 'Rust' },
        { fork: false, archived: false, stargazers_count: 2, language: 'Rust' },
      ]),
    ]), undefined, '2026-08-13T18:00:00.000Z');
    expect(result).toMatchObject({ publicRepos: 4, followers: 3, stars: 7, languages: ['Rust', 'TypeScript'] });
  });

  it('paginates full pages and sorts language ties alphabetically', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      fork: false, archived: false, stargazers_count: 1, language: index % 2 ? 'TypeScript' : 'Rust',
    }));
    const fetchImpl = sequenceFetch([
      githubResponse(profile({ public_repos: 101 })),
      githubResponse(firstPage),
      githubResponse([{ fork: false, archived: false, stargazers_count: 2, language: 'Go' }]),
    ]);
    const result = await getGitHubSnapshot(fetchImpl, undefined, 'now');
    expect(result).toMatchObject({ stars: 102, languages: ['Rust', 'TypeScript', 'Go'] });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('caps repository pagination at 1,000 records', async () => {
    const page = Array.from({ length: 100 }, () => ({ fork: false, archived: false, stargazers_count: 1, language: 'Rust' }));
    const fetchImpl = sequenceFetch([githubResponse(profile({ public_repos: 2_000 })), ...Array.from({ length: 10 }, () => githubResponse(page))]);
    const result = await getGitHubSnapshot(fetchImpl, undefined, 'now');
    expect(result).toMatchObject({ stars: 1_000 });
    expect(fetchImpl).toHaveBeenCalledTimes(11);
  });

  it('uses a fixed username and only sends authorization when configured', async () => {
    const fetchImpl = sequenceFetch([githubResponse(profile()), githubResponse([])]);
    await getGitHubSnapshot(fetchImpl, 'server-token', 'now');
    const calls = vi.mocked(fetchImpl).mock.calls;
    expect(String(calls[0]?.[0])).toBe('https://api.github.com/users/postigodev');
    expect(String(calls[1]?.[0])).toContain('/users/postigodev/repos?');
    expect(new Headers(calls[0]?.[1]?.headers).get('authorization')).toBe('Bearer server-token');
  });

  it.each([403, 429, 500])('returns the stable fallback for GitHub %s responses', async (status) => {
    const result = await getGitHubSnapshot(sequenceFetch([githubResponse({ message: 'private detail' }, status)]), undefined, 'now');
    expect(result).toMatchObject({ state: 'unavailable', login: 'postigodev' });
    expect(JSON.stringify(result)).not.toContain('private detail');
  });

  it('returns the fallback for malformed and oversized JSON', async () => {
    const malformed = await getGitHubSnapshot(sequenceFetch([githubResponse({ login: 'attacker' })]), undefined, 'now');
    expect(malformed.state).toBe('unavailable');
    const oversized = await getGitHubSnapshot(sequenceFetch([
      new Response('x'.repeat(262_145), { headers: { 'content-length': '262145' } }),
    ]), undefined, 'now');
    expect(oversized.state).toBe('unavailable');
  });
});
