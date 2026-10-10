'use client';

// One investigation: merged graph across its scans, lineage, notes, pins, export.

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownTrayIcon, ArrowLeftIcon, BookmarkIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useScans } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { RelationshipGraph } from '../graph/relationship-graph';
import { PinAction, PivotAction } from '../graph/entity-actions';

const investigationIdFromHash = () =>
  new URLSearchParams(window.location.hash.split('?')[1] || '').get('id') || '';

export function InvestigationDetailPage() {
  const id = investigationIdFromHash();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: inv, isLoading, error } = useQuery({
    queryKey: ['investigation', id],
    queryFn: () => api.getInvestigation(id),
    enabled: !!id,
    // Keep polling while any of its scans is still running
    refetchInterval: (q) => (q.state.data?.scans.some((s) => s.status === 'pending' || s.status === 'running') ? 4000 : false),
  });
  const { data: allScans } = useScans({ status: 'completed', limit: 100 });

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const loaded = useRef(false);
  useEffect(() => {
    if (inv && !loaded.current) {
      setName(inv.name);
      setNotes(inv.notes ?? '');
      loaded.current = true;
    }
  }, [inv]);

  const update = useMutation({
    mutationFn: (data: { name?: string; notes?: string; tags?: string[] }) => api.updateInvestigation(id, data),
    onSuccess: (fresh) => {
      queryClient.setQueryData(['investigation', id], fresh);
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Not saved', description: e.message }),
  });

  // Notes save themselves a moment after typing stops
  const [notesState, setNotesState] = useState<'saved' | 'saving' | 'idle'>('idle');
  useEffect(() => {
    if (!inv || notes === (inv.notes ?? '')) return;
    setNotesState('saving');
    const t = setTimeout(() => update.mutate({ notes }, { onSuccess: () => setNotesState('saved') }), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (error || !inv) {
    return (
      <div className="py-16 text-center">
        <h2 className="font-display text-xl font-semibold">This investigation couldn&apos;t be loaded</h2>
        <a href="#/investigations" className="mt-3 inline-block text-trace hover:underline">Back to investigations</a>
      </div>
    );
  }

  const latestScan = inv.scans[inv.scans.length - 1];
  const scanById = new Map(inv.scans.map((s) => [s.id, s]));
  const addable = (allScans?.scans ?? []).filter((s) => !scanById.has(s.id));
  const totalVersion = inv.scans.reduce((n, s) => n + (s.status === 'completed' ? 1 : 0), 0) + inv.pins.length * 1000;

  const exportReport = async (format: 'pdf' | 'json') => {
    try {
      const blob = await api.downloadInvestigationReport(id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.name.replace(/[^a-z0-9.@_-]+/gi, '_')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Export failed', description: e instanceof Error ? e.message : undefined });
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${inv.name}”? Its scans stay in your history.`)) return;
    await api.deleteInvestigation(id);
    queryClient.invalidateQueries({ queryKey: ['investigations'] });
    window.location.hash = '#/investigations';
  };

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (t && !inv.tags.includes(t)) update.mutate({ tags: [...inv.tags, t] });
    setTagDraft('');
  };

  return (
    <div className="w-full">
      <a href="#/investigations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" /> Investigations
      </a>

      <div className="mb-6 mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== inv.name && update.mutate({ name: name.trim() })}
            aria-label="Investigation name"
            className="w-full bg-transparent font-display text-3xl font-bold outline-none focus:underline focus:decoration-trace md:text-4xl"
          />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {inv.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs">
                {t}
                <button type="button" aria-label={`Remove tag ${t}`} onClick={() => update.mutate({ tags: inv.tags.filter((x) => x !== t) })}>
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); addTag(); }}>
              <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="+ tag" aria-label="Add a tag"
                className="w-20 rounded-full border border-dashed bg-transparent px-2.5 py-0.5 text-xs outline-none focus:w-32 focus:border-trace" />
            </form>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button><ArrowDownTrayIcon className="mr-2 h-4 w-4" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => exportReport('pdf')}>Combined PDF report</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportReport('json')}>JSON data</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" aria-label="Delete investigation" onClick={remove}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Merged graph */}
      <section className="mb-6 h-[min(760px,calc(100dvh-10rem))] min-h-[520px] rounded-2xl border bg-card p-3" data-lenis-prevent>
        {latestScan ? (
          <RelationshipGraph
            investigationId={id}
            version={totalVersion}
            renderActions={(node) => (
              <>
                <PivotAction node={node} parentScanId={latestScan.id} />
                <PinAction node={node} investigationId={id} pins={inv.pins} />
              </>
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            Add a scan below to start the graph.
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Scans and lineage */}
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Scans</h2>
          <ol className="mt-4 divide-y">
            {inv.scans.map((s) => {
              const parent = s.parentScanId ? scanById.get(s.parentScanId) : undefined;
              return (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <a href={`#/scan?id=${s.id}`} className="block truncate font-mono text-sm font-medium hover:underline">{s.targetValue}</a>
                    <p className="text-xs text-muted-foreground">
                      {s.scanType} {s.targetType} scan · {s.status}
                      {parent && <> · pivoted from <span className="font-mono">{parent.targetValue}</span></>}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground"
                    onClick={async () => { await api.removeScanFromInvestigation(id, s.id); queryClient.invalidateQueries({ queryKey: ['investigation', id] }); }}>
                    Remove
                  </Button>
                </li>
              );
            })}
          </ol>
          {addable.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <Select onValueChange={async (scanId) => {
                await api.addScanToInvestigation(id, scanId);
                queryClient.invalidateQueries({ queryKey: ['investigation', id] });
                queryClient.invalidateQueries({ queryKey: ['investigationGraph', id] });
              }}>
                <SelectTrigger className="w-full bg-background" aria-label="Add an existing scan">
                  <SelectValue placeholder="Add an existing scan" />
                </SelectTrigger>
                <SelectContent>
                  {addable.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="font-mono">{s.targetValue}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.targetType} · {new Date(s.createdAt).toLocaleDateString()}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {/* Notes */}
          <section className="rounded-2xl border bg-card p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold">Notes</h2>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {notesState === 'saving' ? 'Saving…' : notesState === 'saved' ? 'Saved' : ''}
              </span>
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={7} maxLength={20000}
              placeholder="Hypotheses, sources to check, conclusions…" className="mt-3 bg-background" />
          </section>

          {/* Pins */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Pinned findings</h2>
            {inv.pins.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Select an entity in the graph and choose Pin to keep it here.</p>
            ) : (
              <ul className="mt-3 divide-y">
                {inv.pins.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 py-3">
                    <BookmarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-trace" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.label} <span className="text-xs font-normal text-muted-foreground">{p.kind}</span></p>
                      {p.note && <p className="text-sm text-muted-foreground">{p.note}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground"
                      onClick={async () => {
                        await api.unpinEntity(id, p.id);
                        queryClient.invalidateQueries({ queryKey: ['investigation', id] });
                        queryClient.invalidateQueries({ queryKey: ['investigationGraph', id] });
                      }}>
                      Unpin
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
