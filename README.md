# postigo.sh v2

Static Astro portfolio with a progressively enhanced Preact desktop shell and
root Vercel Functions for fixed-owner public presence data.

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
