export type NowPlayingView =
  | { state: 'unavailable'; observedAt: string }
  | {
      state: 'playing' | 'recent';
      track: string;
      artist: string;
      album: string;
      artworkUrl: string;
      spotifyUrl: string;
      durationMs: number;
      progressMs?: number;
      observedAt: string;
    };

export type GitHubSnapshotView =
  | { state: 'unavailable'; profileUrl: string; login: 'postigodev'; avatarUrl: string }
  | {
      state: 'ready';
      profileUrl: string;
      login: 'postigodev';
      avatarUrl: string;
      publicRepos: number;
      followers: number;
      stars: number;
      languages: readonly string[];
      observedAt: string;
    };

export const unavailableNowPlaying: NowPlayingView = {
  state: 'unavailable',
  observedAt: 'static-fallback',
};

export const staticGitHubFallback: GitHubSnapshotView = {
  state: 'unavailable',
  profileUrl: 'https://github.com/postigodev',
  login: 'postigodev',
  avatarUrl: 'https://avatars.githubusercontent.com/u/247466788?v=4',
};
