import { staticGitHubFallback, type GitHubSnapshotView } from '../../src/data/presence';
import { readJsonBounded } from './http';

const PROFILE_ENDPOINT = 'https://api.github.com/users/postigodev';
const REPOSITORIES_ENDPOINT = 'https://api.github.com/users/postigodev/repos';
const UPSTREAM_TIMEOUT_MS = 4_000;
const MAX_PAGES = 10;
const PAGE_SIZE = 100;

function fallback(): GitHubSnapshotView {
  return { ...staticGitHubFallback };
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function count(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function githubHeaders(token?: string): Headers {
  const headers = new Headers({
    accept: 'application/vnd.github+json',
    'user-agent': 'postigo-portfolio',
    'x-github-api-version': '2022-11-28',
  });
  if (token?.trim()) headers.set('authorization', `Bearer ${token.trim()}`);
  return headers;
}

async function githubGet(fetchImpl: typeof fetch, url: string, token?: string): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('github upstream request failed');
  return readJsonBounded(response);
}

export async function getGitHubSnapshot(
  fetchImpl: typeof fetch,
  token: string | undefined,
  observedAt: string,
): Promise<GitHubSnapshotView> {
  try {
    const profile = objectValue(await githubGet(fetchImpl, PROFILE_ENDPOINT, token));
    const login = text(profile?.login);
    const profileUrl = text(profile?.html_url);
    const avatarUrl = text(profile?.avatar_url);
    const publicRepos = count(profile?.public_repos);
    const followers = count(profile?.followers);
    if (login !== 'postigodev' || !profileUrl || !avatarUrl || publicRepos === undefined || followers === undefined) {
      return fallback();
    }

    const repositories: Record<string, unknown>[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = new URL(REPOSITORIES_ENDPOINT);
      url.search = new URLSearchParams({ per_page: String(PAGE_SIZE), page: String(page), type: 'owner', sort: 'full_name' }).toString();
      const payload = await githubGet(fetchImpl, url.toString(), token);
      if (!Array.isArray(payload)) return fallback();
      repositories.push(...payload.map(objectValue).filter((entry): entry is Record<string, unknown> => Boolean(entry)));
      if (payload.length < PAGE_SIZE) break;
    }

    let stars = 0;
    const languageCounts = new Map<string, number>();
    for (const repository of repositories.slice(0, MAX_PAGES * PAGE_SIZE)) {
      if (repository.fork === true || repository.archived === true) continue;
      stars += count(repository.stargazers_count) ?? 0;
      const language = text(repository.language);
      if (language) languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
    }
    const languages = [...languageCounts]
      .sort(([leftLanguage, leftCount], [rightLanguage, rightCount]) => rightCount - leftCount || leftLanguage.localeCompare(rightLanguage))
      .slice(0, 3)
      .map(([language]) => language);

    return {
      state: 'ready',
      profileUrl,
      login: 'postigodev',
      avatarUrl,
      publicRepos,
      followers,
      stars,
      languages,
      observedAt,
    };
  } catch {
    return fallback();
  }
}
