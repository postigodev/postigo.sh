import { expect, test, type Locator, type Page } from '@playwright/test';

const waitForDesktop = (page: Page) => expect(page.locator('[data-desktop-ready="true"]')).toBeVisible();
const workWindow = (page: Page) => page.getByRole('region', { name: 'Selected work' });

async function dragBy(page: Page, locator: Locator, dx: number, dy: number) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Pointer target is unavailable');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy);
  await page.mouse.up();
}

test('project launch stays independent from Identity and Selected work', async ({ page }) => {
  await page.goto('/');
  await waitForDesktop(page);
  await page.getByRole('button', { name: 'Close Piero Postigo Rocchetti' }).click();
  await page.getByRole('link', { name: 'Projects' }).click();
  await workWindow(page).getByRole('link', { name: 'Open Koba project' }).click();
  await page.getByRole('button', { name: 'Close Selected work' }).click();
  await expect(page.getByRole('region', { name: 'Koba' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Selected work' })).toHaveCount(0);
});

test('project windows remain singleton and preserve evidence content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Projects' }).click();
  const preppieLink = workWindow(page).getByRole('link', { name: 'Open Preppie project' });
  await preppieLink.press('Enter');
  await expect(page).toHaveURL(/\/work\/preppie$/);
  const preppie = page.getByRole('region', { name: 'Preppie' });
  await expect(preppie).toHaveCount(1);
  await expect(page.locator('#window-title-project-preppie')).toBeFocused();
  await expect(preppie.locator('[data-case-chapter]')).toHaveCount(4);
  await expect(preppie.locator('[data-evidence-row]')).toHaveCount(7);
  await page.locator('[data-taskbar-id="work"]').click();
  await preppieLink.press('Enter');
  await expect(preppie).toHaveCount(1);
});

test('owned Back and Forward focus route targets without closing unrelated windows', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Network' }).click();
  await page.getByRole('link', { name: 'Projects' }).click();
  await workWindow(page).getByRole('link', { name: 'Open Sendo project' }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.locator('#window-title-work')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('region', { name: 'Network online' })).toBeVisible();
  await expect(page.locator('#window-title-identity')).toBeFocused();
  await page.goForward();
  await page.goForward();
  await expect(page.locator('#window-title-project-sendo')).toBeFocused();
});

test('untouched Identity maximizes, restores, then remains draggable', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const before = await identity.boundingBox();
  await page.getByRole('button', { name: 'Maximize Piero Postigo Rocchetti' }).click();
  await expect(identity.locator('[data-resize-handle]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore Piero Postigo Rocchetti' }).click();
  expect(await identity.boundingBox()).toEqual(before);
  await dragBy(page, identity.locator('.window-titlebar'), 70, 50);
  expect((await identity.boundingBox())?.x).not.toBe(before?.x);
});

test('edge and corner resize synchronize with maximize and restore', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  await dragBy(page, identity.locator('[data-resize-handle="e"]'), 80, 0);
  const afterEdge = await identity.boundingBox();
  await dragBy(page, identity.locator('[data-resize-handle="se"]'), 40, 50);
  const resized = await identity.boundingBox();
  expect(resized?.width).toBeGreaterThan(afterEdge?.width ?? 0);
  expect(resized?.height).toBeGreaterThan(afterEdge?.height ?? 0);
  await page.getByRole('button', { name: 'Maximize Piero Postigo Rocchetti' }).click();
  await page.getByRole('button', { name: 'Restore Piero Postigo Rocchetti' }).click();
  expect(await identity.boundingBox()).toEqual(resized);
});

test('resize enforces minimum width and releases pointer capture', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  await dragBy(page, identity.locator('[data-resize-handle="e"]'), -900, 0);
  const minimum = await identity.boundingBox();
  expect(minimum?.width).toBe(420);
  await page.mouse.move(1200, 500);
  expect(await identity.boundingBox()).toEqual(minimum);
});

test('drag permits partial overflow but keeps titlebar controls recoverable', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  await dragBy(page, identity.locator('.window-titlebar'), -1200, -900);
  const moved = await identity.boundingBox();
  expect(moved?.x).toBeLessThan(0);
  expect(moved?.y).toBe(0);
  expect((moved?.x ?? 0) + (moved?.width ?? 0)).toBeGreaterThanOrEqual(128);
});

test('Start exposes Privacy and returns focus on Escape', async ({ page }) => {
  await page.goto('/');
  const start = page.getByRole('button', { name: /Piero OS/ });
  await start.click();
  await expect(page.getByRole('navigation', { name: 'Start menu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Start menu' })).toHaveCount(0);
  await expect(start).toBeFocused();
  await start.click();
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('region', { name: 'Privacy' })).toHaveCount(1);
  await page.goBack();
  await expect(page.locator('#window-title-identity')).toBeFocused();
});

test('desktop-only utilities open independently and keep the root URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Network' }).click();
  for (const name of ['Now playing', 'Notes']) {
    await page.getByRole('button', { name: /Piero OS/ }).click();
    await page.getByRole('button', { name }).click();
  }
  for (const title of ['Network online', 'Now playing', 'Notes.txt']) {
    const app = page.getByRole('region', { name: title });
    await expect(app).toBeVisible();
    await expect(app.locator('.window-controls button')).toHaveCount(3);
  }
  await expect(page).toHaveURL(/\/$/);
});

test('taskbar clock and minimize/restore focus behave natively', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.taskbar-clock')).toHaveText(/\d{1,2}:\d{2}/);
  await page.getByRole('button', { name: 'Minimize Piero Postigo Rocchetti' }).click();
  const task = page.locator('[data-taskbar-id="identity"]');
  await expect(task).toBeFocused();
  await task.click();
  await expect(page.locator('#window-title-identity')).toBeFocused();
});

test('closing returns focus to the launcher', async ({ page }) => {
  await page.goto('/');
  const networkLauncher = page.getByRole('button', { name: 'Network' });
  await networkLauncher.click();
  await page.getByRole('button', { name: 'Close Network online' }).click();
  await expect(networkLauncher).toBeFocused();
});
