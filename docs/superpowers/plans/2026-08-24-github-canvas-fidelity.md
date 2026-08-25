# GitHub Canvas Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vector DOM rendering with a faithful pixel-scaled 320×144 canvas while retaining semantic access and live GitHub logic.

**Architecture:** Keep `githubActivityPresentation.ts` as the normalized view-model boundary. Add a pure canvas renderer and coordinate helpers, then make `GitHubWidget.tsx` synchronize canvas input, selection, overflow state, semantic links, and announcements.

**Tech Stack:** Preact 10, TypeScript strict, Canvas 2D, CSS, Vitest, Playwright.

## Global Constraints

- Do not change `/api/github-activity`, its schema, verified commit grouping, ordering, or caching.
- Keep `references/` read-only and do not import it at runtime.
- Canvas intrinsic size is exactly 320×144; CSS scaling remains fluid and pixelated.
- Every visible row draws its exact date from `createdAt`.

---

### Task 1: Presentation and renderer

**Files:**
- Create: `src/components/githubActivityCanvas.ts`
- Modify: `src/components/githubActivityPresentation.ts`
- Test: `src/components/GitHubWidget.test.ts`

**Interfaces:**
- Produces: `drawGitHubActivityCanvas(ctx, state)`, `githubCanvasPoint(canvas, event)`, and `githubScrollbarGeometry(windowStart, total)`.

- [ ] Add failing tests asserting every item has `DD MMM`, scrollbar geometry is inside the right frame, and hit/window calculations clamp.
- [ ] Run `pnpm exec vitest run src/components/GitHubWidget.test.ts`; expect new assertions to fail.
- [ ] Implement deterministic 320×144 drawing using the reference coordinates, seed `22491`, six row bands, per-row dates, selection, detail frame, and raised Win98 scrollbar.

```ts
export function drawGitHubActivityCanvas(
  ctx: CanvasRenderingContext2D,
  state: GitHubCanvasState,
): void;

export function githubScrollbarGeometry(windowStart: number, total: number): GitHubScrollbarGeometry;
```

- [ ] Re-run the focused unit test; expect pass.

### Task 2: Preact interaction and semantics

**Files:**
- Modify: `src/components/GitHubWidget.tsx`
- Modify: `src/styles/global.css`
- Test: `tests/e2e/presence.spec.ts`

**Interfaces:**
- Consumes: renderer/state interfaces from Task 1.
- Produces: one focusable canvas, profile/detail overlay links, an offscreen semantic list, and a polite selected-item announcement.

- [ ] Update Playwright expectations to require the canvas, every-row dates, focus behavior, six-row navigation, and in-frame scrollbar controls.
- [ ] Run the focused Playwright test; expect failure before component conversion.
- [ ] Replace visual row DOM with canvas rendering synchronized through `useEffect`, `useRef`, and selection/window state. Map keyboard, click, double-click, wheel, touch, track click, and thumb drag to clamped selection.
- [ ] Replace the vector typography CSS with canvas sizing, pixelated scaling, overlay-link hit regions, and canvas focus styling.
- [ ] Run focused unit and Playwright tests; expect pass.

### Task 3: Visual and project verification

**Files:**
- Modify: `DESIGN.md`
- Test: `tests/e2e/presence.spec.ts`

**Interfaces:**
- No public interface changes.

- [ ] Update the canonical GitHub design text to describe canvas visual rendering plus synchronized semantic DOM.
- [ ] Capture desktop/mobile screenshots and compare scale, density, dates, and scrollbar relief with the supplied first image.
- [ ] Run `pnpm check`, focused Vitest, `pnpm build:e2e`, focused Playwright, `pnpm test:unit`, and `pnpm build`; record unrelated/environmental failures separately.
- [ ] Commit implementation files with `feat: restore pixelated GitHub activity rendering`.
