# Preppie Portfolio Case Design

**Status:** Approved in conversation; pending written-spec review  
**Date:** 2026-08-13  
**Scope:** Complete the second evidence-backed portfolio case at `/work/preppie` and in the progressive-enhancement desktop.

## 1. Purpose

Preppie is the first-ranked Selected Work record and one of Piero's strongest
professional experiences. The case must make his backend, product, database,
and operational contributions legible to recruiters and hiring managers while
retaining enough primary evidence for engineers and founders.

The case tells a contribution trail:

> collaborative product → backend product flows → database contracts → release
> and recovery safeguards

This is not a claim of sole product ownership and not a generic architecture
dossier.

## 2. Canonical sources and hard boundaries

Copy and metadata derive from, in order:

1. `docs/career/career_evidence.yaml` for facts, ownership, status, metrics,
   provenance, and publishability;
2. `docs/career/career_positioning.yaml` for supported interpretation,
   interview surfaces, and blocked claims;
3. `docs/career/career_editorial_policy.yaml` for public-copy rules.

The production visual system remains the approved Stitch direction already
implemented by the portfolio. `references/WIN98-template` informs desktop
behavior only.

The case must not say or imply:

- "I built Preppie";
- sole ownership of the whole product;
- "69 features shipped";
- large-scale platform engineering;
- SRE ownership;
- campus-first positioning.

The aggregate authored-PR count is mutable snapshot evidence. The first slice
does not need to print that number. If a count is later published, it must be
refreshed from `EV_PREPPIE_PR_AGGREGATE_20260812` and retain an observation
date.

## 3. Public framing

### Header

The document and desktop window open as professional experience, not as another
shipped side project. The first scan reads in this order:

> Professional Experience · 2026 → Preppie → Startup Software Engineer —
> Backend & Integration → collaboration boundary

The role label is:

> Startup Software Engineer — Backend & Integration

The ownership statement is concise and visible near the opening:

> Collaborative product team. Piero authored substantial backend, integration,
> database, and reliability work; product ownership was shared.

The opening summary describes movement across a real product lifecycle: product
flows and shared contracts, PostgreSQL application-schema hardening, deployment
isolation and readiness, database release gates, and guarded recovery work. A
recruiter should understand that progression and the shared-ownership boundary
within roughly 20 seconds; an engineer can then inspect the underlying PRs.

### Narrative sequence

The case uses four project-specific chapters rather than a universal
Problem/System/Impact schema:

1. **Product flows** — cart lifecycle, its backend contract, and the associated
   database migration design evidenced by PR #44.
2. **Database contracts** — PostgreSQL/Supabase application-owned schema,
   RLS/grants, constraints, and foreign-key/index hygiene.
3. **Safe promotion** — repository verification, trunk safeguards, preview and
   staging isolation, fail-closed readiness, and migration/release gates.
4. **Recovery as product work** — guarded logical recovery, twice-daily restore
   configuration, rehearsal tooling, and runbooks.

Each chapter is the primary visual and editorial unit. It connects concise copy
to compact PR rows embedded directly below the relevant chapter. Claims stay
within the authorship and collaboration boundaries in the career model.

## 4. Evidence and artifacts

The public artifact trail consists of stable public GitHub pull requests:

| Chapter | Artifact | Evidence reference |
| --- | --- | --- |
| Product flows | [PR #44](https://github.com/AxiomaSystems/Chef/pull/44) | `EV_PREPPIE_PR_44_CART_LIFECYCLE` |
| Database contracts | [PR #61](https://github.com/AxiomaSystems/Chef/pull/61) | `EV_PREPPIE_PR_61_POSTGRES_HARDENING` |
| Safe promotion | [PR #125](https://github.com/AxiomaSystems/Chef/pull/125) | `EV_PREPPIE_PR_125_TRUNK_SAFEGUARDS` |
| Safe promotion | [PR #127](https://github.com/AxiomaSystems/Chef/pull/127) | `EV_PREPPIE_PR_127_ENV_ISOLATION` |
| Safe promotion | [PR #128](https://github.com/AxiomaSystems/Chef/pull/128) | `EV_PREPPIE_PR_128_READINESS` |
| Safe promotion | [PR #129](https://github.com/AxiomaSystems/Chef/pull/129) | `EV_PREPPIE_PR_129_DB_RELEASES` |
| Recovery | [PR #131](https://github.com/AxiomaSystems/Chef/pull/131) | `EV_PREPPIE_PR_131_DB_RECOVERY` |

The seven PRs must not render as seven large Sendo-style artifact cards. Each
chapter owns a compact list of PR rows containing the PR number, descriptive
title, restrained status/category metadata, and one clear external-link action.
The row may be one large semantic anchor, but only the title or action receives
link styling; captions and metadata are not underlined.

The case may include at most one or two additional visual artifacts when a
public, truthful asset is available: for example a product screenshot, a small
before/after database or configuration excerpt, recovery-tooling output, or a
release/readiness check. These are secondary context, not authorship evidence,
and the slice must remain complete without them. No private screenshots or
unpublished operational details may be added merely for visual richness.

Artifacts show descriptive labels and captions for public readers. Raw `EV_*`
evidence IDs remain in typed provenance metadata and tests only; they are not
rendered anywhere in the normal public reading path.

## 5. Content architecture

The shared typed source in `src/data/portfolio.ts` remains authoritative for
both Astro documents and Preact windows.

`ProjectCase` evolves from a Sendo-specific shape to a flexible case model:

- common identity fields: id, slug, name, kind, signal, status;
- common framing fields: role label, summary, ownership statement,
  technologies, evidence references, and project links;
- optional lead media with truthful alt text and an explicit contextual role;
- ordered narrative sections, each with a stable id, title, body, optional
  highlights, and references to artifact ids;
- first-class artifacts with stable ids, kind, label, URL, caption, evidence
  reference, and external-link behavior.

The model must let Sendo retain its existing story while Preppie uses the
four-chapter contribution trail. Components render the ordered content supplied
by each case; they do not encode Preppie-only copy or paths.

`selectedWork` gives Preppie the slug `preppie`. All selected-work ordering
remains:

1. Preppie;
2. Cimax Modernization;
3. Koba;
4. DM2Text;
5. Sendo.

## 6. Static document and desktop behavior

Astro generates `/work/preppie` from the same `projectCases` collection as
Sendo. The route is useful as semantic HTML without JavaScript and contains the
full narrative, ownership boundary, artifacts, and project link.

In the desktop enhancement:

- the Preppie Work record is a semantic `<a href="/work/preppie">`;
- JavaScript intercepts the navigation and opens a new `project:preppie`
  window;
- opening Preppie does not replace or reuse an existing Sendo project window;
- repeated opens focus the existing Preppie window rather than duplicating it;
- opening updates browser history to `/work/preppie`;
- direct visits and refreshes render the standalone Astro document and do not
  reconstruct an in-memory desktop window;
- browser Back/Forward restores or focuses project windows only for
  same-document history entries previously created and marked as owned by the
  desktop;
- the taskbar title is derived from project content, not a slug-specific
  reducer conditional;
- mobile uses the existing fullscreen/near-fullscreen app treatment with no
  freeform dragging requirement.

No desktop persistence or Reset Desktop control is introduced.

## 7. Visual treatment

Preppie remains inside the established Stitch-led desktop and document system.
The memorable device is an **evidence trail**: numbered chapter markers and
linked PR records read like an archival engineering log moving from product
behavior toward operational safeguards.

The visual hierarchy is:

1. name, role, and concise contribution framing;
2. explicit shared-ownership boundary;
3. chapter trail with visible public artifacts;
4. technology and repository metadata.

Actual interactive window chrome remains limited to the outer desktop window.
Chapters use numbered markers, strong horizontal rules, short editorial copy,
compact PR rows, selection blue, bone/technical surfaces, and restrained system
labels—not fake nested titlebars, seven large bordered cards, or generic rounded
cards. Existing canonical fonts and design tokens remain unchanged.

## 8. Accessibility and link behavior

- Narrative order is meaningful in plain document flow.
- Chapter headings form a correct hierarchy.
- Artifact links use descriptive accessible names.
- External links expose their behavior consistently and use safe `rel` values.
- The Work launcher remains keyboard-operable as an anchor.
- Window controls remain real buttons and drag is not the only navigation path.
- Any product image has specific alt text; decorative textures remain hidden.
- Focus and reduced-motion behavior follow the existing desktop contract.

## 9. Verification

Unit and content tests verify:

- Selected Work order is unchanged and Preppie is routable;
- the Preppie case has four ordered chapters and the seven public PR artifacts;
- every chapter artifact reference resolves;
- the ownership statement is present;
- blocked sole-ownership/platform/SRE language is absent;
- raw `EV_*` identifiers remain in typed data but are absent from rendered
  Preppie and Sendo HTML;
- route mapping accepts any known project slug rather than hard-coding Sendo;
- project windows derive their title from shared project content.

Playwright against built production output verifies:

1. `/work/preppie` renders useful static content and public artifact links;
2. following the Preppie anchor from `/work` works with JavaScript disabled;
3. selecting Preppie in the desktop opens a distinct window and updates the
   route;
4. repeated selection focuses rather than duplicates the window;
5. keyboard activation of the Preppie anchor opens the project window and
   transfers focus to its heading;
6. browser Back/Forward across owned desktop entries synchronizes route and
   window state, restores focus to the active window heading, and does not
   convert a direct or refreshed deep route into a desktop session;
7. the route and core content remain usable on mobile.

The release gate remains `pnpm test`, `pnpm astro check`, `pnpm build`, and the
production-output Playwright suite already configured by the repository.

## 10. Delivery boundary

This slice includes the Preppie case, the minimum shared-model and route/window
generalization required to support it cleanly, and one small consistency fix to
the existing Sendo renderers: remove visible raw evidence IDs and replace its
browser-default repository link with the established archive-action treatment.
Sendo retains its compact intro → screenshot → contributions → artifacts
structure; it is not redesigned into the Preppie trail.

Cimax, Koba, and DM2Text remain in their approved order but do not receive case
content in this slice. Resume/About/Contact desktop windows, persistence, Reset
Desktop UI, and optional experiments remain deferred.
