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

export type GitHubActivityKind =
  | 'push'
  | 'pull-request'
  | 'issue'
  | 'comment'
  | 'review'
  | 'release'
  | 'repository-created'
  | 'repository-public'
  | 'fork'
  | 'star';

export interface GitHubActivityEntry {
  id: string;
  kind: GitHubActivityKind;
  phrase: string;
  target: string;
  detail?: string;
  url: string;
  createdAt: string;
}

export type GitHubActivityView =
  | { state: 'unavailable'; profileUrl: string; login: 'postigodev' }
  | {
      state: 'ready';
      profileUrl: string;
      login: 'postigodev';
      entries: readonly GitHubActivityEntry[];
      observedAt: string;
    };

export const unavailableNowPlaying: NowPlayingView = {
  state: 'unavailable',
  observedAt: 'static-fallback',
};

export const staticGitHubFallback: GitHubActivityView = {
  state: 'unavailable',
  profileUrl: 'https://github.com/postigodev',
  login: 'postigodev',
};
