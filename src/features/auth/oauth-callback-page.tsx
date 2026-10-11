'use client';

// Landing page after Google sign-in: trades the one-time code for tokens.

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, isMfaStep } from '@/lib/api';
import { useAuthStore } from '@/store';
import { AuthShell } from './auth-shell';
import { useT } from '@/lib/i18n';

export function OAuthCallbackPage() {
  const { login } = useAuthStore();
  const t = useT();
  // Read once: the code is single-use, and a URL error needs no effect to show
  const [params] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || ''));
  const code = params.get('code');
  const [error, setError] = useState<string | null>(
    params.get('error') || (code ? null : t('Google sign-in didn’t complete.')));
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !code || error) return;
    ran.current = true;
    api.googleExchange(code)
      .then((res) => {
        if (isMfaStep(res)) {
          window.location.replace(`#/login?mfa=${encodeURIComponent(res.mfaToken)}`);
          return;
        }
        login(res.user, res.tokens);
        window.location.replace('#/');
      })
      .catch((e: Error) => setError(e.message || t('Google sign-in didn’t complete.')));
  }, [code, error, login, t]);

  return (
    <AuthShell
      title={error ? t('Sign-in didn’t work') : t('Signing you in…')}
      subtitle={error ?? t('One moment while we finish signing you in with Google.')}
    >
      {error && (
        <div className="flex gap-2">
          <Button onClick={() => window.location.replace('#/login')}>{t('Back to sign in')}</Button>
        </div>
      )}
    </AuthShell>
  );
}
