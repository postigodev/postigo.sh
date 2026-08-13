# Live Presence Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the approved home-shell widgets to secure, read-only Spotify playback and reproducible GitHub profile data without exposing credentials or turning Astro into an SSR application.

**Architecture:** Root Vercel Functions under `api/` deploy beside Astro's static `dist/`; they expose fixed-account normalized JSON and use native `fetch`, strict request guards, bounded upstream reads, explicit CDN caching, and no client-selected account inputs. Small Preact hooks fetch those same-origin view models after the static identity shell renders. Spotify authorization is a one-time local bootstrap with a temporary fixed-loopback callback and no production OAuth surface.

**Tech Stack:** Astro 7.2.1 static output, Preact 10.29.8, TypeScript 6.0.3 strict, Vercel CLI 58.11.0, native Fetch/Web Crypto/Node APIs, Vitest 4.1.10, Playwright 1.62.1, pnpm 10.26.2.

## Global Constraints

- Spotify is personal and read-only: no production login, OAuth callback, account picker, playback controls, or visitor-supplied token/account fields.
- Request exactly `user-read-currently-playing` and `user-read-recently-played`.
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, and optional `GITHUB_TOKEN` remain server-only and never appear in URLs, logs, client bundles, HTML, or responses.
- API functions accept only `GET` and `HEAD`, reject query parameters, never parse request bodies, and use fixed account/cache keys.
- Spotify CDN freshness is 30 seconds with bounded stale delivery; GitHub freshness is six hours with a stale window no longer than 24 hours.
- Spotify artwork remains unmodified and links to the applicable Spotify content with visible Spotify attribution.
- GitHub aggregate stars and language ranking exclude forks and archived repositories; raw `public_repos` retains GitHub's profile meaning.
- GitHub repository pagination uses 100 items per page and stops after 1,000 repositories.
- Live data never changes or writes back into `docs/career/`.
- No Spotify SDK, GitHub SDK, database, analytics product, global state library, or server rendering adapter.
- Production UI E2E continues to run against built `dist/`; Vercel-function integration uses a separate `vercel dev` gate.

## File map

- `api/_lib/http.ts`: request guards, bounded JSON reader, cache headers, and safe responses.
- `api/_lib/spotify.ts`: token refresh, current/recent fetch, and normalization.
- `api/_lib/github.ts`: fixed-profile fetch, pagination, and aggregate normalization.
- `api/now-playing.ts`, `api/github-snapshot.ts`: thin Fetch handlers.
- `scripts/spotify-bootstrap.mjs`: one-time local OAuth bootstrap and ignored secret-file output.
- `src/desktop/usePresence.ts`: validated post-render fetch and playing-progress calculation.
- `src/desktop/apps/NowPlayingApp.tsx`, `src/desktop/GitHubSnapshotPanel.tsx`: consume live view models while retaining deterministic fallbacks.
- `src/pages/privacy.astro`: public Spotify-data disclosure.
- `tests/functions/*.test.ts`: deterministic upstream fixtures and security/error tests.
- `tests/e2e/presence.spec.ts`: widget rendering against mocked same-origin API payloads.
- `tests/e2e/presence-api.spec.ts`, `playwright.vercel.config.ts`: root-function routing under `vercel dev`.

---

### Task 1: Add shared function boundaries and the Vercel test runtime

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `api/_lib/http.ts`
- Create: `tests/functions/http.test.ts`

**Interfaces:**
- Produces: `guardPublicRead(request: Request): Response | undefined`.
- Produces: `readJsonBounded<T>(response: Response, limitBytes?: number): Promise<T>` with default 262,144 bytes.
- Produces: `json(body, init, cachePolicy): Response` and cache policies `spotifyCache` and `githubCache`.
- Produces: scripts `test:functions` and `dev:vercel`.

- [ ] **Step 1: Write failing request-boundary tests**

```ts
describe('guardPublicRead', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rejects %s', (method) => {
    const response = guardPublicRead(new Request('https://portfolio.test/api/x', { method }));
    expect(response?.status).toBe(405);
    expect(response?.headers.get('allow')).toBe('GET, HEAD');
  });

  it('rejects query parameters and accepts fixed GET/HEAD requests', () => {
    expect(guardPublicRead(new Request('https://portfolio.test/api/x?user=attacker'))?.status).toBe(400);
    expect(guardPublicRead(new Request('https://portfolio.test/api/x'))).toBeUndefined();
    expect(guardPublicRead(new Request('https://portfolio.test/api/x', { method: 'HEAD' }))).toBeUndefined();
  });
});

it('rejects an oversized upstream body before parsing it', async () => {
  const response = new Response('x'.repeat(262_145), { headers: { 'content-length': '262145' } });
  await expect(readJsonBounded(response)).rejects.toThrow('upstream payload exceeds 262144 bytes');
});
```

- [ ] **Step 2: Run the test and confirm module failure**

Run: `pnpm vitest run tests/functions/http.test.ts`

Expected: FAIL because `api/_lib/http.ts` does not exist.

- [ ] **Step 3: Install the concrete local runtime and add scripts**

Run: `pnpm add -D vercel@58.11.0`

Add:

```json
{
  "scripts": {
    "dev:vercel": "vercel dev --port 3001",
    "test:functions": "vitest run tests/functions"
  }
}
```

Add `.env*.local` to `.gitignore`. `.env.example` contains names only:

```dotenv
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
GITHUB_TOKEN=
```

- [ ] **Step 4: Implement strict request and response helpers**

Use `new URL(request.url).search` to reject every query string. Return JSON
errors with stable public codes such as `INVALID_REQUEST` and
`METHOD_NOT_ALLOWED`; never propagate an exception message. For `HEAD`, the
endpoint handler must reuse status/headers and return `null` body.

Cache policies are exact:

```ts
export const spotifyCache = {
  browser: 'public, max-age=0, must-revalidate',
  cdn: 'public, s-maxage=30, stale-while-revalidate=120',
} as const;

export const githubCache = {
  browser: 'public, max-age=0, must-revalidate',
  cdn: 'public, s-maxage=21600, stale-while-revalidate=64800',
} as const;
```

`readJsonBounded` must check `content-length`, stream through
`response.body.getReader()`, abort after the byte limit, decode once, and call
`JSON.parse` once. Upstream fetches use `AbortSignal.timeout(4_000)`.

- [ ] **Step 5: Run the helper tests and static checks**

Run: `pnpm vitest run tests/functions/http.test.ts && pnpm check`

Expected: PASS.

- [ ] **Step 6: Commit the function foundation**

```powershell
git add package.json pnpm-lock.yaml .gitignore .env.example api/_lib/http.ts tests/functions/http.test.ts
git commit -m "build: add bounded Vercel function runtime"
```

---

### Task 2: Implement the fixed-account Spotify endpoint

**Files:**
- Create: `api/_lib/spotify.ts`
- Create: `api/now-playing.ts`
- Create: `tests/functions/spotify.test.ts`
- Create: `tests/functions/now-playing.test.ts`

**Interfaces:**
- Produces: `SpotifyEnvironment { clientId; clientSecret; refreshToken }`.
- Produces: `loadSpotifyEnvironment(env): SpotifyEnvironment | undefined`.
- Produces: `getNowPlaying(fetchImpl, environment, observedAt): Promise<NowPlayingView>`.
- Produces: default Fetch handler `{ fetch(request: Request): Promise<Response> }` at `/api/now-playing`.
- Consumes: `NowPlayingView` from `src/data/presence.ts` and helpers from `api/_lib/http.ts`.

- [ ] **Step 1: Write failing normalization and fallback tests**

Use fixture responses, never live Spotify:

```ts
it('normalizes current playback and never returns tokens', async () => {
  const result = await getNowPlaying(sequenceFetch([
    tokenResponse('access-secret'),
    spotifyResponse({ is_playing: true, progress_ms: 84_000, item: trackFixture }),
  ]), env, '2026-08-13T18:00:00.000Z');
  expect(result).toMatchObject({ state: 'playing', track: 'Test Track', progressMs: 84_000 });
  expect(JSON.stringify(result)).not.toMatch(/access-secret|refresh-secret|client-secret/);
});

it('falls back from 204 current playback to the newest recent track', async () => {
  const result = await getNowPlaying(sequenceFetch([
    tokenResponse('access-secret'),
    new Response(null, { status: 204 }),
    spotifyResponse({ items: [{ track: trackFixture, played_at: '2026-08-13T17:55:00Z' }] }),
  ]), env, '2026-08-13T18:00:00.000Z');
  expect(result).toMatchObject({ state: 'recent', track: 'Test Track' });
});
```

Endpoint tests must cover GET, HEAD, POST, `?token=attacker`, missing env,
Spotify 401/429/500, timeout, oversized JSON, malformed item, and assert the
response never contains upstream error text.

- [ ] **Step 2: Confirm Spotify tests fail**

Run: `pnpm vitest run tests/functions/spotify.test.ts tests/functions/now-playing.test.ts`

Expected: FAIL because the Spotify modules do not exist.

- [ ] **Step 3: Implement refresh, current, recent, and safe normalization**

Exchange the fixed refresh token through
`https://accounts.spotify.com/api/token` using form-encoded
`grant_type=refresh_token`. Call, in order:

```ts
const CURRENT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';
```

Return only the public view model. Track normalization requires non-empty name,
artist, album, Spotify URL, positive duration, and an artwork URL. Episodes may
map publisher into `artist` and show/episode title into album/track; malformed
items return `{ state: 'unavailable', observedAt }`. Do not retry `429` and do
not include response bodies in thrown/logged errors.

The thin handler is structurally:

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    const rejected = guardPublicRead(request);
    if (rejected) return rejected;
    const observedAt = new Date().toISOString();
    const environment = loadSpotifyEnvironment(process.env);
    const body = environment
      ? await getNowPlaying(fetch, environment, observedAt).catch(() => ({ state: 'unavailable' as const, observedAt }))
      : { state: 'unavailable' as const, observedAt };
    return jsonForMethod(request.method, body, 200, spotifyCache);
  },
};
```

- [ ] **Step 4: Run Spotify function tests**

Run: `pnpm vitest run tests/functions/spotify.test.ts tests/functions/now-playing.test.ts`

Expected: PASS with no network access.

- [ ] **Step 5: Commit the endpoint**

```powershell
git add api/_lib/spotify.ts api/now-playing.ts tests/functions/spotify.test.ts tests/functions/now-playing.test.ts
git commit -m "feat: expose secure Spotify presence data"
```

---

### Task 3: Add the one-time local Spotify bootstrap

**Files:**
- Create: `scripts/spotify-bootstrap.mjs`
- Create: `tests/functions/spotify-bootstrap.test.ts`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Produces: command `pnpm spotify:bootstrap`.
- Uses: fixed loopback redirect `http://127.0.0.1:43821/callback` registered exactly in Spotify Dashboard.
- Writes: `.env.spotify.local` containing the three Spotify variables; file is ignored and tokens are never printed.

- [ ] **Step 1: Write failing state and authorization-URL tests**

```ts
it('builds a fixed-scope authorization URL with a single-use state', () => {
  const url = buildAuthorizeUrl({ clientId: 'client', state: 'nonce' });
  expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize');
  expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:43821/callback');
  expect(url.searchParams.get('scope')).toBe('user-read-currently-playing user-read-recently-played');
  expect(url.searchParams.get('state')).toBe('nonce');
});

it('rejects a callback whose state differs', () => {
  expect(() => validateCallback(new URL('http://127.0.0.1:43821/callback?code=x&state=wrong'), 'expected'))
    .toThrow('state mismatch');
});
```

- [ ] **Step 2: Confirm bootstrap tests fail**

Run: `pnpm vitest run tests/functions/spotify-bootstrap.test.ts`

Expected: FAIL because the bootstrap module does not exist.

- [ ] **Step 3: Implement the temporary local callback safely**

The script must:

1. read client ID/secret from interactive hidden input or existing ignored local env;
2. generate 32 random bytes with `crypto.randomBytes` and encode base64url;
3. bind only `127.0.0.1:43821` for a maximum of two minutes;
4. open or print only the authorization URL, which contains no secret;
5. accept only path `/callback`, compare state with `timingSafeEqual`, and reject denial/mismatch;
6. exchange the one-time code server-side;
7. write `.env.spotify.local` with mode `0o600` where supported and never print its values;
8. close the listener after success, mismatch, denial, or timeout;
9. print only `Spotify credentials saved to .env.spotify.local` on success.

Add `"spotify:bootstrap": "node scripts/spotify-bootstrap.mjs"` to scripts and
document exact dashboard redirect registration plus `vercel env add` commands
that prompt interactively. The README must warn never to paste token values
into Git, screenshots, issue bodies, or command arguments.

- [ ] **Step 4: Run bootstrap unit tests without opening a browser**

Run: `pnpm vitest run tests/functions/spotify-bootstrap.test.ts`

Expected: PASS; tests import pure exported helpers and never execute the main
listener or token exchange.

- [ ] **Step 5: Commit the bootstrap**

```powershell
git add scripts/spotify-bootstrap.mjs tests/functions/spotify-bootstrap.test.ts package.json README.md
git commit -m "feat: add local Spotify authorization bootstrap"
```

---

### Task 4: Implement the reproducible GitHub snapshot endpoint

**Files:**
- Create: `api/_lib/github.ts`
- Create: `api/github-snapshot.ts`
- Create: `tests/functions/github.test.ts`
- Create: `tests/functions/github-snapshot.test.ts`

**Interfaces:**
- Produces: `getGitHubSnapshot(fetchImpl, token, observedAt): Promise<GitHubSnapshotView>` fixed to `postigodev`.
- Produces: default Fetch handler at `/api/github-snapshot`.
- Consumes: `GitHubSnapshotView`, request guards, bounded reader, and six-hour cache policy.

- [ ] **Step 1: Write failing aggregate-contract tests**

```ts
it('keeps raw public repos but excludes forks and archived repos from derived values', async () => {
  const result = await getGitHubSnapshot(sequenceFetch([
    githubResponse({ login: 'postigodev', html_url: 'https://github.com/postigodev', avatar_url: 'https://avatars.githubusercontent.com/u/1', public_repos: 4, followers: 3 }),
    githubResponse([
      { fork: false, archived: false, stargazers_count: 5, language: 'TypeScript' },
      { fork: true, archived: false, stargazers_count: 99, language: 'JavaScript' },
      { fork: false, archived: true, stargazers_count: 50, language: 'Rust' },
      { fork: false, archived: false, stargazers_count: 2, language: 'Rust' },
    ]),
  ]), undefined, '2026-08-13T18:00:00.000Z');
  expect(result).toMatchObject({ publicRepos: 4, followers: 3, stars: 7, languages: ['Rust', 'TypeScript'] });
});
```

Add tests for 100-item pagination, the 1,000-item cap, deterministic language
ties alphabetically, optional Authorization header, fixed username, 403/429,
timeout, malformed/oversized JSON, method rejection, and query rejection.

- [ ] **Step 2: Confirm GitHub tests fail**

Run: `pnpm vitest run tests/functions/github.test.ts tests/functions/github-snapshot.test.ts`

Expected: FAIL because the GitHub modules do not exist.

- [ ] **Step 3: Implement fixed-account pagination and aggregation**

Fetch `https://api.github.com/users/postigodev`, then owner repositories in
100-item pages. Send `Accept: application/vnd.github+json`, a stable
`User-Agent: postigo-portfolio`, and `Authorization: Bearer ...` only when
`GITHUB_TOKEN` exists. Count primary languages by eligible repository count,
sort descending count then ascending language, and keep three.

On any failure, return the stable unavailable view with profile URL/login and
no numerical properties. Do not return upstream rate-limit headers, body text,
or token state.

- [ ] **Step 4: Run GitHub function tests**

Run: `pnpm vitest run tests/functions/github.test.ts tests/functions/github-snapshot.test.ts`

Expected: PASS with no live GitHub dependency.

- [ ] **Step 5: Commit the GitHub endpoint**

```powershell
git add api/_lib/github.ts api/github-snapshot.ts tests/functions/github.test.ts tests/functions/github-snapshot.test.ts
git commit -m "feat: expose a cached GitHub profile snapshot"
```

---

### Task 5: Hydrate live widgets without blocking identity

**Files:**
- Create: `src/desktop/usePresence.ts`
- Create: `src/desktop/usePresence.test.ts`
- Modify: `src/desktop/DesktopShell.tsx`
- Modify: `src/desktop/apps/NowPlayingApp.tsx`
- Modify: `src/desktop/GitHubSnapshotPanel.tsx`
- Create: `public/brand/spotify-logo.svg`
- Create: `tests/e2e/presence.spec.ts`

**Interfaces:**
- Produces: `usePresenceEndpoint<T>(url, fallback, validate): T`.
- Produces: `usePlayingProgress(view: NowPlayingView): number | undefined`.
- Consumes: `/api/now-playing`, `/api/github-snapshot`, and static fallback values.

- [ ] **Step 1: Write failing mocked-widget E2E tests**

```ts
test('renders playing and GitHub snapshot payloads without blocking identity', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: playingFixture }));
  await page.route('**/api/github-snapshot', (route) => route.fulfill({ json: githubFixture }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await expect(page.getByText('NOW PLAYING', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Track on Spotify/i })).toHaveAttribute('href', playingFixture.spotifyUrl);
  await expect(page.locator('[data-network-panel]')).toContainText('7 stars');
});

test('keeps explicit fallback states for malformed responses', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: { state: 'playing', token: 'bad' } }));
  await page.route('**/api/github-snapshot', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByText('PLAYBACK_UNAVAILABLE')).toBeVisible();
  await expect(page.getByRole('link', { name: '@postigodev' })).toBeVisible();
  await expect(page.locator('[data-network-panel]')).not.toContainText(/stars|followers|repos/);
});
```

- [ ] **Step 2: Confirm presence UI tests fail**

Run: `pnpm playwright test tests/e2e/presence.spec.ts`

Expected: FAIL because the widgets do not fetch or validate live payloads.

- [ ] **Step 3: Implement validated post-render fetching and local progress**

`usePresenceEndpoint` starts from fallback, fetches in `useEffect`, requires
`response.ok`, validates every field before setting state, aborts on unmount,
and never logs response bodies. It does not use an `aria-live` region.

`usePlayingProgress` advances once per second only for `state === 'playing'`,
caps at `durationMs`, resets whenever `observedAt`, track, or `progressMs`
changes, and returns the fixed value for recent playback. The progress bar is
`aria-hidden`; screen readers receive the state, track, artist, and link once.

Acquire `public/brand/spotify-logo.svg` from the downloadable assets linked by
Spotify's official design guidance at
`https://developer.spotify.com/documentation/design` and keep it byte-for-byte
unmodified. Record the source URL in `README.md`. Album art uses its natural
square aspect with `object-fit: contain`, no CSS filter, crop, pseudo-element,
or overlay. Wrap artwork/metadata in a link to `spotifyUrl` and label it
`<track> on Spotify`.

- [ ] **Step 4: Run hooks and UI tests**

Run: `pnpm vitest run src/desktop/usePresence.test.ts && pnpm playwright test tests/e2e/presence.spec.ts`

Expected: PASS; identity is visible before either routed API response resolves.

- [ ] **Step 5: Commit the hydrated widgets**

```powershell
git add src/desktop/usePresence.ts src/desktop/usePresence.test.ts src/desktop/DesktopShell.tsx src/desktop/apps/NowPlayingApp.tsx src/desktop/GitHubSnapshotPanel.tsx public/brand/spotify-logo.svg tests/e2e/presence.spec.ts README.md
git commit -m "feat: hydrate live portfolio presence widgets"
```

---

### Task 6: Add privacy disclosure and integrated release gates

**Files:**
- Create: `src/pages/privacy.astro`
- Modify: `src/desktop/HomeShell.tsx`
- Create: `playwright.vercel.config.ts`
- Create: `tests/e2e/presence-api.spec.ts`
- Create: `tests/e2e/presence-smoke.spec.ts`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Produces: stable `/privacy` document linked from the system footer.
- Produces: `test:e2e:functions` using `vercel dev --port 3001`.
- Produces: deployed-preview smoke runnable through `PLAYWRIGHT_TEST_BASE_URL`.

- [ ] **Step 1: Write failing privacy and local-function tests**

```ts
test('privacy page describes the owner-only playback display', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByText(/owner's current or recently played Spotify content/i)).toBeVisible();
  await expect(page.getByText(/visitors do not connect a Spotify account/i)).toBeVisible();
});

test('local functions reject account selectors', async ({ request }) => {
  expect((await request.get('/api/now-playing?user=visitor')).status()).toBe(400);
  expect((await request.get('/api/github-snapshot?user=visitor')).status()).toBe(400);
  expect((await request.post('/api/now-playing', { data: { refreshToken: 'visitor' } })).status()).toBe(405);
});
```

- [ ] **Step 2: Confirm the new route/gate fails**

Run: `pnpm build && pnpm playwright test tests/e2e/presence-api.spec.ts --config=playwright.vercel.config.ts`

Expected: FAIL because `/privacy` and the Vercel Playwright configuration do
not exist.

- [ ] **Step 3: Implement the public disclosure and footer link**

The English privacy document states:

```text
This portfolio displays the owner's current or recently played Spotify content: track or episode title, artist or publisher, album or show, cover art, playback status, progress, and a Spotify link. The server caches this display data for about 30 seconds. Visitors do not connect a Spotify account, and this site does not use Spotify to identify or track visitors. Spotify credentials remain server-side. GitHub profile statistics are public data cached for up to six hours. Questions can be sent through the Contact page.
```

Link `/privacy` from the bottom system strip. Do not add it to the primary Home /
Work / Resume navigation.

- [ ] **Step 4: Configure distinct static and Vercel integration gates**

`playwright.vercel.config.ts` starts `pnpm exec vercel dev --port 3001`, targets
`http://127.0.0.1:3001`, and runs only `presence-api.spec.ts`. Missing secrets
must yield normalized unavailable payloads, allowing routing/security tests to
run in CI without personal credentials.

Add:

```json
{
  "scripts": {
    "test:e2e:functions": "playwright test tests/e2e/presence-api.spec.ts --config=playwright.vercel.config.ts"
  }
}
```

`presence-smoke.spec.ts` checks that `/`, `/privacy`, `/api/now-playing`, and
`/api/github-snapshot` respond on a provided preview URL; it accepts live or
unavailable normalized states and rejects unknown fields matching
`token|secret|clientId|refresh`.

- [ ] **Step 5: Run the complete local release gate sequentially**

Run:

```powershell
pnpm check
pnpm test:unit
pnpm test:functions
pnpm build
pnpm test:e2e
pnpm test:e2e:functions
```

Expected: all commands exit 0. Static Playwright uses built `dist/`; function
Playwright uses `vercel dev`; neither requires live personal credentials.

- [ ] **Step 6: Verify secret absence before deployment**

Run:

```powershell
rg -n "SPOTIFY_CLIENT_SECRET|SPOTIFY_REFRESH_TOKEN|GITHUB_TOKEN|access_token|refresh_token" dist src public
git status --short
```

Expected: no secret values or server-only identifiers in `dist`, `src`, or
`public`; only intentional environment variable names may exist in server/docs
files outside those directories. `.env.spotify.local` is not listed by Git.

- [ ] **Step 7: Commit the disclosure and gates**

```powershell
git add src/pages/privacy.astro src/desktop/HomeShell.tsx playwright.vercel.config.ts tests/e2e/presence-api.spec.ts tests/e2e/presence-smoke.spec.ts package.json README.md
git commit -m "test: verify live presence integrations"
```

- [ ] **Step 8: Deploy a preview and run the integrated smoke**

After adding the three Spotify secrets and optional GitHub token through
Vercel's interactive environment controls, run:

```powershell
pnpm exec vercel deploy
$env:PLAYWRIGHT_TEST_BASE_URL='<preview-url-returned-by-vercel>'
pnpm playwright test tests/e2e/presence-smoke.spec.ts
```

Expected: Vercel returns a preview URL and the smoke test passes against that
URL. Do not echo, interpolate, or place secret values in either command.
