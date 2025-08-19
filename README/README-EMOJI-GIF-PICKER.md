# Emoji GIF Picker Integration

This document describes the emoji GIF picker functionality that has been integrated into the dating app's chat system.

## Overview

The emoji GIF picker provides users with the ability to:
- Select emojis from a comprehensive emoji library
- Search and select GIFs from Giphy API
- Search and select stickers from various sources
- Send these media types in chat messages

## Components

### 1. EmojiGifPicker Component

**Location**: `src/components/ui/EmojiGifPicker.tsx`

**Features**:
- Modal-based picker with tabbed interface
- Emoji selection with search functionality
- GIF search and selection
- Sticker search and selection
- Responsive design for mobile and web

**Props**:
```typescript
interface EmojiGifPickerProps {
  visible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
  onStickerSelect: (stickerUrl: string) => void;
}
```

### 2. EmojiGifService

**Location**: `src/services/emojiGifService.ts`

**Features**:
- Giphy API integration for GIFs and stickers
- Fallback sample content when API is unavailable
- Search functionality for GIFs and stickers
- Trending content support

**Key Methods**:
- `searchGifs(query: string, limit: number)`
- `searchStickers(query: string, limit: number)`
- `getTrendingGifs(limit: number)`
- `getTrendingStickers(limit: number)`

## Integration in Chat Components

### EnhancedRealtimeChat

**Location**: `src/components/ui/EnhancedRealtimeChat.tsx`

**Features Added**:
- Emoji button in input area
- Media preview for selected GIFs/stickers
- Support for GIF and sticker message types
- Enhanced message rendering for media content

### RealtimeChat

**Location**: `src/components/ui/RealtimeChat.tsx`

**Features Added**:
- Same functionality as EnhancedRealtimeChat
- Basic chat with emoji GIF picker support

### EnhancedChatScreen

**Location**: `src/components/ui/EnhancedChatScreen.tsx`

**Features Added**:
- Emoji button in input area
- Media preview functionality
- Integration with RTP chat system

## Message Types

New message types have been added to support media content:

```typescript
export enum MessageType {
  TEXT = 'text',
  PHOTO = 'photo',
  VOICE = 'voice',
  LOCATION = 'location',
  GIF = 'gif',        // New
  STICKER = 'sticker' // New
}
```

## Usage Examples

### Basic Integration

```typescript
import { EmojiGifPicker } from './EmojiGifPicker';

const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [selectedMedia, setSelectedMedia] = useState<{ type: 'gif' | 'sticker', url: string } | null>(null);

const handleEmojiSelect = (emoji: string) => {
  setMessageText(prev => prev + emoji);
};

const handleGifSelect = (gifUrl: string) => {
  setSelectedMedia({ type: 'gif', url: gifUrl });
  setShowEmojiPicker(false);
};

const handleStickerSelect = (stickerUrl: string) => {
  setSelectedMedia({ type: 'sticker', url: stickerUrl });
  setShowEmojiPicker(false);
};

// In your JSX
<TouchableOpacity onPress={() => setShowEmojiPicker(true)}>
  <MaterialIcons name="emoji-emotions" size={24} color={theme.colors.primary} />
</TouchableOpacity>

<EmojiGifPicker
  visible={showEmojiPicker}
  onClose={() => setShowEmojiPicker(false)}
  onEmojiSelect={handleEmojiSelect}
  onGifSelect={handleGifSelect}
  onStickerSelect={handleStickerSelect}
/>
```

### Sending Media Messages

```typescript
const handleSendMessage = async () => {
  if (!messageText.trim() && !selectedMedia) return;
  
  try {
    if (selectedMedia) {
      // Send media message
      await sendMessage(selectedMedia.url, selectedMedia.type === 'gif' ? MessageType.GIF : MessageType.STICKER);
    } else {
      // Send text message
      await sendMessage(messageText.trim(), MessageType.TEXT);
    }
    setMessageText('');
    setSelectedMedia(null);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

## Message Rendering

Media messages are rendered differently in chat bubbles:

```typescript
const renderMessage = ({ item: message }) => {
  const isGifMessage = message.message_type === MessageType.GIF;
  const isStickerMessage = message.message_type === MessageType.STICKER;
  
  return (
    <View style={styles.messageBubble}>
      {isGifMessage ? (
        <View style={styles.mediaMessageContainer}>
          <Image source={{ uri: message.content }} style={styles.mediaMessageImage} />
          <Text style={styles.mediaMessageText}>🎬 GIF</Text>
        </View>
      ) : isStickerMessage ? (
        <View style={styles.mediaMessageContainer}>
          <Image source={{ uri: message.content }} style={styles.mediaMessageImage} />
          <Text style={styles.mediaMessageText}>🎯 Sticker</Text>
        </View>
      ) : (
        <Text style={styles.messageText}>{message.content}</Text>
      )}
    </View>
  );
};
```

## Configuration

### Giphy API Key

To use the GIF functionality, you need to set up a Giphy API key:

1. Get an API key from [Giphy Developers](https://developers.giphy.com/)
2. Add it to your environment variables:
   ```
   EXPO_PUBLIC_GIPHY_API_KEY=your_giphy_api_key_here
   ```

### Fallback Content

The service includes fallback sample GIFs and stickers for development/testing when the API is unavailable.

## Dependencies

The emoji GIF picker requires these dependencies:

```json
{
  "@alextbogdanov/react-native-emoji-selector": "^1.0.0",
  "@expo/vector-icons": "^13.0.0"
}
```

## Demo Component

A demo component is available at `src/components/ui/EmojiGifPickerDemo.tsx` for testing the functionality.

## Styling

The components use the app's theme system and responsive utilities:

- `useTheme()` for consistent theming
- `getResponsiveFontSize()` for responsive typography
- `getResponsiveSpacing()` for responsive spacing

## Best Practices

1. **Performance**: The picker loads content on-demand to minimize initial load time
2. **User Experience**: Media preview shows selected content before sending
3. **Error Handling**: Graceful fallbacks when API is unavailable
4. **Accessibility**: Proper touch targets and screen reader support
5. **Responsive Design**: Works on both mobile and web platforms

## Troubleshooting

### Common Issues

1. **GIFs not loading**: Check your Giphy API key configuration
2. **Emoji picker not showing**: Ensure the modal is properly configured
3. **Media not sending**: Verify message type handling in your chat service

### Debug Tips

- Check console logs for API errors
- Verify environment variables are set correctly
- Test with the demo component first
- Ensure all dependencies are installed

## Future Enhancements

Potential improvements for the emoji GIF picker:

1. **Custom Stickers**: Allow users to upload custom stickers
2. **Recent Items**: Cache recently used emojis, GIFs, and stickers
3. **Categories**: Organize content into categories
4. **Favorites**: Allow users to favorite frequently used items
5. **Search History**: Remember search queries
6. **Offline Support**: Cache popular content for offline use 