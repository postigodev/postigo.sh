import { createPortal } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { MediaLogEntry, MediaLogResponse } from '../data/media-log';

const sources = {
  film: { name: 'Letterboxd', url: 'https://letterboxd.com/postigovich/', icon: '/images/icons/letterboxd.svg' },
  game: { name: 'Steam', url: 'https://steamcommunity.com/id/osintax/', icon: '/images/icons/steam.svg' },
  book: { name: 'Hardcover', url: 'https://hardcover.app/@postigo', icon: '/images/icons/hardcover.svg' },
} as const;

function isEntry(value: unknown): value is MediaLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return ['film', 'game', 'book'].includes(String(entry.kind))
    && typeof entry.title === 'string'
    && typeof entry.artworkUrl === 'string'
    && entry.artworkUrl.startsWith('https://');
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return <span class="media-rating" aria-label={`${rounded} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, index) => {
      const amount = rounded - index;
      const src = amount >= 1 ? '/images/icons/star.svg' : amount >= .5 ? '/images/icons/star-half.svg' : '/images/icons/star-empty.svg';
      return <img key={index} src={src} alt="" />;
    })}
  </span>;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export default function MediaLogWidget() {
  const [entries, setEntries] = useState<MediaLogEntry[]>([]);
  const [active, setActive] = useState<MediaLogEntry>();
  const [position, setPosition] = useState({ left: 9, top: 9 });
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/media-log', { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<MediaLogResponse> : Promise.reject())
      .then((body) => setEntries(Array.isArray(body.entries) ? body.entries.filter(isEntry) : []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!active) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setActive(undefined);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setActive(undefined); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [active]);

  function place(clientX: number, clientY: number) {
    const rect = tooltipRef.current?.getBoundingClientRect();
    const width = rect?.width ?? Math.min(286, window.innerWidth - 18);
    const height = rect?.height ?? 360;
    let left = clientX + 16;
    if (left + width > window.innerWidth - 9) left = clientX - width - 16;
    setPosition({ left: Math.max(9, left), top: Math.max(9, Math.min(clientY - height * .46, window.innerHeight - height - 9)) });
  }

  function showFromElement(entry: MediaLogEntry, element: HTMLElement) {
    setActive(entry);
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      place(rect.right, rect.top + rect.height / 2);
    });
  }

  const tooltip = active && typeof document !== 'undefined' ? createPortal(
    <div ref={tooltipRef} id="media-tooltip" class="media-tooltip is-visible" role="tooltip" style={position}>
      <div class="media-tooltip__bar"><span>media preview</span><span>×</span></div>
      <div class="media-tooltip__art"><img src={active.artworkUrl} alt={`${active.title} artwork`} /></div>
      <div class="media-tooltip__foot"><strong>{active.title}</strong><span>{sources[active.kind].name.toUpperCase()}</span></div>
    </div>, document.body) : null;

  return <div ref={rootRef} class="media-list">
    {entries.map((entry) => {
      const source = sources[entry.kind];
      return <article class="media-entry" data-media-entry data-kind={entry.kind} key={entry.kind}>
        <div class="media-entry__head"><span class="media-entry__kind">{entry.activity}</span><img class="media-entry__source-icon" src={source.icon} alt="" /></div>
        <button
          type="button"
          class="media-entry__title"
          aria-describedby={active === entry ? 'media-tooltip' : undefined}
          aria-expanded={active === entry}
          onPointerEnter={(event) => { if (event.pointerType === 'mouse') { setActive(entry); place(event.clientX, event.clientY); } }}
          onPointerMove={(event) => { if (event.pointerType === 'mouse' && active === entry) place(event.clientX, event.clientY); }}
          onPointerLeave={(event) => { if (event.pointerType === 'mouse') setActive(undefined); }}
          onFocus={(event) => showFromElement(entry, event.currentTarget)}
          onBlur={() => setActive(undefined)}
          onClick={(event) => { active === entry ? setActive(undefined) : showFromElement(entry, event.currentTarget); }}
        >{entry.title}{entry.kind === 'film' && entry.year ? <span class="media-entry__year"> ({entry.year})</span> : null}</button>
        <div class="media-meta">
          {entry.kind === 'film' && <><span>{formatDate(entry.occurredAt)}</span>{entry.rating ? <><span>·</span><Stars rating={entry.rating} /></> : null}</>}
          {entry.kind === 'game' && entry.totalHours !== undefined && <span>{entry.totalHours.toLocaleString()} hrs total</span>}
          {entry.kind === 'book' && <>{entry.author && <span>{entry.author}</span>}{entry.author && entry.progressPercent !== undefined && <span>·</span>}{entry.progressPercent !== undefined && <span>{entry.progressPercent}%</span>}</>}
        </div>
        {entry.kind === 'book' && entry.progressPercent !== undefined && <div class="media-progress" aria-label={`${entry.progressPercent} percent read`}><span style={{ width: `${entry.progressPercent}%` }} /></div>}
        <div class="media-via"><span>via</span><img src={source.icon} alt="" /><a href={source.url} target="_blank" rel="noreferrer"><strong>{source.name}</strong></a></div>
      </article>;
    })}
    {tooltip}
  </div>;
}

