import { githubCache, guardPublicRead, jsonForMethod } from './_lib/http';
import { getGitHubSnapshot } from './_lib/github';

export default {
  async fetch(request: Request): Promise<Response> {
    const rejected = guardPublicRead(request);
    if (rejected) return rejected;
    const body = await getGitHubSnapshot(fetch, process.env.GITHUB_TOKEN, new Date().toISOString());
    return jsonForMethod(request.method, body, 200, githubCache);
  },
};
