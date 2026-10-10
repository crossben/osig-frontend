'use client';

// The landing page's signature: a target in the middle, traced out to the
// public sources a scan of that type actually queries. Lines draw in once on
// load; picking another target type redraws the trace for that type.

import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { GSAP_EASE, isReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

gsap.registerPlugin(useGSAP);

type TargetType = 'email' | 'username' | 'domain' | 'phone';

interface TraceSource {
  name: string;
  /** Whether the sample trace shows this source returning something */
  hit: boolean;
}

// Sources match the backend OSINT modules (app/osint/*)
const TRACES: Record<TargetType, { label: string; target: string; sources: TraceSource[] }> = {
  email: {
    label: 'Email',
    target: 'alex@example.com',
    sources: [
      { name: 'Holehe', hit: true },
      { name: 'XposedOrNot', hit: true },
      { name: 'Gravatar', hit: false },
      { name: 'EmailRep', hit: true },
      { name: 'DMARC record', hit: true },
      { name: 'Disposable check', hit: false },
      { name: 'Search dorks', hit: true },
    ],
  },
  username: {
    label: 'Username',
    target: 'alex_dev',
    sources: [
      { name: 'Sherlock', hit: true },
      { name: 'GitHub', hit: true },
      { name: 'Instagram', hit: false },
      { name: 'Reddit', hit: true },
      { name: 'Keybase', hit: false },
      { name: 'Search dorks', hit: true },
    ],
  },
  domain: {
    label: 'Domain',
    target: 'example.com',
    sources: [
      { name: 'WHOIS', hit: true },
      { name: 'DNS records', hit: true },
      { name: 'Cert Transparency', hit: true },
      { name: 'Sublist3r', hit: false },
      { name: 'Reverse IP', hit: true },
      { name: 'DMARC record', hit: false },
      { name: 'Search dorks', hit: true },
    ],
  },
  phone: {
    label: 'Phone',
    target: '+1 202 555 0143',
    sources: [
      { name: 'libphonenumber', hit: true },
      { name: 'Carrier lookup', hit: true },
      { name: 'Line type', hit: true },
      { name: 'Search dorks', hit: false },
    ],
  },
};

const ORDER: TargetType[] = ['email', 'username', 'domain', 'phone'];

// Drawing space; nodes sit on an ellipse around the center
const W = 600;
const H = 440;
const CX = W / 2;
const CY = H / 2;
const RX = 228;
const RY = 168;

function layout(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2 + Math.PI / count;
    return { x: CX + RX * Math.cos(angle), y: CY + RY * Math.sin(angle) };
  });
}

export function TraceHero() {
  const [type, setType] = useState<TargetType>('email');
  const scope = useRef<HTMLDivElement>(null);
  const trace = TRACES[type];
  const points = layout(trace.sources.length);

  useGSAP(() => {
    if (isReducedMotion()) return;
    const q = gsap.utils.selector(scope);
    const lines = q<SVGLineElement>('[data-trace-line]');
    lines.forEach((line) => {
      const len = line.getTotalLength();
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    });

    const tl = gsap.timeline({ defaults: { ease: GSAP_EASE } });
    tl.from(q('[data-trace-target]'), { scale: 0.92, autoAlpha: 0, duration: 0.5 })
      .to(lines, { strokeDashoffset: 0, duration: 0.8, stagger: 0.07 }, '-=0.15')
      .from(q('[data-trace-node]'), { autoAlpha: 0, y: 6, duration: 0.45, stagger: 0.07 }, '<0.35')
      // Highlighter sweeps across the sources that returned something
      .from(q('[data-trace-hit]'), {
        backgroundSize: '0% 100%',
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.inOut',
      }, '-=0.2')
      // Drawing borrows stroke-dasharray; hand it back so empty sources stay dashed
      .set(lines, { clearProps: 'strokeDasharray,strokeDashoffset' });
  }, { scope, dependencies: [type], revertOnUpdate: true });

  return (
    <div className="w-full">
      {/* Target type switcher — replays the trace */}
      <div role="tablist" aria-label="Sample target type" className="flex flex-wrap gap-1.5 mb-4">
        {ORDER.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={type === t}
            onClick={() => setType(t)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trace',
              type === t
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {TRACES[t].label}
          </button>
        ))}
      </div>

      <div
        ref={scope}
        className="relative w-full aspect-[600/440] rounded-2xl border bg-card/70 paper-grid overflow-hidden"
        aria-label={`Sample trace: ${trace.target} checked against ${trace.sources.length} public sources`}
        role="img"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
          {points.map((p, i) => (
            <line
              key={`${type}-${i}`}
              data-trace-line
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="var(--trace)"
              strokeWidth={trace.sources[i].hit ? 1.5 : 1}
              strokeOpacity={trace.sources[i].hit ? 0.85 : 0.35}
              strokeDasharray={trace.sources[i].hit ? undefined : '3 5'}
            />
          ))}
        </svg>

        {/* Target */}
        <div
          data-trace-target
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 shadow-[0_8px_24px_-12px_rgb(19_35_63/0.6)]"
          style={{ left: '50%', top: '50%' }}
        >
          <div className="font-mono text-[13px] sm:text-sm whitespace-nowrap">{trace.target}</div>
        </div>

        {/* Sources */}
        {trace.sources.map((source, i) => (
          <div
            key={`${type}-${source.name}`}
            data-trace-node
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(points[i].x / W) * 100}%`, top: `${(points[i].y / H) * 100}%` }}
          >
            <span
              className={cn(
                'block whitespace-nowrap rounded-md border bg-card px-2 py-1 text-[11px] sm:text-xs',
                !source.hit && 'text-muted-foreground border-dashed'
              )}
            >
              {source.hit ? <span data-trace-hit className="mark">{source.name}</span> : source.name}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Highlighted sources returned something in this sample. Dashed ones came back empty.
      </p>
    </div>
  );
}
