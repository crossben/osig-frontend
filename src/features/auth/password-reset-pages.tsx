'use client';

// #/forgot-password asks for an email; #/reset-password?token=... sets the new password.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { AuthShell } from './auth-shell';
import { errorText } from './auth-errors';
import { hashParam } from './verify-email-page';
import { useT } from '@/lib/i18n';

function BackToSignIn() {
  const t = useT();
  return <a href="#/login" className="font-medium text-trace hover:underline">{t('Back to sign in')}</a>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const t = useT();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(errorText(err, t('The link wasn’t sent. Check your connection and try again.')));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title={t('Check your inbox')} subtitle={t('If an account uses that address, we’ve sent a link to reset its password.')} footer={<BackToSignIn />}>
        <p className="text-sm text-muted-foreground">
          {t('The link works once and expires soon. Nothing arrived after a few minutes? Check your spam folder or')}{' '}
          <button type="button" className="font-medium text-trace hover:underline" onClick={() => setSent(false)}>{t('try another address')}</button>.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('Reset your password')} subtitle={t('Enter the email you sign in with and we’ll send you a link.')} footer={<BackToSignIn />}>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t('Email')}</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-11 bg-card" />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={sending}>
          {sending ? t('Sending…') : t('Send the link')}
        </Button>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { toast } = useToast();
  const t = useT();
  const [token] = useState(() => hashParam('token'));
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!token) {
    return (
      <AuthShell title={t('This link didn’t work')} subtitle={t('It has no reset token. Open the link from the email again, or ask for a new one.')} footer={<BackToSignIn />}>
        <Button size="lg" className="w-full" onClick={() => { window.location.hash = '#/forgot-password'; }}>{t('Ask for a new link')}</Button>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError(t('Use at least 8 characters.'));
    if (next !== repeat) return setError(t('The passwords don’t match.'));
    setSaving(true);
    try {
      await api.resetPassword(token, next);
      // Resetting signs out every session, including any in this browser
      if (useAuthStore.getState().isAuthenticated) useAuthStore.getState().logout();
      toast({ title: t('Password reset'), description: t('Sign in with your new password.') });
      window.location.hash = '#/login';
    } catch (err) {
      setError(errorText(err, t('The password wasn’t reset. The link may have expired; ask for a new one.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell title={t('Choose a new password')} subtitle={t('This signs you out on every device.')} footer={<BackToSignIn />}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t('New password')}</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="h-11 bg-card" />
          <p className="text-xs text-muted-foreground">{t('At least 8 characters.')}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="repeatPassword">{t('Repeat new password')}</Label>
          <Input id="repeatPassword" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className="h-11 bg-card" />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}{' '}
            {/expired|invalid|used/i.test(error) && <a href="#/forgot-password" className="font-medium underline">{t('Ask for a new link')}</a>}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={!next || !repeat || saving}>
          {saving ? t('Resetting…') : t('Reset password')}
        </Button>
      </form>
    </AuthShell>
  );
}
