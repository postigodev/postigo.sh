import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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

const artworkFixture = resolve(process.cwd(), 'public/images/icons/Now Playing_files/ab67616d0000b273c5246f80d22d902d0be31cbf');

async function routeArtwork(page: Page) {
  await page.route(playingFixture.artworkUrl, async (route) => route.fulfill({
    body: await readFile(artworkFixture),
    contentType: 'image/jpeg',
    headers: { 'access-control-allow-origin': '*' },
  }));
}

const githubFixture = {
  state: 'ready',
  profileUrl: 'https://github.com/postigodev',
  login: 'postigodev',
  entries: [
    { id: 'commits-1', kind: 'commit', phrase: '20 commits to', target: 'postigodev/postigo.sh', url: 'https://github.com/postigodev/postigo.sh/commits', createdAt: '2026-08-13T17:52:00.000Z' },
    { id: 'issue-1', kind: 'issue', phrase: 'opened issue #42 in', target: 'postigodev/koba', detail: 'Improve repository scan diagnostics', url: 'https://github.com/postigodev/koba/issues/42', createdAt: '2026-08-13T15:00:00.000Z' },
    { id: 'star-1', kind: 'star', phrase: 'starred', target: 'shuqikhor/pixel-icons', url: 'https://github.com/shuqikhor/pixel-icons', createdAt: '2026-08-13T13:00:00.000Z' },
  ],
  observedAt: '2026-08-13T18:00:00.000Z',
};

test('progressively enhances Spotify and GitHub without blocking static identity', async ({ page }) => {
  await routeArtwork(page);
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: playingFixture }));
  await page.route('**/api/github-activity', (route) => route.fulfill({ json: githubFixture }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spotify' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Test Track on Spotify/i })).toHaveAttribute('href', playingFixture.spotifyUrl);
  await expect(page.getByAltText('Test Album — Test Artist')).toBeVisible();
  await expect(page.locator('#latest')).toHaveAttribute('data-spotify-palette', 'artwork');
  await expect.poll(async () => Number.parseFloat(await page.locator('.spotify-player__progress > span').evaluate((element) => (element as HTMLElement).style.width))).toBeGreaterThanOrEqual(40);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('[data-github-widget]')).toContainText('20 commits to');
  await expect(page.locator('[data-github-widget]')).toContainText('postigodev/postigo.sh');
  await expect(page.locator('[data-github-widget] .github-event__time').first()).not.toContainText('–');
  await expect(page.locator('[data-github-widget] img[src="/images/icons/star.svg"]')).toHaveCount(1);
  await expect(page.locator('[data-github-widget] .github-event-row')).toHaveCount(githubFixture.entries.length);
  await expect(page.locator('[data-github-widget] .github-event-row:empty')).toHaveCount(0);
  await expect(page.locator('[data-github-widget] a').first()).toHaveAttribute('href', githubFixture.entries[0].url);
});

test('preserves explicit unavailable states for malformed responses', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: { state: 'playing', token: 'bad' } }));
  await page.route('**/api/github-activity', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-now-playing]')).toContainText('Spotify unavailable');
  await expect(page.locator('#latest')).toHaveAttribute('data-spotify-palette', 'fallback');
  await expect(page.locator('[data-github-widget]')).toContainText('GitHub activity temporarily unavailable');
  await expect(page.getByRole('link', { name: '@postigodev' })).toBeVisible();
});

test('renders recent playback without playing motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await routeArtwork(page);
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: { ...playingFixture, state: 'recent', progressMs: undefined } }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-now-playing]')).toContainText('LAST PLAYED');
  await expect(page.locator('[data-now-playing]')).not.toHaveClass(/is-playing/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('reduces Spotify artwork motion when requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await routeArtwork(page);
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: playingFixture }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.spotify-player__album img')).toBeVisible();
  expect(await page.locator('.spotify-player__album img').evaluate((element) => getComputedStyle(element).animationIterationCount)).toBe('1');
});
