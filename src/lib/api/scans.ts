// ============================================
// Scans API
// ============================================

import { apiCall } from '@/lib/api-client';
import {
  Scan,
  CreateScanRequest,
  ScanListParams,
  ScanListResponse,
  ScanDetails,
} from '@/types';

export const scansApi = {
  createScan: async (data: CreateScanRequest): Promise<Scan> => {
    return apiCall<Scan>('POST', '/scans', data);
  },

  getScan: async (scanId: string): Promise<Scan> => {
    return apiCall<Scan>('GET', `/scans/${scanId}`);
  },

  getScanDetails: async (scanId: string): Promise<ScanDetails> => {
    return apiCall<ScanDetails>('GET', `/scans/${scanId}/details`);
  },

  getScans: async (params: ScanListParams): Promise<ScanListResponse> => {
    const queryParams = new URLSearchParams();
    if (params.targetType) queryParams.append('targetType', params.targetType);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return apiCall<ScanListResponse>('GET', `/scans?${queryParams.toString()}`);
  },

  cancelScan: async (scanId: string): Promise<Scan> => {
    return apiCall<Scan>('POST', `/scans/${scanId}/cancel`);
  },

  deleteScan: async (scanId: string): Promise<void> => {
    return apiCall<void>('DELETE', `/scans/${scanId}`);
  },

  getRelationshipGraph: async (scanId: string): Promise<{ nodes: unknown[]; edges: unknown[] }> => {
    return apiCall('GET', `/scans/${scanId}/graph`);
  },
};

export default scansApi;
