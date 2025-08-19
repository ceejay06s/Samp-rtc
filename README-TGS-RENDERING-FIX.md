# TGS Sticker Rendering Fix

## Overview
This document describes the fixes implemented to resolve TGS (Telegram Sticker) rendering issues in the chat system.

## Problem Description
TGS files are Telegram's animated sticker format, which are compressed Lottie JSON files. The original implementation had issues with:
- Converting TGS files to Lottie JSON format
- Rendering TGS stickers in chat messages
- Cross-platform compatibility (web vs mobile)
- Fallback handling when conversion fails

## Solution Implemented

### 1. Enhanced TGSRendererV2 Component
The `TGSRendererV2` component has been improved with multiple conversion approaches:

#### Web Platform
- **Primary**: Uses `tgs2json` library for direct TGS to JSON conversion
- **Secondary**: Falls back to `pako` decompression if tgs2json fails
- **Tertiary**: Attempts direct TGS loading with lottie-web
- **Final**: Shows fallback display if all methods fail

#### Mobile Platform
- **Primary**: Uses `tgs2json` library for conversion
- **Secondary**: Falls back to `pako` decompression
- **Tertiary**: Attempts direct TGS loading with lottie-react-native
- **Final**: Shows fallback display if all methods fail

### 2. Chat Message Integration
TGS stickers are now properly rendered in chat messages:
- **Message Bubbles**: Automatically detect TGS files and use TGSRendererV2
- **Image Viewer**: Enhanced to handle TGS stickers in full-screen view
- **Media Preview**: Shows TGS stickers in attachment previews

### 3. Sticker Picker Integration
The EmojiGifPicker component now properly displays TGS stickers:
- **Sticker Grid**: TGS stickers are rendered with TGSRendererV2
- **Preview**: Shows animated previews in the sticker picker
- **Selection**: Properly handles TGS sticker selection

## Dependencies Required

The following packages are required for TGS rendering:

```json
{
  "lottie-react-native": "^7.3.2",
  "lottie-web": "^5.13.0",
  "pako": "^2.1.0",
  "tgs2json": "^1.0.1"
}
```

## Usage Examples

### Basic TGS Rendering
```tsx
import { TGSRendererV2 } from '../src/components/ui/TGSRendererV2';

<TGSRendererV2
  url="https://example.com/sticker.tgs"
  width={200}
  height={200}
  autoPlay={true}
  loop={true}
  fallbackToStatic={true}
/>
```

### In Chat Messages
TGS stickers are automatically detected and rendered:
```tsx
// The component automatically detects .tgs files and uses TGSRendererV2
{isStickerMessage ? (
  <View style={styles.mediaMessageContainer}>
    <TouchableOpacity onPress={() => onImagePress?.(message.content, 'sticker')}>
      {message.content.toLowerCase().endsWith('.tgs') ? (
        <TGSRendererV2
          url={message.content}
          width={200}
          height={150}
          autoPlay={true}
          loop={true}
          style={styles.mediaMessageImage}
        />
      ) : (
        <Image source={{ uri: message.content }} style={styles.mediaMessageImage} />
      )}
    </TouchableOpacity>
    <Text style={styles.mediaMessageText}>🎯 Sticker</Text>
  </View>
) : null}
```

## Testing

### TGS Test Screen
A dedicated test screen has been created at `/tgs-test` to verify TGS rendering:
- Tests multiple TGS sticker URLs
- Shows rendering status and errors
- Provides information about TGS format

### Menu Access
The TGS test screen can be accessed from the main menu:
- Navigate to Menu → TGS Sticker Test
- Test different TGS sticker URLs
- Verify cross-platform compatibility

## Error Handling

### Fallback Strategy
1. **Primary Conversion**: tgs2json library
2. **Secondary Conversion**: pako decompression
3. **Direct Loading**: Native TGS support
4. **Fallback Display**: Static placeholder with file info

### Error States
- **Loading**: Shows activity indicator
- **Conversion Error**: Attempts fallback methods
- **Final Fallback**: Shows file information and status

## Performance Considerations

### Caching
- TGS to JSON conversion results can be cached
- Sticker previews are optimized for different screen sizes
- Lazy loading for sticker packs

### Memory Management
- Proper cleanup of Lottie animations
- Resource disposal when components unmount
- Efficient handling of large sticker collections

## Cross-Platform Support

### Web Platform
- Uses lottie-web for animation rendering
- Supports SVG and Canvas renderers
- Optimized for desktop browsers

### Mobile Platform
- Uses lottie-react-native for native performance
- Supports both iOS and Android
- Optimized for mobile devices

## Future Improvements

### Planned Enhancements
1. **WebP Support**: Add support for WebP animated stickers
2. **Performance**: Implement virtual scrolling for large sticker collections
3. **Caching**: Add intelligent caching for frequently used stickers
4. **Compression**: Optimize TGS file sizes for better performance

### Known Limitations
1. **File Size**: Large TGS files may cause performance issues
2. **Browser Support**: Some older browsers may not support all features
3. **Memory Usage**: Multiple animated stickers can increase memory usage

## Troubleshooting

### Common Issues

#### TGS Not Rendering
1. Check if the TGS file URL is accessible
2. Verify that all dependencies are installed
3. Check browser console for error messages
4. Test with the TGS test screen

#### Performance Issues
1. Reduce sticker dimensions for better performance
2. Limit the number of animated stickers on screen
3. Check memory usage in browser dev tools
4. Consider using static fallbacks for mobile devices

#### Conversion Errors
1. Verify TGS file format is valid
2. Check if tgs2json library is working
3. Test pako decompression as fallback
4. Review error logs for specific failure reasons

## Support

For issues related to TGS rendering:
1. Check the browser console for error messages
2. Test with the TGS test screen
3. Verify sticker file accessibility
4. Check dependency versions and compatibility

## Conclusion

The TGS rendering fix provides a robust solution for displaying Telegram stickers in the chat system. The multi-layered approach ensures compatibility across platforms while providing graceful fallbacks for edge cases. The implementation maintains performance and user experience while supporting the full range of TGS sticker features. 