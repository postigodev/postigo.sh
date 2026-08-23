# Architecture

## Product architecture

`portfolio-v2` is a route-first Astro portfolio with a mixed rendering model:
stable professional documents are prerendered, while the homepage, writings,
authentication, and admin surfaces render on demand. Focused Preact islands add
only the interactions that require a browser runtime. It remains a personal web
surface, not a desktop OS.

```text
docs/career/ ── factual professional truth
        │
        ▼
src/data/portfolio.ts + async writings facade ── typed production content
        │
        ├── Astro ── static/on-demand routes, Actions, metadata, no-JS content
        ├── Drizzle/Neon ── auth and writing records
        ├── Better Auth ── GitHub OAuth and admin sessions
        ├── Vercel Blob ── private optional writing PDFs
        └── Preact ── project windows + presence + tiny admin auth controls

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

- Astro server output with prerendered and on-demand routes
- the Vercel adapter for production deployment
- Preact for bounded client-side enhancement
- TypeScript in strict mode
- plain CSS and CSS custom properties
- typed local portfolio data and an async writing facade
- Drizzle ORM with Neon Postgres for auth and writing records
- Better Auth with GitHub OAuth for administrator sessions
- Astro Actions for authorized writing mutations
- Vercel Blob for private optional writing PDFs
- pnpm, Vitest, and Playwright

No global state library, component library, animation framework, SPA shell, or
second schema generator is required. `src/db/schema.ts` and checked-in Drizzle
migrations are the single database schema authority.

## Rendering model

### Astro

Astro owns route-level pages, server HTML, SEO metadata, direct navigation,
Astro Actions, and useful no-JavaScript fallbacks. Static professional documents
are prerendered; routes that read configuration, authentication, or published
writing data render on demand.

Stable routes are:

```text
/
/work
/work/[slug]
/about
/resume
/writings
/writings/[slug]
/writings/[slug]/paper.pdf
/contact
/privacy
/admin/login
/admin
/admin/writings
/admin/writings/new
/admin/writings/[id]
/api/auth/*
```

The writing index and detail routes are public. The stable
`/writings/[slug]/paper.pdf` route resolves only published writing records, uses
the server-only Blob token to read the private object, and streams GET bytes or
returns HEAD metadata from the same origin. It never renders or redirects to the
private Blob URL. Responses are non-cacheable so unpublishing revokes resolution
at the stable route; the 4 MB upload limit bounds function bandwidth per PDF
response. `/admin/login` is public; middleware protects every other `/admin`
route and fails closed with 503 when database or authentication configuration is
absent. Better Auth owns the `/api/auth/*` request handlers. Astro Actions
create, update, publish, unpublish, delete, upload, and detach writing data after
the same authorization check.

The homepage and a direct project route share the same Astro `HomeSurface`.
The on-demand homepage passes an explicit writing-availability result. Static
project routes cannot know that live state, so they point visitors to the live
writings document without claiming that no writing has been published. Without
JavaScript, project anchors navigate normally and the route remains readable.

### Preact

Preact is limited to four progressive enhancements:

- `src/project-windows/ProjectWindowLayer.tsx` manages project-case windows.
- `GitHubWidget.tsx` renders live public GitHub presence with an honest
  unavailable state.
- `NowPlayingWidget.tsx` renders fixed-owner Spotify presence with an honest
  unavailable state.
- `AdminAuthControls.tsx` provides the small GitHub sign-in and sign-out
  controls; admin documents and mutations remain server-owned.

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

`src/data/writings.ts` is an async facade over the writing service. It projects
published database records into homepage/index summaries and converts backend
configuration or database failures into an explicit unavailable state. It does
not fabricate an empty publishing history when the backend cannot be reached.

`src/db/schema.ts` defines the Better Auth, writing, and singleton portfolio
location tables. The writing repository and service own persistence and domain
behavior; public routes only select published records. Better Auth establishes
GitHub sessions, and authorization grants admin access only when the normalized
session email exactly matches `ADMIN_EMAIL`. Vercel Blob stores optional PDF objects privately while
Postgres stores their internal object locator and cleanup metadata. Publication
and unpublication use dedicated atomic repository updates; first publication
time is preserved with database-level `COALESCE`.

After that same administrator authorization succeeds, protected admin requests
may replace the singleton coarse location from Vercel's city, region, country,
timezone, latitude, and longitude headers. Coordinates are validated and rounded
to one decimal. The on-demand homepage uses only those stored administrator
coordinates to load MET Norway weather server-side, respecting provider cache
headers and retaining a bounded last-good snapshot. No visitor is geolocated, no
IP address or location history is stored, and missing location or weather data is
omitted rather than fabricated.

Public routes distinguish missing content from unavailable infrastructure: a
valid absent record is 404, while an unconfigured or unreachable backend is 503.
The homepage and writing index remain readable with an honest unavailable
message. The public admin login also renders without credentials, while protected
admin routes fail closed.

Phase 2 remains responsible for writings-specific editorial design and any
direct upload flow. The Phase 1 backend keeps the current admin upload and
private PDF delivery paths server-owned.

## Styling and assets

`src/styles/global.css` implements the `DESIGN.md` system: midnight surfaces,
steel borders, metallic titlebars, compact Tahoma, Courier New metadata, and
restrained blue/cyan/violet/lime signals. It also contains the project-window
styles because that is the only interactive window primitive.

Production assets live under `public/`. References remain isolated and are not
bundled or imported at runtime.

## Presence routes

Astro API routes provide fixed-owner public presence data through the same
server router that owns Better Auth. Their request handlers remain isolated in
`src/lib/presence/`; browser code never receives owner credentials, Spotify
refresh tokens, or visitor login controls. GitHub and Spotify widgets render
truthful unavailable states when their endpoints or configuration are
unavailable. Do not add a parallel root `api/` Vercel Functions tree: splitting
ownership of the `/api` namespace can shadow Astro's `/api/auth/*` catch-all.

## Deployment and schema lifecycle

Production uses `@astrojs/vercel`. Vercel must provide the database, Better Auth,
GitHub OAuth, administrator, Blob, and site URL variables required by the routes
being used. Production builds never apply database migrations. Schema changes
flow from `src/db/schema.ts` through `pnpm db:generate`; `pnpm db:migrate` is an
explicit release operation against a deliberately selected database.

Browser tests use a separate `@astrojs/node` standalone build in the ignored
`.e2e-dist/` directory. This exercises SSR and asset delivery without changing
the production adapter or requiring credentials. The no-credential contract is
part of the E2E suite.

## Accessibility and resilience

- Static routes and project anchors work without JavaScript.
- Window controls are buttons; headings and dialogs expose accessible names.
- Project-window focus returns to an opener or stable fallback after close.
- Keyboard paths and visible focus states accompany pointer enhancement.
- Reduced-motion preferences suppress decorative motion.
- Mobile favors direct fullscreen case reading over freeform window behavior.

## Verification

Run `pnpm check`, `pnpm test:unit`, `pnpm test:functions`, `pnpm build:e2e`,
`pnpm test:e2e`, and `pnpm build` for the baseline. Playwright covers the
homepage, no-credential backend behavior, project-window history and geometry,
direct project routes, writing/PDF contracts, and mobile fullscreen behavior.
Run `git diff --check` before committing.
