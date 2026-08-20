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
  const pendingFocus = useRef<HTMLElement | null>(null);
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
      const previousActive = historyState.current?.activeSlug ?? null;
      if (!isProjectHistoryState(event.state) || event.state.sessionId !== sessionId.current) {
        const match = location.pathname.replace(/\/$/, '').match(/^\/work\/([^/]+)$/);
        const recoveredSlug = match?.[1] && validSlugs.has(match[1]) ? match[1] : null;
        const recovered = projectRootHistory(sessionId.current, recoveredSlug ? [recoveredSlug] : [], recoveredSlug);
        history.replaceState(recovered, '', location.href);
        historyState.current = recovered;
        dispatch({ type: 'restoreSnapshot', openSlugs: recovered.openSlugs, activeSlug: recovered.activeSlug });
        if (recoveredSlug) {
          pendingFocus.current = null;
          focusHeading(recoveredSlug);
        }
        else if (previousActive) {
          pendingFocus.current = openers.current.get(previousActive)
            ?? document.querySelector<HTMLElement>(`a[href="/work/${previousActive}"]`);
        }
        return;
      }
      const openSlugs = event.state.openSlugs.filter((slug) => validSlugs.has(slug));
      const nextActive = event.state.activeSlug && validSlugs.has(event.state.activeSlug) ? event.state.activeSlug : null;
      historyState.current = { ...event.state, openSlugs, activeSlug: nextActive };
      dispatch({ type: 'restoreSnapshot', openSlugs, activeSlug: nextActive });
      if (nextActive) {
        pendingFocus.current = null;
        focusHeading(nextActive);
      }
      else if (!pendingFocus.current && previousActive) {
        pendingFocus.current = openers.current.get(previousActive)
          ?? document.querySelector<HTMLElement>(`a[href="/work/${previousActive}"]`);
      }
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

  const toggleMaximizeProject = (slug: string) => {
    focusProject(slug);
    dispatch({ type: 'toggleMaximize', slug, workspace });
  };

  const closeProject = (slug: string) => {
    const current = historyState.current;
    if (!current) return;
    const fallback = state.activeSlug === slug
      ? Object.values(state.windows).filter((window) => window.slug !== slug && window.isOpen).sort((a, b) => b.zIndex - a.zIndex)[0]?.slug ?? null
      : state.activeSlug;
    const historyAction = projectHistoryForClose(current, sessionId.current, slug, state.activeSlug, fallback);
    if (historyAction.kind === 'back') {
      pendingFocus.current = current.previous?.activeSlug
        ? null
        : openers.current.get(slug) ?? document.querySelector<HTMLElement>(`a[href="/work/${slug}"]`);
      history.back();
      return;
    }
    const replacement = historyAction.state;
    history.replaceState(replacement, '', routeFor(fallback));
    historyState.current = replacement;
    dispatch({ type: 'close', slug });
    if (fallback) focusHeading(fallback);
    else pendingFocus.current = openers.current.get(slug)
      ?? document.querySelector<HTMLElement>(`a[href="/work/${slug}"]`);
  };

  useEffect(() => {
    if (state.activeSlug || !pendingFocus.current) return;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    requestAnimationFrame(() => {
      if (target.isConnected) target.focus();
      else document.querySelector<HTMLElement>('[data-project-launcher]')?.focus();
    });
  }, [state.activeSlug]);

  useEffect(() => {
    const activeSlug = state.activeSlug;
    if (!compact || !activeSlug) return;
    const dialog = document.querySelector<HTMLElement>(`[data-project-window="${activeSlug}"]`);
    if (!dialog) return;

    let windowHost: HTMLElement = dialog;
    while (windowHost.parentElement && windowHost.parentElement !== document.body) windowHost = windowHost.parentElement;
    const background = Array.from(document.body.children).filter((element): element is HTMLElement => (
      element instanceof HTMLElement && element !== windowHost
    ));
    const previous = background.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    }));
    background.forEach((element) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });

    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => !element.hasAttribute('hidden'));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeProject(activeSlug);
        return;
      }
      if (event.key !== 'Tab') return;
      const candidates = focusable();
      if (candidates.length === 0) {
        event.preventDefault();
        dialog.querySelector<HTMLElement>('.project-window__titlebar h2')?.focus();
        return;
      }
      const first = candidates[0];
      const last = candidates.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previous.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
    };
  }, [compact, state.activeSlug]);

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
        onMaximize={() => toggleMaximizeProject(window.slug)}
        onBoundsChange={(bounds) => dispatch({ type: 'setBounds', slug: window.slug, bounds })}
      />;
    })}
  </div>;
}
