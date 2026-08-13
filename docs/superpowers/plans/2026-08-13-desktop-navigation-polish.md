# Desktop Navigation and Window Content Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make window closing independent from browser traversal, map About Piero to Identity, expose Player from desktop and Start, bound editorial content inside freely resizable windows, and reproduce the tokenized WIN98 Start/scrollbar skin.

**Architecture:** Astro remains the static route/document owner and the Preact desktop remains one progressive-enhancement island. The typed app registry defines singleton apps, launcher visibility, Start grouping, and content-width policy; `DesktopShell` owns history coordination without treating close as navigation. Shared icon and content-shell primitives keep the Start menu, desktop shortcuts, and window bodies visually consistent without new dependencies.

**Tech Stack:** Astro, Preact, strict TypeScript, plain tokenized CSS, Vitest, Playwright, pnpm.

## Global Constraints

- Do not add LinkedIn endpoints, scraping, credentials, placeholder metrics, or static LinkedIn claims.
- Do not add runtime dependencies or an icon package.
- Preserve Astro routes and no-JS semantic links.
- Closing a window must never call `history.back()` or open another window.
- Browser Back/Forward must continue to open or focus explicit route targets.
- About Piero launches the existing Identity singleton; `/about` remains a standalone Astro document.
- Player is available from both the desktop and Start and remains a desktop-only utility.
- Windows retain unrestricted resize; only their inner content receives a maximum width.
- Start uses the approved vertical `Piero OS` rail, grouped icon rows, sentence case, and goat only on the taskbar Start button.
- Scrollbar dimensions are 16px and all colors come from shared OS tokens.
- Mobile keeps drag/resize disabled and must not gain horizontal document overflow.
- References remain read-only.

## File map

- `src/desktop/desktopRoute.ts` — pure owned-history creation and close replacement contract.
- `src/desktop/desktopRoute.test.ts` — route mapping and close-state unit tests.
- `src/desktop/types.ts` — app IDs plus `StartGroup` and `ContentWidth` metadata.
- `src/desktop/appRegistry.ts` — Identity launcher alias, Player visibility, Start grouping, and content-width policy.
- `src/desktop/appRegistry.test.ts` — registry invariants and launcher-policy tests.
- `src/desktop/DesktopShell.tsx` — close/history coordination and registry-driven rendering.
- `src/desktop/AppIcon.tsx` — one decorative pixel-style icon primitive shared by desktop and Start.
- `src/desktop/DesktopIcons.tsx` — semantic shortcuts using `AppIcon`.
- `src/desktop/StartMenu.tsx` — grouped vertical-rail Start structure using `AppIcon`.
- `src/desktop/Window.tsx` — inner content-width shell and scroll-corner marker.
- `src/styles/tokens.css` — content widths and complete scrollbar state tokens.
- `src/styles/global.css` — shared native-control rules; remove the old flat global scrollbar override.
- `src/styles/desktop.css` — Start, icons, window content shell, and detailed WebKit scrollbar skin.
- `tests/e2e/desktop.spec.ts` — close-chain, Back/Forward, About alias, Player, Start, content-width, and scrollbar behavior.
- `tests/e2e/home-shell.spec.ts` — near-cold launcher expectations.
- `tests/e2e/mobile.spec.ts` — Player/Start access and overflow behavior on compact layouts.
- `docs/ARCHITECTURE.md` — close/history separation, launcher aliases, and inner content-width policy.

---

### Task 1: Separate window close from browser traversal

**Files:**
- Modify: `src/desktop/desktopRoute.ts`
- Modify: `src/desktop/desktopRoute.test.ts`
- Modify: `src/desktop/DesktopShell.tsx`
- Modify: `tests/e2e/desktop.spec.ts`

**Interfaces:**
- Consumes: `DesktopHistoryState`, `AppId`, `rootHistoryState()`.
- Produces: `stateForClose(current: DesktopHistoryState, closedId: AppId): DesktopHistoryState | undefined`.

- [ ] **Step 1: Add the failing pure close-history tests**

Update the import and add these assertions to `src/desktop/desktopRoute.test.ts`:

```ts
import { isDesktopHistoryState, rootHistoryState, routeToTarget, stateForClose, stateForPush } from './desktopRoute';

it('replaces an owned active route with root without traversing', () => {
  const work = stateForPush(rootHistoryState(), routeToTarget('/work', registry)!);
  const preppie = stateForPush(work, routeToTarget('/work/preppie', registry)!);
  expect(stateForClose(preppie, 'project:preppie')).toEqual(rootHistoryState());
});

it('does not mutate history when closing a non-owner or utility', () => {
  const work = stateForPush(rootHistoryState(), routeToTarget('/work', registry)!);
  expect(stateForClose(work, 'identity')).toBeUndefined();
  expect(stateForClose(work, 'network')).toBeUndefined();
});
```

- [ ] **Step 2: Run the focused unit test and confirm failure**

Run: `pnpm exec vitest run src/desktop/desktopRoute.test.ts`

Expected: FAIL because `stateForClose` is not exported.

- [ ] **Step 3: Implement the pure close-state helper**

Add to `src/desktop/desktopRoute.ts`:

```ts
export function stateForClose(current: DesktopHistoryState, closedId: AppId): DesktopHistoryState | undefined {
  return current.appId === closedId ? rootHistoryState() : undefined;
}
```

- [ ] **Step 4: Run the focused unit test and confirm it passes**

Run: `pnpm exec vitest run src/desktop/desktopRoute.test.ts`

Expected: all desktop-route tests PASS.

- [ ] **Step 5: Add the failing production E2E reproduction**

Add to `tests/e2e/desktop.spec.ts`:

```ts
test('closing a routed chain never resurrects closed parent windows', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Projects' }).click();
  await workWindow(page).getByRole('link', { name: 'Open Preppie project' }).click();
  await page.getByRole('button', { name: 'Close Piero Postigo Rocchetti' }).click();
  await page.getByRole('button', { name: 'Close Selected work' }).click();
  await page.getByRole('button', { name: 'Close Preppie' }).click();

  await expect(page.getByRole('region', { name: 'Preppie' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Selected work' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: /Piero OS/ })).toBeFocused();
});
```

- [ ] **Step 6: Run only the reproduction and confirm the current bug**

Run: `pnpm exec playwright test tests/e2e/desktop.spec.ts -g "never resurrects"`

Expected: FAIL because closing Preppie calls `history.back()` and reopens Selected Work.

- [ ] **Step 7: Replace traversal in `DesktopShell.close`**

Import `stateForClose`, then replace the history branches in `close` with:

```ts
const replacement = stateForClose(historyState.current, id);
dispatch({ type: 'close', id });
if (replacement) {
  history.replaceState(replacement, '', replacement.route);
  historyState.current = replacement;
}
requestAnimationFrame(() => {
  if (fallback) {
    document.querySelector<HTMLElement>(`[data-window-id="${fallback}"] h2`)?.focus();
    return;
  }
  const opener = openers.current.get(id);
  if (opener?.isConnected) opener.focus();
  else document.querySelector<HTMLElement>('[data-start-button]')?.focus();
});
```

Do not call `applyTarget(replacement)`; replacing the URL must not open Identity.

- [ ] **Step 8: Verify close and explicit traversal independently**

Run: `pnpm exec playwright test tests/e2e/desktop.spec.ts -g "never resurrects|Back and Forward|desktop-only utility"`

Expected: all selected tests PASS; Back/Forward still focuses route targets and utility close keeps URL/history unchanged.

- [ ] **Step 9: Commit the routing fix**

```bash
git add src/desktop/desktopRoute.ts src/desktop/desktopRoute.test.ts src/desktop/DesktopShell.tsx tests/e2e/desktop.spec.ts
git commit -m "fix: decouple window close from route history"
```

---

### Task 2: Make registry launchers truthful and share app icons

**Files:**
- Create: `src/desktop/AppIcon.tsx`
- Modify: `src/desktop/types.ts`
- Modify: `src/desktop/appRegistry.ts`
- Modify: `src/desktop/appRegistry.test.ts`
- Modify: `src/desktop/desktopRoute.test.ts`
- Modify: `src/desktop/DesktopShell.tsx`
- Modify: `src/desktop/DesktopIcons.tsx`
- Modify: `src/desktop/StartMenu.tsx`
- Delete: `src/desktop/apps/AboutApp.tsx`
- Modify: `tests/e2e/home-shell.spec.ts`
- Modify: `tests/e2e/desktop.spec.ts`
- Modify: `tests/e2e/mobile.spec.ts`

**Interfaces:**
- Produces: `AppIconName`, `StartGroup = 'portfolio' | 'utilities' | 'policy'`, `ContentWidth = 'editorial' | 'case' | 'utility'`.
- Produces: `AppIcon({ name }: { name: AppIconName })`.
- Extends: `AppDefinition` with `startGroup?: StartGroup` and `contentWidth: ContentWidth`.

- [ ] **Step 1: Write failing registry policy tests**

Add to `src/desktop/appRegistry.test.ts`:

```ts
it('maps About Piero to Identity and exposes Player twice without duplicate apps', () => {
  const identity = registry.get('identity');
  expect(identity).toMatchObject({
    route: '/', showOnDesktop: true, showInStart: true,
    desktopLabel: 'About Piero', startLabel: 'About Piero', startGroup: 'portfolio',
  });
  expect(registry.has('about')).toBe(false);
  expect(registry.get('now-playing')).toMatchObject({
    showOnDesktop: true, showInStart: true,
    desktopLabel: 'Player', startLabel: 'Now playing', startGroup: 'utilities',
  });
});

it('assigns content width and a Start group to every exposed app', () => {
  for (const app of registry.values()) {
    expect(['editorial', 'case', 'utility']).toContain(app.contentWidth);
    if (app.showInStart) expect(['portfolio', 'utilities', 'policy']).toContain(app.startGroup);
  }
});
```

- [ ] **Step 2: Run registry tests and confirm failure**

Run: `pnpm exec vitest run src/desktop/appRegistry.test.ts`

Expected: FAIL because About remains a separate app and the new metadata does not exist.

- [ ] **Step 3: Define the registry metadata types**

In `src/desktop/types.ts`, define:

```ts
export type CoreAppId = 'identity' | 'work' | 'resume' | 'contact' | 'privacy' | 'network' | 'now-playing' | 'notes';
export type AppKind = CoreAppId | 'project';
export type AppIconName = 'user' | 'folder' | 'document' | 'mail' | 'network' | 'music' | 'notes' | 'lock' | 'project';
export type StartGroup = 'portfolio' | 'utilities' | 'policy';
export type ContentWidth = 'editorial' | 'case' | 'utility';
```

Change `AppDefinition.icon` to `AppIconName` and add:

```ts
startGroup?: StartGroup;
contentWidth: ContentWidth;
```

- [ ] **Step 4: Update core and project definitions**

In `src/desktop/appRegistry.ts`:

- remove the `about` definition;
- make `identity` visible on desktop and Start with `About Piero` labels and `startGroup: 'portfolio'`;
- set portfolio grouping on Work, Resume, and Contact;
- set utility grouping on Network, Now Playing, and Notes;
- set policy grouping on Privacy;
- make Now Playing visible on desktop with `desktopLabel: 'Player'`;
- assign `editorial` to Identity/Resume/Contact/Privacy, `case` to Work/projects, and `utility` to Network/Now Playing/Notes.

Use this Identity and Player shape exactly:

```ts
{ id: 'identity', title: 'Piero Postigo Rocchetti', icon: 'user', kind: 'identity', route: '/', defaultBounds: { x: 250, y: 72, width: 700, height: 470 }, minSize: { width: 420, height: 320 }, mobileMode: 'fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'About Piero', startLabel: 'About Piero', startGroup: 'portfolio', contentWidth: 'editorial' },
{ id: 'now-playing', title: 'Now playing', icon: 'music', kind: 'now-playing', defaultBounds: { x: 980, y: 70, width: 330, height: 220 }, minSize: { width: 300, height: 190 }, mobileMode: 'near-fullscreen', showOnDesktop: true, showInStart: true, desktopLabel: 'Player', startLabel: 'Now playing', startGroup: 'utilities', contentWidth: 'utility' },
```

- [ ] **Step 5: Remove the unused desktop About renderer**

Delete `src/desktop/apps/AboutApp.tsx`, remove its import, and remove the `case 'about'` branch from `DesktopShell.renderApp`. Do not change `src/pages/about.astro`.

Update `src/desktop/desktopRoute.test.ts` so the registry-driven desktop route
contract no longer expects an About app:

```ts
expect(routeToTarget('/about', registry)).toBeUndefined();
```

The static `/about` route is verified through the production build, not through
the desktop registry.

- [ ] **Step 6: Add one shared decorative icon component**

Create `src/desktop/AppIcon.tsx`:

```tsx
import type { AppIconName } from './types';

export default function AppIcon({ name }: { name: AppIconName }) {
  return <span class={`app-icon app-icon--${name}`} aria-hidden="true" />;
}
```

Replace the hardcoded glyph span in `DesktopIcons` with `<AppIcon name={definition.icon} />`.

- [ ] **Step 7: Structure Start into approved semantic groups**

In `StartMenu.tsx`, define:

```ts
const groups = [
  ['portfolio', 'Portfolio'],
  ['utilities', 'Utilities'],
  ['policy', 'Policy'],
] as const;
```

Render the menu body as:

```tsx
<nav ref={menuRef} class="start-menu" aria-label="Start menu" onKeyDown={handleKeyDown}>
  <div class="start-menu-rail" aria-hidden="true">Piero OS</div>
  <div class="start-menu-items">
    {groups.map(([group, label]) => {
      const items = definitions.filter((definition) => definition.startGroup === group);
      if (!items.length) return null;
      return <section class="start-menu-group" aria-label={label} key={group}>
        {items.map((definition) => {
          const content = <><AppIcon name={definition.icon} /><span>{definition.startLabel ?? definition.title}</span></>;
          return definition.route
            ? <a key={definition.id} href={definition.route} onClick={(event) => onNavigate(event, definition.route!)}>{content}</a>
            : <button key={definition.id} type="button" onClick={(event) => onLaunch(event, definition.id)}>{content}</button>;
        })}
      </section>;
    })}
  </div>
</nav>
```

Keep the existing Escape/focus effect and move it into a named `handleKeyDown` only if needed for readability.

- [ ] **Step 8: Add launcher E2E assertions before changing CSS**

Update the near-cold test to expect a `Player` button. Add to `tests/e2e/desktop.spec.ts`:

```ts
test('About Piero restores Identity and Player is available from desktop and Start', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Close Piero Postigo Rocchetti' }).click();
  await page.getByRole('link', { name: 'About Piero' }).click();
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('button', { name: 'Player' }).click();
  await expect(page.getByRole('region', { name: 'Now playing' })).toBeVisible();
  await page.getByRole('button', { name: 'Close Now playing' }).click();
  await page.getByRole('button', { name: /Piero OS/ }).click();
  await page.getByRole('button', { name: 'Now playing' }).click();
  await expect(page.getByRole('region', { name: 'Now playing' })).toBeVisible();
});
```

On mobile, assert Start still exposes and launches `Now playing`; do not require desktop icons to remain visible in compact mode.

- [ ] **Step 9: Run registry, desktop, and mobile launcher tests**

Run: `pnpm exec vitest run src/desktop/appRegistry.test.ts src/desktop/desktopRoute.test.ts && pnpm exec playwright test tests/e2e/home-shell.spec.ts tests/e2e/desktop.spec.ts tests/e2e/mobile.spec.ts -g "near-cold|About Piero|Player|mobile opens"`

Expected: all selected tests PASS.

- [ ] **Step 10: Commit launcher and icon contracts**

```bash
git add src/desktop/types.ts src/desktop/appRegistry.ts src/desktop/appRegistry.test.ts src/desktop/desktopRoute.test.ts src/desktop/AppIcon.tsx src/desktop/DesktopShell.tsx src/desktop/DesktopIcons.tsx src/desktop/StartMenu.tsx src/desktop/apps/AboutApp.tsx tests/e2e/home-shell.spec.ts tests/e2e/desktop.spec.ts tests/e2e/mobile.spec.ts
git commit -m "feat: unify desktop launchers and app icons"
```

---

### Task 3: Bound inner content without constraining windows

**Files:**
- Modify: `src/desktop/Window.tsx`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/desktop.css`
- Modify: `tests/e2e/desktop.spec.ts`
- Modify: `tests/e2e/mobile.spec.ts`

**Interfaces:**
- Consumes: `AppDefinition.contentWidth` from Task 2.
- Produces: `.window-content`, `.window-content--editorial`, `.window-content--case`, `.window-content--utility`, and `data-content-width`.

- [ ] **Step 1: Write the failing width-policy E2E test**

Add to `tests/e2e/desktop.spec.ts`:

```ts
test('wide windows bound editorial and case content but not utility content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  await page.getByRole('button', { name: 'Maximize Piero Postigo Rocchetti' }).click();
  const editorial = identity.locator('[data-content-width="editorial"]');
  expect((await editorial.boundingBox())?.width).toBeLessThanOrEqual(900);
  expect((await identity.boundingBox())?.width).toBeGreaterThan(900);

  await page.getByRole('button', { name: 'Player' }).click();
  const utility = page.getByRole('region', { name: 'Now playing' });
  await page.getByRole('button', { name: 'Maximize Now playing' }).click();
  const utilityContent = utility.locator('[data-content-width="utility"]');
  expect((await utilityContent.boundingBox())?.width).toBe((await utility.locator('.window-body').boundingBox())?.width);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `pnpm exec playwright test tests/e2e/desktop.spec.ts -g "bound editorial"`

Expected: FAIL because no content-width shell exists.

- [ ] **Step 3: Add tokenized width values**

Add to `src/styles/tokens.css`:

```css
--os-content-editorial-max: 900px;
--os-content-case-max: 1100px;
```

- [ ] **Step 4: Wrap app content inside the scroll client**

In `Window.tsx`, replace the direct body children with:

```tsx
<div class="window-body">
  <div class={`window-content window-content--${definition.contentWidth}`} data-content-width={definition.contentWidth}>
    {children}
  </div>
</div>
```

- [ ] **Step 5: Add centered width policies**

Add to `src/styles/desktop.css`:

```css
.window-content { width: 100%; min-height: 100%; margin-inline: auto; }
.window-content--editorial { max-width: var(--os-content-editorial-max); }
.window-content--case { max-width: var(--os-content-case-max); }
.window-content--utility { max-width: none; }
```

Do not place `max-width` on `.os-window` or `.window-body`.

- [ ] **Step 6: Lock compact overflow behavior**

Extend `tests/e2e/mobile.spec.ts`:

```ts
test('compact content shells stay within the viewport', async ({ page }) => {
  await page.goto('/');
  const content = page.locator('[data-content-width="editorial"]');
  expect((await content.boundingBox())?.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
```

- [ ] **Step 7: Run width and mobile tests**

Run: `pnpm exec playwright test tests/e2e/desktop.spec.ts tests/e2e/mobile.spec.ts -g "bound editorial|content shells"`

Expected: both tests PASS.

- [ ] **Step 8: Commit the content-width policy**

```bash
git add src/desktop/Window.tsx src/styles/tokens.css src/styles/desktop.css tests/e2e/desktop.spec.ts tests/e2e/mobile.spec.ts
git commit -m "style: bound content inside resizable windows"
```

---

### Task 4: Apply the approved Start and full WIN98 scrollbar skin

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/styles/desktop.css`
- Modify: `tests/e2e/desktop.spec.ts`

**Interfaces:**
- Consumes: `AppIcon`, grouped Start markup, `.window-body`, OS bevel tokens.
- Produces: tokenized `.start-menu-rail`, grouped Start rows, `.app-icon`, detailed WebKit scrollbar track/thumb/button/corner rules.

- [ ] **Step 1: Add failing structural and computed-style assertions**

Extend the Start test in `tests/e2e/desktop.spec.ts`:

```ts
await expect(page.locator('.start-menu-rail')).toHaveText('Piero OS');
await expect(page.locator('.start-menu-group')).toHaveCount(3);
await expect(page.locator('.start-menu .app-icon')).toHaveCount(8);
```

Add a scrollbar contract test:

```ts
test('window clients expose the tokenized legacy scrollbar skin', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('region', { name: 'Piero Postigo Rocchetti' }).locator('.window-body');
  await expect(body).toHaveCSS('overflow', 'auto');
  expect(await body.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').width)).toBe('16px');
  const cornerBackground = await body.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar-corner').backgroundImage);
  expect(cornerBackground).toContain('linear-gradient');
});
```

- [ ] **Step 2: Run the selected E2E tests and confirm failure**

Run: `pnpm exec playwright test tests/e2e/desktop.spec.ts -g "Start exposes|legacy scrollbar"`

Expected: FAIL because Start has no rail/groups/icons and the corner has no diagonal skin.

- [ ] **Step 3: Extend tokens for scrollbar states**

Add to `src/styles/tokens.css`:

```css
--os-scrollbar-size: 16px;
--os-scrollbar-track: var(--os-control-bg);
--os-scrollbar-face: var(--os-control-bg);
--os-scrollbar-hover: var(--surface-dim);
--os-scrollbar-grip: var(--os-bevel-mid);
```

- [ ] **Step 4: Remove the old flat global WebKit rules**

From `src/styles/global.css`, remove the global `::-webkit-scrollbar*` block. Keep a standards fallback:

```css
* {
  scrollbar-color: var(--os-scrollbar-face) var(--os-scrollbar-track);
  scrollbar-width: auto;
}
```

This prevents static Astro documents from receiving fake window-corner styling while keeping tokenized Firefox colors.

- [ ] **Step 5: Skin the shared app icons**

Move the existing `.desktop-icon-glyph*` visual rules to `.app-icon*`, preserving the authored glyph content for all nine icon names. Desktop shortcuts should size `.app-icon`; Start rows should reuse it at 24x24 without duplicating glyph content.

- [ ] **Step 6: Implement the vertical-rail Start skin**

Replace the current Start rules with:

```css
.start-menu {
  position: fixed; z-index: var(--os-layer-start); left: 4px; bottom: var(--os-taskbar-height);
  display: grid; grid-template-columns: 34px minmax(210px, 250px); padding: 2px;
  background: var(--os-control-bg); color: var(--os-control-fg);
  border: var(--os-border-width) solid;
  border-color: var(--os-bevel-light) var(--os-bevel-dark) var(--os-bevel-dark) var(--os-bevel-light);
  box-shadow: 3px 3px 0 var(--black); text-transform: none;
}
.start-menu-rail {
  display: flex; align-items: flex-start; justify-content: center; padding: 8px 4px;
  color: var(--white); background: linear-gradient(0deg, var(--os-title-active), var(--os-title-inactive));
  font: 700 18px/1 var(--font-body); letter-spacing: .04em;
  writing-mode: vertical-rl; transform: rotate(180deg);
}
.start-menu-items { min-width: 0; padding: 2px 0; }
.start-menu-group + .start-menu-group {
  margin-top: 2px; padding-top: 3px;
  border-top: 1px solid var(--os-bevel-mid);
  box-shadow: inset 0 1px 0 var(--os-bevel-light);
}
.start-menu a, .start-menu button {
  display: flex; align-items: center; gap: 9px; width: 100%; min-height: 34px; padding: 4px 8px;
  border: 0; border-radius: 0; background: transparent; color: var(--os-control-fg);
  text-align: left; text-decoration: none;
}
.start-menu a:hover, .start-menu a:focus-visible,
.start-menu button:hover, .start-menu button:focus-visible {
  background: var(--os-selection); color: var(--white);
}
.start-menu .app-icon { width: 24px; height: 24px; flex: 0 0 24px; }
```

Review the existing compact media query in the same file and keep the two-column
rail/items structure within the viewport:

```css
@media (max-width: 768px) {
  .start-menu {
    left: 4px;
    right: 4px;
    width: auto;
    grid-template-columns: 30px minmax(0, 1fr);
  }
  .start-menu a, .start-menu button { min-height: 40px; }
}
```

- [ ] **Step 7: Implement the detailed window-client scrollbar**

Add to `src/styles/desktop.css`:

```css
.window-body::-webkit-scrollbar { width: var(--os-scrollbar-size); height: var(--os-scrollbar-size); }
.window-body::-webkit-scrollbar-track {
  background: var(--os-scrollbar-track);
  border: 1px solid;
  border-color: var(--os-bevel-dark) var(--os-bevel-light) var(--os-bevel-light) var(--os-bevel-dark);
}
.window-body::-webkit-scrollbar-thumb,
.window-body::-webkit-scrollbar-button {
  min-width: var(--os-scrollbar-size); min-height: var(--os-scrollbar-size);
  background: var(--os-scrollbar-face);
  border: 2px solid;
  border-color: var(--os-bevel-light) var(--os-bevel-dark) var(--os-bevel-dark) var(--os-bevel-light);
}
.window-body::-webkit-scrollbar-thumb:hover,
.window-body::-webkit-scrollbar-button:hover { background: var(--os-scrollbar-hover); }
.window-body::-webkit-scrollbar-thumb:active,
.window-body::-webkit-scrollbar-button:active {
  border-color: var(--os-bevel-dark) var(--os-bevel-light) var(--os-bevel-light) var(--os-bevel-dark);
}
.window-body::-webkit-scrollbar-corner {
  background-color: var(--os-scrollbar-face);
  background-image:
    linear-gradient(135deg, transparent 0 52%, var(--os-bevel-dark) 52% 58%, transparent 58%),
    linear-gradient(135deg, transparent 0 68%, var(--os-scrollbar-grip) 68% 74%, transparent 74%),
    linear-gradient(135deg, transparent 0 84%, var(--os-bevel-light) 84% 90%, transparent 90%);
  border: 1px solid var(--os-bevel-mid);
}
```

Do not change resize-handle positioning or pointer behavior.

- [ ] **Step 8: Run Start and scrollbar tests**

Run: `pnpm exec playwright test tests/e2e/desktop.spec.ts -g "Start exposes|legacy scrollbar|About Piero"`

Expected: all selected tests PASS in Chromium.

- [ ] **Step 9: Commit the OS skin**

```bash
git add src/styles/tokens.css src/styles/global.css src/styles/desktop.css tests/e2e/desktop.spec.ts
git commit -m "style: refine Start and window scrollbars"
```

---

### Task 5: Align architecture and run the production release gate

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Verify: all source, unit, functions, E2E, and production output.

**Interfaces:**
- Consumes: completed close/history, launcher, content-width, Start, and scrollbar contracts.
- Produces: current architecture documentation and release evidence.

- [ ] **Step 1: Update architecture contracts**

In `docs/ARCHITECTURE.md`, state explicitly:

```md
Closing a desktop window changes window state, not browser traversal. If the
closed singleton owns the current route, the current owned entry is replaced
with the root URL without applying the root app. Explicit Back/Forward remains
the only route-history action that opens a historical target.

Launcher labels may alias an existing singleton: About Piero targets Identity.
Window size is independent from inner content width; registry metadata selects
editorial, case, or utility content shells.
```

Document the vertical-rail Start grouping and tokenized 16px window-client scrollbar. Keep LinkedIn out of runtime/data documentation.

- [ ] **Step 2: Run unit tests**

Run: `pnpm test:unit`

Expected: all unit tests PASS.

- [ ] **Step 3: Run Astro diagnostics**

Run: `pnpm check`

Expected: 0 errors, 0 warnings, 0 hints.

- [ ] **Step 4: Build production output**

Run: `pnpm build`

Expected: static build completes and existing Astro routes, including `/about`, are emitted.

- [ ] **Step 5: Run function tests**

Run: `pnpm test:functions`

Expected: all GitHub/Spotify function tests PASS; no LinkedIn function exists.

- [ ] **Step 6: Run the complete E2E suite against built production output**

Run: `pnpm test:e2e`

Expected: all Playwright tests PASS through the configured production server.

- [ ] **Step 7: Inspect production output at approved viewports**

Serve `dist/` using the same preview/static-server path as Playwright and inspect 1440x900, 1024x768, 768x1024, and 390x844. Confirm:

- Start has the vertical rail, grouped rows, shared icons, and keyboard focus;
- Player appears on desktop and in Start;
- wide Identity/Project windows center bounded content without limiting window resize;
- a deliberately overflowing window shows the 16px gray beveled scrollbar and diagonal corner from the supplied reference;
- scrollbars do not cover controls or resize handles;
- compact mode has no drag/resize handles or horizontal document overflow.

- [ ] **Step 8: Verify scope and repository hygiene**

Run:

```bash
git diff --check
git diff -- references
git status --short
```

Expected: no whitespace errors, no reference changes, and only the architecture document remains uncommitted.

- [ ] **Step 9: Commit architecture alignment**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: align desktop navigation architecture"
```

- [ ] **Step 10: Record final branch state**

Run:

```bash
git status --short --branch
git log --oneline -6
```

Expected: clean `piero/desktop-navigation-polish` branch with focused commits. Do not push, merge, or deploy without a separate user request.
