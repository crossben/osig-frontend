'use client';

// Slim notice above page content while the account's email isn't confirmed.

import { useEffect, useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { errorText } from '@/features/auth/auth-errors';
import { useAuthStore } from '@/store';
import { useT } from '@/lib/i18n';

export function VerifyEmailBanner() {
  const { toast } = useToast();
  const t = useT();
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  // The link may have been opened on another device: check once with the server
  useEffect(() => {
    let live = true;
    api.getCurrentUser()
      .then((u) => { if (live && u.emailVerified) useAuthStore.getState().setUser(u); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  const resend = async () => {
    setState('sending');
    try {
      await api.resendVerification();
      setState('sent');
      toast({ title: t('Link resent'), description: t('Check your inbox, and your spam folder.') });
    } catch (err) {
      setState('idle');
      toast({ variant: 'destructive', title: t('The link wasn’t resent'), description: errorText(err, t('Try again in a moment.')) });
    }
  };

  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-xl border border-trace/30 bg-trace/5 px-4 py-3 text-sm sm:flex-row sm:items-center">
      <EnvelopeIcon className="hidden h-5 w-5 shrink-0 text-trace sm:block" aria-hidden />
      <p className="flex-1">
        <span className="font-medium">{t('Confirm your email to run scans.')}</span>{' '}
        <span className="text-muted-foreground">{t('Open the link we sent you. It also unlocks bulk scans and sharing.')}</span>
      </p>
      <Button size="sm" variant="outline" onClick={resend} disabled={state !== 'idle'} className="shrink-0 bg-card">
        {state === 'sending' ? t('Resending…') : state === 'sent' ? t('Link resent') : t('Resend the link')}
      </Button>
    </div>
  );
}
