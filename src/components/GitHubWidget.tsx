import { useMemo, useRef, useState } from 'preact/hooks';
import { staticGitHubFallback } from '../data/presence';
import { isGitHubActivityView, usePresenceEndpoint } from '../presence/usePresence';
import { GITHUB_VISIBLE_ROWS, githubActivityWindow, presentGitHubActivity } from './githubActivityPresentation';

const profileOverview = 'https://github.com/postigodev?tab=overview';

export { relativeGitHubTime } from './githubActivityPresentation';

export default function GitHubWidget() {
  const view = usePresenceEndpoint('/api/github-activity', staticGitHubFallback, isGitHubActivityView);
  const items = useMemo(() => presentGitHubActivity(view.state === 'ready' ? view.entries : []), [view]);
  const [selected, setSelected] = useState(0);
  const wheelLock = useRef(0);
  const touchStart = useRef<{ x: number; y: number }>();
  const suppressClickUntil = useRef(0);
  const safeSelected = items.length === 0 ? 0 : Math.min(selected, items.length - 1);
  const windowRange = githubActivityWindow(safeSelected, items.length);
  const visibleItems = items.slice(windowRange.start, windowRange.end);
  const selectedItem = items[safeSelected];

  function focusItem(index: number) {
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-github-index="${index}"]`)?.focus());
  }

  function moveSelection(index: number, focus = true) {
    if (items.length === 0) return;
    const next = Math.min(Math.max(index, 0), items.length - 1);
    setSelected(next);
    if (focus) focusItem(next);
  }

  function openItem(index = safeSelected) {
    const item = items[index];
    if (item) window.open(item.url, '_blank', 'noopener,noreferrer');
  }

  function handleWheel(event: WheelEvent) {
    if (Math.abs(event.deltaY) < 4 || Date.now() < wheelLock.current) return;
    const next = safeSelected + (event.deltaY > 0 ? 1 : -1);
    if (next < 0 || next >= items.length) return;
    event.preventDefault();
    wheelLock.current = Date.now() + 90;
    moveSelection(next, false);
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStart.current;
    const end = event.changedTouches[0];
    touchStart.current = undefined;
    if (!start || !end) return;
    const x = end.clientX - start.x;
    const y = end.clientY - start.y;
    if (Math.abs(y) < 32 || Math.abs(y) < Math.abs(x) * 1.25) return;
    suppressClickUntil.current = Date.now() + 300;
    moveSelection(safeSelected + (y < 0 ? 1 : -1), false);
  }

  return <div class="github-overview" data-github-widget>
    <div class="github-overview__noise" aria-hidden="true" />
    <header class="github-overview__header">
      <a href={view.profileUrl} target="_blank" rel="noreferrer">postigodev</a>
      <span>ACTIVITY</span>
    </header>

    <div class="github-overview__list-frame">
      {items.length > 0 ? <>
        <div class="github-overview__date-gutter" aria-hidden="true" />
        {safeSelected > 0 && <button class="github-overview__step github-overview__step--up" type="button" aria-label="Previous GitHub activity" onClick={() => moveSelection(safeSelected - 1)}>▲</button>}
        {safeSelected < items.length - 1 && <button class="github-overview__step github-overview__step--down" type="button" aria-label="Next GitHub activity" onClick={() => moveSelection(safeSelected + 1)}>▼</button>}
        <ol
          class="github-overview__list"
          role="listbox"
          aria-label="Recent GitHub activity"
          onWheel={handleWheel}
          onTouchStart={(event) => { const touch = event.touches[0]; if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }; }}
          onTouchEnd={handleTouchEnd}
        >
          {visibleItems.map((item, visibleIndex) => {
            const index = windowRange.start + visibleIndex;
            const previous = visibleItems[visibleIndex - 1];
            return <li
              key={item.id}
              class="github-overview__row"
              role="option"
              aria-selected={index === safeSelected}
              aria-label={item.accessibleLabel}
              tabIndex={index === safeSelected ? 0 : -1}
              data-github-index={index}
              onFocus={() => setSelected(index)}
              onClick={() => { if (Date.now() >= suppressClickUntil.current) setSelected(index); }}
              onDblClick={() => openItem(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') { event.preventDefault(); moveSelection(safeSelected + 1); }
                else if (event.key === 'ArrowUp') { event.preventDefault(); moveSelection(safeSelected - 1); }
                else if (event.key === 'Home') { event.preventDefault(); moveSelection(0); }
                else if (event.key === 'End') { event.preventDefault(); moveSelection(items.length - 1); }
                else if (event.key === 'Enter') { event.preventDefault(); openItem(); }
              }}
            >
              <span class="github-overview__date">{visibleIndex === 0 || previous?.dateKey !== item.dateKey ? item.dateLabel : ''}</span>
              <strong>{item.repository}</strong>
              <span class="github-overview__action">{item.action}</span>
              <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString()}>{item.age}</time>
            </li>;
          })}
          {Array.from({ length: GITHUB_VISIBLE_ROWS - visibleItems.length }, (_, index) => <li class="github-overview__row github-overview__row--blank" aria-hidden="true" key={`blank-${index}`} />)}
        </ol>
      </> : <div class="github-overview__status" role="status">
        {view.state === 'ready' ? 'NO RECENT PUBLIC ACTIVITY' : 'GITHUB ACTIVITY UNAVAILABLE'}
      </div>}
    </div>

    {selectedItem ? <a class="github-overview__detail" href={selectedItem.url} target="_blank" rel="noreferrer" aria-label={`Open ${selectedItem.accessibleLabel} on GitHub`}>
      <strong>{selectedItem.repository}</strong>
      <span>{selectedItem.action} / {selectedItem.target}{selectedItem.detail ? ` / ${selectedItem.detail}` : ''}</span>
    </a> : <a class="github-overview__detail" href={profileOverview} target="_blank" rel="noreferrer">
      <strong>postigodev</strong><span>open github profile</span>
    </a>}
  </div>;
}
