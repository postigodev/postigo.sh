import { describe, expect, it } from 'vitest';
import { projectCases } from '../data/portfolio';
import { buildAppRegistry } from './appRegistry';
import { isDesktopHistoryState, routeToTarget, stateForPush } from './desktopRoute';

const registry = buildAppRegistry(projectCases);

describe('desktop route contract', () => {
  it('maps every routable desktop app from the registry', () => {
    expect(routeToTarget('/', registry)).toEqual({ appId: 'identity', route: '/' });
    expect(routeToTarget('/work', registry)).toEqual({ appId: 'work', route: '/work' });
    expect(routeToTarget('/about', registry)).toEqual({ appId: 'about', route: '/about' });
    expect(routeToTarget('/resume/', registry)).toEqual({ appId: 'resume', route: '/resume' });
    expect(routeToTarget('/contact', registry)).toEqual({ appId: 'contact', route: '/contact' });
    expect(routeToTarget('/privacy', registry)).toEqual({ appId: 'privacy', route: '/privacy' });
    expect(routeToTarget('/work/koba', registry)).toEqual({ appId: 'project:koba', route: '/work/koba', projectSlug: 'koba' });
    expect(routeToTarget('/work/dm2text', registry)).toBeUndefined();
    expect(routeToTarget('/status', registry)).toBeUndefined();
  });

  it('increments owned state and rejects foreign state', () => {
    const root = { portfolioDesktop: true, entryId: 0, depth: 0, route: '/', appId: 'identity' } as const;
    expect(stateForPush(root, routeToTarget('/work', registry)!)).toMatchObject({ entryId: 1, depth: 1, route: '/work' });
    expect(isDesktopHistoryState({ route: '/work' })).toBe(false);
  });
});
