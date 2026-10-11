// "My footprint" API: the user's own identities, actions, score, household,
// and deletion request letters. Responses are camelCased by apiCall.

import { apiCall } from './api-client';

export type IdentityKind = 'email' | 'phone' | 'username' | 'domain';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ActionStatus = 'open' | 'done' | 'dismissed';

export interface IdentityVerification {
  method: 'dns_txt' | 'email_link' | 'sms_code' | 'unavailable' | 'none';
  record?: string;
  host?: string;
  message?: string;
}

export interface Identity {
  id: string;
  kind: IdentityKind;
  value: string;
  label: string | null;
  verified: boolean;
  watching: boolean;
  lastCheckedAt: string | null;
  findings: number;
  createdAt: string;
  verification: IdentityVerification | null;
}

export interface ActionItem {
  id: string;
  identityId: string | null;
  key: string;
  severity: Severity;
  title: string;
  detail: string | null;
  link: string | null;
  status: ActionStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Footprint {
  score: number | null;
  scoreUpdatedAt: string | null;
  identities: Identity[];
  actions: { open: ActionItem[]; done: ActionItem[] };
  trend: { date: string; score: number }[];
}

export interface HouseholdMember {
  id: string;
  email: string;
  status: 'invited' | 'active';
  createdAt: string;
  acceptedAt: string | null;
  name?: string;
  score?: number | null;
  openActions?: number;
  identities?: number;
}

export interface Household {
  limit: number;
  members: HouseholdMember[];
  memberOf: { id: string; ownerName: string | null; ownerEmail: string | null; status: string }[];
}

export interface LetterTemplate {
  id: string;
  title: string;
  law: string;
  appliesTo: string;
}

export interface Letter {
  subject: string;
  body: string;
  recipientEmail: string | null;
  actionId: string;
}

export interface RefreshResult {
  started: string[];
  skipped: { identityId: string; reason: string }[];
  score: number | null;
}

export const meApi = {
  footprint: () => apiCall<Footprint>('GET', '/me/footprint'),
  refresh: () => apiCall<RefreshResult>('POST', '/me/footprint/refresh'),
  setAction: (id: string, status: ActionStatus) =>
    apiCall<ActionItem & { score: number | null }>('POST', `/me/actions/${id}`, { status }),

  identities: () => apiCall<Identity[]>('GET', '/me/identities'),
  addIdentity: (kind: IdentityKind, value: string, label?: string) =>
    apiCall<Identity>('POST', '/me/identities', { kind, value, label: label || undefined }),
  removeIdentity: (id: string) => apiCall<void>('DELETE', `/me/identities/${id}`),
  verifyIdentity: (id: string) => apiCall<Identity>('POST', `/me/identities/${id}/verify`, {}),
  confirmIdentityEmail: (token: string) =>
    apiCall<{ verified: boolean; value: string }>('POST', '/me/identities/verify-email', { token }),

  household: () => apiCall<Household>('GET', '/me/household'),
  invite: (email: string) => apiCall<HouseholdMember>('POST', '/me/household', { email }),
  removeMember: (id: string) => apiCall<void>('DELETE', `/me/household/${id}`),
  acceptInvite: (token: string) => apiCall<{ id: string; status: string }>('POST', '/me/household/accept', { token }),

  templates: () => apiCall<LetterTemplate[]>('GET', '/me/requests/templates'),
  letter: (templateId: string, company: string, identities: string[], recipientEmail?: string) =>
    apiCall<Letter>('POST', '/me/requests/letter', {
      templateId, company, identities, recipientEmail: recipientEmail || undefined,
    }),
};

/** HTTP status attached by apiCall to its errors */
export function errStatus(e: unknown): number | undefined {
  return (e as { status?: number })?.status ?? (e as { response?: { status?: number } })?.response?.status;
}

export function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message && !/^Request failed/.test(e.message) ? e.message : fallback;
}
