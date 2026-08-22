import { expect, test } from '@playwright/test';

const entries = [
  { kind: 'film', activity: 'watched', title: 'Test Film', year: 2026, occurredAt: '2026-08-20', rating: 4.5, artworkUrl: 'https://image.tmdb.org/t/p/w500/test.jpg' },
  { kind: 'game', activity: 'played', title: 'Test Game', totalHours: 12.3, artworkUrl: 'https://shared.fastly.steamstatic.com/test.jpg' },
  { kind: 'book', activity: 'reading', title: 'Test Book', author: 'Test Author', progressPercent: 63, artworkUrl: 'https://example.com/book.jpg' },
];

test('media log preserves provider order, profile links and artwork preview', async ({ page }) => {
  await page.route('**/api/media-log', (route) => route.fulfill({ json: { entries, observedAt: new Date().toISOString() } }));
  await page.goto('/');
  const module = page.locator('#media-box');
  await expect(module).toBeVisible();
  await expect(module.locator('[data-media-entry]')).toHaveCount(3);
  await expect(module.locator('[data-media-entry]').first()).toContainText('Test Film');
  await expect(module.getByRole('link', { name: 'Letterboxd' })).toHaveAttribute('target', '_blank');
  await module.getByRole('button', { name: /Test Film/ }).focus();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.getByRole('tooltip')).toContainText('Test Film');
});

