import { describe, expect, it } from 'vitest';
import { isProjectHistoryState, projectHistoryForClose, projectHistoryForFocus, projectHistoryForOpen, projectRootHistory } from './projectHistory';

describe('project window history', () => {
  it('pushes a new singleton snapshot with session ownership and depth', () => {
    const root = projectRootHistory('session-a', [], null);
    expect(projectHistoryForOpen(root, 'preppie')).toEqual({
      portfolioProjectWindows: true,
      sessionId: 'session-a',
      openSlugs: ['preppie'],
      activeSlug: 'preppie',
      depth: 1,
      previous: { sessionId: 'session-a', openSlugs: [], activeSlug: null, depth: 0 },
    });
  });

  it('does not duplicate an already-open project and focus preserves depth', () => {
    const current = projectHistoryForOpen(projectHistoryForOpen(projectRootHistory('session-a', [], null), 'preppie'), 'koba');
    expect(projectHistoryForFocus(current, 'preppie')).toMatchObject({
      openSlugs: ['preppie', 'koba'],
      activeSlug: 'preppie',
      depth: 2,
    });
  });

  it('validates the complete typed state', () => {
    expect(isProjectHistoryState(projectRootHistory('session-a', [], null))).toBe(true);
    expect(isProjectHistoryState({ portfolioProjectWindows: true, sessionId: 'x', openSlugs: 'preppie', activeSlug: null, depth: 0 })).toBe(false);
  });

  it('backs through an owned active entry but replaces a direct route or inactive close', () => {
    const root = projectRootHistory('session-a', ['preppie'], 'preppie');
    const nested = projectHistoryForOpen(root, 'koba');
    expect(projectHistoryForClose(nested, 'session-a', 'koba', 'koba', 'preppie')).toEqual({ kind: 'back' });
    expect(projectHistoryForClose(root, 'session-a', 'preppie', 'preppie', null)).toEqual({
      kind: 'replace', state: { ...root, openSlugs: [], activeSlug: null },
    });
    expect(projectHistoryForClose(nested, 'session-a', 'preppie', 'koba', 'koba')).toEqual({
      kind: 'replace', state: { ...nested, openSlugs: ['koba'], activeSlug: 'koba' },
    });
  });

  it('does not back into a project removed by an inactive close', () => {
    const root = projectRootHistory('session-a', [], null);
    const preppie = projectHistoryForOpen(root, 'preppie');
    const koba = projectHistoryForOpen(preppie, 'koba');
    const withoutPreppie = projectHistoryForClose(koba, 'session-a', 'preppie', 'koba', 'koba');
    expect(withoutPreppie.kind).toBe('replace');
    if (withoutPreppie.kind !== 'replace') return;

    expect(projectHistoryForClose(withoutPreppie.state, 'session-a', 'koba', 'koba', null)).toEqual({
      kind: 'replace',
      state: { ...withoutPreppie.state, openSlugs: [], activeSlug: null },
    });
  });

  it('does not back after focus replacement when predecessor differs from post-close state', () => {
    const root = projectRootHistory('session-a', [], null);
    const preppie = projectHistoryForOpen(root, 'preppie');
    const koba = projectHistoryForOpen(preppie, 'koba');
    const focusedPreppie = projectHistoryForFocus(koba, 'preppie');

    expect(projectHistoryForClose(focusedPreppie, 'session-a', 'preppie', 'preppie', 'koba')).toEqual({
      kind: 'replace',
      state: { ...focusedPreppie, openSlugs: ['koba'], activeSlug: 'koba' },
    });
  });
});
