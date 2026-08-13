# Stitch Home Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current freeform first-load desktop with the approved Stitch-literal identity shell, three evidence-backed project previews, and responsive right-rail widget surfaces.

**Architecture:** Astro remains the document and routing owner while the existing Preact island renders an authored CSS-grid shell. Initial Identity, Now Playing, and Notes windows are docked into named layout slots; the WindowManager changes a docked window to a fixed floating window on its first drag and retains all existing focus/minimize/maximize/history behavior. Live services are represented by typed unavailable/snapshot view models in this plan and connected in the separate live-presence plan.

**Tech Stack:** Astro 7.2.1, Preact 10.29.8, TypeScript 6.0.3 strict, plain CSS, Vitest 4.1.10, Playwright 1.62.1, pnpm 10.26.2.

## Global Constraints

- Career copy comes from `docs/career/career_evidence.yaml`, then `career_positioning.yaml`, then `career_editorial_policy.yaml`; never invent facts.
- `references/stitch/code.html` is the visual/compositional authority for this home-shell slice; reference files remain read-only and production has no Tailwind CDN, Material Symbols, or remote placeholder assets.
- Selected Work order remains Preppie, Cimax Modernization, Koba, DM2Text, Sendo; the home shows the first three.
- Astro owns stable routes and no-JavaScript documents; Preact progressively enhances same-origin semantic links.
- Only registered interactive windows display minimize, maximize, and close controls.
- Do not add Tailwind, a component library, animation framework, global state library, or runtime image-processing dependency.
- Mobile and touch layouts do not use freeform dragging; all three right-rail widgets reflow instead of disappearing.
- Do not persist desktop state or surface Reset Desktop.
- Use branches prefixed `piero/` for any future branch created in this repository.

## File map

- `src/data/portfolio.ts`: canonical public projection for identity, project cases, previews, and static notes.
- `src/data/presence.ts`: shared view-model types plus deterministic unavailable/static values for the widgets.
- `src/desktop/HomeShell.tsx`: structural top bar, left rail, named slots, project preview region, network panel, and system footer.
- `src/desktop/WindowSlot.tsx`: mounts a registered window into a CSS-grid slot while authored, without duplicating window mechanics.
- `src/desktop/ProjectPreviewGrid.tsx`: semantic first-three project links backed by typed case data.
- `src/desktop/apps/NowPlayingApp.tsx`: display-only Spotify-shaped widget using a passed view model.
- `src/desktop/apps/NotesApp.tsx`: authored static notes window.
- `src/desktop/apps/IdentityApp.tsx`: identity copy plus resilient public GitHub portrait.
- `src/desktop/GitHubSnapshotPanel.tsx`: persistent public-profile fallback panel without fake controls.
- `src/desktop/DesktopShell.tsx`: orchestration, routing, registered-window rendering, and slot/floating selection.
- `src/desktop/types.ts`, `src/desktop/windowReducer.ts`: authored-placement state and utility-window actions.
- `src/styles/tokens.css`, `src/styles/desktop.css`: black Stitch shell, sharp chrome, grid slots, and responsive reflow.
- `src/pages/work/[slug].astro`, `src/pages/work/index.astro`: automatically expose the added verified cases through existing shared data.
- `tests/e2e/home-shell.spec.ts`: canonical layout, semantics, controls, responsive reflow, and no-JS traversal.

---

### Task 1: Publish evidence-backed Cimax and Koba cases

**Files:**
- Modify: `src/data/portfolio.ts`
- Modify: `src/data/portfolio.test.ts`
- Create: `public/images/projects/preppie-preview.svg`
- Create: `public/images/projects/cimax-preview.svg`
- Create: `public/images/projects/koba-preview.svg`
- Test: `src/data/portfolio.test.ts`

**Interfaces:**
- Produces: `projectCases` entries with slugs `cimax-modernization` and `koba`.
- Produces: `HomeProjectPreview { slug; sequence; name; signal; status; visualLabel; imageSrc; imageAlt; evidenceRef }` and `homeProjectPreviews` containing exactly the first three approved projects.
- Consumes: existing `ProjectCase`, `PublicArtifact`, `selectedWork`, and the canonical career model.

- [ ] **Step 1: Write the failing projection tests**

Add assertions that both selected records are routable, cases preserve their evidence boundary, and home previews use the approved order:

```ts
it('makes the three home previews routable evidence-backed cases', () => {
  expect(homeProjectPreviews.map((preview) => preview.slug)).toEqual([
    'preppie', 'cimax-modernization', 'koba',
  ]);
  expect(selectedWork.slice(0, 3).every((record) => record.slug)).toBe(true);
  expect(projectCases.find((project) => project.slug === 'cimax-modernization')).toMatchObject({
    contextLabel: 'Sanitized modernization',
    ownership: expect.stringMatching(/separate from the 2023 contract/i),
  });
  expect(projectCases.find((project) => project.slug === 'koba')).toMatchObject({
    contextLabel: 'Shipped developer tool',
    ownership: 'Solo project',
  });
});

it('keeps blocked Cimax and Koba claims out of public data', () => {
  const serialized = JSON.stringify(projectCases.filter(({ slug }) =>
    ['cimax-modernization', 'koba'].includes(slug),
  ));
  expect(serialized).not.toMatch(/exactly-once|latency improvement|rollback|JWT|autonomous Git|commits for users/i);
});

it('pins identity media to Piero public GitHub profile', () => {
  expect(identity.avatarUrl).toMatch(/^https:\/\/avatars\.githubusercontent\.com\//);
  expect(identity.links.github).toBe('https://github.com/postigodev');
});
```

- [ ] **Step 2: Run the focused unit test and confirm failure**

Run: `pnpm vitest run src/data/portfolio.test.ts`

Expected: FAIL because `homeProjectPreviews` is not exported and the two records do not yet have complete cases.

- [ ] **Step 3: Add the public projection and real artifacts**

Extend `ArtifactKind` with `source` and add these evidence-shaped records:

```ts
export interface HomeProjectPreview {
  slug: string;
  sequence: `0${1 | 2 | 3}`;
  name: string;
  signal: string;
  status: string;
  visualLabel: string;
  imageSrc: string;
  imageAlt: string;
  evidenceRef: string;
}

export const homeProjectPreviews = [
  { slug: 'preppie', sequence: '01', name: 'Preppie', signal: 'Product + reliability', status: 'Completed', visualLabel: 'RELEASE / RECOVERY TRAIL', imageSrc: '/images/projects/preppie-preview.svg', imageAlt: 'Release verification and recovery trail', evidenceRef: 'EV_PREPPIE_PR_131_DB_RECOVERY' },
  { slug: 'cimax-modernization', sequence: '02', name: 'Cimax Modernization', signal: 'Backend modernization', status: 'Shipped public repository', visualLabel: 'MONGO / CACHE / JOBS', imageSrc: '/images/projects/cimax-preview.svg', imageAlt: 'MongoDB, Redis cache, and background job boundaries', evidenceRef: 'EV_CIMAX_2026_MONGO_IDEMPOTENCY' },
  { slug: 'koba', sequence: '03', name: 'Koba', signal: 'Developer tooling', status: 'Shipped', visualLabel: 'READ / PREVIEW / APPLY', imageSrc: '/images/projects/koba-preview.svg', imageAlt: 'Read, preview, and explicit apply boundaries', evidenceRef: 'EV_KOBA_SAFETY_MODEL_SOURCE' },
] as const satisfies readonly HomeProjectPreview[];
```

Add `avatarUrl` to `PublicIdentity` and set it to the current public avatar URL
for `postigodev`; do not use a Stitch placeholder portrait.

The Cimax case must say it is a solo audited public modernization, explicitly separate it from the 2023 contract, and shape chapters around query/cache behavior and request/job boundaries. Link public source evidence to `https://github.com/postigodev/cimax-platform` and retain the six `EV_CIMAX_2026_*` source references internally. The Koba case must shape chapters around explicit mutation boundaries, porcelain-v1 working-tree analysis, and release distribution; link its architecture, parser source, and v0.1.7 release:

```ts
[
  'https://github.com/postigodev/koba/blob/main/docs/architecture.md',
  'https://github.com/postigodev/koba/blob/main/crates/koba/src/git_status.rs',
  'https://github.com/postigodev/koba/releases/tag/v0.1.7',
]
```

Do not publish the mutable Cimax test count or Koba release-series count in this slice.

Create three local, monochrome SVG evidence plates under 20 KiB each. Use only
the labels `VERIFY → RELEASE → RESTORE`, `MONGO → CACHE → JOB`, and
`READ → PREVIEW → APPLY`, respectively; sharp rectangles/arrows and halftone
patterns are permitted, while metrics, logos, UI screenshots, and unstated
architecture are not.

Use these complete plate bodies:

```svg
<!-- preppie-preview.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 112" role="img" aria-labelledby="title"><title id="title">Verify, release, restore</title><rect width="320" height="112" fill="#d9d9d9"/><g fill="#000" font-family="monospace" font-size="13" font-weight="700"><rect x="10" y="32" width="82" height="48" fill="#fff" stroke="#000" stroke-width="2"/><text x="21" y="61">VERIFY</text><path d="M96 56h18m-7-7 7 7-7 7" stroke="#000" stroke-width="3" fill="none"/><rect x="119" y="32" width="82" height="48" fill="#000"/><text x="129" y="61" fill="#fff">RELEASE</text><path d="M205 56h18m-7-7 7 7-7 7" stroke="#000" stroke-width="3" fill="none"/><rect x="228" y="32" width="82" height="48" fill="#fff" stroke="#000" stroke-width="2"/><text x="237" y="61">RESTORE</text></g></svg>
```

```svg
<!-- cimax-preview.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 112" role="img" aria-labelledby="title"><title id="title">Mongo, cache, and job boundaries</title><rect width="320" height="112" fill="#cfcfcf"/><g stroke="#000" stroke-width="2"><circle cx="54" cy="56" r="35" fill="#fff"/><rect x="125" y="21" width="70" height="70" fill="#000"/><circle cx="266" cy="56" r="35" fill="#fff"/><path d="M89 56h36m70 0h36"/></g><g font-family="monospace" font-size="13" font-weight="700" text-anchor="middle"><text x="54" y="61">MONGO</text><text x="160" y="61" fill="#fff">CACHE</text><text x="266" y="61">JOB</text></g></svg>
```

```svg
<!-- koba-preview.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 112" role="img" aria-labelledby="title"><title id="title">Read, preview, and explicit apply boundaries</title><rect width="320" height="112" fill="#e3e3e3"/><g fill="none" stroke="#000" stroke-width="2"><rect x="9" y="18" width="302" height="76"/><path d="M105 18v76m110-76v76"/></g><g font-family="monospace" font-size="13" font-weight="700" text-anchor="middle"><text x="57" y="61">READ</text><text x="160" y="61">PREVIEW</text><rect x="224" y="36" width="78" height="40" fill="#000"/><text x="263" y="61" fill="#fff">APPLY</text></g></svg>
```

- [ ] **Step 4: Run data and route generation tests**

Run: `pnpm vitest run src/data/portfolio.test.ts && pnpm build`

Expected: PASS; Astro reports generated pages for `/work/cimax-modernization/` and `/work/koba/`.

- [ ] **Step 5: Commit the cases**

```powershell
git add src/data/portfolio.ts src/data/portfolio.test.ts public/images/projects/preppie-preview.svg public/images/projects/cimax-preview.svg public/images/projects/koba-preview.svg
git commit -m "feat: add Cimax and Koba portfolio cases"
```

---

### Task 2: Add authored-placement window state

**Files:**
- Modify: `src/desktop/types.ts`
- Modify: `src/desktop/windowReducer.ts`
- Modify: `src/desktop/windowReducer.test.ts`
- Modify: `src/desktop/Window.tsx`
- Create: `src/desktop/WindowSlot.tsx`
- Test: `src/desktop/windowReducer.test.ts`

**Interfaces:**
- Produces: `WindowPlacement = 'authored' | 'floating'` on `WindowState`.
- Produces: registered window IDs `identity`, `now-playing`, `notes`, `work`, and dynamic `project:<slug>`.
- Produces: `WindowSlot({ id, children })` as the sole authored-layout mount point.
- Preserves: all existing reducer actions, route history, project singleton behavior, and reducer-level reset.

- [ ] **Step 1: Write failing reducer tests for authored utilities and first drag**

```ts
it('boots the authored Identity, Now Playing, and Notes windows', () => {
  expect(Object.values(initialDesktopState.windows)
    .filter((win) => win.isOpen)
    .map((win) => [win.id, win.placement]))
    .toEqual([
      ['identity', 'authored'],
      ['now-playing', 'authored'],
      ['notes', 'authored'],
    ]);
});

it('moves an authored window into floating placement without changing routes', () => {
  const moved = windowReducer(initialDesktopState, { type: 'move', id: 'notes', x: 900, y: 220 });
  expect(moved.windows.notes).toMatchObject({ placement: 'floating', bounds: { x: 900, y: 220 } });
});

it('reset restores utility windows to authored placement', () => {
  const changed = windowReducer(initialDesktopState, { type: 'close', id: 'notes' });
  expect(windowReducer(changed, { type: 'reset' })).toEqual(initialDesktopState);
});
```

- [ ] **Step 2: Confirm the reducer test fails**

Run: `pnpm vitest run src/desktop/windowReducer.test.ts`

Expected: FAIL because `placement`, `now-playing`, and `notes` are not registered.

- [ ] **Step 3: Implement authored placement and truthful drag geometry**

Add the exact union and widen the open action:

```ts
export type WindowPlacement = 'authored' | 'floating';

export interface WindowState {
  id: string;
  title: string;
  placement: WindowPlacement;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  bounds: Bounds;
  restoreBounds?: Bounds;
  projectSlug?: string;
}
```

Seed the three authored windows; keep Work closed and floating. In the reducer,
`move` must set `placement: 'floating'`. In `Window.tsx`, use
`event.currentTarget.closest('.os-window')!.getBoundingClientRect()` for the
initial pointer offset instead of assuming stored authored bounds. Apply inline
coordinates only to floating windows. `WindowSlot` renders its child only when
the matching window remains authored; floating windows are rendered once by
the overlay layer in `DesktopShell`.

- [ ] **Step 4: Run reducer and existing desktop tests**

Run: `pnpm vitest run src/desktop/windowReducer.test.ts src/desktop/desktopRoute.test.ts`

Expected: PASS with project singleton and history helper tests unchanged.

- [ ] **Step 5: Commit the placement model**

```powershell
git add src/desktop/types.ts src/desktop/windowReducer.ts src/desktop/windowReducer.test.ts src/desktop/Window.tsx src/desktop/WindowSlot.tsx
git commit -m "feat: support authored desktop window slots"
```

---

### Task 3: Build the semantic Stitch home structure

**Files:**
- Create: `src/data/presence.ts`
- Create: `src/desktop/HomeShell.tsx`
- Create: `src/desktop/ProjectPreviewGrid.tsx`
- Create: `src/desktop/GitHubSnapshotPanel.tsx`
- Create: `src/desktop/apps/NowPlayingApp.tsx`
- Create: `src/desktop/apps/NotesApp.tsx`
- Modify: `src/desktop/apps/IdentityApp.tsx`
- Modify: `src/desktop/DesktopShell.tsx`
- Modify: `src/desktop/DesktopIcons.tsx`
- Modify: `src/desktop/StartMenu.tsx`
- Modify: `src/desktop/Taskbar.tsx`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/home-shell.spec.ts`

**Interfaces:**
- Produces: `NowPlayingView`, `GitHubSnapshotView`, `unavailableNowPlaying`, and `staticGitHubFallback` from `src/data/presence.ts`.
- Produces: `HomeShell` slots named `identity`, `now-playing`, and `notes` plus a persistent `network.online` panel.
- Consumes: `identity`, `homeProjectPreviews`, `projectCases`, and the existing `onNavigate(event, route)` interception contract.

- [ ] **Step 1: Write failing semantic home-shell tests**

Create `tests/e2e/home-shell.spec.ts` with assertions that do not depend on screenshots:

```ts
test('boots the Stitch identity shell with three project links and three widgets', async ({ page }) => {
  await page.goto('/');
  const headings = page.locator('main h1');
  await expect(headings.first()).toHaveText('Software Engineer');
  await expect(page.getByRole('link', { name: /Open Preppie/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open Cimax Modernization/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open Koba/i })).toBeVisible();
  await expect(page.getByText('now.playing', { exact: true })).toBeVisible();
  await expect(page.getByText('notes.txt', { exact: true })).toBeVisible();
  await expect(page.getByText('network.online', { exact: true })).toBeVisible();
});

test('status panels never expose fake window controls', async ({ page }) => {
  await page.goto('/');
  const network = page.locator('[data-network-panel]');
  await expect(network.getByRole('button')).toHaveCount(0);
  await expect(page.locator('.window-controls')).toHaveCount(3);
});
```

- [ ] **Step 2: Confirm the new E2E test fails**

Run: `pnpm playwright test tests/e2e/home-shell.spec.ts`

Expected: FAIL because the shell, previews, and widgets do not exist.

- [ ] **Step 3: Define deterministic presence view models**

Use discriminated unions so static fallback states cannot accidentally claim live data:

```ts
export type NowPlayingView =
  | { state: 'unavailable'; observedAt: string }
  | { state: 'playing' | 'recent'; track: string; artist: string; album: string; artworkUrl: string; spotifyUrl: string; durationMs: number; progressMs?: number; observedAt: string };

export type GitHubSnapshotView =
  | { state: 'unavailable'; profileUrl: string; login: 'postigodev'; avatarUrl: string }
  | { state: 'ready'; profileUrl: string; login: 'postigodev'; avatarUrl: string; publicRepos: number; followers: number; stars: number; languages: readonly string[]; observedAt: string };

export const unavailableNowPlaying: NowPlayingView = {
  state: 'unavailable', observedAt: 'static-fallback',
};

export const staticGitHubFallback: GitHubSnapshotView = {
  state: 'unavailable',
  profileUrl: 'https://github.com/postigodev',
  login: 'postigodev',
  avatarUrl: 'https://avatars.githubusercontent.com/u/247466788?v=4',
};
```

The GitHub fallback contains the stable profile URL and avatar URL only; it
must not hard-code counts.

- [ ] **Step 4: Implement the shell and connect registered windows**

`HomeShell` must render, in semantic order: top navigation, left navigation
rail, Identity slot, Selected Work previews, Now Playing slot, Notes slot,
GitHub status panel, and bottom taskbar/system strip. Project previews are
anchors:

```tsx
<a
  href={`/work/${preview.slug}`}
  aria-label={`Open ${preview.name} project`}
  onClick={(event) => onNavigate(event, `/work/${preview.slug}`)}
>
  <span>{preview.sequence} {preview.name}</span>
  <img src={preview.imageSrc} alt={preview.imageAlt} width="320" height="112" />
  <strong>{preview.visualLabel}</strong>
  <span>{preview.signal}</span>
</a>
```

`NowPlayingApp` renders `PLAYBACK_UNAVAILABLE` for the fallback and never
renders playback controls. `NotesApp` uses local typed notes. The GitHub panel
links to `https://github.com/postigodev`, uses the public avatar with explicit
width/height, and shows no counts in unavailable state. Replace emoji shortcut
icons with local text/inline SVG marks; do not introduce an icon font.

`IdentityApp` uses the same public avatar URL at explicit dimensions. It places
the text fallback `PP` behind the image and hides only the failed `<img>` from
its `onError` handler, preserving portrait geometry and accessible identity
copy.

Render authored windows inside their slots and floating/project windows once
in an overlay container. Preserve `navigate`, `popstate`, focus restoration,
and singleton logic from `DesktopShell.tsx`.

- [ ] **Step 5: Run the semantic shell and existing behavior suites**

Run: `pnpm playwright test tests/e2e/home-shell.spec.ts tests/e2e/desktop.spec.ts tests/e2e/routes.spec.ts`

Expected: PASS; legacy tests may be updated only where accessible labels or the
authored initial count intentionally changed, never by removing behavioral
coverage.

Add an image-failure case that aborts the GitHub avatar request and asserts the
Identity heading, `PP` fallback, primary Work link, and network profile link
remain visible.

- [ ] **Step 6: Commit the structural shell**

```powershell
git add src/data/presence.ts src/desktop/HomeShell.tsx src/desktop/ProjectPreviewGrid.tsx src/desktop/GitHubSnapshotPanel.tsx src/desktop/DesktopShell.tsx src/desktop/DesktopIcons.tsx src/desktop/StartMenu.tsx src/desktop/Taskbar.tsx src/desktop/apps/IdentityApp.tsx src/desktop/apps/NowPlayingApp.tsx src/desktop/apps/NotesApp.tsx src/pages/index.astro tests/e2e/home-shell.spec.ts tests/e2e/desktop.spec.ts tests/e2e/routes.spec.ts
git commit -m "feat: build the Stitch identity home shell"
```

---

### Task 4: Apply the literal Stitch skin and responsive reflow

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/desktop.css`
- Modify: `tests/e2e/home-shell.spec.ts`
- Modify: `tests/e2e/mobile.spec.ts`

**Interfaces:**
- Consumes: named shell regions and `data-*` hooks created in Task 3.
- Produces: three-column layouts at 1440×900 and 1024×768; stacked widget layouts at 768×1024 and 390×844.
- Styles: the local artifact-derived monochrome SVG preview plates created in Task 1 without runtime processing.

- [ ] **Step 1: Add failing viewport and overflow assertions**

Parameterize the canonical viewports:

```ts
for (const viewport of [
  { width: 1440, height: 900, mode: 'columns' },
  { width: 1024, height: 768, mode: 'columns' },
  { width: 768, height: 1024, mode: 'stacked' },
  { width: 390, height: 844, mode: 'stacked' },
] as const) {
  test(`preserves widgets without horizontal overflow at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('[data-now-playing]')).toBeVisible();
    await expect(page.locator('[data-notes]')).toBeVisible();
    await expect(page.locator('[data-network-panel]')).toBeVisible();
    await expect(page.locator('[data-home-shell]')).toHaveAttribute('data-layout', viewport.mode);
  });
}
```

- [ ] **Step 2: Confirm responsive tests fail**

Run: `pnpm playwright test tests/e2e/home-shell.spec.ts tests/e2e/mobile.spec.ts`

Expected: FAIL on layout attributes and/or overflow before the new CSS lands.

- [ ] **Step 3: Implement Stitch tokens, texture, proportions, and local plates**

Keep document-route bone tokens intact and scope the approved black skin under
`.desktop-shell`. Add shell variables such as:

```css
.desktop-shell {
  --shell-bg: #000;
  --shell-fg: #fff;
  --shell-muted: #b8b8b8;
  --shell-active: #0001bb;
  --shell-border: 2px;
  background-color: var(--shell-bg);
  color: var(--shell-fg);
}

.home-grid {
  display: grid;
  grid-template-columns: clamp(188px, 17vw, 252px) minmax(0, 1fr) clamp(200px, 20vw, 292px);
  grid-template-areas:
    'rail identity player'
    'rail projects notes'
    'rail projects network';
}
```

Use Epilogue for the hero, Space Grotesk for readable copy, JetBrains Mono for
chrome/metadata, white two-pixel borders, zero-radius corners, sharp shadow
offsets, grayscale artifact plates, and restrained blue only for active state.
The three local SVG plates retain their intrinsic art without runtime filters
that harm legibility.

At `max-width: 900px`, reflow to one content column in semantic order and set
`data-layout="stacked"` from a `matchMedia`-backed Preact value. Do not hide the
widgets. On touch/narrow layouts, authored windows remain in flow; only an
opened Work/project overlay becomes fullscreen.

- [ ] **Step 4: Verify all canonical viewports and window behavior**

Run: `pnpm playwright test tests/e2e/home-shell.spec.ts tests/e2e/mobile.spec.ts tests/e2e/desktop.spec.ts`

Expected: PASS at all four viewports, with no page-level horizontal overflow.

- [ ] **Step 5: Commit the visual system**

```powershell
git add src/styles/tokens.css src/styles/desktop.css tests/e2e/home-shell.spec.ts tests/e2e/mobile.spec.ts
git commit -m "style: apply the literal Stitch home composition"
```

---

### Task 5: Close behavior, documentation, and production release gate

**Files:**
- Modify: `tests/e2e/home-shell.spec.ts`
- Modify: `tests/e2e/routes.spec.ts`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/stitch-design-system.md`
- Modify: `docs/superpowers/specs/2026-08-13-stitch-home-shell-design.md`

**Interfaces:**
- Verifies: utility close/move never writes history; project route/window semantics remain unchanged.
- Documents: the scoped reference-first home-shell exception and authored-to-floating placement model.

- [ ] **Step 1: Add the final history and no-JavaScript assertions**

```ts
test('closing a desktop-only utility leaves URL and history unchanged', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => ({ href: location.href, length: history.length }));
  await page.getByRole('button', { name: 'Close notes.txt' }).click();
  expect(await page.evaluate(() => ({ href: location.href, length: history.length }))).toEqual(before);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('follows the homepage Work link as a real document navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Explore selected work/i }).click();
    await expect(page).toHaveURL(/\/work\/?$/);
    await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the focused release-behavior tests**

Run: `pnpm playwright test tests/e2e/home-shell.spec.ts tests/e2e/routes.spec.ts`

Expected: PASS.

- [ ] **Step 3: Record the approved architecture exception**

Update `docs/ARCHITECTURE.md` and `docs/stitch-design-system.md` to state that
the reference-first, black Stitch composition applies only to the home shell
and its overlay chrome. Document `authored -> floating` as the first-drag state
transition. Mark the implementation boundary complete in the approved spec;
do not change career-source precedence or make the export a runtime dependency.

- [ ] **Step 4: Run the complete production gate sequentially**

Run:

```powershell
pnpm check
pnpm test:unit
pnpm build
pnpm test:e2e
```

Expected: all commands exit 0. Playwright's configured server must execute
`pnpm build` and serve `dist/`; it must not use the Astro development server.

- [ ] **Step 5: Inspect the built client for prohibited dependencies and secrets**

Run:

```powershell
rg -n "cdn\.tailwindcss|material-symbols|SPOTIFY_|GITHUB_TOKEN|aida-public" dist
```

Expected: no matches.

- [ ] **Step 6: Commit the verified shell**

```powershell
git add docs/ARCHITECTURE.md docs/stitch-design-system.md docs/superpowers/specs/2026-08-13-stitch-home-shell-design.md tests/e2e/home-shell.spec.ts tests/e2e/routes.spec.ts
git commit -m "test: verify the Stitch home shell release"
```
