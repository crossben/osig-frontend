// ============================================
// Scan History Page Component
// ============================================

'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  UserIcon,
  GlobeAltIcon,
  PhoneIcon,
  CpuChipIcon,
  BuildingOffice2Icon,
  XCircleIcon,
  EyeIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/layout/page-header';
import { useScans } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { TargetType, ScanStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ScanStatus, { label: string; dot: string }> = {
  pending: { label: 'Queued', dot: 'bg-muted-foreground' },
  running: { label: 'Running', dot: 'bg-trace animate-pulse' },
  completed: { label: 'Completed', dot: 'bg-success' },
  failed: { label: 'Failed', dot: 'bg-destructive' },
};

const targetTypeConfig: Record<TargetType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  email: { label: 'Email', icon: EnvelopeIcon },
  username: { label: 'Username', icon: UserIcon },
  domain: { label: 'Domain', icon: GlobeAltIcon },
  phone: { label: 'Phone', icon: PhoneIcon },
  ip: { label: 'IP address', icon: CpuChipIcon },
  organization: { label: 'Organization', icon: BuildingOffice2Icon },
};

const openScan = (id: string) => { window.location.hash = `#/scan?id=${id}`; };
const goNewScan = () => { window.location.hash = '#/'; };

function StatusLabel({ status, progress }: { status: ScanStatus; progress: number }) {
  const config = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
      {status === 'running' && <span className="text-muted-foreground">{progress}%</span>}
    </span>
  );
}

export function ScanHistoryPage() {
  const [filters, setFilters] = useState<{
    targetType?: TargetType;
    status?: ScanStatus;
    search?: string;
  }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useScans({ targetType: filters.targetType, status: filters.status, limit: 100 });
  const scans = data?.scans || [];

  const filteredScans = scans.filter(scan => {
    if (!filters.search) return true;
    return scan.targetValue.toLowerCase().includes(filters.search.toLowerCase());
  });
  const hasFilters = !!(filters.targetType || filters.status || filters.search);

  const cancelScan = async (id: string) => {
    try {
      await api.cancelScan(id);
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      toast({ title: 'Scan cancelled' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not cancel the scan', description: e instanceof Error ? e.message : undefined });
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Scan history"
        description="Every scan you've run. Open one to see its findings, graph and exports."
        actions={
          <Button onClick={goNewScan}>
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            New scan
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search scans by target"
            placeholder="Search targets"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-card pl-9"
          />
        </div>
        <Select
          value={filters.targetType || 'all'}
          onValueChange={(value) => setFilters({ ...filters, targetType: value === 'all' ? undefined : value as TargetType })}
        >
          <SelectTrigger className="w-full bg-card md:w-[150px]" aria-label="Filter by target type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="username">Username</SelectItem>
            <SelectItem value="domain">Domain</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="ip">IP address</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value as ScanStatus })}
        >
          <SelectTrigger className="w-full bg-card md:w-[150px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="pending">Queued</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={() => setFilters({})}>Clear filters</Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? (
          <div className="space-y-4 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <h3 className="font-display text-xl font-semibold">
              {hasFilters ? 'No scans match these filters' : 'No scans yet'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {hasFilters
                ? 'Change or clear the filters to see more.'
                : 'Run a scan on an email, username, domain or phone number and it will show up here.'}
            </p>
            {hasFilters
              ? <Button variant="outline" className="mt-5" onClick={() => setFilters({})}>Clear filters</Button>
              : <Button className="mt-5" onClick={goNewScan}>Start a scan</Button>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Target</TableHead>
                <TableHead>Depth</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="pr-6 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScans.map((scan) => {
                const type = targetTypeConfig[scan.targetType];
                const created = new Date(scan.createdAt);
                const active = scan.status === 'pending' || scan.status === 'running';
                return (
                  <TableRow
                    key={scan.id}
                    className="cursor-pointer"
                    onClick={() => openScan(scan.id)}
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-trace">
                          <type.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <a
                            href={`#/scan?id=${scan.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block truncate font-mono text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-trace"
                          >
                            {scan.targetValue}
                          </a>
                          <div className="text-xs text-muted-foreground">{type.label}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{scan.scanType}</TableCell>
                    <TableCell><StatusLabel status={scan.status} progress={scan.progress} /></TableCell>
                    <TableCell>
                      <div className="text-sm">{created.toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </TableCell>
                    <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${scan.targetValue}`}>
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openScan(scan.id)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Open scan
                          </DropdownMenuItem>
                          {active && (
                            <DropdownMenuItem className="text-destructive" onSelect={() => cancelScan(scan.id)}>
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              Cancel scan
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {filteredScans.length > 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {filteredScans.length} of {data?.total || filteredScans.length} scans
        </p>
      )}
    </div>
  );
}
