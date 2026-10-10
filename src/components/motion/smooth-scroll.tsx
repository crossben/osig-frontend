'use client';

// Lenis smooth scrolling, synced with GSAP ScrollTrigger.
// Pass a wrapper ref to smooth-scroll an inner container (the dashboard's <main>)
// instead of the window. Renders nothing; skipped for reduced motion.

import { useEffect, type RefObject } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLenis } from '@/lib/lenis-instance';
import { isReducedMotion } from '@/lib/motion';

export function SmoothScroll({ wrapper }: { wrapper?: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    if (isReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);

    const el = wrapper?.current ?? undefined;
    const lenis = new Lenis({
      lerp: 0.1,
      ...(el ? { wrapper: el, content: el.firstElementChild as HTMLElement } : {}),
    });

    if (el) ScrollTrigger.defaults({ scroller: el });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);

    return () => {
      gsap.ticker.remove(tick);
      if (el) ScrollTrigger.defaults({ scroller: window });
      setLenis(null);
      lenis.destroy();
    };
  }, [wrapper]);

  return null;
}
