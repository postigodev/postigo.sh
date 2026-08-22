import { expect, test } from '@playwright/test';

const playingFixture = {
  state: 'playing',
  track: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  artworkUrl: 'https://i.scdn.co/image/test',
  spotifyUrl: 'https://open.spotify.com/track/test',
  durationMs: 210_000,
  progressMs: 84_000,
  observedAt: '2026-08-13T18:00:00.000Z',
};

const githubFixture = {
  state: 'ready',
  profileUrl: 'https://github.com/postigodev',
  login: 'postigodev',
  entries: [
    { id: 'push-1', kind: 'push', phrase: '3 pushes to', target: 'postigodev/postigo.sh', detail: 'main', url: 'https://github.com/postigodev/postigo.sh/tree/main', createdAt: '2026-08-13T17:52:00.000Z', oldestCreatedAt: '2026-08-13T12:52:00.000Z' },
    { id: 'issue-1', kind: 'issue', phrase: 'opened issue #42 in', target: 'postigodev/koba', detail: 'Improve repository scan diagnostics', url: 'https://github.com/postigodev/koba/issues/42', createdAt: '2026-08-13T15:00:00.000Z' },
  ],
  observedAt: '2026-08-13T18:00:00.000Z',
};

test('progressively enhances Spotify and GitHub without blocking static identity', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: playingFixture }));
  await page.route('**/api/github-activity', (route) => route.fulfill({ json: githubFixture }));
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Track on Spotify/i })).toHaveAttribute('href', playingFixture.spotifyUrl);
  await expect(page.locator('[data-github-widget]')).toContainText('3 pushes to');
  await expect(page.locator('[data-github-widget]')).toContainText('postigodev/postigo.sh');
  await expect(page.locator('[data-github-widget] .github-event__time').first()).toContainText('–');
  await expect(page.locator('[data-github-widget] .github-event-row')).toHaveCount(githubFixture.entries.length);
  await expect(page.locator('[data-github-widget] .github-event-row:empty')).toHaveCount(0);
  await expect(page.locator('[data-github-widget] a').first()).toHaveAttribute('href', githubFixture.entries[0].url);
});

test('preserves explicit unavailable states for malformed responses', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: { state: 'playing', token: 'bad' } }));
  await page.route('**/api/github-activity', (route) => route.abort());
  await page.goto('/');

  await expect(page.locator('[data-now-playing]')).toContainText('Spotify presence is unavailable');
  await expect(page.locator('[data-github-widget]')).toContainText('GitHub activity temporarily unavailable');
  await expect(page.getByRole('link', { name: '@postigodev' })).toBeVisible();
});
