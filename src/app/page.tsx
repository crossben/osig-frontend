// ============================================
// Main Application Page
// Handles all routing and page rendering
// ============================================

'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store';
import { Providers } from '@/components/providers';
import { ErrorBoundary } from '@/components/error-boundary';
import { ErrorFallback } from '@/components/ui/error-fallback';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { ProfilePage } from '@/features/auth/profile-page';
import { NewScanPage } from '@/features/scans/new-scan-page';
import { ScanDetailsPage } from '@/features/scans/scan-details-page';
import { ScanHistoryPage } from '@/features/scans/scan-history-page';
import { ReportsPage } from '@/features/reports/reports-page';

// Custom hook for mounting detection without setState in effect
function useMounted() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

// Simple hash-based routing
function useHashRouter() {
  const [route, setRoute] = useState({
    path: '/',
    params: {} as Record<string, string>,
  });

  useEffect(() => {
    const parseRoute = () => {
      const hash = window.location.hash.slice(1) || '/';
      const [path, queryString] = hash.split('?');
      const params: Record<string, string> = {};

      if (queryString) {
        queryString.split('&').forEach((pair) => {
          const [key, value] = pair.split('=');
          if (key) params[key] = value || '';
        });
      }

      setRoute({ path, params });
    };

    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    return () => window.removeEventListener('hashchange', parseRoute);
  }, []);

  return route;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { path, params } = useHashRouter();
  const mounted = useMounted();

  // Show loading state during hydration
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Auth pages (no dashboard layout)
  if (path === '/login') {
    return isAuthenticated ? null : <LoginPage />;
  }

  if (path === '/register') {
    return isAuthenticated ? null : <RegisterPage />;
  }

  // Protected pages
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render page based on route
  const renderPage = () => {
    switch (path) {
      case '/':
        return <NewScanPage />;
      case '/history':
        return <ScanHistoryPage />;
      case '/reports':
        return <ReportsPage />;
      case '/profile':
        return <ProfilePage />;
      case '/scan':
        const scanId = params.id;
        if (!scanId) return <ScanHistoryPage />;
        return <ScanDetailsPage />;
      default:
        return <NewScanPage />;
    }
  };

  return <DashboardLayout>{renderPage()}</DashboardLayout>;
}

export default function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <Providers>
        <AppContent />
      </Providers>
    </ErrorBoundary>
  );
}
