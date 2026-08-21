import { createAuthClient } from 'better-auth/client';
import { useState } from 'preact/hooks';
import { runAdminAuthOperation } from '../lib/admin-auth-operation';
import { safeAdminNextPath } from '../lib/admin-paths';

interface Props {
  mode: 'sign-in' | 'sign-out';
  next?: string;
}

const authClient = createAuthClient();

export default function AdminAuthControls({ mode, next = '/admin' }: Props) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    setError('');
    const callbackURL = safeAdminNextPath(next);
    try {
      const errorMessage = await runAdminAuthOperation(
        () => authClient.signIn.social({
          provider: 'github',
          callbackURL,
          errorCallbackURL: `/admin/login?error=oauth&next=${encodeURIComponent(callbackURL)}`,
        }),
        'GitHub sign-in could not be started.',
      );
      if (errorMessage) setError(errorMessage);
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    setError('');
    try {
      const errorMessage = await runAdminAuthOperation(
        () => authClient.signOut(),
        'Sign-out failed.',
        () => window.location.assign('/admin/login'),
      );
      if (errorMessage) setError(errorMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <div class="admin-auth-controls">
      <button type="button" disabled={pending} onClick={mode === 'sign-in' ? signIn : signOut}>
        {pending
          ? 'Working…'
          : mode === 'sign-in'
            ? 'Sign in with GitHub'
            : 'Sign out'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
