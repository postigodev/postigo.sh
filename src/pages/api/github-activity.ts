import type { APIRoute } from 'astro';
import { handleGitHubActivity } from '../../lib/presence/github-activity-handler';

export const ALL: APIRoute = ({ request }) => handleGitHubActivity(request);
