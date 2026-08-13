import type { WindowState } from './types';
interface Props { windows: WindowState[]; activeId: string | null; menuOpen: boolean; onToggleMenu: () => void; onActivate: (id: string) => void }
export default function Taskbar({ windows, activeId, menuOpen, onToggleMenu, onActivate }: Props) {
  return <div class="taskbar"><button class="start-button" aria-expanded={menuOpen} onClick={onToggleMenu}>START</button><div class="taskbar-items">{windows.filter((win) => win.isOpen).map((win) => <button data-taskbar-id={win.id} aria-pressed={activeId === win.id} onClick={() => onActivate(win.id)}>{win.title}</button>)}</div><span>SYSTEM_READY</span></div>;
}
