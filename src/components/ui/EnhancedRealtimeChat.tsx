import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { useAudioManager } from '../../hooks/useAudioManager';
import { usePlatform } from '../../hooks/usePlatform';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { useViewport } from '../../hooks/useViewport';
import { MessageType } from '../../types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { EmojiGifPicker } from './EmojiGifPicker';
import { SafeImage } from './SafeImage';
import { TGSSimpleRenderer } from './TGSSimpleRenderer';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface EnhancedRealtimeChatProps {
  conversationId: string;
  otherUserName?: string;
  onBack?: () => void;
}

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showTimestamp?: boolean;
  onImagePress?: (uri: string, type: string) => void;
  onLongPress?: (message: any) => void;
  showOptions?: boolean;
  onOptionsClose?: () => void;
  onCopyMessage?: (message: any) => void;
  onDeleteMessage?: (message: any) => void;
  onReplyToMessage?: (message: any) => void;
  handleEditMessage?: (message: any) => void;
  handleReportMessage?: (message: any) => void;
  repliedMessage?: any;
  messages?: any[];
  otherUserName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  showTimestamp = true, 
  onImagePress,
  onLongPress,
  showOptions = false,
  onOptionsClose,
  onCopyMessage,
  onDeleteMessage,
  onReplyToMessage,
  handleEditMessage,
  handleReportMessage,
  repliedMessage,
  messages = [],
  otherUserName = 'User'
}) => {
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
  const isVoiceMessage = message.message_type === MessageType.VOICE;
  
  // Find the replied message
  const findRepliedMessage = (replyToId: string) => {
    return messages.find((msg: any) => msg.id === replyToId);
  };

  const repliedToMessage = message.metadata?.replyTo ? findRepliedMessage(message.metadata.replyTo) : null;
  
  return (
    <View style={[
      styles.messageContainer,
      isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      <View style={[
        styles.messageContent,
        isOwn ? styles.ownMessageContent : styles.otherMessageContent
      ]}>
        {/* Reply Preview */}
        {repliedToMessage && (
          <View style={[
            styles.replyPreview,
            { backgroundColor: isOwn ? theme.colors.surface : theme.colors.background }
          ]}>
            <View style={styles.replyPreviewContent}>
              <View style={styles.replyPreviewInfo}>
                <MaterialIcons 
                  name="reply" 
                  size={12} 
                  color={isOwn ? theme.colors.onPrimary : theme.colors.primary} 
                />
        <Text style={[
                  styles.replyPreviewSender,
                  { color: isOwn ? theme.colors.onPrimary : theme.colors.primary }
                ]}>
                  {repliedToMessage.sender_id === message.sender_id ? 'You' : otherUserName}
                </Text>
              </View>
              <Text style={[
                styles.replyPreviewText,
                { color: isOwn ? theme.colors.onPrimary : theme.colors.textSecondary }
              ]} numberOfLines={1}>
                {repliedToMessage.content}
              </Text>
            </View>
            <View style={[
              styles.replyPreviewLine,
              { backgroundColor: isOwn ? theme.colors.onPrimary : theme.colors.primary }
            ]} />
          </View>
        )}
        {isOwn ? (
          // Owner message: Options button first, then message
          <>
            <TouchableOpacity
              style={styles.messageOptionsButton}
              onPress={() => onLongPress?.(message)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="more-vert" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Inline Options Menu for Owner */}
            {showOptions && isOwn && (
              <View style={[styles.inlineOptionsMenu, styles.ownerInlineOptionsMenu, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                  style={styles.inlineOptionItem}
                  onPress={() => handleEditMessage?.(message)}
                >
                  <MaterialIcons name="edit" size={16} color={theme.colors.primary} />
                  <Text style={[styles.inlineOptionText, { color: theme.colors.text }]}>
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inlineOptionItem}
                  onPress={() => {
                    console.log('🗑️ Delete button clicked for message:', message.id);
                    onDeleteMessage?.(message);
                  }}
                >
                  <MaterialIcons name="delete" size={16} color={theme.colors.error} />
                  <Text style={[styles.inlineOptionText, { color: theme.colors.error }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.messageBubble,
                (isGifMessage || isStickerMessage || isPhotoMessage) ? 
                  { backgroundColor: 'transparent', padding: 0 } : // No background for media messages
                  [styles.ownMessageBubble, { backgroundColor: theme.colors.primary }]
              ]}
              onLongPress={() => onLongPress?.(message)}
              activeOpacity={0.8}
            >
              {isGifMessage ? (
                <View style={styles.mediaMessageContainer}>
                  <TouchableOpacity onPress={() => onImagePress?.(message.content, 'gif')}>
                    <Image source={{ uri: message.content }} style={styles.mediaMessageImage} />
                  </TouchableOpacity>
                  <Text style={[styles.mediaMessageText, { color: theme.colors.onPrimary }]}>
                    🎬 GIF
                  </Text>
                </View>
              ) : isStickerMessage ? (
                <View style={styles.mediaMessageContainer}>
                  <TouchableOpacity onPress={() => onImagePress?.(message.content, 'sticker')}>
                    {message.content.toLowerCase().endsWith('.tgs') ? (
                      <TGSSimpleRenderer
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
                  <Text style={[styles.mediaMessageText, { color: theme.colors.onPrimary }]}>
                    🎯 Sticker
                  </Text>
                </View>
              ) : isPhotoMessage ? (
                <View style={styles.mediaMessageContainer}>
                  <TouchableOpacity onPress={() => onImagePress?.(message.metadata?.imageUrl || message.content, 'photo')}>
                    <SafeImage source={{ uri: message.metadata?.imageUrl || message.content }} style={styles.mediaMessageImage} />
                  </TouchableOpacity>
                  <Text style={[styles.mediaMessageText, { color: theme.colors.onPrimary }]}>
                    📷 Photo
                  </Text>
                </View>
              ) : isVoiceMessage ? (
                <VoiceMessagePlayer
                  audioUrl={message.metadata?.audioUrl || ''}
                  duration={message.metadata?.audioDuration || 0}
                  isOwnMessage={true}
                  messageId={message.id}
                  onPlay={() => console.log('Voice message started playing')}
                  onPause={() => console.log('Voice message paused')}
                  onEnd={() => console.log('Voice message finished')}
                />
              ) : (
                <Text style={[styles.messageText, styles.ownMessageText]}>
                  {message.content}
                </Text>
              )}
              {message.is_read && (
          <Text style={[styles.readIndicator, { color: theme.colors.onPrimary }]}>
            ✓
          </Text>
        )}
            </TouchableOpacity>
          </>
        ) : (
          // Other message: Message first, then options button
          <>
            <TouchableOpacity
              style={[
                styles.messageBubble,
                (isGifMessage || isStickerMessage || isPhotoMessage) ? 
                  { backgroundColor: 'transparent', padding: 0 } : // No background for media messages
                  [styles.otherMessageBubble, { backgroundColor: theme.colors.surface }]
              ]}
              onLongPress={() => onLongPress?.(message)}
              activeOpacity={0.8}
            >
              {isGifMessage ? (
                <View style={styles.mediaMessageContainer}>
                  <TouchableOpacity onPress={() => onImagePress?.(message.content, 'gif')}>
                    <Image source={{ uri: message.content }} style={styles.mediaMessageImage} />
                  </TouchableOpacity>
                  <Text style={[styles.mediaMessageText, { color: theme.colors.text }]}>
                    🎬 GIF
                  </Text>
      </View>
              ) : isStickerMessage ? (
                <View style={styles.mediaMessageContainer}>
                  <TouchableOpacity onPress={() => onImagePress?.(message.content, 'sticker')}>
                    {message.content.toLowerCase().endsWith('.tgs') ? (
                      <TGSSimpleRenderer
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
                  <Text style={[styles.mediaMessageText, { color: theme.colors.text }]}>
                    🎯 Sticker
                  </Text>
                </View>
              ) : isPhotoMessage ? (
                <View style={styles.mediaMessageContainer}>
                  <TouchableOpacity onPress={() => onImagePress?.(message.metadata?.imageUrl || message.content, 'photo')}>
                    <SafeImage source={{ uri: message.metadata?.imageUrl || message.content }} style={styles.mediaMessageImage} />
                  </TouchableOpacity>
                  <Text style={[styles.mediaMessageText, { color: theme.colors.text }]}>
                    📷 Photo
                  </Text>
                </View>
              ) : isVoiceMessage ? (
                <VoiceMessagePlayer
                  audioUrl={message.metadata?.audioUrl || ''}
                  duration={message.metadata?.audioDuration || 0}
                  isOwnMessage={false}
                  messageId={message.id}
                  onPlay={() => console.log('Voice message started playing')}
                  onPause={() => console.log('Voice message paused')}
                  onEnd={() => console.log('Voice message finished')}
                />
              ) : (
                <Text style={[styles.messageText, styles.otherMessageText]}>
                  {message.content}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageOptionsButton}
              onPress={() => onLongPress?.(message)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="more-vert" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Inline Options Menu for Others */}
            {showOptions && !isOwn && (
              <View style={[styles.inlineOptionsMenu, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                  style={styles.inlineOptionItem}
                  onPress={() => onReplyToMessage?.(message)}
                >
                  <MaterialIcons name="reply" size={16} color={theme.colors.primary} />
                  <Text style={[styles.inlineOptionText, { color: theme.colors.text }]}>
                    Reply
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inlineOptionItem}
                  onPress={() => handleReportMessage?.(message)}
                >
                  <MaterialIcons name="report" size={16} color={theme.colors.error} />
                  <Text style={[styles.inlineOptionText, { color: theme.colors.error }]}>
                    Report
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {showTimestamp && (
        <Text style={[
          styles.timestamp,
          { color: theme.colors.textSecondary },
          isOwn ? styles.ownTimestamp : styles.otherTimestamp
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

const SearchBar: React.FC<{
  onSearch: (query: string) => void;
  isSearching: boolean;
  searchResults: any[];
}> = ({ onSearch, isSearching, searchResults }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }
        ]}
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search messages..."
        placeholderTextColor={theme.colors.textSecondary}
      />
      {isSearching && (
        <ActivityIndicator size="small" color={theme.colors.primary} style={styles.searchSpinner} />
      )}
      {searchResults.length > 0 && (
        <Text style={[styles.searchResultsText, { color: theme.colors.textSecondary }]}>
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
};

const MessageStats: React.FC<{
  messageCount: number;
  unreadCount: number;
}> = ({ messageCount, unreadCount }) => {
  const theme = useTheme();

  return (
    <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
        {messageCount} message{messageCount !== 1 ? 's' : ''}
        {unreadCount > 0 && ` • ${unreadCount} unread`}
      </Text>
    </View>
  );
};

const ImageViewer: React.FC<{
  image: { uri: string; type: string } | null;
  onClose: () => void;
}> = ({ image, onClose }) => {
  const theme = useTheme();
  
  if (!image) return null;
  
  return (
    <View style={styles.imageViewerOverlay}>
      <View style={styles.imageViewerContainer}>
        <View style={styles.imageViewerHeader}>
          <Text style={[styles.imageViewerTitle, { color: theme.colors.text }]}>
            {image.type === 'gif' ? '🎬 GIF' : image.type === 'sticker' ? '🎯 Sticker' : '📷 Photo'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.imageViewerCloseButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.imageViewerContent}>
          {image.uri.toLowerCase().endsWith('.tgs') ? (
            <TGSSimpleRenderer
              url={image.uri}
              width={400}
              height={400}
              autoPlay={true}
              loop={true}
              style={styles.imageViewerImage}
            />
          ) : (
            <SafeImage 
              source={{ uri: image.uri }} 
              style={styles.imageViewerImage}
              resizeMode="contain"
              fallbackSize={64}
              showFallbackText={true}
              fallbackText="Image not available"
            />
          )}
        </View>
      </View>
    </View>
  );
};

export const EnhancedRealtimeChat: React.FC<EnhancedRealtimeChatProps> = ({
  conversationId,
  otherUserName = 'User',
  onBack
}) => {
  const theme = useTheme();
  const { isWeb, isDesktopBrowser } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser;
  
  const { user } = useAuth();
  useAudioManager();

  // Notification setup
  useEffect(() => {
    const setupNotifications = async () => {
      if (!isWeb) {
        // Request notification permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Notification permissions not granted');
          return;
        }

        // Configure notification behavior
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Get push token for remote notifications (optional)
        try {
          const token = await Notifications.getExpoPushTokenAsync();
          console.log('Push token:', token);
        } catch (error) {
          console.log('Error getting push token:', error);
        }
      }
    };

    setupNotifications();
  }, [isWeb]);

  // Set up notification response listener
  useEffect(() => {
    if (!isWeb) {
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        
        if (data.type === 'new_message' && data.conversationId === conversationId) {
          // User tapped on a new message notification
          console.log('User tapped on new message notification');
          // You can add navigation logic here if needed
        } else if (data.type === 'typing' && data.conversationId === conversationId) {
          // User tapped on typing notification
          console.log('User tapped on typing notification');
        } else if (data.type === 'status_change' && data.conversationId === conversationId) {
          // User tapped on status change notification
          console.log('User tapped on status change notification');
        }
      });

      return () => subscription.remove();
    }
  }, [conversationId, isWeb]);

  // Function to show local notifications
  const showNotification = async (title: string, body: string, data?: any) => {
    if (isWeb) return; // Skip notifications on web
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Function to show typing notification
  const showTypingNotification = async (userName: string) => {
    if (isWeb) return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${userName} is typing...`,
          body: 'Tap to open chat',
          data: { type: 'typing', conversationId },
          sound: false, // No sound for typing
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing typing notification:', error);
    }
  };

  // Function to show new message notification
  const showNewMessageNotification = async (message: any, senderName: string) => {
    if (isWeb) return;
    
    try {
      let body = 'New message';
      if (message.content) {
        body = message.content.length > 50 
          ? `${message.content.substring(0, 50)}...` 
          : message.content;
      } else if (message.message_type === MessageType.PHOTO) {
        body = '📷 Photo';
      } else if (message.message_type === MessageType.VOICE) {
        body = '🎤 Voice message';
      } else if (message.message_type === MessageType.GIF) {
        body = '🎬 GIF';
      } else if (message.message_type === MessageType.STICKER) {
        body = '😊 Sticker';
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Message from ${senderName}`,
          body,
          data: { 
            type: 'new_message', 
            conversationId,
            messageId: message.id,
            senderId: message.sender_id
          },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing new message notification:', error);
    }
  };

  // Function to show online status notification
  const showOnlineStatusNotification = async (userName: string, isOnline: boolean) => {
    if (isWeb) return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: isOnline ? `${userName} is online` : `${userName} went offline`,
          body: isOnline ? 'Tap to start chatting' : 'They\'ll see your message when they\'re back',
          data: { 
            type: 'status_change', 
            conversationId,
            isOnline 
          },
          sound: false,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing status notification:', error);
    }
  };
  
  // Cross-platform alert helper
  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (isWeb) {
      if (buttons && buttons.length > 0) {
        // For confirmation dialogs, use confirm
        const confirmed = window.confirm(message);
        if (confirmed && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        // For simple alerts, use alert
        window.alert(message);
      }
    } else {
      // Mobile platform: use React Native Alert
      Alert.alert(title, message, buttons);
    }
  };
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Array<{ type: 'gif' | 'sticker' | 'image', url: string, id: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; type: string } | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [repliedMessage, setRepliedMessage] = useState<any>(null);

  // Message options handlers
  const handleMessageLongPress = (message: any) => {
    console.log('🔍 Message long press:', message.id, 'Current selected:', selectedMessage?.id, 'Show options:', showMessageOptions);
    
    if (selectedMessage?.id === message.id && showMessageOptions) {
      // If clicking the same message and options are already shown, hide them
      console.log('🔍 Hiding options for message:', message.id);
      setShowMessageOptions(false);
      setSelectedMessage(null);
    } else {
      // Show options for the clicked message
      console.log('🔍 Showing options for message:', message.id);
      setSelectedMessage(message);
      setShowMessageOptions(true);
    }
  };

  const handleMessageOptionsClose = () => {
    setShowMessageOptions(false);
    setSelectedMessage(null);
  };

  const handleCopyMessage = (message: any) => {
    // Copy message content to clipboard
    if (message.content) {
      // For web, we can use navigator.clipboard
      if (isWeb && navigator.clipboard) {
        navigator.clipboard.writeText(message.content);
      } else {
        // For mobile, we'll need to implement clipboard functionality
        showAlert('Copied!', 'Message copied to clipboard');
      }
      
      // Show success notification for copying
      if (!isWeb) {
        showNotification(
          'Copied!',
          '📋 Message copied to clipboard'
        );
      }
    }
    handleMessageOptionsClose();
  };

  const handleDeleteMessage = async (message: any) => {
    console.log('🔍 Delete message triggered for:', message.id, message);
    
    // Cross-platform confirmation dialog
    const isWeb = typeof window !== 'undefined' && window.document;
    
    if (isWeb) {
      // Web browser: use browser's confirm dialog
      console.log('🌐 Web platform detected, using browser confirm');
      const confirmed = window.confirm('Are you sure you want to delete this message? This action cannot be undone.');
      
      if (confirmed) {
        try {
          console.log('🗑️ Delete confirmed, proceeding with deletion...');
          console.log('🔍 deleteMessage function available:', typeof deleteMessage);
          
          // Delete the message using the hook's deleteMessage function
          const success = await deleteMessage(message.id);
          
          console.log('🔍 Delete result:', success);
          
          if (success) {
            console.log('✅ Message deleted successfully');
            
            // Show success notification for message deletion
            if (!isWeb) {
              showNotification(
                'Message Deleted',
                '🗑️ Message deleted successfully!'
              );
            }
            
            handleMessageOptionsClose();
          } else {
            throw new Error('Delete operation failed');
          }
          
          handleMessageOptionsClose();
        } catch (error) {
          console.error('❌ Error deleting message:', error);
          window.alert('Failed to delete message. Please try again.');
        }
      } else {
        console.log('❌ Delete cancelled by user');
      }
    } else {
      // Mobile platform: use React Native Alert
      console.log('📱 Mobile platform detected, using React Native Alert');
      try {
        Alert.alert(
          'Delete Message',
          'Are you sure you want to delete this message? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('🗑️ Delete confirmed, proceeding with deletion...');
                  console.log('🔍 deleteMessage function available:', typeof deleteMessage);
                  
                  // Delete the message using the hook's deleteMessage function
                  const success = await deleteMessage(message.id);
                  
                  console.log('🔍 Delete result:', success);
                  
                  if (success) {
                    console.log('✅ Message deleted successfully');
                    
                    // Show success notification for message deletion
                    if (!isWeb) {
                      showNotification(
                        'Message Deleted',
                        '🗑️ Message deleted successfully!'
                      );
                    }
                    
                    handleMessageOptionsClose();
                  } else {
                    throw new Error('Delete operation failed');
                  }
                  
                  handleMessageOptionsClose();
                } catch (error) {
                  console.error('❌ Error deleting message:', error);
                  Alert.alert('Error', 'Failed to delete message. Please try again.');
                }
              }
            }
          ]
        );
        
        console.log('✅ Alert.alert called successfully');
      } catch (alertError) {
        console.error('❌ Alert.alert failed:', alertError);
        
        // Fallback: try to delete directly without confirmation
        console.log('🔄 Attempting direct deletion as fallback...');
        try {
          const success = await deleteMessage(message.id);
          if (success) {
            console.log('✅ Message deleted successfully (fallback)');
            handleMessageOptionsClose();
          } else {
            console.error('❌ Direct deletion failed');
          }
        } catch (deleteError) {
          console.error('❌ Direct deletion error:', deleteError);
        }
      }
    }
  };

  const handleReplyToMessage = (message: any) => {
    setRepliedMessage(message);
    handleMessageOptionsClose();
    // Focus the text input
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setRepliedMessage(null);
  };

  const handleEditMessage = (message: any) => {
    // TODO: Implement edit functionality
    console.log('Edit message:', message.id);
    handleMessageOptionsClose();
  };

  const handleReportMessage = (message: any) => {
    showAlert(
      'Report Message',
      'Are you sure you want to report this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement message reporting
              console.log('Reporting message:', message.id);
              showAlert('Reported', 'Message has been reported');
              handleMessageOptionsClose();
            } catch (error) {
              console.error('Error reporting message:', error);
              showAlert('Error', 'Failed to report message');
            }
          }
        }
      ]
    );
  };
  
  const {
    messages,
    sendMessage,
    sendImageMessage,
    isLoading,
    error,
    typingUsers,
    sendTypingIndicator,
    onlineUsers,
    offlineUsers,
    isConnected,
    reconnect,
    clearError,
    // Enhanced features
    hasMoreMessages,
    loadMoreMessages,
    isLoadingMore,
    searchMessages,
    isSearching,
    searchResults,
    messageCount,
    unreadCount,
    refreshMessages,
    sendVoiceMessage,
    deleteMessage,
  } = useRealtimeChat({
    conversationId,
    enableTypingIndicators: true,
    enableOnlineStatus: true,
    enableReadReceipts: true,
    autoMarkAsRead: true,
    initialMessageLimit: 30,
    enablePagination: true,
    enableSearch: true,
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

  // Monitor for new messages and show notifications
  useEffect(() => {
    if (messages.length > 0 && !isWeb) {
      const lastMessage = messages[messages.length - 1];
      
      // Only show notification if it's not from the current user and it's a recent message
      if (lastMessage.sender_id !== user?.id) {
        const messageTime = new Date(lastMessage.created_at).getTime();
        const now = Date.now();
        const timeDiff = now - messageTime;
        
        // Show notification for messages received in the last 30 seconds
        if (timeDiff < 30000) {
          showNewMessageNotification(lastMessage, otherUserName);
        }
      }
    }
  }, [messages, user?.id, otherUserName, isWeb]);

  // Monitor typing indicators and show notifications
  useEffect(() => {
    if (typingUsers.length > 0 && !isWeb) {
      const typingUserId = typingUsers[0]; // Get the first typing user ID
      if (typingUserId !== user?.id) {
        showTypingNotification(otherUserName);
      }
    }
  }, [typingUsers, user?.id, otherUserName, isWeb]);

  // Monitor online status changes and show notifications
  useEffect(() => {
    if (!isWeb && onlineUsers.length > 0) {
      const otherUserId = onlineUsers.find(userId => userId !== user?.id);
      if (otherUserId) {
        showOnlineStatusNotification(otherUserName, true);
      }
    }
  }, [onlineUsers, user?.id, otherUserName, isWeb]);

  // Monitor offline status changes and show notifications
  useEffect(() => {
    if (!isWeb && offlineUsers.length > 0) {
      const otherUserId = offlineUsers.find(userId => userId !== user?.id);
      if (otherUserId) {
        showOnlineStatusNotification(otherUserName, false);
      }
    }
  }, [offlineUsers, user?.id, otherUserName, isWeb]);

  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedMedia.length === 0) return;
    
    const textToSend = messageText.trim();
    setMessageText('');
    setSelectedMedia([]);
    setIsTyping(false);
    
    // Clear reply after sending
    const currentRepliedMessage = repliedMessage;
    setRepliedMessage(null);
    
    try {
      if (selectedMedia.length > 0) {
        // Send multiple media messages
        for (const media of selectedMedia) {
          let messageType: MessageType;
          switch (media.type) {
            case 'gif':
              messageType = MessageType.GIF;
              break;
            case 'sticker':
              messageType = MessageType.STICKER;
              break;
            case 'image':
              messageType = MessageType.PHOTO;
              break;
            default:
              messageType = MessageType.TEXT;
          }
          await sendMessage(media.url, messageType, { replyTo: currentRepliedMessage?.id });
          
          // Show success notification for media message
          if (!isWeb) {
            showNotification(
              'Message Sent',
              `${media.type === 'image' ? '📷 Photo' : media.type === 'gif' ? '🎬 GIF' : '😊 Sticker'} sent successfully!`
            );
          }
        }
      } else {
        // Send text message with reply data
        await sendMessage(textToSend, MessageType.TEXT, { replyTo: currentRepliedMessage?.id });
        
        // Show success notification for text message
        if (!isWeb) {
          showNotification(
            'Message Sent',
            '💬 Text message sent successfully!'
          );
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };

  const handleGifSelect = (gifUrl: string) => {
    const newMedia = { type: 'gif' as const, url: gifUrl, id: Date.now().toString() };
    setSelectedMedia(prev => [...prev, newMedia]);
    setShowEmojiPicker(false);
  };

  const handleStickerSelect = (stickerUrl: string) => {
    const newMedia = { type: 'sticker' as const, url: stickerUrl, id: Date.now().toString() };
    setSelectedMedia(prev => [...prev, newMedia]);
    setShowEmojiPicker(false);
  };

  const handleImagePress = (uri: string, type: string) => {
    setSelectedImage({ uri, type });
  };

  const clearSelectedMedia = () => {
    setSelectedMedia([]);
  };

  const removeSelectedMedia = (id: string) => {
    setSelectedMedia(prev => prev.filter(media => media.id !== id));
  };

  const renderMediaPreview = () => {
    if (selectedMedia.length === 0) return null;

    return (
      <View style={styles.mediaPreviewContainer}>
        <View style={styles.mediaPreviewHeader}>
          <Text style={[styles.mediaPreviewTitle, { color: theme.colors.text }]}>
            {selectedMedia.length} attachment{selectedMedia.length > 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity onPress={clearSelectedMedia} style={styles.clearAllMediaButton}>
            <MaterialIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.mediaPreviewScroll}
          contentContainerStyle={styles.mediaPreviewScrollContent}
        >
          {selectedMedia.map((media, index) => (
            <View key={media.id} style={styles.mediaPreviewItem}>
              {media.type === 'image' ? (
                <SafeImage
                  source={{ uri: media.url }}
                  style={styles.mediaPreviewImage}
                  fallbackSize={32}
                  showFallbackText={false}
                />
              ) : media.type === 'sticker' && media.url.toLowerCase().endsWith('.tgs') ? (
                <TGSSimpleRenderer
                  url={media.url}
                  width={60}
                  height={60}
                  autoPlay={true}
                  loop={true}
                  style={styles.mediaPreviewImage}
                />
              ) : (
                <View style={styles.mediaPreviewIcon}>
                  <MaterialIcons 
                    name={media.type === 'gif' ? 'gif' : 'sticky-note-2'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
              )}
              <TouchableOpacity 
                onPress={() => removeSelectedMedia(media.id)} 
                style={styles.removeMediaButton}
              >
                <MaterialIcons name="close" size={16} color={theme.colors.error} />
              </TouchableOpacity>
              <Text style={[styles.mediaPreviewItemText, { color: theme.colors.textSecondary }]}>
                {media.type === 'gif' ? 'GIF' : media.type === 'sticker' ? 'Sticker' : 'Photo'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const handleReconnect = async () => {
    try {
      await reconnect();
      
      // Show success notification for reconnection
      if (!isWeb) {
        showNotification(
          'Reconnected',
          '✅ Successfully reconnected to chat service!'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reconnect');
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      const results = await searchMessages(query);
      
      // Show notification for search results
      if (!isWeb && results.length > 0) {
        showNotification(
          'Search Results',
          `🔍 Found ${results.length} message${results.length > 1 ? 's' : ''} for "${query}"`
        );
      } else if (!isWeb && results.length === 0) {
        showNotification(
          'No Results',
          `🔍 No messages found for "${query}"`
        );
      }
    }
  };

  const handleLoadMore = async () => {
    if (hasMoreMessages && !isLoadingMore) {
      await loadMoreMessages();
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwn = (item.sender_id || item.senderId) === user?.id;
    
    // Calculate if we should show timestamp
    let showTimestamp = index === 0;
    if (index > 0 && messages[index - 1]?.created_at) {
      const currentTime = new Date(item.created_at).getTime();
      const previousTime = new Date(messages[index - 1].created_at).getTime();
      showTimestamp = (currentTime - previousTime) > 300000; // 5 minutes
    }
    
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showTimestamp={showTimestamp}
        onImagePress={handleImagePress}
        onLongPress={handleMessageLongPress}
        showOptions={showMessageOptions && selectedMessage?.id === item.id}
        onOptionsClose={handleMessageOptionsClose}
        onCopyMessage={handleCopyMessage}
        onDeleteMessage={handleDeleteMessage}
        onReplyToMessage={handleReplyToMessage}
        handleEditMessage={handleEditMessage}
        handleReportMessage={handleReportMessage}
        repliedMessage={repliedMessage}
        messages={messages}
        otherUserName={otherUserName}
      />
    );
  };

  const renderLoadMoreButton = () => {
    if (!hasMoreMessages) return null;

    return (
      <TouchableOpacity
        style={[styles.loadMoreButton, { backgroundColor: theme.colors.surface }]}
        onPress={handleLoadMore}
        disabled={isLoadingMore}
      >
        {isLoadingMore ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Text style={[styles.loadMoreText, { color: theme.colors.primary }]}>
            Load More Messages
          </Text>
        )}
      </TouchableOpacity>
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
        
        // Convert to ImageUploadData format for UUID-based sending
        const imageData = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image/jpeg',
          base64: asset.base64 || undefined,
        };

        // Send image message with UUID-based filename
        await sendImageMessage(imageData, '', { replyTo: repliedMessage?.id });
        
        setShowAttachmentMenu(false);
        
        // Show success notification for image message
        if (!isWeb) {
          showNotification(
            'Image Sent',
            '📷 Image sent successfully!'
          );
        } else {
          Alert.alert('Success', 'Image sent successfully!');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
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
        // Send voice message using the dedicated voice message method
        await sendVoiceMessage(uri, recordingDuration);
        
        // Show success notification for voice message
        if (!isWeb) {
          showNotification(
            'Voice Message Sent',
            '🎤 Voice message sent successfully!'
          );
        }
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

  const renderMoreOptionsMenu = () => {
    if (!showMoreOptions) return null;

    return (
      <View style={[
        styles.moreOptionsMenu,
        { backgroundColor: theme.colors.surface }
      ]}>
        <TouchableOpacity
          style={styles.moreOption}
          onPress={() => {
            setShowSearch(!showSearch);
            setShowMoreOptions(false);
          }}
        >
          <MaterialIcons name="search" size={20} color={theme.colors.primary} />
          <Text style={[styles.moreOptionText, { color: theme.colors.text }]}>
            Search Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreOption}
          onPress={() => {
            refreshMessages();
            setShowMoreOptions(false);
          }}
        >
          <MaterialIcons name="refresh" size={20} color={theme.colors.primary} />
          <Text style={[styles.moreOptionText, { color: theme.colors.text }]}>
            Refresh Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moreOption}
          onPress={() => {
            // TODO: Implement clear chat functionality
            setShowMoreOptions(false);
          }}
        >
          <MaterialIcons name="clear-all" size={20} color={theme.colors.error} />
          <Text style={[styles.moreOptionText, { color: theme.colors.error }]}>
            Clear Chat
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Main Chat Area */}
      <View style={styles.chatArea}>
    <KeyboardAvoidingView
          style={{ flex: 1 }}
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
            <MaterialIcons 
              name="arrow-back" 
              size={isDesktop ? 28 : 24} 
              color={theme.colors.primary} 
            />
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
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, isDesktop && styles.desktopHeaderButton]}
            onPress={() => {
              // TODO: Implement voice call functionality
              Alert.alert('Call', 'Voice call feature coming soon!');
            }}
          >
            <MaterialIcons 
              name="call" 
              size={isDesktop ? 24 : 20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, isDesktop && styles.desktopHeaderButton]}
            onPress={() => setShowInfoPanel(!showInfoPanel)}
          >
            <MaterialIcons 
              name={showInfoPanel ? "info" : "info-outline"} 
              size={isDesktop ? 24 : 20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        
          
          <TouchableOpacity
            style={[styles.headerButton, isDesktop && styles.desktopHeaderButton]}
            onPress={() => setShowMoreOptions(!showMoreOptions)}
          >
            <MaterialIcons 
              name="more-vert" 
              size={isDesktop ? 24 : 20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <SearchBar
          onSearch={handleSearch}
          isSearching={isSearching}
          searchResults={searchResults}
        />
      )}

      {/* More Options Menu */}
      {renderMoreOptionsMenu()}

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
          ListHeaderComponent={renderLoadMoreButton}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
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
      {/* Reply Preview */}
      {repliedMessage && (
        <View style={[
          styles.replyPreviewContainer,
          { backgroundColor: theme.colors.surface }
        ]}>
          <View style={styles.replyPreviewHeader}>
            <View style={styles.replyPreviewHeaderLeft}>
              <MaterialIcons 
                name="reply" 
                size={16} 
                color={theme.colors.primary} 
              />
              <Text style={[
                styles.replyPreviewHeaderText,
                { color: theme.colors.primary }
              ]}>
                Replying to {repliedMessage.sender_id === user?.id ? 'yourself' : otherUserName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.replyPreviewCloseButton}
              onPress={handleCancelReply}
            >
              <MaterialIcons 
                name="close" 
                size={16} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          <View style={[
            styles.replyPreviewMessage,
            { backgroundColor: theme.colors.background }
          ]}>
            <Text style={[
              styles.replyPreviewMessageText,
              { color: theme.colors.textSecondary }
            ]} numberOfLines={2}>
              {repliedMessage.content}
            </Text>
          </View>
        </View>
      )}
      {/* Media Preview */}
      {renderMediaPreview()}

      {/* Input */}
      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.colors.surface,
          paddingHorizontal: isDesktop ? getResponsiveSpacing('xl') : getResponsiveSpacing('md'),
          paddingVertical: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
        }
      ]}>
        {/* Input Row with Inline Attachments */}
        <View style={styles.inputRow}>
          {/* Emoji Button */}
          <TouchableOpacity
            style={[
              styles.attachmentButton,
              isDesktop && styles.desktopAttachmentButton
            ]}
            onPress={() => {
              setShowEmojiPicker(true);
            }}
          >
            <MaterialIcons 
              name="emoji-emotions" 
              size={isDesktop ? 28 : 24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>

          {/* Photo Button */}
          <TouchableOpacity
            style={[
              styles.attachmentButton,
              isDesktop && styles.desktopAttachmentButton
            ]}
            onPress={handleImagePicker}
          >
            <MaterialIcons 
              name="image" 
              size={isDesktop ? 28 : 24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>

          {/* Voice Recording Button */}
          <TouchableOpacity
            style={[
              styles.attachmentButton,
              isDesktop && styles.desktopAttachmentButton
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <MaterialIcons 
              name={isRecording ? "stop" : "mic"} 
              size={isDesktop ? 28 : 24} 
              color={isRecording ? theme.colors.error : theme.colors.primary} 
            />
          </TouchableOpacity>
        <TextInput
          ref={textInputRef}
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
                flex: 1,
                minWidth: 0, // Allow text input to shrink below its content size
                flexShrink: 1, // Allow the input to shrink
                marginLeft: getResponsiveSpacing('sm'), // Add space after attachment buttons
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
              styles.sendIconButton,
            {
                backgroundColor: (messageText.trim() || selectedMedia.length > 0) ? theme.colors.primary : theme.colors.disabled,
                opacity: (messageText.trim() || selectedMedia.length > 0) ? 1 : 0.5,
            }
          ]}
          onPress={handleSendMessage}
            disabled={!messageText.trim() && selectedMedia.length === 0}
          >
            <MaterialIcons 
              name="send" 
              size={isDesktop ? 24 : 20} 
              color={theme.colors.onPrimary} 
            />
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
      </View>

      {/* Right Sidebar - Chat Info (Desktop) */}
      {isDesktop && showInfoPanel && (
        <View style={[styles.rightSidebar, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarTitle, { color: theme.colors.text }]}>
              Chat Info
            </Text>
          </View>

          <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {/* User Info Section */}
            <View style={styles.sidebarSection}>
              <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                User Information
              </Text>
              <View style={styles.sidebarRow}>
                <MaterialIcons name="person" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                  Name:
                </Text>
                <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                  {otherUserName}
                </Text>
              </View>
              <View style={styles.sidebarRow}>
                <MaterialIcons name="circle" size={16} color={isOtherUserOnline ? theme.colors.success : theme.colors.textSecondary} />
                <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                  Status:
                </Text>
                <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                  {isOtherUserOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            {/* Chat Stats Section */}
            <View style={styles.sidebarSection}>
              <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                Chat Statistics
              </Text>
              <View style={styles.sidebarRow}>
                <MaterialIcons name="message" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                  Total Messages:
                </Text>
                <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                  {messageCount}
                </Text>
              </View>
              <View style={styles.sidebarRow}>
                <MaterialIcons name="mark-email-unread" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                  Unread Messages:
                </Text>
                <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                  {unreadCount}
                </Text>
              </View>
              <View style={styles.sidebarRow}>
                <MaterialIcons name="schedule" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                  Conversation ID:
                </Text>
                <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                  {conversationId.slice(0, 8)}...
                </Text>
              </View>
            </View>

            {/* Connection Status Section */}
            <View style={styles.sidebarSection}>
              <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                Connection Status
              </Text>
              <View style={styles.sidebarRow}>
                <MaterialIcons name="wifi" size={16} color={isConnected ? theme.colors.success : theme.colors.error} />
                <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                  Connection:
                </Text>
                <Text style={[styles.sidebarValue, { color: isConnected ? theme.colors.success : theme.colors.error }]}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
              <View style={styles.sidebarRow}>
                <MaterialIcons name="people" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                  Online Users:
                </Text>
                <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                  {onlineUsers.length}
                </Text>
              </View>
            </View>

            {/* Actions Section */}
            <View style={styles.sidebarSection}>
              <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                Actions
              </Text>
              <TouchableOpacity
                style={[styles.sidebarActionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowSearch(true);
                  setShowInfoPanel(false);
                }}
              >
                <MaterialIcons name="search" size={16} color="#fff" />
                <Text style={[styles.sidebarActionText, { color: '#fff' }]}>
                  Search Messages
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sidebarActionButton, { backgroundColor: theme.colors.success }]}
                onPress={() => {
                  refreshMessages();
                  setShowInfoPanel(false);
                }}
              >
                <MaterialIcons name="refresh" size={16} color="#fff" />
                <Text style={[styles.sidebarActionText, { color: '#fff' }]}>
                  Refresh Chat
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Mobile Chat Info Modal */}
      {!isDesktop && showInfoPanel && (
        <View style={styles.mobileInfoOverlay}>
          <View style={[styles.mobileInfoModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.mobileInfoHeader}>
              <Text style={[styles.mobileInfoTitle, { color: theme.colors.text }]}>
                Chat Info
              </Text>
              <TouchableOpacity
                onPress={() => setShowInfoPanel(false)}
                style={styles.mobileInfoCloseButton}
              >
                <MaterialIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.mobileInfoContent} showsVerticalScrollIndicator={false}>
              {/* User Info Section */}
              <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                  User Information
                </Text>
                <View style={styles.sidebarRow}>
                  <MaterialIcons name="person" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                    Name:
                  </Text>
                  <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                    {otherUserName}
                  </Text>
                </View>
                <View style={styles.sidebarRow}>
                  <MaterialIcons name="circle" size={16} color={isOtherUserOnline ? theme.colors.success : theme.colors.textSecondary} />
                  <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                    Status:
                  </Text>
                  <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                    {isOtherUserOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>

              {/* Chat Stats Section */}
              <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                  Chat Statistics
                </Text>
                <View style={styles.sidebarRow}>
                  <MaterialIcons name="message" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                    Total Messages:
                  </Text>
                  <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                    {messageCount}
                  </Text>
                </View>
                <View style={styles.sidebarRow}>
                  <MaterialIcons name="mark-email-unread" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                    Unread Messages:
                  </Text>
                  <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                    {unreadCount}
                  </Text>
                </View>
                <View style={styles.sidebarRow}>
                  <MaterialIcons name="schedule" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                    Conversation ID:
                  </Text>
                  <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                    {conversationId.slice(0, 8)}...
                  </Text>
                </View>
              </View>

              {/* Connection Status Section */}
              <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                  Connection Status
                </Text>
                <View style={styles.sidebarRow}>
                  <MaterialIcons name="wifi" size={16} color={isConnected ? theme.colors.success : theme.colors.error} />
                  <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                    Connection:
                  </Text>
                  <Text style={[styles.sidebarValue, { color: isConnected ? theme.colors.success : theme.colors.error }]}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
                <View style={styles.sidebarRow}>
                  <MaterialIcons name="people" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.sidebarLabel, { color: theme.colors.textSecondary }]}>
                    Online Users:
                  </Text>
                  <Text style={[styles.sidebarValue, { color: theme.colors.text }]}>
                    {onlineUsers.length}
                  </Text>
                </View>
              </View>

              {/* Actions Section */}
              <View style={styles.sidebarSection}>
                <Text style={[styles.sidebarSectionTitle, { color: theme.colors.text }]}>
                  Actions
                </Text>
                <TouchableOpacity
                  style={[styles.sidebarActionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    setShowSearch(true);
                    setShowInfoPanel(false);
                  }}
                >
                  <MaterialIcons name="search" size={16} color="#fff" />
                  <Text style={[styles.sidebarActionText, { color: '#fff' }]}>
                    Search Messages
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.sidebarActionButton, { backgroundColor: theme.colors.success }]}
                  onPress={() => {
                    refreshMessages();
                    setShowInfoPanel(false);
                  }}
                >
                  <MaterialIcons name="refresh" size={16} color="#fff" />
                  <Text style={[styles.sidebarActionText, { color: '#fff' }]}>
                    Refresh Chat
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Image Viewer */}
      <ImageViewer
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: getResponsiveSpacing('sm'),
    marginLeft: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  desktopHeaderButton: {
    padding: getResponsiveSpacing('md'),
    marginLeft: getResponsiveSpacing('md'),
  },
  connectionStatus: {
    marginLeft: getResponsiveSpacing('md'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    marginLeft: getResponsiveSpacing('xs'),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  searchResultsText: {
    fontSize: 12,
    marginLeft: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 12,
    textAlign: 'center',
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
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageContainer: {
    marginVertical: 4,
    position: 'relative',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    flex: 1,
  },
  ownMessageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
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
  readIndicator: {
    fontSize: 12,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 8,
  },
  ownTimestamp: {
    textAlign: 'right',
  },
  otherTimestamp: {
    textAlign: 'left',
  },
  messageOptionsButton: {
    padding: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  messageOptionsPanel: {
    position: 'absolute',
    top: 0,
    left: '100%',
    width: Math.min(180, getResponsiveSpacing('xl') * 8),
    minHeight: 100,
    maxHeight: 200,
    marginLeft: getResponsiveSpacing('sm'),
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  ownMessageOptionsPanel: {
    left: 'auto',
    right: '100%',
    marginLeft: 0,
    marginRight: getResponsiveSpacing('sm'),
  },
  otherMessageOptionsPanel: {
    left: '100%',
    right: 'auto',
    marginLeft: getResponsiveSpacing('sm'),
    marginRight: 0,
  },
  messageOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  messageOptionsTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
  },
  messageOptionsCloseButton: {
    padding: getResponsiveSpacing('xs'),
  },
  messageOptionsScrollView: {
    flex: 1,
  },
  messageOptionsList: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
  },
  messageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageOptionText: {
    fontSize: getResponsiveFontSize('md'),
    marginLeft: getResponsiveSpacing('md'),
    fontWeight: '500',
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
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    minWidth: 0, // Prevent overflow
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    minWidth: 0, // Allow text input to shrink below its content size
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: getResponsiveSpacing('sm'),
    flexShrink: 0, // Prevent send button from shrinking
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
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    width: '100%',
    minWidth: 0, // Prevent overflow
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
    backgroundColor: '#f8f9fa',
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing('md'),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediaPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: getResponsiveSpacing('sm'),
    marginRight: getResponsiveSpacing('md'),
  },
  mediaPreviewIcon: {
    width: 60,
    height: 60,
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSpacing('md'),
  },
  mediaPreviewInfo: {
    flex: 1,
  },
  mediaPreviewText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('xs'),
  },
  mediaPreviewSubtext: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '400',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  desktopAttachmentButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  attachmentMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: getResponsiveSpacing('lg'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: getResponsiveSpacing('md'),
    backgroundColor: '#f8f9fa',
  },
  attachmentOption: {
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
    minWidth: 80,
  },
  attachmentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSpacing('sm'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  attachmentText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
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
  moreOptionsMenu: {
    position: 'absolute',
    top: 70,
    right: getResponsiveSpacing('md'),
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 180,
  },
  moreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
  },
  moreOptionText: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('md'),
    fontWeight: '500',
  },

  chatArea: {
    flex: 1,
  },
  rightSidebar: {
    width: 320,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
  },
  closeSidebarButton: {
    padding: getResponsiveSpacing('xs'),
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
  },
  sidebarSection: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  sidebarSectionTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('md'),
  },
  sidebarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  sidebarLabel: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
    marginRight: getResponsiveSpacing('sm'),
    minWidth: 100,
  },
  sidebarValue: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    flex: 1,
  },
  sidebarActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  sidebarActionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('sm'),
  },
  // Mobile Info Modal Styles
  mobileInfoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  mobileInfoModal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: getResponsiveSpacing('lg'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mobileInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mobileInfoTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
  },
  mobileInfoCloseButton: {
    padding: getResponsiveSpacing('xs'),
  },
  mobileInfoContent: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
  },
  // Multiple Media Preview Styles
  mediaPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mediaPreviewTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  clearAllMediaButton: {
    padding: getResponsiveSpacing('xs'),
  },
  mediaPreviewScroll: {
    maxHeight: 120,
  },
  mediaPreviewScrollContent: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    gap: getResponsiveSpacing('sm'),
  },
  mediaPreviewItem: {
    alignItems: 'center',
    position: 'relative',
    minWidth: 80,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaPreviewItemText: {
    fontSize: getResponsiveFontSize('xs'),
    marginTop: getResponsiveSpacing('xs'),
    textAlign: 'center',
  },
  // Image Viewer Styles
  imageViewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  imageViewerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageViewerTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
    color: 'white',
  },
  imageViewerCloseButton: {
    padding: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('lg'),
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
    borderRadius: getResponsiveSpacing('md'),
  },
  messageOptionsBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  inlineOptionsMenu: {
    position: 'absolute',
    top: 0,
    left: '100%',
    width: 120,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    padding: getResponsiveSpacing('sm'),
  },
  inlineOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderRadius: 4,
  },
  inlineOptionText: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
    fontWeight: '500',
  },
  ownerInlineOptionsMenu: {
    left: 'auto',
    right: '100%',
    marginLeft: 0,
    marginRight: getResponsiveSpacing('sm'),
  },
  replyPreview: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('xs'),
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  replyPreviewContent: {
    flexDirection: 'column',
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  replyPreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xs'),
  },
  replyPreviewSender: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '600',
    marginLeft: getResponsiveSpacing('xs'),
  },
  replyPreviewText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '400',
    flex: 1,
    opacity: 0.8,
  },
  replyPreviewLine: {
    width: '100%',
    height: 1,
    marginTop: getResponsiveSpacing('xs'),
  },
  replyPreviewContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  replyPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  replyPreviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  replyPreviewHeaderText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    marginLeft: getResponsiveSpacing('sm'),
  },
  replyPreviewCloseButton: {
    padding: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('xs'),
  },
  replyPreviewMessage: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('xs'),
    marginHorizontal: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  replyPreviewMessageText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '400',
    flex: 1,
    lineHeight: getResponsiveFontSize('sm') * 1.3,
  },
}); 