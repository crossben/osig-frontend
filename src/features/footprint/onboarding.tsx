'use client';

// First visit: three steps to tell us what to watch.

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { Identity, IdentityKind } from '@/lib/api-me';
import { AddIdentityForm } from './identities-panel';
import { DeviceCard } from './device';

function Step({ n, title, hint, done, children }: {
  n: number; title: string; hint: string; done: Identity[]; children: React.ReactNode;
}) {
  const t = useT();
  return (
    <li className="group relative flex gap-4 pb-8 last:pb-0">
      <span aria-hidden="true" className="absolute left-4 top-9 bottom-0 w-px bg-border group-last:hidden" />
      <span className={cn('relative grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-bold',
        done.length ? 'border-success bg-success text-white' : 'border-trace bg-card text-trace')}>
        {done.length ? <CheckCircleIcon className="h-5 w-5" aria-hidden="true" /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-semibold leading-8">{title}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{hint}</p>
        {done.length > 0 && (
          <ul className="mb-3 space-y-1 text-sm">
            {done.map((i) => (
              <li key={i.id} className="flex items-center gap-2 break-all">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span>{i.value}</span>
                <span className="sr-only">{t('added')}</span>
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </li>
  );
}

export function Onboarding({ identities, onFinish }: { identities: Identity[]; onFinish: () => void }) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const of = (k: IdentityKind) => identities.filter((i) => i.kind === k);
  const hasEmail = of('email').some((i) => i.value === user?.email?.toLowerCase());

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="setup-title" className="rounded-2xl border bg-card p-5 sm:p-8">
        <h2 id="setup-title" className="font-display text-2xl font-semibold">{t('Let’s see what’s out there about you')}</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">
          {t('Tell us the addresses and names you use online. We check them every week for leaks, old accounts and public traces, and give you a short list of things to fix.')}
        </p>
        <ol className="mt-8">
          <Step n={1} title={t('Your email')} done={of('email')}
            hint={t('The one you use for most accounts. Already confirmed, since it’s your OSIG address.')}>
            {!hasEmail && (
              <AddIdentityForm kind="email" defaultValue={user?.email ?? ''} submitLabel={t('Watch this email')} />
            )}
          </Step>
          <Step n={2} title={t('Your phone number')} done={of('phone')}
            hint={t('You can add it now. Confirming it by text message is coming soon; until then we keep it but don’t watch it.')}>
            <AddIdentityForm kind="phone" submitLabel={t('Add number')} />
          </Step>
          <Step n={3} title={t('Usernames you use')} done={of('username')}
            hint={t('Gaming tags, social handles, forum names. Add as many as you like.')}>
            <AddIdentityForm kind="username" submitLabel={t('Add username')} />
          </Step>
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
          <Button onClick={onFinish} disabled={identities.length === 0}>{t('Show my score')}</Button>
          {identities.length === 0 && <p className="text-sm text-muted-foreground">{t('Add at least one thing to continue.')}</p>}
        </div>
      </section>
      <div className="space-y-6">
        <DeviceCard />
      </div>
    </div>
  );
}
