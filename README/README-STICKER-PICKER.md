# Sticker Picker with Supabase Storage

A comprehensive sticker picker component that fetches stickers from your Supabase storage bucket, with fallback to Giphy stickers and sample stickers.

## ✨ Features

### 🎯 Core Functionality
- **Supabase Storage Integration**: Fetches stickers from your `telegram-stickers` bucket
- **Sticker Pack Browsing**: Browse available sticker packs organized by folders
- **Individual Sticker View**: View all stickers within a selected pack
- **Search Functionality**: Search stickers across all packs or within a specific pack
- **Responsive Design**: Optimized for both mobile and desktop platforms

### 🎨 Sticker Support
- **Multiple Formats**: WebP, PNG, GIF, JPEG, TGS (Telegram stickers)
- **Animated Stickers**: Automatic detection and visual indicators for animated content
- **Metadata Display**: Shows sticker count, file size, and creation date
- **Preview Images**: Each pack shows a preview of its first sticker

### 🔄 Fallback System
- **Primary**: Supabase storage stickers
- **Secondary**: Giphy API stickers (if configured)
- **Tertiary**: Sample stickers for development/testing

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import React, { useState } from 'react';
import { StickerPicker } from '../src/components/ui/StickerPicker';
import { Sticker } from '../src/services/stickerService';

export const MyComponent = () => {
  const [stickerPickerVisible, setStickerPickerVisible] = useState(false);

  const handleStickerSelect = (sticker: Sticker) => {
    console.log('Selected sticker:', sticker);
    // sticker.url - Direct URL to the sticker image
    // sticker.name - Sticker name
    // sticker.packName - Pack it belongs to
    // sticker.isAnimated - Whether it's animated
    setStickerPickerVisible(false);
  };

  return (
    <>
      <button onClick={() => setStickerPickerVisible(true)}>
        Open Sticker Picker
      </button>

      <StickerPicker
        visible={stickerPickerVisible}
        onClose={() => setStickerPickerVisible(false)}
        onStickerSelect={handleStickerSelect}
      />
    </>
  );
};
```

### 2. Integration with Chat

```tsx
import { StickerPicker } from '../src/components/ui/StickerPicker';

export const ChatInput = () => {
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const handleStickerSelect = (sticker: Sticker) => {
    // Send sticker in chat
    sendMessage({
      type: 'sticker',
      content: sticker.url,
      metadata: {
        stickerName: sticker.name,
        packName: sticker.packName,
        isAnimated: sticker.isAnimated
      }
    });
    setShowStickerPicker(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowStickerPicker(true)}>
        <MaterialIcons name="sticker-emoji" size={24} />
      </TouchableOpacity>

      <StickerPicker
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onStickerSelect={handleStickerSelect}
      />
    </View>
  );
};
```

## 🗂️ Storage Structure

Your Supabase storage should be organized as follows:

```
telegram-stickers/
├── AnimeGirl/
│   ├── sticker_1.webp
│   ├── sticker_2.webp
│   └── sticker_3.gif
├── Emojis/
│   ├── happy.png
│   ├── sad.png
│   └── love.webp
├── Memes/
│   ├── funny_1.gif
│   └── funny_2.webp
└── Custom/
    ├── my_sticker.png
    └── another_sticker.webp
```

## 🔧 Setup Requirements

### 1. Supabase Storage Bucket

Ensure you have a `telegram-stickers` bucket in your Supabase project:

```sql
-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('telegram-stickers', 'telegram-stickers', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies
CREATE POLICY "Telegram stickers are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'telegram-stickers');
```

### 2. Environment Variables

Make sure your Supabase configuration is set up in `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 📱 Component API

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | ✅ | Controls picker visibility |
| `onClose` | `() => void` | ✅ | Called when picker is closed |
| `onStickerSelect` | `(sticker: Sticker) => void` | ✅ | Called when a sticker is selected |

### Sticker Object

```typescript
interface Sticker {
  id: string;           // Unique identifier
  name: string;         // Display name
  url: string;          // Direct URL to image
  packName: string;     // Pack it belongs to
  isAnimated: boolean;  // Whether it's animated
  fileSize: number;     // File size in bytes
  createdAt: string;    // ISO timestamp
}
```

## 🎨 Customization

### Theme Integration

The component automatically uses your app's theme system:

```typescript
import { useTheme } from '../src/utils/themes';

// Colors are automatically applied:
// - theme.colors.background
// - theme.colors.surface
// - theme.colors.text
// - theme.colors.primary
// - theme.colors.textSecondary
```

### Responsive Design

Responsive behavior is handled automatically:

```typescript
import { usePlatform } from '../src/hooks/usePlatform';
import { useViewport } from '../src/hooks/useViewport';

// Desktop optimizations:
// - Larger grid layouts
// - Enhanced spacing
// - Better touch targets
// - Scroll indicators
```

## 🔍 Advanced Usage

### 1. Custom Sticker Service

You can extend the sticker service for custom functionality:

```typescript
import { StickerService } from '../src/services/stickerService';

// Get all packs
const packs = await StickerService.getStickerPacks();

// Get stickers from specific pack
const stickers = await StickerService.getStickersFromPack('AnimeGirl');

// Search stickers
const results = await StickerService.searchStickers('happy');

// Check storage access
const hasAccess = await StickerService.checkStorageAccess();
```

### 2. Upload Management

Use the upload service to manage stickers:

```typescript
import { StickerUploadService } from '../src/services/stickerUploadService';

// Upload single sticker
const result = await StickerUploadService.uploadSticker({
  packName: 'MyPack',
  stickerName: 'my_sticker',
  file: imageFile,
  isAnimated: false
});

// Upload multiple stickers
const packResult = await StickerUploadService.uploadStickerPack(
  { name: 'My Pack', shortname: 'my_pack' },
  [
    { name: 'sticker1', file: file1 },
    { name: 'sticker2', file: file2 }
  ]
);
```

### 3. Error Handling

The component includes comprehensive error handling:

```typescript
// Errors are automatically displayed with retry options
// Common error scenarios:
// - No storage access
// - Empty sticker packs
// - Network failures
// - Invalid file formats
```

## 🧪 Testing

### Demo Screen

Use the included demo screen to test functionality:

```bash
# Navigate to the demo screen
npx expo start
# Then go to: sticker-picker-demo
```

### Testing Checklist

- [ ] Sticker picker opens and closes
- [ ] Sticker packs are displayed
- [ ] Individual stickers load correctly
- [ ] Search functionality works
- [ ] Sticker selection returns correct data
- [ ] Responsive design on different screen sizes
- [ ] Error states display properly
- [ ] Loading states work correctly

## 🐛 Troubleshooting

### Common Issues

#### 1. No Stickers Displayed

**Problem**: Sticker picker shows "No sticker packs found"

**Solutions**:
- Check if `telegram-stickers` bucket exists in Supabase
- Verify storage policies allow public read access
- Ensure bucket contains folders with sticker files
- Check browser console for error messages

#### 2. Storage Access Denied

**Problem**: "Unable to access sticker storage" error

**Solutions**:
- Verify Supabase environment variables
- Check if bucket is public
- Ensure RLS policies are configured correctly
- Test with Supabase dashboard storage viewer

#### 3. Slow Loading

**Problem**: Stickers take long time to load

**Solutions**:
- Check network connection
- Verify file sizes (keep under 50MB)
- Use WebP format for better compression
- Consider implementing caching

### Debug Mode

Enable debug logging:

```typescript
// In your app configuration
console.log('Sticker service debug:', await StickerService.checkStorageAccess());
```

## 🔮 Future Enhancements

### Planned Features

- **Caching**: Local storage caching for faster loading
- **Favorites**: User favorite stickers system
- **Categories**: Advanced categorization and filtering
- **Upload UI**: Built-in sticker upload interface
- **Analytics**: Usage tracking and popular stickers
- **Offline Support**: Offline sticker access

### Contributing

To add new features:

1. Extend the `StickerService` class
2. Update the `StickerPicker` component
3. Add appropriate TypeScript interfaces
4. Include responsive design considerations
5. Add error handling and loading states

## 📚 Related Documentation

- [Supabase Storage Guide](../README-SUPABASE-STORAGE-SETUP.md)
- [Emoji GIF Setup](../README/README-EMOJI-GIF-SETUP.md)
- [Storage Policy Fix](../README-RLS-FIX.md)
- [Cross-Platform Components](../README/README-WEB-COMPATIBILITY.md)

## 🎯 Best Practices

### Performance
- Keep sticker files under 5MB for optimal loading
- Use WebP format for better compression
- Implement lazy loading for large packs
- Cache frequently accessed stickers

### User Experience
- Provide clear loading indicators
- Handle errors gracefully with retry options
- Use consistent naming conventions
- Group related stickers in logical packs

### Storage Management
- Regularly clean up unused stickers
- Monitor storage usage and costs
- Implement file size limits
- Use appropriate content types

---

**Need help?** Check the troubleshooting section or create an issue in the repository. 