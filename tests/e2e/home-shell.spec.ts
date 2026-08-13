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

test('status panels never expose fake window controls', async ({ page }) => {
  await page.goto('/');
  const network = page.locator('[data-network-panel]');
  await expect(network.getByRole('button')).toHaveCount(0);
  await expect(page.locator('.window-controls')).toHaveCount(3);
});

test('closing a desktop-only utility leaves URL and history unchanged', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => ({ href: location.href, length: history.length }));
  await page.getByRole('button', { name: 'Close notes.txt' }).click();
  expect(await page.evaluate(() => ({ href: location.href, length: history.length }))).toEqual(before);
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
