# Native Desktop Window System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the authored Stitch grid with a near-cold, native-style desktop whose independent windows drag, resize, maximize, restore, route, and focus reliably.

**Architecture:** Astro continues to own static documents and deep links. One Preact island builds a typed app registry, initializes the near-cold boot preset, and renders every app through one reducer-driven `Window` primitive over a measured desktop workspace. Pure geometry helpers keep pointer behavior testable, while CSS tokens isolate the Stitch skin from mechanics.

**Tech Stack:** Astro 7.2.1, Preact 10.29.8, TypeScript 6.0.3 strict mode, plain CSS/custom properties, Vitest 4.1.10, Playwright 1.62.1, pnpm 10.26.2.

## Global Constraints

- Keep Astro as the canonical document/routing layer and Preact as progressive enhancement; direct or refreshed deep routes remain standalone Astro documents.
- Use `references/stitch/code.html` and the approved remote Stitch background as the primary composition reference; use `references/WIN98-template` only for mechanics and control geometry.
- Do not add runtime dependencies, Tailwind, component libraries, animation libraries, or global-state libraries.
- The `/` near-cold preset opens only Identity; every other app begins closed.
- Opening or focusing one app must never implicitly open, restore, or focus another app.
- All OS chrome uses sentence case; editorial content inside windows is exempt.
- Routable launchers are semantic `<a href>` elements; desktop-only utilities are `<button>` elements.
- Desktop state is not persisted and no Reset Desktop control is visible.
- Mobile disables freeform drag and resize and uses fullscreen or near-fullscreen app views.
- Preserve the approved Selected Work order: Preppie, Cimax Modernization, Koba, DM2Text, Sendo.
- Only records backed by a canonical `ProjectCase` are routable project windows; non-routable records remain visible archive rows.
- Keep the existing Spotify and GitHub server contracts, attribution, security behavior, and failure fallbacks unchanged.
- Run the final E2E gate against `dist/` through the production server configured in `playwright.config.ts`.

---

## File Structure

### New files

- `src/desktop/appRegistry.ts` — typed core/project app definitions and near-cold boot preset.
- `src/desktop/appRegistry.test.ts` — registry uniqueness, metadata, routing, and boot validation.
- `src/desktop/windowGeometry.ts` — pure drag, resize, minimum-size, and workspace revalidation calculations.
- `src/desktop/windowGeometry.test.ts` — edge/corner/minimum/recovery geometry coverage.
- `src/desktop/useDesktopWorkspace.ts` — measured desktop rectangle, compact breakpoint, and resize observation.
- `src/desktop/pointerGesture.ts` — pointer capture lifecycle shared by drag and resize handles.
- `src/desktop/Clock.tsx` — hydration-safe local taskbar clock.
- `src/desktop/apps/AboutApp.tsx` — desktop About content using the shared identity source.
- `src/desktop/apps/ResumeApp.tsx` — desktop Resume summary matching the static route.
- `src/desktop/apps/ContactApp.tsx` — desktop contact links from shared identity data.
- `src/desktop/apps/PrivacyApp.tsx` — shared public-data disclosure copy for the Privacy window.
- `src/desktop/apps/NetworkApp.tsx` — GitHub snapshot content without fake nested chrome.
- `src/data/siteContent.ts` — shared Resume and Privacy copy consumed by Astro documents and desktop windows.

### Modified files

- `src/desktop/types.ts` — unified app/window IDs, bounds, size, workspace, resize-edge, and reducer actions.
- `src/desktop/windowReducer.ts` — registry-seeded state, independent app actions, active fallback, resize, maximize, restore, and reset.
- `src/desktop/windowReducer.test.ts` — near-cold, independence, geometry round-trip, fallback, and reset tests.
- `src/desktop/desktopRoute.ts` — About, Resume, Contact, Privacy, Work, root, and implemented project route targets.
- `src/desktop/desktopRoute.test.ts` — complete route/history mapping.
- `src/desktop/Window.tsx` — one positioned frame with titlebar drag and eight resize handles.
- `src/desktop/DesktopShell.tsx` — registry-driven composition, rendering, route history, focus restoration, and workspace measurement.
- `src/desktop/DesktopIcons.tsx` — registry-driven native-style semantic launchers.
- `src/desktop/StartMenu.tsx` — registry-driven links/buttons, goat brand, Escape, and focus return.
- `src/desktop/Taskbar.tsx` — Start, open tasks, and live clock only.
- `src/desktop/apps/IdentityApp.tsx` — intercept Resume as well as Selected Work through the desktop route contract.
- `src/desktop/apps/WorkApp.tsx` — link only canonical cases and preserve truthful pending rows.
- `src/desktop/apps/ProjectApp.tsx` — apply the shared OS-button primitive to its repository action.
- `src/data/portfolio.ts` — add the approved prominent Work records without inventing case routes.
- `src/data/portfolio.test.ts` — lock Selected Work order and prominent supporting records.
- `src/pages/resume.astro` — consume shared Resume content.
- `src/pages/privacy.astro` — consume shared Privacy disclosure content.
- `src/pages/work/index.astro` — render both Work groups from the same typed sources.
- `src/styles/tokens.css` — experiment-friendly OS surface, bevel, control, focus, taskbar, and layer tokens.
- `src/styles/global.css` — shared OS button primitive and global retro scrollbar styling.
- `src/styles/desktop.css` — full-viewport Stitch desktop, icon grid, unified windows, resize handles, Start/taskbar, and mobile mode.
- `src/pages/index.astro` — remove the obsolete preview prop and keep the single Preact island.
- `tests/e2e/desktop.spec.ts` — native window, routing, resize, focus, and Start flows.
- `tests/e2e/home-shell.spec.ts` — replace authored-grid assertions with near-cold desktop assertions.
- `tests/e2e/mobile.spec.ts` — Start-driven compact navigation with no drag/resize.
- `tests/e2e/routes.spec.ts` — direct standalone documents and actual no-JavaScript desktop-link navigation.
- `docs/ARCHITECTURE.md` — remove authored-slot language and point to the unified registry/window contract.

### Removed files

- `src/desktop/HomeShell.tsx` — navbar/sidebar/authored-grid shell superseded by the native desktop.
- `src/desktop/WindowSlot.tsx` — authored placement no longer exists.
- `src/desktop/ProjectPreviewGrid.tsx` — Selected Work now lives in its own real window.
- `src/desktop/GitHubSnapshotPanel.tsx` — replaced by window content in `apps/NetworkApp.tsx`.

---

### Task 1: Introduce the typed app registry

**Files:**
- Create: `src/desktop/appRegistry.ts`
- Create: `src/desktop/appRegistry.test.ts`
- Modify: `src/desktop/types.ts`

**Interfaces:**
- Consumes: `ProjectCase` from `src/data/portfolio.ts`.
- Produces: `AppDefinition`, `AppRegistry`, `buildAppRegistry(projects)`, `nearColdBoot`, `AppId`, `Bounds`, and `Size`.

- [ ] **Step 1: Write the failing registry tests**

```ts
import { describe, expect, it } from 'vitest';
import { projectCases } from '../data/portfolio';
import { buildAppRegistry, nearColdBoot } from './appRegistry';

describe('desktop app registry', () => {
  const registry = buildAppRegistry(projectCases);

  it('defines complete unique metadata for every app', () => {
    const apps = [...registry.values()];
    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length);
    expect(new Set(apps.flatMap((app) => app.route ? [app.route] : [])).size)
      .toBe(apps.filter((app) => app.route).length);
    for (const app of apps) {
      expect(app.title).toMatch(/^[A-Z]/);
      expect(app.defaultBounds.width).toBeGreaterThanOrEqual(app.minSize.width);
      expect(app.defaultBounds.height).toBeGreaterThanOrEqual(app.minSize.height);
      expect(app.kind).toBeTruthy();
      expect(typeof app.showOnDesktop).toBe('boolean');
      expect(typeof app.showInStart).toBe('boolean');
    }
  });

  it('uses the approved near-cold boot and only creates implemented project apps', () => {
    expect(nearColdBoot).toEqual(['identity']);
    expect(registry.has('project:preppie')).toBe(true);
    expect(registry.has('project:cimax-modernization')).toBe(true);
    expect(registry.has('project:koba')).toBe(true);
    expect(registry.has('project:sendo')).toBe(true);
    expect(registry.has('project:dm2text')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and confirm the registry does not exist**

Run: `pnpm exec vitest run src/desktop/appRegistry.test.ts`

Expected: FAIL because `./appRegistry` cannot be resolved.

- [ ] **Step 3: Replace the desktop types with the unified contracts**

```ts
export interface Bounds { x: number; y: number; width: number; height: number }
export interface Size { width: number; height: number }
export type CoreAppId = 'identity' | 'about' | 'work' | 'resume' | 'contact' | 'privacy' | 'network' | 'now-playing' | 'notes';
export type ProjectAppId = `project:${string}`;
export type AppId = CoreAppId | ProjectAppId;
export type AppKind = CoreAppId | 'project';
export type ResizeEdge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type MobileMode = 'fullscreen' | 'near-fullscreen';

export interface AppDefinition {
  id: AppId;
  title: string;
  icon: 'user' | 'folder' | 'document' | 'mail' | 'network' | 'music' | 'notes' | 'lock' | 'project';
  kind: AppKind;
  route?: string;
  projectSlug?: string;
  defaultBounds: Bounds;
  minSize: Size;
  mobileMode: MobileMode;
  showOnDesktop: boolean;
  showInStart: boolean;
  desktopLabel?: string;
  startLabel?: string;
}

export type AppRegistry = ReadonlyMap<AppId, AppDefinition>;

export interface WindowState {
  id: AppId;
  title: string;
  projectSlug?: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  bounds: Bounds;
  restoreBounds?: Bounds;
}

export interface DesktopState {
  windows: Record<string, WindowState>;
  activeId: AppId | null;
  nextZ: number;
}
```

- [ ] **Step 4: Add core definitions and generate project definitions**

```ts
import type { ProjectCase } from '../data/portfolio';
import type { AppDefinition, AppId, AppRegistry } from './types';

const coreApps: readonly AppDefinition[] = [
  { id: 'identity', title: 'Piero Postigo Rocchetti', icon: 'user', kind: 'identity', route: '/', defaultBounds: { x: 250, y: 72, width: 700, height: 470 }, minSize: { width: 420, height: 320 }, mobileMode: 'fullscreen', showOnDesktop: false, showInStart: false },
  { id: 'about', title: 'About Piero', icon: 'user', kind: 'about', route: '/about', defaultBounds: { x: 120, y: 70, width: 620, height: 460 }, minSize: { width: 360, height: 280 }, mobileMode: 'fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'About Piero', startLabel: 'About Piero' },
  { id: 'work', title: 'Selected work', icon: 'folder', kind: 'work', route: '/work', defaultBounds: { x: 180, y: 58, width: 840, height: 570 }, minSize: { width: 440, height: 320 }, mobileMode: 'fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'Projects', startLabel: 'Projects' },
  { id: 'resume', title: 'Resume', icon: 'document', kind: 'resume', route: '/resume', defaultBounds: { x: 230, y: 80, width: 650, height: 500 }, minSize: { width: 380, height: 300 }, mobileMode: 'fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'Resume.pdf', startLabel: 'Resume' },
  { id: 'contact', title: 'Contact', icon: 'mail', kind: 'contact', route: '/contact', defaultBounds: { x: 300, y: 110, width: 500, height: 340 }, minSize: { width: 340, height: 250 }, mobileMode: 'near-fullscreen', showOnDesktop: true, showInStart: true },
  { id: 'privacy', title: 'Privacy', icon: 'lock', kind: 'privacy', route: '/privacy', defaultBounds: { x: 260, y: 90, width: 660, height: 480 }, minSize: { width: 380, height: 300 }, mobileMode: 'fullscreen', showOnDesktop: false, showInStart: true },
  { id: 'network', title: 'Network online', icon: 'network', kind: 'network', defaultBounds: { x: 970, y: 300, width: 330, height: 300 }, minSize: { width: 300, height: 230 }, mobileMode: 'near-fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'Network', startLabel: 'Network' },
  { id: 'now-playing', title: 'Now playing', icon: 'music', kind: 'now-playing', defaultBounds: { x: 980, y: 70, width: 330, height: 220 }, minSize: { width: 300, height: 190 }, mobileMode: 'near-fullscreen', showOnDesktop: false, showInStart: true },
  { id: 'notes', title: 'Notes.txt', icon: 'notes', kind: 'notes', defaultBounds: { x: 920, y: 210, width: 360, height: 300 }, minSize: { width: 300, height: 220 }, mobileMode: 'near-fullscreen', showOnDesktop: false, showInStart: true },
];

export const nearColdBoot = ['identity'] as const satisfies readonly AppId[];

export function buildAppRegistry(projects: readonly ProjectCase[]): AppRegistry {
  const entries: AppDefinition[] = [...coreApps, ...projects.map((project, index) => ({
    id: `project:${project.slug}` as const,
    title: project.name,
    icon: 'project' as const,
    kind: 'project' as const,
    route: `/work/${project.slug}`,
    projectSlug: project.slug,
    defaultBounds: { x: 220 + index * 22, y: 70 + index * 18, width: 780, height: 540 },
    minSize: { width: 460, height: 340 },
    mobileMode: 'fullscreen' as const,
    showOnDesktop: false,
    showInStart: false,
  }))];
  return new Map(entries.map((app) => [app.id, app]));
}
```

- [ ] **Step 5: Run the registry tests and typecheck**

Run: `pnpm exec vitest run src/desktop/appRegistry.test.ts && pnpm check`

Expected: registry tests PASS and Astro reports no errors.

- [ ] **Step 6: Commit the registry contract**

```powershell
git add src/desktop/types.ts src/desktop/appRegistry.ts src/desktop/appRegistry.test.ts
git commit -m "refactor: define typed desktop app registry"
```

---

### Task 2: Build deterministic window geometry and reducer state

**Files:**
- Create: `src/desktop/windowGeometry.ts`
- Create: `src/desktop/windowGeometry.test.ts`
- Modify: `src/desktop/windowReducer.ts`
- Modify: `src/desktop/windowReducer.test.ts`

**Interfaces:**
- Consumes: `AppRegistry`, `AppId`, `Bounds`, `Size`, and `ResizeEdge` from Task 1.
- Produces: `clampForRecovery`, `resizeBounds`, `revalidateBounds`, `createInitialDesktopState`, and a reducer whose maximize action receives the measured workspace.

- [ ] **Step 1: Write failing pure-geometry tests**

```ts
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
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `pnpm exec vitest run src/desktop/windowGeometry.test.ts src/desktop/windowReducer.test.ts`

Expected: FAIL because geometry exports are missing and the old reducer still uses placements.

- [ ] **Step 3: Implement pure desktop-relative geometry**

```ts
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

export function revalidateBounds(bounds: Bounds, workspace: Bounds): Bounds {
  return clampForRecovery(bounds, workspace);
}
```

- [ ] **Step 4: Replace placement-based reducer initialization and actions**

```ts
import type { AppId, AppRegistry, Bounds, DesktopState, WindowState } from './types';
import { revalidateBounds } from './windowGeometry';

export type DesktopAction =
  | { type: 'open' | 'focus' | 'close' | 'minimize' | 'restore'; id: AppId }
  | { type: 'setBounds'; id: AppId; bounds: Bounds }
  | { type: 'toggleMaximize'; id: AppId; workspace: Bounds }
  | { type: 'workspaceChanged'; workspace: Bounds }
  | { type: 'reset'; state: DesktopState };

export function createInitialDesktopState(registry: AppRegistry, boot: readonly AppId[]): DesktopState {
  const windows = Object.fromEntries([...registry.values()].map((app) => [app.id, {
    id: app.id,
    title: app.title,
    projectSlug: app.projectSlug,
    isOpen: boot.includes(app.id),
    isMinimized: false,
    isMaximized: false,
    zIndex: boot.indexOf(app.id) + 1,
    bounds: { ...app.defaultBounds },
  } satisfies WindowState])) as Record<string, WindowState>;
  return { windows, activeId: boot.at(-1) ?? null, nextZ: boot.length + 1 };
}

function highestVisible(state: DesktopState, excluded?: AppId): AppId | null {
  return Object.values(state.windows)
    .filter((win) => win.id !== excluded && win.isOpen && !win.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null;
}

function focus(state: DesktopState, id: AppId): DesktopState {
  const win = state.windows[id];
  if (!win) return state;
  return {
    ...state,
    activeId: id,
    nextZ: state.nextZ + 1,
    windows: { ...state.windows, [id]: { ...win, isOpen: true, isMinimized: false, zIndex: state.nextZ } },
  };
}

function update(state: DesktopState, id: AppId, change: (win: WindowState) => WindowState): DesktopState {
  const win = state.windows[id];
  return win ? { ...state, windows: { ...state.windows, [id]: change(win) } } : state;
}

export function windowReducer(state: DesktopState, action: DesktopAction): DesktopState {
  if (action.type === 'reset') return action.state;
  if (action.type === 'open' || action.type === 'focus' || action.type === 'restore') return focus(state, action.id);
  if (action.type === 'close' || action.type === 'minimize') {
    const next = update(state, action.id, (win) => ({
      ...win,
      isOpen: action.type === 'close' ? false : win.isOpen,
      isMinimized: action.type === 'minimize',
    }));
    return state.activeId === action.id ? { ...next, activeId: highestVisible(next, action.id) } : next;
  }
  if (action.type === 'setBounds') {
    return update(state, action.id, (win) => win.isMaximized ? win : { ...win, bounds: action.bounds });
  }
  if (action.type === 'workspaceChanged') {
    return {
      ...state,
      windows: Object.fromEntries(Object.values(state.windows).map((win) => [win.id, {
        ...win,
        bounds: win.isMaximized ? action.workspace : revalidateBounds(win.bounds, action.workspace),
      }])) as Record<string, WindowState>,
    };
  }
  if (action.type === 'toggleMaximize') {
    const win = state.windows[action.id];
    if (!win) return state;
    if (win.isMaximized) {
      return focus(update(state, action.id, (item) => ({
        ...item,
        isMaximized: false,
        bounds: revalidateBounds(item.restoreBounds ?? item.bounds, action.workspace),
        restoreBounds: undefined,
      })), action.id);
    }
    return focus(update(state, action.id, (item) => ({
      ...item,
      isMaximized: true,
      restoreBounds: { ...item.bounds },
      bounds: { ...action.workspace },
    })), action.id);
  }
  return state;
}
```

- [ ] **Step 5: Replace reducer tests with near-cold and independent-window assertions**

```ts
import { describe, expect, it } from 'vitest';
import { projectCases } from '../data/portfolio';
import { buildAppRegistry, nearColdBoot } from './appRegistry';
import { createInitialDesktopState, windowReducer } from './windowReducer';

const registry = buildAppRegistry(projectCases);

it('boots only Identity from registry bounds', () => {
  const state = createInitialDesktopState(registry, nearColdBoot);
  expect(Object.values(state.windows).filter((win) => win.isOpen).map((win) => win.id)).toEqual(['identity']);
  expect(state.windows.identity.bounds).toEqual(registry.get('identity')?.defaultBounds);
});

it('opens a project without opening Identity or Selected work', () => {
  let state = createInitialDesktopState(registry, []);
  state = windowReducer(state, { type: 'open', id: 'project:koba' });
  expect(state.windows['project:koba'].isOpen).toBe(true);
  expect(state.windows.identity.isOpen).toBe(false);
  expect(state.windows.work.isOpen).toBe(false);
});

it('restores untouched and resized bounds after maximize', () => {
  const workspace = { x: 0, y: 0, width: 1200, height: 700 };
  const initial = createInitialDesktopState(registry, nearColdBoot);
  const resized = windowReducer(initial, { type: 'setBounds', id: 'identity', bounds: { x: 80, y: 40, width: 800, height: 510 } });
  const maximized = windowReducer(resized, { type: 'toggleMaximize', id: 'identity', workspace });
  const restored = windowReducer(maximized, { type: 'toggleMaximize', id: 'identity', workspace });
  expect(restored.windows.identity.bounds).toEqual({ x: 80, y: 40, width: 800, height: 510 });
});

it('falls back to the highest visible window after close and minimize', () => {
  let state = createInitialDesktopState(registry, []);
  state = windowReducer(state, { type: 'open', id: 'about' });
  state = windowReducer(state, { type: 'open', id: 'work' });
  expect(windowReducer(state, { type: 'minimize', id: 'work' }).activeId).toBe('about');
  expect(windowReducer(state, { type: 'close', id: 'work' }).activeId).toBe('about');
});

it('tracks maximized workspace changes and revalidates restored windows', () => {
  const initial = createInitialDesktopState(registry, nearColdBoot);
  const first = { x: 0, y: 0, width: 1200, height: 700 };
  const second = { x: 0, y: 0, width: 900, height: 560 };
  const maximized = windowReducer(initial, { type: 'toggleMaximize', id: 'identity', workspace: first });
  const changed = windowReducer(maximized, { type: 'workspaceChanged', workspace: second });
  expect(changed.windows.identity.bounds).toEqual(second);
});

it('resets to a fresh near-cold snapshot', () => {
  const initial = createInitialDesktopState(registry, nearColdBoot);
  const changed = windowReducer(initial, { type: 'open', id: 'network' });
  expect(windowReducer(changed, { type: 'reset', state: createInitialDesktopState(registry, nearColdBoot) })).toEqual(initial);
});
```

- [ ] **Step 6: Run reducer and geometry tests**

Run: `pnpm exec vitest run src/desktop/windowGeometry.test.ts src/desktop/windowReducer.test.ts`

Expected: all focused tests PASS.

- [ ] **Step 7: Commit deterministic state and geometry**

```powershell
git add src/desktop/windowGeometry.ts src/desktop/windowGeometry.test.ts src/desktop/windowReducer.ts src/desktop/windowReducer.test.ts
git commit -m "refactor: unify desktop window state and geometry"
```

---

### Task 3: Implement measured workspace, pointer drag, and eight-way resize

**Files:**
- Create: `src/desktop/useDesktopWorkspace.ts`
- Create: `src/desktop/pointerGesture.ts`
- Modify: `src/desktop/Window.tsx`
- Test: `src/desktop/windowGeometry.test.ts`

**Interfaces:**
- Consumes: geometry helpers and `WindowState`, `AppDefinition`, `Bounds`, `ResizeEdge`.
- Produces: `useDesktopWorkspace(onChange)`, `capturePointerGesture`, and `Window` props `definition`, `workspace`, `compact`, and `onBoundsChange`.

- [ ] **Step 1: Extend geometry tests for every resize edge and recovery invariant**

```ts
it.each(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const)('keeps %s resize recoverable', (edge) => {
  const result = resizeBounds(start, edge, -900, -900, minimum, workspace);
  expect(result.width).toBeGreaterThanOrEqual(minimum.width);
  expect(result.height).toBeGreaterThanOrEqual(minimum.height);
  expect(result.y).toBeGreaterThanOrEqual(workspace.y);
  expect(result.x + result.width).toBeGreaterThanOrEqual(128);
});
```

- [ ] **Step 2: Add the workspace measurement hook**

```ts
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { Bounds } from './types';

export function useDesktopWorkspace(onChange: (workspace: Bounds) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<Bounds>({ x: 0, y: 0, width: 1, height: 1 });
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = matchMedia('(max-width: 768px)');
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const next = { x: 0, y: 0, width: rect.width, height: rect.height };
      setWorkspace(next);
      setCompact(media.matches);
      onChange(next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    media.addEventListener('change', measure);
    measure();
    return () => { observer.disconnect(); media.removeEventListener('change', measure); };
  }, [onChange]);

  return { ref, workspace, compact };
}
```

- [ ] **Step 3: Add pointer capture lifecycle**

```ts
export function capturePointerGesture(
  event: PointerEvent,
  onMove: (event: PointerEvent) => void,
  onEnd: () => void,
) {
  const owner = event.currentTarget as HTMLElement;
  const pointerId = event.pointerId;
  owner.setPointerCapture(pointerId);
  const finish = () => {
    owner.removeEventListener('pointermove', onMove);
    owner.removeEventListener('pointerup', finish);
    owner.removeEventListener('pointercancel', finish);
    if (owner.hasPointerCapture(pointerId)) owner.releasePointerCapture(pointerId);
    onEnd();
  };
  owner.addEventListener('pointermove', onMove);
  owner.addEventListener('pointerup', finish, { once: true });
  owner.addEventListener('pointercancel', finish, { once: true });
}
```

- [ ] **Step 4: Replace `Window` placement logic with numeric bounds and handles**

The component must always render `left`, `top`, `width`, and `height` from `win.bounds`; compact CSS may override those values. Titlebar drag snapshots `win.bounds`, sends delta-adjusted bounds through `clampForRecovery`, and calls `onBoundsChange`. Each handle snapshots the same bounds and calls `resizeBounds` with `definition.minSize`. Both paths return early when `compact` or maximized.

```tsx
interface Props {
  window: WindowState;
  definition: AppDefinition;
  workspace: Bounds;
  compact: boolean;
  active: boolean;
  children: ComponentChildren;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onBoundsChange: (bounds: Bounds) => void;
}

const resizeEdges = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;

export default function Window({ window: win, definition, workspace, compact, active, children, onFocus, onClose, onMinimize, onMaximize, onBoundsChange }: Props) {
if (!win.isOpen || win.isMinimized) return null;
const titleId = `window-title-${win.id.replace(':', '-')}`;

const startDrag = (event: PointerEvent) => {
  if (compact || win.isMaximized || (event.target as HTMLElement).closest('[data-window-control]')) return;
  event.preventDefault();
  const origin = { x: event.clientX, y: event.clientY };
  const start = { ...win.bounds };
  capturePointerGesture(event, (move) => {
    onBoundsChange(clampForRecovery({
      ...start,
      x: start.x + move.clientX - origin.x,
      y: start.y + move.clientY - origin.y,
    }, workspace));
  }, onFocus);
};

const startResize = (edge: ResizeEdge) => (event: PointerEvent) => {
  if (compact || win.isMaximized) return;
  event.preventDefault();
  event.stopPropagation();
  const origin = { x: event.clientX, y: event.clientY };
  const start = { ...win.bounds };
  capturePointerGesture(event, (move) => {
    onBoundsChange(resizeBounds(start, edge, move.clientX - origin.x, move.clientY - origin.y, definition.minSize, workspace));
  }, onFocus);
};

return <section
  class="os-window"
  data-window-id={win.id}
  data-active={active}
  data-maximized={win.isMaximized}
  data-mobile-mode={definition.mobileMode}
  role="region"
  aria-labelledby={titleId}
  style={{ zIndex: win.zIndex, left: win.bounds.x, top: win.bounds.y, width: win.bounds.width, height: win.bounds.height }}
  onPointerDown={onFocus}
>
  <div class="window-titlebar" onPointerDown={startDrag}>
    <h2 id={titleId} tabIndex={-1}>{win.title}</h2>
    <div class="window-controls">
      <button data-window-control aria-label={`Minimize ${win.title}`} onClick={onMinimize}>_</button>
      <button data-window-control aria-label={`${win.isMaximized ? 'Restore' : 'Maximize'} ${win.title}`} onClick={onMaximize}>□</button>
      <button data-window-control aria-label={`Close ${win.title}`} onClick={onClose}>×</button>
    </div>
  </div>
  <div class="window-body">{children}</div>
  {!compact && !win.isMaximized && resizeEdges.map((edge) => <span class={`resize-handle resize-handle--${edge}`} data-resize-handle={edge} onPointerDown={startResize(edge)} />)}
</section>;
}
```

- [ ] **Step 5: Run focused tests and typecheck**

Run: `pnpm exec vitest run src/desktop/windowGeometry.test.ts src/desktop/windowReducer.test.ts && pnpm check`

Expected: tests PASS and no TypeScript errors.

- [ ] **Step 6: Commit native pointer mechanics**

```powershell
git add src/desktop/useDesktopWorkspace.ts src/desktop/pointerGesture.ts src/desktop/Window.tsx src/desktop/windowGeometry.test.ts
git commit -m "feat: add native drag and resize mechanics"
```

---

### Task 4: Create independent app content and complete route targets

**Files:**
- Create: `src/desktop/apps/AboutApp.tsx`
- Create: `src/desktop/apps/ResumeApp.tsx`
- Create: `src/desktop/apps/ContactApp.tsx`
- Create: `src/desktop/apps/PrivacyApp.tsx`
- Create: `src/desktop/apps/NetworkApp.tsx`
- Create: `src/data/siteContent.ts`
- Modify: `src/desktop/apps/IdentityApp.tsx`
- Modify: `src/desktop/apps/WorkApp.tsx`
- Modify: `src/desktop/apps/ProjectApp.tsx`
- Modify: `src/data/portfolio.ts`
- Modify: `src/data/portfolio.test.ts`
- Modify: `src/desktop/desktopRoute.ts`
- Modify: `src/desktop/desktopRoute.test.ts`
- Modify: `src/pages/resume.astro`
- Modify: `src/pages/privacy.astro`
- Modify: `src/pages/work/index.astro`

**Interfaces:**
- Consumes: shared `identity`, `selectedWork`, `projectCases`, GitHub presence view, and `AppRegistry`.
- Produces: one renderer per registry kind, shared static/window page copy, and `routeToTarget(pathname, registry)`.

- [ ] **Step 1: Extend route tests before implementation**

```ts
const registry = buildAppRegistry(projectCases);

expect(routeToTarget('/', registry)).toEqual({ appId: 'identity', route: '/' });
expect(routeToTarget('/about', registry)).toEqual({ appId: 'about', route: '/about' });
expect(routeToTarget('/resume/', registry)).toEqual({ appId: 'resume', route: '/resume' });
expect(routeToTarget('/contact', registry)).toEqual({ appId: 'contact', route: '/contact' });
expect(routeToTarget('/privacy', registry)).toEqual({ appId: 'privacy', route: '/privacy' });
expect(routeToTarget('/work/koba', registry)).toEqual({ appId: 'project:koba', route: '/work/koba', projectSlug: 'koba' });
expect(routeToTarget('/work/dm2text', registry)).toBeUndefined();
```

- [ ] **Step 2: Run route tests and confirm missing mappings**

Run: `pnpm exec vitest run src/desktop/desktopRoute.test.ts`

Expected: FAIL for the new registry-based signature and core routes.

- [ ] **Step 3: Make route lookup registry-driven**

```ts
export function routeToTarget(pathname: string, registry: AppRegistry): RouteTarget | undefined {
  const clean = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname;
  const definition = [...registry.values()].find((app) => app.route === clean);
  return definition?.route ? {
    appId: definition.id,
    route: definition.route,
    ...(definition.projectSlug ? { projectSlug: definition.projectSlug } : {}),
  } : undefined;
}
```

Keep `DesktopHistoryState`, `stateForPush`, `rootHistoryState`, and foreign-state validation unchanged except for using `AppId` instead of plain `string`.

- [ ] **Step 4: Add shared-data content renderers**

```tsx
// src/data/siteContent.ts
export const resumeContent = {
  eyebrow: '[RESUME]',
  title: 'Resume',
  paragraphs: [
    'Software Engineer focused on backend and product engineering.',
    'This route is ready for the reviewed resume artifact.',
  ],
} as const;

export const privacyContent = {
  eyebrow: '[PUBLIC_DATA_DISCLOSURE]',
  title: 'Privacy',
  paragraphs: [
    "This portfolio displays the owner's current or recently played Spotify content: track or episode title, artist or publisher, album or show, cover art, playback status, progress, and a Spotify link. The server caches this display data for about 30 seconds.",
    'Visitors do not connect a Spotify account, and this site does not use Spotify to identify or track visitors. Spotify credentials remain server-side.',
    'GitHub profile statistics are public data cached for up to six hours.',
  ],
} as const;

// AboutApp.tsx
export default function AboutApp({ identity }: { identity: PublicIdentity }) {
  return <article class="document-app"><p>[ABOUT]</p><h1>{identity.name}</h1><p>{identity.thesis}</p></article>;
}

// ResumeApp.tsx
export default function ResumeApp() {
  return <article class="document-app"><p>{resumeContent.eyebrow}</p><h1>{resumeContent.title}</h1>{resumeContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>;
}

// ContactApp.tsx
export default function ContactApp({ identity }: { identity: PublicIdentity }) {
  return <article class="document-app"><p>[CONTACT]</p><h1>Contact</h1><ul><li><a href={identity.links.email}>Email</a></li><li><a href={identity.links.github}>GitHub</a></li><li><a href={identity.links.linkedin}>LinkedIn</a></li></ul></article>;
}

// PrivacyApp.tsx
export default function PrivacyApp({ onNavigate }: { onNavigate: (event: MouseEvent, route: string) => void }) {
  return <article class="document-app"><p>{privacyContent.eyebrow}</p><h1>{privacyContent.title}</h1>{privacyContent.paragraphs.map((paragraph, index) => <p key={paragraph}>{paragraph}{index === 2 && <> Questions can be sent through <a href="/contact" onClick={(event) => onNavigate(event, '/contact')}>Contact</a>.</>}</p>)}</article>;
}
```

Update `src/pages/resume.astro` and `src/pages/privacy.astro` to map these same exported paragraphs, preserving the Contact link in the final Privacy paragraph. This keeps Astro documents and windows on one content source.

`NetworkApp` renders the existing GitHub avatar, profile link, ready stats, and unavailable fallback without nested window chrome:

```tsx
export default function NetworkApp({ view }: { view: GitHubSnapshotView }) {
  return <div class="network-app" data-network-content>
    <div class="github-profile">
      <span class="github-avatar-frame" aria-hidden="true"><span>PP</span><img src={view.avatarUrl} alt="" width="48" height="48" onError={(event) => { event.currentTarget.hidden = true; }} /></span>
      <div><a href={view.profileUrl} target="_blank" rel="noreferrer">@{view.login}</a><p>Public GitHub snapshot</p></div>
    </div>
    {view.state === 'ready'
      ? <dl class="github-stats"><div><dt>Repositories</dt><dd>{view.publicRepos} repos</dd></div><div><dt>Audience</dt><dd>{view.followers} followers</dd></div><div><dt>Recognition</dt><dd>{view.stars} stars</dd></div><div><dt>Languages</dt><dd>{view.languages.join(' · ')}</dd></div></dl>
      : <p class="network-fallback">Profile link available</p>}
  </div>;
}
```

- [ ] **Step 5: Make Identity and Work use independent routable links**

First add the approved secondary Work pool beside, not inside, `selectedWork`:

```ts
export const prominentWork: readonly WorkRecord[] = [
  { id: 'trama', name: 'Trama', kind: 'project', signal: 'Backend + state modeling', status: 'Unreleased' },
  { id: 'aeris', name: 'Aeris', kind: 'project', signal: 'Applied AI + backend', status: 'Hackathon project' },
  { id: 'urbanlens', name: 'UrbanLens', kind: 'project', signal: 'Applied AI + geospatial', status: 'Hackathon prototype' },
  { id: 'brumaire', name: 'Brumaire', kind: 'project', signal: 'Browser/media engineering', status: 'Prototype-stage' },
];
```

Add a `portfolio.test.ts` assertion for the exact IDs and status labels. The
static `/work` document maps `selectedWork` under “Selected work” and
`prominentWork` under “Additional featured work”; both receive equivalent
record-row visual weight, and neither group invents links for records
without a canonical `ProjectCase`.

Pass the existing `onNavigate` handler to both Identity actions, including `/resume`. Change `WorkApp` to receive `records`, `prominentRecords`, and `projectSlugs: ReadonlySet<string>`. It renders the same two labelled groups and uses a shared record-row function. A record is a link only when `record.slug && projectSlugs.has(record.slug)`; otherwise it renders `<span class="record-pending">Case record follows</span>`.

```tsx
{record.slug && projectSlugs.has(record.slug)
  ? <a class="os-button" href={`/work/${record.slug}`} onClick={(event) => onNavigate(event, `/work/${record.slug}`)} aria-label={`Open ${record.name} project`}>Open record →</a>
  : <span class="record-pending">Case record follows</span>}
```

Give both Identity actions the `os-button` class, retain
`os-button--primary` on Explore selected work, and add `os-button` to
`ProjectApp`'s existing `archive-action` repository link. These are the
button-like actions inside windows that share the raised/pressed primitive.

- [ ] **Step 6: Run route tests, full unit tests, and check**

Run: `pnpm exec vitest run src/desktop/desktopRoute.test.ts && pnpm test:unit && pnpm check`

Expected: all tests PASS and Astro reports no errors.

- [ ] **Step 7: Commit independent app surfaces**

```powershell
git add src/desktop/apps src/desktop/desktopRoute.ts src/desktop/desktopRoute.test.ts src/data/portfolio.ts src/data/portfolio.test.ts src/data/siteContent.ts src/pages/resume.astro src/pages/privacy.astro src/pages/work/index.astro
git commit -m "feat: add independent desktop app surfaces"
```

---

### Task 5: Replace the authored shell with the registry-driven desktop

**Files:**
- Modify: `src/desktop/DesktopShell.tsx`
- Modify: `src/desktop/DesktopIcons.tsx`
- Modify: `src/desktop/StartMenu.tsx`
- Modify: `src/desktop/Taskbar.tsx`
- Create: `src/desktop/Clock.tsx`
- Modify: `src/pages/index.astro`
- Remove: `src/desktop/HomeShell.tsx`
- Remove: `src/desktop/WindowSlot.tsx`
- Remove: `src/desktop/ProjectPreviewGrid.tsx`
- Remove: `src/desktop/GitHubSnapshotPanel.tsx`

**Interfaces:**
- Consumes: registry, near-cold boot, unified reducer, workspace hook, all app renderers, route helpers, and existing presence hooks.
- Produces: one full-viewport `DesktopShell` with desktop icons, windows, Start, taskbar, and deterministic focus/history behavior.

- [ ] **Step 1: Add a failing near-cold browser assertion**

Replace the first test in `tests/e2e/home-shell.spec.ts` with:

```ts
test('boots near-cold with only Identity and native desktop launchers', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-desktop-ready="true"]')).toBeVisible();
  await expect(page.getByRole('region')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About Piero' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resume.pdf' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Network' })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused E2E and confirm the old shell fails it**

Run: `pnpm exec playwright test tests/e2e/home-shell.spec.ts -g "boots near-cold"`

Expected: FAIL because Player and Notes also boot, Network is not a button, and the old navbar/sidebar exist.

- [ ] **Step 3: Make `DesktopShell` initialize from the registry and measured workspace**

Use these core expressions so app state and routing have one source:

```tsx
const registry = useMemo(() => buildAppRegistry(projects), [projects]);
const initialState = useMemo(() => createInitialDesktopState(registry, nearColdBoot), [registry]);
const [state, dispatch] = useReducer(windowReducer, initialState);
const onWorkspaceChange = useCallback((workspace: Bounds) => dispatch({ type: 'workspaceChanged', workspace }), []);
const { ref: workspaceRef, workspace, compact } = useDesktopWorkspace(onWorkspaceChange);

const applyTarget = (target: RouteTarget) => {
  if (!registry.has(target.appId)) return;
  dispatch({ type: 'open', id: target.appId });
};
```

`navigate` must intercept eligible same-origin primary clicks, store the opener, call `applyTarget` for only the target, push history only when the route changes, close Start, and focus the target heading on the next animation frame. `popstate` applies only owned state and never pushes history. An owned `/` state focuses/opens Identity without resetting other windows.

`close` must dispatch first, then call `history.back()` only when the closed app is the current owned route with depth greater than zero; depth zero replaces the URL with `/` without dispatching reset. Focus returns to the stored opener, otherwise to the highest visible window heading, otherwise Start. `minimize` focuses the matching taskbar button after dispatch.

Use these handlers rather than dispatching related windows inside `applyTarget`:

```tsx
const focusWindowHeading = (id: AppId) => requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-window-id="${id}"] h2`)?.focus());
const focusStart = () => requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-start-button]')?.focus());

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

const dismissStart = () => { setMenuOpen(false); focusStart(); };
const toggleStart = () => setMenuOpen((open) => !open);

const close = (id: AppId) => {
  const fallback = Object.values(state.windows)
    .filter((win) => win.id !== id && win.isOpen && !win.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.id;
  dispatch({ type: 'close', id });
  if (historyState.current.appId === id && historyState.current.depth > 0) {
    history.back();
    return;
  }
  if (historyState.current.appId === id) {
    const root = rootHistoryState();
    history.replaceState(root, '', '/');
    historyState.current = root;
  }
  requestAnimationFrame(() => {
    const opener = openers.current.get(id);
    if (opener?.isConnected) opener.focus();
    else if (fallback) document.querySelector<HTMLElement>(`[data-window-id="${fallback}"] h2`)?.focus();
    else focusStart();
  });
};
```

- [ ] **Step 4: Render all app kinds through the one `Window` primitive**

```tsx
interface Props {
  identity: PublicIdentity;
  records: readonly WorkRecord[];
  prominentRecords: readonly WorkRecord[];
  projects: readonly ProjectCase[];
}

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
```

The returned shell structure is exactly one workspace plus taskbar/menu:

```tsx
return <div class="desktop-shell" data-desktop-ready={desktopReady}>
  <main class="desktop-workspace" ref={workspaceRef} aria-label="Piero OS desktop">
    <DesktopIcons definitions={[...registry.values()].filter((app) => app.showOnDesktop)} onNavigate={navigate} onLaunch={launchUtility} />
    <div class="desktop-windows" aria-label="Open desktop windows">
      {Object.values(state.windows).map(renderWindow)}
    </div>
  </main>
  <StartMenu open={menuOpen} definitions={[...registry.values()].filter((app) => app.showInStart)} onNavigate={navigate} onLaunch={launchUtility} onDismiss={dismissStart} />
  <Taskbar windows={Object.values(state.windows)} activeId={state.activeId} menuOpen={menuOpen} onToggleMenu={toggleStart} onActivate={activate} />
</div>;
```

- [ ] **Step 5: Add registry-driven semantic desktop icons and Start entries**

`DesktopIcons` uses a semantic launcher helper and passes
`definition.desktopLabel ?? definition.title`; Start applies the same link/button
rule with `definition.startLabel ?? definition.title`:

```tsx
type NavigateHandler = (event: MouseEvent, route: string) => void;
type LaunchHandler = (event: MouseEvent, id: AppId) => void;

interface LauncherProps {
  definition: AppDefinition;
  label: string;
  onNavigate: NavigateHandler;
  onLaunch: LaunchHandler;
}

interface DesktopIconsProps {
  definitions: readonly AppDefinition[];
  onNavigate: NavigateHandler;
  onLaunch: LaunchHandler;
}

interface StartMenuProps extends DesktopIconsProps {
  open: boolean;
  onDismiss: () => void;
}

function Launcher({ definition, label, onNavigate, onLaunch }: LauncherProps) {
  const content = <><span class={`desktop-icon-glyph desktop-icon-glyph--${definition.icon}`} aria-hidden="true" /><span>{label}</span></>;
  return definition.route
    ? <a class="desktop-icon" href={definition.route} onClick={(event) => onNavigate(event, definition.route!)}>{content}</a>
    : <button class="desktop-icon desktop-icon--button" type="button" onClick={(event) => onLaunch(event, definition.id)}>{content}</button>;
}

export default function DesktopIcons({ definitions, onNavigate, onLaunch }: DesktopIconsProps) {
  return <nav class="desktop-icons" aria-label="Desktop shortcuts">{definitions.map((definition) => <Launcher key={definition.id} definition={definition} label={definition.desktopLabel ?? definition.title} onNavigate={onNavigate} onLaunch={onLaunch} />)}</nav>;
}
```

`StartMenu` uses the same link/button rule and this keyboard contract:

```tsx
export default function StartMenu({ open, definitions, onNavigate, onLaunch, onDismiss }: StartMenuProps) {
  if (!open) return null;
  return <nav class="start-menu" aria-label="Start menu" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onDismiss(); } }}>
    <strong><span aria-hidden="true">🐐</span> Piero OS</strong>
    {definitions.map((definition) => definition.route
      ? <a key={definition.id} href={definition.route} onClick={(event) => onNavigate(event, definition.route!)}>{definition.startLabel ?? definition.title}</a>
      : <button key={definition.id} type="button" onClick={(event) => onLaunch(event, definition.id)}>{definition.startLabel ?? definition.title}</button>)}
  </nav>;
}
```

`onDismiss` closes the menu and focuses `[data-start-button]` on the next
animation frame. There is no Home entry because the Identity task and About
icon already provide identity access.

- [ ] **Step 6: Add the hydration-safe taskbar clock**

```tsx
import { useEffect, useState } from 'preact/hooks';

const formatTime = (date: Date) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);

export default function Clock() {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => setLabel(formatTime(new Date()));
    update();
    const id = window.setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);
  return <time class="taskbar-clock" aria-label={label ? `Local time ${label}` : 'Local time'}>{label}</time>;
}
```

`Taskbar` renders only Start, open-window tasks, and the clock:

```tsx
interface Props {
  windows: WindowState[];
  activeId: AppId | null;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onActivate: (id: AppId) => void;
}

export default function Taskbar({ windows, activeId, menuOpen, onToggleMenu, onActivate }: Props) {
  return <footer class="taskbar" aria-label="Desktop taskbar">
    <button data-start-button class="start-button" aria-expanded={menuOpen} onClick={onToggleMenu}><span aria-hidden="true">🐐</span> Piero OS</button>
    <div class="taskbar-items">{windows.filter((win) => win.isOpen).map((win) => <button key={win.id} data-taskbar-id={win.id} aria-pressed={activeId === win.id} onClick={() => onActivate(win.id)}>{win.title}</button>)}</div>
    <Clock />
  </footer>;
}
```

Remove `SYSTEM_READY` and the Privacy taskbar link.

- [ ] **Step 7: Remove obsolete shell files and the preview prop**

Update `src/pages/index.astro` to import `identity`, `projectCases`,
`prominentWork`, and `selectedWork`, then render:

```astro
<DesktopShell client:load identity={identity} records={selectedWork} prominentRecords={prominentWork} projects={projectCases} />
```

Delete the four superseded components listed in this task. Do not modify reference files.

- [ ] **Step 8: Run unit, check, build, and focused E2E**

Run: `pnpm test:unit && pnpm check && pnpm build && pnpm exec playwright test tests/e2e/home-shell.spec.ts -g "boots near-cold"`

Expected: all commands PASS.

- [ ] **Step 9: Commit the shell replacement**

```powershell
git add src/desktop src/pages/index.astro tests/e2e/home-shell.spec.ts
git commit -m "feat: replace authored shell with native desktop"
```

---

### Task 6: Apply the scalable Stitch/Win98 skin

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/styles/desktop.css`

**Interfaces:**
- Consumes: stable class/data attributes from Tasks 3 and 5.
- Produces: tokenized Stitch background, native desktop icons, OS controls, scrollbars, taskbar, Start menu, resize cursors, and compact mode.

- [ ] **Step 1: Add visual contract assertions before rewriting CSS**

```ts
test('uses the Stitch desktop without navbar or sidebar chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.system-bar')).toHaveCount(0);
  await expect(page.locator('.home-rail')).toHaveCount(0);
  await expect(page.locator('.desktop-shell')).toHaveCSS('overflow', 'hidden');
  await expect(page.locator('.desktop-workspace')).toHaveCSS('position', 'fixed');
});

test('uses sentence case OS chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Piero OS/ })).toBeVisible();
  await expect(page.getByText('SYSTEM_READY')).toHaveCount(0);
  await expect(page.getByText('PIERO_OS')).toHaveCount(0);
});
```

- [ ] **Step 2: Expand tokens into swappable OS concerns**

```css
:root {
  --os-desktop-bg: #090b0b;
  --os-window-bg: #050505;
  --os-window-fg: #ffffff;
  --os-control-bg: #c0c0c0;
  --os-control-fg: #1b1c19;
  --os-title-active: #0000ff;
  --os-title-inactive: #666666;
  --os-bevel-light: #ffffff;
  --os-bevel-mid: #808080;
  --os-bevel-dark: #222222;
  --os-border-width: 2px;
  --os-window-shadow: 6px 6px 0 #050505;
  --os-focus: #79ff5b;
  --os-selection: #0000ff;
  --os-taskbar-height: 42px;
  --os-titlebar-height: 31px;
  --os-layer-icons: 10;
  --os-layer-window: 100;
  --os-layer-taskbar: 10000;
  --os-layer-start: 11000;
}
```

Retain the existing career-document tokens and font tokens. Alias `--taskbar-height` to `--os-taskbar-height` until every consumer is migrated.

- [ ] **Step 3: Add reusable raised/pressed controls and global scrollbars**

```css
.os-button,
.window-controls button,
.taskbar button {
  border: var(--os-border-width) solid;
  border-color: var(--os-bevel-light) var(--os-bevel-dark) var(--os-bevel-dark) var(--os-bevel-light);
  border-radius: 0;
  background: var(--os-control-bg);
  color: var(--os-control-fg);
}
.os-button { display: inline-block; padding: 4px 12px; text-decoration: none; }

.os-button:active,
.window-controls button:active,
.taskbar button:active {
  border-color: var(--os-bevel-dark) var(--os-bevel-light) var(--os-bevel-light) var(--os-bevel-dark);
  transform: translate(1px, 1px);
}

* { scrollbar-color: var(--os-control-bg) var(--os-window-bg); scrollbar-width: auto; }
::-webkit-scrollbar { width: 16px; height: 16px; }
::-webkit-scrollbar-track { background: var(--os-window-bg); border: 1px inset var(--os-control-bg); }
::-webkit-scrollbar-thumb, ::-webkit-scrollbar-button { background: var(--os-control-bg); border: 2px outset var(--os-control-bg); }
```

- [ ] **Step 4: Rewrite desktop layout and background layer**

```css
.desktop-shell { position: fixed; inset: 0; overflow: hidden; color: var(--os-window-fg); font-family: var(--font-mono); background: var(--os-desktop-bg); }
.desktop-shell::before { content: ''; position: fixed; inset: 0; z-index: 0; background: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDVAYa-IbC4GuZLDFDOiLTCH5as881xoYMExrrPHhREoYXQHI0MQ71L_GVhLaNXr3XT1xQxYEy6bNYdrjur1Ukcyw2Ux2nKAE7wnA6rNR1CSqnOnrPDW13xgZB-02ljMr74hMjOBKSDWwIvuPy_7W0FE5p9T5wNy_ab_VQTswPslOKW3ZmSMo_poUs9dRS984CGO-SM5qgQppoLgfCzvr4q5rLVFUQsCvX-FpY1qcwdlAL77rhW7kB_Mg') center/cover fixed; filter: contrast(1.2); pointer-events: none; }
.desktop-workspace { position: fixed; z-index: 1; inset: 0 0 var(--os-taskbar-height); overflow: hidden; }
.desktop-windows { position: absolute; inset: 0; pointer-events: none; }
.desktop-windows > .os-window { pointer-events: auto; }
```

Do not apply `filter` to `body` or `.desktop-shell`; only the background pseudo-element is filtered.

- [ ] **Step 5: Style windows, handles, icons, Start, taskbar, and mobile**

```css
.resize-handle { position: absolute; z-index: 3; touch-action: none; }
.resize-handle--n, .resize-handle--s { left: 8px; right: 8px; height: 8px; cursor: ns-resize; }
.resize-handle--n { top: -4px; }
.resize-handle--s { bottom: -4px; }
.resize-handle--e, .resize-handle--w { top: 8px; bottom: 8px; width: 8px; cursor: ew-resize; }
.resize-handle--e { right: -4px; }
.resize-handle--w { left: -4px; }
.resize-handle--ne, .resize-handle--nw, .resize-handle--se, .resize-handle--sw { width: 12px; height: 12px; z-index: 4; }
.resize-handle--ne { top: -4px; right: -4px; cursor: nesw-resize; }
.resize-handle--nw { top: -4px; left: -4px; cursor: nwse-resize; }
.resize-handle--se { right: -4px; bottom: -4px; cursor: nwse-resize; }
.resize-handle--sw { left: -4px; bottom: -4px; cursor: nesw-resize; }
.window-titlebar h2, .taskbar, .start-menu, .desktop-icons { text-transform: none; }
.desktop-icon-glyph { display: grid; place-items: center; width: 34px; height: 30px; margin: 0 auto; border: 1px solid var(--os-bevel-light); background: var(--os-title-active); color: var(--os-window-fg); font: 700 20px/1 var(--font-mono); box-shadow: 2px 2px 0 var(--os-bevel-dark); }
.desktop-icon-glyph::before { content: '▣'; }
.desktop-icon-glyph--user::before { content: '☺'; }
.desktop-icon-glyph--folder::before { content: '▰'; }
.desktop-icon-glyph--document::before { content: '▤'; }
.desktop-icon-glyph--mail::before { content: '✉'; }
.desktop-icon-glyph--network::before { content: '⌁'; }
.desktop-icon-glyph--music::before { content: '♫'; }
.desktop-icon-glyph--notes::before { content: '≡'; }
.desktop-icon-glyph--lock::before { content: '▣'; }
.desktop-icon-glyph--project::before { content: '▦'; }
.desktop-icon { display: grid; justify-items: center; gap: 4px; width: 88px; padding: 4px; border: 1px solid transparent; border-radius: 0; background: transparent; color: var(--os-window-fg); font: 12px/1.2 var(--font-mono); text-align: center; text-decoration: none; text-shadow: 2px 2px 0 var(--os-bevel-dark); }
.desktop-icon:hover, .desktop-icon:focus-visible, .desktop-icon[aria-current="true"] { border-color: var(--os-bevel-light); background: color-mix(in srgb, var(--os-selection) 55%, transparent); }

@media (max-width: 768px) {
  .desktop-icons, .resize-handle { display: none; }
  .window-titlebar { cursor: default; touch-action: auto; }
  .desktop-windows .os-window { position: fixed !important; inset: 0 !important; width: auto !important; height: auto !important; min-width: 0; min-height: 0; box-shadow: none; }
  .desktop-windows .os-window:not([data-active="true"]) { display: none; }
  .desktop-windows .os-window[data-mobile-mode="near-fullscreen"] { inset: 10px !important; }
  .taskbar-items { overflow-x: auto; }
}
```

Project/editorial headings may retain their existing content casing. The
`data-mobile-mode` attribute comes from `definition.mobileMode`; compact CSS
never writes mobile geometry into reducer state.

- [ ] **Step 6: Run check, build, and visual contract tests**

Run: `pnpm check && pnpm build && pnpm exec playwright test tests/e2e/home-shell.spec.ts`

Expected: all commands PASS with no horizontal document overflow.

- [ ] **Step 7: Commit the tokenized skin**

```powershell
git add src/styles tests/e2e/home-shell.spec.ts
git commit -m "style: apply tokenized Stitch desktop skin"
```

---

### Task 7: Prove routing, focus, native resize, and mobile behavior

**Files:**
- Modify: `tests/e2e/desktop.spec.ts`
- Modify: `tests/e2e/home-shell.spec.ts`
- Modify: `tests/e2e/mobile.spec.ts`
- Modify: `tests/e2e/routes.spec.ts`
- Verify: `tests/e2e/presence.spec.ts`

**Interfaces:**
- Consumes: stable `data-window-id`, `data-resize-handle`, `data-taskbar-id`, `data-desktop-ready`, and semantic roles.
- Produces: production-output regression coverage for every critical interaction in the approved spec.

- [ ] **Step 1: Add the no-JavaScript link-following test**

```ts
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('follows the Projects desktop link to the static Work document', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.getByRole('heading', { name: 'Work', exact: true })).toBeVisible();
  });
});
```

Place this in `tests/e2e/routes.spec.ts` and remove the older no-JavaScript
test that clicks “Explore selected work”. Keep the Work→Preppie no-JavaScript
flow and the direct standalone case-document assertions.

- [ ] **Step 2: Replace coupled project tests with independent launch/history tests**

```ts
test('project reducer/UI launch does not recreate closed Identity or implicitly open Work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Close Piero Postigo Rocchetti' }).click();
  await page.getByRole('link', { name: 'Projects' }).click();
  const work = page.getByRole('region', { name: 'Selected work' });
  await work.getByRole('link', { name: 'Open Koba project' }).click();
  await page.getByRole('button', { name: 'Close Selected work' }).click();
  await expect(page.getByRole('region', { name: 'Koba' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Selected work' })).toHaveCount(0);
});
```

Retain the existing singleton and Back/Forward heading-focus assertions with
sentence-case titles, then add:

```ts
test('owned Back to root preserves unrelated utilities', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Network' }).click();
  await page.getByRole('link', { name: 'Projects' }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('region', { name: 'Network online' })).toBeVisible();
  await expect(page.locator('#window-title-identity')).toBeFocused();
});
```

- [ ] **Step 3: Add untouched maximize/restore and resize round-trip tests**

```ts
test('untouched Identity maximizes, restores, then remains draggable', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const before = await identity.boundingBox();
  await page.getByRole('button', { name: 'Maximize Piero Postigo Rocchetti' }).click();
  await page.getByRole('button', { name: 'Restore Piero Postigo Rocchetti' }).click();
  expect(await identity.boundingBox()).toEqual(before);
  const title = identity.locator('.window-titlebar');
  const box = await title.boundingBox();
  if (!box) throw new Error('Identity titlebar is unavailable');
  await page.mouse.move(box.x + 20, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 62);
  await page.mouse.up();
  expect((await identity.boundingBox())?.x).not.toBe(before?.x);
});
```

Add one east-edge and one southeast-corner drag using `[data-resize-handle="e"]` and `[data-resize-handle="se"]`; assert changed width/height, minimum-size clamping, absent handles while maximized, and exact resize→maximize→restore bounds.

```ts
test('edge and corner resize synchronize with maximize and restore', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const east = identity.locator('[data-resize-handle="e"]');
  const eastBox = await east.boundingBox();
  if (!eastBox) throw new Error('East resize handle is unavailable');
  await page.mouse.move(eastBox.x + 2, eastBox.y + eastBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(eastBox.x + 82, eastBox.y + eastBox.height / 2);
  await page.mouse.up();
  const afterEdge = await identity.boundingBox();
  const southeast = identity.locator('[data-resize-handle="se"]');
  const cornerBox = await southeast.boundingBox();
  if (!cornerBox) throw new Error('Corner resize handle is unavailable');
  await page.mouse.move(cornerBox.x + 2, cornerBox.y + 2);
  await page.mouse.down();
  await page.mouse.move(cornerBox.x + 42, cornerBox.y + 52);
  await page.mouse.up();
  const resized = await identity.boundingBox();
  expect(resized?.width).toBeGreaterThan(afterEdge?.width ?? 0);
  expect(resized?.height).toBeGreaterThan(afterEdge?.height ?? 0);
  await page.getByRole('button', { name: 'Maximize Piero Postigo Rocchetti' }).click();
  await expect(identity.locator('[data-resize-handle]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore Piero Postigo Rocchetti' }).click();
  expect(await identity.boundingBox()).toEqual(resized);
});

test('resize enforces Identity minimum width and releases pointer capture', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const east = identity.locator('[data-resize-handle="e"]');
  const handle = await east.boundingBox();
  if (!handle) throw new Error('East resize handle is unavailable');
  await page.mouse.move(handle.x + 2, handle.y + 10);
  await page.mouse.down();
  await page.mouse.move(handle.x - 900, handle.y + 10);
  await page.mouse.up();
  const minimum = await identity.boundingBox();
  expect(minimum?.width).toBe(420);
  await page.mouse.move(handle.x + 200, handle.y + 10);
  expect(await identity.boundingBox()).toEqual(minimum);
});
```

- [ ] **Step 4: Add Start, utility independence, clock, and focus tests**

```ts
test('Start exposes sentence-case apps, Privacy, and focus return', async ({ page }) => {
  await page.goto('/');
  const start = page.getByRole('button', { name: /Piero OS/ });
  await start.click();
  await expect(page.getByRole('navigation', { name: 'Start menu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Start menu' })).toHaveCount(0);
  await expect(start).toBeFocused();
  await start.click();
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('region', { name: 'Privacy' })).toHaveCount(1);
  await page.goBack();
  await expect(page.locator('#window-title-identity')).toBeFocused();
});

test('desktop-only utilities open as independent windows', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Network' }).click();
  for (const name of ['Now playing', 'Notes']) {
    await page.getByRole('button', { name: /Piero OS/ }).click();
    await page.getByRole('button', { name }).click();
  }
  for (const title of ['Network online', 'Now playing', 'Notes.txt']) {
    const app = page.getByRole('region', { name: title });
    await expect(app).toBeVisible();
    await expect(app.locator('.window-controls button')).toHaveCount(3);
  }
  await expect(page).toHaveURL(/\/$/);
});

test('taskbar clock and minimize/restore focus behave natively', async ({ page }) => {
  await page.goto('/');
  const clock = page.locator('.taskbar-clock');
  await expect(clock).not.toHaveText('');
  await expect(clock).toHaveText(/\d{1,2}:\d{2}/);
  await page.getByRole('button', { name: 'Minimize Piero Postigo Rocchetti' }).click();
  const task = page.locator('[data-taskbar-id="identity"]');
  await expect(task).toBeFocused();
  await task.click();
  await expect(page.locator('#window-title-identity')).toBeFocused();
});
```

- [ ] **Step 5: Rewrite mobile tests around Start and compact windows**

```ts
test('mobile opens Projects through Start without drag or resize handles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Piero OS/ }).click();
  await page.getByRole('link', { name: 'Projects' }).click();
  const work = page.getByRole('region', { name: 'Selected work' });
  await expect(work).toBeVisible();
  await expect(work).toHaveCSS('position', 'fixed');
  await expect(work.locator('[data-resize-handle]')).toHaveCount(0);
});
```

Retain the full Preppie evidence assertion and add this desktop/compact round trip:

```ts
test('compact mode does not overwrite restored desktop bounds', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const desktopBounds = await identity.boundingBox();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(identity.locator('[data-resize-handle]')).toHaveCount(0);
  await page.setViewportSize({ width: 1024, height: 768 });
  expect(await identity.boundingBox()).toEqual(desktopBounds);
});
```

- [ ] **Step 6: Run all browser tests against the production build**

Run: `pnpm test:e2e`

Expected: Playwright first builds Astro, serves `dist/`, and all E2E tests PASS.

- [ ] **Step 7: Commit interaction regression coverage**

```powershell
git add tests/e2e
git commit -m "test: cover native desktop interaction contract"
```

---

### Task 8: Align architecture docs and run the release gate

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Verify: `docs/superpowers/specs/2026-08-13-native-desktop-window-system-design.md`
- Verify: all modified production and test files.

**Interfaces:**
- Consumes: the completed implementation and approved spec.
- Produces: current architecture documentation and release evidence from the built output.

- [ ] **Step 1: Replace obsolete authored-grid architecture language**

Update `docs/ARCHITECTURE.md` so it states:

```markdown
### Unified native desktop placement

Every registered app uses numeric desktop-relative bounds from creation. The
near-cold `/` preset opens only Identity. The measured workspace excludes the
taskbar; pointer drag and resize update reducer bounds, while mobile presentation
never overwrites desktop geometry.

### Route independence

Opening a routable target opens or focuses only that app. Owned Back/Forward
entries focus their target without closing unrelated windows or replaying the
boot preset. Direct and refreshed deep routes remain standalone Astro documents.
```

Remove claims that Identity, Now Playing, and Notes occupy authored grid slots,
that Network is a persistent panel, or that the home includes navbar/sidebar
structure. Link the approved native-desktop spec from the implementation-phase
section.

- [ ] **Step 2: Run the self-contained quality gate**

Run sequentially:

```powershell
pnpm test:unit
pnpm check
pnpm build
pnpm test:functions
pnpm test:e2e
```

Expected:

- Vitest unit and function suites PASS.
- Astro check reports zero errors.
- Astro production build completes and writes `dist/`.
- Playwright builds/serves `dist/` and all configured Chromium tests PASS.

- [ ] **Step 3: Inspect the production DOM at four viewports**

Use Playwright or the in-app browser against the production server to inspect
1440×900, 1024×768, 768×1024, and 390×844. Confirm one boot window, readable
icon labels, no navbar/sidebar, no horizontal document overflow, reachable
window controls, functional Start, and no filtered/blurred child content.

- [ ] **Step 4: Check the final diff for scope and reference safety**

Run:

```powershell
git status --short
git diff --check
git diff --stat
git diff -- references
```

Expected: no whitespace errors, no changes under `references/`, and no unrelated
career, presence-function, dependency, or deployment changes.

- [ ] **Step 5: Commit architecture alignment**

```powershell
git add docs/ARCHITECTURE.md
git commit -m "docs: align architecture with native desktop"
```

- [ ] **Step 6: Report release evidence without deploying**

Record the exact passing test counts, build result, production viewport checks,
and any deferred content routes. Do not push, merge, or deploy unless the user
separately requests those external changes.
