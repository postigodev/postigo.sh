import type { Bounds, DesktopAction, DesktopState, WindowState } from './types';

const identityBounds: Bounds = { x: 250, y: 72, width: 700, height: 420 };
const workBounds: Bounds = { x: 190, y: 62, width: 820, height: 560 };

export const initialDesktopState: DesktopState = {
  windows: {
    identity: { id: 'identity', title: 'Piero Postigo Rocchetti', isOpen: true, isMinimized: false, isMaximized: false, zIndex: 2, bounds: identityBounds },
    work: { id: 'work', title: 'Work', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 1, bounds: workBounds },
  }, activeId: 'identity', nextZ: 3,
};

function update(state: DesktopState, id: string, change: (win: WindowState) => WindowState): DesktopState {
  const win = state.windows[id]; if (!win) return state;
  return { ...state, windows: { ...state.windows, [id]: change(win) } };
}
function focus(state: DesktopState, id: string): DesktopState {
  const next = update(state, id, (win) => ({ ...win, isOpen: true, isMinimized: false, zIndex: state.nextZ }));
  return next === state ? state : { ...next, activeId: id, nextZ: state.nextZ + 1 };
}

export function windowReducer(state: DesktopState, action: DesktopAction): DesktopState {
  if (action.type === 'reset') return initialDesktopState;
  if (action.type === 'open' || action.type === 'focus') return focus(state, action.id);
  if (action.type === 'openProject') {
    const id = `project:${action.slug}`;
    const seeded = state.windows[id] ? state : { ...state, windows: { ...state.windows, [id]: { id, title: action.slug === 'sendo' ? 'Sendo' : action.slug, projectSlug: action.slug, isOpen: true, isMinimized: false, isMaximized: false, zIndex: state.nextZ, bounds: { x: 270, y: 92, width: 760, height: 520 } } } };
    return focus(seeded, id);
  }
  if (action.type === 'close') {
    const next = update(state, action.id, (win) => ({ ...win, isOpen: false, isMinimized: false }));
    return { ...next, activeId: state.activeId === action.id ? null : state.activeId };
  }
  if (action.type === 'minimize') {
    const next = update(state, action.id, (win) => ({ ...win, isMinimized: true }));
    return { ...next, activeId: state.activeId === action.id ? null : state.activeId };
  }
  if (action.type === 'restore') return focus(state, action.id);
  if (action.type === 'move') return update(state, action.id, (win) => win.isMaximized ? win : ({ ...win, bounds: { ...win.bounds, x: action.x, y: action.y } }));
  if (action.type === 'toggleMaximize') {
    const win = state.windows[action.id]; if (!win) return state;
    if (win.isMaximized) return focus(update(state, action.id, (item) => ({ ...item, isMaximized: false, bounds: item.restoreBounds ?? item.bounds, restoreBounds: undefined })), action.id);
    return focus(update(state, action.id, (item) => ({ ...item, isMaximized: true, restoreBounds: item.bounds, bounds: { x: 0, y: 0, width: 0, height: 0 } })), action.id);
  }
  return state;
}
