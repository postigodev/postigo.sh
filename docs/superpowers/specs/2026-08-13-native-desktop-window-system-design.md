# Native Desktop Window System Design

**Status:** Approved
**Date:** 2026-08-13
**Product:** `portfolio-v2`

## 1. Objective

Refactor the interactive portfolio shell into a coherent native-style desktop:
the full viewport is the workspace, one truthful window system owns every app,
desktop icons and Start are the only shell navigation, and direct Astro routes
remain useful without JavaScript.

The redesign must fix the current coupling between authored layout slots and
floating windows, the project-to-Work opening dependency, and the
maximize/restore failure for windows that have not previously moved.

The visual result should retain the approved Stitch background and archive
texture while adopting the interaction clarity of the Win98 reference. It is
not a literal Windows 98 clone.

## 2. Authority and supersession

For this slice:

1. `docs/career/` remains authoritative for professional truth and editorial
   strategy;
2. the user-provided Stitch background and `references/stitch/code.html` are
   the primary aesthetic and compositional references;
3. `references/WIN98-template` is the interaction reference for native desktop
   mechanics, controls, resize behavior, taskbar, Start, and scrollbars;
4. shared production styling must still be expressed as project-owned tokens
   and primitives rather than depending on either reference at runtime.

`docs/stitch-design-system.md` remains canonical for shared production tokens
and component skin. The approved background and composition in this document
are a limited, explicit exception where they differ from its broader
bone-surface direction; they do not replace it as the default styling source.

This specification supersedes the authored-grid and persistent-shell portions
of `2026-08-13-stitch-home-shell-design.md` and `docs/ARCHITECTURE.md`:

- no top navbar;
- no navigation sidebar;
- no authored-versus-floating window distinction;
- no persistent Selected Work grid;
- no persistent `network.online` panel;
- no boot-time Player or Notes windows.

The approved career copy, presence contracts, shared typed project content,
project order, evidence rules, Astro/Preact ownership, and static fallbacks from
the earlier specs remain in force.

## 3. Approved desktop composition

The full viewport above the taskbar is the desktop. There is no inner framed
canvas and no artificial box constraining windows. The approved Stitch image
fills this space as a fixed, cover-positioned background.

The initial `/` state is a **near-cold boot**:

- Identity is the only open window;
- desktop icons provide the main visible navigation;
- the taskbar is visible;
- closing Identity reveals a clean desktop.

Initial desktop icons, in priority order:

1. About Piero;
2. Projects;
3. Resume.pdf;
4. Contact;
5. Network.

The icons should closely inherit the compact native-desktop proportions and
selection behavior of the Win98 reference while using the portfolio's visual
tokens. Routable icons are semantic `<a href="...">` elements. JavaScript may
intercept them to open desktop apps; without JavaScript they navigate normally.

## 4. OS-language rule

All operating-system chrome uses sentence case: the first word begins with an
uppercase letter and the remaining letters are lowercase except for proper
nouns, filenames, and conventional acronyms.

Examples:

- `Piero OS`, not `PIERO_OS` or `piero_os`;
- `Start`, not `START`;
- `Selected work`, not `SELECTED WORK` or `selected.work`;
- `Network online`, not `NETWORK.ONLINE`;
- `Now playing`, not `NOW PLAYING`;
- `About Piero`, `Projects`, `Resume.pdf`, `Contact`.

This rule applies to titlebars, Start, Start-menu entries, desktop-icon labels,
taskbar labels, system utilities, control labels, and accessible names owned by
the shell. It does not constrain editorial content rendered inside windows.
Project names and real filenames retain their canonical capitalization.

## 5. Unified app registry

A centralized typed registry defines every desktop app. It is the only source
for shell-facing metadata such as:

- stable app ID;
- sentence-case shell title;
- icon;
- optional route;
- app kind and renderer;
- singleton behavior;
- default bounds;
- minimum size;
- mobile presentation mode;
- whether it appears on the desktop and/or in Start.

Identity and About Piero are distinct registered apps. `identity` is the concise
home hero opened by the `/` near-cold preset. `about` is the fuller professional
and personal profile associated with `/about`. They may consume the same typed
identity source, but have separate IDs, titles, bounds, content renderers, and
singleton state. Activating About never repurposes or silently focuses Identity.

The registry also includes Selected Work, Resume, Contact, Network, Now
Playing, Notes, Privacy, and project cases. Project windows may be generated
from the canonical typed project collection rather than duplicated manually.

A separate boot preset declares which registered apps begin open and their
initial arrangement. The near-cold preset contains only Identity. This keeps a
future cold-boot experiment or alternate composition independent from reducer
logic.

## 6. Unified window state

Every interactive surface with window chrome uses the same `Window` component
and reducer state. Identity, About Piero, Selected Work, Resume, Contact,
Privacy, Network, Now Playing, Notes, and every implemented project case are
independent windows.

Each window state contains at least:

- open/minimized/maximized state;
- active/focused state and z-index;
- current bounds;
- restore bounds;
- app ID and, when needed, a project slug.

The `authored` and `floating` placements are removed. Every created window has
real numeric bounds from the beginning, including Identity at boot.

Opening or focusing one app must not implicitly open, restore, or focus another
app. In particular:

- opening a project does not open Selected Work;
- opening Selected Work does not open Identity;
- opening a direct route does not recreate the home boot preset.

Reducer-level reset support remains, but no Reset Desktop control is surfaced
until persistence or a concrete recovery UX requires it.

## 7. Drag, resize, maximize, and restore

### 7.1 Drag

Desktop windows may move across the full workspace above the taskbar. This is
not an inner-box layout. A window may move partially beyond an edge, but enough
of its titlebar must remain reachable to focus and recover it. The geometry
authority is the measured bounding rectangle of the desktop surface, excluding
the taskbar. Window bounds use coordinates relative to that rectangle, not
`window.innerWidth` or document coordinates.

Horizontal clamping keeps at least the titlebar controls plus a small grip area
inside the workspace. Vertical clamping keeps the complete titlebar inside the
workspace. The exact recovery inset is a shared geometry constant, not a
per-component magic number.

Dragging begins only from the titlebar and must not steal pointer interaction
from window controls or content. Pointer capture handles movement outside the
titlebar during an active drag.

### 7.2 Resize

Windows resize freely from all four edges and four corners, following the native
behavior of the Win98 reference. Resize handles are real interaction zones
rather than a CSS-only `resize: both` affordance. Pointer capture keeps an
active resize coherent after the pointer leaves the handle, and pointer up or
cancel commits the last valid bounds and releases capture.

Right/bottom resize changes width/height. Left/top resize changes x/y together
with width/height so the opposite edge remains anchored. Corner resize combines
the applicable edge rules. All calculations occur in desktop-relative
coordinates and reducer bounds remain authoritative.

Each app declares sensible minimum dimensions. A user may enlarge a restored
window beyond the visible workspace, but left/top resize clamping must preserve
the titlebar recovery contract. Resize is disabled while maximized. Reducer
bounds are updated during the interaction so later drag, maximize, and restore
operations are deterministic.

### 7.3 Maximize and restore

Maximize always snapshots the current numeric bounds into `restoreBounds`
before occupying the measured desktop rectangle above the taskbar. Maximized
bounds track changes to that rectangle. Restore returns to the snapshot after
revalidating it against the current workspace.

This contract applies even when the window has never been dragged or resized.
Maximizing and restoring an untouched boot window must leave it movable and
resizable. Repeated maximize/restore cycles must not overwrite the original
restore bounds with maximized geometry.

### 7.4 Workspace changes

The desktop observes its own size. On viewport, taskbar, breakpoint, or
orientation changes, maximized windows adopt the new desktop rectangle.
Restored windows preserve their size when possible and revalidate position so
the required titlebar/control recovery area remains visible. Oversized restored
windows may remain oversized; they must not lose reachable window controls.

Crossing into mobile disables manipulation and presents the active route/app in
its compact mode. Returning to desktop revalidates the stored desktop bounds
rather than replacing them with mobile fullscreen geometry.

### 7.5 Mobile

Narrow/touch layouts do not reproduce freeform desktop manipulation. Apps use
fullscreen or near-fullscreen views, drag/resize is disabled, and close/back
behavior remains obvious. Core navigation and content remain accessible.

## 8. Route and history synchronization

Astro remains the canonical document and routing layer. Preact progressively
enhances links into desktop launches.

The desktop-origin route targets are:

- initial hydration at `/` applies the near-cold preset with only Identity open;
- an owned same-document `/` history target opens/focuses Identity while
  preserving unrelated windows; it does not replay the boot preset;
- `/work` targets only Selected Work;
- `/work/[slug]` targets only that project;
- `/about`, `/resume`, `/contact`, and `/privacy` target only their corresponding
  routable app.

These rules apply to routes reached inside the already-hydrated desktop and to
owned same-document history entries. A direct request, reload, external-referrer
navigation, or other cross-document visit to `/work`, `/work/[slug]`, `/about`,
`/resume`, `/contact`, or `/privacy` renders the standalone Astro document and
does not bootstrap a desktop session. The static document is useful without
JavaScript and is the canonical deep-link experience.

In an already-running desktop, activating a routable link opens or focuses only
the target app and pushes its route. Desktop-only utilities use `<button>` and
do not change the URL.

Browser Back/Forward applies the route target by opening/focusing the relevant
app without closing unrelated windows or replaying the boot preset. Closing a
routable window represented by the current owned entry returns to the previous
owned in-desktop route. If there is no safe owned entry, it replaces the URL
with `/` without replaying the near-cold preset. Closing never invents a hidden
dependency on Identity or Selected Work.

Opening, restoring, or applying an owned `popstate` focuses the activated
window heading. Minimizing moves DOM focus to that window's taskbar button.
Closing returns focus to the launcher that opened it when that launcher remains
available; otherwise focus moves to the highest-z visible window heading, then
to Start when no window is visible. Closing or minimizing the active window
sets the reducer's active window to the highest-z open, non-minimized window;
if none exists, `activeId` becomes null. These fallbacks are deterministic and
covered at reducer and browser level.

Static pages and desktop windows consume the same typed content sources. No
career or project copy is duplicated merely to support the desktop view.

## 9. Start, taskbar, and navigation

Start is the only persistent navigation control. Its button includes the goat
beside `Piero OS`. The menu exposes:

- About Piero;
- Projects;
- Resume;
- Contact;
- Network;
- Now playing;
- Notes;
- Privacy.

Routable entries are semantic links; desktop-only utilities are buttons. The
menu supports keyboard navigation, visible focus, Escape dismissal, and focus
return to the Start button.

The taskbar contains:

- the goat and `Piero OS` Start button;
- one task button per open window;
- a local live clock at the trailing edge.

`SYSTEM_READY` and the persistent Privacy taskbar link are removed. Privacy is
available through Start. The clock must not introduce hydration mismatch and
should update at a minute boundary or similarly low-cost interval.

## 10. Window surfaces

Selected Work is a real resizable window. It presents the approved order:

1. Preppie;
2. Cimax Modernization;
3. Koba;
4. DM2Text;
5. Sendo.

Trama, Aeris, UrbanLens, and Brumaire remain prominent in the broader Work
surface with their approved release/prototype labels. Records use the shared
typed project source. Only records backed by a canonical `ProjectCase` entry
render as routable semantic links and registered project windows. A selected
record whose public case is not implemented in this slice remains a truthful
non-link archive row until its evidence-backed route exists; the shell must not
invent a destination or omit the record.

Network is a real window containing the normalized GitHub snapshot. Now Playing
and Notes are also normal registered windows. Spotify and GitHub failures must
render honest loading/unavailable content without affecting window mechanics.

Only the outer interactive surface has window chrome. Cards, evidence records,
and project sections inside a window must not use fake minimize/maximize/close
controls.

## 11. Background and visual primitives

The approved Stitch background URL is rendered by a fixed pseudo-element or
equivalent dedicated layer with:

- `background-size: cover`;
- `background-position: center`;
- `background-attachment: fixed` or an equivalent fixed layer;
- contrast matching the requested `contrast(1.2)` treatment.

The filter must not be applied to `<body>` in a way that filters all child
content. Windows, typography, controls, images, and focus indicators remain
unfiltered and readable.

All changeable skin decisions live in named CSS custom properties and reusable
primitives, grouped by concern:

- surface and signal colors;
- border widths and bevel colors;
- titlebar states;
- controls and buttons;
- scrollbar parts;
- typography;
- taskbar and Start;
- selection and focus;
- shadows and z-index layers.

Buttons inside windows use a shared OS-button primitive derived from the
Win98 reference's raised, pressed, focused, and disabled states, recolored with
portfolio tokens. Global scrollbars use the same visual family, with WebKit
parts and the closest supported Firefox properties. Native semantics and clear
focus states remain mandatory.

This token organization is a deliberate experimentation seam: palette, border,
and bevel studies should require token changes rather than component rewrites.

## 12. Accessibility and performance

- Window controls and desktop-only launchers are real buttons.
- Routable launchers are real links.
- Every draggable/resizable app has non-pointer navigation and window controls.
- Active, selected, hover, pressed, and keyboard-focus states are distinct.
- Icon labels and titlebars remain readable against the textured background.
- Reduced-motion preferences are respected.
- Presence windows do not autoplay media or introduce initial iframes.
- The implementation uses browser pointer APIs and the existing Preact reducer;
  no drag, resize, animation, or global-state dependency is added.

## 13. Verification contract

Unit/reducer coverage must prove:

- near-cold boot contains only Identity;
- every registered app has a unique ID, renderer, default bounds, minimum size,
  launcher visibility metadata, and a unique route where applicable;
- all initial windows have numeric bounds derived from their registry entries;
- independent app/project opening;
- resize updates bounds and enforces minimums;
- maximize snapshots untouched bounds;
- restore returns to those bounds and preserves later movement;
- workspace resize revalidation and desktop/mobile round trips;
- deterministic active-window fallback;
- minimize/restore/focus and reset behavior.

Playwright coverage must prove:

- first-load desktop and desktop icons;
- Start menu, Privacy, and live clock;
- icon link navigation with JavaScript;
- a no-JavaScript click from `/` to `/work` using the actual Projects link;
- project launch without Identity or Selected Work side effects;
- direct `/work/[slug]` standalone Astro document;
- Back/Forward route synchronization;
- drag and titlebar recovery at workspace edges;
- one edge resize and one corner resize with pointer capture/release;
- minimum-size clamping and no resize while maximized;
- resize, maximize, and restore round-trip geometry;
- maximize/restore before any movement;
- minimize and taskbar restore;
- opener, heading, taskbar, Start/Escape, and Back/Forward focus behavior;
- Network, Selected Work, Player, and Notes as independent windows;
- desktop-to-mobile-to-desktop geometry and mobile core navigation without
  drag/resize.

The release gate runs Astro/TypeScript checks, the production build, and E2E
against the built output through `astro preview` or a static server over
`dist/`, not only the development server.

## 14. Non-goals

- Desktop-state persistence;
- a visible Reset Desktop command;
- literal Win98 palette or typography;
- changing project facts or career positioning;
- turning the Astro site into a client-only SPA;
- autoplay or visitor-facing Spotify authentication;
- adding a component, drag, resize, animation, or global-state library.
