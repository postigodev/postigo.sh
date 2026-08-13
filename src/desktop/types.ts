export interface Bounds { x: number; y: number; width: number; height: number }
export interface WindowState {
  id: string; title: string; isOpen: boolean; isMinimized: boolean; isMaximized: boolean;
  zIndex: number; bounds: Bounds; restoreBounds?: Bounds; projectSlug?: string;
}
export interface DesktopState { windows: Record<string, WindowState>; activeId: string | null; nextZ: number }
export type DesktopAction =
  | { type: 'open'; id: 'identity' | 'work' }
  | { type: 'openProject'; slug: string }
  | { type: 'close' | 'focus' | 'minimize' | 'restore' | 'toggleMaximize'; id: string }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'reset' };
