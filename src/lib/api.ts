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
    MfaStep,
    MapPoint,
    TimelineEvent,
    ScanComparison,
    ExportFormat,
    BulkScanResult,
    InvestigationMember,
    ApiKey,
    AdminUser,
    AdminStats,
    AuditEntry,
    MailEntry,
    BillingPlans,
    BillingMe,
    BillingPeriod,
    CheckoutResponse,
    SubscribeResponse,
    Payment,
    AdminPayment,
    PlanSlug,
    PlanPatch,
    BillingPlan,
} from '@/types';

/** Sign-in answers either with tokens or, with 2FA on, with a second step */
const toAuth = (res: any): AuthResponse | MfaStep =>
    res.mfaRequired
        ? { mfaRequired: true, mfaToken: res.mfaToken }
        : { user: res.user, tokens: { accessToken: res.accessToken, refreshToken: res.refreshToken, expiresIn: res.expiresIn } };

export const isMfaStep = (r: AuthResponse | MfaStep): r is MfaStep => 'mfaRequired' in r;

async function download(path: string, params?: Record<string, string>): Promise<Blob> {
    const res = await apiClient.get(path, { params, responseType: 'blob' });
    return res.data as Blob;
}

// ============ Auth API ============

export const api = {
    // Login user
    async login(email: string, password: string): Promise<AuthResponse | MfaStep> {
        return toAuth(await apiCall<any>('POST', '/auth/login', { email, password }));
    },

    // Second sign-in step: authenticator or recovery code
    async verifyMfa(mfaToken: string, code: string): Promise<AuthResponse> {
        return toAuth(await apiCall<any>('POST', '/auth/2fa/verify', { mfaToken, code })) as AuthResponse;
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
    async googleExchange(code: string): Promise<AuthResponse | MfaStep> {
        return toAuth(await apiCall<any>('POST', '/auth/google/exchange', { code }));
    },
    async setPassword(newPassword: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
        return apiCall('POST', '/auth/set-password', { newPassword });
    },

    // ============ Account security ============
    async verifyEmail(token: string): Promise<User> {
        return apiCall('POST', '/auth/verify-email', { token });
    },
    async resendVerification(): Promise<void> {
        return apiCall('POST', '/auth/resend-verification');
    },
    async forgotPassword(email: string): Promise<void> {
        return apiCall('POST', '/auth/forgot-password', { email });
    },
    async resetPassword(token: string, newPassword: string): Promise<void> {
        return apiCall('POST', '/auth/reset-password', { token, newPassword });
    },
    async logoutAll(): Promise<void> {
        return apiCall('POST', '/auth/logout-all');
    },
    async setupMfa(): Promise<{ secret: string; otpauthUri: string; qrSvg: string }> {
        return apiCall('POST', '/auth/2fa/setup');
    },
    async enableMfa(code: string): Promise<{ recoveryCodes: string[] }> {
        return apiCall('POST', '/auth/2fa/enable', { code });
    },
    async disableMfa(code: string): Promise<void> {
        return apiCall('POST', '/auth/2fa/disable', { code });
    },
    async deleteMyData(): Promise<Record<string, number>> {
        return apiCall('POST', '/auth/delete-my-data', { confirm: 'DELETE' });
    },
    async deleteAccount(email: string): Promise<void> {
        return apiCall('POST', '/auth/delete-account', { confirm: email });
    },

    // ============ API keys ============
    async getApiKeys(): Promise<ApiKey[]> {
        return apiCall('GET', '/api-keys');
    },
    async createApiKey(name: string): Promise<ApiKey & { key: string }> {
        return apiCall('POST', '/api-keys', { name });
    },
    async revokeApiKey(id: string): Promise<void> {
        return apiCall('DELETE', `/api-keys/${id}`);
    },

    // ============ Analysis ============
    async getScanMap(scanId: string): Promise<{ points: MapPoint[] }> {
        return apiCall('GET', `/scans/${scanId}/map`);
    },
    async getScanTimeline(scanId: string): Promise<{ events: TimelineEvent[] }> {
        return apiCall('GET', `/scans/${scanId}/timeline`);
    },
    async compareScans(scanId: string, otherId: string, includeSearch = false): Promise<ScanComparison> {
        return apiCall('GET', `/scans/${scanId}/compare/${otherId}${includeSearch ? '?include_search=true' : ''}`);
    },
    async exportScan(scanId: string, format: ExportFormat): Promise<Blob> {
        return download(`/scans/${scanId}/export`, { format });
    },
    async getInvestigationMap(id: string): Promise<{ points: MapPoint[] }> {
        return apiCall('GET', `/investigations/${id}/map`);
    },
    async getInvestigationTimeline(id: string): Promise<{ events: TimelineEvent[] }> {
        return apiCall('GET', `/investigations/${id}/timeline`);
    },
    async exportInvestigation(id: string, format: ExportFormat): Promise<Blob> {
        return download(`/investigations/${id}/export`, { format });
    },

    // ============ Sharing & bulk ============
    async getMembers(id: string): Promise<InvestigationMember[]> {
        return apiCall('GET', `/investigations/${id}/members`);
    },
    async addMember(id: string, email: string, role: 'viewer' | 'editor'): Promise<InvestigationMember[]> {
        return apiCall('POST', `/investigations/${id}/members`, { email, role });
    },
    async removeMember(id: string, userId: string): Promise<void> {
        return apiCall('DELETE', `/investigations/${id}/members/${userId}`);
    },
    async bulkScan(data: { name: string; csv: string; scanType: ScanType; disclaimerAccepted: boolean }): Promise<BulkScanResult> {
        return apiCall('POST', '/investigations/bulk', data);
    },

    // ============ Admin ============
    async adminStats(): Promise<AdminStats> {
        return apiCall('GET', '/admin/stats');
    },
    async adminUsers(q = ''): Promise<AdminUser[]> {
        return apiCall('GET', `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    },
    async adminUpdateUser(id: string, data: Partial<Pick<AdminUser, 'plan' | 'isActive' | 'isSuperuser' | 'emailVerified'>>): Promise<AdminUser> {
        return apiCall('PATCH', `/admin/users/${id}`, data);
    },
    async adminAudit(action = ''): Promise<AuditEntry[]> {
        return apiCall('GET', `/admin/audit${action ? `?action=${encodeURIComponent(action)}` : ''}`);
    },
    async adminMail(): Promise<MailEntry[]> {
        return apiCall('GET', '/admin/mail');
    },

    // ============ Billing ============
    async getBillingPlans(): Promise<BillingPlans> {
        return apiCall('GET', '/billing/plans');
    },
    async getBillingMe(): Promise<BillingMe> {
        return apiCall('GET', '/billing/me');
    },
    async subscribe(plan: PlanSlug, period: BillingPeriod, country: string): Promise<SubscribeResponse> {
        return apiCall('POST', '/billing/subscribe', { plan, period, country });
    },
    async syncSubscription(): Promise<{ plan: PlanSlug; expiresAt: string | null; source: string | null; pendingPlan: PlanSlug | null }> {
        return apiCall('POST', '/billing/subscription/sync');
    },
    /** Retired (410): kept for pending one-off payments' history only */
    async createCheckout(plan: PlanSlug, period: BillingPeriod, country: string): Promise<CheckoutResponse> {
        return apiCall('POST', '/billing/checkout', { plan, period, country });
    },
    async getPayment(reference: string): Promise<Payment> {
        return apiCall('GET', `/billing/payments/${encodeURIComponent(reference)}`);
    },
    async adminGrantPlan(userId: string, plan: PlanSlug, days?: number): Promise<unknown> {
        return apiCall('POST', `/billing/admin/users/${userId}/grant`, days ? { plan, days } : { plan });
    },
    async adminPayments(): Promise<AdminPayment[]> {
        return apiCall('GET', '/billing/admin/payments');
    },
    async adminUpdatePlan(slug: PlanSlug, patch: PlanPatch): Promise<BillingPlan> {
        // Not through apiCall's snake_casing: currency codes (XOF, USD) are keys
        // under prices and must keep their case
        const snake = (o: Record<string, unknown>) =>
            Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), v]));
        const body: Record<string, unknown> = snake({ ...patch, limits: undefined, prices: undefined });
        if (patch.prices) body.prices = patch.prices;
        if (patch.limits) body.limits = snake(patch.limits);
        return apiCall('PATCH', `/billing/admin/plans/${slug}`, body, { rawBody: true });
    },
};

export default api;
