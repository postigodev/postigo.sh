import { describe, expect, it } from 'vitest';
import { projectCases } from '../data/portfolio';
import { buildAppRegistry } from './appRegistry';
import { isDesktopHistoryState, rootHistoryState, routeToTarget, stateForClose, stateForPush } from './desktopRoute';

const registry = buildAppRegistry(projectCases);

describe('desktop route contract', () => {
  it('maps every routable desktop app from the registry', () => {
    expect(routeToTarget('/', registry)).toEqual({ appId: 'identity', route: '/' });
    expect(routeToTarget('/work', registry)).toEqual({ appId: 'work', route: '/work' });
    expect(routeToTarget('/about', registry)).toBeUndefined();
    expect(routeToTarget('/resume/', registry)).toEqual({ appId: 'resume', route: '/resume' });
    expect(routeToTarget('/contact', registry)).toEqual({ appId: 'contact', route: '/contact' });
    expect(routeToTarget('/privacy', registry)).toEqual({ appId: 'privacy', route: '/privacy' });
    expect(routeToTarget('/work/koba', registry)).toEqual({ appId: 'project:koba', route: '/work/koba', projectSlug: 'koba' });
    expect(routeToTarget('/work/dm2text', registry)).toEqual({ appId: 'project:dm2text', route: '/work/dm2text', projectSlug: 'dm2text' });
    expect(routeToTarget('/status', registry)).toBeUndefined();
  });

  it('increments owned state and rejects foreign state', () => {
    const root = { portfolioDesktop: true, entryId: 0, depth: 0, route: '/', appId: 'identity' } as const;
    expect(stateForPush(root, routeToTarget('/work', registry)!)).toMatchObject({ entryId: 1, depth: 1, route: '/work' });
    expect(isDesktopHistoryState({ route: '/work' })).toBe(false);
  });

  it('replaces an owned active route with root without traversing', () => {
    const work = stateForPush(rootHistoryState(), routeToTarget('/work', registry)!);
    const preppie = stateForPush(work, routeToTarget('/work/preppie', registry)!);
    expect(stateForClose(preppie, 'project:preppie')).toEqual(rootHistoryState());
  });

  it('does not mutate history when closing a non-owner or utility', () => {
    const work = stateForPush(rootHistoryState(), routeToTarget('/work', registry)!);
    expect(stateForClose(work, 'identity')).toBeUndefined();
    expect(stateForClose(work, 'network')).toBeUndefined();
  });
});
