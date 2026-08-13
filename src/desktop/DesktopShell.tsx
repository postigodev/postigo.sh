import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks';
import type { ProjectCase, PublicIdentity, WorkRecord } from '../data/portfolio';
import { staticGitHubFallback, unavailableNowPlaying } from '../data/presence';
import { buildAppRegistry, nearColdBoot } from './appRegistry';
import AboutApp from './apps/AboutApp';
import ContactApp from './apps/ContactApp';
import IdentityApp from './apps/IdentityApp';
import NetworkApp from './apps/NetworkApp';
import NotesApp from './apps/NotesApp';
import NowPlayingApp from './apps/NowPlayingApp';
import PrivacyApp from './apps/PrivacyApp';
import ProjectApp from './apps/ProjectApp';
import ResumeApp from './apps/ResumeApp';
import WorkApp from './apps/WorkApp';
import { isDesktopHistoryState, rootHistoryState, routeToTarget, stateForClose, stateForPush, type DesktopHistoryState, type RouteTarget } from './desktopRoute';
import DesktopIcons from './DesktopIcons';
import StartMenu from './StartMenu';
import Taskbar from './Taskbar';
import type { AppDefinition, AppId, Bounds, WindowState } from './types';
import { useDesktopWorkspace } from './useDesktopWorkspace';
import { isGitHubSnapshotView, isNowPlayingView, usePresenceEndpoint } from './usePresence';
import Window from './Window';
import { createInitialDesktopState, windowReducer } from './windowReducer';
import '../styles/desktop.css';

interface Props {
  identity: PublicIdentity;
  records: readonly WorkRecord[];
  prominentRecords: readonly WorkRecord[];
  projects: readonly ProjectCase[];
}

export default function DesktopShell({ identity, records, prominentRecords, projects }: Props) {
  const registry = useMemo(() => buildAppRegistry(projects), [projects]);
  const initialState = useMemo(() => createInitialDesktopState(registry, nearColdBoot), [registry]);
  const [state, dispatch] = useReducer(windowReducer, initialState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopReady, setDesktopReady] = useState(false);
  const historyState = useRef<DesktopHistoryState>(rootHistoryState());
  const openers = useRef(new Map<AppId, HTMLElement>());
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);
  const projectSlugs = useMemo(() => new Set(projects.map((project) => project.slug)), [projects]);
  const syncWorkspace = useCallback((workspace: Bounds) => dispatch({ type: 'workspaceChanged', workspace }), []);
  const { ref: workspaceRef, workspace, compact } = useDesktopWorkspace(syncWorkspace);
  const nowPlayingOpen = state.windows['now-playing']?.isOpen ?? false;
  const networkOpen = state.windows.network?.isOpen ?? false;
  const nowPlaying = usePresenceEndpoint('/api/now-playing', unavailableNowPlaying, isNowPlayingView, nowPlayingOpen);
  const github = usePresenceEndpoint('/api/github-snapshot', staticGitHubFallback, isGitHubSnapshotView, networkOpen);

  const focusWindowHeading = (id: AppId) => requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-window-id="${id}"] h2`)?.focus());
  const focusStart = () => requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-start-button]')?.focus());
  const applyTarget = (target: RouteTarget) => {
    if (registry.has(target.appId)) dispatch({ type: 'open', id: target.appId });
  };

  useEffect(() => {
    setDesktopReady(true);
    const root = rootHistoryState();
    history.replaceState(root, '', '/');
    historyState.current = root;
    const onPop = (event: PopStateEvent) => {
      if (!isDesktopHistoryState(event.state)) return;
      historyState.current = event.state;
      applyTarget(event.state);
      focusWindowHeading(event.state.appId);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  const navigate = (event: MouseEvent, route: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = routeToTarget(route, registry);
    if (!target) return;
    event.preventDefault();
    openers.current.set(target.appId, event.currentTarget as HTMLElement);
    applyTarget(target);
    setMenuOpen(false);
    if (historyState.current.route !== target.route) {
      const next = stateForPush(historyState.current, target);
      history.pushState(next, '', target.route);
      historyState.current = next;
    }
    focusWindowHeading(target.appId);
  };

  const launchUtility = (event: MouseEvent, id: AppId) => {
    openers.current.set(id, event.currentTarget as HTMLElement);
    dispatch({ type: 'open', id });
    setMenuOpen(false);
    focusWindowHeading(id);
  };

  const activate = (id: AppId) => {
    const win = state.windows[id];
    if (!win) return;
    dispatch({ type: win.isMinimized ? 'restore' : 'focus', id });
    focusWindowHeading(id);
  };

  const minimize = (id: AppId) => {
    dispatch({ type: 'minimize', id });
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-taskbar-id="${id}"]`)?.focus());
  };

  const close = (id: AppId) => {
    const fallback = Object.values(state.windows)
      .filter((win) => win.id !== id && win.isOpen && !win.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0]?.id;
    const replacement = stateForClose(historyState.current, id);
    dispatch({ type: 'close', id });
    if (replacement) {
      history.replaceState(replacement, '', replacement.route);
      historyState.current = replacement;
    }
    requestAnimationFrame(() => {
      if (fallback) {
        document.querySelector<HTMLElement>(`[data-window-id="${fallback}"] h2`)?.focus();
        return;
      }
      const opener = openers.current.get(id);
      if (opener?.isConnected) opener.focus();
      else document.querySelector<HTMLElement>('[data-start-button]')?.focus();
    });
  };

  const dismissStart = () => {
    setMenuOpen(false);
    focusStart();
  };

  const renderApp = (definition: AppDefinition) => {
    switch (definition.kind) {
      case 'identity': return <IdentityApp identity={identity} onNavigate={navigate} />;
      case 'about': return <AboutApp identity={identity} />;
      case 'work': return <WorkApp records={records} prominentRecords={prominentRecords} projectSlugs={projectSlugs} onNavigate={navigate} />;
      case 'resume': return <ResumeApp />;
      case 'contact': return <ContactApp identity={identity} />;
      case 'privacy': return <PrivacyApp onNavigate={navigate} />;
      case 'network': return <NetworkApp view={github} />;
      case 'now-playing': return <NowPlayingApp view={nowPlaying} />;
      case 'notes': return <NotesApp />;
      case 'project': return definition.projectSlug && projectMap.has(definition.projectSlug) ? <ProjectApp project={projectMap.get(definition.projectSlug)!} /> : null;
    }
  };

  const renderWindow = (win: WindowState) => {
    const definition = registry.get(win.id);
    if (!definition) return null;
    return <Window
      key={win.id}
      window={win}
      definition={definition}
      workspace={workspace}
      compact={compact}
      active={state.activeId === win.id}
      onFocus={() => dispatch({ type: 'focus', id: win.id })}
      onClose={() => close(win.id)}
      onMinimize={() => minimize(win.id)}
      onMaximize={() => dispatch({ type: 'toggleMaximize', id: win.id, workspace })}
      onBoundsChange={(bounds) => dispatch({ type: 'setBounds', id: win.id, bounds })}
    >{renderApp(definition)}</Window>;
  };

  const definitions = [...registry.values()];
  return <div class="desktop-shell" data-desktop-ready={desktopReady}>
    <main class="desktop-workspace" ref={workspaceRef} aria-label="Piero OS desktop">
      <DesktopIcons definitions={definitions.filter((app) => app.showOnDesktop)} onNavigate={navigate} onLaunch={launchUtility} />
      <div class="desktop-windows" aria-label="Open desktop windows">{Object.values(state.windows).map(renderWindow)}</div>
    </main>
    <StartMenu open={menuOpen} definitions={definitions.filter((app) => app.showInStart)} onNavigate={navigate} onLaunch={launchUtility} onDismiss={dismissStart} />
    <Taskbar windows={Object.values(state.windows)} activeId={state.activeId} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} onActivate={activate} />
  </div>;
}
