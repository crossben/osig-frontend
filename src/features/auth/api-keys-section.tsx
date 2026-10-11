'use client';

// Personal API keys for the CLI and scripts. The full key is shown once, right after creation.

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/copy-button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ApiKey } from '@/types';
import { errorText } from './auth-errors';
import { useT, useLocale } from '@/lib/i18n';


export function ApiKeysSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(locale, { dateStyle: 'medium' }) : t('Never'));
  const { data: keys, isLoading } = useQuery({ queryKey: ['apiKeys'], queryFn: () => api.getApiKeys() });
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ name: string; key: string } | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const k = await api.createApiKey(name.trim());
      setCreated({ name: k.name, key: k.key });
      setName('');
      qc.invalidateQueries({ queryKey: ['apiKeys'] });
      toast({ title: t('Key created') });
    } catch (err) {
      toast({ variant: 'destructive', title: t('The key wasn’t created'), description: errorText(err, t('Try again in a moment.')) });
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (k: ApiKey) => {
    if (!window.confirm(t('Revoke “{name}”? Anything using it stops working right away.', { name: k.name }))) return;
    try {
      await api.revokeApiKey(k.id);
      qc.invalidateQueries({ queryKey: ['apiKeys'] });
      toast({ title: t('Key revoked'), description: k.name });
    } catch (err) {
      toast({ variant: 'destructive', title: t('The key wasn’t revoked'), description: errorText(err, t('Try again in a moment.')) });
    }
  };

  const snippet = `OSIG_API_KEY=${created?.key ?? '…'} python cli/osig.py scan domain example.com --wait`;

  return (
    <section className="rounded-2xl border bg-card p-6 md:p-8">
      <h2 className="font-display text-xl font-semibold">{t('API keys')}</h2>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">{t('Run scans from the command line or your own scripts. A key acts as you, with your plan’s limits.')}</p>

      <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="apiKeyName">{t('Key name')}</Label>
          <Input id="apiKeyName" placeholder={t('Laptop CLI')} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="bg-background" />
        </div>
        <Button type="submit" disabled={creating || !name.trim()}>{creating ? t('Creating…') : t('Create key')}</Button>
      </form>

      {created && (
        <div className="mt-5 rounded-xl border border-trace/40 bg-background p-4">
          <p className="text-sm font-medium">{t('Your new key “{name}”', { name: created.name })}</p>
          <p className="mt-1 text-sm text-muted-foreground"><span className="mark">{t('Copy it now. We won’t show it again.')}</span></p>
          <div className="mt-3 flex items-center gap-1 rounded-lg border bg-card px-3 py-2">
            <code className="min-w-0 flex-1 break-all font-mono text-sm">{created.key}</code>
            <CopyButton value={created.key} label={t('Copy key')} icon={ClipboardDocumentIcon} />
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCreated(null)}>{t('I’ve copied it')}</Button>
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('Loading keys…')}</p>
        ) : !keys?.length ? (
          <p className="text-sm text-muted-foreground">{t('No keys yet.')}</p>
        ) : (
          <ul className="divide-y border-y">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{k.prefix}…</span> · {t('Created {date}', { date: fmt(k.createdAt) })} · {t('Last used {date}', { date: fmt(k.lastUsedAt) })}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => revoke(k)}>{t('Revoke')}</Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium">{t('Use it with the CLI')}</p>
        <div className="mt-2 flex items-start gap-1 rounded-lg border bg-background px-3 py-2">
          <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed">{snippet}</code>
          <CopyButton value={snippet} label={t('Copy command')} icon={ClipboardDocumentIcon} />
        </div>
      </div>
    </section>
  );
}
