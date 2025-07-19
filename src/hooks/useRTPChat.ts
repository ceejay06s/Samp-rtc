import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import { MessagingService } from '../services/messaging';
import RTPChatService from '../services/rtpChatService';
import { Conversation, Message, MessageType } from '../types';

export interface UseRTPChatOptions {
  onMessageReceived?: (message: Message) => void;
  onTypingIndicator?: (isTyping: boolean, userId: string) => void;
  onMessageStatusChange?: (messageId: string, status: string) => void;
  onOnlineStatusChange?: (isOnline: boolean, lastSeen: Date) => void;
  onError?: (error: Error) => void;
}

export interface UseRTPChatReturn {
  // Messages
  messages: Message[];
  sendMessage: (content: string, messageType?: MessageType) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob, duration: number) => Promise<void>;
  sendLocation: (latitude: number, longitude: number, address?: string) => Promise<void>;
  
  // Conversation state
  conversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  
  // Real-time features
  isTyping: boolean;
  otherUserTyping: boolean;
  setTypingStatus: (isTyping: boolean) => void;
  
  // Message actions
  markAsRead: () => Promise<void>;
  addReaction: (messageId: string, reaction: string) => Promise<void>;
  getMessageReactions: (messageId: string) => Promise<any[]>;
  
  // Search and analytics
  searchMessages: (query: string) => Promise<Message[]>;
  
  // Loading states
  isSending: boolean;
  isRecording: boolean;
}

export function useRTPChat(
  conversationId: string,
  options: UseRTPChatOptions = {}
): UseRTPChatReturn {
  const { user } = useAuth();
  const rtpChatService = RTPChatService.getInstance();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageSubscriptions = useRef<Map<string, any>>(new Map());

  // Load conversation and messages
  const loadConversation = useCallback(async () => {
    if (!user?.id || !conversationId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get conversation details
      const conversations = await rtpChatService.getConversations(user.id);
      const currentConversation = conversations.find(c => c.id === conversationId);
      
      if (!currentConversation) {
        throw new Error('Conversation not found');
      }

      setConversation(currentConversation);

      // Get messages
      const messagesData = await rtpChatService.getMessages(conversationId);
      setMessages(messagesData);

      // Mark messages as read
      if ((currentConversation.unreadCount || 0) > 0) {
        await rtpChatService.markMessagesAsRead(conversationId, user.id);
      }

    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, conversationId]);

  // Set up real-time subscriptions
  const setupSubscriptions = useCallback(async () => {
    if (!conversationId || !user?.id) return;

    // Subscribe to typing indicators
    await rtpChatService.subscribeToTypingIndicators(conversationId, (typingIndicator) => {
      if (typingIndicator.userId !== user.id) {
        setOtherUserTyping(typingIndicator.isTyping);
        options.onTypingIndicator?.(typingIndicator.isTyping, typingIndicator.userId);
      }
    });

    // Subscribe to online status of other user
    if (conversation) {
      const otherUserId = conversation.otherProfile?.user_id;
      if (otherUserId) {
        await rtpChatService.subscribeToOnlineStatus(otherUserId, (status) => {
          options.onOnlineStatusChange?.(status.isOnline, status.lastSeen);
        });
      }
    }
  }, [conversationId, user?.id, conversation]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(async () => {
    await rtpChatService.cleanup();
  }, []);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Set up subscriptions when conversation is loaded
  useEffect(() => {
    if (conversation) {
      setupSubscriptions();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [conversation, setupSubscriptions, cleanupSubscriptions]);

  // Update online status on mount/unmount
  useEffect(() => {
    if (user?.id) {
      rtpChatService.updateOnlineStatus(true);
    }

    return () => {
      if (user?.id) {
        rtpChatService.updateOnlineStatus(false);
      }
    };
  }, [user?.id]);

  // Send message with typing indicator
  const sendMessage = useCallback(async (content: string, messageType: MessageType = MessageType.TEXT) => {
    if (!user?.id || !conversationId || !content.trim() || isSending) return;

    try {
      setIsSending(true);
      
      // Clear typing indicator
      setIsTyping(false);
      await rtpChatService.setTypingStatus(conversationId, false);

      // Send message
      const message = await rtpChatService.sendMessage({
        conversationId,
        content: content.trim(),
        messageType,
      });

      // Add to local state
      setMessages(prev => [...prev, message]);

      // Subscribe to message status updates
      await rtpChatService.subscribeToMessageStatus(message.id, (status) => {
        options.onMessageStatusChange?.(message.id, status.status);
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      options.onError?.(error as Error);
    } finally {
      setIsSending(false);
    }
  }, [user?.id, conversationId, isSending, options]);

  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!user?.id || !conversationId || isRecording) return;

    try {
      setIsRecording(true);
      
      const message = await rtpChatService.recordVoiceMessage(conversationId, audioBlob, duration);
      
      setMessages(prev => [...prev, message]);
      options.onMessageReceived?.(message);

    } catch (error) {
      console.error('Failed to send voice message:', error);
      Alert.alert('Error', 'Failed to send voice message. Please try again.');
      options.onError?.(error as Error);
    } finally {
      setIsRecording(false);
    }
  }, [user?.id, conversationId, isRecording, options]);

  // Send location
  const sendLocation = useCallback(async (latitude: number, longitude: number, address?: string) => {
    if (!user?.id || !conversationId) return;

    try {
      const message = await rtpChatService.shareLocation(conversationId, latitude, longitude, address);
      
      setMessages(prev => [...prev, message]);
      options.onMessageReceived?.(message);

    } catch (error) {
      console.error('Failed to send location:', error);
      Alert.alert('Error', 'Failed to send location. Please try again.');
      options.onError?.(error as Error);
    }
  }, [user?.id, conversationId, options]);

  // Typing indicator management
  const setTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!user?.id || !conversationId) return;

    setIsTyping(isTyping);
    await rtpChatService.setTypingStatus(conversationId, isTyping);

    // Clear typing indicator after delay
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(async () => {
        setIsTyping(false);
        await rtpChatService.setTypingStatus(conversationId, false);
      }, 5000) as any; // Clear after 5 seconds
    }
  }, [user?.id, conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user?.id || !conversationId) return;

    try {
      await rtpChatService.markMessagesAsRead(conversationId, user.id);
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.senderId !== user.id ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [user?.id, conversationId]);

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, reaction: string) => {
    if (!user?.id) return;

    try {
      await rtpChatService.addReaction(messageId, reaction);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }, [user?.id]);

  // Get message reactions
  const getMessageReactions = useCallback(async (messageId: string) => {
    try {
      return await rtpChatService.getMessageReactions(messageId);
    } catch (error) {
      console.error('Failed to get message reactions:', error);
      return [];
    }
  }, []);

  // Search messages
  const searchMessages = useCallback(async (query: string) => {
    if (!conversationId || !query.trim()) return [];

    try {
      return await rtpChatService.searchMessages(conversationId, query);
    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }, [conversationId]);

  // Handle incoming messages
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(msg => msg.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      options.onMessageReceived?.(message);

      // Mark as read if user is active
      if (message.senderId !== user?.id) {
        markAsRead();
      }
    };

    // Subscribe to new messages using the existing messaging service
    MessagingService.subscribeToMessages(conversationId, handleNewMessage);

    return () => {
      // Cleanup subscription
      // Note: This would need to be implemented in MessagingService
    };
  }, [conversationId, user?.id, options, markAsRead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  return {
    // Messages
    messages,
    sendMessage,
    sendVoiceMessage,
    sendLocation,
    
    // Conversation state
    conversation,
    isLoading,
    error,
    
    // Real-time features
    isTyping,
    otherUserTyping,
    setTypingStatus,
    
    // Message actions
    markAsRead,
    addReaction,
    getMessageReactions,
    
    // Search and analytics
    searchMessages,
    
    // Loading states
    isSending,
    isRecording,
  };
} 