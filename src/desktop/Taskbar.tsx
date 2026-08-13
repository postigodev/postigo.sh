import Clock from './Clock';
import type { AppId, WindowState } from './types';

interface Props {
  windows: WindowState[];
  activeId: AppId | null;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onActivate: (id: AppId) => void;
}

export default function Taskbar({ windows, activeId, menuOpen, onToggleMenu, onActivate }: Props) {
  return <footer class="taskbar" aria-label="Desktop taskbar">
    <button data-start-button class="start-button" aria-expanded={menuOpen} onClick={onToggleMenu}><span aria-hidden="true">🐐</span> Piero OS</button>
    <div class="taskbar-items">{windows.filter((win) => win.isOpen).map((win) => <button key={win.id} data-taskbar-id={win.id} aria-pressed={activeId === win.id} onClick={() => onActivate(win.id)}>{win.title}</button>)}</div>
    <Clock />
  </footer>;
}
