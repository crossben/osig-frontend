// ============================================
// React Query Hooks for API Calls
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/mock-data';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import {
  LoginCredentials,
  RegisterCredentials,
  CreateScanRequest,
  ScanListParams,
  CreateReportRequest,
} from '@/types';
import { useRouter } from 'next/navigation';

// ============ Auth Hooks ============
export function useLogin() {
  const { login } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => mockApi.login(credentials.email, credentials.password),
    onSuccess: (data) => {
      login(data.user, data.tokens);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.email}`,
      });
      router.push('/');
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
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => mockApi.register(credentials),
    onSuccess: (data) => {
      login(data.user, data.tokens);
      toast({
        title: 'Account created!',
        description: 'Welcome to OSIG',
      });
      router.push('/');
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
  const router = useRouter();

  return () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
    router.push('/login');
  };
}

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => mockApi.getCurrentUser(),
    enabled: isAuthenticated && !user,
    initialData: user,
  });
}

// ============ Scans Hooks ============
export function useScans(params?: ScanListParams) {
  return useQuery({
    queryKey: ['scans', params],
    queryFn: () => mockApi.getScans(params),
  });
}

export function useScan(scanId: string) {
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => mockApi.getScan(scanId),
    enabled: !!scanId,
  });
}

export function useScanDetails(scanId: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['scanDetails', scanId],
    queryFn: () => mockApi.getScanDetails(scanId),
    enabled: !!scanId,
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateScanRequest) => mockApi.createScan(data),
    onSuccess: (scan) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      toast({
        title: 'Scan initiated',
        description: `Scanning ${data.targetValue}`,
      });
      router.push(`/scan/${scan.id}`);
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
export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => mockApi.getReports(),
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateReportRequest) => mockApi.createReport(data),
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
    queryFn: () => mockApi.getRelationshipGraph(scanId),
    enabled: !!scanId,
  });
}
