# postigo.sh v2

Static Astro portfolio with route-first documents, project-only Preact window
enhancement, and root Vercel Functions for fixed-owner public presence data.

## Architecture

- `references/preview.html` is the binding visual/compositional reference. It
  is read-only and never a production runtime dependency.
- `DESIGN.md` is the canonical production visual system generated from the
  implemented site.
- Astro owns routes, documents, metadata, and no-JavaScript-readable content.
- Preact enhances only project-case windows and live GitHub/Spotify presence
  widgets.
- Project cases are the only draggable/resizable windows: desktop supports
  multiple cases, while mobile presents fullscreen cases without drag/resize.
- Professional facts come from `docs/career/` and typed local portfolio data.
- `src/data/writings.ts` is an intentionally empty typed adapter prepared for a
  future Markdown backend; no writing backend exists today.

See `docs/ARCHITECTURE.md` for the current implementation model. Historical
plans under `docs/superpowers/` are noncanonical and may describe retired work.

## Local development

```powershell
pnpm install
pnpm dev
```

Use `pnpm dev:vercel` when testing the root `/api/*` functions locally.

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
pnpm build
```

`pnpm test:e2e` builds and serves `dist/` for static UI behavior.
`pnpm test:e2e:functions` runs routing and request-boundary checks under
Vercel CLI's unlinked local mode from a temporary clean staging directory, so
local project authentication is neither read nor required. A deployed preview
can be checked without exposing credentials:

```powershell
$env:PLAYWRIGHT_TEST_BASE_URL='https://preview.example'
pnpm playwright test tests/e2e/presence-smoke.spec.ts
```
