import { XMLParser } from 'fast-xml-parser';
import type { MediaLogEntry, MediaLogResponse } from '../../data/media-log';
import { readJsonBounded, readTextBounded } from '../presence/http';

const TIMEOUT_MS = 4_000;
type Environment = Record<string, string | undefined>;

function env(environment: Environment, name: string): string | undefined {
  const value = environment[name]?.trim();
  return value || undefined;
}

function signal(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS);
}

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function letterboxdRssUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!['letterboxd.com', 'www.letterboxd.com'].includes(url.hostname.toLowerCase())) return undefined;
    const username = url.pathname.split('/').filter(Boolean)[0];
    if (!username || !/^[a-z0-9_-]+$/i.test(username)) return undefined;
    return `https://letterboxd.com/${username}/rss/`;
  } catch {
    return undefined;
  }
}

async function fetchLetterboxd(environment: Environment): Promise<MediaLogEntry | undefined> {
  const profile = env(environment, 'LETTERBOXD_URI');
  const tmdbKey = env(environment, 'TMDB_API_KEY');
  const rssUrl = profile && letterboxdRssUrl(profile);
  if (!rssUrl || !tmdbKey) return undefined;

  const rssResponse = await fetch(rssUrl, {
    headers: { accept: 'application/rss+xml, application/xml;q=0.9', 'user-agent': 'postigo.sh/2 media-log' },
    signal: signal(),
  });
  if (!rssResponse.ok) throw new Error(`Letterboxd returned ${rssResponse.status}`);
  const parsed = new XMLParser({ ignoreAttributes: false }).parse(await readTextBounded(rssResponse));
  const items = parsed?.rss?.channel?.item;
  const item = Array.isArray(items) ? items[0] : items;
  const title = typeof item?.['letterboxd:filmTitle'] === 'string' ? item['letterboxd:filmTitle'].trim() : '';
  const watchedAt = typeof item?.['letterboxd:watchedDate'] === 'string' ? item['letterboxd:watchedDate'] : '';
  const tmdbId = Number(item?.['tmdb:movieId']);
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(watchedAt) || !Number.isInteger(tmdbId) || tmdbId <= 0) return undefined;

  const movieResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${encodeURIComponent(tmdbKey)}`, {
    headers: { accept: 'application/json' },
    signal: signal(),
  });
  if (!movieResponse.ok) throw new Error(`TMDB returned ${movieResponse.status}`);
  const movie = await readJsonBounded<{ poster_path?: unknown }>(movieResponse);
  const posterPath = typeof movie.poster_path === 'string' && /^\/[a-zA-Z0-9._-]+$/.test(movie.poster_path) ? movie.poster_path : undefined;
  if (!posterPath) return undefined;

  const year = finiteNumber(item?.['letterboxd:filmYear']);
  const rating = finiteNumber(item?.['letterboxd:memberRating']);
  return {
    kind: 'film', activity: 'watched', title,
    ...(year && Number.isInteger(year) ? { year } : {}),
    occurredAt: watchedAt,
    ...(rating && rating > 0 && rating <= 5 ? { rating } : {}),
    artworkUrl: `https://image.tmdb.org/t/p/w500${posterPath}`,
  };
}

interface SteamPlayer { gameid?: string; gameextrainfo?: string }
interface SteamGame { appid?: number; name?: string; playtime_forever?: number }

async function fetchSteam(environment: Environment): Promise<MediaLogEntry | undefined> {
  const key = env(environment, 'STEAM_API_KEY');
  const steamId = env(environment, 'STEAM_ID');
  if (!key || !steamId || !/^\d{15,20}$/.test(steamId)) return undefined;
  const playerQuery = `key=${encodeURIComponent(key)}&steamids=${encodeURIComponent(steamId)}`;
  const recentQuery = `key=${encodeURIComponent(key)}&steamid=${encodeURIComponent(steamId)}&count=10`;
  const [playerResponse, recentResponse] = await Promise.all([
    fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?${playerQuery}`, { signal: signal() }),
    fetch(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?${recentQuery}`, { signal: signal() }),
  ]);
  if (!playerResponse.ok || !recentResponse.ok) throw new Error('Steam request failed');
  const [playerBody, recentBody] = await Promise.all([
    readJsonBounded<{ response?: { players?: SteamPlayer[] } }>(playerResponse),
    readJsonBounded<{ response?: { games?: SteamGame[] } }>(recentResponse),
  ]);
  const player = playerBody.response?.players?.[0];
  const games = recentBody.response?.games ?? [];
  const currentId = Number(player?.gameid);
  const current = Number.isInteger(currentId) && currentId > 0
    ? games.find((game) => game.appid === currentId) ?? { appid: currentId, name: player?.gameextrainfo }
    : undefined;
  const game = current ?? games.find((candidate) => Number.isInteger(candidate.appid) && candidate.appid! > 0 && candidate.name);
  if (!game?.appid || !game.name) return undefined;
  const minutes = finiteNumber(game.playtime_forever);
  return {
    kind: 'game', activity: current ? 'playing' : 'played', title: game.name.trim(),
    ...(minutes !== undefined && minutes >= 0 ? { totalHours: Math.round(minutes / 6) / 10 } : {}),
    artworkUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appid}/library_600x900.jpg`,
  };
}

interface HardcoverBook {
  title?: unknown;
  pages?: unknown;
  image?: { url?: unknown } | null;
  contributions?: Array<{ author?: { name?: unknown } | null }> | null;
}

async function fetchHardcover(environment: Environment): Promise<MediaLogEntry | undefined> {
  const key = env(environment, 'HARDCOVER_API_KEY');
  if (!key) return undefined;
  const response = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST', signal: signal(),
    headers: { authorization: key.startsWith('Bearer ') ? key : `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: `query MediaLog { me { user_books(where: {status_id: {_eq: 2}}, order_by: {updated_at: desc}, limit: 1) { user_book_reads { progress_pages } book { title pages image { url } contributions { author { name } } } } } }` }),
  });
  if (!response.ok) throw new Error(`Hardcover returned ${response.status}`);
  const body = await readJsonBounded<{ data?: { me?: Array<{ user_books?: Array<{ user_book_reads?: Array<{ progress_pages?: unknown }>; book?: HardcoverBook }> }> }; errors?: unknown[] }>(response);
  if (body.errors?.length) throw new Error('Hardcover returned GraphQL errors');
  const userBook = body.data?.me?.[0]?.user_books?.[0];
  const book = userBook?.book;
  const title = typeof book?.title === 'string' ? book.title.trim() : '';
  const artworkUrl = httpsUrl(book?.image?.url);
  if (!title || !artworkUrl) return undefined;
  const authorName = book?.contributions?.map((item) => item.author?.name).find((name): name is string => typeof name === 'string' && name.trim().length > 0)?.trim();
  const pages = finiteNumber(book?.pages);
  const progressPages = Math.max(0, ...(userBook?.user_book_reads ?? []).map((read) => finiteNumber(read.progress_pages) ?? 0));
  const progressPercent = pages && pages > 0 ? Math.min(100, Math.round((progressPages / pages) * 100)) : undefined;
  return { kind: 'book', activity: 'reading', title, ...(authorName ? { author: authorName } : {}), ...(progressPercent !== undefined ? { progressPercent } : {}), artworkUrl };
}

export async function getMediaLog(runtimeEnvironment: Environment = process.env): Promise<MediaLogResponse> {
  const settled = await Promise.allSettled([fetchLetterboxd(runtimeEnvironment), fetchSteam(runtimeEnvironment), fetchHardcover(runtimeEnvironment)]);
  return {
    entries: settled.flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : []),
    observedAt: new Date().toISOString(),
  };
}
