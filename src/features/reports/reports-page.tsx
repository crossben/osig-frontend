// ============================================
// Reports Page Component
// ============================================

'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { PageHeader } from '@/components/layout/page-header';
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
import { useReports, useCreateReport, useScans } from '@/hooks/use-api';
import { downloadReportFile } from '@/lib/download-report';
import { useToast } from '@/hooks/use-toast';
import { ReportStatus, ReportFormat } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ReportStatus, { label: string; dot: string }> = {
  generating: { label: 'Generating', dot: 'bg-trace animate-pulse' },
  ready: { label: 'Ready', dot: 'bg-success' },
  failed: { label: 'Failed', dot: 'bg-destructive' },
};

const formatConfig: Record<ReportFormat, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pdf: { label: 'PDF report', icon: DocumentTextIcon },
  json: { label: 'JSON data', icon: CodeBracketIcon },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportsPage() {
  const { data, isLoading } = useReports();
  const reports = data?.reports || [];
  const createReportMutation = useCreateReport();
  const { toast } = useToast();
  const { data: scansData, isLoading: scansLoading } = useScans({ status: 'completed', limit: 100 });
  const completedScans = scansData?.scans ?? [];
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
      await downloadReportFile(report);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Could not download the report',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Exports of your completed scans. PDFs list every finding; JSON holds the raw data."
        actions={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Generate report
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
                <Label htmlFor="scanId">Scan</Label>
                <Select
                  value={newReport.scanId}
                  onValueChange={(scanId) => {
                    const scan = completedScans.find(s => s.id === scanId);
                    setNewReport({
                      ...newReport,
                      scanId,
                      // Suggest a name unless the user already typed one
                      name: newReport.name || (scan
                        ? `${scan.targetValue} ${scan.createdAt.slice(0, 10)}`
                        : ''),
                    });
                  }}
                  disabled={completedScans.length === 0}
                >
                  <SelectTrigger id="scanId" className="w-full">
                    <SelectValue placeholder={
                      scansLoading ? 'Loading scans…'
                        : completedScans.length === 0 ? 'No completed scans yet'
                        : 'Choose a completed scan'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {completedScans.map(scan => (
                      <SelectItem key={scan.id} value={scan.id}>
                        <span className="font-medium">{scan.targetValue}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {scan.targetType} · {scan.scanType} · {new Date(scan.createdAt).toLocaleString()}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        }
      />

      {/* Reports Table */}
      <div className="overflow-hidden rounded-2xl border bg-card">
          {isLoading ? (
            <div className="p-6">
              <SkeletonTable rows={5} columns={6} showHeader={true} />
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <h3 className="font-display text-xl font-semibold">No reports yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Generate one from a completed scan, or use Export on any scan page.
              </p>
              <Button className="mt-5" onClick={() => setIsCreateDialogOpen(true)}>Generate a report</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Report</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="pr-6 text-right"><span className="sr-only">Download</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const format = formatConfig[report.format];
                  const status = statusConfig[report.status];
                  const created = new Date(report.createdAt);
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-trace">
                            <format.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{report.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {format.label} ·{' '}
                              <a href={`#/scan?id=${report.scanId}`} className="hover:underline">open scan</a>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span aria-hidden className={cn('h-2 w-2 rounded-full', status.dot)} />
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.fileSize ? formatFileSize(report.fileSize) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{created.toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={report.status !== 'ready'}
                          onClick={() => handleDownload(report)}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
      </div>
    </div>
  );
}
