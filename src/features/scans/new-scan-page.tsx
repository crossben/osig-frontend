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
  ExclamationTriangleIcon,
  BoltIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateScan } from '@/hooks/use-api';
import { TargetType, ScanType } from '@/types';
import { cn } from '@/lib/utils';

const targetTypes: { value: TargetType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string; description: string }[] = [
  {
    value: 'email',
    label: 'Email Address',
    icon: EnvelopeIcon,
    placeholder: 'example@domain.com',
    description: 'Search for breaches, social profiles, and more',
  },
  {
    value: 'username',
    label: 'Username',
    icon: UserIcon,
    placeholder: 'johndoe123',
    description: 'Find social media profiles and online accounts',
  },
  {
    value: 'domain',
    label: 'Domain',
    icon: GlobeAltIcon,
    placeholder: 'example.com',
    description: 'Analyze domain records, subdomains, and infrastructure',
  },
  {
    value: 'phone',
    label: 'Phone Number',
    icon: PhoneIcon,
    placeholder: '+1-555-123-4567',
    description: 'Lookup phone number information and associations',
  },
];

const scanTypes: { value: ScanType; label: string; icon: React.ComponentType<{ className?: string }>; description: string; timeEstimate: string }[] = [
  {
    value: 'quick',
    label: 'Quick Scan',
    icon: BoltIcon,
    description: 'Fast overview of key sources',
    timeEstimate: '~2 minutes',
  },
  {
    value: 'deep',
    label: 'Deep Scan',
    icon: CircleStackIcon,
    description: 'Comprehensive analysis of all available sources',
    timeEstimate: '~10 minutes',
  },
];

export function NewScanPage() {
  const createScanMutation = useCreateScan();
  const [targetType, setTargetType] = useState<TargetType>('email');
  const [targetValue, setTargetValue] = useState('');
  const [scanType, setScanType] = useState<ScanType>('quick');
  const [confirmLegitimate, setConfirmLegitimate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTarget = targetTypes.find((t) => t.value === targetType);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!targetValue.trim()) {
      newErrors.targetValue = 'Please enter a target value';
    } else {
      // Basic validation based on target type
      switch (targetType) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetValue)) {
            newErrors.targetValue = 'Please enter a valid email address';
          }
          break;
        case 'domain':
          if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*(\.[a-zA-Z]{2,})+$/.test(targetValue)) {
            newErrors.targetValue = 'Please enter a valid domain';
          }
          break;
        case 'phone':
          if (!/^\+?[\d\s-()]{7,}$/.test(targetValue)) {
            newErrors.targetValue = 'Please enter a valid phone number';
          }
          break;
        case 'username':
          if (targetValue.length < 2) {
            newErrors.targetValue = 'Username must be at least 2 characters';
          }
          break;
      }
    }

    if (!confirmLegitimate) {
      newErrors.confirmLegitimate = 'You must confirm you have a legitimate purpose';
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
      confirmLegitimate,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Scan</h1>
        <p className="text-muted-foreground">
          Start a new intelligence gathering scan
        </p>
      </div>

      {/* Legal Notice */}
      <Alert>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>
          OSIG uses only public and legally accessible information. Ensure you have proper authorization before scanning targets you do not own.
        </AlertDescription>
      </Alert>

      {/* Scan Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Configure Scan</CardTitle>
            <CardDescription>
              Select the target type and enter the value to scan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Type Selection */}
            <div className="space-y-3">
              <Label>Target Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {targetTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setTargetType(type.value);
                      setTargetValue('');
                      setErrors({});
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      targetType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <type.icon className={cn(
                      'h-6 w-6',
                      targetType === type.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      targetType === type.value ? 'text-primary' : 'text-foreground'
                    )}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Value Input */}
            <div className="space-y-2">
              <Label htmlFor="targetValue">
                {selectedTarget?.label} <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {selectedTarget && (
                  <selectedTarget.icon className="h-5 w-5 text-muted-foreground" />
                )}
                <Input
                  id="targetValue"
                  type={targetType === 'email' ? 'email' : 'text'}
                  placeholder={selectedTarget?.placeholder}
                  value={targetValue}
                  onChange={(e) => {
                    setTargetValue(e.target.value);
                    if (errors.targetValue) setErrors({ ...errors, targetValue: '' });
                  }}
                  className={cn(errors.targetValue && 'border-destructive')}
                />
              </div>
              {errors.targetValue && (
                <p className="text-sm text-destructive">{errors.targetValue}</p>
              )}
              {selectedTarget && (
                <p className="text-sm text-muted-foreground">{selectedTarget.description}</p>
              )}
            </div>

            {/* Scan Type Selection */}
            <div className="space-y-3">
              <Label>Scan Type</Label>
              <RadioGroup
                value={scanType}
                onValueChange={(value) => setScanType(value as ScanType)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {scanTypes.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      'relative flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all',
                      scanType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <type.icon className={cn(
                      'h-5 w-5 mt-0.5',
                      scanType === type.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="font-medium cursor-pointer">
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{type.timeEstimate}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
              <Checkbox
                id="confirm"
                checked={confirmLegitimate}
                onCheckedChange={(checked) => {
                  setConfirmLegitimate(checked as boolean);
                  if (errors.confirmLegitimate) setErrors({ ...errors, confirmLegitimate: '' });
                }}
                className={cn(errors.confirmLegitimate && 'border-destructive')}
              />
              <div className="space-y-1">
                <Label htmlFor="confirm" className="text-sm font-medium cursor-pointer leading-tight">
                  I confirm I have a legitimate purpose and understand only public info is used
                </Label>
                {errors.confirmLegitimate && (
                  <p className="text-sm text-destructive">{errors.confirmLegitimate}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={createScanMutation.isPending}
            >
              {createScanMutation.isPending ? 'Starting Scan...' : 'Start Scan'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
