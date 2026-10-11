// ============================================
// Entity graph
// Every entity a scan found (IPs, hosts, emails, accounts, URLs, ...) as one
// node, linked to the sources that reported it and to related entities.
// Layout: d3-force, computed once per data set so it is stable between renders.
// ============================================

'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  getNodesBounds,
  getViewportForBounds,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import {
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  AtSymbolIcon,
  BuildingOffice2Icon,
  CircleStackIcon,
  CpuChipIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  ServerIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  SignalIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toPng } from 'html-to-image';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntityGraph } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { EntityKind, GraphEdge, GraphNode, RelationshipGraph as GraphData } from '@/types';

// ─── Kind presentation ────────────────────────────────────────────────────
const KIND: Record<EntityKind, { label: string; one: string; icon: React.ElementType }> = {
  target: { label: 'Target', one: 'Target', icon: MagnifyingGlassIcon },
  source: { label: 'Sources', one: 'Source', icon: CircleStackIcon },
  ip: { label: 'IP addresses', one: 'IP address', icon: CpuChipIcon },
  subdomain: { label: 'Subdomains', one: 'Subdomain', icon: GlobeAltIcon },
  domain: { label: 'Domains', one: 'Domain', icon: GlobeAltIcon },
  nameserver: { label: 'Nameservers', one: 'Nameserver', icon: ServerStackIcon },
  mailserver: { label: 'Mail servers', one: 'Mail server', icon: EnvelopeIcon },
  email: { label: 'Emails', one: 'Email', icon: AtSymbolIcon },
  network: { label: 'Networks', one: 'Network', icon: SignalIcon },
  location: { label: 'Locations', one: 'Location', icon: MapPinIcon },
  organization: { label: 'Organizations', one: 'Organization', icon: BuildingOffice2Icon },
  service: { label: 'Services', one: 'Service', icon: ShieldCheckIcon },
  url: { label: 'URLs', one: 'URL', icon: LinkIcon },
  account: { label: 'Accounts', one: 'Account', icon: UserCircleIcon },
  breach: { label: 'Breaches', one: 'Breach', icon: ExclamationTriangleIcon },
  port: { label: 'Open ports', one: 'Open port', icon: ServerIcon },
  phone: { label: 'Phones', one: 'Phone', icon: PhoneIcon },
  person: { label: 'People', one: 'Person', icon: UserCircleIcon },
  lookalike: { label: 'Lookalikes', one: 'Lookalike', icon: ExclamationTriangleIcon },
};

// One hue per kind; fills/borders are mixed from it so it reads in both themes
const KIND_COLOR: Record<EntityKind, string> = {
  target: 'var(--primary)',
  source: 'var(--trace)',
  ip: '#3B82F6',
  subdomain: '#6366F1',
  domain: '#8B5CF6',
  nameserver: '#14B8A6',
  mailserver: '#0EA5E9',
  email: '#F59E0B',
  network: '#10B981',
  location: '#22C55E',
  organization: '#A855F7',
  service: '#06B6D4',
  url: '#64748B',
  account: '#EC4899',
  breach: '#EF4444',
  port: '#F97316',
  phone: '#84CC16',
  person: '#D946EF',
  lookalike: '#E11D48',
};
const kindColor = (kind: EntityKind) => KIND_COLOR[kind] ?? 'var(--trace)';

// ─── Labels ───────────────────────────────────────────────────────────────
// Long labels are cut with an ellipsis (full text in the title attribute), and the
// layout's collision radius is sized from the label so neighbours don't overlap.
type SizeClass = 'target' | 'source' | 'entity';
const sizeClass = (kind: EntityKind): SizeClass => (kind === 'target' || kind === 'source' ? kind : 'entity');
const MAX_LABEL: Record<SizeClass, number> = { target: 32, source: 26, entity: 30 };
// Approximate glyph width (px) at each kind's font size, plus fixed chrome: icon, gap, padding, border
const CHAR_PX: Record<SizeClass, number> = { target: 8.4, source: 6.6, entity: 6.1 };
const CHROME_PX: Record<SizeClass, number> = { target: 52, source: 40, entity: 34 };
const MIN_RADIUS: Record<SizeClass, number> = { target: 90, source: 70, entity: 46 };

function shortLabel(kind: EntityKind, label: string) {
  const max = MAX_LABEL[sizeClass(kind)];
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function collisionRadius(node: GraphNode) {
  const c = sizeClass(node.kind);
  const chars = Math.min(node.label.length, MAX_LABEL[c]);
  const badge = c === 'entity' && node.sources.length > 1 ? 22 : 0;
  const width = CHROME_PX[c] + chars * CHAR_PX[c] + badge + (node.pinned ? 16 : 0);
  return Math.max(MIN_RADIUS[c], width / 2 + 10);
}

// ─── Node ─────────────────────────────────────────────────────────────────
type EntityData = GraphNode & { dim: boolean; focus: boolean } & Record<string, unknown>;

// Handles sit at the node center so straight edges run center to center
const centerHandle = '!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !left-1/2 !top-1/2';

const EntityNode = memo(function EntityNode({ data, selected }: NodeProps<Node<EntityData>>) {
  const t = useT();
  const { icon: Icon } = KIND[data.kind] ?? KIND.domain;
  const corroborated = data.kind !== 'source' && data.kind !== 'target' && data.sources.length > 1;
  const entity = data.kind !== 'target' && data.kind !== 'source';
  const color = data.risk === 'high' ? 'var(--destructive)' : kindColor(data.kind);
  return (
    <div
      style={{ '--kc': color } as React.CSSProperties}
      className={cn(
        'flex max-w-[220px] items-center gap-1.5 whitespace-nowrap rounded-lg border',
        data.kind === 'target' && 'rounded-xl border-primary bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg',
        data.kind === 'source' && 'border-trace/60 bg-accent px-2.5 py-1.5 text-xs font-semibold text-foreground',
        entity && 'border-[color-mix(in_srgb,var(--kc)_55%,transparent)] bg-[color-mix(in_srgb,var(--kc)_16%,var(--card))] px-2 py-1 text-[11px] text-foreground shadow-sm',
        data.risk === 'high' && 'font-semibold',
        selected && 'ring-2 ring-[var(--kc)] ring-offset-2 ring-offset-background',
        data.focus && !selected && 'ring-1 ring-trace',
        data.dim && 'opacity-20',
      )}
    >
      <Handle type="target" position={Position.Top} className={centerHandle} isConnectable={false} />
      <Icon
        className={cn('shrink-0', data.kind === 'target' ? 'h-4 w-4' : 'h-3.5 w-3.5', data.kind === 'source' && 'text-trace')}
        style={entity ? { color: 'var(--kc)' } : undefined}
      />
      <span className={cn('truncate', data.kind === 'target' && 'font-mono')} title={data.label.length > MAX_LABEL[sizeClass(data.kind)] ? data.label : undefined}>
        {shortLabel(data.kind, data.label)}
      </span>
      {data.pinned && (
        <BookmarkSolidIcon aria-label={t('Pinned')} className="h-3 w-3 shrink-0 text-[var(--kc)]" />
      )}
      {corroborated && (
        <span className="mark shrink-0 rounded text-[10px] font-semibold" title={t('Reported by {n} sources', { n: data.sources.length })}>
          ×{data.sources.length}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className={centerHandle} isConnectable={false} />
    </div>
  );
});

const nodeTypes = { entity: EntityNode };

// ─── Layout ───────────────────────────────────────────────────────────────
type SimNode = SimulationNodeDatum & { id: string; kind: EntityKind; r: number };

function layout(nodes: GraphNode[], edges: GraphEdge[]): Map<string, { x: number; y: number }> {
  // Deterministic seed: kinds on rings so runs are stable and clusters form by kind
  const kindIndex = new Map<string, number>();
  const sim: SimNode[] = nodes.map((n, i) => {
    const r = collisionRadius(n);
    if (n.kind === 'target') return { id: n.id, kind: n.kind, r, x: 0, y: 0, fx: 0, fy: 0 };
    const k = kindIndex.get(n.kind) ?? kindIndex.size;
    kindIndex.set(n.kind, k);
    const ring = n.kind === 'source' ? 180 : 420;
    const angle = (i / nodes.length) * Math.PI * 2;
    return { id: n.id, kind: n.kind, r, x: Math.cos(angle) * ring, y: Math.sin(angle) * ring };
  });
  const links: SimulationLinkDatum<SimNode>[] = edges.map((e) => ({ source: e.source, target: e.target }));

  forceSimulation(sim)
    .force('link', forceLink<SimNode, SimulationLinkDatum<SimNode>>(links).id((d) => d.id)
      .distance((l) => Math.max((l.source as SimNode).kind === 'target' ? 190 : 120, (l.source as SimNode).r + (l.target as SimNode).r))
      .strength(0.7))
    .force('charge', forceManyBody<SimNode>().strength((d) => (d.kind === 'source' ? -900 : -320)))
    .force('collide', forceCollide<SimNode>().radius((d) => d.r).strength(0.9).iterations(2))
    .force('x', forceX(0).strength(0.03))
    .force('y', forceY(0).strength(0.03))
    .force('center', forceCenter(0, 0))
    .stop()
    .tick(320);

  return new Map(sim.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
}

/** Without source nodes, re-attach entities directly to the target */
function withoutSources(g: GraphData): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const sourceIds = new Set(g.nodes.filter((n) => n.kind === 'source').map((n) => n.id));
  const root = g.nodes.find((n) => n.kind === 'target');
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const e of g.edges) {
    const s = sourceIds.has(e.source) ? root?.id : e.source;
    const t = sourceIds.has(e.target) ? root?.id : e.target;
    if (!s || !t || s === t) continue;
    const key = [s, t].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ ...e, id: key, source: s, target: t, label: sourceIds.has(e.source) ? 'found' : e.label });
  }
  return { nodes: g.nodes.filter((n) => n.kind !== 'source'), edges };
}

// ─── Graph ────────────────────────────────────────────────────────────────
function GraphCanvas({ graph, renderActions }: { graph: GraphData; renderActions?: (node: GraphNode) => React.ReactNode }) {
  const { setCenter, getNodes } = useReactFlow();
  const [exporting, setExporting] = useState(false);
  const [hidden, setHidden] = useState<Set<EntityKind>>(new Set());
  const [showSources, setShowSources] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const t = useT();

  const base = useMemo(() => (showSources ? graph : withoutSources(graph)), [graph, showSources]);
  const positions = useMemo(() => layout(base.nodes, base.edges), [base]);
  const byId = useMemo(() => new Map(base.nodes.map((n) => [n.id, n])), [base]);

  const visible = useMemo(() => {
    const nodes = base.nodes.filter((n) => n.kind === 'target' || !hidden.has(n.kind));
    const ids = new Set(nodes.map((n) => n.id));
    return { nodes, edges: base.edges.filter((e) => ids.has(e.source) && ids.has(e.target)), ids };
  }, [base, hidden]);

  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of visible.edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    return map;
  }, [visible]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? visible.nodes.filter((n) => n.label.toLowerCase().includes(q)) : []),
    [visible, q]
  );
  const matchSet = useMemo(() => (q ? new Set(matches.map((m) => m.id)) : null), [q, matches]);
  const selectSet = useMemo(
    () => (selectedId ? new Set([selectedId, ...(neighbours.get(selectedId) ?? [])]) : null),
    [selectedId, neighbours]
  );

  // Nodes live in React Flow state so their measured sizes survive updates.
  // Rebuilding node objects on every hover made React Flow re-measure (and
  // briefly hide) them, which fired mouseleave under the cursor: the flicker.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EntityData>>([]);

  useEffect(() => {
    setNodes(visible.nodes.map((n) => ({
      id: n.id,
      type: 'entity',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      zIndex: n.kind === 'target' ? 10 : n.kind === 'source' ? 5 : 1,
      data: { ...n, dim: false, focus: false },
    })));
  }, [visible, positions, setNodes]);

  // Selection and search only patch data on the existing node objects
  useEffect(() => {
    setNodes((prev) => prev.map((n) => {
      const dim = (selectSet ? !selectSet.has(n.id) : false) || (matchSet ? !matchSet.has(n.id) : false);
      const focus = !!matchSet?.has(n.id);
      const selected = n.id === selectedId;
      if (n.data.dim === dim && n.data.focus === focus && !!n.selected === selected) return n;
      return { ...n, selected, data: { ...n.data, dim, focus } };
    }));
  }, [selectSet, matchSet, selectedId, setNodes]);

  const rfEdges: Edge[] = useMemo(() => visible.edges.map((e) => {
    const active = selectedId ? e.source === selectedId || e.target === selectedId : false;
    const fromSource = byId.get(e.source)?.kind === 'source' || byId.get(e.target)?.kind === 'source';
    const end = byId.get(e.target);
    const stroke = !fromSource && end && end.kind !== 'target' ? kindColor(end.kind) : 'var(--trace)';
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'straight',
      label: active && e.label ? t(e.label) : undefined,
      selectable: false,
      focusable: false,
      style: {
        stroke,
        strokeWidth: active ? 2 : fromSource ? 1 : 1.4,
        strokeOpacity: selectedId ? (active ? 0.95 : 0.06) : fromSource ? 0.28 : 0.6,
        strokeDasharray: fromSource ? '3 4' : undefined,
      },
      labelStyle: { fontSize: 11, fill: 'var(--foreground)' },
      labelBgStyle: { fill: 'var(--card)', fillOpacity: 0.95 },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
      zIndex: 0, // always under nodes
    };
  }), [visible, byId, selectedId, t]);

  // Hover highlight is pure CSS on the container: no node/edge objects change
  const hoverCss = useMemo(() => {
    if (!hoverId || selectedId) return '';
    const keep = [hoverId, ...(neighbours.get(hoverId) ?? [])];
    const nodeNot = keep.map((id) => `:not([data-id=${JSON.stringify(id)}])`).join('');
    const edgeIds = visible.edges.filter((e) => e.source === hoverId || e.target === hoverId).map((e) => e.id);
    const edgeNot = edgeIds.map((id) => `:not([data-id=${JSON.stringify(id)}])`).join('');
    return `.osig-graph .react-flow__node${nodeNot}{opacity:.2}`
      + `.osig-graph .react-flow__edge${edgeNot} path{stroke-opacity:.06}`
      + edgeIds.map((id) => `.osig-graph .react-flow__edge[data-id=${JSON.stringify(id)}] path{stroke-opacity:.95;stroke-width:2}`).join('');
  }, [hoverId, selectedId, neighbours, visible.edges]);

  const focusNode = useCallback((id: string) => {
    const p = positions.get(id);
    setSelectedId(id);
    if (p) setCenter(p.x, p.y, { zoom: 1.2, duration: 500 });
  }, [positions, setCenter]);

  // Whole graph (not just what's on screen) as a PNG, on the current theme's background
  const exportPng = useCallback(async () => {
    const viewportEl = document.querySelector<HTMLElement>('.osig-graph .react-flow__viewport');
    if (!viewportEl) return;
    setExporting(true);
    // Capture the graph evenly lit, regardless of hover/selection/search dimming
    const container = viewportEl.closest('.osig-graph');
    container?.classList.add('osig-exporting');
    try {
      const width = 2400;
      const height = 1600;
      const bounds = getNodesBounds(getNodes());
      const { x, y, zoom } = getViewportForBounds(bounds, width, height, 0.1, 2, 0.06);
      const dataUrl = await toPng(viewportEl, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        width,
        height,
        pixelRatio: 1,
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${x}px, ${y}px) scale(${zoom})` },
      });
      const root = graph.nodes.find((n) => n.kind === 'target');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `osig-graph-${(root?.label ?? 'scan').replace(/[^a-z0-9.@_-]+/gi, '_')}.png`;
      a.click();
    } finally {
      container?.classList.remove('osig-exporting');
      setExporting(false);
    }
  }, [getNodes, graph.nodes]);

  const toggleKind = (kind: EntityKind) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind); else next.add(kind);
      return next;
    });

  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedLinks = selected
    ? visible.edges
        .filter((e) => e.source === selected.id || e.target === selected.id)
        .map((e) => ({ edge: e, other: byId.get(e.source === selected.id ? e.target : e.source) }))
        .filter((l): l is { edge: GraphEdge; other: GraphNode } => !!l.other)
    : [];
  const kinds = graph.kinds.filter((k) => k !== 'target' && k !== 'source');

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) focusNode(matches[0].id); }}
            placeholder={t('Find an entity')}
            aria-label={t('Find an entity in the graph')}
            className="h-8 bg-background pl-8 text-sm"
          />
        </div>
        {q && <span className="text-xs text-muted-foreground">{t(matches.length === 1 ? '{n} match' : '{n} matches', { n: matches.length })}</span>}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Show or hide entity kinds')}>
          {kinds.map((kind) => {
            const off = hidden.has(kind);
            const { icon: Icon, label } = KIND[kind];
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={!off}
                onClick={() => toggleKind(kind)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-trace',
                  off ? 'border-dashed text-muted-foreground' : 'bg-background text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: off ? undefined : kindColor(kind) }} />
                {t(label)}
                <span className="tabular-nums text-muted-foreground">{graph.counts[kind]}</span>
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" className="ml-auto h-8" onClick={exportPng} disabled={exporting}>
          <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
          {exporting ? t('Exporting…') : t('Export PNG')}
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={showSources} onChange={(e) => setShowSources(e.target.checked)} className="accent-[var(--trace)]" />
          {t('Show sources')}
        </label>
      </div>

      <div className="relative flex min-h-0 flex-1 gap-3">
        <div className="osig-graph relative min-w-0 flex-1 overflow-hidden rounded-xl border bg-background">
          {hoverCss && <style>{hoverCss}</style>}
          <ReactFlow
            // Remount (and re-fit) when the layout changes: new findings or sources toggled
            key={`${showSources ? 's' : 'e'}-${base.nodes.length}-${base.edges.length}`}
            nodes={nodes}
            onNodesChange={onNodesChange}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            nodeOrigin={[0.5, 0.5]}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onNodeMouseEnter={(_, n) => setHoverId(n.id)}
            onNodeMouseLeave={() => setHoverId(null)}
            onPaneClick={() => setSelectedId(null)}
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            minZoom={0.1}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--grid)" />
            <Controls showInteractive={false} className="!rounded-lg !border !shadow-none [&_button]:!border-border [&_button]:!bg-card [&_button]:!fill-foreground" />
            <MiniMap
              pannable
              zoomable
              className="!rounded-lg !border !bg-card"
              maskColor="color-mix(in srgb, var(--background) 70%, transparent)"
              nodeColor={(n) => {
                const d = n.data as unknown as EntityData;
                return d.risk === 'high' ? 'var(--destructive)' : kindColor(d.kind);
              }}
            />
          </ReactFlow>
          <p className="pointer-events-none absolute left-3 top-3 rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground">
            {t('{nodes} entities · {edges} links · ×n = reported by n sources', { nodes: visible.nodes.length, edges: visible.edges.length })}
          </p>
        </div>

        {/* Details */}
        {selected && (
          <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-xs flex-col rounded-xl border bg-card shadow-lg md:static md:shadow-none" data-lenis-prevent>
            <div className="flex items-start justify-between gap-2 border-b p-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{KIND[selected.kind] ? t(KIND[selected.kind].one) : selected.kind}</p>
                <h3 className="break-words font-semibold">{selected.label}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedId(null)} aria-label={t('Close details')}>
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
              {renderActions && <div className="flex flex-wrap gap-2">{renderActions(selected)}</div>}
              {(selected.kind === 'url' || selected.kind === 'account') && /^https?:\/\//.test(String(selected.details.url ?? selected.id.split(':').slice(1).join(':'))) && (
                <a
                  href={String(selected.details.url ?? selected.id.split(':').slice(1).join(':'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-trace hover:underline"
                >
                  {t('Open link')} <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {selected.sources.length > 0 && selected.kind !== 'source' && (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">{t('Reported by')}</p>
                  <ul className="space-y-1">
                    {selected.sources.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              )}
              {Object.keys(selected.details).length > 0 && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {Object.entries(selected.details).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}</dt>
                      <dd className="min-w-0 break-words font-mono text-xs leading-5">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">{t('Connections ({n})', { n: selectedLinks.length })}</p>
                <ul className="space-y-0.5">
                  {selectedLinks.map(({ edge, other }) => {
                    const { icon: Icon } = KIND[other.kind] ?? KIND.domain;
                    return (
                      <li key={edge.id}>
                        <button
                          type="button"
                          onClick={() => focusNode(other.id)}
                          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-accent"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: kindColor(other.kind) }} />
                          <span className="min-w-0 flex-1 truncate">{other.label}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{edge.label ? t(edge.label) : null}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

interface RelationshipGraphProps {
  scanId?: string;
  investigationId?: string;
  version?: number;
  /** Extra buttons in the details panel for the selected entity (pivot, pin...) */
  renderActions?: (node: GraphNode) => React.ReactNode;
}

export function RelationshipGraph({ scanId, investigationId, version = 0, renderActions }: RelationshipGraphProps) {
  const { data, isLoading, error } = useEntityGraph({ scanId, investigationId }, version);
  const t = useT();

  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <p className="font-medium text-destructive">{t('The graph didn’t load')}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }
  if (!data || data.nodes.length <= 1) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="font-medium text-foreground">{t('Nothing to connect yet')}</p>
          <p className="text-sm">{t('Entities appear here as sources return findings.')}</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <GraphCanvas graph={data} renderActions={renderActions} />
    </ReactFlowProvider>
  );
}
