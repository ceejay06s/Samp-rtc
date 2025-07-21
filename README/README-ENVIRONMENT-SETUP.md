# Environment Setup Guide

## ✅ Environment Variables Configured

Your Supabase credentials have been successfully configured:

- **Supabase URL**: `https://xbcrxnebziipzqoorkti.supabase.co`
- **Supabase Key**: `sb_publishable_0sql0alZjTpYFGjMaUT7Rg_L-hWaeZo`

## 📁 Files Created/Updated

1. **`.env`** - Environment variables file with your credentials
2. **`lib/config.ts`** - Updated to use correct variable names
3. **`setup-env.sh`** - Setup script for future reference

## 🔧 Configuration Fixed

The configuration was updated to use the correct environment variable names:
- Changed from `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `EXPO_PUBLIC_SUPABASE_KEY`
- This matches the variable names in your `env.example` file

## 🚀 Next Steps

### 1. Set Up Database Tables
Run the safe comment reactions setup in your Supabase dashboard:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `sql/safe-comment-reactions-setup.sql`
3. Click **Run**

### 2. Start Development Server
```bash
npx expo start
```

### 3. Test the App
- Create a post
- Add comments
- Test comment reactions (likes)
- Verify all features work properly

## 🔍 Verification

To verify your setup is working:

1. **Check Environment Variables**:
   ```bash
   cat .env
   ```

2. **Test Supabase Connection**:
   - Start the app
   - Try to sign up/sign in
   - Check if posts load correctly

3. **Test Comment Reactions**:
   - Create a post
   - Add a comment
   - Try liking the comment
   - Verify reaction count updates

## 🛠️ Troubleshooting

### Environment Variables Not Loading
If you get errors about missing environment variables:

1. Make sure the `.env` file exists in the project root
2. Restart your Expo development server
3. Check that variable names match in `lib/config.ts`

### Supabase Connection Issues
If you can't connect to Supabase:

1. Verify your URL and key are correct
2. Check your Supabase project is active
3. Ensure Row Level Security (RLS) policies are set up

### Database Errors
If you get database errors:

1. Run the safe setup SQL scripts
2. Check that all tables exist
3. Verify RLS policies are configured

## 📋 Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xbcrxnebziipzqoorkti.supabase.co` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | `sb_publishable_0sql0alZjTpYFGjMaUT7Rg_L-hWaeZo` | Supabase anonymous key |
| `EXPO_PUBLIC_APP_NAME` | `Samp-rtc` | App name |
| `EXPO_PUBLIC_GIPHY_API_KEY` | `K561QAO7slfK8l7zgjVLLCP6b5Fg9Wki` | Giphy API for emojis/GIFs |

## 🔒 Security Notes

- The `.env` file is in `.gitignore` and won't be committed to version control
- Only use the **anon key** (public key) in client-side code
- Never commit the **service role key** (secret key) to version control
- Your Supabase project has Row Level Security (RLS) enabled for data protection

## 🎉 Ready to Go!

Your environment is now properly configured. You can start developing your dating app with full Supabase integration! 