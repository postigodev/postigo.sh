export interface ProjectHistoryState {
  portfolioProjectWindows: true;
  sessionId: string;
  openSlugs: string[];
  activeSlug: string | null;
  depth: number;
}

export function isProjectHistoryState(value: unknown): value is ProjectHistoryState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<ProjectHistoryState>;
  return state.portfolioProjectWindows === true
    && typeof state.sessionId === 'string'
    && Array.isArray(state.openSlugs)
    && state.openSlugs.every((slug) => typeof slug === 'string')
    && (state.activeSlug === null || typeof state.activeSlug === 'string')
    && typeof state.depth === 'number';
}

export function projectRootHistory(sessionId: string, openSlugs: readonly string[], activeSlug: string | null): ProjectHistoryState {
  return { portfolioProjectWindows: true, sessionId, openSlugs: [...new Set(openSlugs)], activeSlug, depth: 0 };
}

export function projectHistoryForOpen(current: ProjectHistoryState, slug: string): ProjectHistoryState {
  return {
    ...current,
    openSlugs: current.openSlugs.includes(slug) ? [...current.openSlugs] : [...current.openSlugs, slug],
    activeSlug: slug,
    depth: current.depth + 1,
  };
}

export function projectHistoryForFocus(current: ProjectHistoryState, slug: string): ProjectHistoryState {
  return { ...current, activeSlug: slug };
}

export function projectHistoryWithout(current: ProjectHistoryState, slug: string, activeSlug = current.activeSlug): ProjectHistoryState {
  return { ...current, openSlugs: current.openSlugs.filter((openSlug) => openSlug !== slug), activeSlug };
}

export type ProjectCloseHistoryAction =
  | { kind: 'back' }
  | { kind: 'replace'; state: ProjectHistoryState };

export function projectHistoryForClose(
  current: ProjectHistoryState,
  sessionId: string,
  slug: string,
  activeSlug: string | null,
  fallbackSlug: string | null,
): ProjectCloseHistoryAction {
  if (activeSlug === slug && current.sessionId === sessionId && current.depth > 0) return { kind: 'back' };
  return { kind: 'replace', state: projectHistoryWithout(current, slug, activeSlug === slug ? fallbackSlug : activeSlug) };
}
