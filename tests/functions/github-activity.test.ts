import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleGitHubActivity } from '../../src/lib/presence/github-activity-handler';

beforeEach(() => delete process.env.GITHUB_TOKEN);
afterEach(() => { delete process.env.GITHUB_TOKEN; vi.unstubAllGlobals(); });

describe('/api/github-activity', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rejects %s', async (method) => {
    expect((await handleGitHubActivity(new Request('https://portfolio.test/api/github-activity', { method }))).status).toBe(405);
  });

  it('rejects query strings', async () => {
    expect((await handleGitHubActivity(new Request('https://portfolio.test/api/github-activity?user=attacker'))).status).toBe(400);
  });

  it('returns a bodyless cached HEAD response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]')));
    const response = await handleGitHubActivity(new Request('https://portfolio.test/api/github-activity', { method: 'HEAD' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cdn-cache-control')).toBe('public, s-maxage=3600, stale-while-revalidate=21600');
    expect(await response.text()).toBe('');
  });

  it('never exposes token state or upstream failure text', async () => {
    process.env.GITHUB_TOKEN = 'server-secret';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'private rate limit detail' }), { status: 403 })));
    const text = await (await handleGitHubActivity(new Request('https://portfolio.test/api/github-activity'))).text();
    expect(text).toContain('unavailable');
    expect(text).not.toMatch(/server-secret|private rate limit detail/);
  });
});
