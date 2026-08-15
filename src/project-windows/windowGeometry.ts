import type { Bounds, ResizeEdge, Size } from './types';

export const TITLEBAR_HEIGHT = 31;
export const RECOVERY_WIDTH = 128;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function clampForRecovery(bounds: Bounds, workspace: Bounds): Bounds {
  return {
    ...bounds,
    x: clamp(bounds.x, workspace.x - bounds.width + RECOVERY_WIDTH, workspace.x + workspace.width - RECOVERY_WIDTH),
    y: clamp(bounds.y, workspace.y, workspace.y + workspace.height - TITLEBAR_HEIGHT),
  };
}

export function resizeBounds(start: Bounds, edge: ResizeEdge, dx: number, dy: number, min: Size, workspace: Bounds): Bounds {
  const east = edge.includes('e');
  const west = edge.includes('w');
  const north = edge.includes('n');
  const south = edge.includes('s');
  const width = Math.max(min.width, start.width + (east ? dx : west ? -dx : 0));
  const height = Math.max(min.height, start.height + (south ? dy : north ? -dy : 0));
  const x = west ? start.x + start.width - width : start.x;
  const y = north ? start.y + start.height - height : start.y;
  return clampForRecovery({ x, y, width, height }, workspace);
}

export const revalidateBounds = clampForRecovery;
