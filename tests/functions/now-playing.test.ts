import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleNowPlaying } from '../../src/lib/presence/now-playing-handler';

const credentialKeys = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'] as const;

beforeEach(() => {
  for (const key of credentialKeys) delete process.env[key];
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of credentialKeys) delete process.env[key];
});

describe('/api/now-playing', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rejects %s without reading credentials', async (method) => {
    const response = await handleNowPlaying(new Request('https://portfolio.test/api/now-playing', { method }));
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET, HEAD');
  });

  it('rejects client-selected tokens and accounts', async () => {
    const response = await handleNowPlaying(new Request('https://portfolio.test/api/now-playing?token=attacker'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'INVALID_REQUEST' });
  });

  it('returns a stable unavailable view when owner credentials are absent', async () => {
    const response = await handleNowPlaying(new Request('https://portfolio.test/api/now-playing'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ state: 'unavailable' });
    expect(response.headers.get('cdn-cache-control')).toContain('s-maxage=30');
  });

  it('returns headers and no body for HEAD', async () => {
    const response = await handleNowPlaying(new Request('https://portfolio.test/api/now-playing', { method: 'HEAD' }));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('maps every upstream failure to the safe public fallback', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'client-id';
    process.env.SPOTIFY_CLIENT_SECRET = 'client-secret';
    process.env.SPOTIFY_REFRESH_TOKEN = 'refresh-secret';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('private upstream failure', { status: 500 })));
    const response = await handleNowPlaying(new Request('https://portfolio.test/api/now-playing'));
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(text).toContain('unavailable');
    expect(text).not.toContain('private upstream failure');
    expect(text).not.toMatch(/client-secret|refresh-secret/);
  });
});
