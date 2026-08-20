---
name: "postigo.sh"
description: "A maintained personal web desktop for Piero Postigo Rocchetti's engineering identity, selected work, and public presence."
colors:
  cold-ink: "#eef3ff"
  slate-muted: "#b9c5da"
  midnight-panel: "rgba(19, 22, 30, .97)"
  raised-panel: "rgba(29, 33, 44, .97)"
  steel-line: "#5b6882"
  bright-steel: "#8495b7"
  action-blue: "#5c87ff"
  signal-cyan: "#74e9ff"
  acid-lime: "#b8ff2c"
  signal-violet: "#aa87ff"
  near-black: "#090b10"
  white: "#ffffff"
  deep-surface: "#151923"
  raised-surface: "#202633"
  link-blue: "#8ec6ff"
typography:
  hero:
    fontFamily: "Tahoma, Verdana, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-1px"
  document-display:
    fontFamily: "Tahoma, Verdana, Arial, sans-serif"
    fontSize: "clamp(2rem, 8vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Tahoma, Verdana, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.42
    letterSpacing: "normal"
  module-title:
    fontFamily: "Tahoma, Verdana, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.18px"
  metadata:
    fontFamily: "Courier New, monospace"
    fontSize: "8px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.04em"
  micro-label:
    fontFamily: "Tahoma, Verdana, Arial, sans-serif"
    fontSize: "7px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sharp: "0px"
  badge: "4px"
  control: "7px"
  media: "8px"
  module: "10px"
  header: "13px"
  circle: "999px"
spacing:
  hairline: "1px"
  micro: "4px"
  compact: "5px"
  sm: "8px"
  module-gap: "11px"
  column-gap: "13px"
  panel: "14px"
  document: "18px"
components:
  site-module:
    backgroundColor: "{colors.midnight-panel}"
    textColor: "{colors.cold-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.module}"
    padding: "{spacing.sm}"
  hero-action:
    backgroundColor: "{colors.acid-lime}"
    textColor: "{colors.near-black}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "4px 7px"
  presence-label:
    backgroundColor: "{colors.raised-surface}"
    textColor: "{colors.cold-ink}"
    typography: "{typography.micro-label}"
    rounded: "{rounded.badge}"
    padding: "2px 4px"
  document-panel:
    backgroundColor: "{colors.midnight-panel}"
    textColor: "{colors.cold-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.module}"
    padding: "{spacing.document}"
---

# Design System: postigo.sh

## Overview

**Creative North Star: "The Maintained Web Desktop"**

postigo.sh is a compact, authored corner of the web that makes professional evidence immediately legible. It borrows the density, directness, and material tactility of a cared-for personal homepage: dark blue desktop space, steel-framed modules, metallic titlebars, terse labels, tiny live-status surfaces, and a resident goat that makes the system unmistakably Piero's.

The world is preview-native, pinned from direction seed `e23380ff`. It rejects the generic portfolio hero-and-card stack without becoming a Windows clone: this is a normal, route-first site whose modules look like a personal desktop. The homepage is the densest expression; stable Work, About, Resume, Writings, Contact, and project-case routes use the same material and type system with more reading room. Project cases alone progressively enhance into real desktop windows; their mechanics are documented in `docs/ARCHITECTURE.md`.

**Key Characteristics:**

- Compact Tahoma-led information density with Courier New reserved for system metadata.
- Midnight blue-black surfaces, cool steel borders, and metallic gradient titlebars.
- Blue, cyan, violet, and acid-lime signals used as state and wayfinding accents.
- Hard-edged controls inside softly clipped modules; no modern pill-card language.
- The embedded goat is a recurring signature, not a separate branding campaign.
- Stable routes and honest public-presence states outrank decorative exploration.

## Colors

The palette is a cold desktop night punctuated by electrical blue, cyan, violet, and acid-lime signals.

### Primary

- **Action Blue** (`colors.action-blue`): interactive emphasis, hover fills, selection energy, and the strongest route-level cue.
- **Link Blue** (`colors.link-blue`): default links and informational accents that must remain calmer than active blue.

### Secondary

- **Signal Cyan** (`colors.signal-cyan`): live-presence, media, and technical-status accents.
- **Signal Violet** (`colors.signal-violet`): personal and archival accents, especially links and multicolor progress treatments.

### Tertiary

- **Acid Lime** (`colors.acid-lime`): primary action surfaces, focus outlines, availability signals, and selected text. Its rarity makes it decisive.

### Neutral

- **Near Black** (`colors.near-black`): deepest media wells and high-contrast control text.
- **Deep Surface** (`colors.deep-surface`) and **Raised Surface** (`colors.raised-surface`): structural page and nested data surfaces.
- **Midnight Panel** (`colors.midnight-panel`) and **Raised Panel** (`colors.raised-panel`): the paired endpoints of module gradients.
- **Cold Ink** (`colors.cold-ink`) and **White** (`colors.white`): primary text and maximum-emphasis text.
- **Slate Muted** (`colors.slate-muted`): explanatory copy, metadata, and unavailable states.
- **Steel Line** (`colors.steel-line`) and **Bright Steel** (`colors.bright-steel`): borders, separators, and beveled highlights.

**The Signal, Not Wash Rule.** Cyan, violet, and lime identify states or authored moments; they do not become full-screen decorative washes.

**The Honest State Rule.** Unavailable public data stays muted and explicit. Never recolor an unavailable state to resemble success or activity.

## Typography

**Display Font:** Tahoma (with Verdana and Arial fallbacks)

**Body Font:** Tahoma (with Verdana and Arial fallbacks)

**Label/Mono Font:** Courier New (with monospace fallback)

**Character:** The same compact system face carries identity, reading, and controls, giving the site the coherence of a maintained desktop. Courier New marks machine-like metadata and archival labels without turning the whole site into terminal cosplay.

### Hierarchy

- **Hero** (`typography.hero`): the compact homepage identity headline; heavy, compressed, and dominant within its module.
- **Document Display** (`typography.document-display`): large stable-route and case-study headings with responsive scale.
- **Body** (`typography.body`): dense homepage copy and control text. Long-form route copy opens to a maximum of 72 characters and uses a roomier line height.
- **Module Title** (`typography.module-title`): lowercase metallic titlebars with compact horizontal padding and a restrained tracking lift.
- **Metadata** (`typography.metadata`): tickers, case labels, statuses, and small archival annotations; uppercase only when the label is categorical.
- **Micro Label** (`typography.micro-label`): presence badges and other tiny, high-contrast state tags.

**The Tahoma First Rule.** New interface modules inherit Tahoma; do not introduce a display font to manufacture personality.

**The Mono Has a Job Rule.** Courier New is for metadata, timestamps, labels, and archival mechanics—not paragraphs or primary navigation.

## Layout

The homepage uses a centered canvas capped at 952px. Above the content, a three-part identity header uses 200px / fluid / 90px columns. The first viewport then resolves into a 160px navigation-profile rail, a fluid primary column, and a 226px live-presence rail with 13px gutters. The main column owns the dominant hero and selected work; side columns hold orientation and presence rather than competing calls to action.

Module interiors are dense: 8px is the default body inset, 11px the vertical module rhythm, and 13px the desktop column rhythm. Stable documents expand to 980–1040px canvases, 18px panel padding, readable lines up to 72ch, and evidence grids that privilege artifacts over ornament.

At 780px and below, the homepage becomes one ordered column. Desktop column wrappers disappear from layout, the hero goat returns to normal flow, project metadata stacks below titles, and evidence grids collapse to one column. This responsive transformation preserves reading order and direct routes; it does not reproduce freeform desktop behavior on touch screens.

**The First-Viewport Rule.** At desktop width, visitors must be able to identify Piero, see selected work, and locate public presence without opening or dragging anything.

**The Main Column Leads Rule.** Side rails provide context; the engineering identity, Work path, and evidence remain visually dominant.

## Elevation & Depth

Depth is structural and low-amplitude. One-pixel steel borders establish every material boundary; inset white and black highlights imply old-screen bevels, while short dark shadows lift headers, modules, and document panels just enough from the wallpaper. Tonal gradients and section-specific tints carry more depth than blur. There is no floating glass, backdrop blur, or soft modern shadow cloud.

### Shadow Vocabulary

- **Module Lift** (`inset 0 1px 0 rgba(255,255,255,.05), 0 5px 12px rgba(0,0,0,.18)`): default site modules and document navigation.
- **Header Lift** (`inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.34), 0 8px 18px rgba(0,0,0,.26)`): the identity header only.
- **Document Lift** (`0 7px 18px rgba(0,0,0,.24)`): stable-route reading panels.
- **Focus Edge** (`0 0 0 1px #060806`): a dark counter-edge behind the acid-lime focus outline.

**The Border Before Shadow Rule.** A component must read through its hard border and tonal surface before shadow is added.

## Shapes

The form language is compact and mechanical. Hero actions remain square, tiny state badges use a 4px corner, navigation controls use 6–7px corners, images and footers use 7–8px corners, and site modules use 10px corners. The identity header is the softest major surface at 13px. One-pixel borders are mandatory on material containers, controls, progress tracks, and media.

Circular geometry is reserved for the spinning playback disc. The goat remains a clipped square image with modest rounding; never crop it into a generic avatar circle. Titlebar ornament is truthful decoration only: modules may show the star and tiny status rail, but must not imply minimize, maximize, or close behavior.

**The No Fake Chrome Rule.** Metallic titlebars label ordinary modules; they never display inert window controls. Project cases are the sole exception: their titlebars carry real desktop-only drag, resize, maximize, and close behavior.

**The Radius Hierarchy Rule.** Large containers may be softly clipped, but actions and data rows stay hard and compact. Avoid pill-shaped navigation and rounded SaaS cards.

## Components

### Site Modules

The signature container is a framed information module with a metallic titlebar.

- **Shape:** softly clipped module (`rounded.module`) with a one-pixel steel border.
- **Background:** dark paired gradients, with restrained blue, violet, cyan, green, or neutral tint by content role.
- **Titlebar:** lowercase Tahoma label, star marker at left, and a tiny segmented status rail at right.
- **Depth:** Module Lift only; section color comes from border, titlebar, and subtle gradient—not glow.
- **Body:** compact 8px inset by default.

### Buttons and Action Links

- **Shape:** square primary action (`rounded.sharp`) with a one-pixel olive border.
- **Primary:** acid-lime field, near-black text, bold Tahoma, and compact 4px × 7px padding.
- **Hover:** switch to action-blue with white text; links may suppress underlines while the fill is active.
- **Focus:** a two-pixel acid-lime outline with a dark counter-edge and two-pixel offset.
- **Secondary:** metallic blue navigation controls with 6–7px corners; use these for routing, not for the dominant Work action.

### Navigation

Primary links are compact two-up metallic controls. Secondary route lists are plain stacked links with a blue chevron, while groups use small Courier New labels and dashed steel separators. On mobile, navigation remains semantic and moves into the single document order; do not hide the stable routes behind a gesture.

### Selected Work and Activity Rows

Rows are border-separated, not individually carded. Selected work uses a blue star, a strong project link, and right-aligned signal/status metadata; mobile stacks that metadata beneath the title. Activity rows are quieter single-column variants. Never wrap each row in an extra rounded container.

### Presence Labels

Presence labels are tiny uppercase badges with a metallic blue fill, cold ink, one-pixel steel border, and a 4px radius. They name the state; surrounding copy explains unavailable or fallback conditions in muted slate.

### GitHub Activity

The profile line pairs a presence label with the public handle. Ready-state metrics form a two-column grid with one-pixel separators and near-black cells; the unavailable state is a single honest sentence, never fake activity.

### Now Playing

The player pairs a 52px spinning disc with truncated track metadata and a four-pixel progress bar that runs violet → blue → cyan → lime. In unavailable state, the disc may remain as the presence motif while text explicitly names the endpoint failure. Motion must collapse under reduced-motion preferences.

### Stable Document Panels

Work, About, Resume, Writings, Contact, and case-study routes reuse the same dark panels and steel borders at a more readable scale. Large Tahoma headings, Courier New context labels, linear evidence rows, and unrounded artifact frames keep these pages connected to the homepage without forcing its three-column density everywhere.

## Do's and Don'ts

### Do:

- **Do** lead the first desktop viewport with identity, selected work, stable routes, and honest presence.
- **Do** use one-pixel borders, metallic gradients, and restrained inset highlights to make depth tactile.
- **Do** keep the goat embedded as a small resident signature in authored moments.
- **Do** keep interactions semantic, keyboard-visible, route-first, and reduced-motion safe.
- **Do** adapt content order and density at 780px; mobile is one direct column.
- **Do** preserve the preview-native direction selected from seed `e23380ff`.

### Don't:

- **Don't** regress to a generic centered hero followed by interchangeable portfolio cards.
- **Don't** turn the system into literal Windows cosplay, terminal cosplay, glassmorphism, neon cyberpunk, or rounded SaaS chrome.
- **Don't** add fake minimize, maximize, close, drag, or resize affordances to ordinary site modules.
- **Don't** invent posts, photos, activity, metrics, or professional claims to fill empty surfaces.
- **Don't** let cyan, violet, or lime become decorative full-screen washes.
- **Don't** apply project-window chrome or freeform mechanics to ordinary modules; only project cases are interactive windows.
