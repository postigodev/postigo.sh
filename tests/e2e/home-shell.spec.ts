import { expect, test } from '@playwright/test';

const expectedModules = [
  'hero',
  'projects',
  'writings',
  'github activity',
  'profile card',
  'navigation',
  'note',
  'links',
  'resume',
  'now playing',
  'photo album',
  'selected work status',
] as const;

test('renders the preview-native twelve-module homepage without the desktop shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-home-surface]')).toBeVisible();
  await expect(page.locator('[data-site-module]')).toHaveCount(12);
  await expect(page.locator('[data-module-title]')).toHaveText(expectedModules);
  await expect(page.locator('.desktop-shell')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Software Engineer' })).toBeVisible();
  await expect(page.locator('[data-home-surface] h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveCSS('font-family', /Tahoma/);
});

test('keeps selected work in the approved order with semantic case links', async ({ page }) => {
  await page.goto('/');

  const projects = page.locator('[data-selected-project]');
  await expect(projects).toHaveCount(5);
  await expect(projects.locator('a')).toHaveText([
    'Preppie', 'Cimax Modernization', 'Koba', 'DM2Text', 'Sendo',
  ]);
  expect(await projects.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual([
    '/work/preppie',
    '/work/cimax-modernization',
    '/work/koba',
    '/work/dm2text',
    '/work/sendo',
  ]);
});

test('describes selected work without implying unsupported recency', async ({ page }) => {
  await page.goto('/');

  const status = page.locator('#updates-mini');
  await expect(status.getByRole('heading', { name: 'Selected work status' })).toBeVisible();
  await expect(status).not.toContainText('latest activity');
  await expect(status.locator('a')).toHaveText(['Preppie', 'Cimax Modernization', 'Koba']);
});

test('exposes one semantic ticker message to assistive technology', async ({ page }) => {
  await page.goto('/');

  const accessibleTicker = page.locator('p.ticker-window .sr-only');
  await expect(accessibleTicker).toContainText('Software Engineer');
  await expect(accessibleTicker).toContainText('I build reliable software for real workflows');
  await expect(page.locator('.ticker-window')).not.toHaveAttribute('aria-label');
});

test('shows an honest writings availability state and unpublished album state', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#writings-box')).toContainText('Writings are temporarily unavailable.');
  await expect(page.locator('#writings-box')).not.toContainText('No published writing yet.');
  await expect(page.locator('#album')).toContainText('Photo album under construction');
});

test('keeps the direction contract in production markup', async ({ request }) => {
  const response = await request.get('/');
  const body = await response.text();
  expect(body).toContain('e23380ff');
  expect(body).toContain('unreviewed and undocumented is unfinished');
});
