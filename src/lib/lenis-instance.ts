// ============================================
// Shared Lenis instance so GSAP ScrollTrigger (and anything else) can follow it
// ============================================

import type Lenis from 'lenis';

let instance: Lenis | null = null;
const listeners = new Set<(lenis: Lenis) => void | (() => void)>();

export const getLenis = () => instance;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
  if (lenis) listeners.forEach((fn) => fn(lenis));
}

/** Run fn with the current (or next) Lenis instance. Returns an unsubscribe. */
export function onLenis(fn: (lenis: Lenis) => void | (() => void)) {
  listeners.add(fn);
  const cleanup = instance ? fn(instance) : undefined;
  return () => {
    listeners.delete(fn);
    if (typeof cleanup === 'function') cleanup();
  };
}
