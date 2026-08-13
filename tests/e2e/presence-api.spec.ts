import { expect, test } from '@playwright/test';

test('privacy page describes the owner-only playback display', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByText(/owner's current or recently played Spotify content/i)).toBeVisible();
  await expect(page.getByText(/visitors do not connect a Spotify account/i)).toBeVisible();
});

test('local functions reject account selectors', async ({ request }) => {
  expect((await request.get('/api/now-playing?user=visitor')).status()).toBe(400);
  expect((await request.get('/api/github-snapshot?user=visitor')).status()).toBe(400);
  expect((await request.post('/api/now-playing', { data: { refreshToken: 'visitor' } })).status()).toBe(405);
});

test('local functions expose only normalized public fields', async ({ request }) => {
  for (const path of ['/api/now-playing', '/api/github-snapshot']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.state).toMatch(/^(playing|recent|ready|unavailable)$/);
    expect(JSON.stringify(body)).not.toMatch(/token|secret|clientId|refresh/i);
  }
});
