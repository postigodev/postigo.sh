import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: externalBaseUrl ? ['presence-api.spec.ts'] : ['presence-api.spec.ts', 'presence-smoke.spec.ts'],
  fullyParallel: false,
  workers: 3,
  use: {
    baseURL: externalBaseUrl ?? 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'pnpm build && pnpm exec serve dist -l tcp://127.0.0.1:4321 --no-clipboard',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: !process.env.CI,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
