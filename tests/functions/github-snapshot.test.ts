import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/github-snapshot';

beforeEach(() => delete process.env.GITHUB_TOKEN);
afterEach(() => {
  delete process.env.GITHUB_TOKEN;
  vi.unstubAllGlobals();
});

describe('/api/github-snapshot', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rejects %s', async (method) => {
    const response = await handler.fetch(new Request('https://portfolio.test/api/github-snapshot', { method }));
    expect(response.status).toBe(405);
  });

  it('rejects every query string', async () => {
    const response = await handler.fetch(new Request('https://portfolio.test/api/github-snapshot?user=attacker'));
    expect(response.status).toBe(400);
  });

  it('returns a bodyless cached HEAD response without calling GitHub', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler.fetch(new Request('https://portfolio.test/api/github-snapshot', { method: 'HEAD' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cdn-cache-control')).toContain('s-maxage=21600');
    expect(await response.text()).toBe('');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('never exposes token state or upstream failure text', async () => {
    process.env.GITHUB_TOKEN = 'server-secret';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'private rate limit detail' }), { status: 403 })));
    const response = await handler.fetch(new Request('https://portfolio.test/api/github-snapshot'));
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(text).toContain('unavailable');
    expect(text).not.toMatch(/server-secret|private rate limit detail/);
  });
});
