// ============================================
// Timeline of dated findings (registrations, breaches, certificates, expiries)
// Events arrive sorted oldest first; grouped here by year.
// ============================================

'use client';

import { useMemo, useState } from 'react';
import { ArrowTopRightOnSquareIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/types';
import { useT, useLocale } from '@/lib/i18n';

type Severity = TimelineEvent['severity'];

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'info'];

const SEVERITY: Record<Severity, { label: string; dot: string; text: string }> = {
  critical: { label: 'Critical', dot: 'bg-destructive border-destructive', text: 'text-destructive font-semibold' },
  high: { label: 'High', dot: 'bg-destructive/60 border-destructive', text: 'text-destructive' },
  medium: { label: 'Medium', dot: 'bg-highlight border-highlight-foreground/40', text: 'text-foreground' },
  info: { label: 'Info', dot: 'bg-trace border-trace', text: 'text-muted-foreground' },
};

interface TimelineViewProps {
  events: TimelineEvent[];
  /** Show which target each event belongs to (useful for investigations) */
  showTarget?: boolean;
  className?: string;
}

function formatDate(iso: string, locale: string) {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function TimelineView({ events, showTarget = false, className }: TimelineViewProps) {
  const [active, setActive] = useState<Set<Severity>>(new Set(SEVERITIES));
  const [hideFuture, setHideFuture] = useState(false);
  const t = useT();
  const locale = useLocale();

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, info: 0 };
    for (const e of events) c[e.severity] = (c[e.severity] ?? 0) + 1;
    return c;
  }, [events]);
  const futureCount = useMemo(() => events.filter((e) => e.future).length, [events]);

  const years = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const e of events) {
      if (!active.has(e.severity) || (hideFuture && e.future)) continue;
      const y = e.date.slice(0, 4);
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y)!.push(e);
    }
    return [...groups.entries()];
  }, [events, active, hideFuture]);

  if (events.length === 0) {
    return (
      <div className={cn('flex min-h-[240px] flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center', className)}>
        <CalendarDaysIcon aria-hidden className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium">{t('No dated findings yet.')}</p>
        <p className="text-sm text-muted-foreground">{t('Dates come from registrations, certificates, breaches and expiries.')}</p>
      </div>
    );
  }

  const toggle = (s: Severity) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });

  return (
    <div className={cn('rounded-2xl border bg-card p-4 sm:p-6', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Filter by severity')}>
          {SEVERITIES.filter((s) => counts[s] > 0).map((s) => {
            const on = active.has(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-trace',
                  on ? 'bg-background text-foreground' : 'border-dashed text-muted-foreground'
                )}
              >
                <span aria-hidden className={cn('h-2 w-2 rounded-full border', on ? SEVERITY[s].dot : 'border-muted-foreground')} />
                {t(SEVERITY[s].label)}
                <span className="tabular-nums text-muted-foreground">{counts[s]}</span>
              </button>
            );
          })}
        </div>
        {futureCount > 0 && (
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={hideFuture} onChange={(e) => setHideFuture(e.target.checked)} className="accent-[var(--trace)]" />
            {t('Hide upcoming dates ({n})', { n: futureCount })}
          </label>
        )}
      </div>

      {years.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{t('No events match these filters. Turn a severity back on to see them.')}</p>
      ) : (
        <div className="mt-6 space-y-8">
          {years.map(([year, list]) => (
            <section key={year} aria-labelledby={`tl-${year}`}>
              <h3 id={`tl-${year}`} className="mb-3 flex items-baseline gap-2 font-display text-xl font-semibold">
                {year}
                <span className="text-sm font-normal text-muted-foreground">{list.length}</span>
              </h3>
              <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-trace/40">
                {list.map((e, i) => {
                  const sev = SEVERITY[e.severity] ?? SEVERITY.info;
                  return (
                    <li key={`${e.date}-${e.title}-${i}`} className={cn('relative py-2 pl-6', e.future && 'opacity-90')}>
                      <span
                        aria-hidden
                        className={cn(
                          'absolute left-0 top-[0.9rem] h-[11px] w-[11px] rounded-full border-2',
                          e.future ? 'border-dashed bg-card ' + sev.dot.split(' ')[1] : sev.dot
                        )}
                      />
                      <div className={cn('rounded-lg px-3 py-2', e.future ? 'border border-dashed bg-background/40' : 'bg-background/60')}>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                          <time dateTime={e.date} className="font-medium tabular-nums">{formatDate(e.date, locale)}</time>
                          <span className={sev.text}>{t(sev.label)}</span>
                          {e.future && <span className="rounded border border-trace/50 px-1.5 text-trace">{t('Upcoming')}</span>}
                          <span className="text-muted-foreground">{e.source}</span>
                          {showTarget && <span className="font-mono text-muted-foreground">{e.target}</span>}
                        </div>
                        <p className="mt-0.5 break-words text-sm">{e.title}</p>
                        {e.sourceUrl && /^https?:\/\//.test(e.sourceUrl) && (
                          <a
                            href={e.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-trace hover:underline"
                          >
                            {t('Open source')} <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
