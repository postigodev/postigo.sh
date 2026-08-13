import { expect, test } from '@playwright/test';

test('boots near-cold with only Identity and native desktop launchers', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-desktop-ready="true"]')).toBeVisible();
  await expect(page.getByRole('region')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About Piero' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resume.pdf' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Network' })).toBeVisible();
});

test('uses the Stitch desktop without navbar or sidebar chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.system-bar')).toHaveCount(0);
  await expect(page.locator('.home-rail')).toHaveCount(0);
  await expect(page.locator('.desktop-shell')).toHaveCSS('overflow', 'hidden');
  await expect(page.locator('.desktop-workspace')).toHaveCSS('position', 'fixed');
});

test('uses sentence case OS chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Piero OS/ })).toBeVisible();
  await expect(page.getByText('SYSTEM_READY')).toHaveCount(0);
  await expect(page.getByText('PIERO_OS')).toHaveCount(0);
});

test('Network is a real independently controlled window', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Network' }).click();
  const network = page.getByRole('region', { name: 'Network online' });
  await expect(network).toBeVisible();
  await expect(network.locator('.window-controls button')).toHaveCount(3);
});

test('closing a desktop-only utility leaves URL and history unchanged', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Piero OS/ }).click();
  await page.getByRole('button', { name: 'Notes' }).click();
  const before = await page.evaluate(() => ({ href: location.href, length: history.length }));
  await page.getByRole('button', { name: 'Close Notes.txt' }).click();
  expect(await page.evaluate(() => ({ href: location.href, length: history.length }))).toEqual(before);
});

test('GitHub avatar failures preserve identity and navigation', async ({ page }) => {
  await page.route('https://avatars.githubusercontent.com/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' }).getByText('PP', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore selected work' })).toBeVisible();
  await page.getByRole('button', { name: 'Network' }).click();
  await expect(page.getByRole('link', { name: '@postigodev' })).toBeVisible();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
] as const) {
  test(`preserves the near-cold desktop without document overflow at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' })).toBeVisible();
    await expect(page.getByRole('region')).toHaveCount(1);
  });
}
