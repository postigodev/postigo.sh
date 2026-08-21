import { githubCache, guardPublicRead, jsonForMethod } from './http.js';
import { getGitHubSnapshot } from './github.js';

export async function handleGitHubSnapshot(request: Request): Promise<Response> {
  const rejected = guardPublicRead(request);
  if (rejected) return rejected;
  const body = await getGitHubSnapshot(fetch, process.env.GITHUB_TOKEN, new Date().toISOString());
  return jsonForMethod(request.method, body, 200, githubCache);
}
