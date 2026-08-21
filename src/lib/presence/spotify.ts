import type { NowPlayingView } from '../../data/presence.js';
import { readJsonBounded } from './http.js';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const CURRENT_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENT_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';
const UPSTREAM_TIMEOUT_MS = 4_000;

export interface SpotifyEnvironment {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

type Environment = Record<string, string | undefined>;

export function loadSpotifyEnvironment(environment: Environment): SpotifyEnvironment | undefined {
  const clientId = environment.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = environment.SPOTIFY_CLIENT_SECRET?.trim();
  const refreshToken = environment.SPOTIFY_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return undefined;
  return { clientId, clientSecret, refreshToken };
}

function unavailable(observedAt: string): NowPlayingView {
  return { state: 'unavailable', observedAt };
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function firstImage(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  return nonEmpty(objectValue(value[0])?.url);
}

function normalizeItem(itemValue: unknown) {
  const item = objectValue(itemValue);
  if (!item) return undefined;
  const track = nonEmpty(item.name);
  const spotifyUrl = nonEmpty(objectValue(item.external_urls)?.spotify);
  const durationMs = positiveNumber(item.duration_ms);
  if (!track || !spotifyUrl || !durationMs) return undefined;

  if (item.type === 'episode') {
    const show = objectValue(item.show);
    const artist = nonEmpty(show?.publisher);
    const album = nonEmpty(show?.name);
    const artworkUrl = firstImage(item.images) ?? firstImage(show?.images);
    if (!artist || !album || !artworkUrl) return undefined;
    return { track, artist, album, artworkUrl, spotifyUrl, durationMs };
  }

  const albumValue = objectValue(item.album);
  const artists = Array.isArray(item.artists) ? item.artists : [];
  const artist = artists.map((entry) => nonEmpty(objectValue(entry)?.name)).filter(Boolean).join(', ');
  const album = nonEmpty(albumValue?.name);
  const artworkUrl = firstImage(albumValue?.images);
  if (!artist || !album || !artworkUrl) return undefined;
  return { track, artist, album, artworkUrl, spotifyUrl, durationMs };
}

async function refreshAccessToken(fetchImpl: typeof fetch, environment: SpotifyEnvironment): Promise<string> {
  const credentials = Buffer.from(`${environment.clientId}:${environment.clientSecret}`).toString('base64');
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: environment.refreshToken }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('spotify token request failed');
  const body = await readJsonBounded<Record<string, unknown>>(response);
  const accessToken = nonEmpty(body.access_token);
  if (!accessToken) throw new Error('spotify token response malformed');
  return accessToken;
}

async function spotifyGet(fetchImpl: typeof fetch, url: string, accessToken: string): Promise<Response> {
  return fetchImpl(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
}

export async function getNowPlaying(
  fetchImpl: typeof fetch,
  environment: SpotifyEnvironment,
  observedAt: string,
): Promise<NowPlayingView> {
  const accessToken = await refreshAccessToken(fetchImpl, environment);
  const currentResponse = await spotifyGet(fetchImpl, CURRENT_ENDPOINT, accessToken);

  if (currentResponse.status !== 204) {
    if (!currentResponse.ok) throw new Error('spotify current request failed');
    const current = await readJsonBounded<Record<string, unknown>>(currentResponse);
    const item = normalizeItem(current.item);
    if (!item) return unavailable(observedAt);
    const progress = typeof current.progress_ms === 'number' && Number.isFinite(current.progress_ms)
      ? Math.max(0, Math.min(current.progress_ms, item.durationMs))
      : undefined;
    return {
      state: current.is_playing === true ? 'playing' : 'recent',
      ...item,
      ...(current.is_playing === true && progress !== undefined ? { progressMs: progress } : {}),
      observedAt,
    };
  }

  const recentResponse = await spotifyGet(fetchImpl, RECENT_ENDPOINT, accessToken);
  if (!recentResponse.ok) throw new Error('spotify recent request failed');
  const recent = await readJsonBounded<Record<string, unknown>>(recentResponse);
  const first = Array.isArray(recent.items) ? objectValue(recent.items[0]) : undefined;
  const item = normalizeItem(first?.track);
  return item ? { state: 'recent', ...item, observedAt } : unavailable(observedAt);
}
