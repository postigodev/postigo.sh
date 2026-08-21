import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDatabase } from '../db/client';
import { getAuthConfig } from './server-env';

async function createAuth() {
  const [database, config] = await Promise.all([
    getDatabase(),
    getAuthConfig(),
  ]);

  return betterAuth({
    database: drizzleAdapter(database, { provider: 'pg' }),
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    socialProviders: {
      github: {
        clientId: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
      },
    },
  });
}

export type AuthInstance = Awaited<ReturnType<typeof createAuth>>;

let authPromise: Promise<AuthInstance> | undefined;

export function getAuth(): Promise<AuthInstance> {
  authPromise ??= createAuth().catch((error: unknown) => {
    authPromise = undefined;
    throw error;
  });
  return authPromise;
}
