'use client';

// Bulk scan: one investigation from a CSV list of targets.

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, CheckCircleIcon, DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

type T = ReturnType<typeof useT>;
import type { BulkScanResult, ScanType } from '@/types';

const TYPES = ['email', 'domain', 'username', 'phone', 'ip', 'organization'] as const;
const MAX_ROWS = 50;
const MAX_BYTES = 100 * 1024;

interface Row { line: number; type: string; value: string; problem?: string }

/** Rough client-side check; the server has the final word */
function parse(csv: string, t: T): Row[] {
  const rows: Row[] = [];
  csv.split(/\r?\n/).forEach((raw, i) => {
    const text = raw.trim();
    if (!text || text.startsWith('#')) return;
    const comma = text.indexOf(',');
    const type = (comma < 0 ? text : text.slice(0, comma)).trim().replace(/^"|"$/g, '').toLowerCase();
    const value = (comma < 0 ? '' : text.slice(comma + 1)).trim().replace(/^"|"$/g, '');
    if (i === 0 && type === 'type') return; // header
    let problem: string | undefined;
    if (!(TYPES as readonly string[]).includes(type)) problem = t('Unknown type “{type}”. Use {types}.', { type, types: TYPES.join(', ') });
    else if (!value) problem = t('Missing value after the comma.');
    else if (type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) problem = t('Not an email address.');
    else if (type === 'domain' && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(value)) problem = t('Not a domain name.');
    else if (type === 'ip' && !/^[\d.]+$|:/.test(value)) problem = t('Not an IP address.');
    else if (type === 'ip' && /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(value)) problem = t('Private address; only public IPs can be scanned.');
    rows.push({ line: i + 1, type, value, problem });
  });
  return rows;
}

/** 422 bodies carry {message, errors}; apiCall flattens them to JSON text */
function readError(e: unknown, t: T): { message: string; errors: { line: number; error: string }[] } {
  const detail = (e as { cause?: { response?: { data?: { detail?: unknown } } } })?.cause?.response?.data?.detail;
  if (detail && typeof detail === 'object' && !Array.isArray(detail) && 'message' in detail) {
    const d = detail as { message: string; errors?: { line: number; error: string }[] };
    return { message: d.message, errors: d.errors ?? [] };
  }
  const status = (e as { cause?: { response?: { status?: number } } })?.cause?.response?.status;
  const msg = e instanceof Error ? e.message : t('Try again in a moment.');
  if (status === 403) return { message: `${msg} ${t('Verify your email from the link we sent, then try again.')}`, errors: [] };
  if (status === 429) return { message: `${msg}. ${t('Remove some rows or wait until the count resets at midnight UTC.')}`, errors: [] };
  return { message: msg, errors: [] };
}

export function BulkScanPage() {
  const t = useT();
  const [name, setName] = useState('');
  const [csv, setCsv] = useState('');
  const [scanType, setScanType] = useState<ScanType>('quick');
  const [accepted, setAccepted] = useState(false);
  const [fileError, setFileError] = useState('');
  const [result, setResult] = useState<BulkScanResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const rows = useMemo(() => parse(csv, t), [csv, t]);
  const bad = rows.filter((r) => r.problem);
  const tooMany = rows.length > MAX_ROWS;

  const submit = useMutation({
    mutationFn: () => api.bulkScan({ name: name.trim(), csv, scanType, disclaimerAccepted: accepted }),
    onSuccess: (r) => {
      setResult(r);
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
  const err = submit.isError ? readError(submit.error, t) : null;

  const onFile = (file: File | undefined) => {
    setFileError('');
    if (!file) return;
    if (file.size > MAX_BYTES) { setFileError(t('That file is over 100 KB. Split it into smaller lists.')); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result ?? ''));
      if (!name.trim()) setName(file.name.replace(/\.(csv|txt)$/i, ''));
    };
    reader.onerror = () => setFileError(t('That file couldn’t be read. Paste its contents instead.'));
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (result) {
    return (
      <div className="w-full">
        <PageHeader title={t('Bulk scan started')} />
        <div className="rounded-2xl border bg-card p-6 md:p-8">
          <p className="flex items-center gap-2 text-lg">
            <CheckCircleIcon className="h-6 w-6 text-trace" />
            {t(result.started === 1 ? 'Started {n} scan.' : 'Started {n} scans.', { n: result.started })}
          </p>
          {result.errors.length > 0 && <LineErrors errors={result.errors} title={t('These lines were skipped')} />}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild><a href={`#/investigation?id=${result.investigationId}`}>{t('Open the investigation')}</a></Button>
            <Button variant="outline" onClick={() => { setResult(null); setCsv(''); setName(''); submit.reset(); }}>{t('Scan another list')}</Button>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = name.trim() && rows.length > 0 && !tooMany && accepted && !submit.isPending;

  return (
    <div className="w-full">
      <a href="#/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" /> {t('New scan')}
      </a>
      <div className="mt-4">
        <PageHeader
          title={t('Scan a list')}
          description={t('Paste up to {n} targets, one per line as type,value. They all land in one new investigation with a merged graph.', { n: MAX_ROWS })}
        />
      </div>

      {err && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>{t('The scans didn’t start')}</AlertTitle>
          <AlertDescription>
            {err.message}
            {err.errors.length > 0 && <LineErrors errors={err.errors} />}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <form
          className="min-w-0 rounded-2xl border bg-card p-6 md:p-8"
          noValidate
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit.mutate(); }}
        >
          <div className="space-y-2">
            <Label htmlFor="bulk-name">{t('Investigation name')}</Label>
            <Input id="bulk-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200}
              placeholder={t('e.g. Q3 phishing domains')} className="bg-background" />
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <Label htmlFor="bulk-csv">{t('Targets')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <DocumentArrowUpIcon className="mr-2 h-4 w-4" /> {t('Choose a CSV file')}
              </Button>
              <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <Textarea id="bulk-csv" value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} spellCheck={false}
              placeholder={'type,value\ndomain,example.com\nemail,someone@example.com\nip,8.8.8.8'}
              className="bg-background font-mono text-sm" data-lenis-prevent />
            <p className="text-xs text-muted-foreground">
              {t('Types: {types}. A header row is optional. Files up to 100 KB.', { types: TYPES.join(', ') })}
            </p>
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          </div>

          <div className="mt-6 space-y-2">
            <Label>{t('Depth')}</Label>
            <Select value={scanType} onValueChange={(v) => setScanType(v as ScanType)}>
              <SelectTrigger className="w-full bg-background sm:w-60" aria-label={t('Scan depth')}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">{t('Quick: core sources')}</SelectItem>
                <SelectItem value="deep">{t('Deep: every source')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-8 flex flex-col gap-5 border-t pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Checkbox id="bulk-confirm" checked={accepted} onCheckedChange={(c) => setAccepted(c === true)} className="mt-0.5" />
              <Label htmlFor="bulk-confirm" className="cursor-pointer text-sm font-normal leading-snug">
                {t('I have a legitimate reason to look into these targets.')}
              </Label>
            </div>
            <Button type="submit" size="lg" className="shrink-0" disabled={!canSubmit}>
              {submit.isPending ? t('Starting scans…') : rows.length ? t(rows.length === 1 ? 'Start {n} scan' : 'Start {n} scans', { n: rows.length }) : t('Start scans')}
            </Button>
          </div>
        </form>

        <aside className="min-w-0 rounded-2xl border bg-card/70 p-6 md:p-8" aria-live="polite">
          <h2 className="font-display text-xl font-semibold">{t('Preview')}</h2>
          <p className={cn('mt-1 text-sm', tooMany ? 'text-destructive' : 'text-muted-foreground')}>
            {rows.length === 0
              ? t('Rows appear here as you type.')
              : tooMany
                ? t('{n} rows. The limit is {max}; remove {extra} to continue.', { n: rows.length, max: MAX_ROWS, extra: rows.length - MAX_ROWS })
                : `${t(rows.length === 1 ? '{n} row' : '{n} rows', { n: rows.length })}${bad.length ? t(bad.length === 1 ? ', {n} looks wrong and will likely be skipped' : ', {n} look wrong and will likely be skipped', { n: bad.length }) : ''}.`}
          </p>
          {rows.length > 0 && (
            <ul className="mt-4 max-h-[28rem] divide-y overflow-y-auto text-sm" data-lenis-prevent>
              {rows.map((r) => (
                <li key={r.line} className="flex gap-3 py-2">
                  <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{r.line}</span>
                  <div className="min-w-0">
                    <p className="truncate"><span className="text-muted-foreground">{r.type}</span> <span className="font-mono">{r.value}</span></p>
                    {r.problem && <p className="text-xs text-destructive">{r.problem}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function LineErrors({ errors, title }: { errors: { line: number; error: string }[]; title?: string }) {
  const t = useT();
  return (
    <div className="mt-3">
      {title && <p className="text-sm font-medium">{title}</p>}
      <ul className="mt-1 space-y-0.5 text-sm">
        {errors.map((e) => <li key={`${e.line}-${e.error}`}>{t('Line {n}: {error}', { n: e.line, error: e.error })}</li>)}
      </ul>
    </div>
  );
}
