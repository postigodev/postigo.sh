# Stitch-Literal Home Shell Design

**Status:** Approved  
**Date:** 2026-08-13  
**Product:** `portfolio-v2`

## 1. Objective

Move the portfolio home much closer to the composition and visual identity of
`references/stitch/code.html` while preserving the existing Astro document
architecture and Preact desktop mechanics.

The result is a professional identity surface first and a custom desktop
second. A recruiter should immediately read **Software Engineer**, understand
the backend + product direction, and see credible selected work. The spatial
system, dense archive texture, personal widgets, and project windows provide
the deeper personality.

Public language remains English.

## 2. Visual authority for this slice

For the home shell, the user explicitly approved the following aesthetic
override:

1. `references/stitch/code.html` is the primary visual and compositional
   authority;
2. the approved mockup in
   `.superpowers/brainstorm/1572-1786643433/home-shell-layout-v3.html` records
   the requested structural edits to that reference;
3. `docs/stitch-design-system.md` continues to supply reusable typography,
   spacing, sharp geometry, active blue, signal colors, and accessibility
   guidance where it does not conflict with the approved Stitch screen;
4. `docs/design-direction.md` remains subordinate mood context;
5. `references/WIN98-template` remains mechanics-only.

This is an explicit exception to any earlier aesthetic hierarchy that would
turn the approved black Stitch composition back into a bone-first layout.
Career truth, publishing rules, architecture, semantic HTML, accessibility,
and performance requirements are not overridden.

The exception is limited to this home-shell composition and the chrome shared
with windows opened over it. It does not make the exported reference the
project-wide authority for standalone case documents or unrelated shared
components.

Reference files remain read-only. Production code must reimplement the
approved patterns with local components and CSS; it must not depend on the
Stitch export, Tailwind CDN, Material Symbols, or its remote placeholder
assets.

## 3. Approved composition

The desktop home uses the Stitch screen nearly literally as an authored,
edge-to-edge archive workspace:

```text
top system bar
┌─────────────┬─────────────────────────────────┬──────────────┐
│ navigation  │ identity hero                   │ now.playing  │
│ rail        │                                 ├──────────────┤
│             ├──────────┬──────────┬───────────┤ notes.txt    │
│             │ Preppie  │ Cimax    │ Koba      ├──────────────┤
│             │ preview  │ preview  │ preview   │ GitHub       │
│             │          │          │           │ snapshot     │
└─────────────┴──────────┴──────────┴───────────┴──────────────┘
bottom taskbar / system strip
```

The original `status.sys` column is removed. The Identity hero expands into
that space. The original `system.info` area is replaced by a third real
Selected Work preview.

The right rail is required, not optional decoration. It retains, from top to
bottom:

1. `now.playing`;
2. `notes.txt`;
3. `network.online`, expressed as a public GitHub snapshot.

"Required" describes the authored initial/reset layout and its responsive
reflow. Once the interactive desktop is running, a visitor may move or close a
registered utility window. That intentional user state is not a layout
failure. `network.online`, which is a persistent panel rather than a window,
remains in the shell.

The approved Selected Work order remains:

1. Preppie;
2. Cimax Modernization;
3. Koba;
4. DM2Text;
5. Sendo.

The home shows the first three because the Stitch composition has three
preview slots. The complete Work surface retains all five in that order.

## 4. Structural surfaces and truthful chrome

The home combines persistent shell surfaces with real desktop windows:

- the top bar, navigation rail, project preview grid, and bottom taskbar are
  persistent shell structure;
- Identity is the dominant real window in the authored initial state;
- `now.playing` and `notes.txt` are compact desktop utility windows;
- `network.online` is a status panel, not a fake controllable window;
- project previews are archive records, not nested windows.

Only real windows receive working minimize, maximize, and close controls.
Archive records and status panels may have labelled header strips, but must not
display fake window controls. This preserves the Stitch proportions without
lying about interaction.

Initial window bounds align tightly to the underlying three-column grid.
Desktop users may focus, drag, minimize, restore, maximize, and close real
windows using the existing WindowManager. Project selection always opens a new
project window above the shell. A project already open by slug is focused
instead of duplicated.

Closing a utility does not change the route. Closing or navigating a routable
window follows the existing route/window history contract. Desktop state is
still not persisted.

## 5. Identity hero

The hero leads with:

- `PIERO POSTIGO ROCCHETTI` or a compact system identifier in the titlebar;
- `SOFTWARE ENGINEER` as the dominant heading;
- `backend + product engineering` as the directional descriptor;
- a short thesis grounded in reliability and real-world workflows;
- primary action: Explore Work;
- secondary action: View Resume.

The portrait uses Piero's public GitHub avatar from
`https://github.com/postigodev`. It is presented in the Stitch treatment:
grayscale, high contrast, sharp border, compact archival label, and a text or
initials fallback. The GitHub image must have explicit dimensions to avoid
layout shift. A failed remote image must not collapse the hero.

The hero must not lead with Systems Engineer, SRE, ML Engineer, distributed
systems, frontend specialization, or unsupported metrics.

## 6. Selected Work previews

Each home preview is a semantic link to its stable `/work/[slug]` route. With
JavaScript available, the desktop intercepts that link and opens the matching
project window. Without JavaScript, it navigates to the complete Astro case
page.

Each preview includes only evidence-safe information from the shared typed
project source:

- project name and sequence number;
- a real image or intentionally designed local visual derived from a public
  artifact;
- one concise project-specific line;
- status and a small stack or evidence cue where useful.

The three cards should vary editorially with their evidence. They must not
recreate a universal Problem / System / Impact dossier.

## 7. Right-rail widgets

### 7.1 `now.playing`

The player is a display-only personal presence surface. It is not a Spotify
controller and never autoplays audio.

It displays:

- live `NOW PLAYING` state when Piero is currently listening;
- otherwise the most recently played track as `LAST PLAYED`;
- album artwork, track, artist, Spotify link, duration, and progress where the
  source provides them;
- a compact unavailable state when Spotify cannot be reached.

Spotify-supplied metadata and cover art are visibly attributed to Spotify and
link back to the applicable Spotify track or content page. Cover art remains
in its original form: it is not downloaded into the repository, cached as a
local asset, cropped, filtered, overlaid, or incorporated into the site's
dither treatment. The surrounding player chrome may use the portfolio style;
the supplied artwork itself may not.

The browser may advance the visible progress bar locally between refreshes,
but Spotify remains the authority and the widget resynchronizes periodically.

### 7.2 Spotify data and security contract

The static Astro site calls a root Vercel Function at `/api/now-playing`. It
lives under the repository's root `api/` directory and is deployed beside the
static Astro `dist/` output. Astro remains `output: 'static'`; this slice does
not add an SSR adapter or turn the endpoint into an Astro route. The function
uses native `fetch` and server-only secrets:

- `SPOTIFY_CLIENT_ID`;
- `SPOTIFY_CLIENT_SECRET`;
- `SPOTIFY_REFRESH_TOKEN`.

The production site has no visitor-facing Spotify login, account picker, or
OAuth callback. Initial authorization is a one-time local bootstrap. The
deployed function never accepts client-supplied Spotify tokens, usernames,
account IDs, authorization codes, scopes, or redirect URIs. The account is
pinned to the stored refresh token.

The bootstrap is an explicitly invoked local script at
`scripts/spotify-bootstrap.mjs`. It requests exactly
`user-read-currently-playing` and `user-read-recently-played`, binds an
ephemeral callback listener to `127.0.0.1`, uses a redirect URI registered
exactly in the Spotify dashboard, and validates a cryptographically random,
single-use `state` before exchanging the code. It writes credentials only to
an ignored local environment file or directly into Vercel's interactive secret
input; it never prints tokens, embeds them in a URL after the callback, writes
them to source files, or commits them. The callback listener terminates after
one success, mismatch, denial, or timeout and is never deployed.

Only the read scopes required for current and recent playback are requested.
Credentials and upstream payloads are never returned or logged. The public
response is a fixed, normalized view model containing only display fields.

Using Spotify user data also requires a concise public privacy notice. This
slice adds a stable `/privacy` Astro document explaining that the site displays
the owner's current or recent playback, the fields exposed publicly, the
short-lived cache, the absence of visitor login or tracking through Spotify,
and a contact path for questions. It is linked from the system footer without
becoming a primary navigation destination.

The endpoint is public to read, so cache and request controls protect upstream
quota. This is a quota-abuse boundary, not a multi-user authentication surface.
CORS is not treated as an authorization mechanism. If a credential is ever
exposed, it must be revoked or rotated rather than hidden by a frontend change.

The function accepts only `GET` and `HEAD`, returns `405` with `Allow` for all
other methods, does not parse a request body, and rejects query parameters. It
uses one fixed cache key and CDN caching around 30 seconds with a bounded stale
window. Spotify requests use a roughly four-second abort timeout and reject an
upstream body larger than 256 KiB. Upstream `429` responses are not blindly
retried. This initial slice relies on the fixed CDN cache and absence of
request-varying inputs rather than maintaining visitor identities for an
application-level rate limiter; platform firewall limits may be added if
observed traffic warrants them.

Suggested response shape:

```ts
type NowPlayingResponse = {
  state: 'playing' | 'recent' | 'unavailable';
  track?: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
  spotifyUrl?: string;
  durationMs?: number;
  progressMs?: number;
  observedAt: string;
};
```

Responses should be cached for roughly 30 seconds and use short timeouts. An
upstream failure returns a stable unavailable payload instead of leaking a
Spotify or token-exchange error.

### 7.3 `notes.txt`

`notes.txt` is static, authored personality copy rather than a live social
feed. It uses short, evidence-safe observations aligned to the positioning
model, such as reliability as product work, explicit state boundaries, and
real artifacts before jargon.

The text lives in a shared typed content source. It must not imply employment,
metrics, research credentials, or project outcomes not supported by the career
model.

### 7.4 `network.online`

The former network-presence panel becomes a GitHub snapshot for
`@postigodev`. It may display:

- avatar and profile link;
- public repository count;
- follower count;
- aggregate public stars when computed from public repositories;
- a small set of recent or representative languages only when derivable from
  public repository metadata.

The panel must label itself as a GitHub snapshot and must not present GitHub
activity as employment impact. Forks and archived repositories must be handled
explicitly in any aggregate. Values are never hard-coded as timeless facts.

GitHub data is obtained through a root Vercel Function at
`/api/github-snapshot` using the fixed account `postigodev`. The function never
accepts a username from the request. It uses an optional server-only GitHub
token when configured and otherwise public GitHub API access. `GET` and `HEAD`
are allowed; query parameters, request bodies, and other methods are rejected.

The snapshot reports GitHub's public repository and follower fields as such.
For derived aggregates, it paginates public repositories in batches of 100 up
to a hard cap of 1,000 repositories. Forks and archived repositories remain
part of GitHub's raw public repository count but are excluded from aggregate
stars and language ranking. Stars are summed across the remaining repositories.
Languages are the top three primary repository languages by repository count;
this is labelled as a repository-language snapshot, not a skill ranking.

The normalized response includes `observedAt`. It is cached for six hours with
a bounded stale window of up to 24 hours. A failure retains the stable profile
link and removes numerical claims rather than serving timeless hard-coded
counts. The endpoint applies the same fixed-key, bounded-time, bounded-response,
method, and no-account-selector controls as the Spotify endpoint.

## 8. Data boundaries

The home consumes four distinct data classes:

| Data | Source | Freshness | Failure behavior |
| --- | --- | --- | --- |
| Identity and notes | typed local content derived from `docs/career/` | release | render normally |
| Project previews | shared typed project records and public artifacts | release | text-first preview |
| GitHub portrait/stats | public GitHub profile/repository data | hours | initials/profile link; omit stale numbers when uncertain |
| Spotify presence | server-only Spotify authorization | about 30 seconds | explicit unavailable state |

Static pages and desktop windows continue to consume the same typed identity
and project sources. Live presence data is presentation-only and must never be
written back into the career model.

## 9. Responsive behavior

The right rail must not disappear merely because the viewport becomes
narrower.

- Wide desktop preserves the literal left rail / wide center / narrow right
  rail composition.
- Compact desktop and tablet stack the right-rail widgets below the hero and
  project records in their original order.
- Mobile becomes a direct document/app flow: identity first, selected work,
  player, notes, GitHub snapshot, then system footer.
- Freeform dragging and resizing are disabled on touch/narrow layouts.
- Core navigation, project links, Resume, and Contact remain reachable before
  or independently of live widgets.

Horizontal scrolling of the entire application is not an acceptable way to
preserve the desktop screenshot. The composition reflows while retaining all
three widgets.

Canonical verification viewports are 1440×900, 1024×768, 768×1024, and
390×844. The first two retain the three-column shell. The latter two reflow the
right rail after the identity and Selected Work regions without removing any
widget.

## 10. Accessibility and performance

- Routable launchers and project records remain semantic links.
- Desktop-only widget actions use buttons.
- Window controls have accessible names and visible focus states.
- Live widget updates use a non-disruptive status strategy and do not steal
  focus or repeatedly announce progress changes.
- Album artwork and portrait images have useful alternatives; decorative
  textures do not.
- The page respects reduced motion and does not autoplay media.
- GitHub and Spotify requests begin after essential static identity content is
  available and do not block first render.
- No Spotify SDK, GitHub SDK, Tailwind runtime, icon font, animation framework,
  or global state library is added.
- Texture and artifact imagery is local, small, and intentionally compressed.

## 11. Failure and edge cases

- Spotify returns no active playback: show the most recent track.
- Spotify authorization or API fails: show `PLAYBACK_UNAVAILABLE` without
  exposing details.
- Spotify returns an episode instead of a track: normalize its public title
  and publisher or use the unavailable state if the content model cannot
  represent it safely.
- GitHub rate limit or network failure: retain the profile link and omit live
  counts.
- Remote portrait or album artwork fails: preserve dimensions and render a
  labelled fallback.
- JavaScript fails: identity, project links, and core navigation remain useful;
  live widgets degrade to static unavailable states.
- Opening the same project repeatedly: focus the existing window.
- Closing a desktop-only widget: do not mutate browser history.

## 12. Verification

Before release, verify against the built production output:

- Astro/TypeScript check, unit tests, and production build;
- static UI E2E against `dist/` served by the production preview command;
- function routing/method integration under `vercel dev`, plus unit-level
  upstream fixtures so Spotify and GitHub success/failure paths do not depend
  on personal credentials or live APIs;
- an integrated smoke against the Vercel preview deployment before production;
- first-load layout at 1440×900, 1024×768, 768×1024, and 390×844;
- the right rail is visible or reflowed at every supported width;
- the page has no page-level horizontal overflow at those widths;
- the first main heading is `Software Engineer`, precedes Selected Work in DOM
  and visual order, and exposes Explore Work as its primary action;
- project preview links work with JavaScript and without JavaScript;
- every project opens a singleton project window in the desktop;
- Preppie, Cimax Modernization, and Koba each have sufficient verified typed
  case data to support their initial preview and project window; placeholders
  are not accepted;
- drag/focus/minimize/maximize behavior remains intact for real windows;
- minimize/maximize/close controls appear only on registered windows and every
  displayed control performs its named action;
- closing a desktop-only utility window leaves browser history and URL
  unchanged;
- Spotify playing, recent, unavailable, and malformed-upstream states;
- Spotify endpoint ignores/rejects all client attempts to select an account or
  provide a token;
- no Spotify secret or raw upstream response appears in client bundles, HTML,
  logs, or endpoint responses;
- Spotify metadata and unmodified cover art carry Spotify attribution and link
  back to the applicable Spotify content;
- `/privacy` accurately documents the published playback data and cache;
- GitHub success, rate-limit, empty, and image-failure states;
- keyboard navigation, focus visibility, reduced motion, and image fallbacks;
- no-JavaScript traversal from `/` to `/work` by following a real link.

## 13. Delivery boundary

This slice includes the literal Stitch home shell, the revised first-load
composition, real Selected Work previews, the GitHub portrait and snapshot,
the secure display-only Spotify widget, responsive reflow, and preservation of
the existing window and route contracts. It also includes the minimum verified
typed case content needed for the three initial project windows, the privacy
document required by the Spotify integration, and updates to architecture or
design-system documentation needed to record the approved visual-authority
exception.

It does not include Spotify playback controls, visitor Spotify login, desktop
state persistence, a public OAuth callback, audio playback, a visitor counter,
or a generic social dashboard.
