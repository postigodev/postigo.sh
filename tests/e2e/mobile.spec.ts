import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('mobile opens Projects through Start without drag or resize handles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Piero OS/ }).click();
  await page.getByRole('link', { name: 'Projects' }).click();
  const work = page.getByRole('region', { name: 'Selected work' });
  await expect(work).toBeVisible();
  await expect(work).toHaveCSS('position', 'fixed');
  await expect(work.locator('[data-resize-handle]')).toHaveCount(0);
});

test('mobile opens the complete Preppie evidence trail', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Piero OS/ }).click();
  await page.getByRole('link', { name: 'Projects' }).click();
  await page.getByRole('region', { name: 'Selected work' }).getByRole('link', { name: 'Open Preppie project' }).click();
  const preppie = page.getByRole('region', { name: 'Preppie' });
  await expect(preppie).toBeVisible();
  await expect(preppie.getByText(/Product ownership was shared/)).toBeVisible();
  await expect(preppie.locator('[data-evidence-row]')).toHaveCount(7);
});

test('compact mode does not overwrite restored desktop bounds', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const desktopBounds = await identity.boundingBox();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(identity.locator('[data-resize-handle]')).toHaveCount(0);
  await page.setViewportSize({ width: 1024, height: 768 });
  expect(await identity.boundingBox()).toEqual(desktopBounds);
});

test('mobile launches Player from Start', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Piero OS/ }).click();
  await page.getByRole('button', { name: 'Now playing' }).click();
  await expect(page.getByRole('region', { name: 'Now playing' })).toBeVisible();
});
