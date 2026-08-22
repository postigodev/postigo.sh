import { getGitHubActivity } from './github.js';
import { githubCache, guardPublicRead, jsonForMethod } from './http.js';

export async function handleGitHubActivity(request: Request): Promise<Response> {
  const rejected = guardPublicRead(request);
  if (rejected) return rejected;
  const body = await getGitHubActivity(fetch, process.env.GITHUB_TOKEN, new Date().toISOString());
  return jsonForMethod(request.method, body, 200, githubCache);
}
