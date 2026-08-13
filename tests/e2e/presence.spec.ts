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
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  publicRepos: 12,
  followers: 4,
  stars: 7,
  languages: ['Rust', 'TypeScript'],
  observedAt: '2026-08-13T18:00:00.000Z',
};

test('renders playing and GitHub snapshot payloads without blocking identity', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: playingFixture }));
  await page.route('**/api/github-snapshot', (route) => route.fulfill({ json: githubFixture }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await expect(page.getByText('NOW PLAYING', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Track on Spotify/i })).toHaveAttribute('href', playingFixture.spotifyUrl);
  await expect(page.locator('[data-network-panel]')).toContainText('7 stars');
  await expect(page.getByRole('img', { name: 'Spotify' })).toBeVisible();
});

test('keeps explicit fallback states for malformed responses', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: { state: 'playing', token: 'bad' } }));
  await page.route('**/api/github-snapshot', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByText('PLAYBACK_UNAVAILABLE')).toBeVisible();
  await expect(page.getByRole('link', { name: '@postigodev' })).toBeVisible();
  await expect(page.locator('[data-network-panel]')).not.toContainText(/stars|followers|repos/);
});
