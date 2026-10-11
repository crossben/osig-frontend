'use client';

// Plan comparison shared by the billing page and the landing page, plus the
// money and limit formatting both need.

import type { ReactNode } from 'react';
import type { BillingCurrency, BillingPlan, PlanLimits } from '@/types';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';

/** Where Enterprise requests go */
export const CONTACT_EMAIL = 'sales@osig.example';

/** Limits at or above this are shown as unlimited */
export const UNLIMITED = 1_000_000;

export const RECOMMENDED_PLAN = 'pro';

/** Minor units to a localised amount: XOF has no decimals, USD is in cents */
export function formatMoney(amount: number, currency: BillingCurrency | string, locale: string): string {
  const cents = currency === 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: cents ? (amount % 100 === 0 ? 0 : 2) : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(cents ? amount / 100 : amount);
}

export function useMoney() {
  const locale = useLocale();
  return (amount: number, currency: BillingCurrency | string) => formatMoney(amount, currency, locale);
}

type Row = { label: string; value: (l: PlanLimits) => ReactNode };

function useRows(): Row[] {
  const t = useT();
  const yes = <span>{t('Yes')}</span>;
  const no = <span className="text-muted-foreground">{t('No')}</span>;
  const num = (n: number) => (n >= UNLIMITED ? t('Unlimited') : n.toLocaleString());
  return [
    { label: 'Scans per day', value: (l) => num(l.dailyScans) },
    { label: 'Deep scans', value: (l) => (l.deepScans ? yes : no) },
    { label: 'Watches', value: (l) => (l.watches ? num(l.watches) : no) },
    { label: 'Watch checks as often as', value: (l) => (l.watches ? t('Every {n} h', { n: l.minWatchIntervalHours }) : '—') },
    { label: 'Bulk scans', value: (l) => (l.bulkMax ? t('Up to {n} targets', { n: l.bulkMax }) : no) },
    { label: 'PDF and JSON exports', value: (l) => (l.exports ? yes : no) },
    { label: 'Share links', value: (l) => (l.sharing ? yes : no) },
    { label: 'API keys', value: (l) => (l.apiKeys ? num(l.apiKeys) : no) },
    { label: 'History kept', value: (l) => (l.maxRetentionDays ? t('{n} days', { n: l.maxRetentionDays }) : t('Until you delete it')) },
  ];
}

/** Monthly price, in one currency or both */
export function PlanPrice({ plan, currency }: { plan: BillingPlan; currency?: BillingCurrency }) {
  const t = useT();
  const money = useMoney();
  if (plan.slug === 'free') return <span>{t('Free')}</span>;
  if (!plan.selfServe) return <span className="text-muted-foreground">{t('Contact us')}</span>;
  const currencies = (currency ? [currency] : (['XOF', 'USD'] as const)).filter((c) => plan.prices[c]);
  if (!currencies.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-col">
      {currencies.map((c, i) => (
        <span key={c} className={cn(i > 0 && 'text-sm font-normal text-muted-foreground')}>
          {t('{price} a month', { price: money(plan.prices[c]!.month, c) })}
        </span>
      ))}
    </span>
  );
}

/** Limits as plain rows, one column per plan; the recommended column is outlined */
export function PlanComparison({
  plans,
  currency,
  currentPlan,
  footer,
}: {
  plans: BillingPlan[];
  currency?: BillingCurrency;
  currentPlan?: string;
  footer?: (plan: BillingPlan) => ReactNode;
}) {
  const t = useT();
  const rows = useRows();
  const sorted = [...plans].sort((a, b) => a.rank - b.rank);
  const rec = (p: BillingPlan) => p.slug === RECOMMENDED_PLAN;
  const cell = (p: BillingPlan) => cn('px-4 py-3 align-top', rec(p) && 'bg-trace-soft/60 border-x border-trace/40');

  return (
    <div className="max-w-full overflow-x-auto rounded-2xl border bg-card" data-lenis-prevent>
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead>
          <tr>
            <th className="w-[34%] px-4 pb-3 pt-5 align-bottom text-xs font-medium text-muted-foreground">
              <span className="sr-only">{t('Limit')}</span>
            </th>
            {sorted.map((p) => (
              <th key={p.slug} scope="col" className={cn(cell(p), 'pb-3 pt-5 align-bottom', rec(p) && 'border-t-2 border-t-trace')}>
                <span className="block text-xs font-medium text-trace">
                  {rec(p) ? t('Recommended') : ' '}
                </span>
                <span className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-xl font-bold">{t(p.name)}</span>
                  {currentPlan === p.slug && <span className="text-xs font-normal text-muted-foreground">{t('Your plan')}</span>}
                </span>
                <span className="mt-1 block font-semibold"><PlanPrice plan={p} currency={currency} /></span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y border-t">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="px-4 py-3 font-normal text-muted-foreground">{t(r.label)}</th>
              {sorted.map((p) => (
                <td key={p.slug} className={cn(cell(p), 'tabular-nums')}>{r.value(p.limits)}</td>
              ))}
            </tr>
          ))}
          {footer && (
            <tr>
              <th scope="row" className="px-4 py-4"><span className="sr-only">{t('Choose a plan')}</span></th>
              {sorted.map((p) => (
                <td key={p.slug} className={cn(cell(p), 'py-4', rec(p) && 'border-b-2 border-b-trace')}>{footer(p)}</td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
