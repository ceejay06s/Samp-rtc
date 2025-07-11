// Environment Configuration
export const config = {
  // Supabase
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
  
  // App
  app: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'Samp-rtc',
    version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  // API
  api: {
    key: process.env.EXPO_PUBLIC_API_KEY,
  },
  
  // Features
  features: {
    analytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
    crashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  },

  // GitHub OAuth
  github: {
    clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET || '',
    redirectUri: 'samp-rtc://localhost:3000/auth/callback',
  },
} as const

// Validation function to ensure required env vars are set
export function validateConfig() {
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
}

// Helper function to get environment variable with fallback
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value && fallback === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`)
  }
  return value || fallback!
} 