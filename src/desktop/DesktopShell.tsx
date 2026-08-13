import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks';
import type { HomeProjectPreview, PublicIdentity, ProjectCase, WorkRecord } from '../data/portfolio';
import { staticGitHubFallback, unavailableNowPlaying } from '../data/presence';
import { isDesktopHistoryState, rootHistoryState, routeToTarget, stateForPush, type DesktopHistoryState } from './desktopRoute';
import { initialDesktopState, windowReducer } from './windowReducer';
import Window from './Window'; import DesktopIcons from './DesktopIcons'; import StartMenu from './StartMenu'; import Taskbar from './Taskbar';
import HomeShell from './HomeShell';
import IdentityApp from './apps/IdentityApp'; import WorkApp from './apps/WorkApp'; import ProjectApp from './apps/ProjectApp';
import NowPlayingApp from './apps/NowPlayingApp'; import NotesApp from './apps/NotesApp';
import { isGitHubSnapshotView, isNowPlayingView, usePresenceEndpoint } from './usePresence';
import type { AppId } from './types';
import { buildAppRegistry } from './appRegistry';
import { useDesktopWorkspace } from './useDesktopWorkspace';
import '../styles/desktop.css';

interface Props { identity: PublicIdentity; records: readonly WorkRecord[]; projects: readonly ProjectCase[]; previews: readonly HomeProjectPreview[] }
export default function DesktopShell({ identity, records, projects, previews }: Props) {
  const [state, dispatch] = useReducer(windowReducer, initialDesktopState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopReady, setDesktopReady] = useState(false);
  const registry = useMemo(() => buildAppRegistry(projects), [projects]);
  const nowPlaying = usePresenceEndpoint('/api/now-playing', unavailableNowPlaying, isNowPlayingView);
  const github = usePresenceEndpoint('/api/github-snapshot', staticGitHubFallback, isGitHubSnapshotView);
  const historyState = useRef<DesktopHistoryState>(rootHistoryState());
  const openers = useRef(new Map<string, HTMLElement>());
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);
  const syncWorkspace = useCallback((workspace: { x: number; y: number; width: number; height: number }) => dispatch({ type: 'workspaceChanged', workspace }), []);
  const { ref: desktopSurfaceRef, workspace, compact } = useDesktopWorkspace(syncWorkspace);

  const focusWindowHeading = (appId: string) => { requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-window-id="${appId}"] h2`)?.focus()); };
  const applyTarget = (route: string) => { const target = routeToTarget(route, registry); if (!target) return; if (target.projectSlug) { const project = projectMap.get(target.projectSlug); if (!project) return; dispatch({ type: 'open', id: 'work' }); dispatch({ type: 'openProject', slug: target.projectSlug, title: project.name }); } else if (target.appId === 'work') dispatch({ type: 'open', id: 'work' }); else dispatch({ type: 'focus', id: 'identity' }); };
  useEffect(() => {
    setDesktopReady(true);
    const root = rootHistoryState(); history.replaceState(root, '', '/'); historyState.current = root;
    const onPop = (event: PopStateEvent) => { if (!isDesktopHistoryState(event.state)) return; historyState.current = event.state; applyTarget(event.state.route); focusWindowHeading(event.state.appId); };
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
  }, []);

  const navigate = (event: MouseEvent, route: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = routeToTarget(route, registry); if (!target) return; event.preventDefault();
    const id = target.appId; openers.current.set(id, event.currentTarget as HTMLElement); applyTarget(route); setMenuOpen(false);
    if (historyState.current.route !== route) { const next = stateForPush(historyState.current, target); history.pushState(next, '', route); historyState.current = next; }
    focusWindowHeading(id);
  };
  const activate = (id: AppId) => { const win = state.windows[id]; if (!win) return; dispatch({ type: win.isMinimized ? 'restore' : 'focus', id }); };
  const close = (id: AppId) => {
    dispatch({ type: 'close', id });
    if (historyState.current.appId === id) { if (historyState.current.depth > 0) history.back(); else { const root = rootHistoryState(); history.replaceState(root, '', '/'); historyState.current = root; } }
    requestAnimationFrame(() => openers.current.get(id)?.focus());
  };
  const minimize = (id: AppId) => { dispatch({ type: 'minimize', id }); requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-taskbar-id="${id}"]`)?.focus()); };
  const windows = Object.values(state.windows);
  const renderWindow = (win: (typeof windows)[number]) => { const definition = registry.get(win.id); if (!definition) return null; return <Window key={win.id} window={win} definition={definition} workspace={workspace} compact={compact} active={state.activeId === win.id} onFocus={() => dispatch({ type: 'focus', id: win.id })} onClose={() => close(win.id)} onMinimize={() => minimize(win.id)} onMaximize={() => dispatch({ type: 'toggleMaximize', id: win.id, workspace })} onBoundsChange={(bounds) => dispatch({ type: 'setBounds', id: win.id, bounds })}>
    {win.id === 'identity' ? <IdentityApp identity={identity} onNavigate={navigate} /> : win.id === 'now-playing' ? <NowPlayingApp view={nowPlaying} /> : win.id === 'notes' ? <NotesApp /> : win.id === 'work' ? <WorkApp records={records} onNavigate={navigate} /> : win.projectSlug && projectMap.get(win.projectSlug) ? <ProjectApp project={projectMap.get(win.projectSlug)!} /> : null}
  </Window>; };
  const authoredWindow = (id: string) => { const win = state.windows[id]; return win?.placement === 'authored' ? renderWindow(win) : null; };
  const taskbar = <Taskbar windows={windows} activeId={state.activeId} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} onActivate={activate} />;
  return <div class="desktop-shell" data-desktop-ready={desktopReady}>
    <HomeShell identity={identity} previews={previews} github={github} identityWindow={authoredWindow('identity')} playerWindow={authoredWindow('now-playing')} notesWindow={authoredWindow('notes')} taskbar={taskbar} onNavigate={navigate} />
    <DesktopIcons onNavigate={navigate} />
    <div class="desktop-surface" ref={desktopSurfaceRef} aria-label="Floating desktop windows">
      {windows.filter((win) => win.placement === 'floating').map(renderWindow)}
    </div>
    <StartMenu open={menuOpen} onNavigate={navigate} />
  </div>;
}
