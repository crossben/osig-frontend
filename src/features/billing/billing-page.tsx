'use client';

// Billing: current plan and usage, plan comparison, buying or renewing a
// self-serve plan through Yoon, the return from checkout, and payment history.

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';
import type { BillingMe, BillingPeriod, BillingPlan, BillingPlans, Payment, PaymentStatus } from '@/types';
import { CONTACT_EMAIL, PlanComparison, UNLIMITED, useMoney } from './plan-table';

const PERIODS: { value: BillingPeriod; label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: '3 months' },
  { value: 'half', label: '6 months' },
  { value: 'year', label: 'Yearly' },
];
const PERIOD_LABEL: Record<BillingPeriod, string> = { month: 'Monthly', quarter: '3 months', half: '6 months', year: 'Yearly' };

/** Country sent for "Elsewhere": any non-XOF country gets card payment in USD */
const ELSEWHERE = 'US';

const POLL_MS = 2000;
const POLL_LIMIT_MS = 60_000;

const DAY = 86_400_000;
// Calendar periods (Yoon subscriptions): a month ends on the same day next month
const PERIOD_LENGTH: Record<BillingPeriod, string> = {
  month: '1 month', quarter: '3 months', half: '6 months', year: '1 year',
};

function readParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const q = window.location.hash.split('?')[1];
  return q ? new URLSearchParams(q).get(name) : null;
}

// What the plan looked like before leaving for Yoon's checkout, to tell when it changed
const SNAPSHOT_KEY = 'osig-billing-before-checkout';
type Snapshot = { plan: string; expiresAt: string | null };
function saveSnapshot(s: Snapshot) {
  try { sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}
function takeSnapshot(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    sessionStorage.removeItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

function useCountryName() {
  const locale = useLocale();
  return useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      names = null;
    }
    return (code: string) => names?.of(code) ?? code;
  }, [locale]);
}

export function BillingPage() {
  const t = useT();
  const plansQ = useQuery({ queryKey: ['billing', 'plans'], queryFn: () => api.getBillingPlans() });
  const meQ = useQuery({ queryKey: ['billing', 'me'], queryFn: () => api.getBillingMe() });
  const [subscribed, setSubscribed] = useState(() => readParam('subscribed') === '1');

  return (
    <div className="w-full min-w-0">
      <PageHeader title={t('Billing')} description={t('Your plan, what it allows, and your payments.')} />

      {subscribed && <SubscriptionReturn onDone={() => setSubscribed(false)} />}

      {meQ.isLoading || plansQ.isLoading ? (
        <Skeleton className="h-56 w-full rounded-2xl" />
      ) : meQ.error || plansQ.error || !meQ.data || !plansQ.data ? (
        <p className="rounded-2xl border bg-card p-6 text-sm text-destructive">
          {t('Billing couldn’t be loaded. Reload the page to try again.')}
        </p>
      ) : (
        <>
          <CurrentPlan me={meQ.data} plans={plansQ.data} />
          <Plans me={meQ.data} plans={plansQ.data} />
          <History payments={meQ.data.payments} />
        </>
      )}
    </div>
  );
}

// ── Return from Yoon's checkout (subscriptions) ───────
// Access is granted by Yoon's signed webhook; here we only ask OSIG to re-read the
// subscription from Yoon until the plan or its end date changes.
function SubscriptionReturn({ onDone }: { onDone: () => void }) {
  const t = useT();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [before] = useState(takeSnapshot);
  const [started] = useState(() => Date.now());
  const [state, setState] = useState<'waiting' | 'done' | 'slow'>('waiting');
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    window.history.replaceState(null, '', '#/billing');
    let stop = false;
    const tick = async () => {
      if (stop) return;
      try {
        const now = await api.syncSubscription();
        const changed = !before || now.plan !== before.plan || now.expiresAt !== before.expiresAt;
        if (changed && now.plan !== 'free') {
          setPlanName(now.plan === 'enterprise' ? 'Enterprise' : 'Pro');
          setState('done');
          queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
          queryClient.invalidateQueries({ queryKey: ['quotaStatus'] });
          api.getCurrentUser().then(setUser).catch(() => {});
          return;
        }
      } catch {
        /* keep polling: the webhook may still arrive */
      }
      if (Date.now() - started > POLL_LIMIT_MS) {
        setState('slow');
        queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
        return;
      }
      setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => { stop = true; };
  }, [before, started, queryClient, setUser]);

  const done = state === 'done';
  return (
    <div role="status" aria-live="polite"
      className={cn('mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center', done ? 'border-success/60' : 'border-trace/50')}>
      {done ? <CheckCircleIcon className="h-6 w-6 shrink-0 text-success" /> : <ClockIcon className={cn('h-6 w-6 shrink-0 text-trace', state === 'waiting' && 'animate-pulse')} />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {done ? t('Payment received. {plan} is active.', { plan: t(planName) })
            : state === 'slow' ? t('Your payment is still being confirmed')
            : t('Waiting for the payment to be confirmed…')}
        </p>
        <p className="text-sm text-muted-foreground">
          {done ? t('Your plan and limits below are up to date.')
            : state === 'slow' ? t('The plan updates by itself as soon as the payment is confirmed. If you didn’t finish paying, choose a plan below to try again.')
            : t('This usually takes a few seconds. You can leave this page; the plan starts as soon as the payment is confirmed.')}
        </p>
      </div>
      {state !== 'waiting' && <Button variant="outline" onClick={onDone}>{t('Dismiss')}</Button>}
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const t = useT();
  const unlimited = limit >= UNLIMITED;
  const pct = unlimited || limit <= 0 ? 0 : Math.min(100, (used / limit) * 100);
  const full = !unlimited && used >= limit;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {unlimited ? t('{used} of unlimited', { used }) : limit <= 0 ? t('Not included') : t('{used} of {limit}', { used, limit })}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={cn('h-full rounded-full', full ? 'bg-destructive' : 'bg-trace')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Stop or restart renewing a Yoon subscription (nothing is ever charged automatically:
// "renewing" means we send a renewal invoice and reminders at the end of each period).
function RenewalControls({ me, expires }: { me: BillingMe; expires: Date | null }) {
  const t = useT();
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const done = (title: string) => {
    toast({ title });
    queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
  };
  const fail = (e: Error) => toast({ variant: 'destructive', title: t('That didn’t work'), description: e.message });
  const cancel = useMutation({ mutationFn: () => api.cancelSubscription(), onSuccess: () => done(t('Renewal stopped')), onError: fail });
  const resume = useMutation({ mutationFn: () => api.resumeSubscription(), onSuccess: () => done(t('Renewal restarted')), onError: fail });
  const when = expires ? expires.toLocaleDateString(locale, { dateStyle: 'long' }) : '';

  if (me.cancelAtPeriodEnd) {
    return (
      <div className="mt-3 rounded-lg border bg-background px-3 py-2 text-sm">
        <p>{t('Renewal is off: your plan ends on {date} and you won’t get a renewal invoice.', { date: when })}</p>
        <Button size="sm" variant="outline" className="mt-2" disabled={resume.isPending} onClick={() => resume.mutate()}>
          {t('Keep renewing')}
        </Button>
      </div>
    );
  }
  return (
    <Button size="sm" variant="ghost" className="mt-3 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      disabled={cancel.isPending}
      onClick={() => {
        if (window.confirm(t('Stop renewing? Your plan keeps running until {date}, then you move to Free. Payments aren’t refunded.', { date: when }))) cancel.mutate();
      }}>
      {t('Stop renewing')}
    </Button>
  );
}

function CurrentPlan({ me, plans }: { me: BillingMe; plans: BillingPlans }) {
  const t = useT();
  const locale = useLocale();
  const date = (d: Date) => d.toLocaleDateString(locale, { dateStyle: 'long' });
  const planName = (slug: string | null) => t(plans.plans.find((p) => p.slug === slug)?.name ?? slug ?? '');

  const expires = me.expiresAt ? new Date(me.expiresAt) : null;
  const [now] = useState(() => Date.now());
  const expired = expires ? expires.getTime() < now : false;
  const graceEnd = expires ? new Date(expires.getTime() + me.graceDays * DAY) : null;

  let term: string;
  if (me.plan === 'free') term = t('Free plan, no end date.');
  else if (!expires) term = t('No end date.');
  else if (expired) term = t('Ended on {date}.', { date: date(expires) });
  else if (me.subscription && !me.cancelAtPeriodEnd) term = t('Renew by {date} to keep it.', { date: date(expires) });
  else term = t('Ends on {date}.', { date: date(expires) });

  return (
    <section className="grid gap-6 rounded-2xl border bg-card p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{t('Current plan')}</p>
        <h2 className="mt-1 font-display text-4xl font-bold">{planName(me.plan)}</h2>
        <p className="mt-2">{term}</p>
        {me.source === 'comp' && me.plan !== 'free' && (
          <p className="mt-1 text-sm text-muted-foreground">{t('Granted by an administrator.')}</p>
        )}
        {expired && graceEnd && graceEnd.getTime() > now && (
          <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
            {t('Your limits stay in place until {date}. Renew before then to keep them.', { date: date(graceEnd) })}
          </p>
        )}
        {me.subscription && me.plan !== 'free' && <RenewalControls me={me} expires={expires} />}
        {me.pendingPlan && (
          <p className="mt-3 rounded-lg border bg-background px-3 py-2 text-sm">
            {me.pendingPlanDays
              ? t('{plan} ({days} days) starts when your current plan ends.', { plan: planName(me.pendingPlan), days: me.pendingPlanDays })
              : me.subscription
              ? t('{plan} starts when your current period ends.', { plan: planName(me.pendingPlan) })
              : t('{plan} starts when your current plan ends.', { plan: planName(me.pendingPlan) })}
          </p>
        )}
      </div>
      <div className="min-w-0 space-y-5">
        <Meter label={t('Scans today')} used={me.usage.scansToday} limit={me.usage.dailyScans} />
        <Meter label={t('Watches')} used={me.usage.watches} limit={me.limits.watches} />
        <Meter label={t('API keys')} used={me.usage.apiKeys} limit={me.limits.apiKeys} />
        <p className="text-xs text-muted-foreground">{t('The daily scan count resets at midnight UTC.')}</p>
      </div>
    </section>
  );
}

// ── Plans and checkout ────────────────────────────────
function Plans({ me, plans }: { me: BillingMe; plans: BillingPlans }) {
  const t = useT();
  const countryName = useCountryName();
  const money = useMoney();
  const { toast } = useToast();
  const emailVerified = useAuthStore((s) => s.user?.emailVerified) !== false;

  const buyable = plans.plans.filter((p) => p.selfServe && Object.keys(p.prices).length > 0);
  const [planSlug, setPlanSlug] = useState(buyable[0]?.slug);
  const plan = buyable.find((p) => p.slug === planSlug) ?? buyable[0];
  const [period, setPeriod] = useState<BillingPeriod>('month');
  const [country, setCountry] = useState(me.country || 'SN');
  const currency = plans.xofCountries.includes(country) ? 'XOF' : 'USD';
  const prices = plan?.prices[currency];

  const countries = useMemo(
    () => [...plans.xofCountries].sort((a, b) => countryName(a).localeCompare(countryName(b))),
    [plans.xofCountries, countryName],
  );

  const queryClient = useQueryClient();
  const checkout = useMutation({
    mutationFn: () => api.subscribe(plan!.slug, period, country),
    onSuccess: (res) => {
      if (res.checkoutUrl) {
        saveSnapshot({ plan: me.plan, expiresAt: me.expiresAt });
        window.location.assign(res.checkoutUrl);
        return;
      }
      toast({ title: t('Change scheduled'), description: t('Your new plan starts when the current period ends. Nothing to pay now.') });
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: t('The payment couldn’t start'), description: e.message }),
  });

  const current = plans.plans.find((p) => p.slug === me.plan);
  const lower = plan && current && plan.rank < current.rank && me.expiresAt;
  const same = plan && plan.slug === me.plan && me.expiresAt;

  const footer = (p: BillingPlan) => {
    if (p.slug === 'free') return null;
    if (!p.selfServe) {
      return (
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('OSIG Enterprise')}`} className="text-sm font-medium text-trace underline-offset-4 hover:underline">
          {t('Contact us to set it up')}
        </a>
      );
    }
    if (!plans.enabled) return null;
    return (
      <Button size="sm" variant={p.slug === plan?.slug ? 'default' : 'outline'}
        onClick={() => { setPlanSlug(p.slug); document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth' }); }}>
        {p.slug === me.plan ? t('Renew {plan}', { plan: t(p.name) }) : t('Choose {plan}', { plan: t(p.name) })}
      </Button>
    );
  };

  return (
    <>
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">{t('Plans')}</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">{t('Prices shown for {country}.', { country: currency === 'XOF' ? countryName(country) : t('payment by card') })}</p>
        <PlanComparison plans={plans.plans} currency={currency} currentPlan={me.plan} footer={footer} />
      </section>

      {plan && prices && (
        <section id="buy" className="mt-10 scroll-mt-20 rounded-2xl border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold">
            {same ? t('Renew {plan}', { plan: t(plan.name) }) : t('Buy {plan}', { plan: t(plan.name) })}
          </h2>

          {!plans.enabled ? (
            <p className="mt-3 text-muted-foreground">
              {t('Online payment isn’t available yet. To upgrade now, write to {email}.', { email: CONTACT_EMAIL })}
            </p>
          ) : (
            <>
              <fieldset className="mt-6">
                <legend className="text-sm font-medium">{t('How long')}</legend>
                <div role="radiogroup" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {PERIODS.map(({ value, label }) => {
                    const active = period === value;
                    const twoFree = value === 'year' && prices.year === prices.month * 10;
                    return (
                      <button key={value} type="button" role="radio" aria-checked={active} onClick={() => setPeriod(value)}
                        className={cn('rounded-xl border bg-background p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-trace',
                          active ? 'border-trace ring-1 ring-trace' : 'hover:border-trace/60')}>
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold">{t(label)}</span>
                          {twoFree && <span className="text-xs font-medium text-trace">{t('2 months free')}</span>}
                        </span>
                        <span className="mt-1 block font-display text-xl font-bold tabular-nums">{money(prices[value], currency)}</span>
                        <span className="block text-xs text-muted-foreground">{t(PERIOD_LENGTH[value])}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-6 max-w-sm">
                <Label htmlFor="billing-country" className="text-sm font-medium">{t('Where you pay from')}</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="billing-country" className="mt-2 w-full bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{t('{country} (mobile money, FCFA)', { country: countryName(c) })}</SelectItem>
                    ))}
                    <SelectItem value={ELSEWHERE}>{t('Elsewhere (card, USD)')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ul className="mt-6 space-y-1.5 text-sm text-muted-foreground">
                <li>{t('Paying again before your plan ends adds the new time to what you have left.')}</li>
                <li>{t('Paying for a lower plan while a higher one runs queues it to start when the higher one ends.')}</li>
                {lower && <li className="text-foreground">{t('{plan} will start when your current plan ends.', { plan: t(plan.name) })}</li>}
              </ul>

              <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center">
                <Button size="lg" disabled={checkout.isPending || !emailVerified} onClick={() => checkout.mutate()}>
                  {checkout.isPending ? t('Opening the payment page…') : t('Pay {amount}', { amount: money(prices[period], currency) })}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {emailVerified
                    ? t('You’ll finish on the Yoon payment page, then come back here.')
                    : t('Confirm your email first: open the link we sent you, then come back to pay.')}
                </p>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {t('Payments run through')}{' '}
                <a href="https://yoonpay.benhattab.pro" target="_blank" rel="noopener noreferrer" className="font-medium text-trace hover:underline">Yoon</a>
                {', '}{t('an open-source payment gateway for Wave, Orange Money, Free Money and cards. OSIG never sees your card or wallet details.')}
              </p>
            </>
          )}
        </section>
      )}
    </>
  );
}

// ── Payment history ───────────────────────────────────
const STATUS: Record<PaymentStatus, { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'text-success' },
  pending: { label: 'Waiting', cls: 'text-muted-foreground' },
  failed: { label: 'Failed', cls: 'text-destructive' },
  expired: { label: 'Expired', cls: 'text-muted-foreground' },
};

function History({ payments }: { payments: Payment[] }) {
  const t = useT();
  const locale = useLocale();
  const money = useMoney();
  const th = 'whitespace-nowrap border-b px-4 py-3 text-xs font-medium text-muted-foreground';
  const td = 'whitespace-nowrap px-4 py-2.5';
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-2xl font-semibold">{t('Payments')}</h2>
      <div className="max-w-full overflow-x-auto rounded-2xl border bg-card" data-lenis-prevent>
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr>{['Date', 'Plan', 'Period', 'Amount', 'Method', 'Status'].map((h) => <th key={h} className={th}>{t(h)}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {!payments.length ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">{t('No payments yet.')}</td></tr>
            ) : payments.map((p) => (
              <tr key={p.reference} title={p.reference}>
                <td className={`${td} text-muted-foreground`}>{new Date(p.paidAt ?? p.createdAt).toLocaleDateString(locale, { dateStyle: 'medium' })}</td>
                <td className={td}>{t(p.plan === 'pro' ? 'Pro' : p.plan === 'enterprise' ? 'Enterprise' : 'Free')}</td>
                <td className={td}>{t(PERIOD_LABEL[p.period] ?? p.period)}</td>
                <td className={`${td} tabular-nums`}>{money(p.amount, p.currency)}</td>
                <td className={`${td} text-muted-foreground`}>{p.method ?? '—'}</td>
                <td className={cn(td, STATUS[p.status]?.cls)}>{t(STATUS[p.status]?.label ?? p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
