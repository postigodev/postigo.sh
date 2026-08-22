import { describe, expect, it } from 'vitest';
import { isGitHubActivityView, isNowPlayingView, progressAtTick } from './usePresence';

describe('presence payload validation', () => {
  it('accepts normalized playing and GitHub payloads', () => {
    expect(isNowPlayingView({ state: 'playing', track: 'Track', artist: 'Artist', album: 'Album', artworkUrl: 'https://i.scdn.co/image/test', spotifyUrl: 'https://open.spotify.com/track/test', durationMs: 10_000, progressMs: 2_000, observedAt: 'now' })).toBe(true);
    expect(isGitHubActivityView({ state: 'ready', profileUrl: 'https://github.com/postigodev', login: 'postigodev', entries: [{ id: '1', kind: 'push', phrase: 'pushed to', target: 'postigodev/postigo.sh', detail: 'main branch', url: 'https://github.com/postigodev/postigo.sh', createdAt: '2026-08-21T12:00:00Z' }], observedAt: 'now' })).toBe(true);
    expect(isGitHubActivityView({ state: 'ready', profileUrl: 'https://github.com/postigodev', login: 'postigodev', entries: [{ id: 'group', kind: 'push', phrase: '2 pushes to', target: 'postigodev/postigo.sh', url: 'https://github.com/postigodev/postigo.sh/tree/main', createdAt: '2026-08-21T12:00:00Z', oldestCreatedAt: '2026-08-21T07:00:00Z' }], observedAt: 'now' })).toBe(true);
  });

  it('rejects partial or account-selecting impostor payloads', () => {
    expect(isNowPlayingView({ state: 'playing', token: 'bad' })).toBe(false);
    expect(isGitHubActivityView({ state: 'ready', login: 'attacker' })).toBe(false);
    expect(isGitHubActivityView({ state: 'ready', profileUrl: 'https://github.com/postigodev', login: 'postigodev', entries: [{ id: '1', kind: 'push', phrase: 'pushed to', target: 'repo', url: 'https://example.com/steal', createdAt: '2026-08-21T12:00:00Z' }], observedAt: 'now' })).toBe(false);
    expect(isGitHubActivityView({ state: 'ready', profileUrl: 'https://github.com/postigodev', login: 'postigodev', entries: [{ id: '1', kind: 'push', phrase: 'pushed to', target: 'repo', url: 'https://github.com/postigodev/repo', createdAt: '2026-08-21T12:00:00Z', oldestCreatedAt: '2026-08-22T12:00:00Z' }], observedAt: 'now' })).toBe(false);
  });
});

describe('playing progress', () => {
  it('advances in bounded one-second steps', () => {
    expect(progressAtTick(9_500, 10_000)).toBe(10_000);
    expect(progressAtTick(10_000, 10_000)).toBe(10_000);
  });
});
