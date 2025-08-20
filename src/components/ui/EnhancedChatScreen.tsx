import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRTPChat } from '../../hooks/useRTPChat';
import { MatchLevel, MessageType } from '../../types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { EmojiGifPicker } from './EmojiGifPicker';

interface EnhancedChatScreenProps {
  conversationId: string;
  matchLevel: number;
  onBack?: () => void;
}

export const EnhancedChatScreen: React.FC<EnhancedChatScreenProps> = ({
  conversationId,
  matchLevel,
  onBack,
}) => {
  const theme = useTheme();
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'gif' | 'sticker', url: string } | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    sendMessage,
    sendVoiceMessage,
    sendLocation,
    conversation,
    isLoading,
    error,
    isTyping,
    otherUserTyping,
    setTypingStatus,
    markAsRead,
    addReaction,
    isSending,
    isRecording: isRTPRecording,
  } = useRTPChat(conversationId, {
    onMessageReceived: (message) => {
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onTypingIndicator: (isTyping, userId) => {
      console.log(`${userId} is ${isTyping ? 'typing' : 'not typing'}`);
    },
    onMessageStatusChange: (messageId, status) => {
      console.log(`Message ${messageId} status: ${status}`);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  // Handle typing indicator
  useEffect(() => {
    if (messageText.length > 0) {
      setTypingStatus(true);
    } else {
      setTypingStatus(false);
    }
  }, [messageText, setTypingStatus]);

  // Start voice recording
  const startRecording = async () => {
    if (matchLevel < MatchLevel.LEVEL_3) {
      Alert.alert(
        'Level 3 Required',
        'Voice messages require a Level 3 match. Keep chatting to unlock this feature!'
      );
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is required for voice messages.');
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

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000) as any;

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  // Stop voice recording
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
      
      if (uri) {
        // Convert to blob (simplified - in real app you'd need proper blob conversion)
        const response = await fetch(uri);
        const blob = await response.blob();
        
        await sendVoiceMessage(blob, recordingDuration);
      }

      setRecording(null);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  // Send location
  const handleSendLocation = () => {
    // In a real app, you'd get the current location
    Alert.alert(
      'Send Location',
      'Would you like to send your current location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // Mock location - replace with actual location service
            sendLocation(37.7749, -122.4194, 'San Francisco, CA');
          },
        },
      ]
    );
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedMedia || isSending) return;

    try {
      if (selectedMedia) {
        // Send media message
        await sendMessage(selectedMedia.url, selectedMedia.type === 'gif' ? MessageType.GIF : MessageType.STICKER);
      } else {
        // Send text message
        await sendMessage(messageText.trim());
      }
      setMessageText('');
      setSelectedMedia(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
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

  // Format recording duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render message item
  const renderMessage = ({ item: message }: { item: any }) => {
    const isMyMessage = message.senderId === conversation?.otherProfile?.user_id;
    const isVoiceMessage = message.messageType === MessageType.VOICE;
    const isLocationMessage = message.messageType === MessageType.LOCATION;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isMyMessage ? theme.colors.primary : theme.colors.surfaceVariant,
          }
        ]}>
          {isVoiceMessage ? (
            <VoiceMessagePlayer
              audioUrl={message.metadata?.audioUrl || ''}
              duration={message.metadata?.audioDuration || 0}
              isOwnMessage={isMyMessage}
              messageId={message.id}
              onPlay={() => console.log('Voice message started playing')}
              onPause={() => console.log('Voice message paused')}
              onEnd={() => console.log('Voice message finished')}
            />
          ) : isLocationMessage ? (
            <View style={styles.locationMessageContainer}>
              <MaterialIcons name="location-on" size={20} color={theme.colors.onPrimary} />
              <Text style={[styles.locationMessageText, { color: theme.colors.onPrimary }]}>
                Location Shared
              </Text>
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              { color: isMyMessage ? theme.colors.onPrimary : theme.colors.text }
            ]}>
              {message.content}
            </Text>
          )}
          
          <Text style={[
            styles.messageTime,
            { color: isMyMessage ? theme.colors.onPrimary : theme.colors.textSecondary }
          ]}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {conversation?.otherProfile?.first_name || 'Chat'}
          </Text>
          {otherUserTyping && (
            <Text style={[styles.typingIndicator, { color: theme.colors.textSecondary }]}>
              typing...
            </Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}>
        {/* Recording indicator */}
        {isRecording && (
          <View style={[styles.recordingIndicator, { backgroundColor: theme.colors.error }]}>
            <MaterialIcons name="mic" size={20} color="white" />
            <Text style={styles.recordingText}>
              Recording... {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}

        {renderMediaPreview()}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => setShowEmojiPicker(true)}
          >
            <MaterialIcons name="emoji-emotions" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />

          {/* Voice recording button */}
          {matchLevel >= MatchLevel.LEVEL_3 && (
            <TouchableOpacity
              style={[
                styles.voiceButton,
                { backgroundColor: isRecording ? theme.colors.error : theme.colors.primary }
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isRTPRecording}
            >
              <MaterialIcons 
                name={isRecording ? "stop" : "mic"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          )}

          {/* Location button */}
          <TouchableOpacity
            style={[styles.locationButton, { backgroundColor: theme.colors.secondary }]}
            onPress={handleSendLocation}
          >
            <MaterialIcons name="location-on" size={20} color="white" />
          </TouchableOpacity>

          {/* Send button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: (messageText.trim() || selectedMedia) && !isSending 
                  ? theme.colors.primary 
                  : theme.colors.disabled 
              }
            ]}
            onPress={handleSendMessage}
            disabled={(!messageText.trim() && !selectedMedia) || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="send" size={20} color="white" />
            )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  typingIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 8,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceMessageText: {
    marginLeft: 8,
    fontSize: 16,
  },
  locationMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationMessageText: {
    marginLeft: 8,
    fontSize: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  recordingText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    margin: 16,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
}); 