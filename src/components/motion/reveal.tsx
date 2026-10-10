'use client';

// Rises content in once when it scrolls into view. Content is visible by default;
// the hidden start state is only applied by GSAP after mount, so no-JS and
// reduced-motion users always see everything.

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { DURATION, GSAP_EASE, RISE_PX, STAGGER, isReducedMotion } from '@/lib/motion';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Animate direct children one after another instead of the block as a whole */
  stagger?: boolean;
  delay?: number;
}

export function Reveal({ children, as: Tag = 'div', className, stagger, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (isReducedMotion() || !ref.current) return;
    const targets = stagger ? Array.from(ref.current.children) : ref.current;
    gsap.from(targets, {
      y: RISE_PX,
      autoAlpha: 0,
      duration: DURATION.rise,
      ease: GSAP_EASE,
      delay,
      stagger: stagger ? STAGGER : 0,
      scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
    });
  }, { scope: ref });

  return <Tag ref={ref} className={className}>{children}</Tag>;
}
