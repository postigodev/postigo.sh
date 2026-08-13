import { expect, test } from '@playwright/test';

test('identity-first desktop opens Work and singleton Sendo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await expect(page).toHaveURL(/\/work$/);
  await page.getByRole('link', { name: 'Open Sendo project' }).click();
  await expect(page).toHaveURL(/\/work\/sendo$/);
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  await page.getByRole('link', { name: 'Open Sendo project' }).click();
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(1);
});

test('owned back and forward synchronize windows without duplicate writes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await page.getByRole('link', { name: 'Open Sendo project' }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole('region', { name: 'Work' })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/work\/sendo$/);
  await expect(page.getByRole('region', { name: 'Sendo' })).toBeVisible();
});

test('minimize and restore Sendo through the taskbar', async ({ page }) => {
  await page.goto('/'); await page.getByRole('link', { name: 'Explore selected work' }).click(); await page.getByRole('link', { name: 'Open Sendo project' }).click();
  await page.getByRole('button', { name: 'Minimize Sendo' }).click();
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sendo', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Sendo', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Sendo' })).toBeVisible();
});

test('maximize restores bounds and close returns to Work', async ({ page }) => {
  await page.goto('/'); await page.getByRole('link', { name: 'Explore selected work' }).press('Enter'); await page.getByRole('link', { name: 'Open Sendo project' }).press('Enter');
  const sendo = page.getByRole('region', { name: 'Sendo' }); const before = await sendo.boundingBox();
  await page.getByRole('button', { name: 'Maximize Sendo' }).click();
  await expect(page.getByRole('button', { name: 'Restore Sendo' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore Sendo' }).click();
  expect(await sendo.boundingBox()).toEqual(before);
  await page.getByRole('button', { name: 'Close Sendo' }).click();
  await expect(page).toHaveURL(/\/work$/); await expect(page.getByRole('region', { name: 'Work' })).toBeVisible();
});

test('drag keeps Identity inside the desktop viewport', async ({ page }) => {
  await page.goto('/'); const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const title = identity.getByRole('heading', { name: 'Piero Postigo Rocchetti' });
  const box = await title.boundingBox(); if (!box) throw new Error('Identity titlebar is not visible');
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down(); await page.mouse.move(-200, -200); await page.mouse.up();
  const moved = await identity.boundingBox(); expect(moved?.x).toBeGreaterThanOrEqual(0); expect(moved?.y).toBeGreaterThanOrEqual(42);
});
