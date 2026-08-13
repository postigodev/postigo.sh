# Desktop Navigation and Window Content Polish

**Status:** Approved
**Date:** 2026-08-13
**Product:** `portfolio-v2`

## 1. Objective

Polish the native desktop slice after its first production release. Closing a
routable window must not resurrect earlier windows, About Piero must launch the
Identity hero, Now Playing must be discoverable from both desktop and Start,
large windows must not stretch their editorial content, and Start plus window
scrollbars must more faithfully reproduce the approved WIN98-template
mechanics while retaining the Stitch skin.

LinkedIn integration is explicitly deferred. Network remains a GitHub-only
surface with its existing safe fallback.

## 2. Source hierarchy

This slice follows the repository hierarchy:

1. `docs/career/` for professional truth;
2. `references/stitch/` and the approved production tokens for the portfolio's
   visual identity;
3. `references/WIN98-template/` for Start-menu, icon, scrollbar, and legacy UI
   mechanics.

The supplied scrollbar screenshot clarifies the requested legacy geometry and
skin: a 16px gray scrollbar, beveled thumb and buttons, inset track, and a
diagonal resize-corner treatment. Production remains token-driven and does not
depend on the reference files.

## 3. Root cause and routing contract

The current close handler calls `history.back()` when the closed app owns the
current desktop route. The resulting `popstate` event intentionally applies the
previous route target, which reopens the previously visited window. In a chain
such as Identity -> Selected Work -> Preppie, closing Preppie therefore reopens
Selected Work, and closing Selected Work reopens Identity.

Window lifecycle and browser traversal must be separate:

- closing a window dispatches only that window's close action;
- closing never calls `history.back()`;
- if the closed window owns the current URL, the desktop replaces the current
  owned history entry with the root desktop state and `/`;
- replacement does not apply or open Identity;
- an explicit browser Back or Forward event continues to open or focus its
  route target;
- closing a desktop-only utility never changes URL or history;
- opening one app remains independent from every other app.

After close, focus goes to the highest visible window. If none exists, it goes
to the connected opener and then to Start. Closing must not focus a launcher
inside a closed window.

## 4. About Piero launcher alias

There is no second About window in the desktop experience. Both the desktop
shortcut and Start item labeled `About Piero` target the existing `identity`
app and `/` route.

The standalone `/about` Astro document remains available for static/direct
navigation and SEO. It is not exposed as a separate desktop launcher in this
slice. The app registry must represent launcher metadata without creating a
duplicate window definition or ambiguous duplicate route lookup.

If Identity is closed, About Piero opens it. If Identity is already open or
minimized, About Piero focuses or restores the singleton window.

## 5. Now Playing discovery

Now Playing remains a desktop-only utility and never mutates the route. It is
available through both:

- a desktop icon labeled `Player`;
- a Start row labeled `Now playing` with the music icon.

Both launch the same singleton `now-playing` window and preserve lazy fetching:
the Spotify presence endpoint is requested only while that window is open.

## 6. Start menu design

The approved design is the classic vertical-rail variant:

- a dark-blue-to-gray vertical `Piero OS` brand rail;
- compact gray menu body with a 2px outset frame;
- icon-and-label rows using the shared desktop icon primitive;
- blue selection for hover and keyboard focus;
- inset/outset separators between groups;
- sentence-case labels;
- goat emblem remains on the taskbar Start button;
- no fake submenu arrows or inactive commands.

Rows are grouped as:

1. portfolio documents: About Piero, Projects, Resume, Contact;
2. utilities: Now playing, Network, Notes;
3. policy: Privacy.

Routable rows remain semantic anchors. Desktop-only utilities remain buttons.
Escape closes the menu and returns focus to Start. Primary keyboard navigation
continues to work without requiring hover.

Icons must be produced by one reusable component or mapping shared between
desktop shortcuts and Start rows. Do not introduce an icon-package dependency;
use small authored CSS/pixel-style glyphs consistent with the existing bundle
and the WIN98 reference.

## 7. Window content width

Window geometry remains unrestricted by a maximum width. Each application may
instead declare a content-width class or token through registry/app metadata.
The window body continues to fill the full client area and own scrolling; a
centered inner content surface limits line length and composition stretch.

Initial width groups:

- `editorial`: Identity, Resume, Contact, Privacy, About/static document
  surfaces; approximately 900px maximum;
- `case`: Selected Work and project cases; approximately 1100px maximum;
- `utility`: Network, Now Playing, and Notes; no internal maximum beyond their
  own natural layout.

The implementation should use shared CSS custom properties/classes rather than
hardcoded width declarations in each app. Padding belongs to the content
surface so the surrounding window body can show intentional empty space when a
window grows very wide.

On compact/mobile layouts the inner surface remains `width: 100%`, padding is
reduced, and no horizontal document overflow is introduced.

## 8. Scrollbar skin

The primary scroll container is each `.window-body`. Chromium/WebKit receives
the complete legacy skin:

- 16px vertical and horizontal dimensions;
- inset gray track;
- control-gray thumb with light top/left and dark bottom/right bevels;
- control-gray scrollbar buttons with the same bevel and an inverted pressed
  state where supported;
- tokenized hover state;
- a bottom-right corner with a diagonal grip pattern matching the supplied
  reference image.

All colors come from the shared OS tokens (`--os-control-bg`, bevel light/mid/
dark, and related state tokens). Future palette experiments must recolor window
controls, Start, and scrollbars together.

Firefox receives the closest standards-supported `scrollbar-color` and
`scrollbar-width` representation. Native-engine limitations are acceptable,
but the custom Chromium/WebKit path must not silently fall back to the current
flat styling.

The resize handles remain outside the scroll container and retain their native
desktop behavior. The visual scrollbar corner does not replace or interfere
with the eight-direction window resize contract.

## 9. Data, performance, and accessibility

- No LinkedIn endpoint, scraping, credential, placeholder metric, or static
  LinkedIn claim is added.
- GitHub and Spotify fetches remain lazy, typed, cached, and failure-tolerant.
- No new runtime dependency is required.
- Start rows use semantic links or buttons as appropriate.
- Icon glyphs are decorative when the adjacent label supplies the accessible
  name.
- Scrollbars retain native scrolling by mouse, wheel, touchpad, touch, and
  keyboard.
- Focus remains visible and sentence-case OS chrome remains intact.
- Reduced-motion behavior is unchanged.

## 10. Verification

Unit tests must prove:

- the new close-history replacement contract;
- About Piero maps to Identity without a duplicate window;
- Player and Start definitions target the same utility singleton;
- registry content-width metadata remains valid.

Production-output E2E tests must prove:

1. open Selected Work from Identity, open Preppie, close Identity and Selected
   Work, then close Preppie; neither parent reopens;
2. explicit browser Back/Forward still opens or focuses route targets;
3. About Piero opens/restores/focuses Identity;
4. Player is available from both desktop and Start;
5. widened editorial and case windows keep centered bounded content;
6. utilities remain independently resizable;
7. Start renders the vertical rail, grouped icon rows, and Privacy;
8. a window body exposes the 16px tokenized legacy scrollbar and corner skin;
9. compact/mobile behavior remains direct and overflow-free.

Final release gate:

- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `pnpm test:functions`
- `pnpm test:e2e`
- visual inspection at 1440, 1024, 768, and 390px against production output
- `git diff -- references` remains empty

## 11. Non-goals

- LinkedIn integration or scraping;
- desktop-state persistence;
- Reset Desktop UI;
- changing selected-work ranking or career copy;
- changing window maximum width or free resize mechanics;
- adding a generic icon library;
- replacing Astro routes with SPA routing;
- redesigning the Stitch desktop background or window titlebars.

