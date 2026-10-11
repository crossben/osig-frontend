'use client';

// Account security: email confirmation, two-factor sign-in, signing out everywhere.

import { useState } from 'react';
import { ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { errorText } from './auth-errors';
import { useT } from '@/lib/i18n';

function StatusDot({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', on ? 'text-success' : 'text-muted-foreground')}>
      <span aria-hidden className={cn('h-2 w-2 rounded-full', on ? 'bg-success' : 'bg-muted-foreground/50')} />
      {children}
    </span>
  );
}

export async function refreshUser() {
  try {
    useAuthStore.getState().setUser(await api.getCurrentUser());
  } catch { /* the page keeps the previous state */ }
}

/** Logs out locally after the server revoked every token, and returns to sign-in */
function signOutHere() {
  useAuthStore.getState().logout();
  window.location.hash = '#/login';
}

export function EmailStatus() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const t = useT();
  const [sent, setSent] = useState(false);
  if (!user) return null;
  const verified = user.emailVerified !== false;

  const resend = async () => {
    try {
      await api.resendVerification();
      setSent(true);
      toast({ title: t('Link resent'), description: t('Check the inbox for {email}.', { email: user.email }) });
    } catch (err) {
      toast({ variant: 'destructive', title: t('The link wasn’t resent'), description: errorText(err, t('Try again in a moment.')) });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium">{t('Email address')}</p>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="flex items-center gap-3">
        <StatusDot on={verified}>{verified ? t('Confirmed') : t('Not confirmed')}</StatusDot>
        {!verified && (
          <Button size="sm" variant="outline" onClick={resend} disabled={sent}>{sent ? t('Link resent') : t('Resend the link')}</Button>
        )}
      </div>
    </div>
  );
}

type MfaFlow =
  | { step: 'idle' }
  | { step: 'setup'; secret: string; qrSvg: string }
  | { step: 'codes'; codes: string[] }
  | { step: 'disable' };

export function TwoFactor() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const t = useT();
  const [flow, setFlow] = useState<MfaFlow>({ step: 'idle' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const enabled = !!user.totpEnabled;

  const reset = () => { setCode(''); setError(''); };

  const start = async () => {
    reset();
    setBusy(true);
    try {
      const s = await api.setupMfa();
      setFlow({ step: 'setup', secret: s.secret, qrSvg: s.qrSvg });
    } catch (err) {
      toast({ variant: 'destructive', title: t('Two-factor setup didn’t start'), description: errorText(err, t('Try again in a moment.')) });
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError(t('Enter the 6-digit code your app shows.'));
    setBusy(true);
    setError('');
    try {
      const { recoveryCodes } = await api.enableMfa(code);
      setFlow({ step: 'codes', codes: recoveryCodes });
      setCode('');
    } catch (err) {
      setError(errorText(err, t('That code didn’t work. Check the clock on your phone and try the next code.')));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    await refreshUser();
    setFlow({ step: 'idle' });
    toast({ title: t('Two-factor sign-in turned on'), description: t('Next time you sign in, we’ll ask for a code.') });
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setError(t('Enter a code from your app or a recovery code.'));
    setBusy(true);
    setError('');
    try {
      await api.disableMfa(code.trim());
      await refreshUser();
      reset();
      setFlow({ step: 'idle' });
      toast({ title: t('Two-factor sign-in turned off') });
    } catch (err) {
      setError(errorText(err, t('That code didn’t work. Try the next one from your app.')));
    } finally {
      setBusy(false);
    }
  };

  const downloadCodes = (codes: string[]) => {
    const text = `${t('OSIG recovery codes for {email}', { email: user.email })}\n${t('Each code works once.')}\n\n${codes.join('\n')}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'osig-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{t('Two-factor sign-in')}</p>
          <p className="text-sm text-muted-foreground">{t('Ask for a code from an authenticator app after your password.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusDot on={enabled}>{enabled ? t('On') : t('Off')}</StatusDot>
          {flow.step === 'idle' && (enabled ? (
            <Button size="sm" variant="outline" onClick={() => { reset(); setFlow({ step: 'disable' }); }}>{t('Turn off')}</Button>
          ) : (
            <Button size="sm" onClick={start} disabled={busy}>{busy ? t('Starting…') : t('Turn on')}</Button>
          ))}
        </div>
      </div>

      {flow.step === 'setup' && (
        <form onSubmit={confirm} className="mt-5 rounded-xl border bg-background p-5" noValidate>
          <ol className="space-y-5 text-sm">
            <li>
              <p className="font-medium">{t('1. Scan this code with your authenticator app')}</p>
              {/* oxlint-disable-next-line nextjs/no-img-element -- inline data: URI, nothing to optimise */}
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(flow.qrSvg)}`}
                alt={t('QR code to add OSIG to your authenticator app')}
                width={176}
                height={176}
                className="mt-3 rounded-lg border bg-white p-2"
              />
            </li>
            <li>
              <p className="font-medium">{t('Can’t scan it? Enter this key instead')}</p>
              <div className="mt-2 flex items-center gap-1 rounded-lg border bg-card px-3 py-2">
                <code className="min-w-0 flex-1 break-all font-mono text-sm">{flow.secret}</code>
                <CopyButton value={flow.secret} label={t('Copy key')} icon={ClipboardDocumentIcon} />
              </div>
            </li>
            <li className="space-y-2">
              <Label htmlFor="totpConfirm" className="font-medium">{t('2. Enter the 6-digit code it shows')}</Label>
              <Input
                id="totpConfirm"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="max-w-40 bg-card font-mono tracking-[0.3em]"
              />
            </li>
          </ol>
          {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || code.length !== 6}>{busy ? t('Checking…') : t('Turn on two-factor sign-in')}</Button>
            <Button type="button" variant="ghost" onClick={() => { reset(); setFlow({ step: 'idle' }); }}>{t('Cancel')}</Button>
          </div>
        </form>
      )}

      {flow.step === 'codes' && (
        <div className="mt-5 rounded-xl border border-trace/40 bg-background p-5">
          <p className="font-medium">{t('Save your recovery codes')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('If you lose your phone, each code signs you in once.')} <span className="mark">{t('We won’t show them again.')}</span>
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-sm">
            {flow.codes.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton value={flow.codes.join('\n')} label={t('Copy codes')} icon={ClipboardDocumentIcon} showLabel className="border" />
            <button
              type="button"
              onClick={() => downloadCodes(flow.codes)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowDownTrayIcon className="h-4 w-4" /> {t('Download .txt')}
            </button>
          </div>
          <Button className="mt-5" onClick={finish}>{t('I’ve saved them')}</Button>
        </div>
      )}

      {flow.step === 'disable' && (
        <form onSubmit={disable} className="mt-5 rounded-xl border bg-background p-5" noValidate>
          <Label htmlFor="totpDisable">{t('Code from your app, or a recovery code')}</Label>
          <Input
            id="totpDisable"
            autoComplete="one-time-code"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 max-w-56 bg-card font-mono"
          />
          {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" variant="destructive" disabled={busy || !code.trim()}>{busy ? t('Turning off…') : t('Turn off two-factor sign-in')}</Button>
            <Button type="button" variant="ghost" onClick={() => { reset(); setFlow({ step: 'idle' }); }}>{t('Cancel')}</Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function SignOutEverywhere() {
  const { toast } = useToast();
  const t = useT();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!window.confirm(t('Sign out on every device, including this one?'))) return;
    setBusy(true);
    try {
      await api.logoutAll();
      toast({ title: t('Signed out everywhere') });
      signOutHere();
    } catch (err) {
      setBusy(false);
      toast({ variant: 'destructive', title: t('You weren’t signed out'), description: errorText(err, t('Try again in a moment.')) });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-medium">{t('Sessions')}</p>
        <p className="text-sm text-muted-foreground">{t('Lost a device? End every session, including this one.')}</p>
      </div>
      <Button size="sm" variant="outline" onClick={run} disabled={busy}>{busy ? t('Signing out…') : t('Sign out everywhere')}</Button>
    </div>
  );
}

export function SecuritySection() {
  const t = useT();
  return (
    <section className="rounded-2xl border bg-card p-6 md:p-8">
      <h2 className="font-display text-xl font-semibold">{t('Security')}</h2>
      <p className="mb-2 mt-1 text-sm text-muted-foreground">{t('How you prove it’s you.')}</p>
      <div className="divide-y">
        <div className="py-5"><EmailStatus /></div>
        <div className="py-5"><TwoFactor /></div>
        <div className="pt-5"><SignOutEverywhere /></div>
      </div>
    </section>
  );
}
