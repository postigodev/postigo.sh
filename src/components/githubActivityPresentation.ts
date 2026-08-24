import type { GitHubActivityEntry } from '../data/presence';

export const GITHUB_VISIBLE_ROWS = 6;

export interface GitHubMenuItem extends GitHubActivityEntry {
  repository: string;
  owner: string;
  action: string;
  dateKey: string;
  dateLabel: string;
  age: string;
  accessibleLabel: string;
}

export function relativeGitHubTime(createdAt: string, now = Date.now()): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 1_000));
  if (elapsedSeconds < 60) return 'now';
  if (elapsedSeconds < 3_600) return `${Math.floor(elapsedSeconds / 60)}m`;
  if (elapsedSeconds < 86_400) return `${Math.floor(elapsedSeconds / 3_600)}h`;
  return `${Math.floor(elapsedSeconds / 86_400)}d`;
}

function trimTerminalPhrase(phrase: string, terminal: string): string {
  return phrase.endsWith(terminal) ? phrase.slice(0, -terminal.length) : phrase;
}

function activityAction(activity: GitHubActivityEntry, owner: string): string {
  switch (activity.kind) {
    case 'commit': return trimTerminalPhrase(activity.phrase, ' to');
    case 'pull-request':
    case 'issue':
    case 'comment':
    case 'review': return trimTerminalPhrase(activity.phrase, ' in');
    case 'release': return trimTerminalPhrase(activity.phrase, ' for');
    case 'star': return `${owner} / ${activity.phrase}`;
    default: return activity.phrase;
  }
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const githubDateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });

export function presentGitHubActivity(entries: readonly GitHubActivityEntry[], now = Date.now()): GitHubMenuItem[] {
  return entries.map((activity) => {
    const [owner = activity.target, repository = activity.target] = activity.target.split('/');
    const createdAt = new Date(activity.createdAt);
    const action = activityAction(activity, owner);
    return {
      ...activity,
      repository,
      owner,
      action,
      dateKey: localDateKey(createdAt),
      dateLabel: githubDateFormatter.format(createdAt).toUpperCase(),
      age: relativeGitHubTime(activity.createdAt, now),
      accessibleLabel: `${activity.phrase} ${activity.target}${activity.detail ? `: ${activity.detail}` : ''}`,
    };
  });
}

export function githubActivityWindow(selected: number, total: number, visible = GITHUB_VISIBLE_ROWS): { start: number; end: number } {
  if (total <= 0) return { start: 0, end: 0 };
  const safeSelected = Math.min(Math.max(selected, 0), total - 1);
  const start = Math.min(Math.max(safeSelected - visible + 1, 0), Math.max(total - visible, 0));
  return { start, end: Math.min(start + visible, total) };
}
