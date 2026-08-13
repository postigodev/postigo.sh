import type { NowPlayingView } from '../../data/presence';

function formatDuration(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function NowPlayingApp({ view }: { view: NowPlayingView }) {
  if (view.state === 'unavailable') return <div class="now-playing-app" data-now-playing>
    <p class="presence-state">PLAYBACK_UNAVAILABLE</p>
    <p>Personal Spotify presence is offline.</p>
  </div>;

  return <div class="now-playing-app" data-now-playing>
    <p class="presence-state">{view.state === 'playing' ? 'NOW PLAYING' : 'LAST PLAYED'}</p>
    <a href={view.spotifyUrl} target="_blank" rel="noreferrer" aria-label={`${view.track} on Spotify`}>
      <img src={view.artworkUrl} alt="" width="72" height="72" />
      <span><strong>{view.track}</strong><span>{view.artist}</span><small>{view.album}</small></span>
    </a>
    <div class="player-time" aria-hidden="true"><span>{formatDuration(view.progressMs ?? 0)}</span><span>{formatDuration(view.durationMs)}</span></div>
  </div>;
}
