// ============================================
// Threat-intel export (STIX 2.1 / MISP) for a scan or an investigation
// ============================================

'use client';

import { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ExportFormat } from '@/types';
import { useT } from '@/lib/i18n';

interface ExportMenuProps {
  kind: 'scan' | 'investigation';
  id: string;
  /** File name stem, e.g. the target or investigation name */
  name: string;
  disabled?: boolean;
  className?: string;
}

const safeName = (s: string) => s.replace(/[^a-z0-9.@_-]+/gi, '_').slice(0, 80) || 'osig';

export function ExportMenu({ kind, id, name, disabled, className }: ExportMenuProps) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const { toast } = useToast();
  const t = useT();

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      const blob = kind === 'scan' ? await api.exportScan(id, format) : await api.exportInvestigation(id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName(name)}.${format}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('Export failed'),
        description: t('{error}. Try again in a moment.', { error: e instanceof Error ? e.message : t('The export did not download') }),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || busy !== null} className={className}>
          <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
          {busy ? t('Exporting…') : t('Threat intel')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => run('stix')}>{t('STIX 2.1 bundle')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run('misp')}>{t('MISP event')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
