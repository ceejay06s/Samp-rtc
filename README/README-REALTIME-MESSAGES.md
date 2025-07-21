# Realtime Message Retrieval System

This document explains how to use the comprehensive realtime message retrieval system implemented in the dating app.

## Overview

The realtime message retrieval system provides:
- **Initial message loading** with pagination
- **Real-time message updates** via Supabase subscriptions
- **Message search** functionality
- **Typing indicators** and **online status**
- **Read receipts** and **message stats**
- **Enhanced filtering** and **pagination**

## Architecture

### Core Components

1. **RealtimeChatService** (`src/services/realtimeChat.ts`)
   - Handles all realtime message operations
   - Manages Supabase subscriptions
   - Provides message retrieval with advanced filtering

2. **useRealtimeChat Hook** (`src/hooks/useRealtimeChat.ts`)
   - React hook for managing realtime chat state
   - Provides pagination, search, and message stats
   - Handles realtime updates automatically

3. **RealtimeChat Component** (`src/components/ui/RealtimeChat.tsx`)
   - Basic realtime chat interface
   - Real-time message display and sending

4. **EnhancedRealtimeChat Component** (`src/components/ui/EnhancedRealtimeChat.tsx`)
   - Advanced chat interface with all features
   - Search, pagination, message stats, and more

## Basic Usage

### Simple Realtime Chat

```typescript
import { useRealtimeChat } from '../hooks/useRealtimeChat';

const MyChatComponent = () => {
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    typingUsers,
    onlineUsers,
    isConnected
  } = useRealtimeChat({
    conversationId: 'conv-123',
    enableTypingIndicators: true,
    enableOnlineStatus: true,
    autoMarkAsRead: true,
  });

  // Use the returned values in your component
  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
};
```

### Using the RealtimeChat Component

```typescript
import { RealtimeChat } from '../components/ui/RealtimeChat';

const ChatScreen = () => {
  return (
    <RealtimeChat
      conversationId="conv-123"
      otherUserName="John Doe"
      onBack={() => router.back()}
    />
  );
};
```

## Advanced Usage

### Enhanced Realtime Chat with All Features

```typescript
import { useRealtimeChat } from '../hooks/useRealtimeChat';

const EnhancedChatComponent = () => {
  const {
    // Basic features
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
    
    // Real-time features
    typingUsers,
    onlineUsers,
    isConnected,
    
    // Utilities
    refreshMessages,
    reconnect
  } = useRealtimeChat({
    conversationId: 'conv-123',
    enableTypingIndicators: true,
    enableOnlineStatus: true,
    enableReadReceipts: true,
    autoMarkAsRead: true,
    initialMessageLimit: 30,
    enablePagination: true,
    enableSearch: true,
  });

  // Handle pagination
  const handleLoadMore = async () => {
    if (hasMoreMessages && !isLoadingMore) {
      await loadMoreMessages();
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    const results = await searchMessages(query);
    console.log('Search results:', results);
  };

  return (
    <div>
      {/* Message stats */}
      <div>Total: {messageCount} • Unread: {unreadCount}</div>
      
      {/* Load more button */}
      {hasMoreMessages && (
        <button onClick={handleLoadMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}
      
      {/* Messages */}
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
};
```

### Using the EnhancedRealtimeChat Component

```typescript
import { EnhancedRealtimeChat } from '../components/ui/EnhancedRealtimeChat';

const AdvancedChatScreen = () => {
  return (
    <EnhancedRealtimeChat
      conversationId="conv-123"
      otherUserName="John Doe"
      onBack={() => router.back()}
    />
  );
};
```

## API Reference

### useRealtimeChat Hook Options

```typescript
interface UseRealtimeChatOptions {
  conversationId: string;
  enableTypingIndicators?: boolean;    // Default: false
  enableOnlineStatus?: boolean;        // Default: false
  enableReadReceipts?: boolean;        // Default: false
  autoMarkAsRead?: boolean;            // Default: false
  initialMessageLimit?: number;        // Default: 50
  enablePagination?: boolean;          // Default: false
  enableSearch?: boolean;              // Default: false
}
```

### useRealtimeChat Hook Return Values

```typescript
interface UseRealtimeChatReturn {
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
  readReceipts: Record<string, string[]>;
  
  // Connection status
  isConnected: boolean;
  reconnect: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  refreshMessages: () => Promise<void>;
}
```

### RealtimeChatService Methods

```typescript
class RealtimeChatService {
  // Get messages with advanced filtering
  async getMessages(
    conversationId: string, 
    options: {
      limit?: number;
      offset?: number;
      before?: string;        // Get messages before this timestamp
      after?: string;         // Get messages after this timestamp
      messageType?: MessageType;
      includeDeleted?: boolean;
    } = {}
  ): Promise<RealtimeMessage[]>

  // Get message count
  async getMessageCount(
    conversationId: string, 
    options: {
      messageType?: MessageType;
      includeDeleted?: boolean;
    } = {}
  ): Promise<number>

  // Search messages
  async searchMessages(
    conversationId: string, 
    searchTerm: string, 
    options: {
      limit?: number;
      offset?: number;
      messageType?: MessageType;
    } = {}
  ): Promise<RealtimeMessage[]>

  // Get unread count
  async getUnreadCount(conversationId: string, userId: string): Promise<number>

  // Subscribe to real-time updates
  async subscribeToMessages(
    conversationId: string, 
    onMessage: (message: RealtimeMessage) => void,
    onTyping?: (typing: TypingIndicator) => void,
    onOnlineStatus?: (status: OnlineStatus) => void
  ): Promise<void>

  // Send message
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    metadata?: any
  ): Promise<RealtimeMessage>
}
```

## Message Types

```typescript
enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  VIDEO = 'video',
  FILE = 'file',
  LOCATION = 'location'
}

interface RealtimeMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  created_at: string;
  
  // Convenience aliases
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  timestamp: Date;
  read: boolean;
  
  // Real-time specific fields
  metadata?: any;
}
```

## Features

### 1. Pagination

Load messages in chunks to improve performance:

```typescript
const { hasMoreMessages, loadMoreMessages, isLoadingMore } = useRealtimeChat({
  conversationId: 'conv-123',
  enablePagination: true,
  initialMessageLimit: 30,
});

// Load more messages when user scrolls to top
const handleLoadMore = async () => {
  if (hasMoreMessages && !isLoadingMore) {
    await loadMoreMessages();
  }
};
```

### 2. Message Search

Search through conversation messages:

```typescript
const { searchMessages, isSearching, searchResults } = useRealtimeChat({
  conversationId: 'conv-123',
  enableSearch: true,
});

const handleSearch = async (query: string) => {
  const results = await searchMessages(query);
  console.log('Found messages:', results);
};
```

### 3. Message Statistics

Get message counts and unread counts:

```typescript
const { messageCount, unreadCount } = useRealtimeChat({
  conversationId: 'conv-123',
});

console.log(`Total messages: ${messageCount}, Unread: ${unreadCount}`);
```

### 4. Real-time Updates

Messages are automatically updated in real-time:

```typescript
const { messages, isConnected } = useRealtimeChat({
  conversationId: 'conv-123',
});

// messages array automatically updates when new messages arrive
// isConnected shows connection status
```

### 5. Typing Indicators

Show when other users are typing:

```typescript
const { typingUsers, sendTypingIndicator } = useRealtimeChat({
  conversationId: 'conv-123',
  enableTypingIndicators: true,
});

// Send typing indicator when user starts typing
const handleTextChange = (text: string) => {
  if (text.length > 0) {
    sendTypingIndicator(true);
  }
};

// Show typing indicator
{typingUsers.length > 0 && <div>Someone is typing...</div>}
```

### 6. Online Status

Track user online status:

```typescript
const { onlineUsers, offlineUsers } = useRealtimeChat({
  conversationId: 'conv-123',
  enableOnlineStatus: true,
});

// Show online status
{onlineUsers.length > 0 && <div>User is online</div>}
```

## Database Schema

The system uses these Supabase tables:

### messages
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

### conversations
```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  last_message_id UUID REFERENCES messages(id),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Considerations

1. **Pagination**: Load messages in chunks (default: 50) to avoid loading too many messages at once
2. **Real-time Subscriptions**: Automatically managed and cleaned up when components unmount
3. **Message Deduplication**: Prevents duplicate messages in the UI
4. **Efficient Queries**: Uses indexed columns for fast message retrieval
5. **Connection Management**: Automatic reconnection and error handling

## Error Handling

The system includes comprehensive error handling:

```typescript
const { error, reconnect, clearError } = useRealtimeChat({
  conversationId: 'conv-123',
});

// Handle errors
if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={reconnect}>Reconnect</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}
```

## Best Practices

1. **Always enable pagination** for conversations with many messages
2. **Use search sparingly** as it can be resource-intensive
3. **Handle connection errors** gracefully with reconnect functionality
4. **Clean up subscriptions** when components unmount (handled automatically)
5. **Use appropriate message limits** based on your app's needs
6. **Implement proper loading states** for better UX

## Troubleshooting

### Common Issues

1. **Messages not loading**: Check if conversation ID is valid and user has access
2. **Real-time not working**: Verify Supabase Realtime is enabled for the messages table
3. **Search not working**: Ensure the enableSearch option is set to true
4. **Pagination issues**: Check if enablePagination is enabled and hasMoreMessages is true

### Debug Logging

The system includes comprehensive logging:

```typescript
// Enable debug logging in development
if (__DEV__) {
  console.log('Realtime chat debug info:', {
    messages,
    isConnected,
    error,
    messageCount,
    unreadCount
  });
}
```

## Examples

See the following files for complete examples:
- `app/chat/[id].tsx` - Chat screen implementation
- `src/components/ui/RealtimeChat.tsx` - Basic chat component
- `src/components/ui/EnhancedRealtimeChat.tsx` - Advanced chat component
- `src/hooks/useRealtimeChat.ts` - Hook implementation
- `src/services/realtimeChat.ts` - Service implementation 