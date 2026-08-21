import { getAuth } from './auth';
import { getAdminConfig, ServerConfigurationError } from './server-env';

export interface AuthorizationSession {
  user: {
    email?: string | null;
    [key: string]: unknown;
  };
  session: {
    [key: string]: unknown;
  };
}

export type AdminAuthorization =
  | { status: 'unauthenticated' }
  | { status: 'forbidden'; session: AuthorizationSession }
  | { status: 'authorized'; session: AuthorizationSession };

export interface AdminAuthorizationDependencies {
  getSession: (headers: Headers) => Promise<AuthorizationSession | null>;
  getAdminEmail: () => Promise<string | undefined>;
}

async function productionSessionLookup(
  headers: Headers,
): Promise<AuthorizationSession | null> {
  return (await getAuth()).api.getSession({ headers });
}

async function productionAdminEmail(): Promise<string> {
  return (await getAdminConfig()).ADMIN_EMAIL;
}

const productionDependencies: AdminAuthorizationDependencies = {
  getSession: productionSessionLookup,
  getAdminEmail: productionAdminEmail,
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isProtectedAdminPath(pathname: string): boolean {
  if (pathname === '/admin/login' || pathname === '/admin/login/') return false;
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export async function authorizeAdminRequest(
  headers: Headers,
  dependencies: AdminAuthorizationDependencies = productionDependencies,
): Promise<AdminAuthorization> {
  const session = await dependencies.getSession(headers);
  if (!session) return { status: 'unauthenticated' };

  const configuredEmail = await dependencies.getAdminEmail();
  if (!configuredEmail?.trim()) {
    throw new ServerConfigurationError('administrator authorization', [
      'ADMIN_EMAIL is required.',
    ]);
  }

  const sessionEmail = session.user.email;
  if (
    !sessionEmail?.trim() ||
    normalizeEmail(sessionEmail) !== normalizeEmail(configuredEmail)
  ) {
    return { status: 'forbidden', session };
  }

  return { status: 'authorized', session };
}

export function safeAdminNextPath(
  candidate: string,
  fallback = '/admin',
): string {
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return fallback;
  }

  const base = new URL('https://portfolio.invalid');
  const resolved = new URL(candidate, base);
  if (resolved.origin !== base.origin) return fallback;

  return `${resolved.pathname}${resolved.search}`;
}

export function adminLoginRedirect(requestUrl: URL): string {
  const next = safeAdminNextPath(`${requestUrl.pathname}${requestUrl.search}`);
  return `/admin/login?next=${encodeURIComponent(next)}`;
}
