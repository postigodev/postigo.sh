export interface Bounds { x: number; y: number; width: number; height: number }
export interface Size { width: number; height: number }
export type CoreAppId = 'identity' | 'work' | 'resume' | 'contact' | 'privacy' | 'network' | 'now-playing' | 'notes';
export type ProjectAppId = `project:${string}`;
export type AppId = CoreAppId | ProjectAppId;
export type AppKind = CoreAppId | 'project';
export type AppIconName = 'user' | 'folder' | 'document' | 'mail' | 'network' | 'music' | 'notes' | 'lock' | 'project';
export type StartGroup = 'portfolio' | 'utilities' | 'policy';
export type ContentWidth = 'editorial' | 'case' | 'utility';
export type ResizeEdge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type MobileMode = 'fullscreen' | 'near-fullscreen';

export interface AppDefinition {
  id: AppId;
  title: string;
  icon: AppIconName;
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
  startGroup?: StartGroup;
  contentWidth: ContentWidth;
}

export type AppRegistry = ReadonlyMap<AppId, AppDefinition>;

export interface WindowState {
  id: AppId; title: string; isOpen: boolean; isMinimized: boolean; isMaximized: boolean;
  zIndex: number; bounds: Bounds; restoreBounds?: Bounds; projectSlug?: string;
}
export interface DesktopState { windows: Record<string, WindowState>; activeId: AppId | null; nextZ: number }
export type DesktopAction =
  | { type: 'open' | 'focus' | 'close' | 'minimize' | 'restore'; id: AppId }
  | { type: 'toggleMaximize'; id: AppId; workspace?: Bounds }
  | { type: 'setBounds'; id: AppId; bounds: Bounds }
  | { type: 'workspaceChanged'; workspace: Bounds }
  | { type: 'reset'; state?: DesktopState };
