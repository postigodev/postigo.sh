import { describe, expect, it } from 'vitest';
import { projectCases } from '../data/portfolio';
import { buildAppRegistry, nearColdBoot } from './appRegistry';
import { createInitialDesktopState, windowReducer } from './windowReducer';

const registry = buildAppRegistry(projectCases);
const workspace = { x: 0, y: 0, width: 1200, height: 700 };

describe('windowReducer', () => {
  it('boots only Identity from registry bounds', () => {
    const state = createInitialDesktopState(registry, nearColdBoot);
    expect(Object.values(state.windows).filter((win) => win.isOpen).map((win) => win.id)).toEqual(['identity']);
    expect(state.windows.identity.bounds).toEqual(registry.get('identity')?.defaultBounds);
  });

  it('opens a project without opening Identity or Selected work', () => {
    let state = createInitialDesktopState(registry, []);
    state = windowReducer(state, { type: 'open', id: 'project:koba' });
    expect(state.windows['project:koba'].isOpen).toBe(true);
    expect(state.windows.identity.isOpen).toBe(false);
    expect(state.windows.work.isOpen).toBe(false);
  });

  it('keeps project windows singleton because registry state is preseeded', () => {
    let state = createInitialDesktopState(registry, []);
    state = windowReducer(state, { type: 'open', id: 'project:preppie' });
    state = windowReducer(state, { type: 'open', id: 'project:preppie' });
    expect(Object.keys(state.windows).filter((id) => id === 'project:preppie')).toHaveLength(1);
  });

  it('restores untouched and resized bounds after maximize', () => {
    const initial = createInitialDesktopState(registry, nearColdBoot);
    const resizedBounds = { x: 80, y: 40, width: 800, height: 510 };
    const resized = windowReducer(initial, { type: 'setBounds', id: 'identity', bounds: resizedBounds });
    const maximized = windowReducer(resized, { type: 'toggleMaximize', id: 'identity', workspace });
    expect(maximized.windows.identity.restoreBounds).toEqual(resizedBounds);
    const restored = windowReducer(maximized, { type: 'toggleMaximize', id: 'identity', workspace });
    expect(restored.windows.identity.bounds).toEqual(resizedBounds);
  });

  it('falls back to the highest visible window after close and minimize', () => {
    let state = createInitialDesktopState(registry, []);
    state = windowReducer(state, { type: 'open', id: 'about' });
    state = windowReducer(state, { type: 'open', id: 'work' });
    expect(windowReducer(state, { type: 'minimize', id: 'work' }).activeId).toBe('about');
    expect(windowReducer(state, { type: 'close', id: 'work' }).activeId).toBe('about');
  });

  it('tracks maximized workspace changes and revalidates restored windows', () => {
    const initial = createInitialDesktopState(registry, nearColdBoot);
    const maximized = windowReducer(initial, { type: 'toggleMaximize', id: 'identity', workspace });
    const nextWorkspace = { x: 0, y: 0, width: 900, height: 560 };
    const changed = windowReducer(maximized, { type: 'workspaceChanged', workspace: nextWorkspace });
    expect(changed.windows.identity.bounds).toEqual(nextWorkspace);
  });

  it('resets to a fresh near-cold snapshot', () => {
    const initial = createInitialDesktopState(registry, nearColdBoot);
    const changed = windowReducer(initial, { type: 'open', id: 'network' });
    expect(windowReducer(changed, { type: 'reset', state: createInitialDesktopState(registry, nearColdBoot) })).toEqual(initial);
  });
});
