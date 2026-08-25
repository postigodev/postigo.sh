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
    { id: 'pr-1', kind: 'pull-request', phrase: 'merged PR #9 in', target: 'postigodev/brumaire', url: 'https://github.com/postigodev/brumaire/pull/9', createdAt: '2026-08-12T18:00:00.000Z' },
    { id: 'release-1', kind: 'release', phrase: 'published a release for', target: 'postigodev/koba', url: 'https://github.com/postigodev/koba/releases/tag/v1', createdAt: '2026-08-11T18:00:00.000Z' },
    { id: 'fork-1', kind: 'fork', phrase: 'forked', target: 'postigodev/example', url: 'https://github.com/postigodev/example/forks', createdAt: '2026-08-10T18:00:00.000Z' },
    { id: 'public-1', kind: 'repository-public', phrase: 'made repository public', target: 'postigodev/archive', url: 'https://github.com/postigodev/archive', createdAt: '2026-08-09T18:00:00.000Z' },
    { id: 'created-1', kind: 'repository-created', phrase: 'created repository', target: 'postigodev/new-repo', url: 'https://github.com/postigodev/new-repo', createdAt: '2026-08-08T18:00:00.000Z' },
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
  await expect(page.locator('[data-github-widget]')).toContainText('20 commits');
  await expect(page.locator('[data-github-widget]')).toContainText('postigodev/postigo.sh');
  const canvas = page.locator('[data-github-widget] canvas');
  await expect(canvas).toHaveAttribute('width', '320');
  await expect(canvas).toHaveAttribute('height', '144');
  await expect(page.locator('[data-github-widget] ol li')).toHaveCount(githubFixture.entries.length);
  await expect(page.locator('[data-github-widget] ol li').first()).toContainText('13 AUG');
  await expect(page.locator('[data-github-widget] ol li').nth(1)).toContainText('13 AUG');
  await expect(page.locator('[data-github-widget] .github-overview__overlay--detail')).toHaveAttribute('href', githubFixture.entries[0].url);
});

test('navigates and opens the complete GitHub activity menu', async ({ page }) => {
  await page.route('**/api/github-activity', (route) => route.fulfill({ json: githubFixture }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { window.open = (url) => { document.documentElement.dataset.githubOpened = String(url); return null; }; });

  const canvas = page.locator('[data-github-widget] canvas');
  await canvas.focus();
  await canvas.press('End');
  await expect(page.locator('.github-overview__overlay--detail')).toHaveAttribute('href', githubFixture.entries[7].url);
  await expect(page.locator('[aria-live="polite"]')).toContainText('created repository postigodev/new-repo');
  await canvas.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-github-opened', githubFixture.entries[7].url);

  await canvas.press('Home');
  await expect(page.locator('.github-overview__overlay--detail')).toHaveAttribute('href', githubFixture.entries[0].url);
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await canvas.dblclick({ position: { x: (box?.width ?? 320) * 150 / 320, y: (box?.height ?? 144) * 48 / 144 } });
  await expect(page.locator('html')).toHaveAttribute('data-github-opened', githubFixture.entries[1].url);
});

test('keeps wheel scrolling inside the GitHub activity menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await page.route('**/api/github-activity', (route) => route.fulfill({ json: githubFixture }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const canvas = page.locator('[data-github-widget] canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2);
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);

  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(100);

  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test('preserves explicit unavailable states for malformed responses', async ({ page }) => {
  await page.route('**/api/now-playing', (route) => route.fulfill({ json: { state: 'playing', token: 'bad' } }));
  await page.route('**/api/github-activity', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-now-playing]')).toContainText('Spotify unavailable');
  await expect(page.locator('#latest')).toHaveAttribute('data-spotify-palette', 'fallback');
  await expect(page.locator('[data-github-widget]')).toContainText('GitHub activity unavailable');
  await expect(page.getByRole('link', { name: 'Open postigodev on GitHub' }).first()).toBeVisible();
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
