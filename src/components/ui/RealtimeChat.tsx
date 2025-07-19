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
import { useAuth } from '../../../lib/AuthContext';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { MessageType } from '../../types';
import { useTheme } from '../../utils/themes';

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
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
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
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
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
    if (!messageText.trim()) return;
    
    const textToSend = messageText.trim();
    setMessageText('');
    setIsTyping(false);
    
    try {
      await sendMessage(textToSend, MessageType.TEXT);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message');
    }
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
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
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
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Typing Indicator */}
      <TypingIndicator isVisible={typingUsers.length > 0} />

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }
          ]}
          value={messageText}
          onChangeText={handleTextChange}
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
              backgroundColor: messageText.trim() ? theme.colors.primary : theme.colors.disabled
            }
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Text style={[styles.sendButtonText, { color: theme.colors.onPrimary }]}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
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
}); 