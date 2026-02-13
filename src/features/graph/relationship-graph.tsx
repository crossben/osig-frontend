// ============================================
// Enhanced Relationship Graph Component
// With detailed side panel for node inspection
// ============================================

'use client';

import { useCallback, useMemo, useState } from 'react';
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
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRelationshipGraph } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';
import { GraphNode, RiskLevel } from '@/types';
import { cn } from '@/lib/utils';

const nodeTypeIcons = {
  email: EnvelopeIcon,
  username: UserIcon,
  domain: GlobeAltIcon,
  phone: PhoneIcon,
  profile: UserCircleIcon,
  social: UserCircleIcon,
};

const nodeTypeColors = {
  email: 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400',
  username: 'bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400',
  domain: 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400',
  phone: 'bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400',
  profile: 'bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400',
  social: 'bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400',
};

const riskBorderColors: Record<RiskLevel, string> = {
  low: 'border-green-500',
  medium: 'border-yellow-500',
  high: 'border-orange-500',
  critical: 'border-red-500',
};

const riskBadgeColors: Record<RiskLevel, string> = {
  low: 'bg-green-500/10 text-green-600 dark:text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

// Custom Node Component
function CustomNode({ data, selected }: NodeProps<Node<{ label: string; type: string; riskLevel?: RiskLevel; details?: Record<string, unknown> }>>) {
  const Icon = nodeTypeIcons[data.type as keyof typeof nodeTypeIcons] || UserIcon;
  const colorClass = nodeTypeColors[data.type as keyof typeof nodeTypeColors] || nodeTypeColors.username;
  const riskBorder = data.riskLevel ? riskBorderColors[data.riskLevel] : '';

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <Card
        className={cn(
          'px-3 py-2 min-w-[120px] border-2 transition-all hover:shadow-lg cursor-pointer',
          colorClass,
          riskBorder && `border-l-4 ${riskBorder}`,
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium truncate max-w-[100px]">{String(data.label ?? '')}</span>
        </div>
        {data.riskLevel && (
          <Badge variant="outline" className="text-[10px] mt-1 px-1">
            {String(data.riskLevel)}
          </Badge>
        )}
      </Card>
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
    </>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

interface RelationshipGraphProps {
  scanId: string;
}

export function RelationshipGraph({ scanId }: RelationshipGraphProps) {
  const { data: graphData, isLoading } = useRelationshipGraph(scanId);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Convert graph data to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    if (!graphData?.nodes) return [];

    return graphData.nodes.map((node: GraphNode, index: number) => ({
      id: node.id,
      type: 'custom',
      position: {
        x: (index % 3) * 200 + 100,
        y: Math.floor(index / 3) * 120 + 50
      },
      data: {
        label: node.label,
        type: node.type,
        riskLevel: node.riskLevel,
        details: node.data,
      },
    }));
  }, [graphData]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!graphData?.edges) return [];

    return graphData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--primary))',
      },
    }));
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  useMemo(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

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

  return (
    <div className="w-full h-full flex gap-4">
      {/* Graph Canvas */}
      <div className={cn(
        'flex-1 rounded-lg border bg-background transition-all',
        selectedNode && 'md:w-2/3'
      )}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls className="!bg-background !border !rounded-lg" />
        </ReactFlow>
      </div>

      {/* Side Panel */}
      {selectedNode && (
        <Card className="w-full md:w-80 flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Node Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="h-8 w-8 p-0"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {/* Node Type */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Type</div>
                  <Badge variant="outline" className="gap-1.5">
                    {(() => {
                      const Icon = nodeTypeIcons[selectedNode.data.type as keyof typeof nodeTypeIcons] || UserIcon;
                      return <Icon className="h-3.5 w-3.5" />;
                    })()}
                    {String(selectedNode.data.type ?? 'unknown')}
                  </Badge>
                </div>

                {/* Label */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Label</div>
                  <div className="text-sm font-mono break-all">{String(selectedNode.data.label ?? '')}</div>
                </div>

                {/* Risk Level */}
                {selectedNode.data.riskLevel && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Risk Level</div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'uppercase',
                        riskBadgeColors[selectedNode.data.riskLevel as RiskLevel]
                      )}
                    >
                      {String(selectedNode.data.riskLevel)}
                    </Badge>
                  </div>
                )}

                {/* Connection Count */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Connections</div>
                  <div className="text-sm">
                    {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} related nodes
                  </div>
                </div>

                {/* Additional Details */}
                {selectedNode.data.details && Object.keys(selectedNode.data.details).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Additional Data</div>
                    <div className="space-y-2">
                      {Object.entries(selectedNode.data.details).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium">{key}:</span>{' '}
                          <span className="text-muted-foreground font-mono">
                            {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
