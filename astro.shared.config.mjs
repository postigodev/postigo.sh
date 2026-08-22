import preact from '@astrojs/preact';
import { envField } from 'astro/config';

export const sharedAstroConfig = {
  env: {
    schema: {
      DATABASE_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      BETTER_AUTH_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      BETTER_AUTH_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      GITHUB_CLIENT_ID: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      GITHUB_CLIENT_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      ADMIN_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      BLOB_READ_WRITE_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      SITE_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      LETTERBOXD_URI: envField.string({ context: 'server', access: 'secret', optional: true }),
      TMDB_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      STEAM_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      STEAM_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      HARDCOVER_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  integrations: [preact()],
};
