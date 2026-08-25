import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { staticGitHubFallback } from '../data/presence';
import { isGitHubActivityView, usePresenceEndpoint } from '../presence/usePresence';
import {
  GITHUB_VISIBLE_ROWS,
  drawGitHubActivityCanvas,
  githubCanvasPoint,
  githubCanvasRowAt,
  githubScrollbarGeometry,
  type GitHubScrollbarGeometry,
} from './githubActivityCanvas';
import { presentGitHubActivity } from './githubActivityPresentation';

const profileOverview = 'https://github.com/postigodev?tab=overview';

export { relativeGitHubTime } from './githubActivityPresentation';

function contains(rect: { x: number; y: number; width: number; height: number }, point: { x: number; y: number }) {
  return point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height;
}

export default function GitHubWidget() {
  const view = usePresenceEndpoint('/api/github-activity', staticGitHubFallback, isGitHubActivityView);
  const items = useMemo(() => presentGitHubActivity(view.state === 'ready' ? view.entries : []), [view]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const [hover, setHover] = useState(-1);
  const wheelLock = useRef(0);
  const touchStart = useRef<{ x: number; y: number }>();
  const dragging = useRef<{ pointerId: number; offsetY: number }>();
  const total = items.length;
  const maxStart = Math.max(0, total - GITHUB_VISIBLE_ROWS);
  const safeSelected = total === 0 ? 0 : Math.min(Math.max(selected, 0), total - 1);
  const safeWindowStart = Math.min(Math.max(windowStart, 0), maxStart);
  const selectedItem = items[safeSelected];
  const status = view.state !== 'ready' ? 'unavailable' : total === 0 ? 'empty' : 'ready';
  const observation = view.state === 'ready' ? view.observedAt : view.state;

  useEffect(() => {
    setSelected(0);
    setWindowStart(0);
    setHover(-1);
  }, [observation]);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context) drawGitHubActivityCanvas(context, { items, selected: safeSelected, windowStart: safeWindowStart, hover, status });
  }, [items, safeSelected, safeWindowStart, hover, status]);

  function selectIndex(index: number, focus = false) {
    if (total === 0) return;
    const next = Math.min(Math.max(index, 0), total - 1);
    setSelected(next);
    setWindowStart((current) => {
      if (next < current) return next;
      if (next >= current + GITHUB_VISIBLE_ROWS) return next - GITHUB_VISIBLE_ROWS + 1;
      return Math.min(current, maxStart);
    });
    if (focus) requestAnimationFrame(() => canvasRef.current?.focus());
  }

  function applyWindowStart(start: number) {
    const nextStart = Math.min(Math.max(Math.round(start), 0), maxStart);
    setWindowStart(nextStart);
    setSelected((current) => Math.min(Math.max(current, nextStart), Math.min(total - 1, nextStart + GITHUB_VISIBLE_ROWS - 1)));
  }

  function openSelected() {
    if (selectedItem) window.open(selectedItem.url, '_blank', 'noopener,noreferrer');
  }

  function scrollbarAction(point: { x: number; y: number }, geometry: GitHubScrollbarGeometry): boolean {
    if (contains(geometry.topButton, point)) { selectIndex(safeSelected - 1, true); return true; }
    if (contains(geometry.bottomButton, point)) { selectIndex(safeSelected + 1, true); return true; }
    if (contains(geometry.track, point)) {
      applyWindowStart(safeWindowStart + (point.y < geometry.thumb.y ? -(GITHUB_VISIBLE_ROWS - 1) : GITHUB_VISIBLE_ROWS - 1));
      canvasRef.current?.focus();
      return true;
    }
    return false;
  }

  function handlePointerDown(event: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = githubCanvasPoint(canvas, event.clientX, event.clientY);
    const geometry = githubScrollbarGeometry(safeWindowStart, total);
    if (geometry && contains(geometry.thumb, point)) {
      dragging.current = { pointerId: event.pointerId, offsetY: point.y - geometry.thumb.y };
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }
    if (geometry && scrollbarAction(point, geometry)) { event.preventDefault(); return; }
    const row = githubCanvasRowAt(point.x, point.y, safeWindowStart, total);
    if (row !== undefined) selectIndex(row, true);
  }

  function handlePointerMove(event: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = githubCanvasPoint(canvas, event.clientX, event.clientY);
    const drag = dragging.current;
    const geometry = githubScrollbarGeometry(safeWindowStart, total);
    if (drag && geometry) {
      const travel = geometry.track.height - geometry.thumb.height;
      const thumbY = point.y - drag.offsetY;
      applyWindowStart(travel <= 0 ? 0 : (thumbY - geometry.track.y) / travel * maxStart);
      event.preventDefault();
      return;
    }
    setHover(githubCanvasRowAt(point.x, point.y, safeWindowStart, total) ?? -1);
  }

  function handlePointerUp(event: PointerEvent) {
    if (dragging.current?.pointerId === event.pointerId) {
      dragging.current = undefined;
      canvasRef.current?.releasePointerCapture(event.pointerId);
    }
  }

  function handleWheel(event: WheelEvent) {
    if (Math.abs(event.deltaY) < 4 || total === 0) return;
    event.preventDefault();
    if (Date.now() < wheelLock.current) return;
    const next = safeSelected + (event.deltaY > 0 ? 1 : -1);
    if (next < 0 || next >= total) return;
    wheelLock.current = Date.now() + 90;
    selectIndex(next);
  }

  function handleTouchEnd(event: TouchEvent) {
    const canvas = canvasRef.current;
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = undefined;
    if (!canvas || !start || !touch) return;
    const end = githubCanvasPoint(canvas, touch.clientX, touch.clientY);
    const x = end.x - start.x;
    const y = end.y - start.y;
    if (Math.abs(y) >= 18 && Math.abs(y) >= Math.abs(x) * 1.25) selectIndex(safeSelected + (y < 0 ? 1 : -1));
  }

  return <div class="github-overview" data-github-widget>
    <p class="sr-only" id="github-canvas-instructions">Use arrow keys to select activity. Press Enter to open the selected GitHub event.</p>
    <canvas
      ref={canvasRef}
      class="github-overview__canvas"
      width="320"
      height="144"
      tabIndex={0}
      aria-label="GitHub activity for postigodev"
      aria-describedby="github-canvas-instructions"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => { if (!dragging.current) setHover(-1); }}
      onDblClick={(event) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const point = githubCanvasPoint(canvas, event.clientX, event.clientY);
        const row = githubCanvasRowAt(point.x, point.y, safeWindowStart, total);
        if (row !== undefined) { selectIndex(row); window.open(items[row]?.url, '_blank', 'noopener,noreferrer'); }
      }}
      onWheel={handleWheel}
      onTouchStart={(event) => {
        const canvas = canvasRef.current;
        const touch = event.touches[0];
        if (canvas && touch) touchStart.current = githubCanvasPoint(canvas, touch.clientX, touch.clientY);
      }}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); selectIndex(safeSelected + 1); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); selectIndex(safeSelected - 1); }
        else if (event.key === 'Home') { event.preventDefault(); selectIndex(0); }
        else if (event.key === 'End') { event.preventDefault(); selectIndex(total - 1); }
        else if (event.key === 'Enter') { event.preventDefault(); openSelected(); }
      }}
    />
    <a class="github-overview__overlay github-overview__overlay--profile" href={view.profileUrl} target="_blank" rel="noreferrer">Open postigodev on GitHub</a>
    <a class="github-overview__overlay github-overview__overlay--detail" href={selectedItem?.url ?? profileOverview} target="_blank" rel="noreferrer">
      {selectedItem ? `Open ${selectedItem.accessibleLabel} on GitHub` : 'Open postigodev on GitHub'}
    </a>
    <span class="sr-only" aria-live="polite">{selectedItem?.accessibleLabel ?? (status === 'empty' ? 'No recent public GitHub activity' : 'GitHub activity unavailable')}</span>
    <ol class="sr-only" aria-label="Recent GitHub activity">
      {items.map((item) => <li key={item.id}><a href={item.url} target="_blank" rel="noreferrer" tabIndex={-1}>{item.accessibleLabel}, {item.dateLabel}, {item.age}</a></li>)}
    </ol>
  </div>;
}
