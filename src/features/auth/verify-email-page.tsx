'use client';

// Landing page for the link in the confirmation email: #/verify-email?token=...

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { AuthShell } from './auth-shell';
import { errorText } from './auth-errors';
import { useT } from '@/lib/i18n';

export function hashParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const q = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(q).get(name);
}

export function VerifyEmailPage() {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const { toast } = useToast();
  const t = useT();
  const [token] = useState(() => hashParam('token'));
  const [state, setState] = useState<'working' | 'done' | 'failed'>(() => (token ? 'working' : 'failed'));
  const [error, setError] = useState(() => (token ? '' : t('This link has no token. Open the link from the email again.')));
  const [resent, setResent] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    api.verifyEmail(token)
      .then(async (verified) => {
        setState('done');
        const signedIn = useAuthStore.getState().isAuthenticated;
        if (!signedIn) return;
        // Refresh the signed-in user so the reminder banner goes away
        const current = useAuthStore.getState().user;
        if (current && current.id === verified.id) setUser({ ...current, emailVerified: true });
        try { setUser(await api.getCurrentUser()); } catch { /* the patch above is enough */ }
      })
      .catch((err) => {
        setError(errorText(err, t('The link didn’t work. It may have expired or been used already.')));
        setState('failed');
      });
  }, [token, setUser, t]);

  const resend = async () => {
    try {
      await api.resendVerification();
      setResent(true);
      toast({ title: t('Link resent'), description: t('Check your inbox, and your spam folder.') });
    } catch (err) {
      toast({ variant: 'destructive', title: t('The link wasn’t resent'), description: errorText(err, t('Try again in a moment.')) });
    }
  };

  if (state === 'working') {
    return (
      <AuthShell title={t('Confirming your email')} subtitle={t('This takes a second.')}>
        <p className="text-sm text-muted-foreground" role="status">{t('Checking the link…')}</p>
      </AuthShell>
    );
  }

  if (state === 'done') {
    return (
      <AuthShell title={t('Email confirmed')} subtitle={t('You can run scans, bulk scans and share reports now.')}>
        {isAuthenticated ? (
          <Button size="lg" className="w-full" onClick={() => { window.location.hash = '#/'; }}>{t('Start a scan')}</Button>
        ) : (
          <Button size="lg" className="w-full" onClick={() => { window.location.hash = '#/login'; }}>{t('Sign in')}</Button>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('This link didn’t work')} subtitle={error}>
      {isAuthenticated && user?.emailVerified === false ? (
        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={resend} disabled={resent}>
            {resent ? t('Link resent') : t('Resend the link')}
          </Button>
          <p className="text-sm text-muted-foreground">{t('We’ll send a new link to {email}.', { email: user.email })}</p>
        </div>
      ) : isAuthenticated ? (
        <Button size="lg" className="w-full" onClick={() => { window.location.hash = '#/'; }}>{t('Go to the dashboard')}</Button>
      ) : (
        <div className="space-y-3">
          <Button size="lg" className="w-full" onClick={() => { window.location.hash = '#/login'; }}>{t('Sign in')}</Button>
          <p className="text-sm text-muted-foreground">{t('Sign in to get a new link from the banner at the top of the dashboard.')}</p>
        </div>
      )}
    </AuthShell>
  );
}
