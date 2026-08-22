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

type AggregateData =
  | { type: 'push'; ref: string; refName: string; refType: 'branch' | 'tag'; refUrl: string; size?: number }
  | { type: 'star' }
  | { type: 'pull-request'; action: string; number: number }
  | { type: 'issue'; action: string; number: number }
  | { type: 'comment'; subject: 'PR' | 'issue'; number: number }
  | { type: 'review'; action: 'approved' | 'changes-requested' | 'reviewed'; number: number };

type NormalizedGitHubEvent = GitHubActivityEntry & {
  groupKey?: string;
  aggregate?: AggregateData;
};

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

function nonNegativeInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
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

function semanticKey(...parts: readonly (string | number)[]): string {
  return JSON.stringify(parts);
}

function refInfo(baseUrl: string, ref: string | undefined): Pick<Extract<AggregateData, { type: 'push' }>, 'ref' | 'refName' | 'refType' | 'refUrl'> | undefined {
  const prefixes = [
    ['refs/heads/', 'branch', 'tree'] as const,
    ['refs/tags/', 'tag', 'releases/tag'] as const,
  ];
  for (const [prefix, refType, path] of prefixes) {
    if (!ref?.startsWith(prefix)) continue;
    const refName = ref.slice(prefix.length);
    if (!refName) return undefined;
    const encodedRef = refName.split('/').map(encodeURIComponent).join('/');
    return { ref, refName, refType, refUrl: `${baseUrl}/${path}/${encodedRef}` };
  }
  return undefined;
}

function entry(
  id: string,
  kind: GitHubActivityKind,
  phrase: string,
  target: string,
  url: string,
  createdAt: string,
  extraDetail?: string,
): NormalizedGitHubEvent {
  return { id, kind, phrase, target, ...(extraDetail ? { detail: extraDetail } : {}), url, createdAt };
}

function pushEntry(id: string, repository: string, payload: JsonObject, createdAt: string): NormalizedGitHubEvent {
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
  const normalized = entry(id, 'push', 'pushed to', repository, url, createdAt, refDetail);
  const aggregateRef = refInfo(baseUrl, ref);
  if (!aggregateRef) return normalized;
  const size = nonNegativeInteger(payload.size);
  return {
    ...normalized,
    groupKey: semanticKey('push', repository, aggregateRef.ref),
    aggregate: { type: 'push', ...aggregateRef, ...(size !== undefined ? { size } : {}) },
  };
}

function pullRequestEntry(id: string, repository: string, payload: JsonObject, createdAt: string): NormalizedGitHubEvent | undefined {
  const pullRequest = objectValue(payload.pull_request);
  const number = integer(payload.number) ?? integer(pullRequest?.number);
  const action = text(payload.action);
  if (!pullRequest || !number || !action || !['opened', 'closed', 'merged', 'reopened'].includes(action)) return undefined;
  const verb = action === 'closed' && pullRequest.merged === true ? 'merged' : action;
  const url = githubUrl(pullRequest.html_url) ?? `${repositoryUrl(repository)}/pull/${number}`;
  return {
    ...entry(id, 'pull-request', `${verb} PR #${number} in`, repository, url, createdAt, detail(pullRequest.title)),
    groupKey: semanticKey('pull-request', repository, verb, number),
    aggregate: { type: 'pull-request', action: verb, number },
  };
}

function issueEntry(id: string, repository: string, payload: JsonObject, createdAt: string): NormalizedGitHubEvent | undefined {
  const issue = objectValue(payload.issue);
  const number = integer(issue?.number);
  const action = text(payload.action);
  if (!issue || !number || !action || !['opened', 'closed', 'reopened'].includes(action)) return undefined;
  const url = githubUrl(issue.html_url) ?? `${repositoryUrl(repository)}/issues/${number}`;
  return {
    ...entry(id, 'issue', `${action} issue #${number} in`, repository, url, createdAt, detail(issue.title)),
    groupKey: semanticKey('issue', repository, action, number),
    aggregate: { type: 'issue', action, number },
  };
}

function issueCommentEntry(id: string, repository: string, payload: JsonObject, createdAt: string): NormalizedGitHubEvent | undefined {
  if (payload.action !== 'created') return undefined;
  const issue = objectValue(payload.issue);
  const comment = objectValue(payload.comment);
  const number = integer(issue?.number);
  if (!issue || !comment || !number) return undefined;
  const isPullRequest = objectValue(issue.pull_request) !== undefined;
  const url = githubUrl(comment.html_url) ?? githubUrl(issue.html_url) ?? repositoryUrl(repository);
  const subject = isPullRequest ? 'PR' : 'issue';
  return {
    ...entry(id, 'comment', `commented on ${subject} #${number} in`, repository, url, createdAt, detail(issue.title)),
    groupKey: semanticKey('comment', repository, subject, number),
    aggregate: { type: 'comment', subject, number },
  };
}

function reviewEntry(id: string, repository: string, payload: JsonObject, createdAt: string): NormalizedGitHubEvent | undefined {
  if (!['created', 'updated'].includes(String(payload.action))) return undefined;
  const pullRequest = objectValue(payload.pull_request);
  const review = objectValue(payload.review);
  const number = integer(pullRequest?.number);
  if (!pullRequest || !review || !number) return undefined;
  const state = text(review.state)?.toLowerCase();
  const phrase = state === 'approved' ? `approved PR #${number} in`
    : state === 'changes_requested' ? `requested changes on PR #${number} in`
      : `reviewed PR #${number} in`;
  const aggregateAction = state === 'approved' ? 'approved' : state === 'changes_requested' ? 'changes-requested' : 'reviewed';
  const url = githubUrl(review.html_url) ?? githubUrl(pullRequest.html_url) ?? `${repositoryUrl(repository)}/pull/${number}`;
  return {
    ...entry(id, 'review', phrase, repository, url, createdAt, detail(pullRequest.title)),
    groupKey: semanticKey('review', repository, aggregateAction, number),
    aggregate: { type: 'review', action: aggregateAction, number },
  };
}

function reviewCommentEntry(id: string, repository: string, payload: JsonObject, createdAt: string): NormalizedGitHubEvent | undefined {
  if (payload.action !== 'created') return undefined;
  const pullRequest = objectValue(payload.pull_request);
  const comment = objectValue(payload.comment);
  const number = integer(pullRequest?.number);
  if (!pullRequest || !comment || !number) return undefined;
  const url = githubUrl(comment.html_url) ?? githubUrl(pullRequest.html_url) ?? `${repositoryUrl(repository)}/pull/${number}`;
  return {
    ...entry(id, 'comment', `commented on PR #${number} in`, repository, url, createdAt, detail(pullRequest.title)),
    groupKey: semanticKey('comment', repository, 'PR', number),
    aggregate: { type: 'comment', subject: 'PR', number },
  };
}

export function normalizeGitHubEvent(value: unknown): NormalizedGitHubEvent | undefined {
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
      return payload.action === 'started' ? {
        ...entry(id, 'star', 'starred', repository, repoUrl, createdAt),
        groupKey: semanticKey('star', repository),
        aggregate: { type: 'star' },
      } : undefined;
    case 'CreateEvent':
      return payload.ref_type === 'repository' ? entry(id, 'repository-created', 'created repository', repository, repoUrl, createdAt, detail(payload.description)) : undefined;
    case 'PublicEvent':
      return entry(id, 'repository-public', 'made repository public', repository, repoUrl, createdAt);
    default:
      return undefined;
  }
}

function publicEntry(value: NormalizedGitHubEvent): GitHubActivityEntry {
  const { groupKey: _groupKey, aggregate: _aggregate, ...activity } = value;
  return activity;
}

function groupedPhrase(aggregate: AggregateData, count: number): string {
  switch (aggregate.type) {
    case 'star': return `starred ${count} times`;
    case 'pull-request': return `${aggregate.action} PR #${aggregate.number} ${count} times in`;
    case 'issue': return `${aggregate.action} issue #${aggregate.number} ${count} times in`;
    case 'comment': return `commented ${count} times on ${aggregate.subject} #${aggregate.number} in`;
    case 'review':
      if (aggregate.action === 'changes-requested') return `requested changes ${count} times on PR #${aggregate.number} in`;
      return `${aggregate.action === 'approved' ? 'approved' : 'reviewed'} PR #${aggregate.number} ${count} times in`;
    case 'push': return `${count} pushes to`;
  }
}

function finalizeGroup(members: readonly NormalizedGitHubEvent[]): GitHubActivityEntry {
  const newest = members[0];
  if (!newest) throw new Error('cannot finalize an empty GitHub activity group');
  if (members.length === 1 || !newest.aggregate) return publicEntry(newest);

  const oldestCreatedAt = members.reduce((oldest, member) => Date.parse(member.createdAt) < Date.parse(oldest) ? member.createdAt : oldest, newest.createdAt);
  const memberIds = members.map(({ id }) => id).sort();
  const grouped: GitHubActivityEntry = {
    ...publicEntry(newest),
    id: `group:${JSON.stringify(memberIds)}`,
    phrase: groupedPhrase(newest.aggregate, members.length),
    oldestCreatedAt,
  };

  if (newest.aggregate.type !== 'push') return grouped;
  const pushData = members.map(({ aggregate }) => aggregate?.type === 'push' ? aggregate : undefined);
  const sizes = pushData.map((push) => push?.size);
  const hasCompleteCommitCount = sizes.every((size): size is number => size !== undefined);
  return {
    ...grouped,
    phrase: hasCompleteCommitCount ? `${sizes.reduce((total, size) => total + size, 0)} commits pushed to` : `${members.length} pushes to`,
    detail: newest.aggregate.refName,
    url: newest.aggregate.refUrl,
  };
}

function isRenderableActivity(value: GitHubActivityEntry): boolean {
  return value.id.trim() !== ''
    && value.phrase.trim() !== ''
    && value.target.trim() !== ''
    && githubUrl(value.url) !== undefined
    && !Number.isNaN(Date.parse(value.createdAt))
    && (value.oldestCreatedAt === undefined || !Number.isNaN(Date.parse(value.oldestCreatedAt)));
}

function groupGitHubActivity(events: readonly NormalizedGitHubEvent[]): GitHubActivityEntry[] {
  const sorted = [...events].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const buckets: NormalizedGitHubEvent[][] = [];
  const bySemanticKey = new Map<string, NormalizedGitHubEvent[]>();

  for (const activity of sorted) {
    if (!activity.groupKey || !activity.aggregate) {
      buckets.push([activity]);
      continue;
    }
    const existing = bySemanticKey.get(activity.groupKey);
    if (existing) {
      existing.push(activity);
      continue;
    }
    const members = [activity];
    bySemanticKey.set(activity.groupKey, members);
    buckets.push(members);
  }

  return buckets.map(finalizeGroup).filter(isRenderableActivity);
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
    const normalized = payload.map(normalizeGitHubEvent).filter((value): value is NormalizedGitHubEvent => Boolean(value));
    return {
      state: 'ready', profileUrl: PROFILE_URL, login: 'postigodev',
      entries: groupGitHubActivity(normalized).slice(0, MAX_ENTRIES),
      observedAt,
    };
  } catch {
    return { ...staticGitHubFallback };
  }
}
