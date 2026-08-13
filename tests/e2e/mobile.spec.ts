import { expect, test } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
test('mobile uses direct full-screen app views', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  const work = page.getByRole('region', { name: 'Work', exact: true });
  await expect(work).toBeVisible(); await expect(work).toHaveCSS('position', 'fixed');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeAttached();
});

test('mobile opens the complete Preppie evidence trail', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-desktop-ready="true"]')).toBeVisible();
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await page.getByRole('region', { name: 'Work', exact: true }).getByRole('link', { name: 'Open Preppie project' }).click();
  const preppie = page.getByRole('region', { name: 'Preppie' });
  await expect(preppie).toBeVisible();
  await expect(preppie).toHaveCSS('position', 'fixed');
  await expect(preppie.getByText(/Product ownership was shared/)).toBeVisible();
  await expect(preppie.locator('[data-evidence-row]')).toHaveCount(7);
});
