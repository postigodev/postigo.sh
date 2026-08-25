import type { GitHubMenuItem } from './githubActivityPresentation';

export const GITHUB_CANVAS_WIDTH = 320;
export const GITHUB_CANVAS_HEIGHT = 144;
export const GITHUB_ROW_Y = 26;
export const GITHUB_ROW_HEIGHT = 15;
export const GITHUB_VISIBLE_ROWS = 6;

export interface GitHubScrollbarGeometry {
  topButton: { x: number; y: number; width: number; height: number };
  bottomButton: { x: number; y: number; width: number; height: number };
  track: { x: number; y: number; width: number; height: number };
  thumb: { x: number; y: number; width: number; height: number };
}

export interface GitHubCanvasState {
  items: readonly GitHubMenuItem[];
  selected: number;
  windowStart: number;
  hover: number;
  status: 'ready' | 'empty' | 'unavailable';
}

export function githubScrollbarGeometry(windowStart: number, total: number): GitHubScrollbarGeometry | undefined {
  if (total <= GITHUB_VISIBLE_ROWS) return undefined;
  const maxStart = total - GITHUB_VISIBLE_ROWS;
  const safeStart = Math.min(Math.max(windowStart, 0), maxStart);
  const track = { x: 297, y: 38, width: 11, height: 64 };
  const thumbHeight = Math.max(12, Math.round(track.height * GITHUB_VISIBLE_ROWS / total));
  const travel = track.height - thumbHeight;
  return {
    topButton: { x: 297, y: 26, width: 11, height: 12 },
    bottomButton: { x: 297, y: 102, width: 11, height: 12 },
    track,
    thumb: { x: 298, y: track.y + Math.round(travel * safeStart / maxStart), width: 9, height: thumbHeight },
  };
}

export function githubCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * GITHUB_CANVAS_WIDTH / rect.width,
    y: (clientY - rect.top) * GITHUB_CANVAS_HEIGHT / rect.height,
  };
}

export function githubCanvasRowAt(x: number, y: number, windowStart: number, total: number): number | undefined {
  const rowRight = total > GITHUB_VISIBLE_ROWS ? 295 : 307;
  if (x < 61 || x > rowRight || y < GITHUB_ROW_Y || y >= GITHUB_ROW_Y + GITHUB_VISIBLE_ROWS * GITHUB_ROW_HEIGHT) return undefined;
  const index = windowStart + Math.floor((y - GITHUB_ROW_Y) / GITHUB_ROW_HEIGHT);
  return index < total ? index : undefined;
}

const texturePatterns = new WeakMap<CanvasRenderingContext2D, CanvasPattern>();

function dirtPattern(ctx: CanvasRenderingContext2D): CanvasPattern | undefined {
  const existing = texturePatterns.get(ctx);
  if (existing) return existing;
  const dirt = ctx.canvas.ownerDocument.createElement('canvas');
  dirt.width = 64;
  dirt.height = 64;
  const d = dirt.getContext('2d');
  if (!d) return undefined;
  let seed = 22491;
  const random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  d.fillStyle = '#080b0d';
  d.fillRect(0, 0, 64, 64);
  for (let index = 0; index < 470; index += 1) {
    const value = 9 + Math.floor(random() * 15);
    d.fillStyle = `rgb(${value},${value + 2},${value + 3})`;
    d.fillRect(Math.floor(random() * 64), Math.floor(random() * 64), random() > .92 ? 2 : 1, 1);
  }
  for (let index = 0; index < 20; index += 1) {
    d.fillStyle = `rgba(38,39,35,${.06 + random() * .06})`;
    d.fillRect(Math.floor(random() * 64), Math.floor(random() * 64), 2 + Math.floor(random() * 10), 1);
  }
  const pattern = ctx.createPattern(dirt, 'repeat') ?? undefined;
  if (pattern) texturePatterns.set(ctx, pattern);
  return pattern;
}

function serif(ctx: CanvasRenderingContext2D, size: number, weight = 'normal') {
  ctx.font = `${weight} ${size}px "Times New Roman", Times, serif`;
}

function sans(ctx: CanvasRenderingContext2D, size: number, weight = 'normal') {
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, fill = '#d6d3c8') {
  ctx.fillStyle = '#020303';
  ctx.fillText(value, x + 1, y + 1);
  ctx.fillStyle = fill;
  ctx.fillText(value, x, y);
}

function fittedText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, fill: string) {
  let rendered = value;
  while (rendered.length > 1 && ctx.measureText(rendered).width > maxWidth) rendered = `${rendered.slice(0, -2)}…`;
  text(ctx, rendered, x, y, fill);
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.fillStyle = color;
  if (y1 === y2) ctx.fillRect(x1, y1, x2 - x1 + 1, 1);
  else ctx.fillRect(x1, y1, 1, y2 - y1 + 1);
}

function frame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = '#74756e';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = '#242623';
  ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
  ctx.fillStyle = '#0b0d0f';
  ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
  line(ctx, x + 2, y + 2, x + width - 3, y + 2, '#9a998d');
  line(ctx, x + 2, y + 2, x + 2, y + height - 3, '#77786f');
  line(ctx, x + 2, y + height - 3, x + width - 3, y + height - 3, '#161816');
  line(ctx, x + width - 3, y + 2, x + width - 3, y + height - 3, '#121412');
}

function raisedBox(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(x, y, width, height);
  line(ctx, x, y, x + width - 1, y, '#ffffff');
  line(ctx, x, y, x, y + height - 1, '#ffffff');
  line(ctx, x, y + height - 1, x + width - 1, y + height - 1, '#404040');
  line(ctx, x + width - 1, y, x + width - 1, y + height - 1, '#404040');
  line(ctx, x + 1, y + height - 2, x + width - 2, y + height - 2, '#808080');
  line(ctx, x + width - 2, y + 1, x + width - 2, y + height - 2, '#808080');
}

function triangle(ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'up' | 'down') {
  ctx.fillStyle = '#111';
  for (let row = 0; row < 4; row += 1) {
    const width = direction === 'up' ? row * 2 + 1 : (4 - row) * 2 - 1;
    const offset = direction === 'up' ? 3 - row : row;
    ctx.fillRect(x + offset, y + row, width, 1);
  }
}

function drawScrollbar(ctx: CanvasRenderingContext2D, geometry: GitHubScrollbarGeometry) {
  ctx.fillStyle = '#707070';
  ctx.fillRect(geometry.track.x, geometry.track.y, geometry.track.width, geometry.track.height);
  for (let y = geometry.track.y; y < geometry.track.y + geometry.track.height; y += 2) {
    for (let x = geometry.track.x; x < geometry.track.x + geometry.track.width; x += 2) {
      ctx.fillStyle = (x + y) % 4 === 0 ? '#5d5d5d' : '#929292';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  raisedBox(ctx, geometry.topButton.x, geometry.topButton.y, geometry.topButton.width, geometry.topButton.height);
  raisedBox(ctx, geometry.bottomButton.x, geometry.bottomButton.y, geometry.bottomButton.width, geometry.bottomButton.height);
  raisedBox(ctx, geometry.thumb.x, geometry.thumb.y, geometry.thumb.width, geometry.thumb.height);
  triangle(ctx, geometry.topButton.x + 2, geometry.topButton.y + 4, 'up');
  triangle(ctx, geometry.bottomButton.x + 2, geometry.bottomButton.y + 4, 'down');
}

export function drawGitHubActivityCanvas(ctx: CanvasRenderingContext2D, state: GitHubCanvasState): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, GITHUB_CANVAS_WIDTH, GITHUB_CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, GITHUB_CANVAS_WIDTH, GITHUB_CANVAS_HEIGHT);
  const pattern = dirtPattern(ctx);
  if (pattern) {
    ctx.save();
    ctx.globalAlpha = .27;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, GITHUB_CANVAS_WIDTH, GITHUB_CANVAS_HEIGHT);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,.025)';
  ctx.fillRect(0, 44, 320, 1);
  ctx.fillRect(0, 101, 320, 1);

  serif(ctx, 13, 'bold');
  text(ctx, 'postigodev', 10, 15, '#ece9dc');
  serif(ctx, 8, 'bold');
  text(ctx, 'ACTIVITY', 259, 14, '#99988f');
  line(ctx, 9, 19, 310, 19, '#3c3e3b');
  line(ctx, 10, 20, 103, 20, '#77776d');

  frame(ctx, 8, 23, 304, 94);
  ctx.fillStyle = '#080a0c';
  ctx.fillRect(11, 26, 48, 88);
  line(ctx, 59, 26, 59, 113, '#30322f');

  if (state.status === 'ready') {
    const geometry = githubScrollbarGeometry(state.windowStart, state.items.length);
    const rowRight = geometry ? 295 : 307;
    const ageX = geometry ? 289 : 299;
    const visible = state.items.slice(state.windowStart, state.windowStart + GITHUB_VISIBLE_ROWS);
    visible.forEach((item, visibleIndex) => {
      const index = state.windowStart + visibleIndex;
      const y = GITHUB_ROW_Y + visibleIndex * GITHUB_ROW_HEIGHT;
      if (index === state.selected) {
        ctx.fillStyle = '#0b2414';
        ctx.fillRect(61, y, rowRight - 60, 14);
        line(ctx, 61, y, rowRight - 1, y, '#37d05a');
        line(ctx, 61, y + 13, rowRight - 1, y + 13, '#198733');
        line(ctx, 61, y, 61, y + 13, '#2cb84b');
        line(ctx, rowRight - 1, y, rowRight - 1, y + 13, '#126d29');
      } else if (index === state.hover) {
        ctx.fillStyle = '#111416';
        ctx.fillRect(61, y, rowRight - 60, 14);
      }
      serif(ctx, 8, 'bold');
      ctx.textAlign = 'right';
      text(ctx, item.dateLabel, 53, y + 9, '#a6a399');
      ctx.textAlign = 'left';
      serif(ctx, 10, 'bold');
      fittedText(ctx, item.repository, 69, y + 8, 80, index === state.selected ? '#e8c86d' : '#d8d4c7');
      sans(ctx, 6);
      fittedText(ctx, item.action, 154, y + 8, geometry ? 105 : 122, index === state.selected ? '#d6d1bd' : '#858780');
      ctx.textAlign = 'right';
      serif(ctx, 7);
      text(ctx, item.age, ageX, y + 8, index === state.selected ? '#d6d1bd' : '#71736e');
      ctx.textAlign = 'left';
    });
    if (geometry) drawScrollbar(ctx, geometry);
  } else {
    serif(ctx, 8, 'bold');
    ctx.textAlign = 'center';
    text(ctx, state.status === 'empty' ? 'NO RECENT PUBLIC ACTIVITY' : 'GITHUB ACTIVITY UNAVAILABLE', 160, 72, '#858780');
    ctx.textAlign = 'left';
  }

  frame(ctx, 8, 120, 304, 17);
  const selected = state.items[state.selected];
  serif(ctx, 8, 'bold');
  text(ctx, selected?.repository ?? 'postigodev', 14, 131, '#ece8da');
  sans(ctx, 6);
  fittedText(ctx, selected ? `${selected.action}  /  ${selected.target}${selected.detail ? `  /  ${selected.detail}` : ''}` : 'open github profile', 98, 131, 207, '#8b8c84');
}
