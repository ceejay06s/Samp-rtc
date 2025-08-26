// Direct configuration - no environment variables needed
export const config = {
  // Supabase
  supabase: {
    url: 'https://xbcrxnebziipzqoorkti.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiY3J4bmViemlpcHpxb29ya3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTQyNTYsImV4cCI6MjA2Nzg5MDI1Nn0.oAETtcpGaNvvF-MWxN5zwIqJEwaW4u8XRbDu3BIfQ5g',
  },
  
  // App
  app: {
    name: 'Samp-rtc',
    version: '1.0.0',
  },
  
  // API
  api: {
    key: 'iIFhwGAtOcaX3V20SXhH21t8uogfbXPaJTkfU_8Z',
    giphyKey: 'K561QAO7slfK8l7zgjVLLCP6b5Fg9Wki', // Add your Giphy API key here
    // VAPID keys for Web Push API
    vapidPublicKey: 'BGt6PrOD5VwzZBM9HnMKSjLwHD8yrakP8ggYIJ1NhBJfSyPlRLXRFCCobSMMq_6b4EwbPozBJKMae290A_24ETA',
    vapidPrivateKey: 'AlpuiVhGe2n7w0kc66-0lcjkhVk9yZP-BAMPS5wpRis',
  },
  
  // Features
  features: {
    analytics: true,
    crashReporting: true,
  },

  // GitHub OAuth
  github: {
    clientId: 'Iv23liABAmA48tYeKc5K',
    clientSecret: 'ec4623e809a88e7c95656f9ad0074051f849fb90',
    redirectUri: 'samp-rtc://localhost:3000/auth/callback',
  },
} as const;

// Validation function to ensure required config values are set
export function validateConfig() {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error(
      'Supabase configuration is missing. Please check your config file.'
    );
  }
  return true;
}

// Helper function for backward compatibility
export function getEnvVar(key: string, fallback?: string): string {
  // Map environment variable names to config values
  const configMap: Record<string, string> = {
    'EXPO_PUBLIC_SUPABASE_URL': config.supabase.url,
    'EXPO_PUBLIC_SUPABASE_KEY': config.supabase.anonKey,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': config.supabase.anonKey,
    'EXPO_PUBLIC_APP_NAME': config.app.name,
    'EXPO_PUBLIC_APP_VERSION': config.app.version,
    'EXPO_PUBLIC_API_KEY': config.api.key,
    'EXPO_PUBLIC_ENABLE_ANALYTICS': config.features.analytics.toString(),
    'EXPO_PUBLIC_ENABLE_CRASH_REPORTING': config.features.crashReporting.toString(),
  };
  
  const value = configMap[key];
  if (value !== undefined) {
    return value;
  }
  
  if (fallback !== undefined) {
    return fallback;
  }
  
  throw new Error(`Configuration value for ${key} is not set`);
}
