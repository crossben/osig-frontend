// ============================================
// New Scan Page Component
// ============================================

'use client';

import { useState } from 'react';
import {
  EnvelopeIcon,
  UserIcon,
  GlobeAltIcon,
  PhoneIcon,
  CpuChipIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  BoltIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateScan, useQuotaStatus } from '@/hooks/use-api';
import { TargetType, ScanType } from '@/types';
import { cn } from '@/lib/utils';
import { sourcesFor } from '@/lib/scan-sources';
import { PageHeader } from '@/components/layout/page-header';
import { useT } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const targetTypes: { value: TargetType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string; description: string }[] = [
  {
    value: 'email',
    label: 'Email address',
    icon: EnvelopeIcon,
    placeholder: 'name@example.com',
    description: 'Accounts, breach exposure and reputation tied to the address.',
  },
  {
    value: 'username',
    label: 'Username',
    icon: UserIcon,
    placeholder: 'handle',
    description: 'Public profiles that use this exact handle.',
  },
  {
    value: 'domain',
    label: 'Domain',
    icon: GlobeAltIcon,
    placeholder: 'example.com',
    description: 'Ownership, DNS, subdomains and hosting.',
  },
  {
    value: 'phone',
    label: 'Phone number',
    icon: PhoneIcon,
    placeholder: '+1 202 555 0143',
    description: 'Include the country code, e.g. +221 or +1.',
  },
  {
    value: 'ip',
    label: 'IP address',
    icon: CpuChipIcon,
    placeholder: '93.184.215.14',
    description: 'Owner, location, open ports, known CVEs and scanning activity.',
  },
  {
    value: 'organization',
    label: 'Organization',
    icon: BuildingOffice2Icon,
    placeholder: 'Python Software Foundation',
    description: 'Public company facts, legal entities, official accounts and website.',
  },
];

const scanTypes: { value: ScanType; label: string; icon: React.ComponentType<{ className?: string }>; description: string; timeEstimate: string }[] = [
  {
    value: 'quick',
    label: 'Quick',
    icon: BoltIcon,
    description: 'The core sources for a fast first look.',
    timeEstimate: '~2 minutes',
  },
  {
    value: 'deep',
    label: 'Deep',
    icon: CircleStackIcon,
    description: 'Every source, including the slower ones.',
    timeEstimate: '~10 minutes',
  },
];

export function NewScanPage() {
  const t = useT();
  const createScanMutation = useCreateScan();
  const { data: quota } = useQuotaStatus();
  const [targetType, setTargetType] = useState<TargetType>('email');
  const [targetValue, setTargetValue] = useState('');
  const [scanType, setScanType] = useState<ScanType>('quick');
  // Deep scans are a paid feature: shown, but locked with a way to the plans
  const { data: billing } = useQuery({ queryKey: ['billing', 'me'], queryFn: () => api.getBillingMe(), staleTime: 60_000 });
  const deepLocked = billing ? !billing.limits.deepScans : false;
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTarget = targetTypes.find((tt) => tt.value === targetType);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!targetValue.trim()) {
      newErrors.targetValue = t('Enter a target to scan.');
    } else {
      // Basic validation based on target type
      switch (targetType) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetValue)) {
            newErrors.targetValue = t('That doesn\'t look like an email address.');
          }
          break;
        case 'domain':
          if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*(\.[a-zA-Z]{2,})+$/.test(targetValue)) {
            newErrors.targetValue = t('Enter a domain like example.com, without https://.');
          }
          break;
        case 'phone':
          if (!/^\+?[\d\s-()]{7,}$/.test(targetValue)) {
            newErrors.targetValue = t('Enter digits with the country code, e.g. +1 202 555 0143.');
          }
          break;
        case 'ip':
          if (!/^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+:[0-9a-fA-F:]*$/.test(targetValue.trim())) {
            newErrors.targetValue = t('Enter an IPv4 or IPv6 address.');
          }
          break;
        case 'organization':
          if (targetValue.trim().length < 2) {
            newErrors.targetValue = t('Enter the organization\'s name.');
          }
          break;
        case 'username':
          if (targetValue.length < 2) {
            newErrors.targetValue = t('Handles need at least 2 characters.');
          }
          break;
      }
    }

    if (!disclaimerAccepted) {
      newErrors.disclaimerAccepted = t('Confirm your reason before starting the scan.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    createScanMutation.mutate({
      targetType,
      targetValue: targetValue.trim(),
      scanType,
      disclaimerAccepted,
    });
  };

  const { all: allSources, active: activeSources } = sourcesFor(targetType, scanType);
  const noQuota = quota ? quota.remaining <= 0 : false;

  return (
    <div className="w-full">
      <PageHeader
        title={t('New scan')}
        description={t('Pick a target and OSIG traces it across public sources. Results appear on the scan page as each source answers.')}
        actions={<a href="#/bulk" className="text-sm text-trace hover:underline">{t('Scan a list from CSV')}</a>}
      />

      {createScanMutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>{t('The scan didn’t start')}</AlertTitle>
          <AlertDescription>
            {(createScanMutation.error as Error)?.message || t('Try again in a moment.')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* ── Form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 md:p-8" noValidate>
          {/* Target type */}
          <fieldset>
            <legend className="text-sm font-medium">{t('What are you looking into?')}</legend>
            <div role="radiogroup" className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">
              {targetTypes.map((type) => {
                const selected = targetType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setTargetType(type.value);
                      setTargetValue('');
                      setErrors({});
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trace',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-background hover:border-trace/60'
                    )}
                  >
                    <type.icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{t(type.label)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Target value — the focal field */}
          <div className="mt-8">
            <Label htmlFor="targetValue" className="text-sm font-medium">
              {selectedTarget && t(selectedTarget.label)}
            </Label>
            <input
              id="targetValue"
              type={targetType === 'email' ? 'email' : 'text'}
              autoComplete="off"
              spellCheck={false}
              placeholder={selectedTarget?.placeholder}
              value={targetValue}
              aria-invalid={!!errors.targetValue}
              aria-describedby="targetValue-help"
              onChange={(e) => {
                setTargetValue(e.target.value);
                if (errors.targetValue) setErrors({ ...errors, targetValue: '' });
              }}
              className={cn(
                'mt-2 w-full border-0 border-b-2 bg-transparent px-0 pb-3 pt-1 font-mono text-2xl outline-none transition-colors placeholder:text-muted-foreground/50 md:text-3xl',
                errors.targetValue ? 'border-destructive' : 'border-border focus:border-trace'
              )}
            />
            <p id="targetValue-help" className={cn('mt-2 text-sm', errors.targetValue ? 'text-destructive' : 'text-muted-foreground')}>
              {errors.targetValue || (selectedTarget && t(selectedTarget.description))}
            </p>
          </div>

          {/* Depth */}
          <fieldset className="mt-8">
            <legend className="text-sm font-medium">{t('Depth')}</legend>
            <RadioGroup
              value={scanType}
              onValueChange={(value) => setScanType(value as ScanType)}
              className="mt-3 grid gap-2 md:grid-cols-2"
            >
              {scanTypes.map((type) => {
                const locked = type.value === 'deep' && deepLocked;
                return (
                <Label
                  key={type.value}
                  htmlFor={`scanType-${type.value}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 transition-colors select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-trace',
                    locked ? 'cursor-default opacity-80' : scanType === type.value ? 'border-trace ring-1 ring-trace' : 'hover:border-trace/60'
                  )}
                >
                  <RadioGroupItem value={type.value} id={`scanType-${type.value}`} className="mt-0.5" disabled={locked} />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{t(type.label)}</span>
                      <span className="text-xs text-muted-foreground">{t(type.timeEstimate)}</span>
                    </div>
                    <p className="mt-1 text-sm font-normal text-muted-foreground">{t(type.description)}</p>
                    {locked && (
                      <p className="mt-2 text-sm font-normal">
                        {t('Included with Pro.')}{' '}
                        <a href="#/billing" className="font-medium text-trace underline-offset-4 hover:underline">{t('See plans')}</a>
                      </p>
                    )}
                  </div>
                </Label>
                );
              })}
            </RadioGroup>
          </fieldset>

          {/* Confirm + submit */}
          <div className="mt-8 flex flex-col gap-5 border-t pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm"
                checked={disclaimerAccepted}
                onCheckedChange={(checked) => {
                  setDisclaimerAccepted(checked as boolean);
                  if (errors.disclaimerAccepted) setErrors({ ...errors, disclaimerAccepted: '' });
                }}
                className={cn('mt-0.5', errors.disclaimerAccepted && 'border-destructive')}
              />
              <div>
                <Label htmlFor="confirm" className="cursor-pointer text-sm font-normal leading-snug">
                  {t('I have a legitimate reason to look into this target.')}
                </Label>
                {errors.disclaimerAccepted && (
                  <p className="mt-1 text-sm text-destructive">{errors.disclaimerAccepted}</p>
                )}
              </div>
            </div>
            <Button type="submit" size="lg" className="shrink-0" disabled={createScanMutation.isPending || noQuota}>
              {createScanMutation.isPending ? t('Starting scan…') : t('Start scan')}
            </Button>
          </div>
          {noQuota && (
            <p className="mt-3 text-right text-sm text-destructive">
              {t('You’ve used today’s {n} scans. The count resets at midnight UTC.', { n: quota?.dailyLimit ?? 0 })}
            </p>
          )}
        </form>

        {/* ── What this scan checks ────────────────────── */}
        <aside className="rounded-2xl border bg-card/70 p-6 md:p-8" aria-live="polite">
          <h2 className="font-display text-xl font-semibold">{t('This scan checks')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('{active} of {all} sources for {target}', { active: activeSources.length, all: allSources.length, target: selectedTarget ? t(selectedTarget.label).toLowerCase() : '' })}
            {scanType === 'quick' && allSources.length > activeSources.length ? t('. Deep adds the rest.') : '.'}
          </p>
          <ul className="relative mt-6 space-y-1 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-trace/40">
            {allSources.map((source) => {
              const on = activeSources.includes(source);
              return (
                <li key={source.name} className={cn('relative flex gap-4 py-2 pl-6 transition-opacity', !on && 'opacity-45')}>
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-0 top-[0.85rem] h-[11px] w-[11px] rounded-full border-2',
                      on ? 'border-trace bg-trace' : 'border-trace/60 bg-card'
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {t(source.name)}
                      {!on && <span className="ml-2 text-xs font-normal text-muted-foreground">{t('deep only')}</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">{t(source.what)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
