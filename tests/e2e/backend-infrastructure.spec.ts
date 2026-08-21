import { expect, test } from '@playwright/test';

test('public pages remain honest when backend configuration is absent', async ({
  page,
  request,
}) => {
  const home = await page.goto('/');
  expect(home?.status()).toBe(200);
  await expect(page.locator('#writings-box')).toContainText(
    'Writings are temporarily unavailable.',
  );

  const missingWriting = await request.get('/writings/missing');
  expect(missingWriting.status()).toBe(503);
  expect(await missingWriting.text()).toContain('Writings unavailable');
});

test('admin login stays public while protected admin routes fail closed', async ({
  request,
}) => {
  const login = await request.get('/admin/login');
  expect(login.status()).toBe(200);
  expect(await login.text()).toContain('Admin sign in');

  const admin = await request.get('/admin', { maxRedirects: 0 });
  expect(admin.status()).toBe(503);
  expect(await admin.text()).toBe('Administrator access is unavailable.');
});
