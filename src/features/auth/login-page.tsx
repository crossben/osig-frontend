// ============================================
// Login Page Component
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { api, isMfaStep } from '@/lib/api';
import { useAuthStore } from '@/store';
import { AuthShell } from './auth-shell';
import { GoogleSignIn } from './google-button';
import { errorText } from './auth-errors';
import { hashParam } from './verify-email-page';
import { useT } from '@/lib/i18n';

export function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Set when the password step (or Google, via #/login?mfa=...) asks for a second factor
  const [mfaToken, setMfaToken] = useState<string | null>(() => hashParam('mfa'));

  useEffect(() => {
    if (isAuthenticated) window.location.hash = '#/';
  }, [isAuthenticated]);

  if (isAuthenticated) return null;

  if (mfaToken) {
    return (
      <MfaStepForm
        mfaToken={mfaToken}
        onCancel={() => {
          setMfaToken(null);
          setPassword('');
          if (window.location.hash.includes('mfa=')) window.location.hash = '#/login';
        }}
      />
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password }, {
      onSuccess: (data) => { if (isMfaStep(data)) setMfaToken(data.mfaToken); },
    });
  };

  return (
    <AuthShell
      title={t('Sign in')}
      subtitle={t('Pick up where your last trace left off.')}
      footer={
        <>
          {t('New to OSIG?')}{' '}
          <a href="#/register" className="font-medium text-trace hover:underline">{t('Create an account')}</a>
        </>
      }
    >
      <GoogleSignIn />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t('Email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11 bg-card"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password">{t('Password')}</Label>
            <a href="#/forgot-password" className="text-sm text-trace hover:underline">{t('Forgot your password?')}</a>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-11 bg-card"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? t('Signing in…') : t('Sign in')}
        </Button>
      </form>
    </AuthShell>
  );
}

function MfaStepForm({ mfaToken, onCancel }: { mfaToken: string; onCancel: () => void }) {
  const { login } = useAuthStore();
  const { toast } = useToast();
  const t = useT();
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = code.trim();
    if (!recovery && !/^\d{6}$/.test(value)) return setError(t('Enter the 6-digit code from your authenticator app.'));
    if (recovery && !value) return setError(t('Enter one of your recovery codes.'));
    setBusy(true);
    try {
      const data = await api.verifyMfa(mfaToken, value);
      login(data.user, data.tokens);
      toast({ title: t('Signed in'), description: t('Signed in as {email}', { email: data.user.email }) });
      const hash = window.location.hash;
      if (!hash || hash === '#/' || hash.startsWith('#/login') || hash.startsWith('#/register')) {
        window.location.hash = '#/';
      }
    } catch (err) {
      setError(errorText(err, recovery
        ? t('That recovery code didn’t work. Check it, or use another one.')
        : t('That code didn’t work. Wait for a new one and try again.')));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('Two-factor sign-in')}
      subtitle={recovery
        ? t('Enter one of the recovery codes you saved. Each one works once.')
        : t('Enter the 6-digit code from your authenticator app.')}
      footer={<button type="button" onClick={onCancel} className="font-medium text-trace hover:underline">{t('Start over')}</button>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="mfaCode">{recovery ? t('Recovery code') : t('Code')}</Label>
          {recovery ? (
            <Input
              key="recovery"
              id="mfaCode"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="a1b2c3-d4e5f6"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-11 bg-card font-mono"
            />
          ) : (
            <Input
              key="totp"
              id="mfaCode"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="h-11 bg-card font-mono text-lg tracking-[0.3em]"
            />
          )}
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !code}>
          {busy ? t('Checking…') : t('Sign in')}
        </Button>
        <button
          type="button"
          className="text-sm text-trace hover:underline"
          onClick={() => { setRecovery(!recovery); setCode(''); setError(''); }}
        >
          {recovery ? t('Use your authenticator app') : t('Use a recovery code')}
        </button>
      </form>
    </AuthShell>
  );
}
