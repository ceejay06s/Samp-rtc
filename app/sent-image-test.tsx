import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeImage } from '../src/components/ui/SafeImage';
import { EnhancedPhotoUploadService, PhotoType } from '../src/services/enhancedPhotoUpload';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

interface TestMessage {
  id: string;
  content: string;
  message_type: string;
  metadata?: any;
  sender_id: string;
  created_at: string;
  isOwn: boolean;
}

export default function SentImageTestScreen() {
  const theme = useTheme();
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addTestMessage = (message: TestMessage) => {
    setTestMessages(prev => [message, ...prev]);
  };

  const testImageUpload = async () => {
    try {
      setIsUploading(true);
      
      const hasPermission = await EnhancedPhotoUploadService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Camera and media library permissions are required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Convert to PhotoUploadResult format
        const photoData = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type || 'image/jpeg',
          base64: asset.base64 ? asset.base64 : undefined,
        };

        // Generate message ID
        const messageId = EnhancedPhotoUploadService.generateMessageId();
        
        // Create organized path
        const conversationId = 'test-conv-12345';
        const userId = 'test-user-67890';
        const organizedPath = EnhancedPhotoUploadService.createChatMediaPath(
          conversationId,
          userId,
          messageId,
          photoData.type
        );

        // Upload image
        const uploadResult = await EnhancedPhotoUploadService.uploadPhotoWithMessageId(
          photoData,
          messageId,
          PhotoType.CHAT,
          organizedPath
        );

        if (uploadResult.success) {
          // Create test message with image
          const imageMessage: TestMessage = {
            id: messageId,
            content: 'Test image caption',
            message_type: 'PHOTO',
            metadata: {
              imageUrl: uploadResult.url,
              imagePath: uploadResult.path,
              imageBucket: uploadResult.bucket,
              imageWidth: photoData.width,
              imageHeight: photoData.height,
              imageType: photoData.type
            },
            sender_id: userId,
            created_at: new Date().toISOString(),
            isOwn: true
          };

          addTestMessage(imageMessage);
          Alert.alert('Success', 'Image uploaded and message created successfully!');
        } else {
          Alert.alert('Error', `Upload failed: ${uploadResult.error}`);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const testTextMessage = () => {
    const textMessage: TestMessage = {
      id: `text-${Date.now()}`,
      content: 'This is a test text message',
      message_type: 'TEXT',
      sender_id: 'test-user-67890',
      created_at: new Date().toISOString(),
      isOwn: true
    };
    addTestMessage(textMessage);
  };

  const testBrokenImage = () => {
    const brokenImageMessage: TestMessage = {
      id: `broken-${Date.now()}`,
      content: 'Test broken image',
      message_type: 'PHOTO',
      metadata: {
        imageUrl: 'https://invalid-url-that-will-fail.com/image.jpg',
        imagePath: 'invalid/path',
        imageBucket: 'test-bucket',
        imageWidth: 100,
        imageHeight: 100,
        imageType: 'image/jpeg'
      },
      sender_id: 'test-user-67890',
      created_at: new Date().toISOString(),
      isOwn: false
    };
    addTestMessage(brokenImageMessage);
  };

  const clearMessages = () => {
    setTestMessages([]);
  };

  const renderMessage = ({ item }: { item: TestMessage }) => {
    const isPhotoMessage = item.message_type === 'PHOTO';
    const isOwn = item.isOwn;

    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwn ? [styles.ownMessageBubble, { backgroundColor: theme.colors.primary }] : 
                 [styles.otherMessageBubble, { backgroundColor: theme.colors.surface }]
        ]}>
          {isPhotoMessage ? (
            <View style={styles.mediaMessageContainer}>
              <SafeImage 
                source={{ uri: item.metadata?.imageUrl || item.content }} 
                style={styles.mediaMessageImage}
                showFallbackText={true}
                fallbackText="Image not available"
              />
              <Text style={[styles.mediaMessageText, { color: isOwn ? theme.colors.onPrimary : theme.colors.text }]}>
                📷 Photo
              </Text>
              {item.content && (
                <Text style={[styles.captionText, { color: isOwn ? theme.colors.onPrimary : theme.colors.text }]}>
                  {item.content}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isOwn ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
        </View>
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Sent Image Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Test image display in chat messages
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testImageUpload}
          disabled={isUploading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {isUploading ? 'Uploading...' : 'Upload Test Image'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={testTextMessage}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Add Text Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.warning }]}
          onPress={testBrokenImage}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Broken Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={clearMessages}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Clear Messages
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.messagesContainer}>
        <Text style={[styles.messagesTitle, { color: theme.colors.text }]}>
          Test Messages ({testMessages.length}):
        </Text>
        
        {testMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No messages yet. Upload an image or add a text message to test.
            </Text>
          </View>
        ) : (
          <FlatList
            data={testMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            inverted
          />
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          Test Features:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Upload real images and see them displayed{'\n'}
          • Test broken image fallback{'\n'}
          • Verify image URLs from metadata{'\n'}
          • Check SafeImage error handling{'\n'}
          • Test message layout and styling
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getResponsiveSpacing('md'),
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('lg'),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
  },
  button: {
    padding: getResponsiveSpacing('md'),
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: getResponsiveSpacing('lg'),
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: getResponsiveSpacing('md'),
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: getResponsiveSpacing('md'),
    borderRadius: 16,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: 'black',
  },
  mediaMessageContainer: {
    alignItems: 'center',
  },
  mediaMessageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: getResponsiveSpacing('sm'),
  },
  mediaMessageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  captionText: {
    fontSize: 14,
    marginTop: getResponsiveSpacing('xs'),
    textAlign: 'center',
  },

  timestamp: {
    fontSize: 12,
    marginTop: getResponsiveSpacing('xs'),
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: getResponsiveSpacing('md'),
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 