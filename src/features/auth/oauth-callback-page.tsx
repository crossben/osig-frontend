'use client';

// Landing page after Google sign-in: trades the one-time code for tokens.

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { AuthShell } from './auth-shell';

export function OAuthCallbackPage() {
  const { login } = useAuthStore();
  // Read once: the code is single-use, and a URL error needs no effect to show
  const [params] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || ''));
  const code = params.get('code');
  const [error, setError] = useState<string | null>(
    params.get('error') || (code ? null : 'Google sign-in didn\u2019t complete.'));
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !code || error) return;
    ran.current = true;
    api.googleExchange(code)
      .then(({ user, tokens }) => {
        login(user, tokens);
        window.location.replace('#/');
      })
      .catch((e: Error) => setError(e.message || 'Google sign-in didn\u2019t complete.'));
  }, [code, error, login]);

  return (
    <AuthShell
      title={error ? 'Sign-in didn’t work' : 'Signing you in…'}
      subtitle={error ?? 'One moment while we finish signing you in with Google.'}
    >
      {error && (
        <div className="flex gap-2">
          <Button onClick={() => window.location.replace('#/login')}>Back to sign in</Button>
        </div>
      )}
    </AuthShell>
  );
}
