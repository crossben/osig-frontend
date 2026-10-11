'use client';

// Actions on a graph entity: pivot (scan it) and pin it to the investigation.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BookmarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import type { GraphNode, InvestigationPin, ScanType, TargetType } from '@/types';

/** What a node can be scanned as, if anything */
export function pivotTarget(node: GraphNode): { type: TargetType; value: string } | null {
  const raw = node.id.split(':').slice(1).join(':');
  switch (node.kind) {
    case 'email':
      return { type: 'email', value: node.label };
    case 'domain':
    case 'subdomain':
    case 'nameserver':
    case 'mailserver':
      return { type: 'domain', value: node.label.replace(/\.$/, '') };
    case 'url': {
      try { return { type: 'domain', value: new URL(raw).hostname.replace(/^www\./, '') }; } catch { return null; }
    }
    case 'account': {
      const username = (node.details.username as string | undefined)
        ?? (() => { try { return new URL(raw).pathname.split('/').filter(Boolean).pop()?.replace(/^@/, ''); } catch { return undefined; } })();
      return username ? { type: 'username', value: username } : null;
    }
    case 'phone':
      return { type: 'phone', value: node.label };
    case 'lookalike':
      return { type: 'domain', value: node.label };
    case 'ip':
      return { type: 'ip', value: node.label };
    case 'organization':
      return { type: 'organization', value: node.label };
    default:
      return null;
  }
}

export function PivotAction({ node, parentScanId }: { node: GraphNode; parentScanId: string }) {
  const target = pivotTarget(node);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const t = useT();
  const queryClient = useQueryClient();
  if (!target || node.kind === 'target') return null;

  const start = async (scanType: ScanType) => {
    setBusy(true);
    try {
      const scan = await api.pivotScan(parentScanId, {
        entityId: node.id, targetType: target.type, targetValue: target.value, scanType,
      });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      queryClient.invalidateQueries({ queryKey: ['quotaStatus'] });
      toast({ title: t('Scanning {value}', { value: target.value }), description: t('Added to this investigation.') });
      window.location.assign(`#/scan?id=${scan.id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: t('The scan didn’t start'), description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <MagnifyingGlassIcon className="mr-1.5 h-4 w-4" />
        {t('Scan this {type}', { type: t(target.type) })}
      </Button>
    );
  }
  return (
    <div className="w-full rounded-lg border bg-background p-3">
      <p className="text-sm">
        {t('Scan {value} as a {type}? It joins this investigation.', { value: target.value, type: t(target.type) })}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => start('quick')}>{t('Quick scan')}</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => start('deep')}>{t('Deep scan')}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>{t('Cancel')}</Button>
      </div>
    </div>
  );
}

export function PinAction({ node, investigationId, pins }: { node: GraphNode; investigationId: string; pins: InvestigationPin[] }) {
  const existing = pins.find((p) => p.entityId === node.id);
  const [note, setNote] = useState(existing?.note ?? '');
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const t = useT();
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['investigation', investigationId] });
    queryClient.invalidateQueries({ queryKey: ['investigationGraph', investigationId] });
  };

  const save = async () => {
    try {
      await api.pinEntity(investigationId, { entityId: node.id, kind: node.kind, label: node.label, note: note || undefined });
      setEditing(false);
      refresh();
      toast({ title: existing ? t('Pin updated') : t('Pinned') });
    } catch (e) {
      toast({ variant: 'destructive', title: t('Not pinned'), description: e instanceof Error ? e.message : undefined });
    }
  };
  const unpin = async () => {
    if (!existing) return;
    await api.unpinEntity(investigationId, existing.id);
    refresh();
    toast({ title: t('Unpinned') });
  };

  if (editing) {
    return (
      <div className="w-full space-y-2">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Why this matters (optional)')} rows={3} className="bg-background text-sm" />
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>{existing ? t('Save note') : t('Pin')}</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
        </div>
      </div>
    );
  }
  return existing ? (
    <>
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        <BookmarkIcon className="mr-1.5 h-4 w-4" /> {t('Edit note')}
      </Button>
      <Button size="sm" variant="ghost" onClick={unpin}>{t('Unpin')}</Button>
    </>
  ) : (
    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
      <BookmarkIcon className="mr-1.5 h-4 w-4" /> {t('Pin')}
    </Button>
  );
}
