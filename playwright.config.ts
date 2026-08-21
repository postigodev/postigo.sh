import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL;
const productionTestUrl = 'http://127.0.0.1:4322';
const absentBackendEnvironment = {
  DATABASE_URL: '',
  BETTER_AUTH_SECRET: '',
  BETTER_AUTH_URL: '',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  ADMIN_EMAIL: '',
  BLOB_READ_WRITE_TOKEN: '',
  SITE_URL: '',
};

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
        command: 'pnpm build:e2e && node scripts/start-e2e-server.mjs',
        url: productionTestUrl,
        reuseExistingServer: false,
        timeout: 120_000,
        env: absentBackendEnvironment,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
