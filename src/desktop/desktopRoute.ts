export interface RouteTarget { appId: string; route: string; projectSlug?: string }
export interface DesktopHistoryState extends RouteTarget { portfolioDesktop: true; entryId: number; depth: number }
const staticRoutes: Record<string, string> = { '/': 'identity', '/work': 'work' };
export function routeToTarget(pathname: string): RouteTarget | undefined {
  const clean = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname;
  if (staticRoutes[clean]) return { appId: staticRoutes[clean], route: clean };
  if (clean === '/work/sendo') return { appId: 'project:sendo', route: clean, projectSlug: 'sendo' };
  return undefined;
}
export function isDesktopHistoryState(value: unknown): value is DesktopHistoryState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<DesktopHistoryState>;
  return state.portfolioDesktop === true && typeof state.entryId === 'number' && typeof state.depth === 'number' && typeof state.route === 'string' && typeof state.appId === 'string';
}
export function stateForPush(current: DesktopHistoryState, target: RouteTarget): DesktopHistoryState {
  return { ...target, portfolioDesktop: true, entryId: current.entryId + 1, depth: current.depth + 1 };
}
export function rootHistoryState(): DesktopHistoryState { return { portfolioDesktop: true, entryId: 0, depth: 0, route: '/', appId: 'identity' }; }
