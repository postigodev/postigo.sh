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

DM2Text is a shipped, solo browser product. Lead with a bounded user interaction, then reveal the underlying state and identity problem: Instagram exposes partial, virtualized message windows, while the user expects a chronological transcript ending at one exact selected message.

The case uses three project-specific acts rather than a universal Problem / System / Impact dossier:

1. **A bounded interaction** — `Copy context` starts one explicit session and asks for a bounded message count.
2. **State that will not sit still** — the extension reconstructs older context across changing mounted windows while preserving the exact selected endpoint, including duplicate-message occurrences.
3. **A local output boundary** — transient conversation state becomes one requested clipboard transcript, then cleanup runs; message content is not persisted or intentionally transmitted.

A short shipped/verification surface follows these acts through release, source, privacy, and refreshed CI/build evidence.

## Artifact sequence

The case opens with a three-step optional artifact sequence shared by the Astro and Preact renderers:

1. `message-action.png` — real public screenshot of the `Copy context` action.
2. `copy-dialog.png` — real public screenshot of the bounded count dialog.
3. `transcript-example.svg` — a new deterministic portfolio asset based on DM2Text's documented transcript example.

The third asset must be labelled **Anonymized output example**. It must not be presented as a screenshot of a real private conversation or as evidence of adoption. Its text uses only `Person A`, `Person B`, `You`, and documented media/reply placeholders.

All three assets live under `public/images/dm2text/`. The two PNG files are copied without modifying the DM2Text source repository. The SVG follows the portfolio's sharp, archival OS skin while preserving readable transcript text.

## Typed content contract

Add an optional artifact-sequence field to `ProjectCase` instead of hard-coding DM2Text in either renderer:

```ts
interface ArtifactSequence {
  label: string;
  artifactIds: readonly string[];
}

interface ProjectCase {
  // existing fields
  artifactSequence?: ArtifactSequence;
}
```

Every referenced sequence item must exist in the case's existing `artifacts` array and use `kind: 'screenshot'`. The sequence is a presentation option, not a mandatory dossier section. Existing project cases remain unchanged.

Both `ProjectCaseDocument.astro` and `ProjectApp.tsx` render the same ordered sequence after the case header and before narrative sections. A shared class contract keeps their visual result consistent without duplicating facts.

## Public case content

- Add `slug: 'dm2text'` to the Selected Work record.
- Add one `ProjectCase` with `layout: 'artifact-led'`, solo ownership, status `Shipped on GitHub`, and repository `https://github.com/postigodev/dm2text`.
- Use the supported browser-product, local-first, exact-anchor, virtualized-window, release, and verification claims only.
- Link evidence to specific public source files where possible rather than repeatedly linking the repository root.
- Include the public `v0.1.1` release and the public privacy policy or README privacy contract.
- Do not claim Chrome Web Store publication. Manual/GitHub distribution remains the canonical public state unless evidence is updated first.
- Do not describe the extension as scraping arbitrary private Instagram data.

## Mutable verification

Before publishing exact test or bundle-size numbers, refresh them in the DM2Text checkout with sequential verification commands. Update `career_evidence.yaml` first if the current values differ from the canonical snapshot, then project the refreshed values into portfolio copy.

Exact counts remain supporting evidence, not impact metrics. If refresh is blocked or ambiguous, omit exact numbers and state only that CI enforces tests and size budgets.

## Rendering and responsive behavior

- Desktop windows retain unrestricted resizing; the existing case-content max width remains responsible for readable prose.
- The artifact sequence uses a three-column strip when space permits and collapses to one column on narrow/mobile views.
- Images use intrinsic dimensions, descriptive alt text, and no eager-loading requirement beyond the first visible asset.
- Local image artifacts open as images when selected; source, release, privacy, and repository artifacts open as semantic links.
- No carousel, animation dependency, iframe, or runtime media fetch is introduced.

## Testing

- Extend portfolio data tests to require DM2Text's slug, three ordered sequence artifacts, evidence references, solo attribution, release, privacy/source links, and absence of blocked Chrome Web Store claims.
- Add renderer assertions for the static route and desktop window using the shared typed source.
- Confirm `/work/dm2text` builds as static HTML and works without JavaScript.
- Confirm launching DM2Text opens only the DM2Text window and preserves route/history behavior.
- Confirm the artifact sequence is three columns on desktop and one column on mobile.
- Run unit tests, Astro check, production build, and relevant Playwright tests against built output.

## Non-goals

- Changing DM2Text product code or its website.
- Publishing to the Chrome Web Store.
- Adding all remaining portfolio projects in the same slice.
- Introducing a universal architecture diagram or fixed dossier schema.
- Reworking the approved desktop visual system.

