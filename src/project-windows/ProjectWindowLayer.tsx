import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks';
import type { ProjectCase } from '../data/portfolio';
import {
  isProjectHistoryState,
  projectHistoryForClose,
  projectHistoryForFocus,
  projectHistoryForOpen,
  projectRootHistory,
  type ProjectHistoryState,
} from './projectHistory';
import ProjectWindow from './ProjectWindow';
import { createInitialProjectWindowState, projectWindowReducer } from './projectWindowReducer';
import type { Bounds, ProjectWindowDefinition } from './types';

interface Props {
  projects: readonly ProjectCase[];
  initialSlugs?: readonly string[];
}

const initialWorkspace: Bounds = { x: 0, y: 0, width: 1280, height: 720 };
const routeFor = (slug: string | null) => slug ? `/work/${slug}` : '/';

export default function ProjectWindowLayer({ projects, initialSlugs = [] }: Props) {
  const definitions = useMemo<readonly ProjectWindowDefinition[]>(() => projects.map((project, index) => ({
    slug: project.slug,
    title: project.name,
    defaultBounds: { x: 110 + index * 80, y: 44 + index * 34, width: 820, height: 620 },
  })), [projects]);
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);
  const validSlugs = useMemo(() => new Set(projectMap.keys()), [projectMap]);
  const bootSlugs = initialSlugs.filter((slug) => validSlugs.has(slug));
  const [state, dispatch] = useReducer(projectWindowReducer, undefined, () => createInitialProjectWindowState(definitions, bootSlugs));
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [compact, setCompact] = useState(false);
  const [ready, setReady] = useState(false);
  const sessionId = useRef('');
  const historyState = useRef<ProjectHistoryState | null>(null);
  const openers = useRef(new Map<string, HTMLElement>());
  const stateRef = useRef(state);
  stateRef.current = state;

  const focusHeading = (slug: string) => requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-project-window="${slug}"] > .project-window__titlebar h2`)?.focus();
  });

  useLayoutEffect(() => {
    const media = matchMedia('(max-width: 780px), (pointer: coarse)');
    const measure = () => {
      const next = { x: 0, y: 0, width: document.documentElement.clientWidth, height: window.innerHeight };
      setWorkspace(next);
      setCompact(media.matches);
      dispatch({ type: 'workspaceChanged', workspace: next });
    };
    media.addEventListener('change', measure);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      media.removeEventListener('change', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    sessionId.current = crypto.randomUUID();
    const activeSlug = bootSlugs.at(-1) ?? null;
    const root = projectRootHistory(sessionId.current, bootSlugs, activeSlug);
    history.replaceState(root, '', routeFor(activeSlug));
    historyState.current = root;
    setReady(true);
    if (activeSlug) focusHeading(activeSlug);

    const onPopState = (event: PopStateEvent) => {
      if (!isProjectHistoryState(event.state) || event.state.sessionId !== sessionId.current) return;
      const openSlugs = event.state.openSlugs.filter((slug) => validSlugs.has(slug));
      const nextActive = event.state.activeSlug && validSlugs.has(event.state.activeSlug) ? event.state.activeSlug : null;
      historyState.current = { ...event.state, openSlugs, activeSlug: nextActive };
      dispatch({ type: 'restoreSnapshot', openSlugs, activeSlug: nextActive });
      if (nextActive) focusHeading(nextActive);
      else requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-project-launcher]')?.focus());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target && anchor.target !== '_self' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return;
      const match = url.pathname.replace(/\/$/, '').match(/^\/work\/([^/]+)$/);
      const slug = match?.[1];
      if (!slug || !validSlugs.has(slug)) return;

      event.preventDefault();
      openers.current.set(slug, anchor);
      const current = historyState.current;
      if (!current) return;
      if (stateRef.current.windows[slug]?.isOpen) {
        const replacement = projectHistoryForFocus(current, slug);
        history.replaceState(replacement, '', routeFor(slug));
        historyState.current = replacement;
        dispatch({ type: 'focus', slug });
      } else {
        const next = projectHistoryForOpen(current, slug);
        history.pushState(next, '', routeFor(slug));
        historyState.current = next;
        dispatch({ type: 'open', slug });
      }
      focusHeading(slug);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [validSlugs]);

  const anyOpen = Object.values(state.windows).some((window) => window.isOpen);
  useEffect(() => {
    if (!compact || !anyOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [compact, anyOpen]);

  const focusProject = (slug: string) => {
    if (state.activeSlug === slug) return;
    dispatch({ type: 'focus', slug });
    const current = historyState.current;
    if (!current) return;
    const replacement = projectHistoryForFocus(current, slug);
    history.replaceState(replacement, '', routeFor(slug));
    historyState.current = replacement;
  };

  const closeProject = (slug: string) => {
    const current = historyState.current;
    if (!current) return;
    const fallback = state.activeSlug === slug
      ? Object.values(state.windows).filter((window) => window.slug !== slug && window.isOpen).sort((a, b) => b.zIndex - a.zIndex)[0]?.slug ?? null
      : state.activeSlug;
    const historyAction = projectHistoryForClose(current, sessionId.current, slug, state.activeSlug, fallback);
    if (historyAction.kind === 'back') {
      history.back();
      return;
    }
    const replacement = historyAction.state;
    history.replaceState(replacement, '', routeFor(fallback));
    historyState.current = replacement;
    dispatch({ type: 'close', slug });
    requestAnimationFrame(() => {
      if (fallback) focusHeading(fallback);
      else {
        const opener = openers.current.get(slug);
        if (opener?.isConnected) opener.focus();
        else document.querySelector<HTMLElement>(`a[href="/work/${slug}"]`)?.focus();
      }
    });
  };

  return <div class="project-window-layer" data-project-window-layer data-window-layer-ready={ready} data-compact={compact} aria-label="Open project case studies">
    {Object.values(state.windows).map((window) => {
      const project = projectMap.get(window.slug);
      if (!project) return null;
      return <ProjectWindow
        key={window.slug}
        project={project}
        projects={projects}
        window={window}
        workspace={workspace}
        compact={compact}
        active={state.activeSlug === window.slug}
        onFocus={() => focusProject(window.slug)}
        onClose={() => closeProject(window.slug)}
        onMaximize={() => dispatch({ type: 'toggleMaximize', slug: window.slug, workspace })}
        onBoundsChange={(bounds) => dispatch({ type: 'setBounds', slug: window.slug, bounds })}
      />;
    })}
  </div>;
}
