'use client';

// One investigation: merged graph across its scans, lineage, notes, pins, export.

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownTrayIcon, ArrowLeftIcon, ArrowRightStartOnRectangleIcon, BookmarkIcon, TrashIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';
import type { Investigation, InvestigationMember } from '@/types';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useScans } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { useLocale, useT } from '@/lib/i18n';
import { RelationshipGraph } from '../graph/relationship-graph';
import { PinAction, PivotAction } from '../graph/entity-actions';
// ── Analysis views (map / timeline / threat-intel export), built in features/analysis ──
import { MapView } from '../analysis/map-view';
import { TimelineView } from '../analysis/timeline-view';
import { ExportMenu } from '../analysis/export-menu';

const investigationIdFromHash = () =>
  new URLSearchParams(window.location.hash.split('?')[1] || '').get('id') || '';

export function InvestigationDetailPage() {
  const id = investigationIdFromHash();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useT();
  const locale = useLocale();
  const { data: inv, isLoading, error } = useQuery({
    queryKey: ['investigation', id],
    queryFn: () => api.getInvestigation(id),
    enabled: !!id,
    // Keep polling while any of its scans is still running
    refetchInterval: (q) => (q.state.data?.scans.some((s) => s.status === 'pending' || s.status === 'running') ? 4000 : false),
  });
  const { data: allScans } = useScans({ status: 'completed', limit: 100 });
  const me = useAuthStore((st) => st.user);
  const [view, setView] = useState<'graph' | 'map' | 'timeline'>('graph');
  const [shareOpen, setShareOpen] = useState(false);
  const scanKey = inv?.scans.map((x) => `${x.id}:${x.status}`).join(',');
  const mapQuery = useQuery({
    queryKey: ['investigationMap', id, scanKey],
    queryFn: () => api.getInvestigationMap(id),
    enabled: !!id && view === 'map',
  });
  const timelineQuery = useQuery({
    queryKey: ['investigationTimeline', id, scanKey],
    queryFn: () => api.getInvestigationTimeline(id),
    enabled: !!id && view === 'timeline',
  });

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
    onError: (e: Error) => toast({ variant: 'destructive', title: t('Not saved'), description: e.message }),
  });

  // Notes save themselves a moment after typing stops
  const [notesState, setNotesState] = useState<'saved' | 'saving' | 'idle'>('idle');
  useEffect(() => {
    if (!inv || notes === (inv.notes ?? '')) return;
    setNotesState('saving');
    const timer = setTimeout(() => update.mutate({ notes }, { onSuccess: () => setNotesState('saved') }), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (error || !inv) {
    return (
      <div className="py-16 text-center">
        <h2 className="font-display text-xl font-semibold">{t('This investigation couldn’t be loaded')}</h2>
        <a href="#/investigations" className="mt-3 inline-block text-trace hover:underline">{t('Back to investigations')}</a>
      </div>
    );
  }

  // Viewers read only; editors can change everything except sharing and deletion
  const isOwner = inv.role === 'owner';
  const canEdit = inv.role !== 'viewer';
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
      toast({ variant: 'destructive', title: t('Export failed'), description: e instanceof Error ? e.message : undefined });
    }
  };

  const remove = async () => {
    if (!window.confirm(t('Delete “{name}”? Its scans stay in your history.', { name: inv.name }))) return;
    await api.deleteInvestigation(id);
    queryClient.invalidateQueries({ queryKey: ['investigations'] });
    window.location.hash = '#/investigations';
  };

  const leave = async () => {
    if (!me || !window.confirm(t('Leave “{name}”? You’ll lose access until the owner shares it again.', { name: inv.name }))) return;
    try {
      await api.removeMember(id, me.id);
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      toast({ title: t('Left the investigation'), description: inv.name });
      window.location.hash = '#/investigations';
    } catch (e) {
      toast({ variant: 'destructive', title: t('Couldn’t leave'), description: e instanceof Error ? e.message : undefined });
    }
  };

  const addTag = () => {
    const tag = tagDraft.trim().toLowerCase();
    if (tag && !inv.tags.includes(tag)) update.mutate({ tags: [...inv.tags, tag] });
    setTagDraft('');
  };

  return (
    <div className="w-full">
      <a href="#/investigations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" /> {t('Investigations')}
      </a>

      <div className="mb-6 mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => canEdit && name.trim() && name !== inv.name && update.mutate({ name: name.trim() })}
            readOnly={!canEdit}
            aria-label={t('Investigation name')}
            className="w-full bg-transparent font-display text-3xl font-bold outline-none focus:underline focus:decoration-trace md:text-4xl"
          />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {inv.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs">
                {tag}
                {canEdit && (
                  <button type="button" aria-label={t('Remove tag {tag}', { tag })} onClick={() => update.mutate({ tags: inv.tags.filter((x) => x !== tag) })}>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
            {canEdit && (
              <form onSubmit={(e) => { e.preventDefault(); addTag(); }}>
                <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder={t('+ tag')} aria-label={t('Add a tag')}
                  className="w-20 rounded-full border border-dashed bg-transparent px-2.5 py-0.5 text-xs outline-none focus:w-32 focus:border-trace" />
              </form>
            )}
          </div>
          {!isOwner && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t(canEdit ? 'Shared with you by {owner}. You can add notes, pins and pivot scans.' : 'Shared with you by {owner}. You can read everything but not make changes.', { owner: inv.owner ?? t('another user') })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button><ArrowDownTrayIcon className="mr-2 h-4 w-4" /> {t('Export')}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => exportReport('pdf')}>{t('Combined PDF report')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportReport('json')}>{t('JSON data')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ExportMenu kind="investigation" id={id} name={inv.name} />
          {isOwner ? (
            <>
              <Button variant="outline" onClick={() => setShareOpen(true)}>
                <UserPlusIcon className="mr-2 h-4 w-4" /> {t('Share')}{inv.members.length > 0 && ` (${inv.members.length})`}
              </Button>
              <Button variant="outline" size="icon" aria-label={t('Delete investigation')} onClick={remove}>
                <TrashIcon className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={leave}>
              <ArrowRightStartOnRectangleIcon className="mr-2 h-4 w-4" /> {t('Leave')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Analysis views: Graph / Map / Timeline ── */}
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="mb-6">
        <TabsList>
          <TabsTrigger value="graph">{t('Graph')}</TabsTrigger>
          <TabsTrigger value="map">{t('Map')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('Timeline')}</TabsTrigger>
        </TabsList>
        <TabsContent value="graph">
          <section className="h-[min(760px,calc(100dvh-10rem))] min-h-[520px] rounded-2xl border bg-card p-3" data-lenis-prevent>
            {latestScan ? (
              <RelationshipGraph
                investigationId={id}
                version={totalVersion}
                renderActions={canEdit ? (node) => (
                  <>
                    <PivotAction node={node} parentScanId={latestScan.id} />
                    <PinAction node={node} investigationId={id} pins={inv.pins} />
                  </>
                ) : undefined}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                {t('Add a scan below to start the graph.')}
              </div>
            )}
          </section>
        </TabsContent>
        <TabsContent value="map">
          {mapQuery.isLoading ? <Skeleton className="h-[min(640px,70dvh)] min-h-[360px] w-full rounded-2xl" />
            : mapQuery.error ? <p className="py-10 text-center text-sm text-destructive">{t('The map couldn’t be loaded. Switch tabs to try again.')}</p>
            : <MapView points={mapQuery.data?.points ?? []} />}
        </TabsContent>
        <TabsContent value="timeline">
          {timelineQuery.isLoading ? <Skeleton className="h-96 w-full rounded-2xl" />
            : timelineQuery.error ? <p className="py-10 text-center text-sm text-destructive">{t('The timeline couldn’t be loaded. Switch tabs to try again.')}</p>
            : <TimelineView events={timelineQuery.data?.events ?? []} showTarget />}
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Scans and lineage */}
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">{t('Scans')}</h2>
          <ol className="mt-4 divide-y">
            {inv.scans.map((s) => {
              const parent = s.parentScanId ? scanById.get(s.parentScanId) : undefined;
              return (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <a href={`#/scan?id=${s.id}`} className="block truncate font-mono text-sm font-medium hover:underline">{s.targetValue}</a>
                    <p className="text-xs text-muted-foreground">
                      {t('{type} {target} scan', { type: t(s.scanType), target: t(s.targetType) })} · {t(s.status)}
                      {parent && <> · {t('pivoted from')} <span className="font-mono">{parent.targetValue}</span></>}
                    </p>
                  </div>
                  {canEdit && (
                    <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground"
                      onClick={async () => { await api.removeScanFromInvestigation(id, s.id); queryClient.invalidateQueries({ queryKey: ['investigation', id] }); }}>
                      {t('Remove')}
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
          {canEdit && addable.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <Select onValueChange={async (scanId) => {
                await api.addScanToInvestigation(id, scanId);
                queryClient.invalidateQueries({ queryKey: ['investigation', id] });
                queryClient.invalidateQueries({ queryKey: ['investigationGraph', id] });
              }}>
                <SelectTrigger className="w-full bg-background" aria-label={t('Add an existing scan')}>
                  <SelectValue placeholder={t('Add an existing scan')} />
                </SelectTrigger>
                <SelectContent>
                  {addable.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="font-mono">{s.targetValue}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{t(s.targetType)} · {new Date(s.createdAt).toLocaleDateString(locale)}</span>
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
              <h2 className="font-display text-xl font-semibold">{t('Notes')}</h2>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {notesState === 'saving' ? t('Saving…') : notesState === 'saved' ? t('Saved') : ''}
              </span>
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={7} maxLength={20000} readOnly={!canEdit}
              placeholder={canEdit ? t('Hypotheses, sources to check, conclusions…') : t('No notes yet.')} className="mt-3 bg-background" />
          </section>

          {/* Pins */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">{t('Pinned findings')}</h2>
            {inv.pins.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {canEdit ? t('Select an entity in the graph and choose Pin to keep it here.') : t('Nothing pinned yet.')}
              </p>
            ) : (
              <ul className="mt-3 divide-y">
                {inv.pins.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 py-3">
                    <BookmarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-trace" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.label} <span className="text-xs font-normal text-muted-foreground">{t(p.kind)}</span></p>
                      {p.note && <p className="text-sm text-muted-foreground">{p.note}</p>}
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="sm" className="text-muted-foreground"
                        onClick={async () => {
                          await api.unpinEntity(id, p.id);
                          queryClient.invalidateQueries({ queryKey: ['investigation', id] });
                          queryClient.invalidateQueries({ queryKey: ['investigationGraph', id] });
                        }}>
                        {t('Unpin')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      {isOwner && <SharePanel inv={inv} open={shareOpen} onOpenChange={setShareOpen} />}
    </div>
  );
}

/** Owner-only: invite people by email and manage their roles */
function SharePanel({ inv, open, onOpenChange }: { inv: Investigation; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvestigationMember['role']>('viewer');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useT();

  const setMembers = (members: InvestigationMember[]) =>
    queryClient.setQueryData<Investigation>(['investigation', inv.id], (old) => (old ? { ...old, members } : old));

  const add = useMutation({
    mutationFn: (v: { email: string; role: InvestigationMember['role'] }) => api.addMember(inv.id, v.email, v.role),
    onSuccess: (members, v) => {
      setMembers(members);
      setError('');
      if (v.email === email.trim()) setEmail('');
      toast({ title: t('Shared'), description: t(v.role === 'editor' ? '{email} can now edit this investigation.' : '{email} can now view this investigation.', { email: v.email }) });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (m: InvestigationMember) => api.removeMember(inv.id, m.userId),
    onSuccess: (_r, m) => {
      setMembers(inv.members.filter((x) => x.userId !== m.userId));
      toast({ title: t('Access removed'), description: t('{email} no longer has access.', { email: m.email }) });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: t('Not removed'), description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Share “{name}”', { name: inv.name })}</DialogTitle>
          <DialogDescription>{t('Viewers can read everything. Editors can also add notes, pins and pivot scans.')}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); if (email.trim()) add.mutate({ email: email.trim(), role }); }}
        >
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@example.com"
            aria-label={t('Email address to share with')} className="bg-background" />
          <div className="flex gap-2">
            <Select value={role} onValueChange={(v) => setRole(v as InvestigationMember['role'])}>
              <SelectTrigger className="w-28 bg-background" aria-label={t('Role')}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{t('Viewer')}</SelectItem>
                <SelectItem value="editor">{t('Editor')}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!email.trim() || add.isPending}>{t('Share')}</Button>
          </div>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <h3 className="text-sm font-medium">{t('People with access')}</h3>
          {inv.members.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">{t('Only you so far.')}</p>
          ) : (
            <ul className="mt-2 divide-y">
              {inv.members.map((m) => (
                <li key={m.userId} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.username}</p>
                  </div>
                  <Select value={m.role} onValueChange={(r) => add.mutate({ email: m.email, role: r as InvestigationMember['role'] })}>
                    <SelectTrigger size="sm" className="w-24 bg-background" aria-label={t('Role for {email}', { email: m.email })}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">{t('Viewer')}</SelectItem>
                      <SelectItem value="editor">{t('Editor')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label={t('Remove {email}', { email: m.email })} disabled={remove.isPending}
                    onClick={() => remove.mutate(m)}>
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
