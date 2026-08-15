import { unavailableNowPlaying } from '../data/presence';
import { isNowPlayingView, usePlayingProgress, usePresenceEndpoint } from '../desktop/usePresence';

export default function NowPlayingWidget() {
  const view = usePresenceEndpoint('/api/now-playing', unavailableNowPlaying, isNowPlayingView);
  const progress = usePlayingProgress(view);

  if (view.state === 'unavailable') return <div class="now-playing-widget" data-now-playing>
    <span class="disc" aria-hidden="true" />
    <div>
      <strong>Spotify presence is unavailable.</strong>
      <p>Playback will appear here when the public endpoint responds.</p>
    </div>
  </div>;

  const percent = Math.min(100, ((progress ?? 0) / view.durationMs) * 100);
  return <div class="now-playing-widget" data-now-playing>
    <span class="disc" aria-hidden="true" />
    <div class="now-playing-widget__copy">
      <span class="presence-label">{view.state === 'playing' ? 'now playing' : 'last played'}</span>
      <a href={view.spotifyUrl} target="_blank" rel="noreferrer" aria-label={`${view.track} on Spotify`}><strong>{view.track}</strong></a>
      <span>{view.artist}</span>
      <small>{view.album}</small>
      <span class="playback-bar" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span>
    </div>
  </div>;
}
