# ARCHITECTURE.md

## 1. Product architecture

`portfolio-v2` is a statically delivered Astro site with a Preact-powered personal desktop environment as its primary interactive homepage.

The production system is a synthesis of two references with clearly separated responsibilities:

```text
references/WIN98-template
        │
        └── behavioral reference
            windows / dragging / focus / taskbar / minimize / maximize

docs/stitch-design-system.md
        │
        └── canonical production skin
            palette / typography / spacing / surfaces / component styling

docs/design-direction.md
        │
        └── cultural + emotional direction
            early web / archive / Y2K / cybergrunge / personal authorship

docs/career/
        │
        └── factual professional truth

                         ↓

                  SPECIMEN_OS
             production portfolio
```

The product must not become a fork of either reference.

---

## 2. Stack

Canonical stack:

- Astro
- Preact
- TypeScript strict
- plain/scoped CSS
- CSS custom properties
- Astro Content Collections or typed local content
- Playwright
- pnpm

No SSR is required initially.

No database is required.

No global state library is required.

---

## 3. Rendering model

### Astro layer

Astro owns:
- route-level pages
- SEO/meta
- static project content
- direct links
- no-JS-compatible professional pages
- content generation

### Preact layer

A single primary Preact island owns desktop interaction:

```text
DesktopShell
├── DesktopSurface
├── DesktopIcons
├── WindowManager
│   └── Window instances
├── Taskbar
├── StartMenu
└── Apps
    ├── Identity
    ├── Work
    ├── Project
    ├── About
    ├── Resume
    ├── Notes/Writing
    ├── Contact/Network
    ├── NowPlaying
    └── optional Terminal
```

Do not hydrate static content unnecessarily.

---

## 4. Suggested source layout

```text
portfolio-v2/
├── AGENTS.md
├── ARCHITECTURE.md
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
│
├── docs/
│   ├── career/
│   ├── stitch-design-system.md
│   ├── design-direction.md
│   ├── interaction-spec.md        # optional next
│   └── content-model.md           # optional next
│
├── references/
│   ├── README.md
│   ├── stitch/
│   └── WIN98-template/
│
├── public/
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   └── textures/
│
├── src/
│   ├── content/
│   │   ├── projects/
│   │   └── writing/
│   ├── data/
│   ├── desktop/
│   │   ├── DesktopShell.tsx
│   │   ├── DesktopSurface.tsx
│   │   ├── DesktopIcons.tsx
│   │   ├── Taskbar.tsx
│   │   ├── StartMenu.tsx
│   │   ├── Window.tsx
│   │   ├── WindowManager.ts
│   │   ├── windowReducer.ts
│   │   ├── apps/
│   │   └── types.ts
│   ├── layouts/
│   ├── pages/
│   └── styles/
│       ├── tokens.css
│       ├── global.css
│       ├── desktop.css
│       └── textures.css
│
└── tests/
    └── e2e/
```

Do not create every file prematurely. This is a target shape.

---

## 5. Window model

Window behavior must be centralized and reusable.

Suggested state:

```ts
type WindowState = {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  bounds: Bounds;
  restoreBounds: Bounds | null;
};
```

Exact types may evolve.

Apps own content.

The window manager owns mechanics.

---

## 6. Window manager responsibilities

Centralize:

- register app/window
- open
- close
- focus
- z-index ordering
- minimize
- restore
- maximize
- move
- preserve a recoverable titlebar while allowing partial viewport overflow
- eight-direction resize with per-app minimum sizes
- adapt geometry when the measured workspace changes
- optional persistence
- reducer-level reset support

Do not duplicate these mechanics inside individual app components.

Use native Pointer Events for drag behavior unless a concrete limitation appears.

---

## 7. Behavioral reference: WIN98-template

`references/WIN98-template` is useful for understanding:

- focus model
- z-index incrementing
- draggable titlebars
- viewport constraints
- taskbar entries
- minimize/restore logic
- maximize/restore bounds
- Start menu behavior
- desktop icon behavior

Production code should reimplement these ideas cleanly in TypeScript/Preact.

Do not:
- import the reference runtime
- preserve stock visual CSS
- preserve old globals/DOM scripting architecture
- carry over unrelated demo apps

---

## 8. Canonical skin: Stitch

`docs/stitch-design-system.md` defines the production visual system.

The desktop/window implementation must be skinned using those tokens and rules.

Important:
- Win98 determines behavior
- Stitch determines appearance

If stock Win98 CSS conflicts with Stitch, replace the stock style.

### Desktop visual authority

The approved desktop is a scoped, reference-first exception: its background,
high-contrast composition, goat signature, window proportions, and surface
relationships follow `references/stitch/code.html` more literally than the
broader paper-based system. The exception applies only to `/` and its desktop
overlays. Static content routes continue to use the shared production design
system, and the exported reference remains read-only inspiration rather than a
runtime dependency.

### Unified native desktop placement

Every app uses the same floating `Window` primitive and starts from numeric
bounds supplied by the typed app registry. There is no authored-versus-floating
state and no persistent navbar, sidebar, Selected Work panel, Network panel, or
utility slot. Drag, eight-direction resize, focus, minimize, maximize, and
restore belong to the window manager. Desktop-only utilities change desktop
state only and never write browser history.

---

## 9. First-load desktop

The homepage itself is the hero.

The approved near-cold initial desktop state is:

- Identity window open and dominant
- desktop icons for About Piero, Projects, Resume, Contact, and Network
- taskbar visible
- enough visible desktop background to communicate spatial freedom

Do not open every app at boot.

The first state is sparse and calm. Now Playing, Notes, Network, Selected Work,
and project cases open independently through their launchers.

Exploration may become denser as the user opens and overlaps windows.

---

## 10. App registry

Use one centralized typed app registry as the source of truth for desktop apps.

Conceptually:

```ts
type AppDefinition = {
  id: AppId;
  title: string;
  icon: DesktopIcon;
  kind: AppKind;
  route?: string;
  defaultBounds: Bounds;
  minSize: Size;
  mobileMode: "fullscreen";
  showOnDesktop: boolean;
  showInStart: boolean;
};
```

All registered windows are singletons. The registry defines routable and
desktop-only apps, labels, launch surfaces, initial geometry, minimum geometry,
and renderer kind. The near-cold boot preset contains only `identity`.

Avoid scattered hardcoded title/path/default-size maps.

---

## 11. Routes and deep links

Core portfolio content must exist as normal routes:

```text
/
/work
/work/[slug]
/about
/resume
/contact
/notes
```

Routable launchers are semantic links. With JavaScript, the desktop intercepts
eligible same-origin navigation, opens or focuses exactly the target app, and
uses browser history. Without JavaScript, the same links resolve to useful
Astro documents. Desktop-only utilities are buttons and never mutate the URL.

Potential behavior:

```text
Desktop: open Koba
→ project window opens
→ URL becomes /work/koba
→ Identity and Selected Work are unchanged

Direct visit: /work/koba
→ full project page renders
→ if returning to desktop mode, relevant app may open
```

Do not build a fragile custom router when browser routing is enough.

---

## 12. Content architecture

Facts come from `docs/career/`.

Production content should be normalized into typed project/experience models.

Example project model:

```ts
type Project = {
  slug: string;
  name: string;
  summary: string;
  role?: string;
  technologies: string[];
  status?: string;
  featured?: boolean;
  cover?: string;

  links: {
    source?: string;
    live?: string;
    writeup?: string;
  };

  evidence?: string[];
};
```

Do not use Stitch placeholder projects as production data.

---

## 13. Styling architecture

Create canonical design tokens from `docs/stitch-design-system.md`.

Suggested token categories:

```css
:root {
  /* surfaces */
  --surface: ...;
  --surface-dim: ...;
  --surface-container: ...;
  --surface-container-high: ...;

  /* content */
  --on-surface: ...;
  --on-surface-variant: ...;

  /* signals */
  --primary: ...;
  --secondary: ...;
  --tertiary: ...;

  /* legacy UI */
  --legacy-gray: #c0c0c0;
  --border-light: #ffffff;
  --border-mid: #808080;
  --border-dark: #1a1a1a;

  /* typography */
  --font-display: ...;
  --font-body: ...;
  --font-mono: ...;

  /* spacing */
  --unit: 4px;
  --gutter: 16px;
  --margin: 24px;
  --panel-padding: 12px;
}
```

Avoid styling directly from the WIN98-template variables.

---

## 14. Real window chrome vs nested content

Only actual interactive windows use:
- titlebar
- minimize button
- maximize button
- close button
- drag surface
- active/inactive window state

Nested project cards and documents should not pretend to be windows unless they are actually independently movable/focusable.

This preserves interaction truth.

---

## 15. Texture strategy

Use texture as controlled visual friction.

Prefer:
- small tiled halftone/noise assets
- preprocessed dithered images
- CSS scanline patterns
- compressed low-resolution thumbnails
- limited hover transformations

Avoid:
- giant full-screen PNG grain overlays
- multi-megabyte wallpapers
- runtime canvas noise
- expensive shaders
- large video backgrounds

---

## 16. Fonts

Initial canonical system:
- Epilogue — headings
- Space Grotesk — body
- JetBrains Mono — metadata/system

Custom experimental fonts can be evaluated later.

Do not delay core implementation for font experiments.

---

## 17. Performance architecture

Initial load should contain only what is required to show:
- desktop
- taskbar
- icons
- identity window
- minimal supporting status UI

Lazy-load:
- Terminal
- rich project detail app
- resume viewer if heavy
- music functionality
- optional experiments

Avoid initial:
- iframes
- embeds
- syntax highlighters
- animation runtimes
- large icon packs

---

## 18. Mobile architecture

At narrow breakpoints:

- desktop icons may become app launcher rows/grid
- windows become fullscreen/near-fullscreen
- freeform drag/resize is disabled
- taskbar may simplify
- Close/Back remains obvious
- same content components should be reused

Do not maintain a second unrelated site.

---

## 19. Accessibility architecture

Window UI:
- controls are buttons
- title is programmatically understandable
- focus states remain visible
- closing should return focus sensibly when practical
- keyboard users can reach core apps
- double-click is optional enhancement
- essential functions work with single click / keyboard

Visual retro styling does not reduce accessibility requirements.

---

## 20. Persistence

Optional enhancement only.

Possible:
- window positions
- open apps
- desktop arrangement
- theme

Persisted state should be versioned.

If invalid:
- reset cleanly

Always offer:
- `Reset Desktop`

Do not persist state before the designed first-run experience works well.

---

## 21. Testing

Critical Playwright coverage:

1. homepage boots
2. Identity is visible
3. Work opens
4. window focus/z-index changes correctly
5. drag updates position and stays in bounds
6. minimize/restore
7. maximize/restore
8. direct project route
9. mobile open/close/navigation behavior

Add visual regression only for a few valuable canonical states if needed later.

---

## 22. Failure mode

If Preact/desktop JavaScript fails:
- identity should still be visible in HTML where practical
- standard route navigation should still work
- project/resume/contact routes remain usable

The interactive desktop is an enhancement to a real site, not the only path to content.

---

## 23. Implementation phases

### Phase 1 — kernel
- Astro + Preact setup
- DesktopShell
- WindowManager
- Window
- Taskbar
- DesktopIcons
- StartMenu
- 2 dummy apps
- open/focus/drag/minimize/maximize/restore/close

### Phase 2 — identity
- real Identity app
- canonical first-load layout
- goat emblem
- direct links to core destinations

### Phase 3 — work
- Work app
- project data model
- project windows
- `/work/[slug]`

### Phase 4 — core content
- Resume
- About
- Contact
- Notes/Writing
- Now Playing

### Phase 5 — optional experiments
- Terminal
- boot sequence
- visitor-counter aesthetic
- audio enhancements
- custom cursor
- easter eggs

Do not implement Phase 5 before the core portfolio is fast and complete.
