import type { ProjectCase } from '../data/portfolio';
import { capturePointerGesture } from './pointerGesture';
import ProjectCaseContent from './ProjectCase';
import type { Bounds, ProjectWindowState, ResizeEdge } from './types';
import { clampForRecovery, resizeBounds } from './windowGeometry';

interface Props {
  project: ProjectCase;
  projects: readonly ProjectCase[];
  window: ProjectWindowState;
  workspace: Bounds;
  compact: boolean;
  active: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMaximize: () => void;
  onBoundsChange: (bounds: Bounds) => void;
}

const resizeEdges = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
const minimum = { width: 460, height: 340 };

export default function ProjectWindow({ project, projects, window, workspace, compact, active, onFocus, onClose, onMaximize, onBoundsChange }: Props) {
  if (!window.isOpen) return null;
  const titleId = `project-window-title-${window.slug}`;

  const startDrag = (event: PointerEvent) => {
    if (compact || window.isMaximized || (event.target as HTMLElement).closest('[data-window-control]')) return;
    event.preventDefault();
    const origin = { x: event.clientX, y: event.clientY };
    const start = { ...window.bounds };
    capturePointerGesture(event, (move) => onBoundsChange(clampForRecovery({
      ...start,
      x: start.x + move.clientX - origin.x,
      y: start.y + move.clientY - origin.y,
    }, workspace)), onFocus);
  };

  const startResize = (edge: ResizeEdge) => (event: PointerEvent) => {
    if (compact || window.isMaximized) return;
    event.preventDefault();
    event.stopPropagation();
    const origin = { x: event.clientX, y: event.clientY };
    const start = { ...window.bounds };
    capturePointerGesture(event, (move) => onBoundsChange(resizeBounds(
      start, edge, move.clientX - origin.x, move.clientY - origin.y, minimum, workspace,
    )), onFocus);
  };

  return <section
    class="project-window"
    data-project-window={window.slug}
    data-active={active}
    data-maximized={window.isMaximized}
    role="dialog"
    aria-modal={compact ? 'true' : undefined}
    aria-labelledby={titleId}
    style={{ zIndex: window.zIndex, left: window.bounds.x, top: window.bounds.y, width: window.bounds.width, height: window.bounds.height }}
    onPointerDown={onFocus}
  >
    <div class="project-window__titlebar" data-window-titlebar onPointerDown={startDrag}>
      <h2 id={titleId} tabIndex={-1}>{window.title} · case study</h2>
      <div class="project-window__controls" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" data-window-control data-maximize-project aria-label={`${window.isMaximized ? 'Restore' : 'Maximize'} ${window.title}`} onClick={onMaximize}>□</button>
        <button type="button" data-window-control data-close-project aria-label={`Close ${window.title}`} onClick={onClose}>×</button>
      </div>
    </div>
    <div class="project-window__body"><div class="project-window__content">
      <nav class="project-window__switcher" aria-label="Open another project">
        <span>cases:</span>
        {projects.filter((item) => item.slug !== project.slug).map((item) => <a data-project-launcher href={`/work/${item.slug}`} key={item.slug}>{item.name}</a>)}
      </nav>
      <ProjectCaseContent project={project} />
    </div></div>
    {!compact && !window.isMaximized && resizeEdges.map((edge) => <span key={edge} class={`project-resize project-resize--${edge}`} data-resize-handle={edge} onPointerDown={startResize(edge)} />)}
  </section>;
}
