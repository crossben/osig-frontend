// ============================================
// Authentication API
// ============================================

import { apiCall } from '@/lib/api-client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('POST', '/auth/login', credentials);
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    return apiCall<AuthResponse>('POST', '/auth/register', credentials);
  },

  logout: async (): Promise<void> => {
    return apiCall<void>('POST', '/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    return apiCall<User>('GET', '/auth/me');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiCall<User>('PATCH', '/auth/profile', data);
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse['tokens']> => {
    return apiCall<AuthResponse['tokens']>('POST', '/auth/refresh', { refreshToken });
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    return apiCall<void>('POST', '/auth/password-reset', { email });
  },
};

export default authApi;
