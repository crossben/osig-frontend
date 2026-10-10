'use client';

// Icon button that copies text and briefly confirms with a check mark.

import { useEffect, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  /** Text to copy, or a function producing it at click time */
  value: string | (() => string);
  label: string;
  icon: React.ElementType;
  className?: string;
  /** Show the label next to the icon instead of only as a tooltip */
  showLabel?: boolean;
}

export function CopyButton({ value, label, icon: Icon, className, showLabel }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(typeof value === 'function' ? value() : value);
      setCopied(true);
    } catch {
      toast({ variant: 'destructive', title: 'Couldn’t copy', description: 'Your browser blocked clipboard access.' });
    }
  };

  const Shown = copied ? CheckIcon : Icon;
  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied' : label}
      aria-label={copied ? 'Copied' : label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-trace',
        showLabel ? 'h-8 px-2.5 text-sm' : 'h-7 w-7 justify-center',
        copied && 'text-success hover:text-success',
        className,
      )}
    >
      <Shown className="h-4 w-4" />
      {showLabel && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}
