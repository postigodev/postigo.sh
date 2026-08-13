import { expect, test } from '@playwright/test';

test('boots the Stitch identity shell with three project links and three widgets', async ({ page }) => {
  await page.goto('/');
  const headings = page.locator('main h1');
  await expect(headings.first()).toHaveText('Software Engineer');
  await expect(page.getByRole('link', { name: /Open Preppie/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open Cimax Modernization/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open Koba/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'now.playing' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'notes.txt' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'network.online' })).toBeVisible();
});

test('status panels never expose fake window controls', async ({ page }) => {
  await page.goto('/');
  const network = page.locator('[data-network-panel]');
  await expect(network.getByRole('button')).toHaveCount(0);
  await expect(page.locator('.window-controls')).toHaveCount(3);
});

test('GitHub avatar failures preserve identity and navigation', async ({ page }) => {
  await page.route('https://avatars.githubusercontent.com/**', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Piero Postigo Rocchetti' }).getByText('PP', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore selected work' })).toBeVisible();
  await expect(page.getByRole('link', { name: '@postigodev' })).toBeVisible();
});

for (const viewport of [
  { width: 1440, height: 900, mode: 'columns' },
  { width: 1024, height: 768, mode: 'columns' },
  { width: 768, height: 1024, mode: 'stacked' },
  { width: 390, height: 844, mode: 'stacked' },
] as const) {
  test(`preserves widgets without horizontal overflow at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('[data-now-playing]')).toBeVisible();
    await expect(page.locator('[data-notes]')).toBeVisible();
    await expect(page.locator('[data-network-panel]')).toBeVisible();
    await expect(page.locator('[data-home-shell]')).toHaveAttribute('data-layout', viewport.mode);
  });
}
