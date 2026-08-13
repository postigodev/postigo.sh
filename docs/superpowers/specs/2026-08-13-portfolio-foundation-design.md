# Portfolio Foundation Design

**Status:** Approved
**Date:** 2026-08-13
**Product:** `portfolio-v2`

## 1. Objective

Build a fast professional portfolio presented as a custom personal desktop.
The first 30 seconds must work for recruiters and hiring managers, while deeper
project records must remain credible and useful to engineers and technical
founders.

The primary visitor journey is:

```text
identity -> selected work -> project evidence -> resume/contact
```

Public language is English. The default information architecture is Home,
Work, Resume, and optional Contact.

## 2. Source-of-truth hierarchy

### 2.1 Career truth and strategy

Public portfolio content must follow this order:

1. `docs/career/career_evidence.yaml`
   - canonical factual layer;
   - owns events, contributions, ownership, status, metrics, provenance, and
     publishability.
2. `docs/career/career_positioning.yaml`
   - canonical derived interpretation;
   - owns primary identity, differentiators, supported and blocked claims,
     project weighting, role-selection logic, and interview surfaces.
3. `docs/career/career_editorial_policy.yaml`
   - canonical communication rules;
   - controls how evidence and positioning become public copy.

The Markdown companions are human-readable explanations. If the v2 model
conflicts with an older resume, LinkedIn export, portfolio PDF, project README,
or previous copy, the v2 model wins.

The frontend must not load the canonical YAML files directly. Production
content is a curated typed projection containing only reviewed, public fields.

### 2.2 Visual and interaction hierarchy

1. `docs/stitch-design-system.md` is the canonical production authority for
   tokens, component skin, and visual rules.
2. `docs/ARCHITECTURE.md` is the canonical technical architecture.
3. `references/stitch/` is the primary visual and compositional reference used
   to interpret the approved system in layouts and proportions.
4. `docs/design-direction.md` supplies subordinate cultural and emotional
   context only.
5. `references/WIN98-template/` supplies interaction mechanics only.

Placing `references/stitch/` above `docs/design-direction.md` is an explicit
user-approved product override for this portfolio. It does not override the
canonical authority of `docs/stitch-design-system.md` or the technical authority
of `docs/ARCHITECTURE.md`.

If the exported Stitch reference conflicts with `docs/stitch-design-system.md`,
the production design system wins. Neither `docs/design-direction.md`, stock
Win98 styling, nor implementation preference may override Stitch aesthetics.

Production must not depend on files in `references/`.

## 3. Professional positioning

The public identity is **Software Engineer** with the directional descriptor
**backend + product engineering**.

The supported differentiators are:

- reliability and operational thinking;
- workflow automation and integrations;
- bounded applied AI;
- explicit state, identity, and side-effect boundaries.

Do not lead with Systems Engineer, Distributed Systems Engineer, SRE, ML
Engineer, or frontend specialist.

## 4. First-load composition

The approved direction is **Identity first**.

Desktop first load contains:

- a dominant Identity window;
- a visible but subordinate Selected Work preview;
- a small, meaningful set of desktop icons;
- a launcher/navigation rail consistent with Stitch composition;
- a taskbar that makes the desktop model legible;
- secondary status surfaces only when they do not compete with identity;
- enough visible desktop surface to communicate spatial interaction.

The Identity window communicates:

- Piero Postigo Rocchetti;
- Software Engineer;
- backend + product engineering;
- a concise evidence-safe thesis;
- a primary action to explore selected work;
- a secondary Resume action.

The visual treatment follows Stitch: black/bone structural surfaces, technical
gray, harsh blue active state, sharp edges, dense archival composition,
controlled halftone/dither/scanline friction, and the goat as a restrained
signature.

Only actual interactive windows receive titlebars and Minimize, Maximize, and
Close controls. Nested content must not pretend to be a window.

## 5. Selected Work and professional experience

The approved flagship Selected Work collection is:

1. Preppie;
2. Cimax Modernization;
3. Koba;
4. DM2Text;
5. Sendo.

This is an explicit product/editorial decision for this portfolio and its
recruiter-first audience. It overrides the generic flagship pool in the current
positioning model without changing that model's broader role-selection weights.
Sendo remains in the flagship collection because its shipped Rust/Tauri
desktop, device/API, distribution, and external-contributor evidence adds a
distinct technical surface. Implementing its case study first is a vertical-
slice decision and does not change the public ranking above.

The homepage exposes three initial records and provides a direct path to the
complete Work archive.

Coaktiva 2025 is a strong Professional Experience entry, not a flagship
project. Its sanitized reference implementation may provide supporting
technical depth with explicit sanitization context.

The following projects remain prominent in Work:

- Trama: backend/product and state-modeling depth; clearly unreleased;
- Aeris: applied-AI/backend hackathon work with explicit team attribution;
- UrbanLens: applied-AI/geospatial work with explicit hackathon/prototype
  labeling;
- Brumaire: browser/media depth with explicit prototype status.

Project narratives are evidence-shaped. They may include context, personal
contribution, constraints, technical decisions, status, and artifacts, but do
not use a mandatory universal Problem/System/Impact template.

Prefer inspected evidence such as PRs, screenshots, diffs, workflow diagrams,
release records, and source artifacts before abstract architecture language.

## 6. Rendering architecture

Astro is the canonical document and routing layer. It owns:

- static route documents;
- SEO and metadata;
- accessible content and navigation;
- project detail pages;
- no-JavaScript fallbacks.

The core routes are:

```text
/
/work
/work/[slug]
/resume
/about
/contact
```

One primary Preact island progressively enhances the homepage into a desktop:

```text
DesktopShell
|- DesktopSurface
|- DesktopIcons
|- WindowManager
|  `- Window instances
|- Taskbar
|- StartMenu
`- Apps
```

The desktop is not a generic SPA and does not replace Astro documents.

## 7. Window model

The WindowManager centralizes:

- open and close;
- focus and z-index ordering;
- drag constrained to desktop bounds;
- minimize and restore;
- maximize and restore bounds;
- app registration;
- reset to the authored initial state.

Apps own content, not window mechanics. A typed app registry supplies app ID,
title, route where applicable, icon, singleton behavior, default bounds, and
mobile mode.

When selected inside the enhanced desktop, every project opens in a dedicated
project window above Work. Project windows are singleton by slug. Opening an
already-open project focuses its existing window rather than creating a
duplicate. Work remains open behind it to preserve context.

A direct or refreshed `/work/[slug]` request remains a standalone Astro
document. It does not synthesize or hydrate an artificial Work window behind
the project. Returning to `/` starts the authored desktop composition.

Desktop state is not persisted in the initial implementation.
Reset remains a reducer-level recovery capability, but the initial UI does not
surface a Reset Desktop control before persistence or a demonstrated UX need.

## 8. Route and window synchronization

The route and desktop state follow these rules:

- `/` represents the authored initial desktop composition.
- Work, project detail, Resume, About, and Contact are routable apps.
- Status, Now Playing, Terminal, and similar utilities are desktop-only and do
  not modify the URL.
- Routable launcher actions are semantic `<a href="...">` elements. The
  enhanced desktop intercepts eligible same-origin clicks; without JavaScript,
  they navigate to complete Astro documents. Desktop-only utilities use
  `<button>`.
- Opening a routable app adds a history entry only when the route changes.
- Opening a routable singleton that already represents the current route only
  focuses it; it does not duplicate history.
- Drag, focus, minimize, maximize, and restore never change the URL.
- `popstate` applies route state to windows without writing another history
  entry.
- Browser Back from a project restores or focuses Work when Work is the prior
  in-desktop entry.
- Browser Forward reopens or focuses the corresponding project window.
- Closing the window represented by the current route returns to the previous
  in-desktop route. If no safe in-desktop entry exists, it replaces the route
  with `/`.
- Refreshing or directly visiting any route returns its complete Astro
  document first.

The enhanced desktop owns only same-document entries it created. Each owned
entry uses a minimal state shape:

```ts
type DesktopHistoryState = {
  portfolioDesktop: true;
  entryId: number;
  depth: number;
  route: string;
  appId: string;
  projectSlug?: string;
};
```

On desktop boot at `/`, the shell uses `replaceState` to mark depth `0`.
User-initiated routable app opens use `pushState` with the next depth. Applying
an owned `popstate` entry restores/focuses the matching singleton window and
never writes history. Closing the current route window calls `history.back()`
only when the current owned entry has depth greater than zero; otherwise it
uses `replaceState` for `/`. Entries without `portfolioDesktop: true`, external
referrers, and cross-document navigations remain native browser navigation.

A reload of a deep route deliberately exits the in-memory desktop session and
returns the standalone Astro document. Minimizing a current-route window does
not change the URL; applying Back or Forward restores and focuses the window
represented by the resulting owned entry.

This narrow state contract prevents recursive history writes without creating
a second general-purpose router.

## 9. Shared content model

Static Astro pages and Preact windows consume the same typed content modules or
Content Collections. They must not maintain separate copies of professional
copy.

Suggested domains are:

- identity and public links;
- professional experience;
- projects and status;
- public evidence references and artifacts;
- writing when introduced.

Project cases also expose first-class public artifacts. Each artifact records
its kind, label, public URL or local asset, evidence reference, caption, and
optional publication caveat. The first Sendo case includes release/distribution
evidence, a real product screenshot, and external-contributor evidence. Artifact
availability does not impose a universal narrative section schema.

Attribution, ownership, publishability, artifact visibility, temporal caveats,
and status must be explicit fields where relevant. Private evidence may support
a public statement without becoming a public asset.

## 10. Responsive behavior

Desktop is spatial. Mobile is direct.

On desktop:

- Work opens as a real movable window;
- project records inside Work are archive rows or cards;
- selecting a record opens a dedicated project window;
- taskbar entries expose open and minimized apps.

On mobile:

- the active app becomes a fullscreen or near-fullscreen view;
- project selection opens a direct project view;
- Close becomes clear Back/Home behavior;
- Home, Work, Resume, About, and Contact remain directly reachable;
- drag and freeform resize are disabled;
- double-click is never required.

The same content components and visual system serve both modes.

Contact is a required accessible route and content destination, but it is
optional in the primary top-level navigation and first-load icon set. The
initial vertical slice provides static Astro documents for Resume, About, and
Contact. Interactive desktop windows for those destinations may follow after
the Identity, Work, and first project flow; until then, desktop actions use
ordinary route links.

## 11. Accessibility

- Window controls use real buttons with accessible names.
- Each non-modal window is a named region associated with its visible title;
  active, minimized, and maximized state is programmatically exposed.
- Core actions work with keyboard and single click.
- Double-click is optional enhancement only.
- Focus states remain visible.
- Launcher, desktop icons, taskbar entries, and window controls support Tab plus
  Enter/Space activation in a predictable order.
- Closing a window returns focus to the launcher, icon, or Work record that
  opened it. Minimizing moves focus to its taskbar entry. Restoring, route
  navigation, and owned `popstate` focus the activated window heading without
  trapping focus.
- Drag is never the only way to reach or use content.
- Active routes and taskbar entries expose current state without relying on
  color alone.
- Text, controls, and focus indicators are validated against WCAG AA contrast
  requirements within the Stitch palette.
- Motion is short and mechanical and respects `prefers-reduced-motion`.
- Static routes preserve semantic headings, links, and document structure.

## 12. Failure behavior

- If desktop JavaScript fails, identity and essential navigation remain in
  static HTML and route documents remain usable.
- Unknown project slugs produce a useful 404.
- Missing optional images degrade to meaningful text and alt content without
  collapsing the case-study layout.
- Unverified or unavailable artifacts are omitted or accurately labeled; the
  UI does not manufacture substitute evidence.
- Invalid window transitions fail safely and Reset Desktop restores the
  authored initial composition.

## 13. Performance

Initial JavaScript includes only the desktop kernel and first-load apps.
Secondary apps and media are lazy-loaded. There are no initial iframes,
autoplaying media, runtime texture generation, large animation libraries, or
speculative runtime dependencies.

Textures should be small tiled assets or CSS patterns. Project imagery should
be intentionally compressed and loaded only when needed.

## 14. Verification

The first vertical slice must pass:

- Astro/TypeScript check;
- production build;
- production preview or a static server over `dist/` for the final E2E gate;
- initial desktop boot with visible identity;
- Work and project opening;
- project singleton behavior;
- Close behavior for owned and depth-zero route entries;
- reducer-level reset behavior without a visible Reset Desktop control;
- focus and z-index behavior;
- constrained drag;
- minimize/restore;
- maximize/restore;
- route/window synchronization;
- browser Back/Forward behavior;
- no duplicate or recursive history writes;
- direct-entry, external-referrer, reload, and in-desktop history boundaries;
- direct `/work/[slug]` visit;
- mobile navigation without drag;
- keyboard-only launcher, taskbar, window, and project activation;
- focus restoration after close, minimize, restore, and owned `popstate`;
- reduced-motion behavior;
- meaningful image-failure rendering;
- basic no-JavaScript fallback.

Prefer a compact set of high-value Playwright flows over shallow coverage.

## 15. Initial delivery boundary

The first implementation slice includes the Astro/Preact foundation, design
tokens, the desktop kernel, the approved Identity-first state, Work, one
evidence-backed project window and route, static Resume/About/Contact documents,
taskbar/launcher mechanics, responsive mobile behavior, and critical tests.
Identity and Work actions use ordinary links for any routable app whose desktop
window is deferred.

Persistence, rich Terminal behavior, Now Playing integrations, audio, custom
cursor, boot theater, visitor counters, and other optional experiments are out
of scope until the professional core is complete and fast.
