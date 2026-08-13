import { describe, expect, it } from 'vitest';
import { isGitHubSnapshotView, isNowPlayingView, progressAtTick } from './usePresence';

describe('presence payload validation', () => {
  it('accepts normalized playing and GitHub payloads', () => {
    expect(isNowPlayingView({
      state: 'playing', track: 'Track', artist: 'Artist', album: 'Album',
      artworkUrl: 'https://i.scdn.co/image/test', spotifyUrl: 'https://open.spotify.com/track/test',
      durationMs: 10_000, progressMs: 2_000, observedAt: 'now',
    })).toBe(true);
    expect(isGitHubSnapshotView({
      state: 'ready', profileUrl: 'https://github.com/postigodev', login: 'postigodev',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1', publicRepos: 5,
      followers: 3, stars: 7, languages: ['Rust'], observedAt: 'now',
    })).toBe(true);
  });

  it('rejects partial or account-selecting impostor payloads', () => {
    expect(isNowPlayingView({ state: 'playing', token: 'bad' })).toBe(false);
    expect(isGitHubSnapshotView({ state: 'ready', login: 'attacker' })).toBe(false);
  });
});

describe('playing progress', () => {
  it('advances in bounded one-second steps', () => {
    expect(progressAtTick(9_500, 10_000)).toBe(10_000);
    expect(progressAtTick(10_000, 10_000)).toBe(10_000);
  });
});
