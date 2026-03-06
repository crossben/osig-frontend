// frontend/src/features/graph/relationship-graph.tsx
// ============================================
// Semantic Relationship Graph
// Nodes grouped by source/platform with found/not-found distinction
// ============================================

'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  Position,
  Handle,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  EnvelopeIcon,
  UserIcon,
  GlobeAltIcon,
  PhoneIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRelationshipGraph } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Icon map ─────────────────────────────────────────────────────────────
const nodeTypeIcons: Record<string, React.ElementType> = {
  email: EnvelopeIcon,
  username: UserIcon,
  domain: GlobeAltIcon,
  phone: PhoneIcon,
  profile: UserCircleIcon,
  social: UserCircleIcon,
  dork: MagnifyingGlassIcon,
};

// ─── Color config ─────────────────────────────────────────────────────────
// found=true & not risky → green
// found=true & risky    → red
// found=false           → muted grey
// root                  → primary/blue
const getNodeColors = (found: boolean, isRoot: boolean, risk: string | null) => {
  if (isRoot) return 'bg-primary/10 border-primary/60 text-primary';
  if (risk === 'high') return 'bg-red-500/15 border-red-500/60 text-red-600 dark:text-red-400';
  if (found) return 'bg-green-500/15 border-green-500/60 text-green-600 dark:text-green-400';
  return 'bg-muted/30 border-border text-muted-foreground opacity-60';
};

// ─── Custom Node ──────────────────────────────────────────────────────────
type NodeData = {
  label: string;
  nodeType: string;
  found: boolean;
  isRoot: boolean;
  riskLevel: string | null;
  sourceUrl: string | null;
  resultCount?: number;
  source?: string;
};

function CustomNode({ data, selected }: NodeProps<Node<NodeData>>) {
  const Icon = nodeTypeIcons[data.nodeType] ?? UserIcon;
  const colorClass = getNodeColors(data.found, data.isRoot, data.riskLevel);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <div
        className={cn(
          'rounded-xl border-2 px-3 py-2 min-w-[130px] max-w-[180px] shadow-sm transition-all cursor-pointer',
          colorClass,
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          !data.found && !data.isRoot && 'border-dashed',
        )}
      >
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold truncate">{data.label}</span>
          {data.riskLevel === 'high' && (
            <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
          )}
          {data.found && !data.isRoot && data.riskLevel !== 'high' && (
            <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
          )}
        </div>
        {!data.isRoot && (
          <div className="text-[10px] mt-0.5 opacity-70">
            {data.found ? (data.resultCount ? `${data.resultCount} result(s)` : 'found') : 'not found'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </>
  );
}

const nodeTypes = { custom: CustomNode };

// ─── Main Component ───────────────────────────────────────────────────────
interface RelationshipGraphProps {
  scanId: string;
}

export function RelationshipGraph({ scanId }: RelationshipGraphProps) {
  const { data: graphData, isLoading, error } = useRelationshipGraph(scanId);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Convert API nodes to ReactFlow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!graphData?.nodes?.length) return [];

    const apiNodes = graphData.nodes as Array<{
      id: string; type: string; label: string; found: boolean; is_root: boolean;
      risk_level: string | null; source_url: string | null; source?: string;
      data?: { result_count?: number; results?: unknown[] };
    }>;

    // Spread root in center, children in a circle around it
    const root = apiNodes.find(n => n.is_root);
    const children = apiNodes.filter(n => !n.is_root);
    const radius = 280;
    const cx = 450;
    const cy = 300;

    return apiNodes.map((node) => {
      let x = cx;
      let y = cy;

      if (!node.is_root) {
        const idx = children.findIndex(c => c.id === node.id);
        const angle = (2 * Math.PI * idx) / children.length - Math.PI / 2;
        x = cx + radius * Math.cos(angle);
        y = cy + radius * Math.sin(angle);
      }

      return {
        id: node.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: node.label,
          nodeType: node.type,
          found: node.found ?? false,
          isRoot: node.is_root ?? false,
          riskLevel: node.risk_level ?? null,
          sourceUrl: node.source_url ?? null,
          source: node.source ?? node.label,
          resultCount: node.data?.result_count,
        } as NodeData,
      };
    });
  }, [graphData]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!graphData?.edges) return [];
    return (graphData.edges as Array<{
      id: string; source: string; target: string; label: string; found: boolean;
    }>).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: edge.found,
      style: {
        stroke: edge.found ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        strokeWidth: edge.found ? 2 : 1,
        strokeDasharray: edge.found ? undefined : '4 4',
        opacity: edge.found ? 1 : 0.45,
      },
      markerEnd: edge.found ? {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--primary))',
      } : undefined,
      labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
      labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.8 },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
    }));
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // ── Legend ──────────────────────────────────────────────────────────────
  const Legend = () => (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 bg-background/90 backdrop-blur-sm rounded-lg border px-3 py-2 text-xs">
      <div className="font-semibold text-muted-foreground mb-1">Legend</div>
      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-green-500/60 bg-green-500/15 inline-block" /> Found / Active</div>
      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-dashed border-border bg-muted/30 inline-block opacity-60" /> Not found</div>
      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-red-500/60 bg-red-500/15 inline-block" /> Risk detected</div>
      <div className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-primary/60 bg-primary/10 inline-block" /> Scan target</div>
    </div>
  );

  // ── States ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-32 w-64" />
          <Skeleton className="h-32 w-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-destructive">
        <div className="text-center">
          <p className="font-medium">Failed to load graph data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!graphData?.nodes?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="font-medium">No relationship data available</p>
          <p className="text-sm">Complete a scan to see the relationship graph</p>
        </div>
      </div>
    );
  }

  const nodeData = selectedNode?.data as NodeData | undefined;

  return (
    <div className="w-full h-full flex gap-4 relative">
      {/* Graph Canvas */}
      <div className={cn('flex-1 rounded-lg border bg-background relative', selectedNode && 'md:w-2/3')}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-left"
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} className="opacity-30" />
          <Controls className="!bg-background !border !rounded-lg" />
          <Legend />
        </ReactFlow>
      </div>

      {/* Side Panel */}
      {selectedNode && nodeData && (
        <Card className="w-full md:w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{nodeData.label}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)} className="h-7 w-7 p-0">
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {/* Type & Status */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize gap-1">
                    {nodeData.nodeType}
                  </Badge>
                  {nodeData.isRoot ? (
                    <Badge variant="secondary">Scan Target</Badge>
                  ) : nodeData.found ? (
                    <Badge className="bg-green-500/15 text-green-600 border-green-500/30 border">✓ Found</Badge>
                  ) : (
                    <Badge variant="outline" className="opacity-60">Not found</Badge>
                  )}
                  {nodeData.riskLevel === 'high' && (
                    <Badge className="bg-red-500/15 text-red-600 border-red-500/30 border">⚠ Risk</Badge>
                  )}
                </div>

                {/* Source URL */}
                {nodeData.sourceUrl && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Source URL</div>
                    <a
                      href={nodeData.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline break-all"
                    >
                      {nodeData.sourceUrl}
                    </a>
                  </div>
                )}

                {/* Results breakdown */}
                {!nodeData.isRoot && (nodeData as NodeData & { results?: { data_type: string; confidence: number; data: Record<string, unknown> }[] }).results && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Data ({nodeData.resultCount} result{nodeData.resultCount !== 1 ? 's' : ''})
                    </div>
                    <div className="space-y-2">
                      {(selectedNode.data as { results?: { data_type: string; confidence: number; data: Record<string, unknown> }[] }).results?.map((r, i) => (
                        <div key={i} className="rounded-md border bg-muted/30 p-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium capitalize">{r.data_type.replace(/_/g, ' ')}</span>
                            <span className="text-muted-foreground">{Math.round(r.confidence * 100)}% conf.</span>
                          </div>
                          {Object.entries(r.data || {}).slice(0, 4).map(([k, v]) => (
                            <div key={k} className="text-muted-foreground">
                              <span className="font-medium">{k}:</span>{' '}
                              <span className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connection count */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Connections</div>
                  <div className="text-xs">
                    {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} linked nodes
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}