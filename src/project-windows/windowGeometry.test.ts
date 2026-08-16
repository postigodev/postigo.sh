import { describe, expect, it } from 'vitest';
import { clampForRecovery, resizeBounds } from './windowGeometry';

const workspace = { x: 0, y: 0, width: 1200, height: 700 };
const start = { x: 200, y: 100, width: 600, height: 400 };
const minimum = { width: 420, height: 300 };

describe('project window geometry', () => {
  it('keeps titlebar controls recoverable while allowing partial overflow', () => {
    expect(clampForRecovery({ ...start, x: -900, y: -90 }, workspace)).toEqual({ ...start, x: -472, y: 0 });
  });

  it('supports all eight resize directions with minimums and recovery', () => {
    for (const edge of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const) {
      const result = resizeBounds(start, edge, -900, -900, minimum, workspace);
      expect(result.width).toBeGreaterThanOrEqual(minimum.width);
      expect(result.height).toBeGreaterThanOrEqual(minimum.height);
      expect(result.y).toBeGreaterThanOrEqual(workspace.y);
      expect(result.x + result.width).toBeGreaterThanOrEqual(128);
    }
  });
});
