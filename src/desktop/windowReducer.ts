import type { AppId, AppRegistry, DesktopAction, DesktopState, WindowState } from './types';
import { revalidateBounds } from './windowGeometry';

export function createInitialDesktopState(registry: AppRegistry, boot: readonly AppId[]): DesktopState {
  const windows = Object.fromEntries([...registry.values()].map((app) => [app.id, {
    id: app.id,
    title: app.title,
    projectSlug: app.projectSlug,
    isOpen: boot.includes(app.id),
    isMinimized: false,
    isMaximized: false,
    zIndex: boot.indexOf(app.id) + 1,
    bounds: { ...app.defaultBounds },
  } satisfies WindowState])) as Record<string, WindowState>;
  return { windows, activeId: boot.at(-1) ?? null, nextZ: boot.length + 1 };
}

function highestVisible(state: DesktopState, excluded?: AppId): AppId | null {
  return Object.values(state.windows)
    .filter((win) => win.id !== excluded && win.isOpen && !win.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null;
}

function focus(state: DesktopState, id: AppId): DesktopState {
  const win = state.windows[id];
  if (!win) return state;
  return {
    ...state,
    activeId: id,
    nextZ: state.nextZ + 1,
    windows: { ...state.windows, [id]: { ...win, isOpen: true, isMinimized: false, zIndex: state.nextZ } },
  };
}

function update(state: DesktopState, id: AppId, change: (win: WindowState) => WindowState): DesktopState {
  const win = state.windows[id];
  return win ? { ...state, windows: { ...state.windows, [id]: change(win) } } : state;
}

export function windowReducer(state: DesktopState, action: DesktopAction): DesktopState {
  if (action.type === 'reset') return action.state ?? state;
  if (action.type === 'open' || action.type === 'focus' || action.type === 'restore') return focus(state, action.id);
  if (action.type === 'close' || action.type === 'minimize') {
    const next = update(state, action.id, (win) => ({
      ...win,
      isOpen: action.type === 'close' ? false : win.isOpen,
      isMinimized: action.type === 'minimize',
    }));
    return state.activeId === action.id ? { ...next, activeId: highestVisible(next, action.id) } : next;
  }
  if (action.type === 'setBounds') {
    return update(state, action.id, (win) => win.isMaximized ? win : { ...win, bounds: action.bounds });
  }
  if (action.type === 'workspaceChanged') {
    return {
      ...state,
      windows: Object.fromEntries(Object.values(state.windows).map((win) => [win.id, {
        ...win,
        bounds: win.isMaximized ? { ...action.workspace } : revalidateBounds(win.bounds, action.workspace),
      }])) as Record<string, WindowState>,
    };
  }
  if (action.type === 'toggleMaximize') {
    const win = state.windows[action.id];
    if (!win) return state;
    const workspace = action.workspace ?? win.bounds;
    if (win.isMaximized) {
      return focus(update(state, action.id, (item) => ({
        ...item,
        isMaximized: false,
        bounds: revalidateBounds(item.restoreBounds ?? item.bounds, workspace),
        restoreBounds: undefined,
      })), action.id);
    }
    return focus(update(state, action.id, (item) => ({
      ...item,
      isMaximized: true,
      restoreBounds: { ...item.bounds },
      bounds: { ...workspace },
    })), action.id);
  }
  return state;
}
