# DM2Text Case Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish DM2Text as a routable, artifact-led three-act case that renders from one typed source in Astro and the Preact desktop.

**Architecture:** Extend the existing `ProjectCase` projection with an optional ordered artifact sequence. Keep facts and provenance in the career evidence layer, copy approved public assets into the portfolio, and let both renderers resolve the same artifact IDs into an intrinsic responsive trace.

**Tech Stack:** Astro, Preact, TypeScript strict mode, plain CSS, Vitest, Playwright, pnpm.

## Global Constraints

- Preserve the approved Selected Work order: Preppie, Cimax Modernization, Koba, DM2Text, Sendo.
- Open with the changing-DOM-window versus exact selected-message hook; chapter one remains `A bounded interaction`.
- Use three project-specific acts and an `Interaction trace`; do not introduce a universal dossier or invented architecture diagram.
- Keep `EV_*` identifiers and SHA-256 values internal to source data and tests.
- Treat screenshot hashes as refreshable approved-source snapshots.
- State only that DM2Text does not intentionally transmit or persist captured message content.
- Keep exact refreshed test and bundle counts near the end as supporting verification.
- Do not touch the sibling DM2Text repository or its user-owned untracked plan.
- Add no runtime dependency.

---

### Task 1: Refresh the canonical evidence layer

**Files:**
- Modify: `docs/career/career_evidence.yaml`

**Interfaces:**
- Consumes: verified 2026-08-13 DM2Text results: 119 tests, 36,227 JavaScript bytes, 24,754 ZIP bytes.
- Produces: public evidence records `EV_DM2TEXT_PRODUCT_SCREENSHOTS` and `EV_DM2TEXT_TRANSCRIPT_FORMAT_DOCS`, plus refreshed mutable evidence timestamps.

- [ ] **Step 1: Add evidence assertions to the data test**

Add a source-text test in `src/data/portfolio.test.ts` only after Task 2 creates the DM2Text case; that test must require the public case to reference both new evidence IDs and must not serialize them into rendered DOM assertions.

- [ ] **Step 2: Update the evidence model**

Add the two evidence refs to `entities.projects.DM2TEXT.evidence_refs`, refresh `observed_at` and `last_verified` to `2026-08-13` for the two mutable evidence entries, refresh the three metric `observed_at` values, and add:

```yaml
EV_DM2TEXT_PRODUCT_SCREENSHOTS:
  source_type: project_documentation
  source_locator: https://github.com/postigodev/dm2text/tree/main/docs/assets
  evidence_level: A
  supports:
  - dm2text_copy_context_action
  - dm2text_bounded_count_dialog
  authorship:
    artifact: piero
    result: piero
  temporal_kind: historical_stable
  observed_at: '2026-08-13'
  last_verified: '2026-08-13'
  mutable: false
  publishability: PUBLIC
  source_visibility: public
  entity_refs:
  - DM2TEXT
EV_DM2TEXT_TRANSCRIPT_FORMAT_DOCS:
  source_type: project_documentation
  source_locator: https://github.com/postigodev/dm2text#transcript-format
  evidence_level: A
  supports:
  - dm2text_transcript_format
  - dm2text_anonymized_output_example
  authorship:
    artifact: piero
    result: piero
  temporal_kind: historical_stable
  observed_at: '2026-08-13'
  last_verified: '2026-08-13'
  mutable: false
  publishability: PUBLIC
  source_visibility: public
  entity_refs:
  - DM2TEXT
```

- [ ] **Step 3: Validate YAML and commit**

Run `pnpm exec prettier --check docs/career/career_evidence.yaml` if the repository formats YAML through Prettier; otherwise run the project test suite in Task 2, which imports the public projection. Commit as `docs: refresh DM2Text evidence`.

### Task 2: Add approved assets and the typed DM2Text case

**Files:**
- Create: `public/images/dm2text/message-action.png`
- Create: `public/images/dm2text/copy-dialog.png`
- Create: `public/images/dm2text/transcript-example.svg`
- Modify: `src/data/portfolio.ts`
- Modify: `src/data/portfolio.test.ts`

**Interfaces:**
- Produces: `ArtifactSequence { label: string; artifactIds: readonly string[] }`, `ProjectCase.artifactSequence?`, and a complete `dm2text` case.
- Consumes: the evidence IDs from Task 1 and public asset paths under `/images/dm2text/`.

- [ ] **Step 1: Write failing data and asset tests**

Add tests that require `selectedWork.dm2text.slug === 'dm2text'`, `layout === 'artifact-led'`, exactly three sections, sequence label `Interaction trace`, ordered kinds `['screenshot', 'screenshot', 'anonymized-example']`, solo attribution, v0.1.1 release, `session.ts` source, privacy link, and no `/chrome web store/i` claim. Add a Node SHA-256 test for the two committed PNG paths using the approved hashes, and assert the SVG includes `ANONYMIZED OUTPUT EXAMPLE`, `Person A`, `Person B`, and no `EV_DM2TEXT` or hash text.

- [ ] **Step 2: Run the test and confirm the intended failure**

Run `pnpm exec vitest run src/data/portfolio.test.ts`. Expected: failure because DM2Text has no slug/case and the three assets do not exist.

- [ ] **Step 3: Copy and verify the approved screenshots**

Create `public/images/dm2text/`, copy the two PNGs byte-for-byte from `C:\Users\akuma\repos\dm2text\docs\assets\`, and compare both source and destination hashes with `Get-FileHash -Algorithm SHA256`.

- [ ] **Step 4: Create the deterministic transcript asset**

Create a 960×540 sharp paper-style SVG with the visible heading `ANONYMIZED OUTPUT EXAMPLE`, the exact approved transcript fixture, and footer `LOCAL OUTPUT // CLIPBOARD TRANSCRIPT`. Use the portfolio bone, ink, and blue tokens as literal SVG colors; do not imitate the two screenshot frames.

- [ ] **Step 5: Extend the public content contract**

Change `ArtifactKind` to include `'anonymized-example'`, add optional `imageAlt?: string` to `PublicArtifact`, define:

```ts
export interface ArtifactSequence {
  label: string;
  artifactIds: readonly string[];
}
```

and add `artifactSequence?: ArtifactSequence` to `ProjectCase`.

- [ ] **Step 6: Add the DM2Text projection**

Set the Selected Work slug and append a case with this narrative contract:

```ts
summary: 'Instagram keeps only a changing window of a long DM thread mounted in the DOM. DM2Text turns “copy N messages ending at this exact message” into a bounded, local browser workflow.'
sections: [
  {
    id: 'bounded-interaction',
    title: 'A bounded interaction',
    body: ['Copy context begins from one exact message and asks for a count, turning an open-ended thread into an explicit request.'],
    artifactIds: [],
  },
  {
    id: 'changing-window',
    title: 'State that will not sit still',
    body: ['The collection session merges changing mounted windows, preserves the selected message as an anchor key, and returns only the requested range ending there.'],
    artifactIds: ['dm2text-session-source'],
  },
  {
    id: 'local-output',
    title: 'A local output boundary',
    body: ['DM2Text formats the requested range for the clipboard without intentionally transmitting or persisting captured message content.'],
    highlights: ['119 tests passed at the 2026-08-13 refresh.', 'Production size budgets reported 36,227 bytes of JavaScript and a 24,754-byte ZIP.'],
    artifactIds: ['dm2text-privacy', 'dm2text-release', 'dm2text-ci', 'dm2text-budgets'],
  },
]
artifactSequence: {
  label: 'Interaction trace',
  artifactIds: ['dm2text-message-action', 'dm2text-copy-dialog', 'dm2text-transcript-example'],
}
```

The first two artifacts are screenshots with useful alt text; the third is `anonymized-example`. Act 2 links directly to `https://github.com/postigodev/dm2text/blob/main/src/collection/session.ts`. Act 3 links to `https://dm2text.postigo.sh/privacy`, v0.1.1, CI, and the size-budget source. Put `119 tests`, `36,227 bytes of JavaScript`, and `24,754-byte ZIP` only in Act 3 highlights.

- [ ] **Step 7: Run the focused tests and commit**

Run `pnpm exec vitest run src/data/portfolio.test.ts`. Expected: all portfolio projection tests pass. Commit as `feat: add DM2Text case content`.

### Task 3: Render the interaction trace in Astro and Preact

**Files:**
- Modify: `src/components/ProjectCaseDocument.astro`
- Modify: `src/desktop/apps/ProjectApp.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/styles/desktop.css`

**Interfaces:**
- Consumes: `project.artifactSequence`, `PublicArtifact.imageAlt`, and the existing artifact map.
- Produces: shared DOM hooks `[data-artifact-sequence]` and `[data-sequence-artifact]` in both renderers.

- [ ] **Step 1: Add a failing static-route E2E assertion**

Extend `tests/e2e/routes.spec.ts` to visit `/work/dm2text`, assert `Interaction trace`, three sequence figures in exact order, `Anonymized output example`, three chapters, and absence of `EV_DM2TEXT`/SHA strings in `body` text.

- [ ] **Step 2: Render the sequence in both paths**

Resolve the sequence IDs through `artifactMap`; exclude those IDs from `ungroupedArtifacts`. Immediately after the header, render:

```html
<section class="artifact-sequence" data-artifact-sequence>
  <p class="artifact-sequence__label">Interaction trace</p>
  <div class="artifact-sequence__grid">
    <figure class="artifact-sequence__item artifact-sequence__item--{kind}" data-sequence-artifact>
      <a href="{href}"><img src="{href}" alt="{imageAlt}" /></a>
      <figcaption><strong>{label}</strong><span>{caption}</span></figcaption>
    </figure>
  </div>
</section>
```

Translate that exact structure into Astro expressions and Preact JSX. Local image links omit `target`; Preact figures use `artifact.id` as the key.

- [ ] **Step 3: Add intrinsic responsive styling**

Use `grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr))`. Give screenshot items a dark technical frame, and the anonymized item a bone paper surface with different border/caption treatment. Keep `img { width: 100%; height: auto; display: block; }`; do not set a window max width.

- [ ] **Step 4: Run unit, Astro, and focused E2E checks**

Run `pnpm test:unit`, `pnpm check`, then `pnpm build`. Start a static server over `dist/` on port 4322 and run `PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4322 pnpm exec playwright test tests/e2e/routes.spec.ts`. Expected: all checks pass.

- [ ] **Step 5: Commit**

Commit as `feat: render DM2Text interaction trace`.

### Task 4: Verify desktop routing and width-responsive behavior

**Files:**
- Modify: `tests/e2e/desktop.spec.ts`

**Interfaces:**
- Consumes: existing desktop launcher/window manager behavior and `[data-artifact-sequence]` hooks.
- Produces: regression coverage that DM2Text opens independently and the grid follows window content width.

- [ ] **Step 1: Add the desktop flow**

Open Projects, activate DM2Text, and assert exactly one DM2Text project window, route `/work/dm2text`, three trace items, and no forced parent-window reopening. Resize the window wide enough for multiple columns, record the first and second card positions, narrow it to one column, and assert the second card moves below the first.

- [ ] **Step 2: Run the focused desktop test against production output**

Run `pnpm build`, serve `dist/` at `http://127.0.0.1:4322`, and run `PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4322 pnpm exec playwright test tests/e2e/desktop.spec.ts`. Expected: pass in Chromium.

- [ ] **Step 3: Run the release gate**

Run sequentially: `pnpm test:unit`, `pnpm check`, `pnpm build`, then the complete Playwright suite against the built static server. Inspect `git diff --check` and `git status --short`.

- [ ] **Step 4: Commit**

Commit as `test: cover DM2Text desktop case`.
