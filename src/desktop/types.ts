export interface Bounds { x: number; y: number; width: number; height: number }
export interface Size { width: number; height: number }
export type CoreAppId = 'identity' | 'about' | 'work' | 'resume' | 'contact' | 'privacy' | 'network' | 'now-playing' | 'notes';
export type ProjectAppId = `project:${string}`;
export type AppId = CoreAppId | ProjectAppId;
export type AppKind = CoreAppId | 'project';
export type ResizeEdge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type MobileMode = 'fullscreen' | 'near-fullscreen';

export interface AppDefinition {
  id: AppId;
  title: string;
  icon: 'user' | 'folder' | 'document' | 'mail' | 'network' | 'music' | 'notes' | 'lock' | 'project';
  kind: AppKind;
  route?: string;
  projectSlug?: string;
  defaultBounds: Bounds;
  minSize: Size;
  mobileMode: MobileMode;
  showOnDesktop: boolean;
  showInStart: boolean;
  desktopLabel?: string;
  startLabel?: string;
}

export type AppRegistry = ReadonlyMap<AppId, AppDefinition>;

export type WindowPlacement = 'authored' | 'floating';
export interface WindowState {
  id: AppId; title: string; isOpen: boolean; isMinimized: boolean; isMaximized: boolean;
  zIndex: number; bounds: Bounds; restoreBounds?: Bounds; projectSlug?: string;
  /** Compatibility-only until the authored shell is removed in Task 5. */
  placement?: WindowPlacement;
}
export interface DesktopState { windows: Record<string, WindowState>; activeId: AppId | null; nextZ: number }
export type DesktopAction =
  | { type: 'open' | 'focus' | 'close' | 'minimize' | 'restore'; id: AppId }
  | { type: 'openProject'; slug: string; title: string }
  | { type: 'toggleMaximize'; id: AppId; workspace?: Bounds }
  | { type: 'setBounds'; id: AppId; bounds: Bounds }
  | { type: 'workspaceChanged'; workspace: Bounds }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'reset'; state?: DesktopState };
