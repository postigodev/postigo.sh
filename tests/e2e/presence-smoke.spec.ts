import { expect, test } from '@playwright/test';

test('deployed preview serves documents and normalized presence APIs', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();

  for (const path of ['/api/now-playing', '/api/github-snapshot']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.state).toMatch(/^(playing|recent|ready|unavailable)$/);
    expect(JSON.stringify(body)).not.toMatch(/token|secret|clientId|refresh/i);
  }
});
