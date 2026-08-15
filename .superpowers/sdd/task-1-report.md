# Task 1 implementation report

## Status

Complete. The homepage now uses the approved preview-native static Astro surface and no longer mounts the deferred desktop/window-manager experience.

## Implementation

- Rebuilt `/` as a 12-module, static-first portfolio surface derived from `references/preview.html` while keeping all copy and links tied to typed local career/project data.
- Preserved the required project order: Preppie, Cimax, Koba, DM2Text, Sendo.
- Made the source document order match the mobile priority: hero, projects, writings, GitHub, profile/navigation/utilities. Desktop placement is handled with CSS grid ordering.
- Added honest empty states for writings and the photo album. Added `/writings` backed by an empty typed `getPublishedWritings()` collection.
- Kept GitHub and Spotify as small progressively enhanced widgets with explicit loading/unavailable states.
- Extracted the reference wallpaper and goat image into optimized local WebP assets; production does not depend on `references/`.
- Added the required direction contract to the production document, including seed `e23380ff` and the exact FINISH sentence.
- Added current semantic navigation, visible keyboard focus, reduced-motion behavior, responsive single-column layout, and non-duplicated accessible ticker text.
- Replaced the obsolete desktop-window E2E expectations with high-value tests for the new static surface, mobile order, direct routes, progressive enhancement, and reduced motion.
- Recorded the resulting visual system in `DESIGN.md` and `.impeccable/design.json` after an Impeccable finish review with a `ship` verdict.

## Files changed

- `DESIGN.md`
- `.impeccable/design.json`
- `public/images/site/wallpaper.webp`
- `public/images/site/goat-profile.webp`
- `src/components/DocumentNav.astro`
- `src/components/GitHubWidget.tsx`
- `src/components/NowPlayingWidget.tsx`
- `src/components/SiteModule.astro`
- `src/data/writings.ts`
- `src/data/writings.test.ts`
- `src/layouts/BaseLayout.astro`
- `src/pages/index.astro`
- `src/pages/writings/index.astro`
- `src/styles/global.css`
- `src/styles/scrollbarParity.test.ts`
- `tests/e2e/desktop.spec.ts` (removed; window behavior is deferred)
- `tests/e2e/home-shell.spec.ts`
- `tests/e2e/mobile.spec.ts`
- `tests/e2e/presence.spec.ts`
- `tests/e2e/routes.spec.ts`

## TDD and verification

- Red: `pnpm exec vitest run src/data/writings.test.ts` initially failed because `src/data/writings.ts` did not exist.
- Green: implemented the typed empty writings source and route.
- `pnpm check`: passed, 0 errors, 0 warnings, 0 hints.
- `pnpm test:unit`: passed, 14 files and 88 tests.
- `pnpm build`: passed, 13 static pages generated.
- `pnpm exec playwright test tests/e2e/home-shell.spec.ts tests/e2e/mobile.spec.ts tests/e2e/presence.spec.ts tests/e2e/routes.spec.ts`: passed, 16 tests in Chromium.
- In-app browser review: desktop and 380px mobile layouts rendered without browser errors or horizontal overflow.
- Impeccable detector: one transition finding was fixed; the remaining 3px spectrum stripe matches the binding reference.
- Impeccable finish review: `ship`.

## Commit

Included in the Task 1 implementation commit; the final commit hash is supplied in the parent handoff.

## Concerns and intentional deferrals

- Project-window interception and desktop window-manager behavior remain intentionally deferred to later tasks.
- Writings and photo-album content remain empty until verified source material exists.
- The user's pre-existing unstaged deletions under `docs/` were preserved and excluded from this task's commit.

## Review fixes

- Renamed the unsupported “latest activity” module to “selected work status.” It continues to show the known project statuses without asserting recency that the data model does not provide.
- Replaced the ticker's accessible name on a generic `div` with a semantic paragraph containing one screen-reader-only copy of the message. The animated visual duplicate remains hidden from assistive technology.
- Added direct `/writings` route coverage for its heading and honest empty state.

### Review-fix verification

- Red: `pnpm exec playwright test tests/e2e/home-shell.spec.ts tests/e2e/routes.spec.ts` produced the expected three homepage failures before the markup fix; the new `/writings` route test already passed against the existing route.
- Green: `pnpm exec playwright test tests/e2e/home-shell.spec.ts tests/e2e/routes.spec.ts tests/e2e/mobile.spec.ts` passed all 17 Chromium tests.
- `pnpm check` passed with 0 errors, 0 warnings, and 0 hints.
