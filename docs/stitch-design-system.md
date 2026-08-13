---
name: Digital Archive / Cybergrunge Portfolio
colors:
  surface: '#fbf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#454558'
  inverse-surface: '#30312d'
  inverse-on-surface: '#f3f0eb'
  outline: '#757589'
  outline-variant: '#c5c4db'
  surface-tint: '#343dff'
  primary: '#0001bb'
  on-primary: '#ffffff'
  primary-container: '#0000ff'
  on-primary-container: '#b3b7ff'
  inverse-primary: '#bec2ff'
  secondary: '#bc0100'
  on-secondary: '#ffffff'
  secondary-container: '#eb0000'
  on-secondary-container: '#fffbff'
  tertiary: '#063f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b5900'
  on-tertiary-container: '#28da00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bec2ff'
  on-primary-fixed: '#00006e'
  on-primary-fixed-variant: '#0000ef'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#930100'
  tertiary-fixed: '#79ff5b'
  tertiary-fixed-dim: '#2ae500'
  on-tertiary-fixed: '#022100'
  on-tertiary-fixed-variant: '#095300'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  headline-lg:
    fontFamily: Epilogue
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  body-base:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  metadata-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  system-note:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  panel-padding: 12px
---

# Approved Stitch Design System

This file is the canonical production visual specification.

If broader mood references, generated mockups, WIN98-template styling, or implementation preferences conflict with this document, this document wins unless the user explicitly approves a change.

## Brand & Style

The visual identity of the design system is rooted in the intersection of Computer Science and Psychology—viewing the portfolio as a "digital specimen" or an excavated archive. It balances the raw, unpolished energy of early internet aesthetics (MySpace, Windows 95) with the structured discipline of academic research.

The emotional response should be one of "systematic curiosity." It feels like a secure terminal that has been customized by a user who values functional metadata and underground subculture.

### Visual Pillars

- **Cybergrunge Minimalism:** 60% of the UI follows a strict, grid-based logic using bone whites and technical grays.
- **Controlled Maximalism:** 40% of the UI introduces "visual friction"—halftone textures, scanlines, and dithered image processing.
- **Digital Archive:** Information is presented as files, panels, and windowed instances rather than fluid modern sections.
- **Personal Emblem:** The goat emoji is used as a recurring "signature" or "seal of authenticity" on documents and components.

## Colors

The palette is a mix of organic "paper" tones and harsh electronic signals.

- **Primary Canvas:** Bone White (`#F2F0EB` / canonical surface tokens above) provides a physical-archive feel.
- **System Accents:** UI Blue (`#0000FF`) is used for classic hyperlinks and active window states, mimicking early browser defaults.
- **Critical Alerts:** Sharp Red (`#FF0000`) or Acid Green (`#39FF14`) are used sparingly for emphasis, status indicators, or system errors.
- **Legacy Grays:** Classic OS Gray (`#C0C0C0`) is reserved for structural panels, buttons, and window chrome.
- **Contrast:** Deep Slate (`#1A1A1A`) is used for primary text to ensure high legibility against bone and gray backgrounds.

Use the frontmatter color tokens as canonical implementation values. The prose values above describe their intended role.

## Typography

The type system creates a hierarchy between "Editorial" and "System Data."

- **Headings:** Epilogue provides a bold, distinctive weight for section titles, feeling both modern and slightly aggressive. Use heavy weights (700+) for a printed-poster effect.
- **Body Text:** Space Grotesk offers a geometric, technical feel that bridges readable prose and machine-like precision.
- **Metadata/Labels:** JetBrains Mono is used for technical notes, timestamps, tags, and small UI labels.
- **Styling Note:** Links should be underlined in primary UI Blue. Metadata may be prefixed with system-style prompts such as `[INFO]:` or `> root`.

Custom display fonts explored separately are not canonical yet.

## Layout & Spacing

The layout is a **Fixed Modular Grid** designed to look like a desktop environment or a complex dossier.

- **Modular Panels:** Content is housed in distinct boxes with visible borders.
- **Desktop Composition:** Windows may be staggered or overlap because the production implementation is a real desktop environment.
- **Visual Friction:** Avoid excessive whitespace. The design should feel dense but organized.
- **Desktop:** Multi-window environment.
- **Tablet:** Sequential or simplified multi-panel environment.
- **Mobile:** Windows collapse to fullscreen/near-fullscreen app views rather than freeform dragging.
- **Rhythm:** Use increments of 4px for padding and margins.

The production site does not need to preserve a literal 12-column static page grid when freeform windows are active.

## Elevation & Depth

Avoid soft ambient shadows.

Depth is communicated through structural layering and physical metaphors:

- **Stacked Windows:** Use 1px solid borders combined with a beveled look.
- **Bevel:** Top/left may use light borders; bottom/right darker borders to evoke legacy OS chrome.
- **Tonal Tiers:** Bone surfaces sit behind OS-gray or higher-tier active panels.
- **Backdrop Textures:** Halftone dot patterns or subtle scanline overlays may add controlled digital noise.
- **Z-Indexing:** Real window focus creates actual layering in production.

Avoid modern card shadows.

## Shapes

The shape language is strictly **Sharp (0px)**.

- **Hard Edges:** Buttons, panels, inputs, images, and windows use 0px corner radius.
- **Internal Borders:** Double-line borders may be used for primary callouts.
- **Geometric Accents:** 45-degree decorative corners/tabs may appear sparingly.

## Components

### Interactive Windows

Actual draggable/focusable windows include:
- title bar
- active/inactive state
- Minimize
- Maximize/Restore
- Close
- legacy/beveled chrome

### Nested Content

Nested cards, project rows, lists, documents, and folders do **not** need fake Min/Max/Close controls unless they are independently interactive windows.

This production rule supersedes the static-mockup convention of putting window controls on every card.

### Buttons

Beveled rectangles.

Idle:
- light top/left edge
- darker bottom/right edge

Active:
- invert or compress bevel
- shift content approximately 1px down/right

### Input Fields

Inset legacy-style bevel.

Use JetBrains Mono where the content is explicitly system/terminal-like.

### Chips / Tags

Terminal-flag treatment.

Example:
`[--tag-name]`

### Goat Emblem

Use the goat emoji as a subtle:
- stamp
- signature
- system emblem
- verification mark
- occasional bullet/icon

Tone should remain deadpan rather than meme-heavy.

### Image Treatment

Images may use:
- subtle grain
- dithering
- bitmask/low-bit effects
- halftone
- monochrome signal-color hover treatments

Do not apply visible grain to every image indiscriminately.

### Scrollbars

Where custom scrollbars are used, they should be:
- thick
- gray
- square
- legacy-OS inspired

Maintain usability and platform compatibility.

## Production Interpretation

This design system is the **skin** for a real desktop/window interaction model.

Do not interpret it as a static dashboard specification.

The final system should feel like:

> WIN98-like desktop mechanics wearing the approved Stitch visual language.

Behavior comes from the desktop architecture.

Appearance comes from this file.
