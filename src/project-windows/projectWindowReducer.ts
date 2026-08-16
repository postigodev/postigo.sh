import type { ProjectWindowAction, ProjectWindowDefinition, ProjectWindowsState, ProjectWindowState } from './types';
import { revalidateBounds } from './windowGeometry';

export function createInitialProjectWindowState(
  definitions: readonly ProjectWindowDefinition[],
  openSlugs: readonly string[],
): ProjectWindowsState {
  const open = new Set(openSlugs);
  const windows = Object.fromEntries(definitions.map((definition) => [definition.slug, {
    slug: definition.slug,
    title: definition.title,
    isOpen: open.has(definition.slug),
    isMaximized: false,
    zIndex: openSlugs.indexOf(definition.slug) + 1,
    bounds: { ...definition.defaultBounds },
  } satisfies ProjectWindowState])) as Record<string, ProjectWindowState>;
  return { windows, activeSlug: openSlugs.at(-1) ?? null, nextZ: openSlugs.length + 1 };
}

function update(state: ProjectWindowsState, slug: string, change: (window: ProjectWindowState) => ProjectWindowState) {
  const window = state.windows[slug];
  return window ? { ...state, windows: { ...state.windows, [slug]: change(window) } } : state;
}

function focus(state: ProjectWindowsState, slug: string): ProjectWindowsState {
  const window = state.windows[slug];
  if (!window) return state;
  return {
    ...state,
    activeSlug: slug,
    nextZ: state.nextZ + 1,
    windows: { ...state.windows, [slug]: { ...window, isOpen: true, zIndex: state.nextZ } },
  };
}

function highestOpen(state: ProjectWindowsState, excluded?: string) {
  return Object.values(state.windows)
    .filter((window) => window.slug !== excluded && window.isOpen)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.slug ?? null;
}

export function projectWindowReducer(state: ProjectWindowsState, action: ProjectWindowAction): ProjectWindowsState {
  if (action.type === 'open' || action.type === 'focus') return focus(state, action.slug);
  if (action.type === 'close') {
    const next = update(state, action.slug, (window) => ({ ...window, isOpen: false, isMaximized: false, restoreBounds: undefined }));
    return state.activeSlug === action.slug ? { ...next, activeSlug: highestOpen(next, action.slug) } : next;
  }
  if (action.type === 'setBounds') {
    return update(state, action.slug, (window) => window.isMaximized ? window : { ...window, bounds: action.bounds });
  }
  if (action.type === 'workspaceChanged') {
    return {
      ...state,
      windows: Object.fromEntries(Object.values(state.windows).map((window) => [window.slug, {
        ...window,
        bounds: window.isMaximized ? { ...action.workspace } : revalidateBounds(window.bounds, action.workspace),
      }])) as Record<string, ProjectWindowState>,
    };
  }
  if (action.type === 'toggleMaximize') {
    const window = state.windows[action.slug];
    if (!window) return state;
    if (window.isMaximized) {
      return focus(update(state, action.slug, (item) => ({
        ...item,
        isMaximized: false,
        bounds: revalidateBounds(item.restoreBounds ?? item.bounds, action.workspace),
        restoreBounds: undefined,
      })), action.slug);
    }
    return focus(update(state, action.slug, (item) => ({
      ...item,
      isMaximized: true,
      restoreBounds: { ...item.bounds },
      bounds: { ...action.workspace },
    })), action.slug);
  }
  if (action.type === 'restoreSnapshot') {
    const open = new Set(action.openSlugs);
    const activeSlug = action.activeSlug && open.has(action.activeSlug) && state.windows[action.activeSlug]
      ? action.activeSlug
      : action.openSlugs.filter((slug) => state.windows[slug]).at(-1) ?? null;
    let nextZ = state.nextZ;
    const windows = Object.fromEntries(Object.values(state.windows).map((window) => {
      const isOpen = open.has(window.slug);
      const zIndex = isOpen && window.slug === activeSlug ? nextZ++ : window.zIndex;
      return [window.slug, { ...window, isOpen, zIndex }];
    })) as Record<string, ProjectWindowState>;
    return { windows, activeSlug, nextZ };
  }
  return state;
}
