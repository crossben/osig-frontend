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
export type TargetType = 'email' | 'username' | 'domain' | 'phone';
export type ScanType = 'quick' | 'deep';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Scan {
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
  confirmLegitimate: boolean;
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
  timestamp: string;
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
    dataCategories: string[];
    topFindings: string[];
  };
}

// ============ Graph Types ============
export interface GraphNode {
  id: string;
  type: 'email' | 'username' | 'domain' | 'profile' | 'phone' | 'social';
  label: string;
  data: Record<string, unknown>;
  riskLevel?: RiskLevel;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
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
