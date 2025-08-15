"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
exports.getEnvVar = getEnvVar;
// Environment Configuration
exports.config = {
    // Supabase
    supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
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
};
// Validation function to ensure required env vars are set
function validateConfig() {
    var requiredVars = [
        'EXPO_PUBLIC_SUPABASE_URL',
        'EXPO_PUBLIC_SUPABASE_KEY',
    ];
    var missing = requiredVars.filter(function (varName) { return !process.env[varName]; });
    if (missing.length > 0) {
        throw new Error("Missing required environment variables: ".concat(missing.join(', '), "\n") +
            'Please check your .env file and ensure all required variables are set.');
    }
}
// Helper function to get environment variable with fallback
function getEnvVar(key, fallback) {
    var value = process.env[key];
    if (!value && fallback === undefined) {
        throw new Error("Environment variable ".concat(key, " is required but not set"));
    }
    return value || fallback;
}
