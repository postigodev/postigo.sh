import { describe, expect, it, vi } from 'vitest';
import {
  adminLoginRedirect,
  authorizeAdminRequest,
  isProtectedAdminPath,
  normalizeEmail,
  safeAdminNextPath,
  type AdminAuthorizationDependencies,
  type AuthorizationSession,
} from './authorization';
import { ServerConfigurationError } from './server-env';

const session: AuthorizationSession = {
  user: { id: 'user-1', email: 'Piero@Example.com' },
  session: { id: 'session-1' },
};

function dependencies(
  overrides: Partial<AdminAuthorizationDependencies> = {},
): AdminAuthorizationDependencies {
  return {
    getSession: vi.fn(async () => session),
    getAdminEmail: vi.fn(async () => 'piero@example.com'),
    ...overrides,
  };
}

describe('administrator authorization', () => {
  it('distinguishes a missing session without loading administrator config', async () => {
    const getAdminEmail = vi.fn(async () => 'piero@example.com');
    const result = await authorizeAdminRequest(
      new Headers(),
      dependencies({ getSession: vi.fn(async () => null), getAdminEmail }),
    );

    expect(result).toEqual({ status: 'unauthenticated' });
    expect(getAdminEmail).not.toHaveBeenCalled();
  });

  it('normalizes both emails before an exact comparison', async () => {
    const result = await authorizeAdminRequest(
      new Headers(),
      dependencies({ getAdminEmail: vi.fn(async () => '  PIERO@example.COM ') }),
    );

    expect(result).toEqual({ status: 'authorized', session });
    expect(normalizeEmail(' A@Example.Com ')).toBe('a@example.com');
  });

  it('distinguishes an authenticated non-administrator', async () => {
    const result = await authorizeAdminRequest(
      new Headers(),
      dependencies({ getAdminEmail: vi.fn(async () => 'other@example.com') }),
    );

    expect(result).toEqual({ status: 'forbidden', session });
  });

  it('fails closed when the session email is missing', async () => {
    const result = await authorizeAdminRequest(
      new Headers(),
      dependencies({
        getSession: vi.fn(async () => ({ ...session, user: { email: null } })),
      }),
    );

    expect(result.status).toBe('forbidden');
  });

  it('fails closed with a clear configuration error when ADMIN_EMAIL is missing', async () => {
    await expect(
      authorizeAdminRequest(
        new Headers(),
        dependencies({ getAdminEmail: vi.fn(async () => undefined) }),
      ),
    ).rejects.toBeInstanceOf(ServerConfigurationError);
  });
});

describe('administrator redirect targets', () => {
  it('protects only the admin route family except its login document', () => {
    expect(isProtectedAdminPath('/admin')).toBe(true);
    expect(isProtectedAdminPath('/admin/writings')).toBe(true);
    expect(isProtectedAdminPath('/admin/login')).toBe(false);
    expect(isProtectedAdminPath('/admin/login/')).toBe(false);
    expect(isProtectedAdminPath('/administrator')).toBe(false);
    expect(isProtectedAdminPath('/api/auth/session')).toBe(false);
    expect(isProtectedAdminPath('/images/site/goat-profile.webp')).toBe(false);
  });

  it('preserves a same-origin path and query', () => {
    expect(safeAdminNextPath('/admin/writings?status=draft')).toBe(
      '/admin/writings?status=draft',
    );
    expect(
      adminLoginRedirect(
        new URL('https://portfolio.example/admin/writings?status=draft'),
      ),
    ).toBe('/admin/login?next=%2Fadmin%2Fwritings%3Fstatus%3Ddraft');
  });

  it.each([
    'https://attacker.example/steal',
    '//attacker.example/steal',
    '/\\attacker.example/steal',
    'admin/writings',
  ])('rejects unsafe next target %s', (target) => {
    expect(safeAdminNextPath(target)).toBe('/admin');
  });
});
