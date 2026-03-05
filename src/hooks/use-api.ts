// ============================================
// React Query Hooks for API Calls
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import {
  LoginCredentials,
  RegisterCredentials,
  CreateScanRequest,
  ScanListParams,
  CreateReportRequest,
} from '@/types';

// ============ Auth Hooks ============
export function useLogin() {
  const { login } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => api.login(credentials.email, credentials.password),
    onSuccess: (data) => {
      login(data.user, data.tokens);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.email}`,
      });
      window.location.hash = '#/';
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
      });
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => api.register(credentials),
    onSuccess: (data) => {
      login(data.user, data.tokens);
      toast({
        title: 'Account created!',
        description: 'Welcome to OSIG',
      });
      window.location.hash = '#/';
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message,
      });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const { toast } = useToast();

  return () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
    window.location.hash = '#/login';
  };
}

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.getCurrentUser(),
    enabled: isAuthenticated && !user,
    initialData: user,
  });
}

// ============ Scans Hooks ============
export function useScans(params?: ScanListParams) {
  return useQuery({
    queryKey: ['scans', params],
    queryFn: () => api.getScans(params),
  });
}

export function useScan(scanId: string) {
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => api.getScan(scanId),
    enabled: !!scanId,
  });
}

export function useScanDetails(scanId: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['scanDetails', scanId],
    queryFn: () => api.getScanDetails(scanId),
    enabled: !!scanId,
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateScanRequest) => api.createScan(data),
    onSuccess: (scan, data) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      toast({
        title: 'Scan initiated',
        description: `Scanning ${data.targetValue}`,
      });
      window.location.hash = `#/scan?id=${scan.id}`;
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to start scan',
        description: error.message,
      });
    },
  });
}

// ============ Reports Hooks ============
export function useReports(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['reports', page, limit],
    queryFn: () => api.getReports(page, limit),
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateReportRequest) => api.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Report generation started',
        description: 'Your report will be ready shortly',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create report',
        description: error.message,
      });
    },
  });
}

// ============ Graph Hooks ============
export function useRelationshipGraph(scanId: string) {
  return useQuery({
    queryKey: ['graph', scanId],
    queryFn: () => api.getRelationshipGraph(scanId),
    enabled: !!scanId,
  });
}
