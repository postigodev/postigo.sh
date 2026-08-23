import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authorizeAdminRequest: vi.fn(),
  captureAdminLocation: vi.fn(),
}));

vi.mock('astro:middleware', () => ({
  defineMiddleware: (handler: unknown) => handler,
}));

vi.mock('./lib/authorization', () => ({
  adminLoginRedirect: vi.fn(() => '/admin/login'),
  authorizeAdminRequest: mocks.authorizeAdminRequest,
  isProtectedAdminPath: vi.fn((pathname: string) => pathname === '/admin'),
}));

vi.mock('./location/service', () => ({
  captureAdminLocation: mocks.captureAdminLocation,
}));

import { onRequest } from './middleware';

function context(pathname = '/admin') {
  const url = new URL(`https://portfolio.test${pathname}`);
  return {
    url,
    request: new Request(url),
    locals: {},
    redirect: vi.fn((location: string) =>
      Response.redirect(new URL(location, url)),
    ),
  };
}

describe('admin location middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('captures headers only after the configured administrator is authorized', async () => {
    const authSession = {
      user: { email: 'admin@example.com' },
      session: { id: 'session-id' },
    };
    mocks.authorizeAdminRequest.mockResolvedValue({
      status: 'authorized',
      session: authSession,
    });
    mocks.captureAdminLocation.mockResolvedValue(true);
    const requestContext = context();
    const next = vi.fn(async () => new Response('admin'));

    const response = await onRequest(requestContext as never, next);

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) {
      throw new Error('Expected an admin response.');
    }
    expect(mocks.captureAdminLocation).toHaveBeenCalledWith(
      requestContext.request.headers,
    );
    expect(requestContext.locals).toEqual({ authSession });
    expect(next).toHaveBeenCalledOnce();
    expect(await response.text()).toBe('admin');
  });

  it.each([
    ['unauthenticated', { status: 'unauthenticated' }],
    [
      'forbidden',
      {
        status: 'forbidden',
        session: { user: { email: 'visitor@example.com' }, session: {} },
      },
    ],
  ])('does not capture for an %s request', async (_, authorization) => {
    mocks.authorizeAdminRequest.mockResolvedValue(authorization);
    const requestContext = context();
    const next = vi.fn(async () => new Response('admin'));

    await onRequest(requestContext as never, next);

    expect(mocks.captureAdminLocation).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps authorized admin access available when persistence fails', async () => {
    mocks.authorizeAdminRequest.mockResolvedValue({
      status: 'authorized',
      session: { user: { email: 'admin@example.com' }, session: {} },
    });
    mocks.captureAdminLocation.mockRejectedValue(new Error('database failure'));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const next = vi.fn(async () => new Response('admin'));

    const response = await onRequest(context() as never, next);

    expect(response).toBeInstanceOf(Response);
    if (!(response instanceof Response)) {
      throw new Error('Expected an admin response.');
    }
    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
