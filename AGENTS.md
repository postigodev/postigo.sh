# AGENTS.md

## Mission

Build `portfolio-v2` as a fast, credible professional portfolio for Piero
Postigo Rocchetti. It should feel like a maintained personal corner of the web:
compact, evidence-led, and recognizably authored without becoming a desktop OS
clone or a generic portfolio template.

The production site combines:

- the implemented preview-native visual world in `DESIGN.md`
- the compositional reference in `references/preview.html`
- factual professional content verified in `docs/career/`
- mixed static/on-demand Astro routes with narrowly scoped Preact enhancement

Never invent professional facts.

---

## Canonical stack

Use:

- Astro
- Preact
- TypeScript (`strict`)
- Drizzle ORM with Neon Postgres
- Better Auth with GitHub OAuth
- Astro Actions for writing mutations
- Vercel Blob for writing PDFs
- plain CSS / scoped CSS / CSS custom properties
- typed local portfolio content
- Playwright for critical interaction tests
- pnpm

Do not replace this stack or add Tailwind, a component library, animation
framework, or global state library without explicit approval and a demonstrated
need.

---

## Source-of-truth hierarchy

When sources conflict, use this order:

1. `docs/career/`
   - factual truth: roles, dates, projects, metrics, education, and evidence

2. `src/data/portfolio.ts` and related typed local data
   - normalized production content derived from career evidence

3. `DESIGN.md`
   - canonical production visual system generated from the implemented world

4. `PRODUCT.md`
   - audience, positioning, product constraints, and scope

5. `docs/ARCHITECTURE.md`
   - canonical technical architecture

6. `references/preview.html`
   - binding visual and compositional reference for this redesign

Historical plans under `docs/superpowers/` are noncanonical records. They may
describe retired implementations and must not override the sources above.

---

## Reference policy

Everything in `references/` is read-only. Production code must not import,
serve, or otherwise depend on it at runtime.

`references/preview.html` is the binding visual/compositional reference. Use it
for the page's density, material relationships, hierarchy, goat placement, and
personal-web character. `DESIGN.md` remains the canonical production system
that turns those observations into reusable implementation rules.

Do not copy generated placeholder content into production or modify reference
files unless explicitly asked.

---

## Architecture rule

Astro owns:

- static and on-demand routes
- server-rendered HTML and Astro Actions
- SEO and metadata
- stable documents and direct links
- no-JavaScript-readable content where practical

Preact owns progressive enhancement only:

- project-case windows in `src/project-windows/`
- live GitHub and Spotify presence widgets
- tiny admin sign-in and sign-out controls

Do not turn the site into an SPA or hydrate static documents unnecessarily.

Only project cases receive real window chrome and mechanics. They may be opened
alongside one another on desktop, focused, dragged, resized, maximized, and
closed. Other site modules are ordinary route-first documents and must not use
fake minimize, maximize, close, drag, or resize controls.

---

## Routes and responsive behavior

Core content must remain useful at stable routes:

- `/`
- `/work`
- `/work/[slug]`
- `/about`
- `/resume`
- `/writings`
- `/writings/[slug]`
- `/writings/[slug]/paper.pdf`
- `/contact`
- `/privacy`
- `/admin/login`

Protected writing administration lives under `/admin`, while Better Auth is
served at `/api/auth/*`. Public writing routes must distinguish not-found
content from an unavailable database. Admin routes must fail closed when auth
or database configuration is absent.

Project launchers are semantic links. After Preact hydrates, eligible same-origin
project links progressively open or focus a project window while preserving
browser history; without JavaScript, they remain useful Astro documents.

On narrow or touch screens, a project case becomes a fullscreen view. Drag,
resize, and maximize controls are disabled; close/back behavior remains clear.
Do not reproduce freeform desktop mechanics on mobile.

---

## Content rules

Professional content is data-driven. Do not duplicate factual text across
components or leak mock projects, locations, roles, metrics, activity, or posts
into production.

Use the async writing facade in `src/data/writings.ts` for public summaries. It
loads published records through the writing service and returns an honest
unavailable state when the database cannot be reached. Drizzle/Neon is the
canonical persistence path, Better Auth protects the admin, Astro Actions own
mutations, and Vercel Blob stores optional writing PDFs.

Keep the writing backend route-first and server-owned. Its addition does not
authorize a Phase 2 visual redesign, SPA conversion, or expansion of window
chrome beyond project cases.

When content is uncertain, consult `docs/career/` before publishing it.

---

## Visual rules

Follow `DESIGN.md`. The system is preview-native: dark midnight surfaces,
steel-framed modules, metallic titlebars, compact Tahoma-led typography,
Courier New metadata, restrained blue/cyan/violet/acid-lime signals, and the
recurring goat signature.

Do not reinterpret it as literal Windows cosplay, terminal cosplay,
glassmorphism, neon cyberpunk, generic SaaS, or rounded-card marketing UI.

Prefer CSS custom properties and shared primitives. Avoid arbitrary one-off
colors, utility sprawl, large runtime effects, large media backgrounds, and
fake window controls on static modules.

---

## Accessibility and performance

- Keep primary navigation and project links semantic and keyboard accessible.
- Use real buttons for project-window controls and visible focus states.
- Drag is never the only way to access project content.
- Respect `prefers-reduced-motion`.
- Keep initial JavaScript minimal; do not add initial iframes, autoplay media,
  large icon packs, or unnecessary hydration.
- Prefer native Pointer Events for project-window gestures.

---

## Testing and change discipline

Before a material change, inspect the relevant canonical source and preserve
unrelated working behavior. Keep diffs focused and references untouched.

Before declaring implementation work complete, run the relevant checks. Baseline:

- `pnpm check`
- `pnpm test:unit`
- `pnpm test:functions` when function code or contracts are in scope
- `pnpm build:e2e`
- `pnpm test:e2e`
- `pnpm build`
- focused Playwright coverage for changed critical interaction paths

Critical browser flows include the on-demand homepage, project-window open/focus,
desktop drag/resize/maximize/close, direct project routes, and fullscreen mobile
project cases. Backend flows also include honest no-credential public fallbacks,
public admin login, fail-closed protected admin routes, and writing/PDF method
contracts.

## Definition of done

A change is done when the requested behavior works, factual claims remain
supported, the canonical visual system is respected, static/mobile paths stay
coherent, references remain untouched, and the relevant checks pass.
