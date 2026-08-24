import { useEffect, useRef } from 'preact/hooks';
import { unavailableNowPlaying } from '../data/presence';
import { isNowPlayingView, usePlayingProgress, usePresenceEndpoint } from '../presence/usePresence';

type Rgb = { r: number; g: number; b: number; count: number };
type Hsl = { h: number; s: number; l: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function rgbToHsl({ r, g, b }: Pick<Rgb, 'r' | 'g' | 'b'>): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  const lightness = (max + min) / 2;

  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6;
    else if (max === green) hue = ((blue - red) / delta + 2) / 6;
    else hue = ((red - green) / delta + 4) / 6;
  }

  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { h: hue * 360, s: saturation * 100, l: lightness * 100 };
}

const hslCss = ({ h, s, l }: Hsl) => `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`;
const distance = (a: Rgb, b: Rgb) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

function coverPalette(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return undefined;
  canvas.width = 32;
  canvas.height = 32;
  context.drawImage(image, 0, 0, 32, 32);
  const pixels = context.getImageData(0, 0, 32, 32).data;
  const buckets = new Map<string, Rgb>();

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 200) continue;
    const source = { r: pixels[index], g: pixels[index + 1], b: pixels[index + 2] };
    const sourceHsl = rgbToHsl(source);
    if (sourceHsl.l < 6 || sourceHsl.l > 94) continue;
    const quantized = {
      r: clamp(Math.round(source.r / 24) * 24, 0, 255),
      g: clamp(Math.round(source.g / 24) * 24, 0, 255),
      b: clamp(Math.round(source.b / 24) * 24, 0, 255),
    };
    const key = `${quantized.r},${quantized.g},${quantized.b}`;
    const current = buckets.get(key);
    buckets.set(key, { ...quantized, count: (current?.count ?? 0) + 1 });
  }

  const candidates = [...buckets.values()]
    .map((color) => ({ color, hsl: rgbToHsl(color) }))
    .filter(({ hsl }) => hsl.s > 10)
    .sort((a, b) => b.color.count * (1 + b.hsl.s / 130) - a.color.count * (1 + a.hsl.s / 130));
  if (!candidates.length) return undefined;

  const primary = candidates[0];
  const secondary = candidates.find(({ color }) => distance(primary.color, color) > 60) ?? candidates[1] ?? primary;
  const tertiary = candidates.find(({ color }) => distance(primary.color, color) > 80 && distance(secondary.color, color) > 55) ?? secondary;
  return {
    dark: hslCss({ h: primary.hsl.h, s: clamp(primary.hsl.s, 38, 78), l: 23 }),
    mid: hslCss({ h: secondary.hsl.h, s: clamp(secondary.hsl.s, 42, 82), l: 43 }),
    light: hslCss({ h: tertiary.hsl.h, s: clamp(tertiary.hsl.s, 35, 75), l: 72 }),
    muted: hslCss({ h: primary.hsl.h, s: clamp(primary.hsl.s * .75, 25, 65), l: 36 }),
  };
}

function PlayerFooter({ label }: { label: string }) {
  return <div class="spotify-player__footer">
    <div class="spotify-player__status-field">
      <img src="/images/icons/music.svg" alt="" aria-hidden="true" />
      <span>{label}</span>
    </div>
    <span class="spotify-player__battery" aria-hidden="true"><i /><i /><i /></span>
  </div>;
}

export default function NowPlayingWidget() {
  const view = usePresenceEndpoint('/api/now-playing', unavailableNowPlaying, isNowPlayingView);
  const progress = usePlayingProgress(view);
  const rootRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLImageElement>(null);
  const artworkUrl = view.state === 'unavailable' ? undefined : view.artworkUrl;

  useEffect(() => {
    const module = rootRef.current?.closest<HTMLElement>('#latest');
    const image = artworkRef.current;
    if (!module) return;
    const properties = ['--spotify-dark', '--spotify-mid', '--spotify-light', '--spotify-muted'];
    const reset = () => {
      properties.forEach((property) => module.style.removeProperty(property));
      module.dataset.spotifyPalette = 'fallback';
    };
    reset();
    if (!image || !artworkUrl) return reset;

    const apply = () => {
      try {
        const palette = coverPalette(image);
        if (!palette) return;
        module.style.setProperty('--spotify-dark', palette.dark);
        module.style.setProperty('--spotify-mid', palette.mid);
        module.style.setProperty('--spotify-light', palette.light);
        module.style.setProperty('--spotify-muted', palette.muted);
        module.dataset.spotifyPalette = 'artwork';
      } catch {
        reset();
      }
    };

    if (image.complete && image.naturalWidth) apply();
    else image.addEventListener('load', apply, { once: true });
    return () => {
      image.removeEventListener('load', apply);
      reset();
    };
  }, [artworkUrl]);

  if (view.state === 'unavailable') return <div ref={rootRef} class="spotify-player spotify-player--unavailable" data-now-playing>
    <div class="spotify-player__screen">
      <div class="spotify-player__album spotify-player__album--empty" aria-hidden="true">
        <img src="/images/icons/spotify.svg" alt="" />
      </div>
      <div class="spotify-player__track">
        <span class="spotify-player__label">OFFLINE</span>
        <strong>Spotify unavailable</strong>
        <span>Playback will return when the endpoint responds.</span>
      </div>
    </div>
    <PlayerFooter label="presence unavailable" />
  </div>;

  const percent = Math.min(100, ((progress ?? 0) / view.durationMs) * 100);
  const playing = view.state === 'playing';
  return <div ref={rootRef} class={`spotify-player${playing ? ' is-playing' : ''}`} data-now-playing data-playback-state={view.state}>
    <div class="spotify-player__screen">
      <div class="spotify-player__album">
        <img ref={artworkRef} crossOrigin="anonymous" src={view.artworkUrl} alt={`${view.album} — ${view.artist}`} />
      </div>
      <div class="spotify-player__track">
        <span class="spotify-player__label">{playing ? 'NOW PLAYING' : 'LAST PLAYED'}</span>
        <a href={view.spotifyUrl} target="_blank" rel="noreferrer" aria-label={`${view.track} on Spotify`}><strong>{view.track}</strong></a>
        <span>{view.artist}</span>
        <small>{view.album}</small>
        <span class="spotify-player__progress" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span>
      </div>
    </div>
    <PlayerFooter label={playing ? 'now playing' : 'last played'} />
  </div>;
}
