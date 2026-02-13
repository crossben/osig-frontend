// ============================================
// Environment Configuration
// ============================================

export const env = {
  // Backend API URL - configurable via environment variable
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  
  // App configuration
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'OSIG',
  
  // Feature flags
  enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
  
  // Polling intervals (in milliseconds)
  scanPollingInterval: parseInt(process.env.NEXT_PUBLIC_SCAN_POLLING_INTERVAL || '3000', 10),
  
  // Authentication
  tokenRefreshThreshold: parseInt(process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD || '300', 10), // 5 minutes before expiry
} as const;

export default env;
