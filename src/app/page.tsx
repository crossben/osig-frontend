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
import { HomePage } from '@/features/home/home-page';
import { LoginPage } from '@/features/auth/login-page';
import { RegisterPage } from '@/features/auth/register-page';
import { OAuthCallbackPage } from '@/features/auth/oauth-callback-page';
import { ProfilePage } from '@/features/auth/profile-page';
import { NewScanPage } from '@/features/scans/new-scan-page';
import { ScanDetailsPage } from '@/features/scans/scan-details-page';
import { ScanHistoryPage } from '@/features/scans/scan-history-page';
import { ReportsPage } from '@/features/reports/reports-page';
import { InvestigationsPage } from '@/features/investigations/investigations-page';
import { InvestigationDetailPage } from '@/features/investigations/investigation-detail-page';
import { WatchesPage } from '@/features/watches/watches-page';
import { VerifyEmailPage } from '@/features/auth/verify-email-page';
import { ForgotPasswordPage, ResetPasswordPage } from '@/features/auth/password-reset-pages';
import { BulkScanPage } from '@/features/scans/bulk-scan-page';
import { ComparePage } from '@/features/scans/compare-page';
import { AdminPage } from '@/features/admin/admin-page';
import { CheckPage, SharedCheckPage } from '@/features/check/check-page';
import { PhotoPage } from '@/features/photo/photo-page';
import { TermsPage, PrivacyPage } from '@/features/legal/legal-pages';
import { FootprintPage, HouseholdAcceptPage, IdentityVerifyPage } from '@/features/footprint/footprint-page';
import { BillingPage } from '@/features/billing/billing-page';

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

function RedirectHome() {
  useEffect(() => {
    window.location.hash = '#/';
  }, []);
  return null;
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

  // Public home page
  if (path === '/' && !isAuthenticated) {
    return <HomePage />;
  }

  // Auth pages (no dashboard layout); signed-in users go to the dashboard
  // Google sign-in landing: must render even while signed out
  if (path === '/oauth') {
    return <OAuthCallbackPage />;
  }

  // Links from emails: work whether or not this browser is signed in
  // Legal pages: public, signed in or not
  if (path === '/terms') return <TermsPage />;
  if (path === '/privacy') return <PrivacyPage />;
  if (path === '/verify-email') return <VerifyEmailPage />;
  if (path === '/verify-identity') return <IdentityVerifyPage />;
  // Scam checker: public, signed in or not; shared verdicts at #/c?id=...
  if (path === '/c') return <SharedCheckPage />;
  if (path === '/check' && !isAuthenticated) return <CheckPage />;
  if (path === '/reset-password') return <ResetPasswordPage />;
  if (path === '/forgot-password') {
    if (isAuthenticated) return <RedirectHome />;
    return <ForgotPasswordPage />;
  }

  if (path === '/login' || path === '/register') {
    if (isAuthenticated) return <RedirectHome />;
    return path === '/login' ? <LoginPage /> : <RegisterPage />;
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
      case '/investigations':
        return <InvestigationsPage />;
      case '/investigation':
        return params.id ? <InvestigationDetailPage key={params.id} /> : <InvestigationsPage />;
      case '/watches':
        return <WatchesPage />;
      case '/bulk':
        return <BulkScanPage />;
      case '/compare':
        return <ComparePage />;
      case '/admin':
        return <AdminPage />;
      case '/check':
        return <CheckPage />;
      case '/footprint':
        return <FootprintPage />;
      case '/photo':
        return <PhotoPage />;
      case '/household/accept':
        return <HouseholdAcceptPage />;
      case '/billing':
        return <BillingPage />;
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
