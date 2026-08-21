import { describe, expect, it, vi } from 'vitest';
import { runAdminAuthOperation } from './admin-auth-operation';

describe('administrator auth client operations', () => {
  it('preserves a client error message', async () => {
    await expect(
      runAdminAuthOperation(
        async () => ({ error: { message: 'OAuth is unavailable.' } }),
        'Sign-in failed.',
      ),
    ).resolves.toBe('OAuth is unavailable.');
  });

  it('turns a rejected client request into useful fallback text', async () => {
    await expect(
      runAdminAuthOperation(
        async () => Promise.reject(new Error('network offline')),
        'Sign-out failed.',
      ),
    ).resolves.toBe('Sign-out failed.');
  });

  it('runs the success transition only after a successful request', async () => {
    const onSuccess = vi.fn();
    await expect(
      runAdminAuthOperation(async () => ({}), 'Sign-out failed.', onSuccess),
    ).resolves.toBeNull();
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
