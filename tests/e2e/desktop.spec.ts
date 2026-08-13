import { expect, test, type Page } from '@playwright/test';

const workWindow = (page: Page) => page.getByRole('region', { name: 'Work', exact: true });

test('identity-first desktop opens Work and singleton Sendo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Engineer' })).toBeVisible();
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await expect(page).toHaveURL(/\/work$/);
  await workWindow(page).getByRole('link', { name: 'Open Sendo project' }).click();
  await expect(page).toHaveURL(/\/work\/sendo$/);
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  await workWindow(page).getByRole('link', { name: 'Open Sendo project' }).click();
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(1);
});

test('owned back and forward synchronize windows without duplicate writes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await workWindow(page).getByRole('link', { name: 'Open Sendo project' }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/work$/);
  await expect(workWindow(page)).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/work\/sendo$/);
  await expect(page.getByRole('region', { name: 'Sendo' })).toBeVisible();
});

test('keyboard opens a singleton Preppie professional case and focuses its window', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).press('Enter');
  const preppieLink = workWindow(page).getByRole('link', { name: 'Open Preppie project' });
  await preppieLink.press('Enter');
  await expect(page).toHaveURL(/\/work\/preppie$/);
  await expect(page.getByRole('region', { name: 'Preppie' })).toHaveCount(1);
  await expect(page.locator('#window-title-project-preppie')).toBeFocused();
  await expect(page.getByRole('region', { name: 'Preppie' }).locator('[data-case-chapter]')).toHaveCount(4);
  await expect(page.getByRole('region', { name: 'Preppie' }).locator('[data-evidence-row]')).toHaveCount(7);
  await expect(page.getByRole('region', { name: 'Preppie' })).not.toContainText('EV_PREPPIE_');
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  await preppieLink.press('Enter');
  await expect(page.getByRole('region', { name: 'Preppie' })).toHaveCount(1);
});

test('owned Back and Forward restore window focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await workWindow(page).getByRole('link', { name: 'Open Preppie project' }).click();
  await page.goBack();
  await expect(page.locator('[data-window-id="work"] h2')).toBeFocused();
  await page.goForward();
  await expect(page.locator('#window-title-project-preppie')).toBeFocused();
});

test('Sendo desktop hides provenance and styles its source action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await workWindow(page).getByRole('link', { name: 'Open Sendo project' }).click();
  const sendo = page.getByRole('region', { name: 'Sendo' });
  await expect(sendo).not.toContainText('EV_SENDO_');
  await expect(sendo.getByRole('link', { name: /Source repository/ })).toHaveClass(/archive-action/);
});

test('minimize and restore Sendo through the taskbar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).click();
  await workWindow(page).getByRole('link', { name: 'Open Sendo project' }).click();
  await page.getByRole('button', { name: 'Minimize Sendo' }).click();
  await expect(page.getByRole('region', { name: 'Sendo' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sendo', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Sendo', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Sendo' })).toBeVisible();
});

test('maximize restores bounds and close returns to Work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore selected work' }).press('Enter');
  await workWindow(page).getByRole('link', { name: 'Open Sendo project' }).press('Enter');
  const sendo = page.getByRole('region', { name: 'Sendo' });
  const before = await sendo.boundingBox();
  await page.getByRole('button', { name: 'Maximize Sendo' }).click();
  await expect(page.getByRole('button', { name: 'Restore Sendo' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore Sendo' }).click();
  expect(await sendo.boundingBox()).toEqual(before);
  await page.getByRole('button', { name: 'Close Sendo' }).click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(workWindow(page)).toBeVisible();
});

test('drag keeps Identity inside the desktop viewport', async ({ page }) => {
  await page.goto('/');
  const identity = page.getByRole('region', { name: 'Piero Postigo Rocchetti' });
  const title = identity.getByRole('heading', { name: 'Piero Postigo Rocchetti' });
  const box = await title.boundingBox();
  if (!box) throw new Error('Identity titlebar is not visible');
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(-200, -200);
  await page.mouse.up();
  const moved = await identity.boundingBox();
  expect(moved?.x).toBeGreaterThanOrEqual(0);
  expect(moved?.y).toBeGreaterThanOrEqual(42);
});
