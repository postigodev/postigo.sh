import { describe, expect, it } from 'vitest';
import {
  ServerConfigurationError,
  getAdminConfig,
  getAuthConfig,
  getBlobConfig,
  getDatabaseConfig,
  getSiteConfig,
} from './server-env';

describe('runtime server configuration', () => {
  it('normalizes validated values only when a scoped helper is called', async () => {
    await expect(
      getAuthConfig({
        BETTER_AUTH_SECRET: 'x'.repeat(32),
        BETTER_AUTH_URL: 'https://portfolio.example',
        GITHUB_CLIENT_ID: ' client-id ',
        GITHUB_CLIENT_SECRET: ' client-secret ',
      }),
    ).resolves.toEqual({
      BETTER_AUTH_SECRET: 'x'.repeat(32),
      BETTER_AUTH_URL: 'https://portfolio.example',
      GITHUB_CLIENT_ID: 'client-id',
      GITHUB_CLIENT_SECRET: 'client-secret',
    });

    await expect(
      getDatabaseConfig({ DATABASE_URL: 'postgresql://example.invalid/db' }),
    ).resolves.toEqual({ DATABASE_URL: 'postgresql://example.invalid/db' });
    await expect(getAdminConfig({ ADMIN_EMAIL: ' Admin@Example.com ' })).resolves.toEqual({
      ADMIN_EMAIL: 'Admin@Example.com',
    });
    await expect(getBlobConfig({ BLOB_READ_WRITE_TOKEN: ' token ' })).resolves.toEqual({
      BLOB_READ_WRITE_TOKEN: 'token',
    });
    await expect(getSiteConfig({ SITE_URL: 'https://portfolio.example' })).resolves.toEqual({
      SITE_URL: 'https://portfolio.example',
    });
  });

  it('reports missing scoped values without requiring unrelated variables', async () => {
    await expect(getBlobConfig({})).rejects.toMatchObject({
      name: 'ServerConfigurationError',
      message: expect.stringContaining('BLOB_READ_WRITE_TOKEN is required'),
    });
    await expect(getAuthConfig({})).rejects.toBeInstanceOf(
      ServerConfigurationError,
    );
  });
});
