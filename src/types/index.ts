// ============================================
// OSIG - Open Source Intelligence Gathering
// Type Definitions
// ============================================

// ============ User Types ============
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  name?: string;
  avatar?: string;
  plan?: string;
  createdAt: string;
  updatedAt: string;
  /** False for Google-created accounts until a password is set */
  hasPassword?: boolean;
  googleLinked?: boolean;
  isSuperuser?: boolean;
  emailVerified?: boolean;
  totpEnabled?: boolean;
  /** Days before scans are deleted automatically; null keeps them */
  retentionDays?: number | null;
  notifyEmail?: boolean;
  webhookUrl?: string | null;
  language?: 'en' | 'fr';
  /** ISO 3166 alpha-2; used for billing currency */
  country?: string | null;
}

/** Returned by sign-in instead of tokens when two-factor sign-in is on */
export interface MfaStep {
  mfaRequired: true;
  mfaToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ============ Scan Types ============
export type TargetType = 'email' | 'username' | 'domain' | 'phone' | 'ip' | 'organization';
export type ScanType = 'quick' | 'deep';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Scan {
  investigationId?: string | null;
  parentScanId?: string | null;
  pivotEntity?: string | null;
  watchId?: string | null;
  id: string;
  userId: string;
  targetType: TargetType;
  targetValue: string;
  scanType: ScanType;
  status: ScanStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface CreateScanRequest {
  targetType: TargetType;
  targetValue: string;
  scanType: ScanType;
  disclaimerAccepted: boolean;
  data?: Record<string, unknown>;
}

export interface ScanListParams {
  targetType?: TargetType;
  status?: ScanStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ScanListResponse {
  scans: Scan[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============ Result Types ============
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFlag {
  id: string;
  type: string;
  severity: RiskLevel;
  description: string;
  source: string;
  /** What triggered the flag (breach names, hosts, URLs...) */
  evidence: string[];
}

export interface ScanModule {
  id: string;
  scanId: string;
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  resultCount: number;
  error?: string;
}

export interface ScanResult {
  id: string;
  scanId: string;
  moduleId: string;
  module: string;
  dataType: string;
  data: Record<string, unknown>;
  source: string;
  sourceUrl?: string;
  confidence: number;
  timestamp: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  category: string;
  lastChecked: string;
  reliability: number;
  dataTypes: string[];
}

export interface ScanDetails {
  scan: Scan;
  modules: ScanModule[];
  results: ScanResult[];
  sources: Source[];
  riskFlags: RiskFlag[];
  summary: {
    totalResults: number;
    totalSources: number;
    riskScore: number;
    riskLevel: RiskLevel;
    dataCategories: string[];
    topFindings: string[];
  };
}

// ============ Graph Types ============
// Entity graph from GET /scans/{id}/graph (backend/app/services/graph_service.py)
export type EntityKind =
  | 'target' | 'source' | 'ip' | 'subdomain' | 'domain' | 'nameserver' | 'mailserver'
  | 'email' | 'network' | 'location' | 'organization' | 'service' | 'url'
  | 'account' | 'breach' | 'port' | 'phone' | 'person' | 'lookalike'
  | 'watchlist' | 'document' | 'snapshot';

export interface GraphNode {
  id: string;
  kind: EntityKind;
  label: string;
  /** Sources that reported this entity */
  sources: string[];
  details: Record<string, unknown>;
  risk: 'high' | 'medium' | 'low' | null;
  degree: number;
  targetType?: TargetType;
  /** In an investigation graph: pinned by the analyst */
  pinned?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  kinds: EntityKind[];
  counts: Partial<Record<EntityKind, number>>;
}

// ============ Report Types ============
export type ReportFormat = 'pdf' | 'json';
export type ReportStatus = 'generating' | 'ready' | 'failed';

export interface Report {
  id: string;
  scanId: string;
  userId: string;
  name: string;
  format: ReportFormat;
  status: ReportStatus;
  fileSize?: number;
  downloadUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateReportRequest {
  scanId: string;
  name: string;
  format: ReportFormat;
}

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============ UI Types ============
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// ============ Investigations ============
export interface InvestigationPin {
  id: string;
  entityId: string;
  kind: string;
  label: string;
  note: string | null;
  createdAt: string;
}

export type InvestigationRole = 'owner' | 'editor' | 'viewer';

export interface InvestigationSummary {
  id: string;
  name: string;
  tags: string[];
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  role: InvestigationRole;
  /** Owner's username when shared with you */
  owner: string | null;
}

export interface InvestigationMember {
  userId: string;
  email: string;
  username: string;
  role: 'viewer' | 'editor';
  addedAt: string;
}

export interface Investigation {
  id: string;
  name: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  scans: Scan[];
  pins: InvestigationPin[];
  role: InvestigationRole;
  owner: string | null;
  /** Only filled for the owner */
  members: InvestigationMember[];
}

// ============ Watches ============
export interface Watch {
  id: string;
  targetType: TargetType;
  targetValue: string;
  scanType: ScanType;
  intervalHours: number;
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  createdAt: string;
  runCount: number;
  latestScanId: string | null;
}

export interface WatchChanges {
  compared: { previousScanId: string; previousAt: string; latestScanId: string; latestAt: string } | null;
  added: { id: string; kind: EntityKind; label: string }[];
  removed: { id: string; kind: EntityKind; label: string }[];
  runs: number;
}

export interface OptionalSource {
  name: string;
  enabled: boolean;
  env: string;
  adds: string;
}

// ============ Analysis ============
export interface MapPoint {
  lat: number;
  lon: number;
  labels: string[];
  sources: string[];
  scanIds: string[];
  place: string | null;
  org: string | null;
}

export interface TimelineEvent {
  date: string;
  title: string;
  severity: 'info' | 'medium' | 'high' | 'critical';
  source: string;
  dataType: string;
  sourceUrl: string | null;
  scanId: string;
  target: string;
  /** Dates still ahead, e.g. a domain or certificate expiry */
  future: boolean;
}

export interface DiffEntity {
  id: string;
  kind: string;
  label: string;
}

export interface ScanComparison {
  before: { id: string; targetType: TargetType; targetValue: string; scanType: ScanType; createdAt: string };
  after: { id: string; targetType: TargetType; targetValue: string; scanType: ScanType; createdAt: string };
  added: DiffEntity[];
  removed: DiffEntity[];
  unchanged: number;
}

export type ExportFormat = 'stix' | 'misp';

export interface BulkScanResult {
  investigationId: string;
  started: number;
  scanIds: string[];
  errors: { line: number; error: string }[];
}

// ============ API keys / admin ============
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  plan: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
  isSuperuser: boolean;
  emailVerified: boolean;
  totpEnabled: boolean;
  googleLinked: boolean;
  createdAt: string;
  scanCount: number;
  lastLogin: string | null;
}

export interface AdminStats {
  users: number;
  users7d: number;
  scans: number;
  scans24h: number;
  scansByStatus: Record<string, number>;
  scansByType: Record<string, number>;
  failedLogins24h: number;
  mailPending: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  target: string | null;
  userId: string | null;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface MailEntry {
  id: string;
  to: string;
  subject: string;
  kind: string;
  sent: boolean;
  error: string | null;
  createdAt: string;
}

// ============ Billing ============

export type PlanSlug = 'free' | 'pro' | 'enterprise';
export type BillingPeriod = 'month' | 'quarter' | 'half' | 'year';
export type BillingCurrency = 'XOF' | 'USD';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface PlanLimits {
  dailyScans: number;
  deepScans: boolean;
  watches: number;
  minWatchIntervalHours: number;
  bulkMax: number;
  exports: boolean;
  sharing: boolean;
  apiKeys: number;
  maxRetentionDays: number | null;
}

export interface BillingPlan {
  slug: PlanSlug;
  name: string;
  rank: number;
  selfServe: boolean;
  /** Minor units: XOF has no decimals, USD is in cents */
  prices: Partial<Record<BillingCurrency, Record<BillingPeriod, number>>>;
  limits: PlanLimits;
  isActive?: boolean;
}

export interface BillingPlans {
  plans: BillingPlan[];
  periods: Record<BillingPeriod, number>;
  enabled: boolean;
  xofCountries: string[];
}

export interface Payment {
  reference: string;
  plan: PlanSlug;
  period: BillingPeriod;
  amount: number;
  currency: BillingCurrency;
  country: string | null;
  method: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminPayment extends Payment {
  email: string | null;
  failureReason: string | null;
}

export interface BillingMe {
  plan: PlanSlug;
  planName: string;
  expiresAt: string | null;
  source: 'purchase' | 'comp' | null;
  pendingPlan: PlanSlug | null;
  pendingPlanDays: number | null;
  graceDays: number;
  /** Renewals, grace and expiry are handled by a Yoon subscription */
  subscription: boolean;
  /** Renewal stopped: the plan ends at expiresAt */
  cancelAtPeriodEnd: boolean;
  country: string | null;
  limits: PlanLimits;
  usage: { scansToday: number; dailyScans: number; watches: number; apiKeys: number };
  payments: Payment[];
}

/** Either open Yoon's checkout, or a cheaper plan was scheduled for the period end */
export interface SubscribeResponse {
  checkoutUrl?: string;
  scheduled?: boolean;
}

export interface PlanPatch {
  name?: string;
  isActive?: boolean;
  selfServe?: boolean;
  prices?: BillingPlan['prices'];
  limits?: Partial<PlanLimits>;
}
