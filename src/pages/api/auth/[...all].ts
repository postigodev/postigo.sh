import type { APIRoute } from 'astro';
import { getAuth } from '../../../lib/auth';

export const ALL: APIRoute = async ({ request }) =>
  (await getAuth()).handler(request);
