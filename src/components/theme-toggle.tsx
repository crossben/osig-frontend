'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useT();

  if (!mounted) return <Button variant="ghost" size="icon" className="h-9 w-9" aria-hidden />;

  const dark = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      <span className="sr-only">{dark ? t('Switch to light theme') : t('Switch to dark theme')}</span>
    </Button>
  );
}
