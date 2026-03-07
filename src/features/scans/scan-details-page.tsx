// ============================================
// Scan Details Page Component
// ============================================

'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  MapPinIcon,
  ShieldExclamationIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useScanDetails } from '@/hooks/use-api';
import { ScanStatus, RiskLevel } from '@/types';
import { cn } from '@/lib/utils';
import { RelationshipGraph } from '../graph/relationship-graph';

const statusConfig: Record<ScanStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: ClockIcon },
  running: { label: 'Running', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: ArrowPathIcon },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: CheckCircleIcon },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircleIcon },
};

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const targetTypeIcons = {
  email: EnvelopeIcon,
  username: UserCircleIcon,
  domain: GlobeAltIcon,
  phone: PhoneIcon,
};

function StatusBadge({ status }: { status: ScanStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={cn('gap-1.5', config.color)}>
      <Icon className={cn('h-3.5 w-3.5', status === 'running' && 'animate-spin')} />
      {config.label}
    </Badge>
  );
}

function RiskBadge({ severity }: { severity: RiskLevel }) {
  return (
    <Badge variant="outline" className={cn('text-xs', riskColors[severity])}>
      {severity.toUpperCase()}
    </Badge>
  );
}

function ModuleCard({ module }: { module: { name: string; displayName: string; status: string; progress: number; resultCount: number } }) {
  const statusColors: Record<string, string> = {
    completed: 'text-green-500',
    running: 'text-blue-500',
    pending: 'text-muted-foreground',
    failed: 'text-red-500',
    skipped: 'text-muted-foreground',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-1">
        <p className="font-medium text-sm">{module.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {module.resultCount} results
        </p>
      </div>
      <div className="flex items-center gap-2">
        {module.status === 'running' && (
          <Progress value={module.progress} className="w-16 h-2" />
        )}
        <Badge variant="secondary" className={cn('text-xs', statusColors[module.status])}>
          {module.status}
        </Badge>
      </div>
    </div>
  );
}

function DetailedResultCard({ result }: { result: any }) {
  const renderData = () => {
    const { dataType, data } = result;

    if (dataType === 'breach') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-500 font-medium">
            <ShieldExclamationIcon className="h-4 w-4" />
            <span>Data Breach Found: {data.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{data.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground">Date:</span>
              <span>{data.breach_date}</span>
            </div>
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground">Exposed Data:</span>
              <span>{Array.isArray(data.data_classes) ? data.data_classes.join(', ') : 'Unknown'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (dataType === 'ip_intel') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-medium">
            <MapPinIcon className="h-4 w-4" />
            <span>Location: {data.geo?.city}, {data.geo?.country || data.country_code}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 border rounded bg-muted/30 col-span-2">
              <span className="block text-muted-foreground">Network:</span>
              <span>{data.network_name} ({data.asn}) - {data.cidr}</span>
            </div>
            {data.geo?.lat && (
              <div className="p-2 border rounded bg-muted/30">
                <span className="block text-muted-foreground">Coordinates:</span>
                <span>{data.geo.lat}, {data.geo.lon}</span>
              </div>
            )}
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground">ISP:</span>
              <span>{data.geo?.isp || 'Unknown'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (dataType === 'phone_info') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-500 font-medium">
            <PhoneIcon className="h-4 w-4" />
            <span>{data.international_format} ({data.number_type})</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground">Carrier:</span>
              <span>{data.carrier}</span>
            </div>
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground">Location:</span>
              <span>{data.location}</span>
            </div>
          </div>
        </div>
      );
    }

    if (dataType === 'account_existence') {
      return (
        <div className="flex items-center gap-3 p-2 border rounded bg-muted/30">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <span className="font-medium text-sm">Registered on {data.platform}</span>
        </div>
      );
    }

    if (dataType === 'dork_result') {
      return (
        <div className="space-y-1">
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-500 hover:underline">
            {data.title}
          </a>
          <p className="text-xs text-muted-foreground line-clamp-2">{data.snippet}</p>
        </div>
      );
    }

    // Fallback for raw JSON
    return (
      <pre className="text-[10px] bg-muted/50 p-2 rounded overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{result.source}</Badge>
          <span className="text-[10px] text-muted-foreground">{result.dataType}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {Math.round(result.confidence * 100)}% Match
        </span>
      </div>
      <div className="pt-1">
        {renderData()}
      </div>
    </div>
  );
}

export function ScanDetailsPage() {
  // Extract scanId from hash URL: #/scan?id=<uuid>
  const hashParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.split('?')[1] || '')
    : new URLSearchParams();
  const scanId = hashParams.get('id') || '';
  const [activeTab, setActiveTab] = useState('overview');

  const [isPolling, setIsPolling] = useState(true);
  const { data: details, isLoading, error } = useScanDetails(scanId, {
    refetchInterval: isPolling ? 3000 : (false as const),
  });

  useEffect(() => {
    if (details?.scan?.status === 'completed' || details?.scan?.status === 'failed') {
      setIsPolling(false);
    }
  }, [details?.scan?.status]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ExclamationTriangleIcon className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load scan details</h2>
        <p className="text-muted-foreground">The scan may have been deleted or an error occurred.</p>
        <button
          onClick={() => { window.location.hash = '#/history'; }}
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Go to Scan History
        </button>
      </div>
    );
  }

  const { scan, modules, results, sources, riskFlags, summary } = details;
  const TargetIcon = targetTypeIcons[scan.targetType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { window.location.hash = '#/history'; }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent h-10 w-10"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <TargetIcon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-bold">{scan.targetValue}</h1>
              <StatusBadge status={scan.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {scan.targetType} • {scan.scanType} scan • Started {new Date(scan.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Progress Bar for Running Scans */}
      {(scan.status === 'running' || scan.status === 'pending') && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Scan Progress</span>
              <span className="text-sm text-muted-foreground">{scan.progress}%</span>
            </div>
            <Progress value={scan.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Scanning {modules.filter(m => m.status === 'completed').length} of {modules.length} modules completed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {scan.status === 'failed' && scan.errorMessage && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Scan Failed</p>
                <p className="text-sm text-muted-foreground">{scan.errorMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Results</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{summary.totalResults}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sources Used</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{summary.totalSources}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Risk Score</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{summary.riskScore}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Categories</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{summary.dataCategories.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Flags */}
          {riskFlags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                  Risk Flags
                </CardTitle>
                <CardDescription>Potential concerns identified during the scan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskFlags.map((flag) => (
                    <div key={flag.id} className="flex items-start justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{flag.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {flag.type} • Source: {flag.source}
                        </p>
                      </div>
                      <RiskBadge severity={flag.severity} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Findings */}
          <Card>
            <CardHeader>
              <CardTitle>Key Findings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.topFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ChevronRightIcon className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Modules Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Modules</CardTitle>
              <CardDescription>Progress of each scan module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {modules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Results by Module</CardTitle>
              <CardDescription>Detailed results from each scan module</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {results.map((result) => (
                    <DetailedResultCard key={result.id} result={result} />
                  ))}
                  {results.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No results yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph" className="space-y-6">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Relationship Graph</CardTitle>
              <CardDescription>Visual representation of discovered connections</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <RelationshipGraph scanId={scanId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>Sources queried during this scan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {sources.map((source) => (
                  <div key={source.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{source.name}</h4>
                      <Badge variant="secondary">{source.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{source.url}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Reliability: {Math.round(source.reliability * 100)}%</span>
                      <span>Types: {source.dataTypes.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw JSON Tab */}
        <TabsContent value="raw" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Raw JSON Data</CardTitle>
              <CardDescription>Complete scan results in JSON format</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
