# Architecture

## Product architecture

`portfolio-v2` is a statically delivered Astro portfolio with focused Preact
progressive enhancement. It is a route-first personal web surface, not a
desktop OS.

```text
docs/career/ ── factual professional truth
        │
        ▼
src/data/portfolio.ts + src/data/writings.ts ── typed production content
        │
        ├── Astro ── routes, documents, metadata, no-JS content
        │
        └── Preact ── project windows + live presence widgets

DESIGN.md ── canonical production visual system
references/preview.html ── binding visual/compositional reference (read-only)
```

`references/preview.html` informs composition, density, and the authored
personal-web character. It is read-only and production code has no runtime
dependency on any file under `references/`.

`DESIGN.md` is the canonical production visual system generated from the
implemented world. Historical plans under `docs/superpowers/` are noncanonical
and may describe retired desktop-shell work.

## Stack

- Astro for static delivery and routes
- Preact for bounded client-side enhancement
- TypeScript in strict mode
- plain CSS and CSS custom properties
- typed local data for portfolio and writing surfaces
- pnpm, Vitest, and Playwright

No database, SSR, global state library, component library, or animation
framework is required for the current product.

## Rendering model

### Astro

Astro owns route-level pages, static HTML, SEO metadata, direct navigation,
portfolio documents, and useful no-JavaScript fallbacks.

Stable routes are:

```text
/
/work
/work/[slug]
/about
/resume
/writings
/contact
/privacy
```

The homepage and a direct project route share the same Astro `HomeSurface`.
Without JavaScript, project anchors navigate normally and the route remains
readable.

### Preact

Preact is limited to three progressive enhancements:

- `src/project-windows/ProjectWindowLayer.tsx` manages project-case windows.
- `GitHubWidget.tsx` renders live public GitHub presence with an honest
  unavailable state.
- `NowPlayingWidget.tsx` renders fixed-owner Spotify presence with an honest
  unavailable state.

Static documents and ordinary homepage modules do not hydrate.

## Project-window model

Only typed `ProjectCase` records use real window chrome. On desktop, visitors
can open multiple project windows, focus one, drag it, resize it from eight
edges/corners, maximize/restore it, and close it independently. The reducer and
geometry helpers in `src/project-windows/` centralize this behavior.

Project links remain semantic anchors. The hydrated layer intercepts eligible
same-origin `/work/[slug]` clicks to open or focus a singleton window and keep
browser history synchronized. Direct routes boot the corresponding case window
as an enhancement; closing or using browser Back/Forward preserves a coherent
history snapshot.

At `780px` or a coarse pointer, project windows become fullscreen. Only the
active case is shown; drag, resize, and maximize are disabled, body scrolling
is locked while a case is open, and close restores a sensible focus target.

No taskbar, Start menu, desktop icon grid, app registry, boot sequence, or
all-app window router exists in the shipped architecture. Ordinary site modules
never show inert window controls.

## Content model

`docs/career/` is the factual authority. `src/data/portfolio.ts` contains the
typed identity, selected work, project cases, ownership boundaries, and public
artifacts derived from that evidence.

`src/data/writings.ts` is a typed empty adapter. It intentionally returns no
published writings until a future Markdown-backed publishing path is introduced.
There is no writing backend, authentication, uploads, persistence, or admin
surface in this version.

## Styling and assets

`src/styles/global.css` implements the `DESIGN.md` system: midnight surfaces,
steel borders, metallic titlebars, compact Tahoma, Courier New metadata, and
restrained blue/cyan/violet/lime signals. It also contains the project-window
styles because that is the only interactive window primitive.

Production assets live under `public/`. References remain isolated and are not
bundled or imported at runtime.

## Presence functions

Root Vercel Functions provide fixed-owner public presence data. Browser code
never receives owner credentials, Spotify refresh tokens, or visitor login
controls. GitHub and Spotify widgets render truthful unavailable states when
their endpoints or configuration are unavailable.

## Accessibility and resilience

- Static routes and project anchors work without JavaScript.
- Window controls are buttons; headings and dialogs expose accessible names.
- Project-window focus returns to an opener or stable fallback after close.
- Keyboard paths and visible focus states accompany pointer enhancement.
- Reduced-motion preferences suppress decorative motion.
- Mobile favors direct fullscreen case reading over freeform window behavior.

## Verification

Run `pnpm check`, `pnpm test:unit`, `pnpm test:functions`, and `pnpm build` for
the baseline. Use focused Playwright coverage for the static homepage,
project-window history and geometry, direct project routes, and mobile
fullscreen behavior. Run `git diff --check` before committing.
