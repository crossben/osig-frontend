// ============================================
// Auth Guard Component
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

// Custom hook for mounting detection without setState in effect
function useMounted() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const mounted = useMounted();

  useEffect(() => {
    if (!isLoading && mounted) {
      if (requireAuth && !isAuthenticated) {
        router.replace('/login');
      } else if (!requireAuth && isAuthenticated) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, mounted, requireAuth, router]);

  // Show loading state during hydration and auth check
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // If auth is required and user is not authenticated, don't render
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If auth is not required (login/register) and user is authenticated, don't render
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
