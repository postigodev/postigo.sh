import { describe, expect, it } from 'vitest';
import { isDesktopHistoryState, routeToTarget, stateForPush } from './desktopRoute';
describe('desktop route contract', () => {
  it('maps routable desktop apps only', () => {
    const slugs = ['preppie', 'sendo'] as const;
    expect(routeToTarget('/', slugs)).toEqual({ appId: 'identity', route: '/' });
    expect(routeToTarget('/work', slugs)).toEqual({ appId: 'work', route: '/work' });
    expect(routeToTarget('/work/preppie', slugs)).toEqual({ appId: 'project:preppie', route: '/work/preppie', projectSlug: 'preppie' });
    expect(routeToTarget('/work/sendo/', slugs)?.projectSlug).toBe('sendo');
    expect(routeToTarget('/work/unknown', slugs)).toBeUndefined();
    expect(routeToTarget('/status', slugs)).toBeUndefined();
  });
  it('increments owned state and rejects foreign state', () => {
    const root = { portfolioDesktop: true, entryId: 0, depth: 0, route: '/', appId: 'identity' } as const;
    expect(stateForPush(root, routeToTarget('/work', ['preppie', 'sendo'])!)).toMatchObject({ entryId: 1, depth: 1, route: '/work' });
    expect(isDesktopHistoryState({ route: '/work' })).toBe(false);
  });
});
