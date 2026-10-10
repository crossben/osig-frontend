// ============================================
// Scan Details Page Component
// ============================================

'use client';

import { useState } from 'react';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
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
  CpuChipIcon,
  BuildingOffice2Icon,
  LinkIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScanDetails } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { downloadReportFile } from '@/lib/download-report';
import { ScanStatus, RiskLevel, ReportFormat } from '@/types';
import { cn } from '@/lib/utils';
import { RelationshipGraph } from '../graph/relationship-graph';
import { CountUp } from '@/components/motion/count-up';
import { PivotAction } from '../graph/entity-actions';
import { CodeBlock } from '@/components/code-block';
import { CopyButton } from '@/components/copy-button';

const statusConfig: Record<ScanStatus, { label: string; dot: string }> = {
  pending: { label: 'Queued', dot: 'bg-muted-foreground' },
  running: { label: 'Running', dot: 'bg-trace animate-pulse' },
  completed: { label: 'Completed', dot: 'bg-success' },
  failed: { label: 'Failed', dot: 'bg-destructive' },
};

const riskColors: Record<RiskLevel, string> = {
  low: 'text-muted-foreground',
  medium: 'text-foreground border-highlight bg-highlight/40',
  high: 'text-destructive border-destructive/40 bg-destructive/10',
  critical: 'text-destructive-foreground border-destructive bg-destructive',
};

const targetTypeIcons = {
  email: EnvelopeIcon,
  username: UserCircleIcon,
  domain: GlobeAltIcon,
  phone: PhoneIcon,
  ip: CpuChipIcon,
  organization: BuildingOffice2Icon,
};

function StatusLabel({ status }: { status: ScanStatus }) {
  const config = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span aria-hidden className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

function RiskBadge({ severity }: { severity: RiskLevel }) {
  return (
    <Badge variant="outline" className={cn('text-xs', riskColors[severity])}>
      {severity}
    </Badge>
  );
}

const moduleDot: Record<string, string> = {
  completed: 'border-trace bg-trace',
  running: 'border-trace bg-card animate-pulse',
  pending: 'border-muted-foreground/50 bg-card',
  failed: 'border-destructive bg-destructive',
  skipped: 'border-muted-foreground/50 bg-card',
};

/** Modules as a vertical trace: one node per module, filled when it has answered */
function ModuleTrace({ modules }: { modules: { id: string; displayName: string; status: string; resultCount: number; error?: string | null }[] }) {
  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground">Modules appear here once the scan starts.</p>;
  }
  return (
    <ul className="relative space-y-1 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-trace/40">
      {modules.map((m) => (
        <li key={m.id} className="relative flex items-baseline justify-between gap-3 py-2 pl-6">
          <span aria-hidden className={cn('absolute left-0 top-[0.8rem] h-[11px] w-[11px] rounded-full border-2', moduleDot[m.status] ?? moduleDot.pending)} />
          <div className="min-w-0">
            <div className="text-sm font-medium">{m.displayName}</div>
            <div className={cn('text-xs', m.status === 'failed' ? 'text-destructive' : 'text-muted-foreground')}>
              {m.status === 'failed' ? (m.error || 'Failed') : m.status === 'completed' ? 'Answered' : m.status === 'running' ? 'Checking…' : 'Waiting'}
            </div>
          </div>
          <span className="shrink-0 text-sm tabular-nums">
            {m.resultCount > 0 ? <span className="mark font-semibold">{m.resultCount}</span> : <span className="text-muted-foreground">0</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const humanKey = (key: string) =>
  key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

function KeyValueList({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No details returned.</p>;
  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{humanKey(key)}</dt>
          <dd className="min-w-0 break-words">
            {Array.isArray(value) ? (
              value.length === 0 ? <span className="text-muted-foreground">none</span> : (
                <ul className="space-y-0.5">
                  {value.slice(0, 20).map((v, i) => (
                    <li key={i} className="font-mono text-xs">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
                  ))}
                  {value.length > 20 && <li className="text-xs text-muted-foreground">+{value.length - 20} more</li>}
                </ul>
              )
            ) : typeof value === 'object' ? (
              <CodeBlock value={value} wrap />
            ) : typeof value === 'boolean' ? (
              value ? 'yes' : 'no'
            ) : (
              <span className="font-mono text-xs">{String(value)}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The finding's primary URL, if it has one */
function mainLinkOf(result: any): string | null {
  const d = result.data ?? {};
  const candidates = [result.sourceUrl, d.url, d.profileUrl, d.finalUrl];
  return candidates.find((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u)) ?? null;
}

function DetailedResultCard({ result }: { result: any }) {
  const mainLink = mainLinkOf(result);
  const renderData = () => {
    const { dataType, data } = result;

    if (dataType === 'breach') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <ShieldExclamationIcon className="h-4 w-4" />
            <span>Data Breach Detected</span>
          </div>
          {data.leaks_found ? (
            // h8mail leak format
            <div>
              <p className="text-sm">Found <span className="font-bold">{data.leaks_found}</span> raw leak signals (h8mail).</p>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-destructive/20" data-lenis-prevent>
                <CodeBlock value={data.raw_findings} wrap />
              </div>
            </div>
          ) : (
            // standard HIBP format
            <div>
              <p className="text-sm font-bold">{data.name}</p>
              <p className="text-xs text-muted-foreground">{data.domain} • {data.breach_date}</p>
              {/* HIBP descriptions contain HTML; strip it rather than inject third-party markup */}
              <p className="text-xs mt-1">{String(data.description ?? '').replace(/<[^>]*>/g, '')}</p>
              {data.data_classes && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {data.data_classes.map((cls: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-[10px] text-destructive border-destructive/30 bg-destructive/5">
                      {cls}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (dataType === 'ip_intel') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-trace font-medium">
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
          <div className="flex items-center gap-2 text-success font-medium">
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
          <CheckCircleIcon className="h-5 w-5 text-success" />
          <span className="font-medium text-sm">Registered on {data.platform}</span>
        </div>
      );
    }

    if (dataType === 'dork_result') {
      return (
        <div className="space-y-1">
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-trace hover:underline">
            {data.title}
          </a>
          <p className="text-xs text-muted-foreground line-clamp-2">{data.snippet}</p>
        </div>
      );
    }

    if (dataType === 'domain_parts') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium">
            <GlobeAltIcon className="h-4 w-4" />
            <span>Domain Structure</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground w-full truncate">Subdomain:</span>
              <span className="font-mono">{data.subdomain || '-'}</span>
            </div>
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground w-full truncate">Domain:</span>
              <span className="font-mono">{data.domain || '-'}</span>
            </div>
            <div className="p-2 border rounded bg-muted/30">
              <span className="block text-muted-foreground w-full truncate">Suffix:</span>
              <span className="font-mono">{data.suffix || '-'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (dataType === 'webpage_info') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-trace font-medium">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Homepage analysis</span>
            </div>
            {data.title && (
              <p className="text-sm border-l-2 border-trace pl-2">{data.title}</p>
            )}
            {data.meta_description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{data.meta_description}</p>
            )}
            {data.visible_emails && data.visible_emails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground w-full block mb-1">Found Emails:</span>
                {data.visible_emails.map((email: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-[10px] font-mono">{email}</Badge>
                ))}
              </div>
            )}

            {/* Phishing Analysis */}
            {data.phishing_analysis && (
              <div className={`mt-3 p-2 rounded border ${data.phishing_analysis.potential_risk ? 'bg-destructive/10 border-destructive/50 text-destructive' : 'bg-success/10 border-success/40 text-success'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldExclamationIcon className="h-4 w-4" />
                  <span className="text-xs font-bold">Impersonation / Phishing Risk (RapidFuzz)</span>
                </div>
                <div className="text-[10px]">
                  Base Domain: <span className="font-mono bg-muted/50 px-1">{data.phishing_analysis.base_domain}</span><br />
                  Highest Brand Match: <span className="font-bold">{data.phishing_analysis.highest_org_match}%</span>
                  {data.phishing_analysis.potential_risk && (
                    <p className="mt-1 text-destructive font-bold">WARNING: Claimed organization does not strongly match the typed domain name. Potential impersonation.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NLP Entities */}
          {data.nlp_entities && (
            <div className="space-y-2 border-t pt-2">
              <div className="text-xs text-muted-foreground font-medium mb-1">Extracted Entities (spaCy)</div>

              {data.nlp_entities.organizations && data.nlp_entities.organizations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] w-12 pt-1">Orgs:</span>
                  {data.nlp_entities.organizations.map((org: string, idx: number) => (
                    <Badge key={`org-${idx}`} variant="secondary" className="text-[9px] bg-accent text-foreground">{org}</Badge>
                  ))}
                </div>
              )}

              {data.nlp_entities.people && data.nlp_entities.people.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] w-12 pt-1">People:</span>
                  {data.nlp_entities.people.map((person: string, idx: number) => (
                    <Badge key={`person-${idx}`} variant="secondary" className="text-[9px] bg-accent text-foreground">{person}</Badge>
                  ))}
                </div>
              )}

              {data.nlp_entities.locations && data.nlp_entities.locations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] w-12 pt-1">Places:</span>
                  {data.nlp_entities.locations.map((loc: string, idx: number) => (
                    <Badge key={`loc-${idx}`} variant="secondary" className="text-[9px] bg-accent text-foreground">{loc}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (dataType === 'open_ports') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-trace font-medium">
            <ServerIcon className="h-4 w-4" />
            <span>Open Ports ({data.total_open})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.open_ports.map((portInfo: any, idx: number) => (
              <div key={idx} className="flex pb-0 mb-0 flex-col border rounded p-2 bg-muted/20 text-xs min-w-[100px]">
                <span className="font-bold text-lg">{portInfo.port}/{portInfo.protocol}</span>
                <span className="text-muted-foreground">{portInfo.name}</span>
                {portInfo.product && (
                  <span className="text-[10px] text-muted-foreground/80 truncate">{portInfo.product}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Fallback: readable key/value list instead of a JSON dump
    return <KeyValueList data={data} />;
  };

  return (
    <div className="rounded-xl border bg-background/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 border-b pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{result.source}</span>
          <span className="text-xs text-muted-foreground">{String(result.dataType).replace(/_/g, ' ')}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground" title="How confident the source is in this finding">
            {Math.round(result.confidence * 100)}% confidence
          </span>
          {mainLink && <CopyButton value={mainLink} label="Copy link" icon={LinkIcon} />}
          <CopyButton value={() => JSON.stringify(result, null, 2)} label="Copy JSON" icon={CodeBracketIcon} />
        </div>
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
  const [exporting, setExporting] = useState<ReportFormat | null>(null);
  const { toast } = useToast();

  // Keep polling until the scan AND every module (incl. background ones like
  // the dork module, which finish after the scan is marked completed) are done.
  const { data: details, isLoading, error } = useScanDetails(scanId, {
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return 3000;
      const scanActive = d.scan.status === 'pending' || d.scan.status === 'running';
      if (scanActive) return 3000;
      // Give up on stuck background modules (e.g. worker restarted) after 10 min
      const completedAt = d.scan.completedAt ? new Date(d.scan.completedAt).getTime() : 0;
      if (Date.now() - completedAt > 10 * 60 * 1000) return false;
      const moduleActive = d.modules.some(m => m.status === 'pending' || m.status === 'running');
      return moduleActive ? 5000 : false;
    },
  });

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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied', description: 'Anyone opening it must be signed in to this account.' });
    } catch {
      toast({ variant: 'destructive', title: 'Could not copy link', description: window.location.href });
    }
  };

  const handleExport = async (format: ReportFormat) => {
    setExporting(format);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const report = await api.createReport({
        scanId: scan.id,
        name: `OSIG ${scan.targetValue} ${date}`,
        format,
      });
      if (report.status !== 'ready') throw new Error('Report generation failed');
      await downloadReportFile(report);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: e instanceof Error ? e.message : 'Could not export this scan',
      });
    } finally {
      setExporting(null);
    }
  };
  const TargetIcon = targetTypeIcons[scan.targetType];
  const active = scan.status === 'running' || scan.status === 'pending';
  const answered = modules.filter(m => m.status === 'completed' || m.status === 'failed').length;
  const resultsByModule = modules
    .map(m => ({ module: m, results: results.filter(r => (r as { moduleId?: string }).moduleId === m.id || r.module === m.name) }))
    .filter(g => g.results.length > 0);

  const tabTrigger = 'h-auto flex-none rounded-none border-0 border-b-2 border-transparent px-4 py-2.5 text-muted-foreground data-[state=active]:border-trace data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent dark:data-[state=active]:border-trace';

  return (
    <div className="w-full">
      {/* Header */}
      <a href="#/history" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" />
        Scan history
      </a>
      <div className="mt-4 mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <TargetIcon className="h-5 w-5" />
            </span>
            <h1 className="min-w-0 truncate font-mono text-2xl font-semibold tracking-tight md:text-4xl">{scan.targetValue}</h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <StatusLabel status={scan.status} />
            <span>{scan.scanType === 'deep' ? 'Deep' : 'Quick'} {scan.targetType} scan</span>
            <span>Started {new Date(scan.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            {scan.investigationId && (
              <a href={`#/investigation?id=${scan.investigationId}`} className="text-trace hover:underline">
                Open investigation
              </a>
            )}
            {scan.watchId && (
              <a href="#/watches" className="text-trace hover:underline">Scheduled re-scan</a>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={handleShare}>
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={scan.status !== 'completed' || exporting !== null}
                title={scan.status !== 'completed' ? 'Available once the scan completes' : undefined}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting…' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleExport('pdf')}>PDF report</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('json')}>JSON data</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress while running */}
      {active && (
        <div className="mb-6 rounded-2xl border bg-card p-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {modules.length === 0 ? 'Starting modules…' : `${answered} of ${modules.length} modules answered`}
            </span>
            <span className="tabular-nums text-muted-foreground">{scan.progress}%</span>
          </div>
          <Progress value={scan.progress} className="mt-3 h-1.5" />
        </div>
      )}

      {scan.status === 'failed' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/50 bg-destructive/5 p-5">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">The scan stopped before finishing</p>
            <p className="text-sm text-muted-foreground">{scan.errorMessage || 'No error detail was recorded. Try running it again.'}</p>
          </div>
        </div>
      )}

      {/* Stats strip */}
      <dl className="mb-8 grid grid-cols-2 overflow-hidden rounded-2xl border bg-card md:grid-cols-4 md:divide-x [&>div]:p-5 [&>div:nth-child(-n+2)]:border-b md:[&>div:nth-child(-n+2)]:border-b-0">
        <div>
          <dt className="text-sm text-muted-foreground">Findings</dt>
          <dd className="mt-1 font-display text-4xl font-bold tabular-nums"><CountUp value={summary.totalResults} /></dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Sources that answered</dt>
          <dd className="mt-1 font-display text-4xl font-bold tabular-nums"><CountUp value={summary.totalSources} /></dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Risk score</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className={cn('font-display text-4xl font-bold tabular-nums',
              (summary.riskLevel === 'high' || summary.riskLevel === 'critical') && 'text-destructive')}>
              <CountUp value={summary.riskScore} />
            </span>
            <span className="text-sm text-muted-foreground">/ 100 · {summary.riskLevel ?? 'low'}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Kinds of data</dt>
          <dd className="mt-1 font-display text-4xl font-bold tabular-nums"><CountUp value={summary.dataCategories.length} /></dd>
        </div>
      </dl>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="overview" className={tabTrigger}>Overview</TabsTrigger>
          <TabsTrigger value="details" className={tabTrigger}>Findings <span className="ml-1.5 text-muted-foreground tabular-nums">{results.length}</span></TabsTrigger>
          <TabsTrigger value="graph" className={tabTrigger}>Graph</TabsTrigger>
          <TabsTrigger value="sources" className={tabTrigger}>Sources</TabsTrigger>
          <TabsTrigger value="raw" className={tabTrigger}>Raw JSON</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            {riskFlags.length > 0 && (
              <section className="rounded-2xl border border-destructive/40 bg-card p-6">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
                  Worth a closer look
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The risk score is the sum of these flags: critical 40, high 25, medium 10, low 3.
                </p>
                <ul className="mt-4 divide-y">
                  {riskFlags.map((flag) => (
                    <li key={flag.id} className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">{flag.description}</p>
                          <p className="text-xs text-muted-foreground">Found by {flag.source}</p>
                        </div>
                        <RiskBadge severity={flag.severity} />
                      </div>
                      {flag.evidence?.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {flag.evidence.map((e, i) => (
                            <li key={i} className="max-w-full truncate rounded-md border bg-background px-2 py-0.5 font-mono text-xs">{e}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Key findings</h2>
              {summary.topFindings.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {active ? 'Findings show up here as sources answer.' : 'None of the sources returned anything for this target.'}
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {summary.topFindings.map((finding, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[3px] bg-highlight ring-1 ring-highlight-foreground/20" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              )}
              {results.length > 0 && (
                <Button variant="link" className="mt-3 h-auto p-0 text-trace" onClick={() => setActiveTab('details')}>
                  See all {results.length} findings
                </Button>
              )}
            </section>
          </div>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Modules</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Highlighted counts are findings per module.</p>
            <ModuleTrace modules={modules} />
          </section>
        </TabsContent>

        {/* Findings, grouped by module */}
        <TabsContent value="details" className="mt-6 space-y-8">
          {resultsByModule.length === 0 && (
            <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              {active ? 'No findings yet. They appear here as sources answer.' : 'This scan didn\'t return any findings.'}
            </p>
          )}
          {resultsByModule.map(({ module, results: moduleResults }) => (
            <section key={module.id}>
              <h2 className="mb-3 flex items-baseline gap-2 font-display text-xl font-semibold">
                {module.displayName}
                <span className="text-sm font-normal text-muted-foreground">{moduleResults.length}</span>
              </h2>
              <div className="grid items-start gap-3 lg:grid-cols-2">
                {moduleResults.map((result) => (
                  <DetailedResultCard key={result.id} result={result} />
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        {/* Graph — opts out of smooth scroll so wheel zoom works */}
        <TabsContent value="graph" className="mt-6">
          <div className="h-[min(820px,calc(100dvh-8rem))] min-h-[560px] rounded-2xl border bg-card p-3" data-lenis-prevent>
            <RelationshipGraph
              scanId={scanId}
              version={results.length}
              renderActions={(node) => <PivotAction node={node} parentScanId={scan.id} />}
            />
          </div>
        </TabsContent>

        {/* Sources */}
        <TabsContent value="sources" className="mt-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sources.map((source) => (
              <div key={source.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{source.name}</h3>
                  <span className="text-xs text-muted-foreground">{source.category}</span>
                </div>
                <p className="mt-1 truncate text-sm text-trace">{source.url}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reliability {Math.round(source.reliability * 100)}%</span>
                  <span className="truncate pl-2">{source.dataTypes.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Raw JSON */}
        <TabsContent value="raw" className="mt-6">
          <div className="mb-2 flex justify-end">
            <CopyButton value={() => JSON.stringify(details, null, 2)} label="Copy JSON" icon={CodeBracketIcon} showLabel />
          </div>
          <div className="h-[640px] overflow-auto rounded-2xl border bg-card" data-lenis-prevent>
            <CodeBlock value={details} className="!rounded-none !bg-transparent min-h-full" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
