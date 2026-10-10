// ============================================
// Motion preferences — one place for timings, eases and opt-outs
// ============================================

export const GSAP_EASE = 'expo.out';
export const DURATION = { line: 0.9, rise: 0.6, count: 1.1 } as const;
export const STAGGER = 0.06;
export const RISE_PX = 12;

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
