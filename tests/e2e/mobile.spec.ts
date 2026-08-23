import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('mobile follows the approved content priority and remains within the viewport', async ({ page }) => {
  await page.goto('/');

  const ordered = await page.locator('[data-mobile-order]').evaluateAll((elements) => elements.map((element) => element.id));

  expect(ordered).toEqual([
    'welcome',
    'projects',
    'writings-box',
    'github-box',
    'profile-card',
    'directory',
    'note-box',
    'links-box',
    'resume-box',
    'latest',
    'album',
    'updates-mini',
  ]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  const mascotBounds = await page.locator('.site-head__goat img').evaluate((image) => {
    const header = image.closest('.site-head');
    if (!header) throw new Error('Expected the mascot to be inside the site header.');

    const mascot = image.getBoundingClientRect();
    const host = header.getBoundingClientRect();
    return { mascotBottom: mascot.bottom, headerBottom: host.bottom };
  });

  expect(mascotBounds.mascotBottom).toBeLessThanOrEqual(mascotBounds.headerBottom + 2);
});

test('keeps the no-location fallback within the mobile viewport', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('[data-location-box]')).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test('mobile keeps project links usable without JavaScript', async ({ page }) => {
  await page.goto('/');
  await page.locator('#projects').getByRole('link', { name: 'Preppie' }).click();
  await expect(page).toHaveURL(/\/work\/preppie$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Preppie' })).toBeVisible();
});
