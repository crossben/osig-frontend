'use client';

// Counts a number up from its previous value whenever it changes, so new
// results arriving during a scan visibly add to the total.

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { DURATION, isReducedMotion } from '@/lib/motion';

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isReducedMotion()) {
      el.textContent = String(value);
      last.current = value;
      return;
    }
    const counter = { n: last.current };
    const tween = gsap.to(counter, {
      n: value,
      duration: DURATION.count,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = String(Math.round(counter.n)); },
    });
    last.current = value;
    return () => { tween.kill(); };
  }, [value]);

  return <span ref={ref} className={className}>{value}</span>;
}
