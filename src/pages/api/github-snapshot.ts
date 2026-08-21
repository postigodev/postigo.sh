import type { APIRoute } from 'astro';
import { handleGitHubSnapshot } from '../../lib/presence/github-snapshot-handler';

export const ALL: APIRoute = ({ request }) => handleGitHubSnapshot(request);
