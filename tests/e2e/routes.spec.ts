import { expect, test } from '@playwright/test';

test('direct Sendo route opens the server-rendered case window with artifacts', async ({ page }) => {
  await page.goto('/work/sendo');
  await expect(page.getByRole('heading', { level: 1, name: 'Sendo', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Work' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Artifacts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sendo v0.1.0 release' })).toBeVisible();
});

test('direct Preppie route is a professional evidence trail', async ({ page }) => {
  await page.goto('/work/preppie');
  await expect(page.getByText('Professional Experience · 2026')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Preppie', exact: true })).toBeVisible();
  await expect(page.getByText('Startup Software Engineer — Backend & Integration')).toBeVisible();
  await expect(page.getByText(/Product ownership was shared/)).toBeVisible();
  await expect(page.locator('[data-case-chapter]')).toHaveCount(4);
  await expect(page.locator('[data-evidence-row]')).toHaveCount(7);
  await expect(page.locator('[data-case-visual]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('EV_PREPPIE_');
});

test('direct DM2Text route presents an artifact-led interaction trace', async ({ page }) => {
  await page.goto('/work/dm2text');
  await expect(page.getByRole('heading', { level: 1, name: 'DM2Text', exact: true })).toBeVisible();
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

test('prerendered project routes do not invent a live writing publication state', async ({ page }) => {
  await page.goto('/work/preppie');

  const writings = page.locator('#writings-box');
  await expect(writings).toContainText('Writing availability is checked live.');
  await expect(writings).not.toContainText('No published writing yet.');
});

test('direct writings route reports its unavailable-backend fallback honestly', async ({ page }) => {
  await page.goto('/writings');
  await expect(page.getByRole('heading', { level: 1, name: 'Writings' })).toBeVisible();
  await expect(page.locator('.document-panel')).toContainText(/No published writing yet|Writings are temporarily unavailable/);
});

test('admin login remains an ordinary useful document without backend credentials', async ({ page }) => {
  await page.goto('/admin/login?next=https://attacker.example/steal');
  await expect(page.getByRole('heading', { level: 1, name: 'Admin sign in' })).toBeVisible();
  await expect(page.getByText('limited to the configured portfolio administrator')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in with GitHub' })).toBeVisible();
});

test('public writing detail and PDF distinguish an unavailable backend from not found', async ({ request }) => {
  const detail = await request.get('/writings/not-published-here');
  expect(detail.status()).toBe(503);
  expect(await detail.text()).toContain('Writings unavailable');

  const pdf = await request.get('/writings/not-published-here/paper.pdf', {
    maxRedirects: 0,
  });
  expect(pdf.status()).toBe(503);
  expect(pdf.headers()['cache-control']).toBe('no-store');
  expect(await pdf.text()).toBe('PDF unavailable.');

  const head = await request.head('/writings/not-published-here/paper.pdf');
  expect(head.status()).toBe(503);
  expect(head.headers()['cache-control']).toBe('no-store');
  expect(await head.body()).toHaveLength(0);
});

test('stable writing PDF route rejects unsupported methods explicitly', async ({ request, baseURL }) => {
  const response = await request.post('/writings/not-published-here/paper.pdf', {
    headers: { origin: baseURL ?? 'http://127.0.0.1:4323' },
    data: '',
  });

  expect(response.status()).toBe(405);
  expect(response.headers()['allow']).toBe('GET, HEAD');
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toBe('Method not allowed.');
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
    await expect(page.getByRole('heading', { level: 1, name: 'Preppie', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /PR #44/ })).toBeVisible();
  });

});

test('project content survives an unavailable screenshot', async ({ page }) => {
  await page.route('**/images/sendo/sendo-home.png', (route) => route.abort());
  await page.goto('/work/sendo');
  await expect(page.getByRole('heading', { level: 1, name: 'Sendo', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Source repository' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sendo v0.1.0 release' })).toBeVisible();
});

test('reduced motion removes transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('#welcome')).toHaveCSS('transition-duration', '0s');
  await expect(page.locator('.floating-goat')).toHaveCSS('animation-duration', /^(0\.01ms|1e-05s)$/);
});
