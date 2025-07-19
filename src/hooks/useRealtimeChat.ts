import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { OnlineStatus, RealtimeChatService, RealtimeMessage, TypingIndicator } from '../services/realtimeChat';
import { MessageType } from '../types';

export interface UseRealtimeChatOptions {
  conversationId: string;
  enableTypingIndicators?: boolean;
  enableOnlineStatus?: boolean;
  enableReadReceipts?: boolean;
  autoMarkAsRead?: boolean;
  initialMessageLimit?: number;
  enablePagination?: boolean;
  enableSearch?: boolean;
}

export interface UseRealtimeChatReturn {
  // Messages
  messages: RealtimeMessage[];
  sendMessage: (content: string, messageType?: MessageType) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  isLoadingMore: boolean;
  
  // Search
  searchMessages: (query: string) => Promise<RealtimeMessage[]>;
  isSearching: boolean;
  searchResults: RealtimeMessage[];
  
  // Message stats
  messageCount: number;
  unreadCount: number;
  
  // Typing indicators
  typingUsers: string[];
  sendTypingIndicator: (isTyping: boolean) => Promise<void>;
  
  // Online status
  onlineUsers: string[];
  offlineUsers: string[];
  
  // Read receipts
  readReceipts: Record<string, string[]>; // messageId -> userIds who read it
  
  // Connection status
  isConnected: boolean;
  reconnect: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  refreshMessages: () => Promise<void>;
}

export const useRealtimeChat = (options: UseRealtimeChatOptions): UseRealtimeChatReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<string[]>([]);
  const [readReceipts, setReadReceipts] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Enhanced state for pagination and search
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RealtimeMessage[]>([]);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  
  const realtimeService = useRef(RealtimeChatService.getInstance());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const participantsRef = useRef<string[]>([]);

  // Initialize real-time chat
  useEffect(() => {
    if (!user?.id || !options.conversationId) return;

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get conversation participants
        participantsRef.current = await realtimeService.current.getConversationParticipants(options.conversationId);
        
        // Load initial messages with enhanced options
        const initialLimit = options.initialMessageLimit || 50;
        const existingMessages = await realtimeService.current.getMessages(options.conversationId, {
          limit: initialLimit,
          offset: 0
        });
        setMessages(existingMessages);
        
        // Set pagination state
        setHasMoreMessages(existingMessages.length >= initialLimit);
        if (existingMessages.length > 0) {
          setLastMessageTimestamp(existingMessages[0].created_at);
        }
        
        // Get message stats
        const [totalCount, unreadCount] = await Promise.all([
          realtimeService.current.getMessageCount(options.conversationId),
          realtimeService.current.getUnreadCount(options.conversationId, user.id)
        ]);
        setMessageCount(totalCount);
        setUnreadCount(unreadCount);
        
        // Get initial online status
        if (options.enableOnlineStatus) {
          const onlineStatus = await realtimeService.current.getOnlineStatus(participantsRef.current);
          updateOnlineStatus(onlineStatus);
        }

        // Subscribe to real-time updates
        await realtimeService.current.subscribeToMessages(
          options.conversationId,
          handleNewMessage,
          options.enableTypingIndicators ? handleTypingIndicator : undefined,
          options.enableOnlineStatus ? handleOnlineStatus : undefined
        );

        setIsConnected(true);
        console.log('✅ Real-time chat initialized for conversation:', options.conversationId);

      } catch (err) {
        console.error('❌ Failed to initialize real-time chat:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [user?.id, options.conversationId, options.initialMessageLimit]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!options.enablePagination || isLoadingMore || !hasMoreMessages || !lastMessageTimestamp) {
      return;
    }

    try {
      setIsLoadingMore(true);
      
      const moreMessages = await realtimeService.current.getMessages(options.conversationId, {
        limit: 20,
        before: lastMessageTimestamp
      });
      
      if (moreMessages.length > 0) {
        setMessages(prev => {
          const combined = [...moreMessages, ...prev];
          // Remove duplicates
          const unique = combined.filter((message, index, self) => 
            index === self.findIndex(m => m.id === message.id)
          );
          return unique;
        });
        
        setLastMessageTimestamp(moreMessages[0].created_at);
        setHasMoreMessages(moreMessages.length >= 20);
      } else {
        setHasMoreMessages(false);
      }
      
    } catch (err) {
      console.error('❌ Failed to load more messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [options.conversationId, options.enablePagination, isLoadingMore, hasMoreMessages, lastMessageTimestamp]);

  // Search messages
  const searchMessages = useCallback(async (query: string): Promise<RealtimeMessage[]> => {
    if (!options.enableSearch || !query.trim()) {
      setSearchResults([]);
      return [];
    }

    try {
      setIsSearching(true);
      
      const results = await realtimeService.current.searchMessages(options.conversationId, query.trim());
      setSearchResults(results);
      
      return results;
    } catch (err) {
      console.error('❌ Failed to search messages:', err);
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [options.conversationId, options.enableSearch]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    if (!user?.id || !options.conversationId) return;

    try {
      setError(null);
      
      const [newMessages, totalCount, unreadCount] = await Promise.all([
        realtimeService.current.getMessages(options.conversationId, {
          limit: options.initialMessageLimit || 50,
          offset: 0
        }),
        realtimeService.current.getMessageCount(options.conversationId),
        realtimeService.current.getUnreadCount(options.conversationId, user.id)
      ]);
      
      setMessages(newMessages);
      setMessageCount(totalCount);
      setUnreadCount(unreadCount);
      setHasMoreMessages(newMessages.length >= (options.initialMessageLimit || 50));
      
      if (newMessages.length > 0) {
        setLastMessageTimestamp(newMessages[0].created_at);
      }
      
      console.log('✅ Messages refreshed');
    } catch (err) {
      console.error('❌ Failed to refresh messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh messages');
    }
  }, [user?.id, options.conversationId, options.initialMessageLimit]);

  // Handle new messages
  const handleNewMessage = useCallback((message: RealtimeMessage) => {
    setMessages(prev => {
      // Check if message already exists
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      
      // Add new message
      const newMessages = [...prev, message];
      
      // Sort by timestamp
      return newMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    // Update message count
    setMessageCount(prev => prev + 1);
    
    // Update unread count if message is from other user
    if ((message.sender_id || message.senderId) !== user?.id) {
      setUnreadCount(prev => prev + 1);
    }

    // Auto-mark as read if enabled and message is from other user
    if (options.autoMarkAsRead && (message.sender_id || message.senderId) !== user?.id) {
      realtimeService.current.markMessageAsRead(message.id);
      // Update unread count after marking as read
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [user?.id, options.autoMarkAsRead]);

  // Handle typing indicators
  const handleTypingIndicator = useCallback((typing: TypingIndicator) => {
    if (typing.userId === user?.id) return; // Don't show own typing

    setTypingUsers(prev => {
      if (typing.isTyping) {
        return prev.includes(typing.userId) ? prev : [...prev, typing.userId];
      } else {
        return prev.filter(id => id !== typing.userId);
      }
    });
  }, [user?.id]);

  // Handle online status updates
  const handleOnlineStatus = useCallback((status: OnlineStatus) => {
    if (status.userId === user?.id) return; // Don't track own status

    setOnlineUsers(prev => {
      if (status.isOnline) {
        return prev.includes(status.userId) ? prev : [...prev, status.userId];
      } else {
        return prev.filter(id => id !== status.userId);
      }
    });

    setOfflineUsers(prev => {
      if (!status.isOnline) {
        return prev.includes(status.userId) ? prev : [...prev, status.userId];
      } else {
        return prev.filter(id => id !== status.userId);
      }
    });
  }, [user?.id]);

  // Update online status from initial load
  const updateOnlineStatus = useCallback((statuses: OnlineStatus[]) => {
    const online: string[] = [];
    const offline: string[] = [];

    statuses.forEach(status => {
      if (status.userId === user?.id) return; // Don't track own status
      
      if (status.isOnline) {
        online.push(status.userId);
      } else {
        offline.push(status.userId);
      }
    });

    setOnlineUsers(online);
    setOfflineUsers(offline);
  }, [user?.id]);

  // Send message
  const sendMessage = useCallback(async (content: string, messageType: MessageType = MessageType.TEXT) => {
    if (!content.trim() || !user?.id) return;

    try {
      setError(null);
      
      const message = await realtimeService.current.sendMessage(
        options.conversationId,
        content.trim(),
        messageType
      );

      // Stop typing indicator
      if (options.enableTypingIndicators) {
        await sendTypingIndicator(false);
      }

      console.log('✅ Message sent:', message.id);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [user?.id, options.conversationId, options.enableTypingIndicators]);

  // Send typing indicator with debouncing
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!options.enableTypingIndicators) return;

    try {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Send typing indicator
      await realtimeService.current.sendTypingIndicator(options.conversationId, isTyping);

      // Auto-stop typing indicator after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(async () => {
          await realtimeService.current.sendTypingIndicator(options.conversationId, false);
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Failed to send typing indicator:', err);
    }
  }, [options.conversationId, options.enableTypingIndicators]);

  // Reconnect to real-time chat
  const reconnect = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      await cleanup();
      await realtimeService.current.subscribeToMessages(
        options.conversationId,
        handleNewMessage,
        options.enableTypingIndicators ? handleTypingIndicator : undefined,
        options.enableOnlineStatus ? handleOnlineStatus : undefined
      );
      
      setIsConnected(true);
      console.log('✅ Reconnected to real-time chat');
    } catch (err) {
      console.error('❌ Failed to reconnect:', err);
      setError(err instanceof Error ? err.message : 'Failed to reconnect');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [options.conversationId, handleNewMessage, handleTypingIndicator, handleOnlineStatus, options.enableTypingIndicators, options.enableOnlineStatus]);

  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      await realtimeService.current.unsubscribe(options.conversationId);
      setIsConnected(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (err) {
      console.error('❌ Failed to cleanup:', err);
    }
  }, [options.conversationId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update online status when app becomes active/inactive
  useEffect(() => {
    const handleAppStateChange = (isActive: boolean) => {
      if (options.enableOnlineStatus) {
        realtimeService.current.updateOnlineStatus(isActive);
      }
    };

    // Set online when component mounts
    handleAppStateChange(true);

    // Set offline when component unmounts
    return () => {
      handleAppStateChange(false);
    };
  }, [options.enableOnlineStatus]);

  return {
    // Messages
    messages,
    sendMessage,
    isLoading,
    error,
    
    // Pagination
    hasMoreMessages,
    loadMoreMessages,
    isLoadingMore,

    // Search
    searchMessages,
    isSearching,
    searchResults,

    // Message stats
    messageCount,
    unreadCount,
    
    // Typing indicators
    typingUsers,
    sendTypingIndicator,
    
    // Online status
    onlineUsers,
    offlineUsers,
    
    // Read receipts
    readReceipts,
    
    // Connection status
    isConnected,
    reconnect,
    
    // Utilities
    clearError,
    refreshMessages,
  };
}; 