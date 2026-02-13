// ============================================
// Reports API
// ============================================

import { apiCall } from '@/lib/api-client';
import { Report, CreateReportRequest } from '@/types';

export const reportsApi = {
  getReports: async (): Promise<Report[]> => {
    return apiCall<Report[]>('GET', '/reports');
  },

  getReport: async (reportId: string): Promise<Report> => {
    return apiCall<Report>('GET', `/reports/${reportId}`);
  },

  createReport: async (data: CreateReportRequest): Promise<Report> => {
    return apiCall<Report>('POST', '/reports', data);
  },

  downloadReport: async (reportId: string): Promise<{ downloadUrl: string }> => {
    return apiCall<{ downloadUrl: string }>('GET', `/reports/${reportId}/download`);
  },

  deleteReport: async (reportId: string): Promise<void> => {
    return apiCall<void>('DELETE', `/reports/${reportId}`);
  },
};

export default reportsApi;
