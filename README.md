# postigo.sh v2

Astro portfolio with route-first documents, narrowly scoped Preact enhancement,
and on-demand writing, authentication, and presence routes on Vercel.

## Architecture

- `references/preview.html` is the binding visual/compositional reference. It
  is read-only and never a production runtime dependency.
- `DESIGN.md` is the canonical production visual system generated from the
  implemented site.
- Astro owns static and on-demand routes, documents, metadata, Astro Actions,
  and no-JavaScript-readable content.
- Preact enhances project-case windows, live GitHub/Spotify presence widgets,
  and the small admin sign-in/sign-out controls.
- Project cases are the only draggable/resizable windows: desktop supports
  multiple cases, while mobile presents fullscreen cases without drag/resize.
- Professional facts come from `docs/career/` and typed local portfolio data.
- Published writings and the protected writing admin use Drizzle with Neon;
  writing PDFs use Vercel Blob.

See `docs/ARCHITECTURE.md` for the current implementation model. Historical
plans under `docs/superpowers/` are noncanonical and may describe retired work.

## Development and backend setup

Install with Node 22.12 or newer, then copy the blank keys from `.env.example`
into an ignored local environment file and fill them locally. Never commit
credentials.

```powershell
pnpm install
pnpm dev
```

Create a Neon project and database, then use its Postgres connection string as
`DATABASE_URL`. The checked-in `src/db/schema.ts` and `drizzle/` migrations are
the single schema authority:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

`db:generate` creates a migration only when the canonical schema changed.
`db:migrate` applies checked-in migrations to the database named by
`DATABASE_URL`; run it deliberately for each environment. Builds and Vercel
deployments do not run production migrations automatically. Do not generate a
second auth schema with the Better Auth CLI: the Better Auth tables already
live in `src/db/schema.ts`.

For GitHub sign-in, configure OAuth callbacks exactly as follows:

- local: `http://localhost:4321/api/auth/callback/github`
- production: `https://v2.postigo.sh/api/auth/callback/github`

Set `BETTER_AUTH_URL` to the matching origin (`http://localhost:4321` locally or
`https://v2.postigo.sh` in production), use a cryptographically random
`BETTER_AUTH_SECRET` of at least 32 characters, and set the GitHub client ID and
secret. `ADMIN_EMAIL` authorizes one account: after trimming and lowercasing,
the authenticated GitHub email must exactly equal the configured address.

Create or connect a Vercel Blob store to the Vercel project and expose its
read/write token as `BLOB_READ_WRITE_TOKEN`. The token is needed for admin PDF
uploads and cleanup, not for rendering the public fallback or admin login.
`SITE_URL` is the public origin used for canonical writing and PDF metadata.

Use `pnpm dev:vercel` when testing the root `/api/*` presence functions locally.
On Vercel, link this repository to the intended project and configure the
database, auth, admin, Blob, site, and optional presence variables before
deploying. The production build remains `pnpm build` with the Vercel adapter.

## Spotify owner bootstrap

The Now Playing widget is display-only. It never offers visitor login, account
selection, playback controls, or accepts a token from the browser.

1. In the Spotify Dashboard, register this redirect URI exactly:
   `http://127.0.0.1:43821/callback`
2. Run `pnpm spotify:bootstrap` and enter the app client ID and hidden client
   secret when prompted.
3. Open the printed Spotify authorization URL. The callback server binds only
   to `127.0.0.1` and closes after success, rejection, or two minutes.
4. The command writes `.env.spotify.local`; this file is ignored by Git.
5. Add each value to Vercel through its interactive prompt:

```powershell
pnpm exec vercel env add SPOTIFY_CLIENT_ID production
pnpm exec vercel env add SPOTIFY_CLIENT_SECRET production
pnpm exec vercel env add SPOTIFY_REFRESH_TOKEN production
```

Never paste credentials or token values into Git, screenshots, issue bodies,
chat messages, logs, or command arguments. The optional `GITHUB_TOKEN` is also
server-only and should be added through `vercel env add` if used.

The unmodified white Spotify full-logo asset comes from Spotify's official
[Design & Branding Guidelines](https://developer.spotify.com/documentation/design)
download (`2024-spotify-full-logo.zip`).

## Verification

```powershell
pnpm check
pnpm test:unit
pnpm test:functions
pnpm build:e2e
pnpm test:e2e
pnpm build
```

`pnpm test:e2e` builds an isolated Node standalone server in `.e2e-dist/` and
tests the production-style SSR output on port 4322 without requiring backend
credentials.
`pnpm test:e2e:functions` runs routing and request-boundary checks under
Vercel CLI's unlinked local mode from a temporary clean staging directory, so
local project authentication is neither read nor required. A deployed preview
can be checked without exposing credentials:

```powershell
$env:PLAYWRIGHT_TEST_BASE_URL='https://preview.example'
pnpm playwright test tests/e2e/presence-smoke.spec.ts
```
