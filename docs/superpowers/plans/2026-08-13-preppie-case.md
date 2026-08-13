# Preppie Portfolio Case Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the evidence-backed Preppie professional-experience case at `/work/preppie` and in a dedicated desktop window, while removing raw evidence IDs from the public Sendo UI.

**Architecture:** Extend the shared typed portfolio projection with flexible case sections and artifact references. Astro keeps static routing and document rendering; the existing Preact desktop consumes the same data, opens singleton project windows, and owns only the history entries it creates. Preppie uses a four-chapter evidence trail; Sendo keeps its artifact-led presentation.

**Tech Stack:** Astro 7.2.1, Preact 10.29.8, TypeScript 6.0.3 strict, plain CSS, Vitest 4.1.10, Playwright 1.62.1, pnpm 10.26.2.

## Global Constraints

- Canonical facts come from `docs/career/career_evidence.yaml`; derived framing comes from `career_positioning.yaml`; public copy follows `career_editorial_policy.yaml`.
- Selected Work order remains Preppie → Cimax Modernization → Koba → DM2Text → Sendo.
- Preppie is collaborative professional experience, never a sole-owned project, SRE role, platform-engineering claim, or campus-first product.
- Raw `EV_*` identifiers remain typed provenance only and never render in normal public HTML.
- Preppie's seven PRs render as compact rows grouped under four chapters, not seven large artifact cards.
- Astro routes remain complete without JavaScript; the Preact desktop is progressive enhancement.
- Direct/refreshed deep routes remain standalone Astro documents; only owned same-document history entries restore desktop windows.
- No new runtime dependency, persistence, Reset Desktop control, or optional desktop experiment.
- Final browser tests run against built `dist/`, not the Astro development server.

---

## File Structure

- Modify `src/data/portfolio.ts` — define the flexible typed case model and add canonical Preppie content/artifacts.
- Modify `src/data/portfolio.test.ts` — enforce ordering, attribution, artifact resolution, visual limits, and provenance separation.
- Create `src/components/ProjectCaseDocument.astro` — render static cases from shared content without case-specific facts.
- Modify `src/pages/work/[slug].astro` — delegate each generated route to the shared Astro case renderer.
- Modify `src/styles/global.css` — style static case headers, chapter trail, compact evidence rows, and archive actions.
- Modify `src/desktop/apps/ProjectApp.tsx` — render the same flexible model inside windows without exposing evidence IDs.
- Modify `src/styles/desktop.css` — apply the Stitch-led chapter trail and clean Sendo actions inside windows.
- Modify `src/desktop/desktopRoute.ts` and `desktopRoute.test.ts` — recognize any known project slug.
- Modify `src/desktop/types.ts`, `windowReducer.ts`, and `windowReducer.test.ts` — seed project windows with shared titles rather than slug conditionals.
- Modify `src/desktop/DesktopShell.tsx` — pass known slugs/titles through routing and transfer focus after navigation.
- Modify `tests/e2e/routes.spec.ts` — verify static/no-JS content, hierarchy, artifact grouping, and provenance hiding.
- Modify `tests/e2e/desktop.spec.ts` — verify singleton windows, keyboard focus, owned history, and enhanced rendering.
- Modify `tests/e2e/mobile.spec.ts` — verify the Preppie case remains directly usable on mobile.

---

### Task 1: Flexible case model and canonical Preppie projection

**Files:**
- Modify: `src/data/portfolio.ts`
- Modify: `src/data/portfolio.test.ts`

**Interfaces:**
- Produces: `ArtifactKind`, `PublicArtifact`, `CaseSection`, `LeadMedia`, `ProjectCase`, `projectCases`, `getProjectCase`.
- Consumers: Astro case renderer, Preact `ProjectApp`, route/window mapping tests.

- [ ] **Step 1: Write failing content-model tests**

Replace `src/data/portfolio.test.ts` with tests that retain the identity/Sendo checks and add:

```ts
import { describe, expect, it } from 'vitest';
import { identity, projectCases, selectedWork } from './portfolio';

describe('public portfolio projection', () => {
  it('keeps the approved identity and flagship order', () => {
    expect(identity.primaryIdentity).toBe('Software Engineer');
    expect(selectedWork.map((record) => record.id)).toEqual([
      'preppie', 'cimax-modernization', 'koba', 'dm2text', 'sendo',
    ]);
    expect(selectedWork.find((record) => record.id === 'preppie')?.slug).toBe('preppie');
  });

  it('publishes the four-chapter Preppie evidence trail', () => {
    const preppie = projectCases.find((project) => project.slug === 'preppie');
    expect(preppie).toMatchObject({
      kind: 'professional-experience',
      contextLabel: 'Professional Experience',
      dateLabel: '2026',
      roleLabel: 'Startup Software Engineer — Backend & Integration',
      layout: 'evidence-trail',
    });
    expect(preppie?.sections.map((section) => section.id)).toEqual([
      'product-flows', 'database-contracts', 'safe-promotion', 'recovery-as-product-work',
    ]);
    expect(preppie?.artifacts.filter((artifact) => artifact.kind === 'pull-request')).toHaveLength(7);
    expect(preppie?.artifacts.filter((artifact) => artifact.kind !== 'pull-request')).toHaveLength(0);
  });

  it('resolves every chapter artifact and preserves provenance internally', () => {
    const preppie = projectCases.find((project) => project.slug === 'preppie')!;
    const artifactIds = new Set(preppie.artifacts.map((artifact) => artifact.id));
    expect(preppie.sections.flatMap((section) => section.artifactIds).every((id) => artifactIds.has(id))).toBe(true);
    expect(preppie.artifacts.every((artifact) => artifact.evidenceRef.startsWith('EV_PREPPIE_'))).toBe(true);
    expect(preppie.ownership).toContain('Product ownership was shared');
    expect(JSON.stringify(preppie)).not.toMatch(/I built Preppie|69 features shipped|platform engineer|SRE ownership/i);
  });

  it('retains the evidence-backed Sendo artifact-led case', () => {
    const sendo = projectCases.find((project) => project.slug === 'sendo');
    expect(sendo?.layout).toBe('artifact-led');
    expect(sendo?.evidenceRefs).toContain('EV_SENDO_RELEASE_010');
    expect(sendo?.artifacts.map((artifact) => artifact.kind)).toEqual([
      'release', 'screenshot', 'external-contribution',
    ]);
  });
});
```

- [ ] **Step 2: Run the model test and verify failure**

Run: `pnpm test:unit -- src/data/portfolio.test.ts`

Expected: FAIL because Preppie has no slug/case and `ProjectCase` has no layout, sections, context/date, role, or artifact ids.

- [ ] **Step 3: Implement the flexible typed model**

In `src/data/portfolio.ts`:

```ts
export type ArtifactKind = 'release' | 'screenshot' | 'external-contribution' | 'pull-request';
export type CaseLayout = 'artifact-led' | 'evidence-trail';

export interface PublicArtifact {
  id: string;
  kind: ArtifactKind;
  label: string;
  href: string;
  evidenceRef: string;
  caption: string;
  external?: boolean;
  status?: string;
  category?: string;
}

export interface CaseSection {
  id: string;
  title: string;
  body: readonly string[];
  highlights?: readonly string[];
  artifactIds: readonly string[];
}

export interface LeadMedia {
  artifactId: string;
  alt: string;
}

export interface ProjectCase extends WorkRecord {
  slug: string;
  layout: CaseLayout;
  contextLabel: string;
  dateLabel?: string;
  roleLabel?: string;
  ownership: string;
  summary: string;
  technologies: readonly string[];
  sections: readonly CaseSection[];
  evidenceRefs: readonly string[];
  artifacts: readonly PublicArtifact[];
  leadMedia?: LeadMedia;
  links: { repository: string };
}
```

Give Preppie `slug: 'preppie'` in `selectedWork`. Add Preppie before Sendo in `projectCases` with:

- `kind: 'professional-experience'`, `layout: 'evidence-trail'`;
- `contextLabel: 'Professional Experience'`, `dateLabel: '2026'`;
- `roleLabel: 'Startup Software Engineer — Backend & Integration'`;
- the reviewed summary and ownership statement from the spec;
- four ordered sections with the reviewed short copy;
- PR artifacts `preppie-pr-44`, `preppie-pr-61`, `preppie-pr-125`, `preppie-pr-127`, `preppie-pr-128`, `preppie-pr-129`, and `preppie-pr-131` using the exact public URLs/evidence refs in the spec;
- section artifact ids grouped `1 / 1 / 4 / 1`;
- status `Merged` and categories `Product/backend`, `Database`, `Release safety`, or `Recovery`;
- repository URL `https://github.com/AxiomaSystems/Chef`.

Give Sendo `layout: 'artifact-led'`, `contextLabel: 'Shipped software'`, stable ids for its three existing artifacts, one `selected-contributions` section containing the existing three contribution strings as highlights, and `leadMedia: { artifactId: 'sendo-screenshot', alt: 'Sendo Windows desktop application home screen' }`.

- [ ] **Step 4: Run the model test and verify success**

Run: `pnpm test:unit -- src/data/portfolio.test.ts`

Expected: PASS with four content-model tests.

- [ ] **Step 5: Commit the shared content projection**

```powershell
git add -- src/data/portfolio.ts src/data/portfolio.test.ts
git commit -m "feat: add Preppie evidence trail content"
```

---

### Task 2: Static Astro case renderer and public evidence styling

**Files:**
- Create: `src/components/ProjectCaseDocument.astro`
- Modify: `src/pages/work/[slug].astro`
- Modify: `src/styles/global.css`
- Modify: `tests/e2e/routes.spec.ts`

**Interfaces:**
- Consumes: `ProjectCase`, section `artifactIds`, and `leadMedia.artifactId` from Task 1.
- Produces: static `/work/preppie` and `/work/sendo` HTML with no visible provenance ids.

- [ ] **Step 1: Add failing static-route and no-JS tests**

Add to `tests/e2e/routes.spec.ts`:

```ts
test('direct Preppie route is a professional evidence trail', async ({ page }) => {
  await page.goto('/work/preppie');
  await expect(page.getByText('Professional Experience · 2026')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preppie' })).toBeVisible();
  await expect(page.getByText('Startup Software Engineer — Backend & Integration')).toBeVisible();
  await expect(page.getByText(/Product ownership was shared/)).toBeVisible();
  await expect(page.locator('[data-case-chapter]')).toHaveCount(4);
  await expect(page.locator('[data-evidence-row]')).toHaveCount(7);
  await expect(page.locator('[data-case-visual]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('EV_PREPPIE_');
});

test('Sendo public route hides provenance and uses an archive source action', async ({ page }) => {
  await page.goto('/work/sendo');
  await expect(page.locator('body')).not.toContainText('EV_SENDO_');
  await expect(page.getByRole('link', { name: 'Source repository' })).toHaveClass(/archive-action/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('Work link follows through to the Preppie case', async ({ page }) => {
    await page.goto('/work');
    await page.getByRole('link', { name: 'Open case study' }).first().click();
    await expect(page).toHaveURL(/\/work\/preppie$/);
    await expect(page.getByRole('heading', { name: 'Preppie' })).toBeVisible();
    await expect(page.getByRole('link', { name: /PR #44/ })).toBeVisible();
  });
});
```

Keep the existing identity no-JS test and Sendo screenshot-failure test.

- [ ] **Step 2: Run the relevant E2E file and verify failure**

Run: `pnpm test:e2e -- tests/e2e/routes.spec.ts`

Expected: FAIL because `/work/preppie` does not exist and the current renderer exposes no chapter/row structure or archive-action class.

- [ ] **Step 3: Create the generic Astro renderer**

Create `src/components/ProjectCaseDocument.astro` with a required `project: ProjectCase` prop. Build an artifact map once. Render:

```astro
---
import type { ProjectCase } from '../data/portfolio';
interface Props { project: ProjectCase }
const { project } = Astro.props;
const artifactMap = new Map(project.artifacts.map((artifact) => [artifact.id, artifact]));
const leadArtifact = project.leadMedia ? artifactMap.get(project.leadMedia.artifactId) : undefined;
const sectionArtifactIds = new Set(project.sections.flatMap((section) => section.artifactIds));
const ungroupedArtifacts = project.artifacts.filter((artifact) =>
  artifact.id !== project.leadMedia?.artifactId && !sectionArtifactIds.has(artifact.id),
);
---
<article class:list={['case-document', `case-document--${project.layout}`]}>
  <header class="case-header">
    <p class="case-context">{[project.contextLabel, project.dateLabel].filter(Boolean).join(' · ')}</p>
    <h1>{project.name}</h1>
    {project.roleLabel && <p class="case-role">{project.roleLabel}</p>}
    <p class="case-summary">{project.summary}</p>
    <aside class="ownership-boundary" aria-label="Collaboration boundary">
      <strong>Collaborative product team</strong><span>{project.ownership}</span>
    </aside>
  </header>
  {leadArtifact && project.leadMedia && (
    <figure class="case-visual" data-case-visual>
      <img src={leadArtifact.href} alt={project.leadMedia.alt} />
      <figcaption>{leadArtifact.caption}</figcaption>
    </figure>
  )}
  <div class="case-chapters">
    {project.sections.map((section, index) => (
      <section class="case-chapter" data-case-chapter aria-labelledby={`chapter-${section.id}`}>
        <p class="chapter-number">{String(index + 1).padStart(2, '0')}</p>
        <h2 id={`chapter-${section.id}`}>{section.title}</h2>
        {section.body.map((paragraph) => <p>{paragraph}</p>)}
        {section.highlights && <ul>{section.highlights.map((item) => <li>{item}</li>)}</ul>}
        <div class="evidence-rows">
          {section.artifactIds.map((id) => artifactMap.get(id)).filter(Boolean).map((artifact) => (
            <a class="evidence-row" data-evidence-row href={artifact!.href} target="_blank" rel="noreferrer">
              <span class="evidence-title">{artifact!.label}</span>
              <span class="evidence-meta">{artifact!.status} · {artifact!.category}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>
    ))}
  </div>
  {project.layout === 'artifact-led' && ungroupedArtifacts.length > 0 && (
    <section class="public-artifacts" aria-labelledby="public-artifacts-heading">
      <h2 id="public-artifacts-heading">Public artifacts</h2>
      <div class="artifact-list">
        {ungroupedArtifacts.map((artifact) => (
          <a href={artifact.href} target={artifact.external ? '_blank' : undefined} rel={artifact.external ? 'noreferrer' : undefined}>
            <strong>{artifact.label}</strong><span>{artifact.caption}</span><span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  )}
  <a class="archive-action" href={project.links.repository} target="_blank" rel="noreferrer">
    <span>[ GitHub ]</span> <strong>Source repository</strong><span aria-hidden="true">↗</span>
  </a>
</article>
```

For `leadMedia`, resolve the artifact from `project.leadMedia.artifactId`, render its `href` as the image source and use `project.leadMedia.alt`. For artifact-led cases, render non-lead artifacts as restrained archive rows with title/action link styling only; never render `artifact.evidenceRef`.

- [ ] **Step 4: Delegate the generated route**

In `src/pages/work/[slug].astro`, retain `getStaticPaths`, `BaseLayout`, and `DocumentNav`, import `ProjectCaseDocument`, and replace the inline case HTML with:

```astro
<BaseLayout title={`${project.name} | Piero Postigo Rocchetti`} description={project.summary}>
  <main class="document-shell project-document-shell">
    <DocumentNav />
    <a href="/work">← Work</a>
    <ProjectCaseDocument project={project} />
  </main>
</BaseLayout>
```

- [ ] **Step 5: Add static case styles**

Append focused classes to `src/styles/global.css`: sharp borders, mono context labels, oversized Epilogue title, a bone ownership block, numbered chapter grid, full-width rules, compact three-column evidence rows, and `.archive-action`. Use only existing CSS tokens. Set `.evidence-row, .archive-action { text-decoration: none; }`, underline `.evidence-title` only on hover/focus, and collapse evidence rows to one column below 640px.

- [ ] **Step 6: Run the static E2E tests**

Run: `pnpm test:e2e -- tests/e2e/routes.spec.ts`

Expected: PASS; generated production output contains both routes and no public `EV_*` text.

- [ ] **Step 7: Commit the static case renderer**

```powershell
git add -- src/components/ProjectCaseDocument.astro src/pages/work/[slug].astro src/styles/global.css tests/e2e/routes.spec.ts
git commit -m "feat: render Preppie archival case route"
```

---

### Task 3: Generic project routing, shared titles, and desktop focus

**Files:**
- Modify: `src/desktop/desktopRoute.ts`
- Modify: `src/desktop/desktopRoute.test.ts`
- Modify: `src/desktop/types.ts`
- Modify: `src/desktop/windowReducer.ts`
- Modify: `src/desktop/windowReducer.test.ts`
- Modify: `src/desktop/DesktopShell.tsx`

**Interfaces:**
- Produces: `routeToTarget(pathname, knownProjectSlugs)`, `openProject { slug, title }`.
- Consumes: `projectCases` names/slugs and existing owned-history state.

- [ ] **Step 1: Write failing generic route tests**

Update `desktopRoute.test.ts` so `routeToTarget` receives `['preppie', 'sendo']` and assert both routes map, trailing slashes normalize, and `/work/unknown` remains undefined.

```ts
const slugs = ['preppie', 'sendo'] as const;
expect(routeToTarget('/work/preppie', slugs)).toEqual({
  appId: 'project:preppie', route: '/work/preppie', projectSlug: 'preppie',
});
expect(routeToTarget('/work/sendo/', slugs)?.projectSlug).toBe('sendo');
expect(routeToTarget('/work/unknown', slugs)).toBeUndefined();
```

Update `windowReducer.test.ts` to open `{ type: 'openProject', slug: 'preppie', title: 'Preppie' }` twice and assert one `project:preppie` window titled `Preppie`, while a subsequent Sendo open creates a distinct window.

- [ ] **Step 2: Run route/reducer tests and verify failure**

Run: `pnpm test:unit -- src/desktop/desktopRoute.test.ts src/desktop/windowReducer.test.ts`

Expected: FAIL because route mapping is Sendo-only and `openProject` accepts no title.

- [ ] **Step 3: Generalize route recognition**

Change the signature to:

```ts
export function routeToTarget(pathname: string, knownProjectSlugs: readonly string[] = []): RouteTarget | undefined {
  const clean = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname;
  if (staticRoutes[clean]) return { appId: staticRoutes[clean], route: clean };
  const match = clean.match(/^\/work\/([^/]+)$/);
  const slug = match?.[1];
  if (slug && knownProjectSlugs.includes(slug)) {
    return { appId: `project:${slug}`, route: clean, projectSlug: slug };
  }
  return undefined;
}
```

- [ ] **Step 4: Make project titles data-driven**

Change `DesktopAction` to `{ type: 'openProject'; slug: string; title: string }`. In the reducer seed the project window with `title: action.title`; remove the `slug === 'sendo'` conditional. Preserve the existing singleton/focus/z-index behavior.

- [ ] **Step 5: Pass project data through DesktopShell and focus headings**

Create `projectSlugs` from `projects`, call `routeToTarget(route, projectSlugs)`, resolve the project before dispatching `openProject`, and dispatch its `name` as `title`.

Extract:

```ts
const focusWindowHeading = (appId: string) => {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-window-id="${appId}"] h2`)?.focus();
  });
};
```

Call it after `applyTarget` for intercepted navigation and after applying an owned `popstate`. Keep direct/deep routes native because the desktop shell only hydrates `/`.

- [ ] **Step 6: Run the focused unit tests**

Run: `pnpm test:unit -- src/desktop/desktopRoute.test.ts src/desktop/windowReducer.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit desktop kernel generalization**

```powershell
git add -- src/desktop/desktopRoute.ts src/desktop/desktopRoute.test.ts src/desktop/types.ts src/desktop/windowReducer.ts src/desktop/windowReducer.test.ts src/desktop/DesktopShell.tsx
git commit -m "feat: route typed project windows"
```

---

### Task 4: Desktop evidence-trail renderer and recruiter-first styling

**Files:**
- Modify: `src/desktop/apps/ProjectApp.tsx`
- Modify: `src/styles/desktop.css`
- Modify: `tests/e2e/desktop.spec.ts`
- Modify: `tests/e2e/mobile.spec.ts`

**Interfaces:**
- Consumes: flexible `ProjectCase` model and generalized window routing.
- Produces: accessible Preppie/Sendo windows with truthful case-specific layouts.

- [ ] **Step 1: Add failing enhanced-desktop tests**

Add tests that:

```ts
test('keyboard opens a singleton Preppie professional case and focuses its window', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).press('Enter');
  const preppieLink = page.getByRole('link', { name: 'Open Preppie project' });
  await preppieLink.press('Enter');
  await expect(page).toHaveURL(/\/work\/preppie$/);
  await expect(page.getByRole('region', { name: 'Preppie' })).toHaveCount(1);
  await expect(page.locator('[data-window-id="project:preppie"] h2')).toBeFocused();
  await expect(page.getByRole('region', { name: 'Preppie' }).locator('[data-case-chapter]')).toHaveCount(4);
  await expect(page.getByRole('region', { name: 'Preppie' }).locator('[data-evidence-row]')).toHaveCount(7);
  await expect(page.getByRole('region', { name: 'Preppie' })).not.toContainText('EV_PREPPIE_');
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  await preppieLink.press('Enter');
  await expect(page.getByRole('region', { name: 'Preppie' })).toHaveCount(1);
});

test('owned Back and Forward restore window focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await page.getByRole('link', { name: 'Open Preppie project' }).click();
  await page.goBack();
  await expect(page.locator('[data-window-id="work"] h2')).toBeFocused();
  await page.goForward();
  await expect(page.locator('[data-window-id="project:preppie"] h2')).toBeFocused();
});

test('Sendo desktop hides provenance and styles its source action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await page.getByRole('link', { name: 'Open Sendo project' }).click();
  const sendo = page.getByRole('region', { name: 'Sendo' });
  await expect(sendo).not.toContainText('EV_SENDO_');
  await expect(sendo.getByRole('link', { name: 'Source repository' })).toHaveClass(/archive-action/);
});
```

In `mobile.spec.ts`, open Work, follow `Open Preppie project`, and assert the Preppie region is fixed/fullscreen, its collaboration boundary is visible, and all seven evidence rows remain attached.

- [ ] **Step 2: Run enhanced tests and verify failure**

Run: `pnpm test:e2e -- tests/e2e/desktop.spec.ts tests/e2e/mobile.spec.ts`

Expected: FAIL because Preppie is not yet rendered in the desktop and focus is not transferred after intercepted navigation.

- [ ] **Step 3: Refactor ProjectApp into shared layout primitives**

In `ProjectApp.tsx`, build `artifactMap` once and render the same header hierarchy as Astro from `contextLabel`, `dateLabel`, `name`, optional `roleLabel`, summary, and ownership. Render lead media only when configured. Map each section to a numbered `.case-chapter[data-case-chapter]`; render `highlights` as a list and artifact ids as compact `.evidence-row[data-evidence-row]` anchors. For `artifact-led`, render remaining non-lead artifacts in `.artifact-list`. Never render `evidenceRef`.

Use a single `.archive-action` repository anchor with `[ GitHub ]`, `Source repository`, and a visually separated arrow. Add keys to all mapped Preact nodes.

- [ ] **Step 4: Implement desktop trail styling**

Replace the broad `.project-app section`/`.artifact-list code` styling with layout-specific rules:

- `.case-context`, `.chapter-number`, `.evidence-meta` use the mono system treatment;
- `.ownership-boundary` uses a bone surface, black text, sharp border, and two-column label/body layout;
- `.case-chapter` has a strong top rule and a number/title grid;
- `.evidence-row` is compact, three-column, text-decoration none, with only `.evidence-title` underlined on hover/focus;
- `.artifact-list` remains for Sendo but its entire caption is not underlined;
- `.archive-action` matches the archival action language and never browser-default blue;
- mobile collapses chapter/header/row grids without horizontal overflow.

Use only tokens from `tokens.css` and preserve current window chrome.

- [ ] **Step 5: Run desktop/mobile tests**

Run: `pnpm test:e2e -- tests/e2e/desktop.spec.ts tests/e2e/mobile.spec.ts`

Expected: PASS, including keyboard focus and owned Back/Forward focus.

- [ ] **Step 6: Commit the enhanced case renderer**

```powershell
git add -- src/desktop/apps/ProjectApp.tsx src/styles/desktop.css tests/e2e/desktop.spec.ts tests/e2e/mobile.spec.ts
git commit -m "feat: open Preppie evidence trail window"
```

---

### Task 5: Production release gate and visual verification

**Files:**
- Modify only if a verification failure identifies an in-scope defect.

**Interfaces:**
- Verifies all prior tasks as one built production slice.

- [ ] **Step 1: Run all unit tests**

Run: `pnpm test:unit`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run Astro/TypeScript validation**

Run: `pnpm check`

Expected: Astro check reports zero errors, warnings, and hints.

- [ ] **Step 3: Build from the committed dependency graph**

Run: `pnpm build`

Expected: static output includes `/work/preppie/index.html` and `/work/sendo/index.html`.

- [ ] **Step 4: Run the full production-output E2E suite**

Run: `pnpm test:e2e`

Expected: all Playwright tests pass using the configured `pnpm build && serve dist` web server.

- [ ] **Step 5: Inspect the built HTML for provenance leakage**

Run:

```powershell
rg -n "EV_(PREPPIE|SENDO)_" dist/work/preppie dist/work/sendo
```

Expected: no matches and exit code 1.

- [ ] **Step 6: Perform browser visual checks**

Using the in-app browser against the production-output server, inspect desktop `/`, desktop `/work/preppie`, desktop `/work/sendo`, and mobile `/work/preppie`. Confirm:

- the Preppie opening communicates professional context, role, and collaboration before technical detail;
- the four-chapter trail is scannable in roughly 20 seconds;
- seven PR rows feel like an archival log, not cards;
- no raw evidence ids or blanket underlines appear;
- Sendo keeps its screenshot-led identity and has a coherent source action;
- no overflow, clipped focus indicator, nested fake chrome, or mobile drag affordance appears.

- [ ] **Step 7: Commit only verification-driven fixes**

If the gate required an in-scope correction, stage only those exact files and commit:

```powershell
git commit -m "fix: polish Preppie case presentation"
```

If no correction was needed, do not create an empty commit.

- [ ] **Step 8: Confirm final branch state**

Run:

```powershell
git status --short --branch
git log --oneline main..HEAD
```

Expected: clean `piero/preppie-case` with the design, content, route, desktop, and any verification commits ahead of `main`.
