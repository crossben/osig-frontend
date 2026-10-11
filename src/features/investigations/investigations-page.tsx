'use client';

// Investigations: cases that group related scans, usually grown by pivoting.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useLocale, useT } from '@/lib/i18n';

export function InvestigationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['investigations'], queryFn: () => api.getInvestigations() });
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();

  const create = useMutation({
    mutationFn: () => api.createInvestigation({ name: name.trim() }),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      window.location.hash = `#/investigation?id=${inv.id}`;
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: t('Not created'), description: e.message }),
  });

  return (
    <div className="w-full">
      <PageHeader
        title={t('Investigations')}
        description={t("Cases that group related scans. Pivoting from a finding in any scan's graph starts one automatically.")}
        actions={!creating && (
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="mr-2 h-4 w-4" /> {t('New investigation')}
          </Button>
        )}
      />

      {creating && (
        <form
          className="mb-6 flex flex-col gap-2 rounded-2xl border bg-card p-4 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Name, e.g. Acme phishing domains')}
            maxLength={200} className="bg-background" aria-label={t('Investigation name')} />
          <div className="flex gap-2">
            <Button type="submit" disabled={!name.trim() || create.isPending}>{t('Create')}</Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>{t('Cancel')}</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : !data?.length ? (
        <div className="flex flex-col items-center rounded-2xl border bg-card px-4 py-16 text-center">
          <h3 className="font-display text-xl font-semibold">{t('No investigations yet')}</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {t('Open any scan’s graph, select an email, domain or account, and choose “Scan this”. Both scans land in a new investigation with one merged graph.')}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((inv) => (
            <li key={inv.id}>
              <a
                href={`#/investigation?id=${inv.id}`}
                className="block h-full rounded-2xl border bg-card p-5 transition-colors hover:border-trace/60 focus-visible:outline-2 focus-visible:outline-trace"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-trace">
                    <FolderIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{inv.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(inv.scanCount === 1 ? '{n} scan' : '{n} scans', { n: inv.scanCount })} · {t('updated {date}', { date: new Date(inv.updatedAt).toLocaleDateString(locale) })}
                    </p>
                    {inv.role !== 'owner' && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t(inv.role === 'editor' ? 'Shared by {owner} · you can edit' : 'Shared by {owner} · you can view', { owner: inv.owner ?? t('another user') })}
                      </p>
                    )}
                  </div>
                </div>
                {inv.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {inv.tags.map((tag) => <li key={tag} className="rounded-full bg-accent px-2 py-0.5 text-xs">{tag}</li>)}
                  </ul>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
