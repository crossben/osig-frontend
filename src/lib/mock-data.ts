// ============================================
// Mock Data Service
// Simulates backend API responses for development
// ============================================

import {
  User,
  Scan,
  ScanDetails,
  ScanModule,
  ScanResult,
  Source,
  RiskFlag,
  Report,
  GraphNode,
  GraphEdge,
  TargetType,
  ScanStatus,
} from '@/types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============ Mock User Data ============
export const mockUser: User = {
  id: 'user-1',
  email: 'demo@osig.io',
  username: 'demo_user',
  fullName: 'Demo User',
  avatarUrl: null,
  plan: 'pro',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-06-20T14:22:00Z',
};

// ============ Mock Scans Data ============
export const mockScans: Scan[] = [
  {
    id: 'scan-1',
    userId: 'user-1',
    targetType: 'email',
    targetValue: 'john.doe@example.com',
    scanType: 'deep',
    status: 'completed',
    progress: 100,
    startedAt: '2024-06-20T10:00:00Z',
    completedAt: '2024-06-20T10:15:00Z',
    createdAt: '2024-06-20T10:00:00Z',
    updatedAt: '2024-06-20T10:15:00Z',
  },
  {
    id: 'scan-2',
    userId: 'user-1',
    targetType: 'domain',
    targetValue: 'example-corp.com',
    scanType: 'quick',
    status: 'completed',
    progress: 100,
    startedAt: '2024-06-19T14:30:00Z',
    completedAt: '2024-06-19T14:35:00Z',
    createdAt: '2024-06-19T14:30:00Z',
    updatedAt: '2024-06-19T14:35:00Z',
  },
  {
    id: 'scan-3',
    userId: 'user-1',
    targetType: 'username',
    targetValue: 'johndoe123',
    scanType: 'deep',
    status: 'running',
    progress: 65,
    startedAt: '2024-06-21T09:00:00Z',
    completedAt: null,
    createdAt: '2024-06-21T09:00:00Z',
    updatedAt: '2024-06-21T09:05:00Z',
  },
  {
    id: 'scan-4',
    userId: 'user-1',
    targetType: 'phone',
    targetValue: '+1-555-123-4567',
    scanType: 'quick',
    status: 'pending',
    progress: 0,
    startedAt: null,
    completedAt: null,
    createdAt: '2024-06-21T09:30:00Z',
    updatedAt: '2024-06-21T09:30:00Z',
  },
  {
    id: 'scan-5',
    userId: 'user-1',
    targetType: 'email',
    targetValue: 'test@company.org',
    scanType: 'quick',
    status: 'failed',
    progress: 45,
    startedAt: '2024-06-18T16:00:00Z',
    completedAt: null,
    createdAt: '2024-06-18T16:00:00Z',
    updatedAt: '2024-06-18T16:02:00Z',
    errorMessage: 'Rate limit exceeded for target domain',
  },
];

// ============ Mock Modules Data ============
export const mockModules: ScanModule[] = [
  {
    id: 'mod-1',
    scanId: 'scan-1',
    name: 'email_breach',
    displayName: 'Email Breach Check',
    status: 'completed',
    progress: 100,
    startedAt: '2024-06-20T10:00:00Z',
    completedAt: '2024-06-20T10:05:00Z',
    resultCount: 3,
  },
  {
    id: 'mod-2',
    scanId: 'scan-1',
    name: 'social_profiles',
    displayName: 'Social Media Profiles',
    status: 'completed',
    progress: 100,
    startedAt: '2024-06-20T10:05:00Z',
    completedAt: '2024-06-20T10:10:00Z',
    resultCount: 5,
  },
  {
    id: 'mod-3',
    scanId: 'scan-1',
    name: 'domain_lookup',
    displayName: 'Domain & DNS Records',
    status: 'completed',
    progress: 100,
    startedAt: '2024-06-20T10:10:00Z',
    completedAt: '2024-06-20T10:12:00Z',
    resultCount: 2,
  },
  {
    id: 'mod-4',
    scanId: 'scan-1',
    name: 'username_search',
    displayName: 'Username Search',
    status: 'completed',
    progress: 100,
    startedAt: '2024-06-20T10:12:00Z',
    completedAt: '2024-06-20T10:15:00Z',
    resultCount: 4,
  },
];

// ============ Mock Results Data ============
export const mockResults: ScanResult[] = [
  {
    id: 'result-1',
    scanId: 'scan-1',
    moduleId: 'mod-1',
    module: 'email_breach',
    dataType: 'breach_record',
    data: {
      breachName: 'Example Breach 2020',
      breachDate: '2020-03-15',
      compromisedData: ['email', 'password_hash', 'username'],
      description: 'Data breach affecting example.com users',
    },
    source: 'HaveIBeenPwned',
    sourceUrl: 'https://haveibeenpwned.com',
    confidence: 0.95,
    timestamp: '2024-06-20T10:02:00Z',
  },
  {
    id: 'result-2',
    scanId: 'scan-1',
    moduleId: 'mod-2',
    module: 'social_profiles',
    dataType: 'social_profile',
    data: {
      platform: 'LinkedIn',
      profileUrl: 'https://linkedin.com/in/johndoe',
      username: 'johndoe',
      displayName: 'John Doe',
      bio: 'Software Engineer at Tech Corp',
      followers: 500,
    },
    source: 'LinkedIn',
    sourceUrl: 'https://linkedin.com/in/johndoe',
    confidence: 0.88,
    timestamp: '2024-06-20T10:07:00Z',
  },
  {
    id: 'result-3',
    scanId: 'scan-1',
    moduleId: 'mod-2',
    module: 'social_profiles',
    dataType: 'social_profile',
    data: {
      platform: 'GitHub',
      profileUrl: 'https://github.com/johndoe',
      username: 'johndoe',
      displayName: 'John Doe',
      bio: 'Open source enthusiast',
      repositories: 25,
      followers: 120,
    },
    source: 'GitHub',
    sourceUrl: 'https://github.com/johndoe',
    confidence: 0.92,
    timestamp: '2024-06-20T10:08:00Z',
  },
  {
    id: 'result-4',
    scanId: 'scan-1',
    moduleId: 'mod-3',
    module: 'domain_lookup',
    dataType: 'domain_record',
    data: {
      domain: 'johndoe-personal.com',
      registrar: 'Namecheap',
      createdDate: '2019-05-20',
      expiryDate: '2025-05-20',
      nameservers: ['ns1.example.com', 'ns2.example.com'],
    },
    source: 'WHOIS',
    sourceUrl: 'https://whois.domaintools.com',
    confidence: 0.99,
    timestamp: '2024-06-20T10:11:00Z',
  },
];

// ============ Mock Sources Data ============
export const mockSources: Source[] = [
  {
    id: 'src-1',
    name: 'HaveIBeenPwned',
    url: 'https://haveibeenpwned.com',
    category: 'Security',
    lastChecked: '2024-06-20T10:00:00Z',
    reliability: 0.98,
    dataTypes: ['breach_records', 'paste_records'],
  },
  {
    id: 'src-2',
    name: 'GitHub',
    url: 'https://github.com',
    category: 'Social',
    lastChecked: '2024-06-20T10:05:00Z',
    reliability: 0.95,
    dataTypes: ['profiles', 'repositories', 'commits'],
  },
  {
    id: 'src-3',
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    category: 'Social',
    lastChecked: '2024-06-20T10:05:00Z',
    reliability: 0.85,
    dataTypes: ['profiles', 'companies'],
  },
  {
    id: 'src-4',
    name: 'WHOIS Database',
    url: 'https://whois.domaintools.com',
    category: 'Infrastructure',
    lastChecked: '2024-06-20T10:10:00Z',
    reliability: 0.99,
    dataTypes: ['domain_records', 'whois_data'],
  },
];

// ============ Mock Risk Flags Data ============
export const mockRiskFlags: RiskFlag[] = [
  {
    id: 'risk-1',
    type: 'breach_exposure',
    severity: 'high',
    description: 'Email found in 1 known data breach',
    source: 'HaveIBeenPwned',
    timestamp: '2024-06-20T10:02:00Z',
  },
  {
    id: 'risk-2',
    type: 'domain_exposure',
    severity: 'medium',
    description: 'Personal domain registered with real name',
    source: 'WHOIS',
    timestamp: '2024-06-20T10:11:00Z',
  },
  {
    id: 'risk-3',
    type: 'social_footprint',
    severity: 'low',
    description: 'Active social media presence detected',
    source: 'Multi-source analysis',
    timestamp: '2024-06-20T10:15:00Z',
  },
];

// ============ Mock Reports Data ============
export const mockReports: Report[] = [
  {
    id: 'report-1',
    scanId: 'scan-1',
    userId: 'user-1',
    name: 'john.doe@example.com - Full Report',
    format: 'pdf',
    status: 'ready',
    fileSize: 245000,
    downloadUrl: '/downloads/report-1.pdf',
    createdAt: '2024-06-20T10:20:00Z',
    expiresAt: '2024-07-20T10:20:00Z',
  },
  {
    id: 'report-2',
    scanId: 'scan-2',
    userId: 'user-1',
    name: 'example-corp.com - Domain Analysis',
    format: 'json',
    status: 'ready',
    fileSize: 89000,
    downloadUrl: '/downloads/report-2.json',
    createdAt: '2024-06-19T14:40:00Z',
    expiresAt: '2024-07-19T14:40:00Z',
  },
  {
    id: 'report-3',
    scanId: 'scan-3',
    userId: 'user-1',
    name: 'johndoe123 - Username Search',
    format: 'pdf',
    status: 'generating',
    createdAt: '2024-06-21T09:10:00Z',
  },
];

// ============ Mock Graph Data ============
export const mockGraphNodes: GraphNode[] = [
  {
    id: 'node-email-1',
    type: 'email',
    label: 'john.doe@example.com',
    data: { primary: true },
    riskLevel: 'medium',
  },
  {
    id: 'node-username-1',
    type: 'username',
    label: 'johndoe',
    data: { platforms: ['GitHub', 'LinkedIn', 'Twitter'] },
    riskLevel: 'low',
  },
  {
    id: 'node-domain-1',
    type: 'domain',
    label: 'johndoe-personal.com',
    data: { registrar: 'Namecheap' },
    riskLevel: 'low',
  },
  {
    id: 'node-profile-1',
    type: 'profile',
    label: 'LinkedIn Profile',
    data: { url: 'https://linkedin.com/in/johndoe' },
    riskLevel: 'low',
  },
  {
    id: 'node-profile-2',
    type: 'profile',
    label: 'GitHub Profile',
    data: { url: 'https://github.com/johndoe', repos: 25 },
    riskLevel: 'low',
  },
  {
    id: 'node-phone-1',
    type: 'phone',
    label: '+1-555-123-4567',
    data: { verified: true },
    riskLevel: 'medium',
  },
];

export const mockGraphEdges: GraphEdge[] = [
  { id: 'edge-1', source: 'node-email-1', target: 'node-username-1', label: 'associated with' },
  { id: 'edge-2', source: 'node-email-1', target: 'node-domain-1', label: 'registered' },
  { id: 'edge-3', source: 'node-username-1', target: 'node-profile-1', label: 'used on' },
  { id: 'edge-4', source: 'node-username-1', target: 'node-profile-2', label: 'used on' },
  { id: 'edge-5', source: 'node-email-1', target: 'node-phone-1', label: 'linked to' },
  { id: 'edge-6', source: 'node-phone-1', target: 'node-profile-1', label: 'verifies' },
];

// ============ Mock API Functions ============
export const mockApi = {
  // Auth
  async login(email: string, password: string) {
    await delay(800);
    if (email && password) {
      return {
        user: mockUser,
        tokens: {
          accessToken: 'mock-access-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          expiresIn: 3600,
        },
      };
    }
    throw new Error('Invalid credentials');
  },

  async register(data: { email: string; username: string; password: string; fullName?: string }) {
    await delay(1000);
    return {
      user: { ...mockUser, email: data.email, username: data.username, fullName: data.fullName || null },
      tokens: {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresIn: 3600,
      },
    };
  },

  async getCurrentUser() {
    await delay(300);
    return mockUser;
  },

  // Scans
  async createScan(data: { targetType: TargetType; targetValue: string; scanType: string }) {
    await delay(500);
    const newScan: Scan = {
      id: 'scan-' + Date.now(),
      userId: 'user-1',
      targetType: data.targetType,
      targetValue: data.targetValue,
      scanType: data.scanType as 'quick' | 'deep',
      status: 'pending',
      progress: 0,
      startedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newScan;
  },

  async getScan(scanId: string) {
    await delay(200);
    return mockScans.find(s => s.id === scanId) || mockScans[0];
  },

  async getScans(params?: { targetType?: TargetType; status?: ScanStatus }) {
    await delay(400);
    let filtered = [...mockScans];
    if (params?.targetType) {
      filtered = filtered.filter(s => s.targetType === params.targetType);
    }
    if (params?.status) {
      filtered = filtered.filter(s => s.status === params.status);
    }
    return {
      scans: filtered,
      total: filtered.length,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  },

  async getScanDetails(scanId: string): Promise<ScanDetails> {
    await delay(600);
    const scan = mockScans.find(s => s.id === scanId) || mockScans[0];
    return {
      scan,
      modules: mockModules,
      results: mockResults,
      sources: mockSources,
      riskFlags: mockRiskFlags,
      summary: {
        totalResults: 14,
        totalSources: 4,
        riskScore: 35,
        dataCategories: ['Breaches', 'Social Media', 'Domains', 'Profiles'],
        topFindings: [
          'Email found in 1 data breach',
          '5 social media profiles discovered',
          '1 personal domain registered',
          'Professional presence on LinkedIn',
        ],
      },
    };
  },

  // Reports
  async getReports() {
    await delay(300);
    return mockReports;
  },

  async createReport(data: { scanId: string; name: string; format: string }) {
    await delay(800);
    const newReport: Report = {
      id: 'report-' + Date.now(),
      scanId: data.scanId,
      userId: 'user-1',
      name: data.name,
      format: data.format as 'pdf' | 'json',
      status: 'generating',
      createdAt: new Date().toISOString(),
    };
    return newReport;
  },

  // Graph
  async getRelationshipGraph(scanId: string) {
    await delay(500);
    return {
      nodes: mockGraphNodes,
      edges: mockGraphEdges,
    };
  },
};

export default mockApi;
