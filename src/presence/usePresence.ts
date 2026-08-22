import { useEffect, useState } from 'preact/hooks';
import type { GitHubActivityView, NowPlayingView } from '../data/presence';

type Validator<T> = (value: unknown) => value is T;
const objectValue = (value: unknown): Record<string, unknown> | undefined => value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined;
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const nonNegativeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function webUrl(value: unknown): value is string {
  if (!nonEmpty(value)) return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function isNowPlayingView(value: unknown): value is NowPlayingView {
  const view = objectValue(value);
  if (!view || !nonEmpty(view.observedAt)) return false;
  if (view.state === 'unavailable') return true;
  if (view.state !== 'playing' && view.state !== 'recent') return false;
  return nonEmpty(view.track) && nonEmpty(view.artist) && nonEmpty(view.album)
    && webUrl(view.artworkUrl) && webUrl(view.spotifyUrl)
    && nonNegativeNumber(view.durationMs) && view.durationMs > 0
    && (view.progressMs === undefined || nonNegativeNumber(view.progressMs));
}

export function isGitHubActivityView(value: unknown): value is GitHubActivityView {
  const view = objectValue(value);
  if (!view || view.login !== 'postigodev' || view.profileUrl !== 'https://github.com/postigodev') return false;
  if (view.state === 'unavailable') return true;
  if (view.state !== 'ready' || !nonEmpty(view.observedAt)) return false;
  if (!Array.isArray(view.entries) || view.entries.length > 20) return false;
  return view.entries.every((candidate) => {
    const activity = objectValue(candidate);
    return activity !== undefined
      && nonEmpty(activity.id)
      && ['push', 'pull-request', 'issue', 'comment', 'review', 'release', 'repository-created', 'repository-public', 'fork', 'star'].includes(String(activity.kind))
      && nonEmpty(activity.phrase)
      && nonEmpty(activity.target)
      && (activity.detail === undefined || nonEmpty(activity.detail))
      && webUrl(activity.url)
      && new URL(activity.url).hostname === 'github.com'
      && nonEmpty(activity.createdAt)
      && !Number.isNaN(Date.parse(activity.createdAt));
  });
}

export function usePresenceEndpoint<T>(url: string, fallback: T, validate: Validator<T>, enabled = true): T {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    if (!enabled) { setValue(fallback); return; }
    const controller = new AbortController();
    setValue(fallback);
    fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<unknown> : undefined)
      .then((next) => { if (validate(next)) setValue(next); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [url, fallback, validate, enabled]);
  return value;
}

export const progressAtTick = (progress: number, duration: number) => Math.min(duration, progress + 1_000);

export function usePlayingProgress(view: NowPlayingView): number | undefined {
  const initial = view.state === 'unavailable' ? undefined : Math.min(view.durationMs, view.progressMs ?? 0);
  const [progress, setProgress] = useState<number | undefined>(initial);
  const state = view.state;
  const observedAt = view.observedAt;
  const track = view.state === 'unavailable' ? '' : view.track;
  const progressMs = view.state === 'unavailable' ? undefined : view.progressMs;
  const durationMs = view.state === 'unavailable' ? 0 : view.durationMs;

  useEffect(() => {
    if (state === 'unavailable') { setProgress(undefined); return; }
    setProgress(Math.min(durationMs, progressMs ?? 0));
    if (state !== 'playing') return;
    const timer = window.setInterval(() => setProgress((current) => progressAtTick(current ?? 0, durationMs)), 1_000);
    return () => window.clearInterval(timer);
  }, [state, observedAt, track, progressMs, durationMs]);
  return progress;
}
