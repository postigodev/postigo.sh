export interface ProjectHistorySnapshot {
  openSlugs: string[];
  activeSlug: string | null;
  depth: number;
}

export interface ProjectOwnedHistorySnapshot extends ProjectHistorySnapshot {
  sessionId: string;
}

export interface ProjectHistoryState extends ProjectHistorySnapshot {
  portfolioProjectWindows: true;
  sessionId: string;
  previous: ProjectOwnedHistorySnapshot | null;
}

function isProjectHistorySnapshot(value: unknown): value is ProjectHistorySnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<ProjectHistorySnapshot>;
  return Array.isArray(snapshot.openSlugs)
    && snapshot.openSlugs.every((slug) => typeof slug === 'string')
    && (snapshot.activeSlug === null || typeof snapshot.activeSlug === 'string')
    && typeof snapshot.depth === 'number';
}

function isProjectOwnedHistorySnapshot(value: unknown): value is ProjectOwnedHistorySnapshot {
  return isProjectHistorySnapshot(value)
    && typeof (value as Partial<ProjectOwnedHistorySnapshot>).sessionId === 'string';
}

function snapshotOf(state: ProjectHistoryState): ProjectOwnedHistorySnapshot {
  return { sessionId: state.sessionId, openSlugs: [...state.openSlugs], activeSlug: state.activeSlug, depth: state.depth };
}

function snapshotsMatch(left: ProjectHistorySnapshot, right: ProjectHistorySnapshot): boolean {
  return left.activeSlug === right.activeSlug
    && left.openSlugs.length === right.openSlugs.length
    && left.openSlugs.every((slug, index) => slug === right.openSlugs[index]);
}

export function isProjectHistoryState(value: unknown): value is ProjectHistoryState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<ProjectHistoryState>;
  const previous = state.previous;
  return state.portfolioProjectWindows === true
    && typeof state.sessionId === 'string'
    && isProjectHistorySnapshot(state)
    && (previous === null || isProjectOwnedHistorySnapshot(previous));
}

export function projectRootHistory(sessionId: string, openSlugs: readonly string[], activeSlug: string | null): ProjectHistoryState {
  return { portfolioProjectWindows: true, sessionId, openSlugs: [...new Set(openSlugs)], activeSlug, depth: 0, previous: null };
}

export function projectHistoryForOpen(current: ProjectHistoryState, slug: string): ProjectHistoryState {
  return {
    ...current,
    openSlugs: current.openSlugs.includes(slug) ? [...current.openSlugs] : [...current.openSlugs, slug],
    activeSlug: slug,
    depth: current.depth + 1,
    previous: snapshotOf(current),
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
  const intended = projectHistoryWithout(current, slug, activeSlug === slug ? fallbackSlug : activeSlug);
  const mayBack = activeSlug === slug
    && current.sessionId === sessionId
    && current.previous !== null
    && current.previous.sessionId === sessionId
    && current.previous.depth === current.depth - 1
    && snapshotsMatch(current.previous, intended);
  return mayBack ? { kind: 'back' } : { kind: 'replace', state: intended };
}
