import type { APIRoute } from 'astro';
import { handleNowPlaying } from '../../lib/presence/now-playing-handler';

export const ALL: APIRoute = ({ request }) => handleNowPlaying(request);
