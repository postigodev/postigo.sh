import type { ComponentChildren } from 'preact';
import type { AppDefinition, Bounds, ResizeEdge, WindowState } from './types';
import { capturePointerGesture } from './pointerGesture';
import { clampForRecovery, resizeBounds } from './windowGeometry';

interface Props {
  window: WindowState;
  definition: AppDefinition;
  workspace: Bounds;
  compact: boolean;
  active: boolean;
  children: ComponentChildren;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onBoundsChange: (bounds: Bounds) => void;
}

const resizeEdges = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;

export default function Window({ window: win, definition, workspace, compact, active, children, onFocus, onClose, onMinimize, onMaximize, onBoundsChange }: Props) {
  if (!win.isOpen || win.isMinimized) return null;
  const titleId = `window-title-${win.id.replace(':', '-')}`;
  const stateId = `${titleId}-state`;

  const startDrag = (event: PointerEvent) => {
    if (compact || win.isMaximized || (event.target as HTMLElement).closest('[data-window-control]')) return;
    event.preventDefault();
    const origin = { x: event.clientX, y: event.clientY };
    const start = { ...win.bounds };
    capturePointerGesture(event, (move) => {
      onBoundsChange(clampForRecovery({
        ...start,
        x: start.x + move.clientX - origin.x,
        y: start.y + move.clientY - origin.y,
      }, workspace));
    }, onFocus);
  };

  const startResize = (edge: ResizeEdge) => (event: PointerEvent) => {
    if (compact || win.isMaximized) return;
    event.preventDefault();
    event.stopPropagation();
    const origin = { x: event.clientX, y: event.clientY };
    const start = { ...win.bounds };
    capturePointerGesture(event, (move) => {
      onBoundsChange(resizeBounds(
        start,
        edge,
        move.clientX - origin.x,
        move.clientY - origin.y,
        definition.minSize,
        workspace,
      ));
    }, onFocus);
  };

  const style = win.placement === 'authored'
    ? { zIndex: win.zIndex }
    : { zIndex: win.zIndex, left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height };

  return <section
    class="os-window"
    data-window-id={win.id}
    data-placement={win.placement}
    data-active={active}
    data-maximized={win.isMaximized}
    data-mobile-mode={definition.mobileMode}
    role="region"
    aria-labelledby={titleId}
    aria-describedby={stateId}
    style={style}
    onPointerDown={onFocus}
  >
    <span id={stateId} class="sr-only">{active ? 'Active' : 'Inactive'} window. {win.isMaximized ? 'Maximized.' : 'Restored.'}</span>
    <div class="window-titlebar" onPointerDown={startDrag}>
      <h2 id={titleId} tabIndex={-1}>{win.title}</h2>
      <div class="window-controls">
        <button data-window-control aria-label={`Minimize ${win.title}`} onClick={onMinimize}>_</button>
        <button data-window-control aria-label={`${win.isMaximized ? 'Restore' : 'Maximize'} ${win.title}`} onClick={onMaximize}>□</button>
        <button data-window-control aria-label={`Close ${win.title}`} onClick={onClose}>×</button>
      </div>
    </div>
    <div class="window-body">{children}</div>
    {!compact && !win.isMaximized && win.placement !== 'authored' && resizeEdges.map((edge) => <span key={edge} class={`resize-handle resize-handle--${edge}`} data-resize-handle={edge} onPointerDown={startResize(edge)} />)}
  </section>;
}
