import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL;
const productionTestUrl = 'http://127.0.0.1:4322';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: externalBaseUrl ? ['presence-api.spec.ts'] : ['presence-api.spec.ts', 'presence-smoke.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: externalBaseUrl ?? productionTestUrl,
    trace: 'retain-on-failure',
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'pnpm build && pnpm exec serve dist -l tcp://127.0.0.1:4322 --no-clipboard',
        url: productionTestUrl,
        reuseExistingServer: false,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
