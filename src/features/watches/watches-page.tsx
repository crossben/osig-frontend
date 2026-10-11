'use client';

// Watches: targets re-scanned on a schedule, with what changed between runs.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';
import type { ScanType, TargetType, Watch } from '@/types';

const INTERVALS = [
  { hours: 6, label: 'Every 6 hours' },
  { hours: 24, label: 'Daily' },
  { hours: 24 * 7, label: 'Weekly' },
  { hours: 24 * 30, label: 'Monthly' },
];
const intervalLabel = (h: number, t: ReturnType<typeof useT>) => {
  const label = INTERVALS.find((i) => i.hours === h)?.label;
  return label ? t(label) : t('Every {h} hours', { h });
};

function Changes({ watch }: { watch: Watch }) {
  const [includeSearch, setIncludeSearch] = useState(false);
  const t = useT();
  const locale = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['watchChanges', watch.id, includeSearch, watch.runCount],
    queryFn: () => api.getWatchChanges(watch.id, includeSearch),
  });
  if (isLoading) return <Skeleton className="h-16" />;
  if (!data?.compared) {
    return <p className="text-sm text-muted-foreground">{t('Changes appear after the second completed run.')}</p>;
  }
  const none = !data.added.length && !data.removed.length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <a className="hover:underline" href={`#/scan?id=${data.compared.previousScanId}`}>{new Date(data.compared.previousAt).toLocaleString(locale)}</a>
          {' → '}
          <a className="hover:underline" href={`#/scan?id=${data.compared.latestScanId}`}>{new Date(data.compared.latestAt).toLocaleString(locale)}</a>
        </span>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={includeSearch} onChange={(e) => setIncludeSearch(e.target.checked)} className="accent-[var(--trace)]" />
          {t('Include search results')}
        </label>
      </div>
      {none ? (
        <p className="text-sm">{t('No changes between the last two runs.')}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {data.added.map((e) => (
            <li key={`+${e.id}`} className="flex gap-2"><span className="w-4 font-bold text-success">+</span><span className="mark">{e.label}</span><span className="text-xs text-muted-foreground">{t(e.kind)}</span></li>
          ))}
          {data.removed.map((e) => (
            <li key={`-${e.id}`} className="flex gap-2"><span className="w-4 font-bold text-destructive">−</span><span className="line-through decoration-destructive/60">{e.label}</span><span className="text-xs text-muted-foreground">{t(e.kind)}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WatchesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();
  const { data: watches, isLoading } = useQuery({ queryKey: ['watches'], queryFn: () => api.getWatches(), refetchInterval: 30000 });
  const [form, setForm] = useState<{ targetType: TargetType; targetValue: string; scanType: ScanType; intervalHours: number }>(
    { targetType: 'domain', targetValue: '', scanType: 'quick', intervalHours: 24 });
  const [open, setOpen] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['watches'] });

  const create = useMutation({
    mutationFn: () => api.createWatch({ ...form, targetValue: form.targetValue.trim() }),
    onSuccess: () => {
      refresh();
      setOpen(false);
      setForm((f) => ({ ...f, targetValue: '' }));
      toast({ title: t('Watching'), description: t('The first scan starts within five minutes.') });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: t('Not added'), description: e.message }),
  });

  return (
    <div className="w-full">
      <PageHeader
        title={t('Watches')}
        description={<>
          {t('Targets re-scanned on a schedule. Each run is compared with the previous one so new subdomains, breaches or DNS changes stand out.')}
          <span className="mt-1 block text-sm">{t('Alerts go out by email or webhook, as set up under')} <a href="#/profile" className="text-trace hover:underline">{t('Account')}</a>.</span>
        </>}
        actions={!open && <Button onClick={() => setOpen(true)}><PlusIcon className="mr-2 h-4 w-4" /> {t('Watch a target')}</Button>}
      />

      {open && (
        <form
          className="mb-6 grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-[10rem_1fr_9rem_10rem_auto] md:items-end"
          onSubmit={(e) => { e.preventDefault(); if (form.targetValue.trim()) create.mutate(); }}
        >
          <div className="space-y-1.5">
            <Label>{t('Type')}</Label>
            <Select value={form.targetType} onValueChange={(v) => setForm({ ...form, targetType: v as TargetType })}>
              <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="domain">{t('Domain')}</SelectItem>
                <SelectItem value="email">{t('Email')}</SelectItem>
                <SelectItem value="username">{t('Username')}</SelectItem>
                <SelectItem value="phone">{t('Phone')}</SelectItem>
                <SelectItem value="ip">{t('IP address')}</SelectItem>
                <SelectItem value="organization">{t('Organization')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="watchTarget">{t('Target')}</Label>
            <Input id="watchTarget" autoFocus value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
              className="bg-background font-mono" placeholder="example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>{t('Depth')}</Label>
            <Select value={form.scanType} onValueChange={(v) => setForm({ ...form, scanType: v as ScanType })}>
              <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">{t('Quick')}</SelectItem>
                <SelectItem value="deep">{t('Deep')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('Frequency')}</Label>
            <Select value={String(form.intervalHours)} onValueChange={(v) => setForm({ ...form, intervalHours: Number(v) })}>
              <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERVALS.map((i) => <SelectItem key={i.hours} value={String(i.hours)}>{t(i.label)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!form.targetValue.trim() || create.isPending}>{t('Watch')}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t('Cancel')}</Button>
          </div>
          <p className="text-xs text-muted-foreground md:col-span-5">{t('Each run counts toward your daily scan allowance. Only watch targets you have a legitimate reason to monitor.')}</p>
        </form>
      )}

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : !watches?.length ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card px-4 py-16 text-center">
          <EyeIcon className="h-8 w-8 text-trace" />
          <h3 className="mt-3 font-display text-xl font-semibold">{t('Nothing watched yet')}</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{t('Watch your own domain or email to hear about new subdomains, breaches and DNS changes.')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {watches.map((w) => (
            <li key={w.id} className={cn('rounded-2xl border bg-card p-5', !w.active && 'opacity-70')}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-mono text-lg font-semibold">{w.targetValue}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('{type} {target} scan', { type: t(w.scanType), target: t(w.targetType) })} · {intervalLabel(w.intervalHours, t).toLowerCase()} · {t(w.runCount === 1 ? '{n} run' : '{n} runs', { n: w.runCount })}
                    {w.active
                      ? <> · {t('next {date}', { date: new Date(w.nextRunAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) })}</>
                      : ` · ${t('paused')}`}
                    {w.latestScanId && <> · <a href={`#/scan?id=${w.latestScanId}`} className="text-trace hover:underline">{t('latest scan')}</a></>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <Switch checked={w.active} onCheckedChange={async (active) => { await api.updateWatch(w.id, { active }); refresh(); }} aria-label={t('Active')} />
                    {w.active ? t('Active') : t('Paused')}
                  </label>
                  <Button variant="ghost" size="sm" className="text-muted-foreground"
                    onClick={async () => {
                      if (!window.confirm(t('Stop watching {target}? Past scans stay in your history.', { target: w.targetValue }))) return;
                      await api.deleteWatch(w.id); refresh();
                    }}>
                    {t('Stop watching')}
                  </Button>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <Changes watch={w} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
