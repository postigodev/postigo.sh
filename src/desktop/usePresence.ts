import { useEffect, useState } from 'preact/hooks';
import type { GitHubSnapshotView, NowPlayingView } from '../data/presence';

type Validator<T> = (value: unknown) => value is T;

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function webUrl(value: unknown): value is string {
  if (!nonEmpty(value)) return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function nonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isNowPlayingView(value: unknown): value is NowPlayingView {
  const view = objectValue(value);
  if (!view || !nonEmpty(view.observedAt)) return false;
  if (view.state === 'unavailable') return true;
  if (view.state !== 'playing' && view.state !== 'recent') return false;
  return nonEmpty(view.track)
    && nonEmpty(view.artist)
    && nonEmpty(view.album)
    && webUrl(view.artworkUrl)
    && webUrl(view.spotifyUrl)
    && nonNegativeNumber(view.durationMs)
    && view.durationMs > 0
    && (view.progressMs === undefined || nonNegativeNumber(view.progressMs));
}

export function isGitHubSnapshotView(value: unknown): value is GitHubSnapshotView {
  const view = objectValue(value);
  if (!view || view.login !== 'postigodev' || view.profileUrl !== 'https://github.com/postigodev' || !webUrl(view.avatarUrl)) return false;
  if (view.state === 'unavailable') return true;
  if (view.state !== 'ready' || !nonEmpty(view.observedAt)) return false;
  return nonNegativeNumber(view.publicRepos)
    && nonNegativeNumber(view.followers)
    && nonNegativeNumber(view.stars)
    && Array.isArray(view.languages)
    && view.languages.every(nonEmpty);
}

export function usePresenceEndpoint<T>(url: string, fallback: T, validate: Validator<T>): T {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const controller = new AbortController();
    setValue(fallback);
    fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<unknown> : undefined)
      .then((next) => { if (validate(next)) setValue(next); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [url, fallback, validate]);
  return value;
}

export function progressAtTick(progress: number, duration: number): number {
  return Math.min(duration, progress + 1_000);
}

export function usePlayingProgress(view: NowPlayingView): number | undefined {
  const initial = view.state === 'unavailable' ? undefined : Math.min(view.durationMs, view.progressMs ?? 0);
  const [progress, setProgress] = useState<number | undefined>(initial);
  const state = view.state;
  const observedAt = view.observedAt;
  const track = view.state === 'unavailable' ? '' : view.track;
  const progressMs = view.state === 'unavailable' ? undefined : view.progressMs;
  const durationMs = view.state === 'unavailable' ? 0 : view.durationMs;

  useEffect(() => {
    if (state === 'unavailable') {
      setProgress(undefined);
      return;
    }
    setProgress(Math.min(durationMs, progressMs ?? 0));
    if (state !== 'playing') return;
    const timer = window.setInterval(() => setProgress((current) => progressAtTick(current ?? 0, durationMs)), 1_000);
    return () => window.clearInterval(timer);
  }, [state, observedAt, track, progressMs, durationMs]);
  return progress;
}
