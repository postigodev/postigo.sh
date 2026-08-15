import { expect, test } from '@playwright/test';

test('direct Sendo route is a standalone Astro document with artifacts', async ({ page }) => {
  await page.goto('/work/sendo');
  await expect(page.getByRole('heading', { name: 'Sendo' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Work' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Artifacts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sendo v0.1.0 release' })).toBeVisible();
});

test('direct Preppie route is a professional evidence trail', async ({ page }) => {
  await page.goto('/work/preppie');
  await expect(page.getByText('Professional Experience · 2026')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preppie' })).toBeVisible();
  await expect(page.getByText('Startup Software Engineer — Backend & Integration')).toBeVisible();
  await expect(page.getByText(/Product ownership was shared/)).toBeVisible();
  await expect(page.locator('[data-case-chapter]')).toHaveCount(4);
  await expect(page.locator('[data-evidence-row]')).toHaveCount(7);
  await expect(page.locator('[data-case-visual]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('EV_PREPPIE_');
});

test('direct DM2Text route presents an artifact-led interaction trace', async ({ page }) => {
  await page.goto('/work/dm2text');
  await expect(page.getByRole('heading', { name: 'DM2Text' })).toBeVisible();
  await expect(page.getByText('Interaction trace')).toBeVisible();
  const trace = page.locator('[data-artifact-sequence]');
  await expect(trace.locator('[data-sequence-artifact]')).toHaveCount(3);
  await expect(trace.locator('figcaption strong')).toHaveText([
    'Copy context', 'Choose the boundary', 'Anonymized output example',
  ]);
  await expect(page.locator('[data-case-chapter]')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Anchor-bounded collection loop' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/EV_DM2TEXT|[a-f0-9]{64}/i);
});

test('Sendo public route hides provenance and uses an archive source action', async ({ page }) => {
  await page.goto('/work/sendo');
  await expect(page.locator('body')).not.toContainText('EV_SENDO_');
  await expect(page.getByRole('link', { name: /Source repository/ })).toHaveClass(/archive-action/);
});

test('direct writings route is a useful static empty state', async ({ page }) => {
  await page.goto('/writings');
  await expect(page.getByRole('heading', { level: 1, name: 'Writings' })).toBeVisible();
  await expect(page.getByText('No published writing yet.')).toBeVisible();
  await expect(page.getByText('This section is under construction.')).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('follows the Projects desktop link to the static Work document', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/work\/?$/);
    await expect(page.getByRole('heading', { name: 'Work', exact: true })).toBeVisible();
  });

  test('Work link follows through to the Preppie case', async ({ page }) => {
    await page.goto('/work');
    await page.getByRole('link', { name: 'Open case study' }).first().click();
    await expect(page).toHaveURL(/\/work\/preppie$/);
    await expect(page.getByRole('heading', { name: 'Preppie' })).toBeVisible();
    await expect(page.getByRole('link', { name: /PR #44/ })).toBeVisible();
  });
});

test('project content survives an unavailable screenshot', async ({ page }) => {
  await page.route('**/images/sendo/sendo-home.png', (route) => route.abort());
  await page.goto('/work/sendo');
  await expect(page.getByRole('heading', { name: 'Sendo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Source repository' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sendo v0.1.0 release' })).toBeVisible();
});

test('reduced motion removes transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('#welcome')).toHaveCSS('transition-duration', '0s');
  await expect(page.locator('.floating-goat')).toHaveCSS('animation-duration', /^(0\.01ms|1e-05s)$/);
});
