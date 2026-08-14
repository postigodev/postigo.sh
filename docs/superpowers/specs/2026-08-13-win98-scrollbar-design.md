# Win98 Scrollbar Parity

## Goal

Make every WebKit scrollbar use the literal scrollbar treatment from `references/WIN98-template/style.css`. This patch must not change window behavior, navigation, content, layout, or unrelated styling.

## Root cause

The current production rules reinterpret the reference instead of reproducing it. They are scoped to `.window-body`, construct bevels from separate color tokens, add active and corner treatments, and use a custom hover token. Those differences produce a scrollbar that does not match the template.

## Design

- Replace the current `.window-body::-webkit-scrollbar*` rules with the reference's global `::-webkit-scrollbar*` block verbatim.
- Expose `--window-bg: #c0c0c0` and `--button-hover: #e0e0e0`, either directly or through aliases guaranteed to resolve to those exact values.
- Remove the custom thumb/button active state and custom scrollbar corner artwork.
- Do not add a standards-based `scrollbar-color` fallback: setting the thumb and track to the same gray overrides the WebKit appearance in Chromium and makes the thumb visually disappear.
- Let literal reference parity win: retain the reference's `width: 16px` and button `height: 16px`, but do not preserve the current extra scrollbar `height` declaration.

## Verification

- Open a desktop window whose content overflows vertically and compare its track, thumb, and buttons with the reference.
- Confirm the scrollbar rules are global rather than limited to window bodies.
- Assert at source level that the global block matches reference lines 535–557 and that no scoped `.window-body` scrollbar rules, scrollbar `:active` rules, or `::-webkit-scrollbar-corner` artwork remain.
- Run the production build and the relevant desktop interaction tests.
