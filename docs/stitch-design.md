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

## Brand & Style

The visual identity of the design system is rooted in the intersection of Computer Science and Psychology—viewing the portfolio as a "digital specimen" or an excavated archive. It balances the raw, unpolished energy of early internet aesthetics (MySpace, Windows 95) with the structured discipline of academic research.

The emotional response should be one of "systematic curiosity." It feels like a secure terminal that has been customized by a user who values functional metadata and underground subculture. 

**Visual Pillars:**
- **Cybergrunge Minimalism:** 60% of the UI follows a strict, grid-based logic using bone whites and technical grays.
- **Controlled Maximalism:** 40% of the UI introduces "visual friction"—halftone textures, scanlines, and dithered image processing.
- **Digital Archive:** Information is presented as files, panels, and windowed instances rather than fluid modern sections.
- **Personal Emblem:** The goat emoji is used as a recurring "signature" or "seal of authenticity" on documents and components.

## Colors

The palette is a mix of organic "paper" tones and harsh electronic signals. 

- **Primary Canvas:** Bone White (#F2F0EB) serves as the base, providing a "physical archive" feel.
- **System Accents:** UI Blue (#0000FF) is used for classic hyperlinks and active window states, mimicking early browser defaults.
- **Critical Alerts:** Sharp Red (#FF0000) or Acid Green (#39FF14) are used sparingly for emphasis, status indicators, or "system errors."
- **Legacy Grays:** Classic OS Gray (#C0C0C0) is reserved for structural panels, buttons, and "window" chrome.
- **Contrast:** Deep Slate (#1A1A1A) is used for all primary text to ensure high legibility against the bone and gray backgrounds.

## Typography

The type system creates a hierarchy between "Editorial" and "System Data."

- **Headings:** Epilogue provides a bold, distinctive weight for section titles, feeling both modern and slightly aggressive. Use heavy weights (700+) for a "printed poster" effect.
- **Body Text:** Space Grotesk offers a geometric, technical feel that bridges the gap between readable prose and machine-like precision.
- **Metadata/Labels:** JetBrains Mono is used for all technical notes, timestamps, tags, and small UI labels. This reinforces the "CS student" identity.
- **Styling Note:** Links should always be underlined in the primary UI Blue. Metadata should often be prefixed with system-style prompts (e.g., `[INFO]:` or `> root`).

## Layout & Spacing

The layout is a **Fixed Modular Grid** designed to look like a desktop environment or a complex dossier.

- **Modular Panels:** Content is housed in distinct boxes with visible borders. Use a 12-column grid, but allow panels to overlap slightly or align to "hard" edges.
- **Visual Friction:** Avoid excessive whitespace. The design should feel "dense" but organized—like a well-maintained terminal.
- **Breakpoints:**
  - **Desktop:** Multi-panel view. Windows can be staggered. 
  - **Tablet:** Sequential panels. Grids collapse to 2 columns.
  - **Mobile:** Single column "stack" of windows. Title bars of windows remain sticky to provide navigation context.
- **Rhythm:** Use increments of 4px for all padding and margins to maintain a tight, mathematical alignment.

## Elevation & Depth

This design system avoids soft ambient shadows. Depth is communicated through structural layering and physical metaphors:

- **Stacked Windows:** Use 1px solid borders (`#1A1A1A`) combined with a "beveled" look for panels. Top and left borders should be `#FFFFFF`, bottom and right should be `#808080` to mimic Windows 95 windows.
- **Tonal Tiers:** Background elements use the Bone White, while "active" windows or foreground elements use the OS Gray.
- **Backdrop Textures:** Use a halftone dot pattern or a 2px scanline overlay on the primary background to create "digital noise" and push the content panels forward.
- **Z-Indexing:** Visual interest is created by allowing certain elements (like the goat emblem or specific technical diagrams) to break out of their panels and sit on a higher Z-plane.

## Shapes

The shape language is strictly **Sharp (0px)**. 

- **Hard Edges:** All buttons, panels, inputs, and image containers must have 0px corner radii. 
- **Internal Borders:** Use double-line borders for primary call-outs to evoke "boxed" terminal text.
- **Geometric Accents:** Use 45-degree angled corners for decorative elements or "tabs" to add a subtle cyber-industrial feel without resorting to curves.

## Components

- **Windows/Cards:** Every card has a header bar with the `metadata-sm` font and a "Close" or "Min" icon (even if non-functional). This provides the "Digital Archive" vibe.
- **Buttons:** Styled as "beveled" rectangles. Idle: 2px border (light top/left, dark bottom/right). Active: Invert the bevel and shift content 1px down/right to simulate a physical click.
- **Input Fields:** Inset bevel with a white background. Use `JetBrains Mono` for typed text.
- **Chips/Tags:** Styled like terminal flags. Example: `[--tag-name]`.
- **The Goat Emblem:** Use the goat emoji as a "stamp" on the bottom-right of finished projects or as a custom bullet point in lists.
- **Image Treatment:** All images should have a subtle grain filter applied. Use a dithered "bitmask" effect for hover states, turning full-color images into monochromatic blue or red versions.
- **Scrollbars:** Custom thick, gray scrollbars with square "thumb" handles, mimicking legacy OS interfaces.