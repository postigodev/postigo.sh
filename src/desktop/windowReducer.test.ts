import { describe, expect, it } from 'vitest';
import { initialDesktopState, windowReducer } from './windowReducer';

describe('windowReducer', () => {
  it('boots with identity only', () => { expect(initialDesktopState.activeId).toBe('identity'); expect(initialDesktopState.windows.identity?.isOpen).toBe(true); });
  it('opens Work and one project window', () => {
    const work = windowReducer(initialDesktopState, { type: 'open', id: 'work' });
    const once = windowReducer(work, { type: 'openProject', slug: 'sendo' });
    const twice = windowReducer(once, { type: 'openProject', slug: 'sendo' });
    expect(Object.keys(twice.windows).filter((id) => id === 'project:sendo')).toHaveLength(1);
    expect(twice.windows.work?.isOpen).toBe(true); expect(twice.activeId).toBe('project:sendo');
  });
  it('restores bounds after maximize', () => {
    const max = windowReducer(initialDesktopState, { type: 'toggleMaximize', id: 'identity' });
    expect(max.windows.identity?.restoreBounds).toEqual(initialDesktopState.windows.identity?.bounds);
    expect(windowReducer(max, { type: 'toggleMaximize', id: 'identity' }).windows.identity?.bounds).toEqual(initialDesktopState.windows.identity?.bounds);
  });
  it('reset returns the authored state', () => {
    const changed = windowReducer(initialDesktopState, { type: 'open', id: 'work' });
    expect(windowReducer(changed, { type: 'reset' })).toEqual(initialDesktopState);
  });
});
