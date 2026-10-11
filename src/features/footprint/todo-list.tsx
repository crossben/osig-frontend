'use client';

// What to do next: open actions by severity, "Done" / "Not relevant", and a
// collapsible list of finished ones with undo. Updates are optimistic.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowTopRightOnSquareIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { errMessage, meApi, type ActionItem, type ActionStatus, type Footprint, type Severity } from '@/lib/api-me';

const ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const SEVERITY: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Do this first', cls: 'bg-destructive text-white' },
  high: { label: 'Important', cls: 'border border-destructive text-destructive' },
  medium: { label: 'Worth doing', cls: 'border border-trace text-trace' },
  low: { label: 'When you can', cls: 'border text-muted-foreground' },
};

function SeverityTag({ severity }: { severity: Severity }) {
  const t = useT();
  const s = SEVERITY[severity] ?? SEVERITY.low;
  return <span className={cn('inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', s.cls)}>{t(s.label)}</span>;
}

function safeLink(link: string | null) {
  if (!link) return null;
  try {
    const u = new URL(link);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

export function TodoList({ data }: { data: Footprint }) {
  const t = useT();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [showDone, setShowDone] = useState(false);

  const open = [...data.actions.open].sort((a, b) => (ORDER[a.severity] ?? 9) - (ORDER[b.severity] ?? 9));

  const move = (item: ActionItem, status: ActionStatus, score?: number | null) => {
    qc.setQueryData<Footprint>(['me', 'footprint'], (old) => {
      if (!old) return old;
      const rest = {
        open: old.actions.open.filter((a) => a.id !== item.id),
        done: old.actions.done.filter((a) => a.id !== item.id),
      };
      const moved = { ...item, status, resolvedAt: status === 'open' ? null : new Date().toISOString() };
      if (status === 'open') rest.open.push(moved); else rest.done.unshift(moved);
      return { ...old, score: score === undefined ? old.score : score, actions: rest };
    });
  };

  const setStatus = async (item: ActionItem, status: ActionStatus) => {
    const before = qc.getQueryData<Footprint>(['me', 'footprint']);
    if (status !== 'open') {
      setLeaving((s) => new Set(s).add(item.id));
      await new Promise((r) => setTimeout(r, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280));
    }
    move(item, status);
    setLeaving((s) => { const n = new Set(s); n.delete(item.id); return n; });
    try {
      const res = await meApi.setAction(item.id, status);
      move(item, status, res.score);
    } catch (e) {
      if (before) qc.setQueryData(['me', 'footprint'], before);
      toast({ title: errMessage(e, t('That didn’t save. Try again.')), variant: 'destructive' });
    }
  };

  return (
    <section aria-labelledby="todo-title" className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 id="todo-title" className="font-display text-xl font-semibold">{t('Your to-do list')}</h2>
      {open.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-muted-foreground">
          <CheckIcon className="h-5 w-5 text-success" aria-hidden="true" />
          {data.score === null ? t('Your to-do list appears here after the first check.') : t('All done. Nice work.')}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {open.map((a) => {
            const link = safeLink(a.link);
            return (
              <li key={a.id}
                className={cn('grid transition-all duration-300 ease-out motion-reduce:transition-none',
                  leaving.has(a.id) ? 'grid-rows-[0fr] opacity-0 -translate-x-4' : 'grid-rows-[1fr] opacity-100')}>
                <div className="overflow-hidden">
                  <div className="rounded-xl border bg-background p-4">
                    <div className="flex flex-wrap items-start gap-2">
                      <SeverityTag severity={a.severity} />
                      <h3 className="min-w-0 flex-1 basis-48 font-medium leading-snug">{a.title}</h3>
                    </div>
                    {a.detail && <p className="mt-2 whitespace-pre-line break-words text-sm text-muted-foreground">{a.detail}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-trace underline-offset-4 hover:underline">
                          {t('Open the page')}
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t('(opens in a new tab)')}</span>
                        </a>
                      )}
                      <div className="ml-auto flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setStatus(a, 'dismissed')}>{t('Not relevant')}</Button>
                        <Button size="sm" onClick={() => setStatus(a, 'done')}>
                          <CheckIcon className="mr-1 h-4 w-4" aria-hidden="true" />{t('Done')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data.actions.done.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronDownIcon className={cn('h-4 w-4 transition-transform motion-reduce:transition-none', showDone && 'rotate-180')} aria-hidden="true" />
            {t('Done ({n})', { n: data.actions.done.length })}
          </button>
          {showDone && (
            <ul className="mt-3 space-y-2">
              {data.actions.done.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-sm">
                  <CheckIcon className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words text-muted-foreground line-through decoration-1">{a.title}</span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    {a.status === 'dismissed' ? t('Not relevant') : t('Done')}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(a, 'open')}>{t('Undo')}</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
