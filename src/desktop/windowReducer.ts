import type { Bounds, DesktopAction, DesktopState, WindowState } from './types';

const identityBounds: Bounds = { x: 250, y: 72, width: 700, height: 470 };
const workBounds: Bounds = { x: 190, y: 62, width: 820, height: 560 };
const nowPlayingBounds: Bounds = { x: 1060, y: 72, width: 300, height: 190 };
const notesBounds: Bounds = { x: 1060, y: 280, width: 300, height: 270 };

export const initialDesktopState: DesktopState = {
  windows: {
    identity: { id: 'identity', title: 'Piero Postigo Rocchetti', placement: 'authored', isOpen: true, isMinimized: false, isMaximized: false, zIndex: 3, bounds: identityBounds },
    'now-playing': { id: 'now-playing', title: 'now.playing', placement: 'authored', isOpen: true, isMinimized: false, isMaximized: false, zIndex: 2, bounds: nowPlayingBounds },
    notes: { id: 'notes', title: 'notes.txt', placement: 'authored', isOpen: true, isMinimized: false, isMaximized: false, zIndex: 1, bounds: notesBounds },
    work: { id: 'work', title: 'Work', placement: 'floating', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, bounds: workBounds },
  }, activeId: 'identity', nextZ: 4,
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
    const seeded = state.windows[id] ? state : { ...state, windows: { ...state.windows, [id]: { id, title: action.title, projectSlug: action.slug, placement: 'floating' as const, isOpen: true, isMinimized: false, isMaximized: false, zIndex: state.nextZ, bounds: { x: 270, y: 92, width: 760, height: 520 } } } };
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
  if (action.type === 'move') return update(state, action.id, (win) => win.isMaximized ? win : ({ ...win, placement: 'floating', bounds: { ...win.bounds, x: action.x, y: action.y } }));
  if (action.type === 'toggleMaximize') {
    const win = state.windows[action.id]; if (!win) return state;
    if (win.isMaximized) return focus(update(state, action.id, (item) => ({ ...item, isMaximized: false, bounds: item.restoreBounds ?? item.bounds, restoreBounds: undefined })), action.id);
    return focus(update(state, action.id, (item) => ({ ...item, isMaximized: true, restoreBounds: item.bounds, bounds: { x: 0, y: 0, width: 0, height: 0 } })), action.id);
  }
  return state;
}
