// ============================================
// Scan History Page Component
// ============================================

'use client';

import { useState } from 'react';

import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  UserIcon,
  GlobeAltIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScans } from '@/hooks/use-api';
import { TargetType, ScanStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ScanStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: ClockIcon },
  running: { label: 'Running', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: ArrowPathIcon },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: CheckCircleIcon },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircleIcon },
};

const targetTypeConfig: Record<TargetType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  email: { label: 'Email', icon: EnvelopeIcon },
  username: { label: 'Username', icon: UserIcon },
  domain: { label: 'Domain', icon: GlobeAltIcon },
  phone: { label: 'Phone', icon: PhoneIcon },
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

function TargetTypeBadge({ type }: { type: TargetType }) {
  const config = targetTypeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

export function ScanHistoryPage() {
  const [filters, setFilters] = useState<{
    targetType?: TargetType;
    status?: ScanStatus;
    search?: string;
  }>({});

  const { data, isLoading } = useScans(filters);
  const scans = data?.scans || [];

  // Filter scans by search term
  const filteredScans = scans.filter(scan => {
    if (!filters.search) return true;
    return scan.targetValue.toLowerCase().includes(filters.search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scan History</h1>
          <p className="text-muted-foreground">
            View and manage your previous scans
          </p>
        </div>
        <Button onClick={() => { window.location.hash = '#/new-scan'; }}>
          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
          New Scan
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FunnelIcon className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by target value..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <Select
              value={filters.targetType || 'all'}
              onValueChange={(value) => setFilters({ ...filters, targetType: value === 'all' ? undefined : value as TargetType })}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Target Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="username">Username</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value as ScanStatus })}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({})}
              disabled={!filters.targetType && !filters.status && !filters.search}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scans Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <ClockIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No scans found</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                {filters.targetType || filters.status || filters.search
                  ? 'Try adjusting your filters'
                  : 'Start your first scan to see it here'}
              </p>
              <Button className="mt-4" onClick={() => { window.location.hash = '#/new-scan'; }}>
                New Scan
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div className="font-medium">{scan.targetValue}</div>
                      <div className="text-xs text-muted-foreground">
                        {scan.scanType} scan
                      </div>
                    </TableCell>
                    <TableCell>
                      <TargetTypeBadge type={scan.targetType} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={scan.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${scan.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{scan.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(scan.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer"
                            onClick={() => { window.location.hash = `#/scan?id=${scan.id}`; }}
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination would go here */}
      {filteredScans.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredScans.length} of {data?.total || filteredScans.length} scans
        </div>
      )}
    </div>
  );
}
