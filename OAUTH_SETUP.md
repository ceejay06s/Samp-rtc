# OAuth Setup Guide for Supabase

This guide will help you set up OAuth authentication providers in your Supabase project.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Your app's URL scheme configured

## Step 1: Configure Your App's URL Scheme

### For Expo/React Native:

1. Update your `app.json` to include a URL scheme:
```json
{
  "expo": {
    "scheme": "your-app-name",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

2. Update the redirect URL in `lib/auth.ts`:
```typescript
redirectTo: 'your-app-name://auth/callback'
```

## Step 2: Configure OAuth Providers in Supabase

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `your-app-name://auth/callback`
7. Copy the Client ID and Client Secret
8. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google
   - Paste Client ID and Client Secret
   - Save

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the form:
   - Application name: Your app name
   - Homepage URL: `https://your-project-ref.supabase.co`
   - Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret
5. In Supabase Dashboard → Authentication → Providers → GitHub:
   - Enable GitHub
   - Paste Client ID and Client Secret
   - Save

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "OAuth2" section
4. Add redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret
6. In Supabase Dashboard → Authentication → Providers → Discord:
   - Enable Discord
   - Paste Client ID and Client Secret
   - Save

### Twitter OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app
3. Go to "App settings" → "User authentication settings"
4. Enable OAuth 2.0
5. Set callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret
7. In Supabase Dashboard → Authentication → Providers → Twitter:
   - Enable Twitter
   - Paste Client ID and Client Secret
   - Save

## Step 3: Environment Variables

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Test OAuth Flow

1. Start your app: `npm start`
2. Tap on any OAuth provider button
3. You should be redirected to the provider's login page
4. After successful authentication, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**:
   - Make sure the redirect URI in your OAuth provider matches exactly
   - Check that your app's URL scheme is correctly configured

2. **"Provider not enabled" error**:
   - Ensure the provider is enabled in Supabase Dashboard
   - Verify Client ID and Client Secret are correct

3. **"Network error" on mobile**:
   - For development, use Expo Go or a development build
   - Ensure your device can access the internet

### Debug Tips:

1. Check Supabase logs in the Dashboard → Logs
2. Use browser developer tools to inspect network requests
3. Add console.log statements in your auth functions

## Security Best Practices

1. Never commit your `.env` file to version control
2. Use environment variables for all sensitive data
3. Regularly rotate your OAuth client secrets
4. Implement proper error handling in your app
5. Consider implementing additional security measures like 2FA

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo URL Scheme Documentation](https://docs.expo.dev/guides/linking/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/) 