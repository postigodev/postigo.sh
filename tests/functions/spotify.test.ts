import { afterEach, describe, expect, it, vi } from 'vitest';
import { getNowPlaying, loadSpotifyEnvironment, type SpotifyEnvironment } from '../../api/_lib/spotify';

const environment: SpotifyEnvironment = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  refreshToken: 'refresh-secret',
};

const trackFixture = {
  type: 'track',
  name: 'Test Track',
  artists: [{ name: 'Test Artist' }],
  album: { name: 'Test Album', images: [{ url: 'https://i.scdn.co/image/test' }] },
  external_urls: { spotify: 'https://open.spotify.com/track/test' },
  duration_ms: 210_000,
};

function spotifyResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function sequenceFetch(responses: Response[]): typeof fetch {
  return vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error('unexpected fetch');
    return next;
  }) as typeof fetch;
}

afterEach(() => vi.restoreAllMocks());

describe('loadSpotifyEnvironment', () => {
  it('requires all three fixed owner credentials', () => {
    expect(loadSpotifyEnvironment({
      SPOTIFY_CLIENT_ID: environment.clientId,
      SPOTIFY_CLIENT_SECRET: environment.clientSecret,
      SPOTIFY_REFRESH_TOKEN: environment.refreshToken,
    })).toEqual(environment);
    expect(loadSpotifyEnvironment({ SPOTIFY_CLIENT_ID: 'only-one' })).toBeUndefined();
  });
});

describe('getNowPlaying', () => {
  it('normalizes current playback and never returns tokens', async () => {
    const fetchImpl = sequenceFetch([
      spotifyResponse({ access_token: 'access-secret' }),
      spotifyResponse({ is_playing: true, progress_ms: 84_000, item: trackFixture }),
    ]);
    const result = await getNowPlaying(fetchImpl, environment, '2026-08-13T18:00:00.000Z');
    expect(result).toMatchObject({ state: 'playing', track: 'Test Track', progressMs: 84_000 });
    expect(JSON.stringify(result)).not.toMatch(/access-secret|refresh-secret|client-secret/);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('falls back from 204 current playback to the newest recent track', async () => {
    const result = await getNowPlaying(sequenceFetch([
      spotifyResponse({ access_token: 'access-secret' }),
      new Response(null, { status: 204 }),
      spotifyResponse({ items: [{ track: trackFixture, played_at: '2026-08-13T17:55:00Z' }] }),
    ]), environment, '2026-08-13T18:00:00.000Z');
    expect(result).toMatchObject({ state: 'recent', track: 'Test Track' });
    expect(result).not.toHaveProperty('progressMs');
  });

  it('returns unavailable for a malformed item', async () => {
    const result = await getNowPlaying(sequenceFetch([
      spotifyResponse({ access_token: 'access-secret' }),
      spotifyResponse({ is_playing: true, item: { name: 'missing fields' } }),
    ]), environment, '2026-08-13T18:00:00.000Z');
    expect(result).toEqual({ state: 'unavailable', observedAt: '2026-08-13T18:00:00.000Z' });
  });

  it.each([401, 429, 500])('does not expose or retry Spotify %s responses', async (status) => {
    const fetchImpl = sequenceFetch([
      spotifyResponse({ access_token: 'access-secret' }),
      spotifyResponse({ error: { message: 'private upstream detail' } }, status),
    ]);
    await expect(getNowPlaying(fetchImpl, environment, 'now')).rejects.toThrow('spotify current request failed');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('rejects oversized upstream JSON', async () => {
    await expect(getNowPlaying(sequenceFetch([
      spotifyResponse({ access_token: 'a'.repeat(262_145) }),
    ]), environment, 'now')).rejects.toThrow(/exceeds 262144 bytes/);
  });
});
