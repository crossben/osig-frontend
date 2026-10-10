'use client';

// Shared frame for sign-in and sign-up: form on the left, a navy panel with a
// small trace on the right (large screens only).

import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { GSAP_EASE, isReducedMotion } from '@/lib/motion';

gsap.registerPlugin(useGSAP);

const NODES = [
  { x: 60, y: 60, label: 'WHOIS' },
  { x: 330, y: 40, label: 'GitHub' },
  { x: 380, y: 200, label: 'crt.sh' },
  { x: 300, y: 340, label: 'DNS' },
  { x: 50, y: 300, label: 'Gravatar' },
];

function MiniTrace() {
  const ref = useRef<SVGSVGElement>(null);
  useGSAP(() => {
    if (isReducedMotion()) return;
    const lines = gsap.utils.toArray<SVGLineElement>('line', ref.current);
    lines.forEach((l) => {
      const len = l.getTotalLength();
      gsap.set(l, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.timeline({ defaults: { ease: GSAP_EASE }, delay: 0.2 })
      .to(lines, { strokeDashoffset: 0, duration: 1, stagger: 0.1 })
      .from(gsap.utils.toArray('g[data-node]', ref.current), { autoAlpha: 0, duration: 0.4, stagger: 0.08 }, '<0.4');
  }, { scope: ref });

  return (
    <svg ref={ref} viewBox="0 0 440 380" className="w-full max-w-md" aria-hidden>
      {NODES.map((n) => (
        <line key={n.label} x1={210} y1={190} x2={n.x} y2={n.y} stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.25} />
      ))}
      <circle cx={210} cy={190} r={9} fill="var(--highlight)" />
      {NODES.map((n) => (
        <g key={n.label} data-node>
          <circle cx={n.x} cy={n.y} r={4} fill="currentColor" />
          <text x={n.x} y={n.y - 12} textAnchor="middle" fontSize={13} fill="currentColor" fillOpacity={0.75}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2">
            <Logo size="lg" />
          </a>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-4xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
        <p className="text-xs text-muted-foreground">OSIG reads public sources only.</p>
      </div>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#13233F] p-12 text-[#E6ECF5] lg:flex dark:bg-[#16233B]">
        <div className="paper-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative flex flex-1 items-center justify-center">
          <MiniTrace />
        </div>
        <p className="relative max-w-md font-display text-2xl font-semibold leading-snug">
          One target in, every public source it touches out — each finding linked back to where it was found.
        </p>
      </aside>
    </div>
  );
}
