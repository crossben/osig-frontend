// ============================================
// API Service - Real Backend API Calls
// ============================================

import { apiCall, apiClient } from './api-client';
import type {
    RegisterCredentials,
    AuthResponse,
    User,
    Scan,
    ScanListResponse,
    ScanListParams,
    ScanDetails,
    CreateScanRequest,
    Report,
    CreateReportRequest,
    RelationshipGraph,
    Investigation,
    InvestigationSummary,
    InvestigationPin,
    Watch,
    WatchChanges,
    OptionalSource,
    TargetType,
    ScanType,
} from '@/types';

// ============ Auth API ============

export const api = {
    // Login user
    async login(email: string, password: string): Promise<AuthResponse> {
        const res = await apiCall<any>('POST', '/auth/login', { email, password });
        return {
            user: res.user,
            tokens: {
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                expiresIn: res.expiresIn
            }
        };
    },

    // Register new user
    async register(data: RegisterCredentials): Promise<AuthResponse> {
        const res = await apiCall<any>('POST', '/auth/register', data);
        return {
            user: res.user,
            tokens: {
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                expiresIn: res.expiresIn
            }
        };
    },

    // Get current user
    async getCurrentUser(): Promise<User> {
        return apiCall<User>('GET', '/auth/me');
    },

    // Refresh access token
    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        return apiCall('POST', '/auth/refresh', { refreshToken });
    },

    // ============ Scans API ============

    // Get list of scans with optional filters
    async getScans(params?: ScanListParams): Promise<ScanListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.targetType) queryParams.append('target_type', params.targetType);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.startDate) queryParams.append('start_date', params.startDate);
        if (params?.endDate) queryParams.append('end_date', params.endDate);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('page_size', params.limit.toString());

        const query = queryParams.toString();
        const res = await apiCall<any>('GET', `/scans${query ? `?${query}` : ''}`);
        return {
            scans: res.scans,
            total: res.total,
            page: res.page,
            limit: res.pageSize,
            hasMore: res.page < res.totalPages
        };
    },

    // Get single scan by ID
    async getScan(scanId: string): Promise<Scan> {
        return apiCall<Scan>('GET', `/scans/${scanId}`);
    },

    // Get detailed scan results
    async getScanDetails(scanId: string): Promise<ScanDetails> {
        return apiCall<ScanDetails>('GET', `/scans/${scanId}/details`);
    },

    // Create new scan
    async createScan(data: CreateScanRequest): Promise<Scan> {
        return apiCall<Scan>('POST', '/scans', data);
    },

    // Get scan quota status
    async getQuotaStatus(): Promise<{ plan: string; dailyLimit: number; usedToday: number; remaining: number; hasQuota: boolean }> {
        return apiCall('GET', '/scans/quota/status');
    },

    // Cancel running scan
    async cancelScan(scanId: string): Promise<void> {
        return apiCall<void>('POST', `/scans/${scanId}/cancel`);
    },

    // ============ Reports API ============

    // Get list of reports (matches backend ReportListResponse shape)
    async getReports(page: number = 1, limit: number = 10): Promise<{ reports: Report[]; total: number }> {
        const res = await apiCall<any>('GET', `/reports?page=${page}&page_size=${limit}`);
        return { reports: res.reports || [], total: res.total || 0 };
    },

    // Create new report
    async createReport(data: CreateReportRequest): Promise<Report> {
        return apiCall<Report>('POST', '/reports', data);
    },

    // Download report file — returns a Blob
    async downloadReport(reportId: string): Promise<Blob> {
        const { env } = await import('@/lib/env');
        const { useAuthStore } = await import('@/store/auth-store');
        const { refreshAccessToken } = await import('@/lib/api-client');
        const get = (token: string) => fetch(`${env.apiUrl}/reports/${reportId}/download`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        let response = await get(useAuthStore.getState().tokens?.accessToken ?? '');
        if (response.status === 401) {
            const fresh = await refreshAccessToken().catch(() => null);
            if (fresh) response = await get(fresh);
        }
        if (!response.ok) throw new Error('Failed to download report');
        return response.blob();
    },

    // ============ Graph API ============

    // Get relationship graph for scan
    async getRelationshipGraph(scanId: string): Promise<RelationshipGraph> {
        return apiCall<RelationshipGraph>('GET', `/scans/${scanId}/graph`);
    },

    // ============ Profile API ============

    // Update user profile
    async updateProfile(data: Partial<User>): Promise<User> {
        return apiCall<User>('PATCH', '/auth/me', data);
    },

    // Change password
    // Returns a fresh token pair for this session; other sessions are signed out
    async changePassword(currentPassword: string, newPassword: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
        return apiCall('POST', '/auth/change-password', {
            currentPassword,
            newPassword,
        });
    },

    // ============ Investigations ============
    async getInvestigations(): Promise<InvestigationSummary[]> {
        return apiCall('GET', '/investigations');
    },
    async getInvestigation(id: string): Promise<Investigation> {
        return apiCall('GET', `/investigations/${id}`);
    },
    async createInvestigation(data: { name: string; notes?: string; tags?: string[]; scanIds?: string[] }): Promise<Investigation> {
        return apiCall('POST', '/investigations', data);
    },
    async updateInvestigation(id: string, data: { name?: string; notes?: string; tags?: string[] }): Promise<Investigation> {
        return apiCall('PATCH', `/investigations/${id}`, data);
    },
    async deleteInvestigation(id: string): Promise<void> {
        return apiCall('DELETE', `/investigations/${id}`);
    },
    async addScanToInvestigation(id: string, scanId: string): Promise<Investigation> {
        return apiCall('POST', `/investigations/${id}/scans/${scanId}`);
    },
    async removeScanFromInvestigation(id: string, scanId: string): Promise<Investigation> {
        return apiCall('DELETE', `/investigations/${id}/scans/${scanId}`);
    },
    async getInvestigationGraph(id: string): Promise<RelationshipGraph> {
        return apiCall('GET', `/investigations/${id}/graph`);
    },
    async pinEntity(id: string, pin: { entityId: string; kind: string; label: string; note?: string }): Promise<InvestigationPin> {
        return apiCall('POST', `/investigations/${id}/pins`, pin);
    },
    async unpinEntity(id: string, pinId: string): Promise<void> {
        return apiCall('DELETE', `/investigations/${id}/pins/${pinId}`);
    },
    async downloadInvestigationReport(id: string, format: 'pdf' | 'json'): Promise<Blob> {
        const res = await apiClient.get(`/investigations/${id}/report`, { params: { format }, responseType: 'blob' });
        return res.data as Blob;
    },
    async pivotScan(scanId: string, data: { entityId: string; targetType: TargetType; targetValue: string; scanType: ScanType }): Promise<Scan> {
        return apiCall('POST', `/scans/${scanId}/pivot`, data);
    },

    // ============ Watches ============
    async getWatches(): Promise<Watch[]> {
        return apiCall('GET', '/watches');
    },
    async createWatch(data: { targetType: TargetType; targetValue: string; scanType: ScanType; intervalHours: number }): Promise<Watch> {
        return apiCall('POST', '/watches', data);
    },
    async updateWatch(id: string, data: { intervalHours?: number; active?: boolean }): Promise<Watch> {
        return apiCall('PATCH', `/watches/${id}`, data);
    },
    async deleteWatch(id: string): Promise<void> {
        return apiCall('DELETE', `/watches/${id}`);
    },
    async getWatchChanges(id: string, includeSearch = false): Promise<WatchChanges> {
        return apiCall('GET', `/watches/${id}/changes${includeSearch ? '?include_search=true' : ''}`);
    },

    // ============ Meta ============
    async getOptionalSources(): Promise<OptionalSource[]> {
        return apiCall('GET', '/meta/sources');
    },

    // ============ Sign in with Google ============
    async getAuthProviders(): Promise<{ google: boolean }> {
        return apiCall('GET', '/auth/providers');
    },
    async googleExchange(code: string): Promise<AuthResponse> {
        const res = await apiCall<any>('POST', '/auth/google/exchange', { code });
        return { user: res.user, tokens: { accessToken: res.accessToken, refreshToken: res.refreshToken, expiresIn: res.expiresIn } };
    },
    async setPassword(newPassword: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
        return apiCall('POST', '/auth/set-password', { newPassword });
    },
};

export default api;
