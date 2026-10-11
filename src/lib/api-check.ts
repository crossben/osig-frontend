// Scam checker API ("Is this a scam?"): public, works signed in or out.

import { apiCall } from '@/lib/api-client';

export type CheckKind = 'url' | 'domain' | 'email' | 'phone' | 'message';
export type CheckVerdict = 'scam' | 'suspicious' | 'no_red_flags' | 'unknown';
export type CheckSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface CheckReason {
  code: string;
  severity: CheckSeverity;
  text: string;
  evidence?: string;
}

export interface CheckResult {
  shareId: string;
  kind: CheckKind;
  subject: string;
  verdict: CheckVerdict;
  score: number;
  reasons: CheckReason[];
  checkedAt: string;
  details?: unknown;
}

export interface CheckHistoryItem {
  shareId: string;
  kind: CheckKind;
  subject: string;
  verdict: CheckVerdict;
  score: number;
  checkedAt: string;
}

export const checkApi = {
  run: (input: string, country?: string) => apiCall<CheckResult>('POST', '/check', { input, country }),
  get: (shareId: string) => apiCall<CheckResult>('GET', `/check/${encodeURIComponent(shareId)}`),
  history: () => apiCall<CheckHistoryItem[]>('GET', '/check/history'),
};
