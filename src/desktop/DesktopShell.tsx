import { useEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks';
import type { PublicIdentity, ProjectCase, WorkRecord } from '../data/portfolio';
import { isDesktopHistoryState, rootHistoryState, routeToTarget, stateForPush, type DesktopHistoryState } from './desktopRoute';
import { initialDesktopState, windowReducer } from './windowReducer';
import Window from './Window'; import DesktopIcons from './DesktopIcons'; import StartMenu from './StartMenu'; import Taskbar from './Taskbar';
import IdentityApp from './apps/IdentityApp'; import WorkApp from './apps/WorkApp'; import ProjectApp from './apps/ProjectApp';
import '../styles/desktop.css';

interface Props { identity: PublicIdentity; records: readonly WorkRecord[]; projects: readonly ProjectCase[] }
export default function DesktopShell({ identity, records, projects }: Props) {
  const [state, dispatch] = useReducer(windowReducer, initialDesktopState);
  const [menuOpen, setMenuOpen] = useState(false);
  const historyState = useRef<DesktopHistoryState>(rootHistoryState());
  const openers = useRef(new Map<string, HTMLElement>());
  const projectMap = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [projects]);

  const applyTarget = (route: string) => { const target = routeToTarget(route); if (!target) return; if (target.projectSlug) { dispatch({ type: 'open', id: 'work' }); dispatch({ type: 'openProject', slug: target.projectSlug }); } else if (target.appId === 'work') dispatch({ type: 'open', id: 'work' }); else dispatch({ type: 'focus', id: 'identity' }); };
  useEffect(() => {
    const root = rootHistoryState(); history.replaceState(root, '', '/'); historyState.current = root;
    const onPop = (event: PopStateEvent) => { if (!isDesktopHistoryState(event.state)) return; historyState.current = event.state; applyTarget(event.state.route); requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-window-id="${event.state.appId}"] h2`)?.focus()); };
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
  }, []);

  const navigate = (event: MouseEvent, route: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = routeToTarget(route); if (!target) return; event.preventDefault();
    const id = target.appId; openers.current.set(id, event.currentTarget as HTMLElement); applyTarget(route); setMenuOpen(false);
    if (historyState.current.route !== route) { const next = stateForPush(historyState.current, target); history.pushState(next, '', route); historyState.current = next; }
  };
  const activate = (id: string) => { const win = state.windows[id]; if (!win) return; dispatch({ type: win.isMinimized ? 'restore' : 'focus', id }); };
  const close = (id: string) => {
    dispatch({ type: 'close', id });
    if (historyState.current.appId === id) { if (historyState.current.depth > 0) history.back(); else { const root = rootHistoryState(); history.replaceState(root, '', '/'); historyState.current = root; } }
    requestAnimationFrame(() => openers.current.get(id)?.focus());
  };
  const minimize = (id: string) => { dispatch({ type: 'minimize', id }); requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-taskbar-id="${id}"]`)?.focus()); };
  const windows = Object.values(state.windows);
  return <div class="desktop-shell"><header class="system-bar"><strong>POSTIGO_OS</strong><span>🐐</span><nav aria-label="Primary"><a href="/">Home</a><a href="/work" onClick={(e) => navigate(e, '/work')}>Work</a><a href="/resume">Resume</a><a href="/about">About</a><a href="/contact">Contact</a></nav><span>ARCHIVE</span></header>
    <DesktopIcons onNavigate={navigate} />
    <main class="desktop-surface">
      {windows.map((win) => <Window window={win} active={state.activeId === win.id} onFocus={() => dispatch({ type: 'focus', id: win.id })} onClose={() => close(win.id)} onMinimize={() => minimize(win.id)} onMaximize={() => dispatch({ type: 'toggleMaximize', id: win.id })} onMove={(x, y) => dispatch({ type: 'move', id: win.id, x, y })}>
        {win.id === 'identity' ? <IdentityApp identity={identity} onNavigate={navigate} /> : win.id === 'work' ? <WorkApp records={records} onNavigate={navigate} /> : win.projectSlug && projectMap.get(win.projectSlug) ? <ProjectApp project={projectMap.get(win.projectSlug)!} /> : null}
      </Window>)}
    </main>
    <StartMenu open={menuOpen} onNavigate={navigate} />
    <Taskbar windows={windows} activeId={state.activeId} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} onActivate={activate} />
  </div>;
}
