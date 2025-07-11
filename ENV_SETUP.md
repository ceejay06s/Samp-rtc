# Environment Variables Setup Guide

This guide explains how to set up and use environment variables in your Expo/React Native project.

## Quick Start

1. **Copy the example file**:
   ```bash
   cp env.example .env
   ```

2. **Edit your `.env` file** with your actual values:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Restart your development server**:
   ```bash
   npm start
   ```

## Environment Variable Rules

### ✅ **Public Variables (Client-side)**
- Must start with `EXPO_PUBLIC_`
- Available in your React Native app
- Will be included in your app bundle
- Use for non-sensitive configuration

```env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_APP_NAME=My App
EXPO_PUBLIC_ENABLE_FEATURE=true
```

### ❌ **Private Variables (Server-side only)**
- Do NOT start with `EXPO_PUBLIC_`
- Only available in Node.js environment
- Not included in app bundle
- Use for sensitive data (API keys, secrets)

```env
DATABASE_PASSWORD=secret123
JWT_SECRET=my-secret-key
```

## Using Environment Variables

### 1. **Direct Access**
```typescript
// Access directly (not recommended)
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

### 2. **Using the Config Utility (Recommended)**
```typescript
import { config, getEnvVar } from '@/lib/config'

// Access typed configuration
console.log(config.app.name)
console.log(config.supabase.url)

// Get with fallback
const apiKey = getEnvVar('EXPO_PUBLIC_API_KEY', 'default-key')
```

### 3. **In Components**
```typescript
import React from 'react'
import { config } from '@/lib/config'

export default function MyComponent() {
  return (
    <Text>App Version: {config.app.version}</Text>
  )
}
```

## Configuration Structure

The `lib/config.ts` file organizes your environment variables:

```typescript
export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  },
  app: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'Default Name',
    version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  },
  features: {
    analytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
}
```

## Environment-Specific Configuration

### Development
```env
# .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENABLE_DEBUG=true
```

### Production
```env
# .env.production
EXPO_PUBLIC_API_URL=https://api.production.com
EXPO_PUBLIC_ENABLE_DEBUG=false
```

### Staging
```env
# .env.staging
EXPO_PUBLIC_API_URL=https://api.staging.com
EXPO_PUBLIC_ENABLE_DEBUG=true
```

## Validation

The config utility includes validation to ensure required variables are set:

```typescript
import { validateConfig } from '@/lib/config'

// This will throw an error if required vars are missing
validateConfig()
```

## Security Best Practices

### ✅ **Do**
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Keep sensitive data server-side only
- Use environment-specific files
- Validate required variables
- Use TypeScript for type safety

### ❌ **Don't**
- Store secrets in client-side variables
- Commit `.env` files to version control
- Use hardcoded values in production
- Expose API keys in client code

## Troubleshooting

### Common Issues

1. **"Variable is undefined"**
   - Check that variable starts with `EXPO_PUBLIC_`
   - Restart development server after changing `.env`
   - Verify variable name spelling

2. **"Cannot read property of undefined"**
   - Use the config utility instead of direct access
   - Add fallback values for optional variables

3. **"Environment variable not found"**
   - Ensure `.env` file is in project root
   - Check file permissions
   - Verify no extra spaces in variable names

### Debug Tips

```typescript
// Add this to debug environment variables
console.log('All env vars:', process.env)
console.log('Config:', config)
```

## File Structure

```
your-project/
├── .env                    # Your actual environment variables
├── .env.example           # Example file (safe to commit)
├── .env.development       # Development-specific variables
├── .env.production        # Production-specific variables
├── lib/
│   ├── config.ts          # Configuration utility
│   └── supabase.ts        # Uses config
└── components/
    └── ConfigExample.tsx  # Shows how to use config
```

## Git Configuration

Add to your `.gitignore`:
```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## EAS Build Configuration

For EAS builds, you can set environment variables in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.production.com"
      }
    }
  }
}
```

## Additional Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [React Native Environment Variables](https://reactnative.dev/docs/environment-variables)
- [Dotenv Documentation](https://github.com/motdotla/dotenv) 