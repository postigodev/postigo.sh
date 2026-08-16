import { describe, expect, it } from 'vitest';
import { createInitialProjectWindowState, projectWindowReducer } from './projectWindowReducer';

const definitions = [
  { slug: 'preppie', title: 'Preppie', defaultBounds: { x: 140, y: 60, width: 780, height: 540 } },
  { slug: 'koba', title: 'Koba', defaultBounds: { x: 172, y: 84, width: 780, height: 540 } },
] as const;
const workspace = { x: 0, y: 0, width: 1200, height: 700 };

describe('projectWindowReducer', () => {
  it('opens project windows as independent singletons', () => {
    let state = createInitialProjectWindowState(definitions, []);
    state = projectWindowReducer(state, { type: 'open', slug: 'preppie' });
    state = projectWindowReducer(state, { type: 'open', slug: 'koba' });
    state = projectWindowReducer(state, { type: 'open', slug: 'preppie' });

    expect(Object.values(state.windows).filter((window) => window.isOpen).map((window) => window.slug)).toEqual(['preppie', 'koba']);
    expect(state.activeSlug).toBe('preppie');
  });

  it('closes one window without changing another open window', () => {
    let state = createInitialProjectWindowState(definitions, ['preppie', 'koba']);
    state = projectWindowReducer(state, { type: 'focus', slug: 'preppie' });
    state = projectWindowReducer(state, { type: 'close', slug: 'koba' });

    expect(state.windows.preppie.isOpen).toBe(true);
    expect(state.windows.koba.isOpen).toBe(false);
    expect(state.activeSlug).toBe('preppie');
  });

  it('maximizes and restores default bounds before any prior movement', () => {
    const initial = createInitialProjectWindowState(definitions, ['preppie']);
    const maximized = projectWindowReducer(initial, { type: 'toggleMaximize', slug: 'preppie', workspace });
    expect(maximized.windows.preppie.restoreBounds).toEqual(definitions[0].defaultBounds);
    expect(maximized.windows.preppie.bounds).toEqual(workspace);

    const restored = projectWindowReducer(maximized, { type: 'toggleMaximize', slug: 'preppie', workspace });
    expect(restored.windows.preppie.bounds).toEqual(definitions[0].defaultBounds);
  });

  it('restores the exact open set and active project from history', () => {
    let state = createInitialProjectWindowState(definitions, ['preppie']);
    state = projectWindowReducer(state, { type: 'open', slug: 'koba' });
    state = projectWindowReducer(state, { type: 'restoreSnapshot', openSlugs: ['preppie'], activeSlug: 'preppie' });

    expect(state.windows.preppie.isOpen).toBe(true);
    expect(state.windows.koba.isOpen).toBe(false);
    expect(state.activeSlug).toBe('preppie');
  });
});
