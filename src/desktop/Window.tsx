import type { ComponentChildren } from 'preact';
import type { WindowState } from './types';

interface Props {
  window: WindowState; active: boolean; children: ComponentChildren;
  onFocus: () => void; onClose: () => void; onMinimize: () => void; onMaximize: () => void;
  onMove: (x: number, y: number) => void;
}
export default function Window({ window: win, active, children, onFocus, onClose, onMinimize, onMaximize, onMove }: Props) {
  if (!win.isOpen || win.isMinimized) return null;
  const titleId = `window-title-${win.id.replace(':', '-')}`;
  const stateId = `${titleId}-state`;
  const startDrag = (event: PointerEvent) => {
    if (win.isMaximized || matchMedia('(max-width: 768px)').matches || (event.target as HTMLElement).closest('button')) return;
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    const windowElement = (event.currentTarget as HTMLElement).closest<HTMLElement>('.os-window');
    if (!windowElement) return;
    const rect = windowElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left; const offsetY = event.clientY - rect.top;
    const move = (moveEvent: PointerEvent) => {
      const maxX = Math.max(0, innerWidth - rect.width);
      const minY = 42;
      const maxY = Math.max(minY, innerHeight - 42 - rect.height);
      onMove(Math.max(0, Math.min(moveEvent.clientX - offsetX, maxX)), Math.max(minY, Math.min(moveEvent.clientY - offsetY, maxY)));
    };
    const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end, { once: true });
  };
  const style = win.isMaximized || win.placement === 'authored' ? { zIndex: win.zIndex } : { zIndex: win.zIndex, left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height };
  return <section class="os-window" data-window-id={win.id} data-placement={win.placement} data-active={active} data-maximized={win.isMaximized} role="region" aria-labelledby={titleId} aria-describedby={stateId} style={style} onPointerDown={onFocus}>
    <span id={stateId} class="sr-only">{active ? 'Active' : 'Inactive'} window. {win.isMaximized ? 'Maximized.' : 'Restored.'}</span>
    <div class="window-titlebar" onPointerDown={startDrag}>
      <h2 id={titleId} tabIndex={-1}>{win.title}</h2>
      <div class="window-controls"><button aria-label={`Minimize ${win.title}`} onClick={onMinimize}>—</button><button aria-label={`${win.isMaximized ? 'Restore' : 'Maximize'} ${win.title}`} onClick={onMaximize}>□</button><button aria-label={`Close ${win.title}`} onClick={onClose}>×</button></div>
    </div><div class="window-body">{children}</div>
  </section>;
}
