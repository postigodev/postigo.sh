# Portfolio First Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static-first Astro portfolio whose homepage progressively enhances into the approved Stitch-skinned desktop, with Identity, Work, and a routable Sendo project window.

**Architecture:** Astro owns every document and route. One Preact island renders the desktop and centralizes window/history mechanics through pure reducer and route modules. Static pages and desktop apps consume the same typed public-content projection.

**Tech Stack:** Astro, `@astrojs/preact`, Preact, TypeScript strict, plain CSS, Vitest, Playwright, pnpm.

## Global Constraints

- Career facts derive in order from `career_evidence.yaml`, `career_positioning.yaml`, and `career_editorial_policy.yaml`.
- `docs/stitch-design-system.md` controls production tokens and skin; `references/stitch/` controls approved composition; `references/WIN98-template/` contributes mechanics only.
- Public language is English.
- Primary identity is `Software Engineer`; directional descriptor is `backend + product engineering`.
- Selected Work order is Preppie, Cimax Modernization, Koba, DM2Text, Sendo.
- Sendo is the first implemented case study only; implementation order does not change portfolio ranking.
- Do not add Tailwind, a component library, an animation framework, a global state library, or desktop-state persistence.
- Only actual interactive windows receive window chrome.
- Desktop is spatial; mobile is a direct fullscreen app experience with no drag requirement.
- Initial documents are `/`, `/work`, `/work/sendo`, `/resume`, `/about`, `/contact`, and `/404`.
- Resume, About, and Contact are static routable documents in this slice; their desktop-window surfaces are explicitly deferred while Identity, Work, and Project are implemented by WindowManager.
- No initial iframes, autoplay media, large texture assets, or speculative runtime dependencies.

---

## Planned File Map

```text
package.json                         scripts and dependency boundary
astro.config.mjs                    Preact integration and static output
tsconfig.json                       strict Astro TypeScript configuration
vitest.config.ts                    pure-state test runner
playwright.config.ts                desktop/mobile/no-JS browser projects
src/layouts/BaseLayout.astro        shared document shell and metadata
src/data/portfolio.ts               reviewed public typed content projection
src/data/portfolio.test.ts          content invariants and attribution guards
src/pages/index.astro               SSR homepage plus the single Preact island
src/pages/work/index.astro          static Work document
src/pages/work/[slug].astro         static project documents
src/pages/resume.astro              static Resume destination
src/pages/about.astro               static About destination
src/pages/contact.astro             static Contact destination
src/pages/404.astro                 useful unknown-route document
src/desktop/types.ts                app/window contracts
src/desktop/windowReducer.ts        centralized window transitions
src/desktop/windowReducer.test.ts   reducer behavior and invariants
src/desktop/desktopRoute.ts         minimal owned-history contract
src/desktop/desktopRoute.test.ts    route parsing/state invariants
src/desktop/DesktopShell.tsx        desktop orchestration and popstate bridge
src/desktop/Window.tsx              accessible non-modal window primitive
src/desktop/DesktopIcons.tsx        single-click/keyboard app launchers
src/desktop/Taskbar.tsx             open/minimized app activation
src/desktop/StartMenu.tsx           direct Home/Work/Resume/About/Contact paths
src/desktop/apps/IdentityApp.tsx    approved first-load identity content
src/desktop/apps/WorkApp.tsx        selected-work archive records
src/desktop/apps/ProjectApp.tsx     evidence-backed project record renderer
src/styles/tokens.css               canonical Stitch tokens
src/styles/global.css               reset, fonts, focus, document fallback
src/styles/desktop.css              desktop/window/taskbar responsive skin
tests/e2e/desktop.spec.ts           desktop mechanics and history
tests/e2e/routes.spec.ts            direct documents and no-JS fallback
tests/e2e/mobile.spec.ts            direct mobile app behavior
```

## Task 1: Establish the Static Astro Toolchain and Document Shell

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/404.astro`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: `BaseLayout` props `{ title: string; description: string }`.
- Produces: scripts `check`, `build`, `test:unit`, and `test:e2e` used by every later task.

- [ ] **Step 1: Create the package and framework configuration**

```json
{
  "name": "portfolio-v2",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "build": "astro build",
    "preview": "astro preview",
    "test:unit": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/preact": "6.0.2",
    "astro": "7.2.1",
    "preact": "10.29.8"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@playwright/test": "1.62.1",
    "typescript": "7.0.2",
    "vitest": "4.1.10"
  }
}
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({ output: 'static', integrations: [preact()] });
```

```json
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "preact" }
}
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
```

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: { baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:4321', trace: 'retain-on-failure' },
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL ? undefined : {
    command: 'pnpm dev --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
```

- [ ] **Step 2: Install dependencies and Chromium**

Run: `pnpm install && pnpm exec playwright install chromium`

Expected: `pnpm-lock.yaml` is created and Chromium installation exits `0`.

- [ ] **Step 3: Add the shared document shell and explicit 404**

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/tokens.css';
import '../styles/global.css';
interface Props { title: string; description: string }
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body><slot /></body>
</html>
```

```astro
---
// src/pages/404.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Not found | Piero Postigo Rocchetti" description="The requested portfolio record does not exist.">
  <main><h1>Record not found</h1><p><a href="/work">Return to Work</a></p></main>
</BaseLayout>
```

```css
/* src/styles/tokens.css */
:root {
  --surface: #fbf9f4;
  --on-surface: #1b1c19;
  --primary: #0001bb;
  --legacy-gray: #c0c0c0;
}
```

```css
/* src/styles/global.css */
* { box-sizing: border-box; }
html { background: var(--surface); color: var(--on-surface); }
body { margin: 0; min-height: 100vh; }
a { color: var(--primary); text-decoration: underline; }
:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
```

- [ ] **Step 4: Verify the foundation**

Run: `pnpm check && pnpm build`

Expected: both commands exit `0`; `dist/404.html` exists.

- [ ] **Step 5: Commit the foundation**

```powershell
git add package.json pnpm-lock.yaml astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts src/layouts src/pages/404.astro src/styles/tokens.css src/styles/global.css
git commit -m "chore: scaffold Astro portfolio foundation"
```

## Task 2: Create the Reviewed Shared Content Projection and Static Routes

**Files:**
- Create: `src/data/portfolio.ts`
- Create: `src/data/portfolio.test.ts`
- Create: `src/pages/index.astro`
- Create: `src/pages/work/index.astro`
- Create: `src/pages/work/[slug].astro`
- Create: `src/pages/resume.astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/contact.astro`
- Create: `public/images/sendo/sendo-home.png`

**Interfaces:**
- Produces: `identity: PublicIdentity`, `selectedWork: readonly WorkRecord[]`, `projectCases: readonly ProjectCase[]`, and `getProjectCase(slug)`.
- `ProjectCase` extends `WorkRecord` with `contributions`, `evidenceRefs`, and public `links`.

- [ ] **Step 1: Write content invariant tests**

```ts
// src/data/portfolio.test.ts
import { describe, expect, it } from 'vitest';
import { identity, projectCases, selectedWork } from './portfolio';

describe('public portfolio projection', () => {
  it('keeps the approved identity and flagship order', () => {
    expect(identity.primaryIdentity).toBe('Software Engineer');
    expect(selectedWork.map((record) => record.id)).toEqual([
      'preppie', 'cimax-modernization', 'koba', 'dm2text', 'sendo'
    ]);
  });

  it('publishes only an evidence-backed first project case', () => {
    expect(projectCases.map((project) => project.slug)).toEqual(['sendo']);
    expect(projectCases[0].evidenceRefs).toContain('EV_SENDO_RELEASE_010');
    expect(projectCases[0].ownership).toBe('Solo-maintained with external contributors');
    expect(projectCases[0].artifacts.map((artifact) => artifact.kind)).toEqual([
      'release', 'screenshot', 'external-contribution'
    ]);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `pnpm test:unit -- src/data/portfolio.test.ts`

Expected: FAIL because `src/data/portfolio.ts` does not exist.

- [ ] **Step 3: Implement the typed projection**

```ts
// src/data/portfolio.ts
export type WorkKind = 'professional-experience' | 'project';

export interface WorkRecord {
  id: string;
  name: string;
  kind: WorkKind;
  signal: string;
  status: string;
  slug?: string;
}

export interface ProjectCase extends WorkRecord {
  slug: string;
  ownership: string;
  summary: string;
  contributions: readonly string[];
  evidenceRefs: readonly string[];
  artifacts: readonly PublicArtifact[];
  links: { repository: string };
}

export interface PublicArtifact {
  kind: 'release' | 'screenshot' | 'external-contribution';
  label: string;
  href: string;
  evidenceRef: string;
  caption: string;
}

export interface PublicIdentity {
  name: string;
  primaryIdentity: string;
  descriptor: string;
  thesis: string;
  links: { github: string; linkedin: string };
}

export const identity = {
  name: 'Piero Postigo Rocchetti',
  primaryIdentity: 'Software Engineer',
  descriptor: 'backend + product engineering',
  thesis: 'I build reliable software for real workflows, from APIs and data models to integrations, automation, and failure-aware product systems.',
  links: { github: 'https://github.com/postigodev', linkedin: 'https://linkedin.com/in/postigo' }
} as const satisfies PublicIdentity;

export const selectedWork = [
  { id: 'preppie', name: 'Preppie', kind: 'professional-experience', signal: 'Product + reliability', status: 'Completed' },
  { id: 'cimax-modernization', name: 'Cimax Modernization', kind: 'project', signal: 'Backend modernization', status: 'Shipped public repository' },
  { id: 'koba', name: 'Koba', kind: 'project', signal: 'Developer tooling', status: 'Shipped' },
  { id: 'dm2text', name: 'DM2Text', kind: 'project', signal: 'Browser product', status: 'Shipped on GitHub' },
  { id: 'sendo', name: 'Sendo', kind: 'project', signal: 'Rust desktop + integrations', status: 'Shipped', slug: 'sendo' }
] as const satisfies readonly WorkRecord[];

export const projectCases = [{
  ...selectedWork[4],
  slug: 'sendo',
  ownership: 'Solo-maintained with external contributors',
  summary: 'A Rust/Tauri Windows utility coordinating Fire TV ADB/TCP control with Spotify Connect.',
  contributions: [
    'Required an exact Spotify playback target identity and refused ambiguous device matches.',
    'Implemented Spotify OAuth token lifecycle and bounded ADB subprocess handling.',
    'Maintained the public project and merged external contributor pull requests.'
  ],
  evidenceRefs: ['EV_SENDO_RELEASE_010', 'EV_SENDO_EXTERNAL_PR_AGGREGATE_20260812'],
  artifacts: [
    { kind: 'release', label: 'Sendo v0.1.0 release', href: 'https://github.com/postigodev/sendo/releases/tag/v0.1.0', evidenceRef: 'EV_SENDO_RELEASE_010', caption: 'Public release and distribution record.' },
    { kind: 'screenshot', label: 'Sendo product screenshot', href: '/images/sendo/sendo-window.png', evidenceRef: 'EV_SENDO_RELEASE_010', caption: 'The shipped Windows desktop interface.' },
    { kind: 'external-contribution', label: 'External contributor pull requests', href: 'https://github.com/postigodev/sendo/pulls?q=is%3Apr+is%3Amerged', evidenceRef: 'EV_SENDO_EXTERNAL_PR_AGGREGATE_20260812', caption: 'Public merged-contribution evidence.' }
  ],
  links: { repository: 'https://github.com/postigodev/sendo' }
}] as const satisfies readonly ProjectCase[];

export function getProjectCase(slug: string): ProjectCase | undefined {
  return projectCases.find((project) => project.slug === slug);
}
```

- [ ] **Step 4: Copy the verified public Sendo screenshot into production assets**

Run:

```powershell
New-Item -ItemType Directory -Force 'public\images\sendo' | Out-Null
Invoke-WebRequest 'https://raw.githubusercontent.com/postigodev/sendo/main/assets/sendo-home.png' -OutFile 'public\images\sendo\sendo-home.png'
Get-FileHash 'public\images\sendo\sendo-home.png' -Algorithm SHA256
```

Expected: the PNG exists, has non-zero length, and its SHA-256 is recorded in the implementation notes.

- [ ] **Step 5: Add static documents using the shared data**

`src/pages/work/[slug].astro` must generate only evidence-reviewed cases:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { projectCases, type ProjectCase } from '../../data/portfolio';
export function getStaticPaths() {
  return projectCases.map((project) => ({ params: { slug: project.slug }, props: { project } }));
}
interface Props { project: ProjectCase }
const { project } = Astro.props;
---
<BaseLayout title={`${project.name} | Piero Postigo Rocchetti`} description={project.summary}>
  <main><a href="/work">← Work</a><h1>{project.name}</h1><p>{project.summary}</p>
    <p><strong>Status:</strong> {project.status}</p><p><strong>Ownership:</strong> {project.ownership}</p>
    <h2>Selected contributions</h2><ul>{project.contributions.map((item) => <li>{item}</li>)}</ul>
    <h2>Artifacts</h2><ul>{project.artifacts.map((artifact) =>
      <li><a href={artifact.href}>{artifact.label}</a><p>{artifact.caption}</p></li>
    )}</ul>
    <p><a href={project.links.repository}>Source repository</a></p>
  </main>
</BaseLayout>
```

Create `/work`, `/resume`, `/about`, and `/contact` as semantic `BaseLayout` documents. `/work` maps `selectedWork`; only records with `slug` render a case-study link. `/resume`, `/about`, and `/contact` use reviewed identity/contact fields and make no unsupported claims. `index.astro` initially renders the same identity and links; Task 5 replaces its main content with the SSR Preact island.

- [ ] **Step 6: Verify data and static routes**

Run: `pnpm test:unit -- src/data/portfolio.test.ts && pnpm check && pnpm build`

Expected: tests pass and `dist/work/sendo/index.html`, `dist/resume/index.html`, `dist/about/index.html`, and `dist/contact/index.html` exist.

- [ ] **Step 7: Commit shared content and documents**

```powershell
git add src/data src/pages public/images/sendo/sendo-home.png
git commit -m "feat: add evidence-backed portfolio documents"
```

## Task 3: Implement and Test the Window State Kernel

**Files:**
- Create: `src/desktop/types.ts`
- Create: `src/desktop/windowReducer.ts`
- Create: `src/desktop/windowReducer.test.ts`

**Interfaces:**
- Produces: `WindowState`, `DesktopState`, `DesktopAction`, `initialDesktopState`, and `windowReducer(state, action)`.
- Window IDs are `identity`, `work`, and `project:<slug>`.

- [ ] **Step 1: Define reducer tests for the complete transition boundary**

```ts
import { describe, expect, it } from 'vitest';
import { initialDesktopState, windowReducer } from './windowReducer';

describe('windowReducer', () => {
  it('boots with identity only', () => {
    expect(initialDesktopState.windows.identity.isOpen).toBe(true);
    expect(initialDesktopState.activeId).toBe('identity');
  });

  it('opens Work and a singleton project above it', () => {
    const work = windowReducer(initialDesktopState, { type: 'open', id: 'work' });
    const project = windowReducer(work, { type: 'openProject', slug: 'sendo' });
    const reopened = windowReducer(project, { type: 'openProject', slug: 'sendo' });
    expect(Object.keys(reopened.windows).filter((id) => id === 'project:sendo')).toHaveLength(1);
    expect(reopened.windows.work.isOpen).toBe(true);
    expect(reopened.activeId).toBe('project:sendo');
  });

  it('preserves and restores bounds across maximize', () => {
    const maximized = windowReducer(initialDesktopState, { type: 'toggleMaximize', id: 'identity' });
    expect(maximized.windows.identity.restoreBounds).toEqual(initialDesktopState.windows.identity.bounds);
    expect(windowReducer(maximized, { type: 'toggleMaximize', id: 'identity' }).windows.identity.bounds)
      .toEqual(initialDesktopState.windows.identity.bounds);
  });

  it('reset returns the authored composition', () => {
    const changed = windowReducer(initialDesktopState, { type: 'open', id: 'work' });
    expect(windowReducer(changed, { type: 'reset' })).toEqual(initialDesktopState);
  });
});
```

- [ ] **Step 2: Run the reducer tests and verify failure**

Run: `pnpm test:unit -- src/desktop/windowReducer.test.ts`

Expected: FAIL because the reducer modules do not exist.

- [ ] **Step 3: Implement the typed reducer**

Define `Bounds` as `{ x; y; width; height }`, expose state flags `isOpen`, `isMinimized`, `isMaximized`, `zIndex`, and `restoreBounds`, and implement actions `open`, `openProject`, `close`, `focus`, `minimize`, `restore`, `toggleMaximize`, `move`, and `reset`. `move` must clamp `x` and `y` from values already calculated against the desktop bounds by the pointer adapter; the reducer must remain DOM-free. Every focus/open transition increments `nextZ` exactly once.

- [ ] **Step 4: Run all reducer tests**

Run: `pnpm test:unit -- src/desktop/windowReducer.test.ts`

Expected: PASS with four tests and no duplicated project window.

- [ ] **Step 5: Commit the state kernel**

```powershell
git add src/desktop/types.ts src/desktop/windowReducer.ts src/desktop/windowReducer.test.ts
git commit -m "feat: add desktop window state kernel"
```

## Task 4: Implement the Owned Browser-History Contract

**Files:**
- Create: `src/desktop/desktopRoute.ts`
- Create: `src/desktop/desktopRoute.test.ts`

**Interfaces:**
- Produces: `DesktopHistoryState`, `routeToTarget(pathname)`, `stateForPush(current, target)`, and `isDesktopHistoryState(value)`.
- Consumes window IDs from `types.ts`; it does not import DOM or Preact.

- [ ] **Step 1: Write route/history tests**

```ts
import { describe, expect, it } from 'vitest';
import { isDesktopHistoryState, routeToTarget, stateForPush } from './desktopRoute';

describe('desktop route contract', () => {
  it('maps only routable apps', () => {
    expect(routeToTarget('/')).toEqual({ appId: 'identity', route: '/' });
    expect(routeToTarget('/work')).toEqual({ appId: 'work', route: '/work' });
    expect(routeToTarget('/work/sendo')).toEqual({ appId: 'project:sendo', route: '/work/sendo', projectSlug: 'sendo' });
    expect(routeToTarget('/status')).toBeUndefined();
  });

  it('increments owned depth without accepting foreign state', () => {
    const root = { portfolioDesktop: true, entryId: 0, depth: 0, route: '/', appId: 'identity' } as const;
    expect(stateForPush(root, routeToTarget('/work')!)).toMatchObject({ entryId: 1, depth: 1, route: '/work' });
    expect(isDesktopHistoryState({ route: '/work' })).toBe(false);
  });
});
```

- [ ] **Step 2: Verify the tests fail, then implement the pure contract**

Run: `pnpm test:unit -- src/desktop/desktopRoute.test.ts`

Expected before implementation: FAIL for missing module. Implement the exact state fields from the approved spec and restrict parsing to `/`, `/work`, `/work/sendo`, `/resume`, `/about`, and `/contact`.

- [ ] **Step 3: Verify history tests pass**

Run: `pnpm test:unit -- src/desktop/desktopRoute.test.ts`

Expected: PASS; no function calls `pushState`, `replaceState`, or `history.back()` because DOM effects belong to `DesktopShell`.

- [ ] **Step 4: Commit route contracts**

```powershell
git add src/desktop/desktopRoute.ts src/desktop/desktopRoute.test.ts
git commit -m "feat: define desktop route history contract"
```

## Task 5: Build the Accessible Identity-First Desktop

**Files:**
- Create: `src/desktop/DesktopShell.tsx`
- Create: `src/desktop/Window.tsx`
- Create: `src/desktop/DesktopIcons.tsx`
- Create: `src/desktop/Taskbar.tsx`
- Create: `src/desktop/StartMenu.tsx`
- Create: `src/desktop/apps/IdentityApp.tsx`
- Create: `src/desktop/apps/WorkApp.tsx`
- Create: `src/desktop/apps/ProjectApp.tsx`
- Modify: `src/pages/index.astro`

**Interfaces:**
- `DesktopShellProps` is `{ identity: typeof identity; records: readonly WorkRecord[]; projects: readonly ProjectCase[] }`.
- `Window` receives state plus callbacks for focus, close, minimize, maximize, and move.
- `WorkApp` calls `onOpenProject(slug)` only for records with reviewed project cases.
- Resume, About, and Contact launchers remain semantic links to Astro documents in this slice; WindowManager does not register those apps yet.

- [ ] **Step 1: Add a failing desktop Playwright flow**

```ts
// tests/e2e/desktop.spec.ts
import { expect, test } from '@playwright/test';

test('identity-first desktop opens Work and Sendo without duplicates', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Work' }).click();
  await page.getByRole('button', { name: 'Open Sendo project' }).click();
  await expect(page).toHaveURL(/\/work\/sendo$/);
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Open Sendo project' }).click();
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(1);
});
```

- [ ] **Step 2: Run the test and verify the UI failure**

Run: `pnpm test:e2e -- tests/e2e/desktop.spec.ts`

Expected: FAIL because the desktop controls do not exist.

- [ ] **Step 3: Implement semantic window and launcher components**

Render every window as `<section role="region" aria-labelledby={titleId}>`. Use real `<button>` elements with labels `Minimize {title}`, `Maximize {title}`, and `Close {title}`. Routable desktop icons and Start menu actions are `<a href>` elements whose eligible same-origin clicks are intercepted by the desktop; desktop-only utilities are `<button>`. Taskbar buttons expose `aria-pressed` for the active window. Closing returns focus to the stored opener; minimizing focuses the matching taskbar button.

- [ ] **Step 4: Implement `DesktopShell` effects at the boundary**

Use `useReducer(windowReducer, initialDesktopState)`. On mount at `/`, call `history.replaceState` with owned depth `0`. User app opens dispatch first, then push only a changed routable path. The `popstate` listener must ignore foreign state and dispatch open/focus for owned state without writing history. Closing the current owned route calls `history.back()` when `depth > 0`, otherwise replaces `/`. Pointer movement computes viewport/taskbar constraints before dispatching `move`.

- [ ] **Step 5: Mount the SSR-capable island**

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import DesktopShell from '../desktop/DesktopShell';
import { identity, projectCases, selectedWork } from '../data/portfolio';
---
<BaseLayout title="Piero Postigo Rocchetti | Software Engineer" description="Backend and product software engineering portfolio.">
  <DesktopShell client:load identity={identity} records={selectedWork} projects={projectCases} />
</BaseLayout>
```

- [ ] **Step 6: Verify desktop flow and static checks**

Run: `pnpm check && pnpm test:unit && pnpm test:e2e -- tests/e2e/desktop.spec.ts`

Expected: all pass; the browser contains one Preact island and one Sendo window after repeated opens.

- [ ] **Step 7: Commit the interactive desktop**

```powershell
git add src/desktop src/pages/index.astro tests/e2e/desktop.spec.ts
git commit -m "feat: add identity-first desktop interaction"
```

## Task 6: Apply the Canonical Stitch Skin and Responsive App Mode

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Create: `src/styles/desktop.css`
- Modify: desktop TSX files to use class names only where styling hooks are missing
- Create: `tests/e2e/mobile.spec.ts`

**Interfaces:**
- CSS consumes `data-active`, `data-minimized`, and `data-maximized` attributes from `Window`.
- Mobile breakpoint is `max-width: 768px`; window movement is disabled there.

- [ ] **Step 1: Add the failing mobile behavior test**

```ts
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
test('mobile uses direct app views with persistent navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Work' }).click();
  await expect(page.getByRole('region', { name: 'Work' })).toHaveCSS('position', 'fixed');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('button', { name: /drag/i })).toHaveCount(0);
});
```

- [ ] **Step 2: Implement canonical tokens**

```css
/* src/styles/tokens.css */
:root {
  --surface: #fbf9f4; --surface-dim: #dcdad5; --surface-container: #f0eee9;
  --on-surface: #1b1c19; --on-surface-variant: #454558;
  --primary: #0001bb; --primary-container: #0000ff; --secondary: #bc0100;
  --tertiary: #063f00; --tertiary-container: #0b5900; --acid: #79ff5b;
  --legacy-gray: #c0c0c0; --outline: #757589; --outline-variant: #c5c4db;
  --font-display: Epilogue, sans-serif; --font-body: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace; --unit: 4px;
}
```

- [ ] **Step 3: Implement the desktop and mobile skin**

Use sharp `0` radius, white top/left and dark bottom/right bevels, blue only for the active titlebar, small CSS halftone patterns, visible `:focus-visible`, and no soft shadows. At `max-width: 768px`, active windows use `position: fixed; inset: 0 0 var(--mobile-nav-height)`, titlebars remain visible, inactive windows are hidden, and pointer-drag handlers are not attached. Respect `prefers-reduced-motion: reduce` by disabling transitions.

- [ ] **Step 4: Verify responsive behavior and contrast manually**

Run: `pnpm test:e2e -- tests/e2e/mobile.spec.ts`

Expected: PASS at `390x844`. Inspect Identity, Work, and Sendo at `1440x900` and `390x844`; record WCAG AA contrast results for body text, blue titlebar text, buttons, and focus indicators in the task notes.

- [ ] **Step 5: Commit the visual system**

```powershell
git add src/styles src/desktop tests/e2e/mobile.spec.ts
git commit -m "feat: apply Stitch desktop visual system"
```

## Task 7: Harden Navigation, Accessibility, Failure Modes, and Release Checks

**Files:**
- Extend: `tests/e2e/desktop.spec.ts`
- Create: `tests/e2e/routes.spec.ts`
- Modify: `src/desktop/DesktopShell.tsx` only for failures exposed by tests
- Modify: `src/desktop/Window.tsx` only for accessibility failures exposed by tests

**Interfaces:**
- No new production abstraction is introduced unless a failing acceptance test requires it.

- [ ] **Step 1: Add acceptance tests for history and keyboard behavior**

Add tests that assert: Work → Sendo adds exactly two owned entries; Back focuses Work without a new entry; Forward restores/focuses Sendo; Close Sendo returns to Work; minimize focuses the Sendo taskbar entry; all launcher/taskbar/window controls activate with keyboard. Reset remains covered only by the reducer unit test and is not surfaced in the UI.

- [ ] **Step 2: Add direct-route and no-JavaScript tests**

```ts
// tests/e2e/routes.spec.ts
import { expect, test } from '@playwright/test';

test('direct Sendo route is a standalone Astro document', async ({ page }) => {
  await page.goto('/work/sendo');
  await expect(page.getByRole('heading', { name: 'Sendo' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Work' })).toHaveCount(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('identity and route navigation remain usable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Piero Postigo Rocchetti')).toBeVisible();
    await page.getByRole('link', { name: 'Work' }).click();
    await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();
  });
});
```

- [ ] **Step 3: Add image failure and reduced-motion assertions**

Abort image requests in Playwright and assert project title, summary, and repository link remain visible. Emulate `reducedMotion: 'reduce'` and assert window transition duration is `0s`.

- [ ] **Step 4: Run the complete release gate sequentially**

Start the built output, then run the final browser suite against it:

```powershell
pnpm check
pnpm test:unit
pnpm build
pnpm preview --host 127.0.0.1 --port 4322
# In a second process with PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4322:
pnpm test:e2e
```

Expected: every command exits `0`; the build contains all six core route documents plus 404; desktop, mobile, history, keyboard, no-JS, reduced-motion, and failure tests pass.

- [ ] **Step 5: Inspect the production output boundary**

Run: `Get-ChildItem -Recurse dist | Select-Object FullName,Length`

Expected: no iframe/media bundles, no files copied from `references/`, and client JavaScript limited to the Preact desktop island and its imports.

- [ ] **Step 6: Commit the verified vertical slice**

```powershell
git add src tests package.json pnpm-lock.yaml playwright.config.ts vitest.config.ts
git commit -m "test: verify portfolio vertical slice"
```

## Final Review Gate

- [ ] Confirm every public sentence maps to the v2 career model and retains ownership/status caveats.
- [ ] Confirm Stitch governs production visuals and no Win98 palette/font/theme code was copied.
- [ ] Confirm `/`, `/work`, `/work/sendo`, `/resume`, `/about`, `/contact`, and `/404` work as independent documents.
- [ ] Confirm the desktop is progressive enhancement and no desktop state is persisted.
- [ ] Confirm Work remains behind a desktop-opened Sendo window and direct `/work/sendo` does not synthesize Work.
- [ ] Confirm Back/Forward never recursively writes history.
- [ ] Confirm mobile needs neither drag nor double-click.
- [ ] Confirm `git status --short` contains no generated build/test artifacts intended for commit.
