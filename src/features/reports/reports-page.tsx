// ============================================
// Reports Page Component
// ============================================

'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CodeBracketIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReports, useCreateReport } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { ReportStatus, ReportFormat } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ReportStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  generating: { label: 'Generating', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: ClockIcon },
  ready: { label: 'Ready', color: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: CheckCircleIcon },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircleIcon },
};

const formatConfig: Record<ReportFormat, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pdf: { label: 'PDF', icon: DocumentTextIcon },
  json: { label: 'JSON', icon: CodeBracketIcon },
};

function StatusBadge({ status }: { status: ReportStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={cn('gap-1.5', config.color)}>
      <Icon className={cn('h-3.5 w-3.5', status === 'generating' && 'animate-pulse')} />
      {config.label}
    </Badge>
  );
}

function FormatBadge({ format }: { format: ReportFormat }) {
  const config = formatConfig[format];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportsPage() {
  const { data, isLoading } = useReports();
  const reports = data?.reports || [];
  const createReportMutation = useCreateReport();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    scanId: '',
    name: '',
    format: 'pdf' as ReportFormat,
  });

  const handleCreateReport = () => {
    if (!newReport.scanId || !newReport.name) return;

    createReportMutation.mutate(newReport, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setNewReport({ scanId: '', name: '', format: 'pdf' });
      },
    });
  };

  const handleDownload = async (report: { id: string; name: string; format: string }) => {
    try {
      const blob = await api.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Download and manage your generated reports
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Create a report from one of your completed scans
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scanId">Scan ID</Label>
                <Input
                  id="scanId"
                  placeholder="Enter scan ID"
                  value={newReport.scanId}
                  onChange={(e) => setNewReport({ ...newReport, scanId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  placeholder="My Report"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select
                  value={newReport.format}
                  onValueChange={(value) => setNewReport({ ...newReport, format: value as ReportFormat })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="json">JSON Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateReport}
                disabled={!newReport.scanId || !newReport.name || createReportMutation.isPending}
              >
                {createReportMutation.isPending ? 'Generating...' : 'Generate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <SkeletonTable rows={5} columns={6} showHeader={true} />
            </div>
          ) : !reports || reports.length === 0 ? (
            <EmptyState
              icon={DocumentTextIcon}
              title="No reports yet"
              description="Generate a report from a completed scan to download and share your findings"
              actionLabel="Generate Report"
              onAction={() => setIsCreateDialogOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                          <DocumentTextIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Scan ID: {report.scanId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <FormatBadge format={report.format} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell>
                      {report.fileSize ? formatFileSize(report.fileSize) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === 'ready' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleDownload(report)}
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </>
                        )}
                        {report.status === 'generating' && (
                          <Button size="sm" variant="outline" disabled>
                            <ClockIcon className="h-4 w-4 mr-2 animate-pulse" />
                            Processing...
                          </Button>
                        )}
                        {report.status === 'failed' && (
                          <Button size="sm" variant="outline" disabled>
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Failed
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive">
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
