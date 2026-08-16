export interface Bounds { x: number; y: number; width: number; height: number }
export interface Size { width: number; height: number }
export type ResizeEdge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface ProjectWindowDefinition {
  slug: string;
  title: string;
  defaultBounds: Bounds;
}

export interface ProjectWindowState {
  slug: string;
  title: string;
  isOpen: boolean;
  isMaximized: boolean;
  zIndex: number;
  bounds: Bounds;
  restoreBounds?: Bounds;
}

export interface ProjectWindowsState {
  windows: Record<string, ProjectWindowState>;
  activeSlug: string | null;
  nextZ: number;
}

export type ProjectWindowAction =
  | { type: 'open' | 'focus' | 'close'; slug: string }
  | { type: 'toggleMaximize'; slug: string; workspace: Bounds }
  | { type: 'setBounds'; slug: string; bounds: Bounds }
  | { type: 'workspaceChanged'; workspace: Bounds }
  | { type: 'restoreSnapshot'; openSlugs: readonly string[]; activeSlug: string | null };
