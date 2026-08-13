import { describe, expect, it } from 'vitest';
import { initialDesktopState, windowReducer } from './windowReducer';

describe('windowReducer', () => {
  it('boots with identity active', () => { expect(initialDesktopState.activeId).toBe('identity'); expect(initialDesktopState.windows.identity?.isOpen).toBe(true); });
  it('boots the authored Identity, Now Playing, and Notes windows', () => {
    expect(Object.values(initialDesktopState.windows)
      .filter((win) => win.isOpen)
      .map((win) => [win.id, win.placement]))
      .toEqual([
        ['identity', 'authored'],
        ['now-playing', 'authored'],
        ['notes', 'authored'],
      ]);
  });
  it('moves an authored window into floating placement without changing routes', () => {
    const moved = windowReducer(initialDesktopState, { type: 'move', id: 'notes', x: 900, y: 220 });
    expect(moved.windows.notes).toMatchObject({ placement: 'floating', bounds: { x: 900, y: 220 } });
  });
  it('opens Work and singleton project windows with shared titles', () => {
    const work = windowReducer(initialDesktopState, { type: 'open', id: 'work' });
    const once = windowReducer(work, { type: 'openProject', slug: 'preppie', title: 'Preppie' });
    const twice = windowReducer(once, { type: 'openProject', slug: 'preppie', title: 'Preppie' });
    const sendo = windowReducer(twice, { type: 'openProject', slug: 'sendo', title: 'Sendo' });
    expect(Object.keys(sendo.windows).filter((id) => id === 'project:preppie')).toHaveLength(1);
    expect(sendo.windows['project:preppie']?.title).toBe('Preppie');
    expect(sendo.windows['project:sendo']?.title).toBe('Sendo');
    expect(sendo.windows.work?.isOpen).toBe(true);
    expect(sendo.activeId).toBe('project:sendo');
  });
  it('restores bounds after maximize', () => {
    const max = windowReducer(initialDesktopState, { type: 'toggleMaximize', id: 'identity' });
    expect(max.windows.identity?.restoreBounds).toEqual(initialDesktopState.windows.identity?.bounds);
    expect(windowReducer(max, { type: 'toggleMaximize', id: 'identity' }).windows.identity?.bounds).toEqual(initialDesktopState.windows.identity?.bounds);
  });
  it('reset returns the authored state', () => {
    const changed = windowReducer(initialDesktopState, { type: 'close', id: 'notes' });
    expect(windowReducer(changed, { type: 'reset' })).toEqual(initialDesktopState);
  });
});
