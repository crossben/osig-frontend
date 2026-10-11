// ============================================
// Compare two scans: which entities appeared or disappeared between them
// Route: #/compare?a=<scanId>&b=<scanId>
// ============================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowsRightLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useScans } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n';
import type { DiffEntity, Scan, ScanComparison } from '@/types';

function readParams() {
  const p = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return { a: p.get('a') || '', b: p.get('b') || '' };
}

function useCompareParams() {
  const [params, setParams] = useState(() => (typeof window === 'undefined' ? { a: '', b: '' } : readParams()));
  useEffect(() => {
    const on = () => setParams(readParams());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return params;
}

const go = (a: string, b: string) => {
  const q = new URLSearchParams();
  if (a) q.set('a', a);
  if (b) q.set('b', b);
  window.location.hash = `#/compare?${q.toString()}`;
};

const fmt = (iso: string, locale: string) => new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

const KIND_LABEL: Record<string, string> = {
  ip: 'IP addresses', subdomain: 'Subdomains', domain: 'Domains', nameserver: 'Nameservers',
  mailserver: 'Mail servers', email: 'Emails', network: 'Networks', location: 'Locations',
  organization: 'Organizations', service: 'Services', url: 'URLs', account: 'Accounts',
  breach: 'Breaches', port: 'Open ports', phone: 'Phones', person: 'People', lookalike: 'Lookalikes',
};
const kindLabel = (k: string) => KIND_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1);

const TYPE_LABEL: Record<string, string> = {
  email: 'email', username: 'username', domain: 'domain', phone: 'phone', ip: 'IP', organization: 'organization',
};
const scanSummary = (t: ReturnType<typeof useT>, s: { scanType: string; targetType: string }) =>
  t(s.scanType === 'deep' ? 'Deep {type} scan' : 'Quick {type} scan', { type: t(TYPE_LABEL[s.targetType] ?? s.targetType) });

function groupByKind(list: DiffEntity[]) {
  const m = new Map<string, DiffEntity[]>();
  for (const e of list) {
    if (!m.has(e.kind)) m.set(e.kind, []);
    m.get(e.kind)!.push(e);
  }
  return [...m.entries()].sort((x, y) => y[1].length - x[1].length);
}

// ─── Picker ───────────────────────────────────────────────────────────────
function ScanPicker({ label, exclude, prefer, onPick }: {
  label: string;
  exclude?: Scan | null;
  prefer?: Scan | null;
  onPick: (id: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const { data, isLoading, error } = useScans({ status: 'completed', limit: 50 });
  const scans = useMemo(() => {
    const list = (data?.scans ?? []).filter((s) => s.id !== exclude?.id);
    if (!prefer) return list;
    const score = (s: Scan) => (s.targetValue === prefer.targetValue ? 0 : s.targetType === prefer.targetType ? 1 : 2);
    return [...list].sort((x, y) => score(x) - score(y));
  }, [data, exclude, prefer]);

  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-display text-xl font-semibold">{label}</h2>
      {prefer && <p className="mt-1 text-sm text-muted-foreground">{t('Scans of the same target come first.')}</p>}
      {isLoading ? (
        <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : error ? (
        <p className="mt-4 text-sm text-destructive">{t('Recent scans did not load. Reload the page to try again.')}</p>
      ) : scans.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('No other completed scans yet. Run a scan, then come back to compare.')}</p>
      ) : (
        <ul className="mt-4 max-h-[420px] divide-y overflow-y-auto" data-lenis-prevent>
          {scans.map((s) => {
            const same = prefer && s.targetValue === prefer.targetValue;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onPick(s.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-trace"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm">{s.targetValue}</span>
                    <span className="block text-xs text-muted-foreground">
                      {scanSummary(t, s)} · {fmt(s.createdAt, locale)}
                    </span>
                  </span>
                  {same && <span className="shrink-0 text-xs text-trace">{t('Same target')}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Diff list ────────────────────────────────────────────────────────────
function DiffColumn({ title, list, variant }: { title: string; list: DiffEntity[]; variant: 'added' | 'removed' }) {
  const t = useT();
  const groups = groupByKind(list);
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="flex items-baseline gap-2 font-display text-xl font-semibold">
        {title}
        <span className={cn('text-sm font-normal tabular-nums', variant === 'added' ? 'mark' : 'text-muted-foreground')}>{list.length}</span>
      </h2>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{variant === 'added' ? t('Nothing new in the later scan.') : t('Nothing disappeared since the earlier scan.')}</p>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map(([kind, items]) => (
            <div key={kind}>
              <h3 className="mb-1.5 text-sm text-muted-foreground">
                {t(kindLabel(kind))} <span className="tabular-nums">{items.length}</span>
              </h3>
              <ul className="space-y-1">
                {items.map((e) => (
                  <li key={e.id} className="flex items-start gap-2 text-sm">
                    <span aria-hidden className={cn('w-3 shrink-0 font-mono', variant === 'added' ? 'text-foreground' : 'text-muted-foreground')}>
                      {variant === 'added' ? '+' : '−'}
                    </span>
                    <span className="sr-only">{variant === 'added' ? t('Added:') : t('Removed:')}</span>
                    <span className={cn('min-w-0 break-all font-mono text-xs leading-5', variant === 'added' ? 'mark' : 'text-muted-foreground line-through')}>
                      {e.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ScanHeader({ caption, scan }: { caption: string; scan: ScanComparison['before'] }) {
  const t = useT();
  const locale = useLocale();
  return (
    <a href={`#/scan?id=${scan.id}`} className="block min-w-0 rounded-2xl border bg-card p-5 hover:border-trace">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <p className="mt-1 truncate font-mono text-lg font-semibold">{scan.targetValue}</p>
      <p className="text-sm text-muted-foreground">
        {scanSummary(t, scan)} · {fmt(scan.createdAt, locale)}
      </p>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export function ComparePage() {
  const t = useT();
  const locale = useLocale();
  const { a, b } = useCompareParams();
  const [includeSearch, setIncludeSearch] = useState(false);

  const scanA = useQuery({ queryKey: ['scan', a], queryFn: () => api.getScan(a), enabled: !!a && !b });
  const cmp = useQuery({
    queryKey: ['compare', a, b, includeSearch],
    queryFn: () => api.compareScans(a, b, includeSearch),
    enabled: !!a && !!b,
  });

  const back = (
    <a href={a ? `#/scan?id=${a}` : '#/history'} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="h-4 w-4" />
      {a ? t('Back to scan') : t('Scan history')}
    </a>
  );
  const heading = (
    <div className="mt-4 mb-6">
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t('Compare scans')}</h1>
      <p className="mt-1 text-muted-foreground">{t('See which entities appeared or disappeared between two scans.')}</p>
    </div>
  );

  if (!a || !b) {
    return (
      <div className="w-full">
        {back}
        {heading}
        <div className="grid gap-6 lg:grid-cols-2">
          {a ? (
            <section className="rounded-2xl border bg-card p-5">
              <p className="text-xs text-muted-foreground">{t('First scan')}</p>
              {scanA.data ? (
                <>
                  <p className="mt-1 truncate font-mono text-lg font-semibold">{scanA.data.targetValue}</p>
                  <p className="text-sm text-muted-foreground">{fmt(scanA.data.createdAt, locale)}</p>
                </>
              ) : <Skeleton className="mt-2 h-10 w-2/3" />}
              <Button variant="link" className="mt-2 h-auto p-0 text-trace" onClick={() => go('', b)}>{t('Choose another')}</Button>
            </section>
          ) : (
            <ScanPicker label={t('Choose the first scan')} onPick={(id) => go(id, b)} />
          )}
          {!b && (
            <ScanPicker
              label={a ? t('Choose a scan to compare with') : t('Then the second scan')}
              exclude={scanA.data}
              prefer={scanA.data}
              onPick={(id) => (a ? go(a, id) : go('', id))}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {back}
      {heading}

      {cmp.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
      ) : cmp.error || !cmp.data ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/50 bg-destructive/5 p-5">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">{t('These scans could not be compared')}</p>
            <p className="text-sm text-muted-foreground">
              {cmp.error instanceof Error ? cmp.error.message : t('Check that both scans exist and have finished.')} {t('Choose other scans to try again.')}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => go(a, '')}>{t('Choose another scan')}</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
            <ScanHeader caption={t('Earlier')} scan={cmp.data.before} />
            <div className="flex items-center justify-center">
              <Button variant="outline" size="sm" onClick={() => go(b, a)} aria-label={t('Swap the two scans')}>
                <ArrowsRightLeftIcon className="mr-1.5 h-4 w-4" />
                {t('Swap')}
              </Button>
            </div>
            <ScanHeader caption={t('Later')} scan={cmp.data.after} />
          </div>

          <div className="my-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span><span className="mark font-semibold tabular-nums">{cmp.data.added.length}</span> {t('added')}</span>
            <span><span className="font-semibold tabular-nums">{cmp.data.removed.length}</span> {t('removed')}</span>
            <span className="text-muted-foreground"><span className="tabular-nums">{cmp.data.unchanged}</span> {t('unchanged')}</span>
            <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground sm:ml-auto">
              <input type="checkbox" checked={includeSearch} onChange={(e) => setIncludeSearch(e.target.checked)} className="accent-[var(--trace)]" />
              {t('Include search results')}
            </label>
            <Button variant="link" className="h-auto p-0 text-trace" onClick={() => go(a, '')}>{t('Choose another scan')}</Button>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <DiffColumn title={t('Added')} list={cmp.data.added} variant="added" />
            <DiffColumn title={t('Removed')} list={cmp.data.removed} variant="removed" />
          </div>
        </>
      )}
    </div>
  );
}
