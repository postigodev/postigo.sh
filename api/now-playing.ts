import { guardPublicRead, jsonForMethod, spotifyCache } from './_lib/http';
import { getNowPlaying, loadSpotifyEnvironment } from './_lib/spotify';

export default {
  async fetch(request: Request): Promise<Response> {
    const rejected = guardPublicRead(request);
    if (rejected) return rejected;

    const observedAt = new Date().toISOString();
    const environment = loadSpotifyEnvironment(process.env);
    const body = environment
      ? await getNowPlaying(fetch, environment, observedAt).catch(() => ({ state: 'unavailable' as const, observedAt }))
      : { state: 'unavailable' as const, observedAt };
    return jsonForMethod(request.method, body, 200, spotifyCache);
  },
};
