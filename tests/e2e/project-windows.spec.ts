import { expect, test } from '@playwright/test';

const projectLink = (page: import('@playwright/test').Page, name: string) => page.locator('#projects').getByRole('link', { name });
const projectWindow = (page: import('@playwright/test').Page, slug: string) => page.locator(`[data-project-window="${slug}"]`);
const waitForWindowLayer = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('[data-project-window-layer]')).toHaveAttribute('data-window-layer-ready', 'true');
};

test('opens independent singleton project windows and closes an inactive one', async ({ page }) => {
  await page.goto('/');
  await waitForWindowLayer(page);
  await projectLink(page, 'Preppie').click();
  await expect(page).toHaveURL(/\/work\/preppie$/);
  await expect(projectWindow(page, 'preppie')).toBeVisible();

  await projectWindow(page, 'preppie').getByRole('link', { name: 'Koba' }).click();
  await expect(page).toHaveURL(/\/work\/koba$/);
  await expect(projectWindow(page, 'preppie')).toBeVisible();
  await expect(projectWindow(page, 'koba')).toBeVisible();

  await projectWindow(page, 'preppie').getByRole('button', { name: 'Close Preppie' }).click();
  await expect(projectWindow(page, 'preppie')).toHaveCount(0);
  await expect(projectWindow(page, 'koba')).toBeVisible();
  await expect(page).toHaveURL(/\/work\/koba$/);
});

test('drags, resizes, maximizes and restores a project window', async ({ page }) => {
  await page.goto('/');
  await waitForWindowLayer(page);
  await projectLink(page, 'Preppie').click();
  const window = projectWindow(page, 'preppie');
  const initial = await window.boundingBox();
  expect(initial).not.toBeNull();

  const titlebar = window.locator('[data-window-titlebar]');
  const titleBounds = await titlebar.boundingBox();
  if (!titleBounds) throw new Error('Missing project titlebar');
  await page.mouse.move(titleBounds.x + 80, titleBounds.y + 15);
  await page.mouse.down();
  await page.mouse.move(titleBounds.x + 150, titleBounds.y + 65, { steps: 4 });
  await page.mouse.up();
  const dragged = await window.boundingBox();
  expect(dragged?.x).toBeGreaterThan(initial!.x + 40);

  const southeast = window.locator('[data-resize-handle="se"]');
  const handle = await southeast.boundingBox();
  if (!handle) throw new Error('Missing southeast resize handle');
  await page.mouse.move(handle.x + 4, handle.y + 4);
  await page.mouse.down();
  await page.mouse.move(handle.x + 84, handle.y + 54, { steps: 4 });
  await page.mouse.up();
  const resized = await window.boundingBox();
  expect(resized?.width).toBeGreaterThan(dragged!.width + 50);

  await window.getByRole('button', { name: 'Maximize Preppie' }).click();
  await expect(window).toHaveAttribute('data-maximized', 'true');
  const maximized = await window.boundingBox();
  expect(maximized?.width).toBe(await page.evaluate(() => document.documentElement.clientWidth));

  await window.getByRole('button', { name: 'Restore Preppie' }).click();
  await expect(window).toHaveAttribute('data-maximized', 'false');
  const restored = await window.boundingBox();
  expect(restored?.width).toBeCloseTo(resized!.width, 0);
  expect(restored?.height).toBeCloseTo(resized!.height, 0);
});

test('Back and Forward restore exact project snapshots and focus does not add depth', async ({ page }) => {
  await page.goto('/');
  await waitForWindowLayer(page);
  await projectLink(page, 'Preppie').click();
  await projectWindow(page, 'preppie').getByRole('link', { name: 'Koba' }).click();

  await projectWindow(page, 'preppie').locator('[data-window-titlebar]').click();
  await expect(page).toHaveURL(/\/work\/preppie$/);
  const focusedLength = await page.evaluate(() => history.length);
  await projectWindow(page, 'koba').locator('[data-window-titlebar]').click({ position: { x: 700, y: 15 } });
  expect(await page.evaluate(() => history.length)).toBe(focusedLength);

  await page.evaluate(() => history.back());
  await expect(projectWindow(page, 'preppie')).toBeVisible();
  await expect(projectWindow(page, 'koba')).toHaveCount(0);
  await expect(page).toHaveURL(/\/work\/preppie$/);

  await page.evaluate(() => history.forward());
  await expect(projectWindow(page, 'preppie')).toBeVisible();
  await expect(projectWindow(page, 'koba')).toBeVisible();
  await expect(projectWindow(page, 'koba')).toHaveAttribute('data-active', 'true');
});

test('closing an active project never resurrects a project removed from the current snapshot', async ({ page }) => {
  await page.goto('/');
  await waitForWindowLayer(page);
  await projectLink(page, 'Preppie').click();
  await projectWindow(page, 'preppie').getByRole('link', { name: 'Koba' }).click();
  await projectWindow(page, 'preppie').getByRole('button', { name: 'Close Preppie' }).click();
  await projectWindow(page, 'koba').getByRole('button', { name: 'Close Koba' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(projectWindow(page, 'preppie')).toHaveCount(0);
  await expect(projectWindow(page, 'koba')).toHaveCount(0);
});

test('closing a focused earlier project keeps the other current project open', async ({ page }) => {
  await page.goto('/');
  await waitForWindowLayer(page);
  await projectLink(page, 'Preppie').click();
  await projectWindow(page, 'preppie').getByRole('link', { name: 'Koba' }).click();
  await projectWindow(page, 'preppie').locator('[data-window-titlebar]').click();
  await projectWindow(page, 'preppie').getByRole('button', { name: 'Close Preppie' }).click();

  await expect(page).toHaveURL(/\/work\/koba$/);
  await expect(projectWindow(page, 'preppie')).toHaveCount(0);
  await expect(projectWindow(page, 'koba')).toBeVisible();
  await expect(projectWindow(page, 'koba')).toHaveAttribute('data-active', 'true');
});

test('a direct project route renders the homepage and close replaces to root', async ({ page }) => {
  await page.goto('/work/koba');
  await waitForWindowLayer(page);
  await expect(page.locator('[data-home-surface]')).toBeVisible();
  await expect(projectWindow(page, 'koba')).toBeVisible();
  await expect(projectWindow(page, 'koba').getByRole('heading', { level: 1, name: 'Koba' })).toBeVisible();
  await projectWindow(page, 'koba').getByRole('button', { name: 'Close Koba' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(projectWindow(page, 'koba')).toHaveCount(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('semantic launcher follows to a readable direct case with a Work link', async ({ page }) => {
    await page.goto('/');
    await projectLink(page, 'Preppie').click();
    await expect(page).toHaveURL(/\/work\/preppie$/);
    await expect(projectWindow(page, 'preppie').getByRole('heading', { level: 1, name: 'Preppie' })).toBeVisible();
    await expect(projectWindow(page, 'preppie').getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/work');
  });
});

test.describe('mobile project windows', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('uses a fullscreen active case, disables resize, and locks background scroll', async ({ page }) => {
    await page.goto('/');
    await projectLink(page, 'Preppie').click();
    const window = projectWindow(page, 'preppie');
    await expect(window).toBeVisible();
    expect(await window.boundingBox()).toEqual({ x: 0, y: 0, width: 390, height: 844 });
    await expect(window.locator('[data-resize-handle]')).toHaveCount(0);
    await expect(window.getByRole('button', { name: 'Maximize Preppie' })).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await expect(window.getByRole('button', { name: 'Close Preppie' })).toBeVisible();
  });
});
