import { createAuthClient } from 'better-auth/client';
import { useState } from 'preact/hooks';
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
    const result = await authClient.signIn.social({
      provider: 'github',
      callbackURL,
      errorCallbackURL: `/admin/login?error=oauth&next=${encodeURIComponent(callbackURL)}`,
    });
    if (result.error) {
      setError(result.error.message ?? 'GitHub sign-in could not be started.');
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    setError('');
    const result = await authClient.signOut();
    if (result.error) {
      setError(result.error.message ?? 'Sign-out failed.');
      setPending(false);
      return;
    }
    window.location.assign('/admin/login');
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
