# Emoji, GIF, and Sticker Setup Guide

This guide explains how to set up the emoji, GIF, and sticker functionality in the dating app using Supabase Vault for secure API key management.

## 📦 Installed Packages

The following packages have been installed to provide emoji, GIF, and sticker capabilities:

- `emoji-picker-react` - Professional emoji picker component
- `@giphy/js-fetch-api` - Official Giphy JavaScript SDK
- `@giphy/react-components` - React components for Giphy integration

## 🔑 Giphy API Setup with Supabase Vault

### 1. Get a Giphy API Key

1. Go to [Giphy Developers](https://developers.giphy.com/)
2. Sign up for a free account
3. Create a new app
4. Copy your API key

### 2. Store API Key in Supabase Vault

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Vault**
3. Click **Add Secret**
4. Set the name to: `giphy_api_key`
5. Set the value to your Giphy API key
6. Click **Save**

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Add the secret
supabase secrets set giphy_api_key=your_giphy_api_key_here
```

### 3. Set Up Database Function

Run the SQL script to create the function for retrieving secrets:

```sql
-- Run this in your Supabase SQL editor
-- File: sql/setup-supabase-vault.sql
```

Or execute the SQL directly in your Supabase dashboard:

```sql
CREATE OR REPLACE FUNCTION get_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT value INTO secret_value
  FROM vault.secrets
  WHERE name = secret_name;
  
  RETURN secret_value;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_secret(TEXT) TO authenticated;
```

### 4. API Key Usage

The app will automatically:
- Fetch the Giphy API key from Supabase Vault
- Cache the key for performance
- Use the key for all Giphy API calls
- Fall back to sample content if the key is not available

## 🎯 Features Implemented

### Emoji Picker
- ✅ Professional emoji picker with categories
- ✅ Search functionality
- ✅ Skin tone selection
- ✅ Lazy loading for performance
- ✅ Preview configuration

### GIF Integration
- ✅ Search GIFs by keyword using Giphy API
- ✅ Trending GIFs
- ✅ Random GIFs
- ✅ GIF by ID lookup
- ✅ Fallback to sample GIFs when API key is not configured

### Sticker Integration
- ✅ Search stickers by keyword
- ✅ Trending stickers
- ✅ Fallback to sample stickers when API key is not configured

### UI Components
- ✅ Modal-based picker interface
- ✅ Tab navigation (Emoji, GIF, Sticker)
- ✅ Search functionality for GIFs and stickers
- ✅ Loading states
- ✅ Responsive design
- ✅ Theme integration

### Security Features
- ✅ API key stored securely in Supabase Vault
- ✅ No hardcoded secrets in code
- ✅ Automatic key retrieval and caching
- ✅ Graceful fallback when key is unavailable

## 🚀 Usage

### In PostCard Component

The emoji, GIF, and sticker picker is integrated into the PostCard component:

1. **Emoji Button**: Click the emoji button in the action bar or comment input
2. **Comment Input**: Use the emoji button next to the comment input
3. **Reply Input**: Use the emoji button in reply inputs

### Service Integration

The `EmojiGifService` provides the following methods:

```typescript
// Search GIFs
const gifs = await EmojiGifService.searchGifs('happy', 20);

// Get trending GIFs
const trendingGifs = await EmojiGifService.getTrendingGifs(20);

// Search stickers
const stickers = await EmojiGifService.searchStickers('cute', 20);

// Get trending stickers
const trendingStickers = await EmojiGifService.getTrendingStickers(20);

// Get random GIFs
const randomGifs = await EmojiGifService.getRandomGifs('funny', 10);

// Get GIF by ID
const gif = await EmojiGifService.getGifById('gif_id');
```

## 🎨 Customization

### Styling

The picker components use the app's theme system:

```typescript
const theme = useTheme();
// Components automatically adapt to theme colors
```

### Configuration

You can customize the picker behavior:

```typescript
// In EmojiGifPicker.tsx
<EmojiPicker
  onEmojiClick={(emojiObject) => handleEmojiPress(emojiObject.emoji)}
  width={screenWidth - 40}
  height={400}
  searchPlaceholder="Search emojis..."
  searchDisabled={false}
  skinTonesDisabled={false}
  lazyLoadEmojis={true}
  previewConfig={{
    defaultCaption: 'What\'s your mood?',
    defaultEmoji: '1f60a',
  }}
/>
```

## 🔧 Development Mode

When no Giphy API key is configured in Supabase Vault, the app will:
- Show sample GIFs and stickers
- Display console warnings about missing API key
- Continue to function with limited content
- Allow development and testing without requiring an API key

## 📱 Platform Support

The implementation works across all platforms:
- ✅ iOS
- ✅ Android
- ✅ Web

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Ensure the secret is stored in Supabase Vault with name `giphy_api_key`
   - Check that the API key is valid
   - Verify the `get_secret` function is created in your database
   - Check browser console for error messages

2. **GIFs Not Loading**
   - Check network connectivity
   - Verify Supabase Vault configuration
   - Check browser console for errors
   - Ensure the database function has proper permissions

3. **Emoji Picker Not Showing**
   - Ensure all packages are installed correctly
   - Check for any import errors
   - Verify the component is properly integrated

4. **Supabase Vault Issues**
   - Verify you have access to Supabase Vault (requires Pro plan)
   - Check that the secret name is exactly `giphy_api_key`
   - Ensure the database function is created and has proper permissions

### Debug Mode

Enable debug logging by checking the console for:
- API request/response logs
- Error messages from Supabase Vault
- Fallback behavior notifications
- Giphy client initialization status

### Testing the Setup

You can test if the API key is working by running this in your browser console:

```javascript
// Test the service
import { EmojiGifService } from './src/services/emojiGifService';

// This should return real GIFs if the API key is working
const gifs = await EmojiGifService.searchGifs('test', 5);
console.log('GIFs found:', gifs.length);
```

## 🔄 Future Enhancements

Potential improvements for the future:
- [ ] Emoji search functionality
- [ ] Custom sticker packs
- [ ] GIF favorites
- [ ] Recent emojis/GIFs
- [ ] GIF categories
- [ ] Sticker categories
- [ ] Performance optimizations
- [ ] Offline support
- [ ] Multiple API key support
- [ ] Rate limiting and caching

## 📄 License

The Giphy API usage is subject to Giphy's terms of service. Please review their [API documentation](https://developers.giphy.com/docs/api) for usage guidelines.

## 🔒 Security Notes

- API keys are stored securely in Supabase Vault
- Keys are never exposed in client-side code
- The `get_secret` function has `SECURITY DEFINER` to ensure proper access control
- All API calls are made server-side through Supabase functions
- Fallback content is provided when keys are unavailable 