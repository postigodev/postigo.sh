import { describe, expect, it } from 'vitest';
import { isDesktopHistoryState, routeToTarget, stateForPush } from './desktopRoute';
describe('desktop route contract', () => {
  it('maps routable desktop apps only', () => {
    expect(routeToTarget('/')).toEqual({ appId: 'identity', route: '/' });
    expect(routeToTarget('/work')).toEqual({ appId: 'work', route: '/work' });
    expect(routeToTarget('/work/sendo')).toEqual({ appId: 'project:sendo', route: '/work/sendo', projectSlug: 'sendo' });
    expect(routeToTarget('/status')).toBeUndefined();
  });
  it('increments owned state and rejects foreign state', () => {
    const root = { portfolioDesktop: true, entryId: 0, depth: 0, route: '/', appId: 'identity' } as const;
    expect(stateForPush(root, routeToTarget('/work')!)).toMatchObject({ entryId: 1, depth: 1, route: '/work' });
    expect(isDesktopHistoryState({ route: '/work' })).toBe(false);
  });
});
