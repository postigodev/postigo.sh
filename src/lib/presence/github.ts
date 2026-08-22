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
const MAX_ENTRIES = 15;
const MAX_COMPARE_GROUPS = 8;
const MAX_COMPARE_PAGES = 3;
const COMPARE_PAGE_SIZE = 100;
const COMPARE_PAGE_BYTES = 2_000_000;
const SHA = /^[a-f0-9]{40}$/i;
const ZERO_SHA = /^0{40}$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

type JsonObject = Record<string, unknown>;
type AggregateData =
  | { type: 'star' }
  | { type: 'pull-request'; action: string; number: number }
  | { type: 'issue'; action: string; number: number }
  | { type: 'comment'; subject: 'PR' | 'issue'; number: number }
  | { type: 'review'; action: 'approved' | 'changes-requested' | 'reviewed'; number: number };
type NormalizedGitHubEvent = GitHubActivityEntry & { groupKey?: string; aggregate?: AggregateData };
type CommonEvent = { id: string; type: string; repository: string; payload: JsonObject; createdAt: string };
type PushRange = { repository: string; ref: string; before: string; head: string; createdAt: string };
type PushGroup = PushRange & { newestPushAt: string };
type ComparedCommit = { sha: string; createdAt: string };
type Comparison = { repository: string; commits: readonly ComparedCommit[] };

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

function semanticKey(...parts: readonly (string | number)[]): string {
  return JSON.stringify(parts);
}

function commonEvent(value: unknown): CommonEvent | undefined {
  const event = objectValue(value);
  const actor = objectValue(event?.actor);
  const repo = objectValue(event?.repo);
  const id = text(event?.id);
  const type = text(event?.type);
  const repository = text(repo?.name);
  const createdAt = text(event?.created_at);
  const repositoryParts = repository?.split('/');
  const safeRepository = repositoryParts?.length === 2
    && repositoryParts.every((part) => part !== '.' && part !== '..' && part.length > 0);
  if (!event || actor?.login !== 'postigodev' || event.public !== true || !id || !type || !repository
    || !REPOSITORY.test(repository) || !safeRepository || !createdAt || Number.isNaN(Date.parse(createdAt))) return undefined;
  return { id, type, repository, payload: objectValue(event.payload) ?? {}, createdAt };
}

function entry(id: string, kind: GitHubActivityKind, phrase: string, target: string, url: string, createdAt: string, extraDetail?: string): NormalizedGitHubEvent {
  return { id, kind, phrase, target, ...(extraDetail ? { detail: extraDetail } : {}), url, createdAt };
}

function pullRequestEntry(event: CommonEvent): NormalizedGitHubEvent | undefined {
  const pullRequest = objectValue(event.payload.pull_request);
  const number = integer(event.payload.number) ?? integer(pullRequest?.number);
  const action = text(event.payload.action);
  if (!pullRequest || !number || !action || !['opened', 'closed', 'merged', 'reopened'].includes(action)) return undefined;
  const verb = (action === 'closed' && pullRequest.merged === true) || action === 'merged' ? 'merged' : action;
  const url = githubUrl(pullRequest.html_url) ?? `${repositoryUrl(event.repository)}/pull/${number}`;
  return {
    ...entry(event.id, 'pull-request', `${verb} PR #${number} in`, event.repository, url, event.createdAt, detail(pullRequest.title)),
    groupKey: semanticKey('pull-request', event.repository, verb, number),
    aggregate: { type: 'pull-request', action: verb, number },
  };
}

function issueEntry(event: CommonEvent): NormalizedGitHubEvent | undefined {
  const issue = objectValue(event.payload.issue);
  const number = integer(issue?.number);
  const action = text(event.payload.action);
  if (!issue || !number || !action || !['opened', 'closed', 'reopened'].includes(action)) return undefined;
  const url = githubUrl(issue.html_url) ?? `${repositoryUrl(event.repository)}/issues/${number}`;
  return {
    ...entry(event.id, 'issue', `${action} issue #${number} in`, event.repository, url, event.createdAt, detail(issue.title)),
    groupKey: semanticKey('issue', event.repository, action, number),
    aggregate: { type: 'issue', action, number },
  };
}

function issueCommentEntry(event: CommonEvent): NormalizedGitHubEvent | undefined {
  if (event.payload.action !== 'created') return undefined;
  const issue = objectValue(event.payload.issue);
  const comment = objectValue(event.payload.comment);
  const number = integer(issue?.number);
  if (!issue || !comment || !number) return undefined;
  const subject = objectValue(issue.pull_request) !== undefined ? 'PR' : 'issue';
  const url = githubUrl(comment.html_url) ?? githubUrl(issue.html_url) ?? repositoryUrl(event.repository);
  return {
    ...entry(event.id, 'comment', `commented on ${subject} #${number} in`, event.repository, url, event.createdAt, detail(issue.title)),
    groupKey: semanticKey('comment', event.repository, subject, number),
    aggregate: { type: 'comment', subject, number },
  };
}

function reviewEntry(event: CommonEvent): NormalizedGitHubEvent | undefined {
  if (!['created', 'updated'].includes(String(event.payload.action))) return undefined;
  const pullRequest = objectValue(event.payload.pull_request);
  const review = objectValue(event.payload.review);
  const number = integer(pullRequest?.number);
  if (!pullRequest || !review || !number) return undefined;
  const state = text(review.state)?.toLowerCase();
  const phrase = state === 'approved' ? `approved PR #${number} in`
    : state === 'changes_requested' ? `requested changes on PR #${number} in`
      : `reviewed PR #${number} in`;
  const aggregateAction = state === 'approved' ? 'approved' : state === 'changes_requested' ? 'changes-requested' : 'reviewed';
  const url = githubUrl(review.html_url) ?? githubUrl(pullRequest.html_url) ?? `${repositoryUrl(event.repository)}/pull/${number}`;
  return {
    ...entry(event.id, 'review', phrase, event.repository, url, event.createdAt, detail(pullRequest.title)),
    groupKey: semanticKey('review', event.repository, aggregateAction, number),
    aggregate: { type: 'review', action: aggregateAction, number },
  };
}

function reviewCommentEntry(event: CommonEvent): NormalizedGitHubEvent | undefined {
  if (event.payload.action !== 'created') return undefined;
  const pullRequest = objectValue(event.payload.pull_request);
  const comment = objectValue(event.payload.comment);
  const number = integer(pullRequest?.number);
  if (!pullRequest || !comment || !number) return undefined;
  const url = githubUrl(comment.html_url) ?? githubUrl(pullRequest.html_url) ?? `${repositoryUrl(event.repository)}/pull/${number}`;
  return {
    ...entry(event.id, 'comment', `commented on PR #${number} in`, event.repository, url, event.createdAt, detail(pullRequest.title)),
    groupKey: semanticKey('comment', event.repository, 'PR', number),
    aggregate: { type: 'comment', subject: 'PR', number },
  };
}

export function normalizeGitHubEvent(value: unknown): NormalizedGitHubEvent | undefined {
  const event = commonEvent(value);
  if (!event || event.type === 'PushEvent') return undefined;
  const repoUrl = repositoryUrl(event.repository);
  switch (event.type) {
    case 'PullRequestEvent': return pullRequestEntry(event);
    case 'IssuesEvent': return issueEntry(event);
    case 'IssueCommentEvent': return issueCommentEntry(event);
    case 'PullRequestReviewEvent': return reviewEntry(event);
    case 'PullRequestReviewCommentEvent': return reviewCommentEntry(event);
    case 'ReleaseEvent': {
      if (event.payload.action !== 'published') return undefined;
      const release = objectValue(event.payload.release);
      return release ? entry(event.id, 'release', 'published a release for', event.repository, githubUrl(release.html_url) ?? `${repoUrl}/releases`, event.createdAt, detail(release.tag_name)) : undefined;
    }
    case 'ForkEvent': {
      const forkee = objectValue(event.payload.forkee);
      return forkee ? entry(event.id, 'fork', 'forked', event.repository, githubUrl(forkee.html_url) ?? `${repoUrl}/forks`, event.createdAt, detail(forkee.full_name)) : undefined;
    }
    case 'WatchEvent':
      return event.payload.action === 'started' ? { ...entry(event.id, 'star', 'starred', event.repository, repoUrl, event.createdAt), groupKey: semanticKey('star', event.repository), aggregate: { type: 'star' } } : undefined;
    case 'CreateEvent':
      return event.payload.ref_type === 'repository' ? entry(event.id, 'repository-created', 'created repository', event.repository, repoUrl, event.createdAt, detail(event.payload.description)) : undefined;
    case 'PublicEvent':
      return entry(event.id, 'repository-public', 'made repository public', event.repository, repoUrl, event.createdAt);
    default:
      return undefined;
  }
}

function normalizePushRange(value: unknown): PushRange | undefined {
  const event = commonEvent(value);
  if (!event || event.type !== 'PushEvent') return undefined;
  const ref = text(event.payload.ref);
  const before = text(event.payload.before);
  const head = text(event.payload.head);
  if (!ref || !before || !head || !SHA.test(before) || ZERO_SHA.test(before) || !SHA.test(head) || ZERO_SHA.test(head)) return undefined;
  return { repository: event.repository, ref, before, head, createdAt: event.createdAt };
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
  }
}

function isRenderableActivity(value: GitHubActivityEntry): boolean {
  return value.id.trim() !== '' && value.phrase.trim() !== '' && value.target.trim() !== ''
    && githubUrl(value.url) !== undefined && !Number.isNaN(Date.parse(value.createdAt));
}

function suppressOpenedMerged(events: readonly NormalizedGitHubEvent[]): NormalizedGitHubEvent[] {
  const mergedAt = new Map<string, number>();
  for (const event of events) {
    if (event.aggregate?.type !== 'pull-request' || event.aggregate.action !== 'merged') continue;
    const key = semanticKey(event.target, event.aggregate.number);
    const timestamp = Date.parse(event.createdAt);
    if (timestamp > (mergedAt.get(key) ?? -Infinity)) mergedAt.set(key, timestamp);
  }
  return events.filter((event) => {
    if (event.aggregate?.type !== 'pull-request' || event.aggregate.action !== 'opened') return true;
    const merged = mergedAt.get(semanticKey(event.target, event.aggregate.number));
    return merged === undefined || merged <= Date.parse(event.createdAt);
  });
}

function groupDiscreteActivity(events: readonly NormalizedGitHubEvent[]): GitHubActivityEntry[] {
  const sorted = suppressOpenedMerged(events).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const buckets: NormalizedGitHubEvent[][] = [];
  const bySemanticKey = new Map<string, NormalizedGitHubEvent[]>();
  for (const activity of sorted) {
    if (!activity.groupKey || !activity.aggregate) buckets.push([activity]);
    else {
      const existing = bySemanticKey.get(activity.groupKey);
      if (existing) existing.push(activity);
      else {
        const members = [activity];
        bySemanticKey.set(activity.groupKey, members);
        buckets.push(members);
      }
    }
  }
  return buckets.map((members) => {
    const newest = members[0];
    if (!newest) throw new Error('cannot finalize an empty GitHub activity group');
    if (members.length === 1 || !newest.aggregate) return publicEntry(newest);
    return { ...publicEntry(newest), id: `group:${JSON.stringify(members.map(({ id }) => id).sort())}`, phrase: groupedPhrase(newest.aggregate, members.length) };
  }).filter(isRenderableActivity);
}

function newestPushGroups(pushes: readonly PushRange[]): PushGroup[] {
  const groups = new Map<string, PushRange[]>();
  for (const push of pushes) {
    const key = semanticKey(push.repository, push.ref);
    const existing = groups.get(key);
    if (existing) existing.push(push);
    else groups.set(key, [push]);
  }
  return [...groups.values()].map((members) => {
    const sorted = [...members].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
    const oldest = sorted[0];
    const newest = sorted.at(-1);
    if (!oldest || !newest) throw new Error('cannot finalize an empty push group');
    return { ...newest, before: oldest.before, newestPushAt: newest.createdAt };
  }).sort((left, right) => Date.parse(right.newestPushAt) - Date.parse(left.newestPushAt)).slice(0, MAX_COMPARE_GROUPS);
}

function compareCommit(value: unknown): ComparedCommit | undefined {
  const commit = objectValue(value);
  const metadata = objectValue(commit?.commit);
  const committer = objectValue(metadata?.committer);
  const author = objectValue(metadata?.author);
  const sha = text(commit?.sha);
  const createdAt = text(committer?.date) ?? text(author?.date);
  return sha && SHA.test(sha) && createdAt && !Number.isNaN(Date.parse(createdAt)) ? { sha, createdAt } : undefined;
}

async function comparePushGroup(fetchImpl: typeof fetch, headers: Headers, group: PushGroup): Promise<Comparison | undefined> {
  const commits = new Map<string, ComparedCommit>();
  let expectedTotal: number | undefined;
  for (let page = 1; page <= MAX_COMPARE_PAGES; page += 1) {
    const url = `https://api.github.com/repos/${group.repository}/compare/${group.before}...${group.head}?per_page=${COMPARE_PAGE_SIZE}&page=${page}`;
    try {
      const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
      if (!response.ok) return undefined;
      const payload = objectValue(await readJsonBounded<unknown>(response, COMPARE_PAGE_BYTES));
      const total = integer(payload?.total_commits);
      const pageCommits = Array.isArray(payload?.commits) ? payload.commits : undefined;
      if (!payload || payload.status !== 'ahead' || !total || !pageCommits || (expectedTotal !== undefined && expectedTotal !== total)) return undefined;
      expectedTotal = total;
      for (const candidate of pageCommits) {
        const commit = compareCommit(candidate);
        if (!commit) return undefined;
        commits.set(commit.sha, commit);
      }
      if (commits.size === expectedTotal) return { repository: group.repository, commits: [...commits.values()] };
      if (pageCommits.length < COMPARE_PAGE_SIZE || commits.size > expectedTotal) return undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function deriveCommitActivity(fetchImpl: typeof fetch, headers: Headers, pushes: readonly PushRange[]): Promise<GitHubActivityEntry[]> {
  const comparisons = (await Promise.all(newestPushGroups(pushes).map((group) => comparePushGroup(fetchImpl, headers, group))))
    .filter((value): value is Comparison => value !== undefined);
  const byRepository = new Map<string, Map<string, ComparedCommit>>();
  for (const comparison of comparisons) {
    const commits = byRepository.get(comparison.repository) ?? new Map<string, ComparedCommit>();
    for (const commit of comparison.commits) commits.set(commit.sha, commit);
    byRepository.set(comparison.repository, commits);
  }
  return [...byRepository.entries()].flatMap(([repository, commits]) => {
    const values = [...commits.values()];
    if (values.length === 0) return [];
    const newest = values.reduce((latest, commit) => Date.parse(commit.createdAt) > Date.parse(latest.createdAt) ? commit : latest);
    const shas = values.map(({ sha }) => sha).sort();
    return [{ id: `commits:${repository}:${shas.length}:${shas[0]}:${shas.at(-1)}`, kind: 'commit' as const, phrase: `${values.length} commits to`, target: repository, url: `${repositoryUrl(repository)}/commits`, createdAt: newest.createdAt }];
  });
}

function githubHeaders(token?: string): Headers {
  const headers = new Headers({ accept: 'application/vnd.github+json', 'user-agent': 'postigo-portfolio', 'x-github-api-version': '2022-11-28' });
  if (token?.trim()) headers.set('authorization', `Bearer ${token.trim()}`);
  return headers;
}

export async function getGitHubActivity(fetchImpl: typeof fetch, token: string | undefined, observedAt: string): Promise<GitHubActivityView> {
  try {
    const headers = githubHeaders(token);
    const response = await fetchImpl(EVENTS_ENDPOINT, { headers, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (!response.ok) throw new Error('github upstream request failed');
    const payload = await readJsonBounded<unknown>(response);
    if (!Array.isArray(payload)) throw new Error('github upstream payload was not an array');
    const pushes = payload.map(normalizePushRange).filter((value): value is PushRange => value !== undefined);
    const discrete = payload.map(normalizeGitHubEvent).filter((value): value is NormalizedGitHubEvent => value !== undefined);
    const commits = await deriveCommitActivity(fetchImpl, headers, pushes);
    const entries = [...commits, ...groupDiscreteActivity(discrete)]
      .filter(isRenderableActivity)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, MAX_ENTRIES);
    return { state: 'ready', profileUrl: PROFILE_URL, login: 'postigodev', entries, observedAt };
  } catch {
    return { ...staticGitHubFallback };
  }
}
