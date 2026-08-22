import {
  staticGitHubFallback,
  type GitHubActivityEntry,
  type GitHubActivityKind,
  type GitHubActivityView,
} from '../../data/presence.js';
import { readJsonBounded } from './http.js';

const EVENTS_ENDPOINT = 'https://api.github.com/users/postigodev/events/public?per_page=100';
const PROFILE_URL = 'https://github.com/postigodev';
const UPSTREAM_TIMEOUT_MS = 4_000;
const MAX_ENTRIES = 20;
const SHA = /^[a-f0-9]{40}$/i;
const ZERO_SHA = /^0{40}$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

type JsonObject = Record<string, unknown>;

function objectValue(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || undefined;
}

function integer(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

function detail(value: unknown): string | undefined {
  const normalized = text(value);
  return normalized ? normalized.slice(0, 180) : undefined;
}

function githubUrl(value: unknown): string | undefined {
  const candidate = text(value);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && url.hostname === 'github.com' && url.port === '' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function repositoryUrl(repository: string): string {
  return `https://github.com/${repository}`;
}

function entry(
  id: string,
  kind: GitHubActivityKind,
  phrase: string,
  target: string,
  url: string,
  createdAt: string,
  extraDetail?: string,
): GitHubActivityEntry {
  return { id, kind, phrase, target, ...(extraDetail ? { detail: extraDetail } : {}), url, createdAt };
}

function pushEntry(id: string, repository: string, payload: JsonObject, createdAt: string): GitHubActivityEntry {
  const before = text(payload.before);
  const head = text(payload.head);
  const ref = text(payload.ref);
  const baseUrl = repositoryUrl(repository);
  let url = baseUrl;
  if (head && SHA.test(head) && !ZERO_SHA.test(head)) {
    url = before && SHA.test(before) && !ZERO_SHA.test(before)
      ? `${baseUrl}/compare/${before}...${head}`
      : `${baseUrl}/commit/${head}`;
  } else if (ref?.startsWith('refs/heads/')) {
    url = `${baseUrl}/tree/${encodeURIComponent(ref.slice('refs/heads/'.length))}`;
  } else if (ref?.startsWith('refs/tags/')) {
    url = `${baseUrl}/releases/tag/${encodeURIComponent(ref.slice('refs/tags/'.length))}`;
  }
  const refDetail = ref?.startsWith('refs/heads/')
    ? `${ref.slice('refs/heads/'.length)} branch`
    : ref?.startsWith('refs/tags/') ? `${ref.slice('refs/tags/'.length)} tag` : undefined;
  return entry(id, 'push', 'pushed to', repository, url, createdAt, refDetail);
}

function pullRequestEntry(id: string, repository: string, payload: JsonObject, createdAt: string): GitHubActivityEntry | undefined {
  const pullRequest = objectValue(payload.pull_request);
  const number = integer(payload.number) ?? integer(pullRequest?.number);
  const action = text(payload.action);
  if (!pullRequest || !number || !action || !['opened', 'closed', 'merged', 'reopened'].includes(action)) return undefined;
  const verb = action === 'closed' && pullRequest.merged === true ? 'merged' : action;
  const url = githubUrl(pullRequest.html_url) ?? `${repositoryUrl(repository)}/pull/${number}`;
  return entry(id, 'pull-request', `${verb} PR #${number} in`, repository, url, createdAt, detail(pullRequest.title));
}

function issueEntry(id: string, repository: string, payload: JsonObject, createdAt: string): GitHubActivityEntry | undefined {
  const issue = objectValue(payload.issue);
  const number = integer(issue?.number);
  const action = text(payload.action);
  if (!issue || !number || !action || !['opened', 'closed', 'reopened'].includes(action)) return undefined;
  const url = githubUrl(issue.html_url) ?? `${repositoryUrl(repository)}/issues/${number}`;
  return entry(id, 'issue', `${action} issue #${number} in`, repository, url, createdAt, detail(issue.title));
}

function issueCommentEntry(id: string, repository: string, payload: JsonObject, createdAt: string): GitHubActivityEntry | undefined {
  if (payload.action !== 'created') return undefined;
  const issue = objectValue(payload.issue);
  const comment = objectValue(payload.comment);
  const number = integer(issue?.number);
  if (!issue || !comment || !number) return undefined;
  const isPullRequest = objectValue(issue.pull_request) !== undefined;
  const url = githubUrl(comment.html_url) ?? githubUrl(issue.html_url) ?? repositoryUrl(repository);
  return entry(id, 'comment', `commented on ${isPullRequest ? 'PR' : 'issue'} #${number} in`, repository, url, createdAt, detail(issue.title));
}

function reviewEntry(id: string, repository: string, payload: JsonObject, createdAt: string): GitHubActivityEntry | undefined {
  if (!['created', 'updated'].includes(String(payload.action))) return undefined;
  const pullRequest = objectValue(payload.pull_request);
  const review = objectValue(payload.review);
  const number = integer(pullRequest?.number);
  if (!pullRequest || !review || !number) return undefined;
  const state = text(review.state)?.toLowerCase();
  const phrase = state === 'approved' ? `approved PR #${number} in`
    : state === 'changes_requested' ? `requested changes on PR #${number} in`
      : `reviewed PR #${number} in`;
  const url = githubUrl(review.html_url) ?? githubUrl(pullRequest.html_url) ?? `${repositoryUrl(repository)}/pull/${number}`;
  return entry(id, 'review', phrase, repository, url, createdAt, detail(pullRequest.title));
}

function reviewCommentEntry(id: string, repository: string, payload: JsonObject, createdAt: string): GitHubActivityEntry | undefined {
  if (payload.action !== 'created') return undefined;
  const pullRequest = objectValue(payload.pull_request);
  const comment = objectValue(payload.comment);
  const number = integer(pullRequest?.number);
  if (!pullRequest || !comment || !number) return undefined;
  const url = githubUrl(comment.html_url) ?? githubUrl(pullRequest.html_url) ?? `${repositoryUrl(repository)}/pull/${number}`;
  return entry(id, 'comment', `commented on PR #${number} in`, repository, url, createdAt, detail(pullRequest.title));
}

export function normalizeGitHubEvent(value: unknown): GitHubActivityEntry | undefined {
  const event = objectValue(value);
  const actor = objectValue(event?.actor);
  const repo = objectValue(event?.repo);
  const payload = objectValue(event?.payload) ?? {};
  const id = text(event?.id);
  const type = text(event?.type);
  const repository = text(repo?.name);
  const createdAt = text(event?.created_at);
  const repositoryParts = repository?.split('/');
  const safeRepository = repositoryParts?.length === 2
    && repositoryParts.every((part) => part !== '.' && part !== '..' && part.length > 0);
  if (!event || actor?.login !== 'postigodev' || event.public !== true || !id || !type || !repository || !REPOSITORY.test(repository) || !safeRepository || !createdAt || Number.isNaN(Date.parse(createdAt))) return undefined;
  const repoUrl = repositoryUrl(repository);

  switch (type) {
    case 'PushEvent': return pushEntry(id, repository, payload, createdAt);
    case 'PullRequestEvent': return pullRequestEntry(id, repository, payload, createdAt);
    case 'IssuesEvent': return issueEntry(id, repository, payload, createdAt);
    case 'IssueCommentEvent': return issueCommentEntry(id, repository, payload, createdAt);
    case 'PullRequestReviewEvent': return reviewEntry(id, repository, payload, createdAt);
    case 'PullRequestReviewCommentEvent': return reviewCommentEntry(id, repository, payload, createdAt);
    case 'ReleaseEvent': {
      if (payload.action !== 'published') return undefined;
      const release = objectValue(payload.release);
      if (!release) return undefined;
      return entry(id, 'release', 'published a release for', repository, githubUrl(release.html_url) ?? `${repoUrl}/releases`, createdAt, detail(release.tag_name));
    }
    case 'ForkEvent': {
      const forkee = objectValue(payload.forkee);
      if (!forkee) return undefined;
      return entry(id, 'fork', 'forked', repository, githubUrl(forkee.html_url) ?? `${repoUrl}/forks`, createdAt, detail(forkee.full_name));
    }
    case 'WatchEvent':
      return payload.action === 'started' ? entry(id, 'star', 'starred', repository, repoUrl, createdAt) : undefined;
    case 'CreateEvent':
      return payload.ref_type === 'repository' ? entry(id, 'repository-created', 'created repository', repository, repoUrl, createdAt, detail(payload.description)) : undefined;
    case 'PublicEvent':
      return entry(id, 'repository-public', 'made repository public', repository, repoUrl, createdAt);
    default:
      return undefined;
  }
}

function githubHeaders(token?: string): Headers {
  const headers = new Headers({ accept: 'application/vnd.github+json', 'user-agent': 'postigo-portfolio', 'x-github-api-version': '2022-11-28' });
  if (token?.trim()) headers.set('authorization', `Bearer ${token.trim()}`);
  return headers;
}

export async function getGitHubActivity(fetchImpl: typeof fetch, token: string | undefined, observedAt: string): Promise<GitHubActivityView> {
  try {
    const response = await fetchImpl(EVENTS_ENDPOINT, { headers: githubHeaders(token), signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (!response.ok) throw new Error('github upstream request failed');
    const payload = await readJsonBounded<unknown>(response);
    if (!Array.isArray(payload)) throw new Error('github upstream payload was not an array');
    return {
      state: 'ready', profileUrl: PROFILE_URL, login: 'postigodev',
      entries: payload.map(normalizeGitHubEvent).filter((value): value is GitHubActivityEntry => Boolean(value)).slice(0, MAX_ENTRIES),
      observedAt,
    };
  } catch {
    return { ...staticGitHubFallback };
  }
}
