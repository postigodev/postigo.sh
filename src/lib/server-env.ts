import { z } from 'zod';

type ServerEnvironment = Record<string, string | undefined>;

export class ServerConfigurationError extends Error {
  readonly issues: string[];

  constructor(scope: string, issues: string[]) {
    super(`Invalid ${scope} configuration: ${issues.join('; ')}`);
    this.name = 'ServerConfigurationError';
    this.issues = issues;
  }
}

const requiredText = (name: string) =>
  z
    .string({ error: `${name} is required.` })
    .trim()
    .min(1, `${name} is required.`);

const requiredUrl = (name: string) =>
  requiredText(name).pipe(z.url({ error: `${name} must be an absolute URL.` }));

const databaseConfigSchema = z.object({
  DATABASE_URL: requiredUrl('DATABASE_URL'),
});

const authConfigSchema = z.object({
  BETTER_AUTH_SECRET: requiredText('BETTER_AUTH_SECRET').min(
    32,
    'BETTER_AUTH_SECRET must contain at least 32 characters.',
  ),
  BETTER_AUTH_URL: requiredUrl('BETTER_AUTH_URL'),
  GITHUB_CLIENT_ID: requiredText('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: requiredText('GITHUB_CLIENT_SECRET'),
});

const adminConfigSchema = z.object({
  ADMIN_EMAIL: requiredText('ADMIN_EMAIL').pipe(
    z.email({ error: 'ADMIN_EMAIL must be a valid email address.' }),
  ),
});

const blobConfigSchema = z.object({
  BLOB_READ_WRITE_TOKEN: requiredText('BLOB_READ_WRITE_TOKEN'),
});

const siteConfigSchema = z.object({
  SITE_URL: requiredUrl('SITE_URL'),
});

function parseConfiguration<T>(
  scope: string,
  schema: z.ZodType<T>,
  environment: ServerEnvironment,
): T {
  const result = schema.safeParse(environment);
  if (result.success) return result.data;

  throw new ServerConfigurationError(
    scope,
    result.error.issues.map((issue) => issue.message),
  );
}

async function serverEnvironment(): Promise<ServerEnvironment> {
  const environment = await import('astro:env/server');
  return {
    DATABASE_URL: environment.DATABASE_URL,
    BETTER_AUTH_SECRET: environment.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: environment.BETTER_AUTH_URL,
    GITHUB_CLIENT_ID: environment.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: environment.GITHUB_CLIENT_SECRET,
    ADMIN_EMAIL: environment.ADMIN_EMAIL,
    BLOB_READ_WRITE_TOKEN: environment.BLOB_READ_WRITE_TOKEN,
    SITE_URL: environment.SITE_URL,
  };
}

export async function getDatabaseConfig(
  environment?: ServerEnvironment,
): Promise<z.output<typeof databaseConfigSchema>> {
  return parseConfiguration(
    'database',
    databaseConfigSchema,
    environment ?? (await serverEnvironment()),
  );
}

export async function getAuthConfig(
  environment?: ServerEnvironment,
): Promise<z.output<typeof authConfigSchema>> {
  return parseConfiguration(
    'authentication',
    authConfigSchema,
    environment ?? (await serverEnvironment()),
  );
}

export async function getAdminConfig(
  environment?: ServerEnvironment,
): Promise<z.output<typeof adminConfigSchema>> {
  return parseConfiguration(
    'administrator authorization',
    adminConfigSchema,
    environment ?? (await serverEnvironment()),
  );
}

export async function getBlobConfig(
  environment?: ServerEnvironment,
): Promise<z.output<typeof blobConfigSchema>> {
  return parseConfiguration(
    'writing PDF storage',
    blobConfigSchema,
    environment ?? (await serverEnvironment()),
  );
}

export async function getSiteConfig(
  environment?: ServerEnvironment,
): Promise<z.output<typeof siteConfigSchema>> {
  return parseConfiguration(
    'site URL',
    siteConfigSchema,
    environment ?? (await serverEnvironment()),
  );
}
