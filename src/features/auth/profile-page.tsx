// ============================================
// Profile Page Component
// ============================================

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/layout/page-header';
import { useAuthStore } from '@/store';
import { useQuotaStatus } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { PasswordForm, ProfileForm } from './account-forms';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const planNames: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };

export function ProfilePage() {
  const { user } = useAuthStore();
  const { data: quota } = useQuotaStatus();

  if (!user) {
    return <p className="py-16 text-center text-muted-foreground">Loading your account…</p>;
  }

  const unlimited = quota ? quota.dailyLimit >= 100000 : false;
  const usedPct = quota && !unlimited ? Math.min(100, (quota.usedToday / quota.dailyLimit) * 100) : 0;
  const initial = (user.fullName || user.username || 'U')[0]?.toUpperCase();

  const details = [
    { label: 'Username', value: user.username },
    { label: 'Email', value: user.email },
    { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString([], { dateStyle: 'long' }) },
    { label: 'Sign-in methods', value: [user.hasPassword !== false && 'Email and password', user.googleLinked && 'Google'].filter(Boolean).join(' · ') || '—' },
  ];

  return (
    <div className="w-full">
      <PageHeader title="Account" description="Your details and today's scan allowance." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl || ''} alt="" />
              <AvatarFallback className="bg-primary font-display text-2xl text-primary-foreground">{initial}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-semibold">{user.fullName || user.username}</h2>
              <p className="truncate text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <dl className="mt-8 divide-y border-y">
            {details.map((d) => (
              <div key={d.label} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                <dt className="text-sm text-muted-foreground">{d.label}</dt>
                <dd className="min-w-0 break-words">{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Plan</h2>
            <span className="rounded-full bg-primary px-3 py-0.5 text-sm font-medium text-primary-foreground">
              {(user.plan && planNames[user.plan]) || user.plan || 'Free'}
            </span>
          </div>

          {!quota ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading usage…</p>
          ) : unlimited ? (
            <p className="mt-6">Unlimited scans.</p>
          ) : (
            <>
              <p className="mt-6 font-display text-5xl font-bold tabular-nums">
                {quota.remaining}
                <span className="ml-2 font-sans text-base font-normal text-muted-foreground">
                  of {quota.dailyLimit} scans left today
                </span>
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className={cn('h-full rounded-full', quota.remaining === 0 ? 'bg-destructive' : 'bg-trace')}
                  style={{ width: `${100 - usedPct}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {quota.usedToday} used. The count resets at midnight UTC.
              </p>
            </>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold">Your details</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Shown in the sidebar and on reports you export.</p>
          <ProfileForm />
        </section>
        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold">Password</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Changing it signs out your other devices.</p>
          <PasswordForm />
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-6 md:p-8">
        <h2 className="font-display text-xl font-semibold">Optional data sources</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          These sources need an API key or a switch set by whoever runs this OSIG server, in its <span className="font-mono">.env</span> file.
        </p>
        <OptionalSources />
      </section>
    </div>
  );
}

function OptionalSources() {
  const { data } = useQuery({ queryKey: ['optionalSources'], queryFn: () => api.getOptionalSources() });
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {data.map((src) => (
        <li key={src.env} className="rounded-xl border bg-background p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{src.name}</span>
            <span className={cn('inline-flex items-center gap-1.5 text-xs', src.enabled ? 'text-success' : 'text-muted-foreground')}>
              <span aria-hidden className={cn('h-2 w-2 rounded-full', src.enabled ? 'bg-success' : 'bg-muted-foreground/50')} />
              {src.enabled ? 'On' : 'Off'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{src.adds}</p>
          {!src.enabled && <p className="mt-2 font-mono text-xs text-muted-foreground">{src.env}=…</p>}
        </li>
      ))}
    </ul>
  );
}
