# DM2Text Portfolio Case

## Goal

Complete DM2Text as the fifth routable Selected Work case with an evidence-first, product-readable story that preserves technical depth for engineers. The same typed case content must render at `/work/dm2text` and inside an independently managed desktop window.

## Source hierarchy

- Facts, ownership, status, metrics, provenance, and publishability come from `docs/career/career_evidence.yaml`.
- Professional interpretation and case weighting come from `docs/career/career_positioning.yaml`.
- Public wording follows `docs/career/career_editorial_policy.yaml`.
- Public assets and source links come from the current `C:\Users\akuma\repos\dm2text` checkout and its public GitHub repository.
- The untracked DM2Text MVP plan is user-owned and must remain untouched.

## Editorial angle

DM2Text is a shipped, solo browser product. Open with the concrete technical hook: Instagram keeps a changing window of a long DM thread mounted in the DOM, while the user expects “copy N messages ending at this exact message.” The first chapter remains **A bounded interaction**; the hook is introductory copy, not a replacement abstraction.

The case uses three project-specific acts rather than a universal Problem / System / Impact dossier:

1. **A bounded interaction** — `Copy context` starts one explicit session and asks for a bounded message count.
2. **State that will not sit still** — the extension reconstructs older context across changing mounted windows while preserving the exact selected endpoint through remount and partial-history conditions.
3. **A local output boundary** — transient conversation state becomes one requested clipboard transcript; message content is not persisted or intentionally transmitted.

A short shipped/verification surface follows these acts through release, source, privacy, and refreshed CI/build evidence. Exact test and bundle counts remain supporting verification near the end and never become headline impact metrics.

## Artifact sequence

The case opens with a three-step **Interaction trace** shared by the Astro and Preact renderers, not generic onboarding:

1. `message-action.png` — byte-for-byte copy of the public DM2Text asset `docs/assets/message-action.png`, showing the `Copy context` action. Approved SHA-256: `d5f07cf16742c119391d2a81bd2bcd483dc9bd89c737e52d5f9151b9da0a8844`.
2. `copy-dialog.png` — byte-for-byte copy of the public DM2Text asset `docs/assets/copy-dialog.png`, showing the bounded count dialog. Approved SHA-256: `3d6db7253c47e5e9c2c4d1ca10c8482124600c274cec5b640b9d4487b900478f`.
3. `transcript-example.svg` — a new deterministic portfolio asset based on DM2Text's documented transcript example.

The third asset must be labelled **Anonymized output example** and rendered with a visibly distinct paper/transcript treatment rather than the screenshot frame used by the first two artifacts. It must not be presented as a screenshot of a real private conversation or as evidence of adoption. Its deterministic input is the public transcript example in `C:\Users\akuma\repos\dm2text\README.md`:

```text
[10:41 AM, Tuesday] Person A: Did you see the draft?
You (replying to Person A: Did you see the draft?): Yes, sending notes now.
Person B: [shared post by example.account]
  Caption: A visible post caption
Person A: [image]
```

No real username, conversation text, or private content may appear. The implementation performs a one-time local comparison against the sibling checkout. Committed tests compare the portfolio copies against the approved source-snapshot hashes above, so clean CI and deploy checkouts do not depend on `C:\Users\akuma\repos\dm2text`. These hashes may be intentionally refreshed later when the approved upstream screenshots change; they are provenance snapshots, not permanent asset identity. Tests also assert the SVG's visible provenance label and anonymized text contract.

All three assets live under `public/images/dm2text/`. The two PNG files are copied without modifying the DM2Text source repository. The SVG follows the portfolio's sharp, archival OS skin while preserving readable transcript text.

## Typed content contract

Add an optional artifact-sequence field to `ProjectCase` instead of hard-coding DM2Text in either renderer:

```ts
type ArtifactKind =
  | 'release'
  | 'screenshot'
  | 'anonymized-example'
  | 'external-contribution'
  | 'pull-request'
  | 'source';

interface ArtifactSequence {
  label: string;
  artifactIds: readonly string[];
}

interface ProjectCase {
  // existing fields
  artifactSequence?: ArtifactSequence;
}
```

Every referenced sequence item must exist in the case's existing `artifacts` array and use `kind: 'screenshot' | 'anonymized-example'`. Sequence figures render the artifact label and caption visibly, so the constructed example's provenance cannot be hidden by presentation. The sequence is a presentation option, not a mandatory dossier section. Existing project cases remain unchanged.

SHA-256 values and `EV_*` identifiers are internal provenance/test metadata. Neither appears in the normal reader path, captions, artifact labels, or narrative copy.

Both `ProjectCaseDocument.astro` and `ProjectApp.tsx` render the same ordered sequence after the case header and before narrative sections. A shared class contract keeps their visual result consistent without duplicating facts.

## Public case content

- Add `slug: 'dm2text'` to the Selected Work record.
- Add one `ProjectCase` with `layout: 'artifact-led'`, solo ownership, status `Shipped on GitHub`, and repository `https://github.com/postigodev/dm2text`.
- Use the supported browser-product, local-first, exact-anchor, virtualized-window, release, and verification claims only.
- Link evidence to specific public source files where possible rather than repeatedly linking the repository root.
- Act 2 includes one compact real source artifact linking to `src/collection/session.ts`, where changing mounted windows are merged while selection remains bounded by the preserved anchor key. It may show a short faithful excerpt around `mergeWindow`, `anchorKey`, and `selectEndingAt`; it must not invent a generic architecture diagram.
- Include the public `v0.1.1` release and the public privacy policy or README privacy contract.
- Do not claim Chrome Web Store publication. Manual/GitHub distribution remains the canonical public state unless evidence is updated first.
- Do not describe the extension as scraping arbitrary private Instagram data.
- Scope privacy wording to DM2Text's own behavior: it does not intentionally transmit or persist captured message content. Do not make claims about Instagram, the browser, the operating-system clipboard, or other applications retaining data.

## Mutable verification

Before publishing exact test or bundle-size numbers, refresh them in the DM2Text checkout with sequential verification commands. Update `career_evidence.yaml` first if the current values differ from the canonical snapshot, then project the refreshed values into portfolio copy.

Exact counts remain supporting verification near the end, not impact metrics or headline copy. If refresh is blocked or ambiguous, omit exact numbers and state only that CI enforces tests and size budgets.

## Rendering and responsive behavior

- Desktop windows retain unrestricted resizing; the existing case-content max width remains responsible for readable prose.
- The artifact sequence uses an intrinsic grid such as `repeat(auto-fit, minmax(...))`, so it responds to the available case/window content width. It shows three columns when space permits and collapses to one column in a narrowed desktop window or mobile view.
- Images use intrinsic dimensions, descriptive alt text, and no eager-loading requirement beyond the first visible asset.
- Local image artifacts open as images when selected; source, release, privacy, and repository artifacts open as semantic links.
- No carousel, animation dependency, iframe, or runtime media fetch is introduced.

## Testing

- Extend portfolio data tests to require DM2Text's slug, three ordered sequence artifacts, distinct `anonymized-example` typing, visible provenance, evidence references, solo attribution, release, privacy/source links, and absence of blocked Chrome Web Store claims.
- During implementation, compare the two copied PNGs once against `C:\Users\akuma\repos\dm2text\docs\assets\`. In committed tests, verify the portfolio assets against the fixed SHA-256 values in this spec and assert that the generated SVG contains only the approved anonymized transcript fixture. Clean CI must not require the sibling checkout.
- Add renderer assertions for the static route and desktop window using the shared typed source.
- Confirm `/work/dm2text` builds as static HTML and works without JavaScript.
- Confirm launching DM2Text opens only the DM2Text window and preserves route/history behavior.
- Confirm the artifact sequence is three columns in a sufficiently wide case, one column after narrowing a freely resizable desktop window, and one column on mobile.
- Run unit tests, Astro check, production build, and relevant Playwright tests against built output.

## Non-goals

- Changing DM2Text product code or its website.
- Publishing to the Chrome Web Store.
- Adding all remaining portfolio projects in the same slice.
- Introducing a universal architecture diagram or fixed dossier schema.
- Reworking the approved desktop visual system.
