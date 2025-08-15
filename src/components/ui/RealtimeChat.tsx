import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { usePlatform } from '../../hooks/usePlatform';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { useViewport } from '../../hooks/useViewport';
import { EnhancedPhotoUploadService, PhotoType } from '../../services/enhancedPhotoUpload';
import { MessageType } from '../../types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { EmojiGifPicker } from './EmojiGifPicker';
import { SafeImage } from './SafeImage';

interface RealtimeChatProps {
  conversationId: string;
  otherUserName?: string;
  onBack?: () => void;
}

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showTimestamp = true }) => {
  const theme = useTheme();
  
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const isGifMessage = message.message_type === MessageType.GIF;
  const isStickerMessage = message.message_type === MessageType.STICKER;
  const isPhotoMessage = message.message_type === MessageType.PHOTO;
  
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
        {isGifMessage ? (
          <View style={styles.mediaMessageContainer}>
            <Image source={{ uri: message.content }} style={styles.mediaMessageImage} />
            <Text style={[styles.mediaMessageText, { color: isOwn ? theme.colors.onPrimary : theme.colors.text }]}>
              🎬 GIF
            </Text>
          </View>
        ) : isStickerMessage ? (
          <View style={styles.mediaMessageContainer}>
            <Image source={{ uri: message.content }} style={styles.mediaMessageImage} />
            <Text style={[styles.mediaMessageText, { color: isOwn ? theme.colors.onPrimary : theme.colors.text }]}>
              🎯 Sticker
            </Text>
          </View>
        ) : isPhotoMessage ? (
          <View style={styles.mediaMessageContainer}>
            <SafeImage source={{ uri: message.metadata?.imageUrl || message.content }} style={styles.mediaMessageImage} />
            <Text style={[styles.mediaMessageText, { color: isOwn ? theme.colors.onPrimary : theme.colors.text }]}>
              📷 Photo
            </Text>
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
        )}
        {message.is_read && isOwn && (
          <Text style={[styles.readIndicator, { color: theme.colors.onPrimary }]}>
            ✓
          </Text>
        )}
      </View>
      {showTimestamp && (
        <Text style={[
          styles.timestamp,
          { color: theme.colors.textSecondary }
        ]}>
          {formatTimestamp(message.created_at)}
        </Text>
      )}
    </View>
  );
};

const TypingIndicator: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const theme = useTheme();
  
  if (!isVisible) return null;
  
  return (
    <View style={[styles.typingContainer, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.typingDots}>
        <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
        <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
        <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
      </View>
      <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
        typing...
      </Text>
    </View>
  );
};

const OnlineStatusIndicator: React.FC<{ isOnline: boolean; userName: string }> = ({ 
  isOnline, 
  userName 
}) => {
  const theme = useTheme();
  
  return (
    <View style={styles.onlineStatusContainer}>
      <View style={[
        styles.onlineIndicator,
        { backgroundColor: isOnline ? theme.colors.success : theme.colors.textSecondary }
      ]} />
      <Text style={[styles.onlineStatusText, { color: theme.colors.textSecondary }]}>
        {userName} {isOnline ? 'is online' : 'was last seen recently'}
      </Text>
    </View>
  );
};

export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  conversationId,
  otherUserName = 'User',
  onBack
}) => {
  const theme = useTheme();
  const { isWeb, isDesktopBrowser } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser;
  
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'gif' | 'sticker' | 'image', url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    typingUsers,
    sendTypingIndicator,
    onlineUsers,
    offlineUsers,
    isConnected,
    reconnect,
    clearError
  } = useRealtimeChat({
    conversationId,
    enableTypingIndicators: true,
    enableOnlineStatus: true,
    enableReadReceipts: true,
    autoMarkAsRead: true,
  });

  // Handle typing with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isTyping) {
        sendTypingIndicator(false);
        setIsTyping(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [messageText, isTyping, sendTypingIndicator]);

  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedMedia) return;
    
    const textToSend = messageText.trim();
    setMessageText('');
    setSelectedMedia(null);
    setIsTyping(false);
    
    try {
      if (selectedMedia) {
        // Send media message
        await sendMessage(selectedMedia.url, selectedMedia.type === 'gif' ? MessageType.GIF : MessageType.STICKER);
      } else {
        // Send text message
        await sendMessage(textToSend, MessageType.TEXT);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

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

  const clearSelectedMedia = () => {
    setSelectedMedia(null);
  };

  const renderMediaPreview = () => {
    if (!selectedMedia) return null;

    return (
      <View style={styles.mediaPreviewContainer}>
        <View style={styles.mediaPreview}>
          <Text style={[styles.mediaPreviewText, { color: theme.colors.textSecondary }]}>
            {selectedMedia.type === 'gif' ? '🎬 GIF' : '🎯 Sticker'} selected
          </Text>
          <TouchableOpacity onPress={clearSelectedMedia} style={styles.clearMediaButton}>
            <MaterialIcons name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleReconnect = async () => {
    try {
      await reconnect();
    } catch (err) {
      Alert.alert('Error', 'Failed to reconnect');
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwn = (item.sender_id || item.senderId) === user?.id;
    const showTimestamp = index === 0 || 
      new Date(item.created_at).getTime() - new Date(messages[index - 1]?.created_at).getTime() > 300000; // 5 minutes
    
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showTimestamp={showTimestamp}
      />
    );
  };

  const isOtherUserOnline = onlineUsers.length > 0;

  // Enhanced keyboard handling for desktop
  const handleKeyPress = (e: any) => {
    if (isDesktop && e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Image picker functionality
  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow any aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Image selected:', asset.uri);
        
        // Show loading indicator
        Alert.alert('Uploading...', 'Please wait while we upload your image.');
        
        // Convert to PhotoUploadResult format
        const photoData = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image/jpeg',
          fileName: asset.fileName || `chat_image_${Date.now()}.jpg`,
          base64: asset.base64 || undefined,
        };

        // Create conversation-specific path
        const chatPath = conversationId 
          ? `conversations/${conversationId}/${Date.now()}.jpg`
          : `general/${Date.now()}.jpg`;

        // Upload using Edge Function
        const uploadResult = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
          photoData,
          PhotoType.CHAT,
          chatPath
        );
        
        if (uploadResult.success && uploadResult.url) {
          console.log('Image uploaded successfully:', uploadResult.url);
          console.log('File path:', uploadResult.path);
          
          // Add the uploaded image to selected media
          setSelectedMedia({
            type: 'image',
            url: uploadResult.url
          });
          setShowAttachmentMenu(false);
          
          Alert.alert('Success', 'Image uploaded successfully!');
        } else {
          console.error('Upload failed:', uploadResult.error);
          Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const permissionResult = await Audio.requestPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000) as any;

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordingDuration(0);

      if (uri) {
        // Send voice message
        await sendMessage(uri, MessageType.VOICE);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAttachmentMenu = () => {
    if (!showAttachmentMenu) return null;

    return (
      <View style={[
        styles.attachmentMenu,
        { backgroundColor: theme.colors.surface }
      ]}>
        <TouchableOpacity
          style={styles.attachmentOption}
          onPress={() => {
            setShowEmojiPicker(true);
            setShowAttachmentMenu(false);
          }}
        >
          <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <MaterialIcons name="emoji-emotions" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.attachmentText, { color: theme.colors.text }]}>
            Emoji & GIF
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachmentOption}
          onPress={handleImagePicker}
        >
          <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.success + '20' }]}>
            <MaterialIcons name="image" size={24} color={theme.colors.success} />
          </View>
          <Text style={[styles.attachmentText, { color: theme.colors.text }]}>
            Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachmentOption}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.warning + '20' }]}>
            <MaterialIcons 
              name={isRecording ? "stop" : "mic"} 
              size={24} 
              color={theme.colors.warning} 
            />
          </View>
          <Text style={[styles.attachmentText, { color: theme.colors.text }]}>
            {isRecording ? 'Recording...' : 'Voice'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.reconnectButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleReconnect}
          >
            <Text style={[styles.reconnectButtonText, { color: theme.colors.onPrimary }]}>
              Reconnect
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.colors.surface,
          paddingHorizontal: isDesktop ? getResponsiveSpacing('xl') : getResponsiveSpacing('md'),
          paddingVertical: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
        }
      ]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.headerInfo}>
          <Text style={[
            styles.headerTitle, 
            { 
              color: theme.colors.text,
              fontSize: isDesktop ? getResponsiveFontSize('xl') : getResponsiveFontSize('lg'),
            }
          ]}>
            {otherUserName}
          </Text>
          <OnlineStatusIndicator
            isOnline={isOtherUserOnline}
            userName={otherUserName}
          />
        </View>
        
        <View style={styles.connectionStatus}>
          <View style={[
            styles.connectionDot,
            { backgroundColor: isConnected ? theme.colors.success : theme.colors.error }
          ]} />
          <Text style={[styles.connectionText, { color: theme.colors.textSecondary }]}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading messages...
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No messages yet. Start the conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingHorizontal: isDesktop ? getResponsiveSpacing('xl') : getResponsiveSpacing('md'),
              paddingVertical: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
            }
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={isDesktop}
        />
      )}

      {/* Typing Indicator */}
      <TypingIndicator isVisible={typingUsers.length > 0} />

      {/* Recording Indicator */}
      {isRecording && (
        <View style={[styles.recordingIndicator, { backgroundColor: theme.colors.error }]}>
          <MaterialIcons name="mic" size={20} color="white" />
          <Text style={styles.recordingText}>
            Recording... {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}

      {/* Input */}
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.colors.surface,
          paddingHorizontal: isDesktop ? getResponsiveSpacing('xl') : getResponsiveSpacing('md'),
          paddingVertical: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
        }
      ]}>
        {renderMediaPreview()}
        
        {/* Attachment Menu */}
        {renderAttachmentMenu()}
        
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[
              styles.attachmentButton,
              isDesktop && styles.desktopAttachmentButton
            ]}
            onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
          >
            <MaterialIcons 
              name="attach-file" 
              size={isDesktop ? 28 : 24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                fontSize: isDesktop ? getResponsiveFontSize('md') : getResponsiveFontSize('sm'),
                paddingHorizontal: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
                paddingVertical: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
                borderRadius: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
                maxHeight: isDesktop ? 120 : 100,
              }
            ]}
            value={messageText}
            onChangeText={handleTextChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: (messageText.trim() || selectedMedia) ? theme.colors.primary : theme.colors.disabled,
                paddingHorizontal: isDesktop ? getResponsiveSpacing('xl') : getResponsiveSpacing('md'),
                paddingVertical: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
                borderRadius: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
                minWidth: isDesktop ? 80 : 60,
              }
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() && !selectedMedia}
          >
            <Text style={[
              styles.sendButtonText, 
              { 
                color: theme.colors.onPrimary,
                fontSize: isDesktop ? getResponsiveFontSize('md') : getResponsiveFontSize('sm'),
              }
            ]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emoji GIF Picker Modal */}
      <EmojiGifPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        onGifSelect={handleGifSelect}
        onStickerSelect={handleStickerSelect}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 1200, // Limit width on desktop
    alignSelf: 'center', // Center on desktop
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 60,
  },
  backButton: {
    marginRight: getResponsiveSpacing('md'),
    padding: getResponsiveSpacing('sm'),
  },
  backButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  connectionStatus: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
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
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    opacity: 0.6,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  onlineStatusText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  reconnectButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  readIndicator: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  connectionText: {
    fontSize: 10,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveSpacing('sm'),
  },
  emojiButton: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  desktopEmojiButton: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
  },
  mediaPreviewContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    backgroundColor: '#f0f2f5',
    borderRadius: getResponsiveSpacing('sm'),
  },
  mediaPreviewText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  clearMediaButton: {
    padding: getResponsiveSpacing('xs'),
  },
  mediaMessageContainer: {
    alignItems: 'center',
    padding: getResponsiveSpacing('sm'),
  },
  mediaMessageImage: {
    width: 200,
    height: 150,
    borderRadius: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  mediaMessageText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    textAlign: 'center',
  },
  attachmentButton: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  desktopAttachmentButton: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
  },
  attachmentMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: getResponsiveSpacing('sm'),
  },
  attachmentOption: {
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSpacing('xs'),
  },
  attachmentText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
    textAlign: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    marginHorizontal: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('md'),
  },
  recordingText: {
    color: 'white',
    marginLeft: getResponsiveSpacing('sm'),
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
}); 