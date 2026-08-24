# GitHub Canvas Fidelity Design

## Goal

Make the homepage GitHub activity widget visually match `references/github-overview/v2/index.html`, especially its legible low-resolution text, while preserving the live activity contract and accessible interaction.

## Design

- Render the visible interface into a 320×144 canvas and scale it with `image-rendering: pixelated`. Reuse the reference's coordinate system, font sizes, frames, texture, selection, and spacing without importing the reference at runtime.
- Project normalized entries with the existing presentation rules: repository basename on line one; commit trims terminal ` to`; pull request, issue, comment, and review trim terminal ` in`; release trims terminal ` for`; star uses `owner / phrase`; every other kind keeps its phrase. The detail frame renders `action / target / optional detail`, truncating only visually. Accessible labels always retain the complete original phrase, target, and detail; reference placeholder content is never used.
- Keep the canvas as one visible keyboard tab stop with a visible focus edge, instructions, and a polite live announcement of the selected activity. A synchronized offscreen list exposes every full activity label without adding competing tab stops. Transparent semantic anchors cover the visible profile header and detail frame so both remain normal links with matching focus outlines.
- Draw the exact calendar date for every row from `GitHubActivityEntry.createdAt` using visitor-local day boundaries and `DD MMM` English labels. Never suppress repeated dates and never derive a date from the relative-age label.
- Select index zero initially. Arrow Up/Down clamp at the first and last entry, Home/End select the first/last entry, and selection always remains within the six-row viewport. All navigation updates selection and viewport together without wrapping.
- Show six entries at once. When more exist, reserve a narrow vertical scrollbar inside the right edge of the list frame and move the age column left. Its top and bottom buttons use square Win98 light/shadow bevels and move one entry. The recessed track contains a proportional raised thumb: track clicks page by five rows and dragging the thumb maps to the viewport start while clamping selection into view. The scrollbar is absent when all entries fit.
- Row hit regions use the reference's six 15-pixel bands. Single click/tap selects; desktop double-click and Enter open the selected normalized URL in a new tab with `noopener`; the detail anchor also opens it. Wheel gestures move one row per 90 ms after a four-unit threshold. A dominant vertical touch swipe of at least 18 canvas pixels moves one row without disabling ordinary page scrolling.
- Generate the dirt texture with the reference seed `22491` into one 64×64 offscreen canvas and draw the same two fixed scanlines; screenshot output is deterministic.
- Keep intrinsic canvas dimensions at 320×144 and CSS dimensions at `width: 100%; height: auto; aspect-ratio: 320 / 144`. It scales up or down within the module with crisp/pixelated rendering and never introduces horizontal overflow below 320 CSS pixels.
- Empty and unavailable views retain the header and framed shell, draw the honest status centered in the list frame, announce the same status semantically, expose the profile header/detail links, and create no selectable event rows.
- Preserve the endpoint, payload schema, verified commit grouping, relative ages, ordering, empty/unavailable behavior, and profile/event links.

## Verification

- Unit tests cover every-row date presentation and six-row windowing.
- Playwright covers canvas sizing, selection/navigation, overflow controls, semantic links, empty/unavailable states, and mobile overflow.
- Compare desktop and mobile screenshots against the supplied reference for pixel scale, row density, dates, and scrollbar placement.
