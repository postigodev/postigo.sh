import type { APIRoute } from 'astro';
import { HARDCOVER_API_KEY, LETTERBOXD_URI, STEAM_API_KEY, STEAM_ID, TMDB_API_KEY } from 'astro:env/server';
import { getMediaLog } from '../../lib/media-log/service';
import { guardPublicRead, jsonForMethod, mediaLogCache } from '../../lib/presence/http';

export const ALL: APIRoute = async ({ request }) => {
  const rejected = guardPublicRead(request);
  if (rejected) return rejected;
  return jsonForMethod(request.method, await getMediaLog({ HARDCOVER_API_KEY, LETTERBOXD_URI, STEAM_API_KEY, STEAM_ID, TMDB_API_KEY }), 200, mediaLogCache);
};
