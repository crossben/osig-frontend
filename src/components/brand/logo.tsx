// OSIG mark: a lens ring (the target) with traces fanning out to sources,
// one of them highlighted (the finding). Fixed navy tile so it reads the same
// on light and dark backgrounds.

import { cn } from '@/lib/utils';

const TRACES: [number, number, number, number][] = [
  [15.81, 16.19, 24.17, 7.83],
  [17.52, 19.08, 25.79, 16.65],
  [13.43, 14.65, 16.68, 6.15],
  [17.55, 22.84, 24.98, 24.93],
];

export function LogoMark({ className, title = 'OSIG' }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7 shrink-0', className)} role="img" aria-label={title}>
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="#13233F" stroke="#2C3F64" strokeWidth="1" />
      <g stroke="#7FA0D6" strokeWidth="1.6" strokeLinecap="round">
        {TRACES.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}
      </g>
      <circle cx="26.5" cy="5.5" r="2.7" fill="#F2E85C" />
      <circle cx="28" cy="16" r="1.7" fill="#7FA0D6" />
      <circle cx="17.5" cy="4" r="1.7" fill="#7FA0D6" />
      <circle cx="27" cy="25.5" r="1.5" fill="#7FA0D6" />
      <circle cx="11" cy="21" r="5.2" fill="none" stroke="#E6ECF5" strokeWidth="2.8" />
      <circle cx="11" cy="21" r="1.6" fill="#E6ECF5" />
    </svg>
  );
}

export function Logo({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={size === 'lg' ? 'h-8 w-8' : 'h-7 w-7'} title="" />
      <span className={cn('font-display font-extrabold tracking-tight', size === 'lg' ? 'text-xl' : 'text-lg')}>OSIG</span>
    </span>
  );
}
