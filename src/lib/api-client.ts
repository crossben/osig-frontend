// ============================================
// API Client - Axios Configuration
// ============================================

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/lib/env';
import { useAuthStore } from '@/store/auth-store';
import { ApiResponse } from '@/types';

// One refresh at a time: parallel 401s share the same in-flight request
let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) return Promise.resolve(null);
  refreshInFlight = axios
    .post(`${env.apiUrl}/auth/refresh`, { refresh_token: refreshToken })
    .then(({ data }) => {
      useAuthStore.getState().setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      });
      return data.access_token as string;
    })
    .finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

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
          const newAccess = await refreshAccessToken();
          if (newAccess) {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            }
            return client(originalRequest);
          }
        } catch {
          // Refresh failed - fall through to sign-out below
        }

        // Session expired and couldn't be renewed: sign out and go to the login
        // page instead of leaving every query failing on a blank screen.
        // (Login itself answers 401 for a wrong password — leave that to the form.)
        const isAuthCall = /\/auth\/(login|register)/.test(originalRequest.url ?? '');
        if (!isAuthCall && useAuthStore.getState().isAuthenticated) {
          // Keep the URL: protected routes render the sign-in form, and signing
          // back in returns straight to this page
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
  data?: unknown,
  opts?: { rawBody?: boolean }
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      method,
      url,
      data: data ? (opts?.rawBody ? data : toSnake(data)) : undefined,
    });
    return toCamel(response.data);
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.detail) {
      const detail = error.response.data.detail;
      // FastAPI validation errors arrive as [{loc: [...], msg}, ...]
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => {
              const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : undefined;
              const msg = String(d.msg ?? '').replace(/^Value error, /, '');
              return field && field !== 'body' ? `${field}: ${msg}` : msg;
            }).join('\n')
          : JSON.stringify(detail);
      const err = new Error(message, { cause: error }) as Error & { status?: number };
      err.status = error.response.status;
      throw err;
    }
    throw error;
  }
}

export default apiClient;
