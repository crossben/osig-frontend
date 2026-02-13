// ============================================
// API Service - Real Backend API Calls
// ============================================

import { apiCall } from './api-client';
import type {
    LoginCredentials,
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
} from '@/types';

// ============ Auth API ============

export const api = {
    // Login user
    async login(email: string, password: string): Promise<AuthResponse> {
        return apiCall<AuthResponse>('POST', '/auth/login', { email, password });
    },

    // Register new user
    async register(data: RegisterCredentials): Promise<AuthResponse> {
        return apiCall<AuthResponse>('POST', '/auth/register', data);
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
        if (params?.targetType) queryParams.append('targetType', params.targetType);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const query = queryParams.toString();
        return apiCall<ScanListResponse>('GET', `/scans${query ? `?${query}` : ''}`);
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

    // Cancel running scan
    async cancelScan(scanId: string): Promise<void> {
        return apiCall<void>('POST', `/scans/${scanId}/cancel`);
    },

    // ============ Reports API ============

    // Get list of reports
    async getReports(): Promise<Report[]> {
        return apiCall<Report[]>('GET', '/reports');
    },

    // Create new report
    async createReport(data: CreateReportRequest): Promise<Report> {
        return apiCall<Report>('POST', '/reports', data);
    },

    // Download report file
    async downloadReport(reportId: string): Promise<Blob> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/download`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
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
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        return apiCall<void>('POST', '/auth/change-password', {
            currentPassword,
            newPassword,
        });
    },
};

export default api;
