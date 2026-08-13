# Win98 Scrollbar Parity

## Goal

Make every WebKit scrollbar use the literal scrollbar treatment from `references/WIN98-template/style.css`. This patch must not change window behavior, navigation, content, layout, or unrelated styling.

## Root cause

The current production rules reinterpret the reference instead of reproducing it. They are scoped to `.window-body`, construct bevels from separate color tokens, add active and corner treatments, and use a custom hover token. Those differences produce a scrollbar that does not match the template.

## Design

- Replace the current `.window-body::-webkit-scrollbar*` rules with the reference's global `::-webkit-scrollbar*` block verbatim.
- Expose `--window-bg` as the classic control-gray surface and `--button-hover` as its hover surface so the copied rules resolve to the intended Win98 colors.
- Remove the custom thumb/button active state and custom scrollbar corner artwork.
- Keep Firefox's standards-based `scrollbar-color` fallback aligned with the same face and track colors; Firefox cannot reproduce WebKit scrollbar buttons.
- Preserve the existing 16px scrollbar size.

## Verification

- Open a desktop window whose content overflows vertically and compare its track, thumb, and buttons with the reference.
- Confirm the scrollbar rules are global rather than limited to window bodies.
- Run the production build and the relevant desktop interaction tests.

