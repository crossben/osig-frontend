'use client';

// Admin billing: granting plans, the payments ledger, and plan prices/limits.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';
import type { AdminUser, BillingCurrency, BillingPeriod, BillingPlan, PlanLimits, PlanSlug } from '@/types';
import { useMoney } from '@/features/billing/plan-table';

const th = 'whitespace-nowrap border-b px-4 py-3 text-xs font-medium text-muted-foreground';
const td = 'whitespace-nowrap px-4 py-2.5 align-middle';

// ── Grant plan (Users tab) ────────────────────────────
export function GrantPlan({ user }: { user: AdminUser }) {
  const t = useT();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<PlanSlug>('pro');
  const [days, setDays] = useState('');

  const grant = useMutation({
    mutationFn: () => api.adminGrantPlan(user.id, plan, days.trim() ? Number(days) : undefined),
    onSuccess: () => {
      setOpen(false);
      setDays('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: t('Plan granted'), description: user.email });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: t('Plan not granted'), description: e.message }),
  });
  const badDays = days.trim() !== '' && !(Number.isInteger(Number(days)) && Number(days) > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">{t('Grant plan')}</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!badDays) grant.mutate(); }}>
          <p className="text-sm font-medium">{t('Grant a plan to {email}', { email: user.email })}</p>
          <div className="space-y-1.5">
            <Label htmlFor={`grant-plan-${user.id}`} className="text-xs">{t('Plan')}</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as PlanSlug)}>
              <SelectTrigger id={`grant-plan-${user.id}`} size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{t('Free')}</SelectItem>
                <SelectItem value="pro">{t('Pro')}</SelectItem>
                <SelectItem value="enterprise">{t('Enterprise')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`grant-days-${user.id}`} className="text-xs">{t('Days')}</Label>
            <Input id={`grant-days-${user.id}`} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)}
              placeholder={t('Blank for no end date')} aria-invalid={badDays} />
            {badDays && <p className="text-xs text-destructive">{t('Enter a whole number of days, or leave it blank.')}</p>}
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={grant.isPending || badDays}>
            {grant.isPending ? t('Granting…') : t('Grant')}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// ── Payments tab ──────────────────────────────────────
const STATUS_CLS: Record<string, string> = { paid: 'text-success', failed: 'text-destructive' };
const STATUS_LABEL: Record<string, string> = { paid: 'Paid', pending: 'Waiting', failed: 'Failed', expired: 'Expired' };
const PERIOD_LABEL: Record<string, string> = { month: 'Monthly', quarter: '3 months', half: '6 months', year: 'Yearly' };

export function AdminPayments() {
  const t = useT();
  const locale = useLocale();
  const money = useMoney();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'payments'], queryFn: () => api.adminPayments() });
  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  return (
    <div className="rounded-2xl border bg-card">
      <div className="max-w-full overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr>{['Time', 'User', 'Plan', 'Period', 'Amount', 'Country', 'Method', 'Status', 'Reference'].map((h) => <th key={h} className={th}>{t(h)}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {!data?.length ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">{t('No payments yet.')}</td></tr>
            ) : data.map((p) => (
              <tr key={p.reference}>
                <td className={`${td} text-muted-foreground`}>{new Date(p.createdAt).toLocaleString(locale)}</td>
                <td className={td}>{p.email ?? '—'}</td>
                <td className={td}>{t(p.plan === 'pro' ? 'Pro' : p.plan === 'enterprise' ? 'Enterprise' : 'Free')}</td>
                <td className={td}>{t(PERIOD_LABEL[p.period] ?? p.period)}</td>
                <td className={`${td} tabular-nums`}>{money(p.amount, p.currency)}</td>
                <td className={td}>{p.country ?? '—'}</td>
                <td className={`${td} text-muted-foreground`}>{p.method ?? '—'}</td>
                <td className={cn(td, STATUS_CLS[p.status])} title={p.failureReason ?? undefined}>
                  {t(STATUS_LABEL[p.status] ?? p.status)}
                  {p.failureReason && <span className="ml-2 text-xs text-muted-foreground">{p.failureReason.length > 40 ? `${p.failureReason.slice(0, 40)}…` : p.failureReason}</span>}
                </td>
                <td className={`${td} font-mono text-xs text-muted-foreground`}>{p.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Plans tab ─────────────────────────────────────────
const CURRENCIES: BillingCurrency[] = ['XOF', 'USD'];
const PERIODS: BillingPeriod[] = ['month', 'quarter', 'half', 'year'];
const NUM_LIMITS: { key: keyof PlanLimits; label: string }[] = [
  { key: 'dailyScans', label: 'Scans per day' },
  { key: 'watches', label: 'Watches' },
  { key: 'minWatchIntervalHours', label: 'Shortest watch interval (hours)' },
  { key: 'bulkMax', label: 'Bulk scan targets' },
  { key: 'apiKeys', label: 'API keys' },
  { key: 'maxRetentionDays', label: 'History kept (days, blank = forever)' },
];
const BOOL_LIMITS: { key: keyof PlanLimits; label: string }[] = [
  { key: 'deepScans', label: 'Deep scans' },
  { key: 'exports', label: 'Exports' },
  { key: 'sharing', label: 'Sharing' },
];

export function AdminPlans() {
  const t = useT();
  const { data, isLoading } = useQuery({ queryKey: ['billing', 'plans'], queryFn: () => api.getBillingPlans() });
  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (!data) return <p className="text-sm text-destructive">{t('Plans couldn’t be loaded. Reload the page to try again.')}</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('Prices are in minor units: FCFA has no decimals (5000 = 5 000 FCFA), dollars are in cents (900 = $9.00).')}
      </p>
      <div className="grid gap-4 xl:grid-cols-3">
        {[...data.plans].sort((a, b) => a.rank - b.rank).map((p) => <PlanEditor key={p.slug} plan={p} />)}
      </div>
    </div>
  );
}

function PlanEditor({ plan }: { plan: BillingPlan }) {
  const t = useT();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(plan.name);
  const [selfServe, setSelfServe] = useState(plan.selfServe);
  const [prices, setPrices] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(CURRENCIES.map((c) => [c, Object.fromEntries(PERIODS.map((p) => [p, plan.prices[c]?.[p]?.toString() ?? '']))])),
  );
  const [limits, setLimits] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries([
      ...NUM_LIMITS.map(({ key }) => [key, plan.limits[key] == null ? '' : String(plan.limits[key])]),
      ...BOOL_LIMITS.map(({ key }) => [key, Boolean(plan.limits[key])]),
    ]),
  );

  const isInt = (v: string) => /^\d+$/.test(v.trim());
  const priceErr = CURRENCIES.some((c) => {
    const vals = PERIODS.map((p) => prices[c][p].trim());
    return vals.some((v) => v && !isInt(v)) || (vals.some(Boolean) && !vals.every(Boolean));
  });
  const limitErr = NUM_LIMITS.some(({ key }) => {
    const v = String(limits[key]).trim();
    return key === 'maxRetentionDays' ? v !== '' && !isInt(v) : !isInt(v);
  });

  const save = useMutation({
    mutationFn: () => {
      const outPrices: BillingPlan['prices'] = {};
      for (const c of CURRENCIES) {
        if (PERIODS.every((p) => prices[c][p].trim())) {
          outPrices[c] = Object.fromEntries(PERIODS.map((p) => [p, Number(prices[c][p])])) as Record<BillingPeriod, number>;
        }
      }
      const outLimits: Partial<PlanLimits> = {};
      for (const { key } of NUM_LIMITS) {
        const v = String(limits[key]).trim();
        (outLimits as Record<string, unknown>)[key] = v === '' ? null : Number(v);
      }
      for (const { key } of BOOL_LIMITS) (outLimits as Record<string, unknown>)[key] = limits[key];
      return api.adminUpdatePlan(plan.slug, { name: name.trim() || plan.name, selfServe, prices: outPrices, limits: outLimits });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      toast({ title: t('Plan saved'), description: name });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: t('Plan not saved'), description: e.message }),
  });

  return (
    <section className="min-w-0 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
        <span className="font-mono text-xs text-muted-foreground">{plan.slug}</span>
      </div>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor={`plan-name-${plan.slug}`} className="text-xs">{t('Name')}</Label>
        <Input id={`plan-name-${plan.slug}`} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <label className="mt-3 flex items-center justify-between gap-3 text-sm">
        {t('Sold online')}
        <Switch checked={selfServe} onCheckedChange={setSelfServe} />
      </label>

      <h4 className="mt-5 text-sm font-medium">{t('Prices')}</h4>
      <div className="mt-2 grid grid-cols-[3rem_repeat(4,minmax(0,1fr))] gap-1.5 text-xs">
        <span />
        {PERIODS.map((p) => <span key={p} className="text-muted-foreground">{t(PERIOD_LABEL[p])}</span>)}
        {CURRENCIES.map((c) => (
          <div key={c} className="contents">
            <span className="self-center font-mono">{c}</span>
            {PERIODS.map((p) => (
              <Input key={p} inputMode="numeric" className="h-8 px-2 text-xs" aria-label={`${c} ${t(PERIOD_LABEL[p])}`}
                value={prices[c][p]} onChange={(e) => setPrices((s) => ({ ...s, [c]: { ...s[c], [p]: e.target.value } }))} />
            ))}
          </div>
        ))}
      </div>
      {priceErr && <p className="mt-1 text-xs text-destructive">{t('Fill all four periods of a currency with whole numbers, or leave all four blank.')}</p>}

      <h4 className="mt-5 text-sm font-medium">{t('Limits')}</h4>
      <div className="mt-2 space-y-2">
        {NUM_LIMITS.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 text-muted-foreground">{t(label)}</span>
            <Input inputMode="numeric" className="h-8 w-28 shrink-0 text-right" value={String(limits[key])}
              onChange={(e) => setLimits((s) => ({ ...s, [key]: e.target.value }))} />
          </label>
        ))}
        {BOOL_LIMITS.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t(label)}</span>
            <Switch checked={Boolean(limits[key])} onCheckedChange={(v) => setLimits((s) => ({ ...s, [key]: v }))} />
          </label>
        ))}
      </div>
      {limitErr && <p className="mt-1 text-xs text-destructive">{t('Limits must be whole numbers.')}</p>}

      <Button className="mt-5 w-full" disabled={save.isPending || priceErr || limitErr} onClick={() => save.mutate()}>
        {save.isPending ? t('Saving…') : t('Save {plan}', { plan: plan.name })}
      </Button>
    </section>
  );
}
