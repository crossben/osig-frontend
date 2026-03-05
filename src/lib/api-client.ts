// ============================================
// API Client - Axios Configuration
// ============================================

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/lib/env';
import { useAuthStore } from '@/store/auth-store';
import { ApiResponse } from '@/types';

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: env.apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const tokens = useAuthStore.getState().tokens;
      if (tokens?.accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized - attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const tokens = useAuthStore.getState().tokens;
          if (tokens?.refreshToken) {
            const response = await axios.post(`${env.apiUrl}/auth/refresh`, {
              refreshToken: tokens.refreshToken,
            });

            const newTokens = response.data.data.tokens;
            useAuthStore.getState().setTokens(newTokens);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            }
            return client(originalRequest);
          }
        } catch {
          // Refresh failed - logout user
          useAuthStore.getState().logout();
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Helper to convert snake_case to camelCase
function toCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    acc[camelKey] = toCamel(obj[key]);
    return acc;
  }, {} as any);
}

// Helper to convert camelCase to snake_case
function toSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnake);
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnake(obj[key]);
    return acc;
  }, {} as any);
}

// Helper function for API calls with type safety
export async function apiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      method,
      url,
      data: data ? toSnake(data) : undefined,
    });
    return toCamel(response.data);
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.detail) {
      const detail = error.response.data.detail;
      const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
      throw new Error(message);
    }
    throw error;
  }
}

export default apiClient;
