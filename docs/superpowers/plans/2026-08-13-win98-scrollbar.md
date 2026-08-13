# Win98 Scrollbar Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the interpreted production scrollbar with the literal global WebKit scrollbar treatment from the Win98 reference.

**Architecture:** Keep scrollbar styling in the existing global desktop stylesheet and expose the two legacy variable names in the shared token layer. Add a source-parity unit test that compares the production block to the read-only reference and rejects the scoped and embellished rules that caused the mismatch.

**Tech Stack:** CSS custom properties, Vitest, Node.js filesystem APIs, pnpm

## Global Constraints

- Change only scrollbar styling, its two required color aliases, its focused parity test, and this plan.
- `references/WIN98-template/style.css` remains read-only.
- The production WebKit block must match reference lines 535–557 after normalizing line endings.
- `--window-bg` resolves to exactly `#c0c0c0` and `--button-hover` resolves to exactly `#e0e0e0`.
- Do not retain scoped `.window-body` scrollbar selectors, scrollbar `:active` rules, custom corner artwork, or an extra horizontal scrollbar `height` declaration.

---

### Task 1: Enforce and implement literal scrollbar parity

**Files:**
- Create: `src/styles/scrollbarParity.test.ts`
- Modify: `src/styles/tokens.css:1-49`
- Modify: `src/styles/desktop.css:47-60`
- Modify: `src/styles/global.css:27`
- Modify: `tests/e2e/desktop.spec.ts:159-166`

**Interfaces:**
- Consumes: the canonical scrollbar block in `references/WIN98-template/style.css` and the production CSS token layer.
- Produces: global WebKit scrollbar rules and a unit-test contract that prevents future visual reinterpretation.

- [ ] **Step 1: Write the failing source-parity test**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const normalizeLines = (value: string) => value.replace(/\r\n/g, '\n');
const referenceCss = normalizeLines(
  readFileSync(new URL('../../references/WIN98-template/style.css', import.meta.url), 'utf8'),
);
const desktopCss = normalizeLines(readFileSync(new URL('./desktop.css', import.meta.url), 'utf8'));
const tokensCss = normalizeLines(readFileSync(new URL('./tokens.css', import.meta.url), 'utf8'));

const referenceBlock = referenceCss.match(
  /::-webkit-scrollbar \{[\s\S]*?::-webkit-scrollbar-button:hover \{[\s\S]*?\n\}/,
)?.[0];

describe('Win98 scrollbar parity', () => {
  it('uses the literal global reference block without production embellishments', () => {
    expect(referenceBlock).toBeTruthy();
    expect(desktopCss).toContain(referenceBlock);
    expect(desktopCss).not.toContain('.window-body::-webkit-scrollbar');
    expect(desktopCss).not.toContain('::-webkit-scrollbar-thumb:active');
    expect(desktopCss).not.toContain('::-webkit-scrollbar-button:active');
    expect(desktopCss).not.toContain('::-webkit-scrollbar-corner');
  });

  it('pins the exact Win98 face and hover colors', () => {
    expect(tokensCss).toContain('--window-bg: #c0c0c0;');
    expect(tokensCss).toContain('--button-hover: #e0e0e0;');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails against the interpreted rules**

Run: `pnpm vitest run src/styles/scrollbarParity.test.ts`

Expected: FAIL because `desktop.css` does not contain the literal global reference block and the legacy color aliases do not exist.

- [ ] **Step 3: Add the exact color aliases and literal reference block**

Add to `:root` in `src/styles/tokens.css`:

```css
  --window-bg: #c0c0c0;
  --button-hover: #e0e0e0;
```

Replace the scrollbar rules in `src/styles/desktop.css` with the exact block from the reference:

```css
::-webkit-scrollbar {
    width: 16px;
}

::-webkit-scrollbar-track {
    background: var(--window-bg);
    border: 1px inset var(--window-bg);
}

::-webkit-scrollbar-thumb {
    background: var(--window-bg);
    border: 1px outset var(--window-bg);
}

::-webkit-scrollbar-button {
    background: var(--window-bg);
    border: 1px outset var(--window-bg);
    height: 16px;
}

::-webkit-scrollbar-button:hover {
    background: var(--button-hover);
}
```

Replace the Firefox fallback in `src/styles/global.css` with:

```css
* { scrollbar-color: var(--window-bg) var(--window-bg); scrollbar-width: auto; }
```

Remove the now-unused `--os-scrollbar-*` tokens from `src/styles/tokens.css`.

- [ ] **Step 4: Run the focused unit test**

Run: `pnpm vitest run src/styles/scrollbarParity.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Run static and production checks**

Run: `pnpm check && pnpm build`

Expected: Astro check reports zero errors and the production build completes successfully.

- [ ] **Step 6: Align and run the production scrollbar E2E**

Replace the obsolete custom-corner assertion in `tests/e2e/desktop.spec.ts` with computed-style assertions for the literal contract: 16px width, `rgb(192, 192, 192)` track and thumb, `inset` track, `outset` thumb, 16px button height, and `none` corner background.

Run the focused desktop E2E against a static server over `dist/`.

Expected: all desktop interaction tests pass against production output.

- [ ] **Step 7: Verify the overflowing window visually**

Open `http://localhost:4321`, launch Selected work, open a project with vertical overflow, and confirm the scrollbar has a 16px gray track, gray outset thumb, 16px buttons, and light-gray hover with no custom diagonal corner artwork.

- [ ] **Step 8: Commit the implementation**

```powershell
git add -- src/styles/scrollbarParity.test.ts src/styles/tokens.css src/styles/desktop.css src/styles/global.css tests/e2e/desktop.spec.ts docs/superpowers/plans/2026-08-13-win98-scrollbar.md
git commit -m "style: match Win98 scrollbar exactly"
```
