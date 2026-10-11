import type { ReactNode } from 'react';
import { LEGAL_INFO, type LegalKey } from './legal-info';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

const isDev = process.env.NODE_ENV !== 'production';

/** Renders an operator fact; still-unfilled placeholders are highlighted in development. */
export function V({ k }: { k: LegalKey }) {
  const item: { value: string; placeholder?: boolean } = LEGAL_INFO[k];
  if (item.placeholder && isDev) {
    return <span className="legal-placeholder" title={`LEGAL_INFO.${k}`}>{item.value}</span>;
  }
  return <>{item.value}</>;
}

/** Email link for an operator email fact. */
export function Mail({ k }: { k: 'contactEmail' | 'dpoEmail' | 'abuseEmail' }) {
  const item: { value: string; placeholder?: boolean } = LEGAL_INFO[k];
  if (item.placeholder) return <V k={k} />;
  return <a href={`mailto:${item.value}`}>{item.value}</a>;
}

export function DocLink({ to, children }: { to: 'terms' | 'privacy'; children: ReactNode }) {
  return <a href={`#/${to}`}>{children}</a>;
}
