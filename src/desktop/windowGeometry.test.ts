import { describe, expect, it } from 'vitest';
import { clampForRecovery, resizeBounds } from './windowGeometry';

const workspace = { x: 0, y: 0, width: 1200, height: 700 };
const start = { x: 200, y: 100, width: 600, height: 400 };
const minimum = { width: 320, height: 220 };

describe('window geometry', () => {
  it('keeps the titlebar controls recoverable while allowing partial overflow', () => {
    expect(clampForRecovery({ ...start, x: -900, y: -90 }, workspace))
      .toEqual({ ...start, x: -472, y: 0 });
  });

  it('anchors the opposite edge during west resize and clamps minimum width', () => {
    expect(resizeBounds(start, 'w', 500, 0, minimum, workspace))
      .toEqual({ x: 480, y: 100, width: 320, height: 400 });
  });

  it('resizes from a southeast corner', () => {
    expect(resizeBounds(start, 'se', 80, 60, minimum, workspace))
      .toEqual({ x: 200, y: 100, width: 680, height: 460 });
  });
});
