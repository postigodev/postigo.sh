# AGENTS.md

## Mission

Build `portfolio-v2` as a fast, professional portfolio presented as a custom personal desktop environment.

The production site should combine:

- **behavioral model:** classic desktop/window mechanics inspired by `references/WIN98-template`
- **visual skin:** the approved Stitch design system in `docs/stitch-design-system.md`
- **cultural texture:** early personal web, MySpace, Y2K, archival print, cybergrunge
- **professional truth:** verified content from `docs/career/`

This is not a Windows 98 clone and not a generic retro developer portfolio.

---

## Canonical stack

Use:

- Astro
- Preact
- TypeScript (`strict`)
- plain CSS / scoped CSS / CSS custom properties
- Astro Content Collections or typed local data for portfolio content
- Playwright for critical interaction tests
- pnpm

Do not replace this stack without explicit approval.

Do not add Tailwind, a component library, animation framework, or global state library unless a concrete need is demonstrated first.

---

## Source-of-truth hierarchy

When sources conflict, use this order:

1. `docs/career/`
   - factual truth
   - roles, dates, projects, metrics, claims, education, evidence

2. `docs/stitch-design-system.md`
   - canonical production visual system
   - colors, typography, spacing, borders, surface logic, component skin

3. `ARCHITECTURE.md`
   - canonical technical architecture

4. `docs/design-direction.md`
   - mood, cultural references, intended emotional effect
   - subordinate to the Stitch design system

5. `references/stitch/`
   - visual/compositional reference only

6. `references/WIN98-template/`
   - behavior/interaction reference only

### Critical rule

If `docs/design-direction.md`, visual references, `WIN98-template` styling, or agent preference conflicts with `docs/stitch-design-system.md`, **the Stitch design system wins**.

Never invent professional facts.

---

## Reference policy

Everything in `references/` is read-only inspiration.

Do not:
- make production depend on reference files
- copy either reference wholesale
- modify reference files unless explicitly asked
- preserve reference naming just because it exists
- treat generated Stitch placeholder content as factual

Use:

### `references/WIN98-template`
For:
- draggable windows
- active-window focus
- z-index behavior
- minimize / maximize / restore
- taskbar
- desktop icons
- Start-style launcher
- viewport drag bounds

Not for:
- stock Win98 palette
- stock fonts
- stock visual styling

### `references/stitch`
For:
- visual composition
- component proportions
- archival/system tone
- goat placement
- blue active states
- surface relationships

The canonical implementation skin is still `docs/stitch-design-system.md`.

---

## Architecture rule

Astro owns:

- routes
- static HTML
- SEO/meta
- project detail pages
- about
- resume
- writing/notes
- contact
- no-JS accessible fallbacks where practical

Preact owns one primary interactive island:

`DesktopShell -> WindowManager -> Window / Taskbar / DesktopIcons / StartMenu / Apps`

Do not turn the entire site into a generic SPA.

---

## Desktop behavior

Desktop users should be able to:

- open windows/apps
- focus windows
- drag windows
- minimize
- restore
- maximize
- close
- use taskbar entries
- use desktop icons
- use Start-style navigation
- reach Work, Resume, About, and Contact quickly

The first desktop state must be intentionally composed.

Recommended first-load state:
- primary identity window open
- taskbar visible
- a small set of meaningful desktop icons
- optional small status/Now Playing widget
- enough empty desktop space to make dragging obvious

Do not boot with every app open.

---

## Mobile behavior

Do not reproduce freeform desktop dragging on mobile.

On narrow/touch screens:
- windows become fullscreen or near-fullscreen app views
- navigation remains direct
- drag/resize may be disabled
- Close/Back behavior remains obvious
- core content remains fully accessible

The desktop metaphor must never make mobile difficult to use.

---

## Routes

Core content must also exist at stable web routes.

Expected routes include:

- `/`
- `/work`
- `/work/[slug]`
- `/about`
- `/resume`
- `/notes` or `/writing`
- `/contact`

Opening a desktop app may update browser history where practical.

Direct route visits must remain useful without requiring desktop interaction.

---

## Content rules

Professional content should be data-driven.

Do not duplicate factual project/career text across many components.

Prefer typed content/data models for:
- projects
- experience
- writing
- links
- identity metadata

Mockup copy such as fake project names, locations, metrics, or roles must never leak into production.

When uncertain, consult `docs/career/`.

---

## Visual rules

The approved visual system is defined in `docs/stitch-design-system.md`.

High-level characteristics:
- bone / paper-like base surfaces
- technical grays
- classic OS gray
- harsh UI blue
- restrained red and acid-green signals
- sharp 0px corners
- beveled legacy-OS geometry
- halftone / dither / scanline friction
- modular archive/window presentation
- goat emblem as subtle recurring signature

Do not reinterpret this into:
- all-black cyberpunk
- neon hacker UI
- generic SaaS dark mode
- glassmorphism
- rounded modern cards
- vaporwave
- literal Win98 cosplay

---

## Window chrome rule

Only actual interactive windows get actual window chrome.

Do not put fake Min/Max/Close controls on every nested card.

Inside a real window, content may use:
- cards
- folders
- lists
- documents
- project entries
- tables
- archive rows

The interaction affordance must remain truthful.

---

## CSS rules

Prefer:
- CSS custom properties
- shared design tokens
- component-scoped styles where useful
- reusable primitives for bevels, borders, titlebars, buttons, selection states, texture

Avoid:
- Tailwind utility sprawl
- arbitrary one-off colors
- huge repeated inline style objects
- soft modern box-shadow-heavy design

Use the Stitch token values as the starting canonical palette.

---

## Fonts

The visual spec currently uses:
- Epilogue for large headings
- Space Grotesk for body text
- JetBrains Mono for metadata/system text

Experimental custom Y2K display fonts may be evaluated later if licensing allows.

Do not replace the canonical font system during initial implementation unless explicitly requested.

Do not redistribute font binaries outside the project.

---

## Performance

Performance is a product requirement.

Goals:
- minimal initial JavaScript
- static-first rendering
- no unnecessary hydration
- no initial iframes
- no autoplay audio/video
- lazy-load secondary apps/media
- compress imagery intentionally
- prefer small textures over huge background images
- use native browser APIs for drag/pointer behavior
- avoid large dependencies

The site may look old; it should feel technically fast.

Before adding any runtime dependency:
1. explain why browser/platform APIs are insufficient
2. estimate its role in the initial bundle
3. verify that it solves a real problem

---

## State

Prefer simple local state first.

Window state should cover:
- open
- minimized
- maximized
- active/focused
- z-index
- position
- size
- restore bounds

Use `useReducer` or focused hooks.

Do not add Redux/Zustand/etc. without demonstrated need.

Optional persistence may store:
- window positions
- open apps
- theme
- desktop arrangement

Always provide `Reset Desktop`.

---

## Accessibility

The visual metaphor is retro; the accessibility standard is contemporary.

Requirements:
- real `<button>` elements for window controls
- semantic links/headings/content
- keyboard access for primary actions
- visible focus states
- sufficient contrast
- drag is never the only interaction path
- single-click/keyboard path exists even if double-click is supported
- respect `prefers-reduced-motion`
- sensible focus return when windows close where practical

---

## Testing

Before declaring an implementation task done, run the relevant checks.

Baseline:
- Astro/TypeScript check
- production build
- relevant Playwright tests

Critical E2E flows:
1. initial desktop boot
2. identity visible
3. open app
4. focus + drag window
5. minimize + restore
6. maximize + restore
7. direct project route
8. mobile core navigation

Prefer a few high-value behavioral tests over superficial coverage.

---

## Token-efficiency rules

Be deliberate with context.

Before reading broadly:

1. inspect repo tree
2. read this file
3. read only the relevant canonical doc
4. use targeted search (`rg`, symbol/file search)
5. open only the files required for the task

Do not:
- recursively read all of `docs/career/`
- recursively read all of `references/`
- repeatedly reread files already understood
- dump full files after editing
- create duplicate planning docs
- install packages speculatively
- over-abstract before a repeated pattern exists

When inspecting references:
- read README / entry points first
- inspect only relevant interaction or visual files
- extract the pattern
- return to production code

Keep diffs focused.

---

## Change discipline

Before major changes:
- identify the relevant source of truth
- state the intended change briefly
- preserve unrelated working behavior

Do not redesign the whole site while implementing a local feature.

Do not replace approved visual decisions with personal defaults.

---

## Definition of done

A change is done when:

- requested behavior works
- canonical visual system is respected
- no unsupported professional claims were invented
- desktop/mobile behavior remains coherent
- accessibility is not knowingly regressed
- performance impact is reasonable
- relevant checks pass
- reference files remain untouched unless explicitly requested

Final agent report should be concise:

- what changed
- files changed
- checks run
- unresolved decisions / facts needing user input
