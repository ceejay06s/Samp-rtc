import { supabase } from '../../lib/supabase';
import { Conversation, MatchLevel, Message, MessageType } from '../types';

export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType: MessageType;
}

// Enhanced error logging function
const logError = (context: string, error: any, additionalInfo?: any) => {
  const errorDetails = {
    context,
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    },
    additionalInfo,
  };
  
  console.error('🚨 CHAT ERROR:', JSON.stringify(errorDetails, null, 2));
  
  // Also log to a global error log if needed
  if ((global as any).chatErrorLog) {
    (global as any).chatErrorLog.push(errorDetails);
  } else {
    (global as any).chatErrorLog = [errorDetails];
  }
  
  return errorDetails;
};

export class MessagingService {
  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('🔍 Getting conversations for user:', userId);
      
      // Test 1: Check user authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logError('getConversations-auth', authError, { userId });
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!currentUser) {
        logError('getConversations-no-user', null, { userId });
        throw new Error('User not authenticated');
      }
      
      console.log('✅ User authenticated:', currentUser.id);
      
      // Test 2: Get matches for user (simplified query)
      console.log('🔍 Fetching matches for user...');
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, level, is_active')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('is_active', true);

      if (matchesError) {
        logError('getConversations-matches-query', matchesError, { 
          userId, 
          query: `or(user1_id.eq.${userId},user2_id.eq.${userId})` 
        });
        throw matchesError;
      }

      console.log('✅ Found matches:', matches?.length || 0);
      console.log('📊 Match details:', matches?.map(m => ({ 
        id: m.id, 
        user1: m.user1_id, 
        user2: m.user2_id, 
        level: m.level 
      })));

      if (!matches || matches.length === 0) {
        console.log('ℹ️ No matches found for user');
        return [];
      }

      // Test 3: Get conversations for these matches
      const matchIds = matches.map(match => match.id);
      console.log('🔍 Fetching conversations for match IDs:', matchIds);
      
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, match_id, last_message_id, unread_count, created_at, updated_at')
        .in('match_id', matchIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        logError('getConversations-conversations-query', conversationsError, { 
          userId, 
          matchIds,
          query: `in(match_id, [${matchIds.join(',')}])` 
        });
        throw conversationsError;
      }

      console.log('✅ Found conversations:', conversations?.length || 0);
      console.log('📊 Conversation details:', conversations?.map(c => ({ 
        id: c.id, 
        match_id: c.match_id, 
        unread_count: c.unread_count 
      })));

      // Test 4: Get profiles for all users in matches
      const allUserIds = new Set<string>();
      matches.forEach(match => {
        allUserIds.add(match.user1_id);
        allUserIds.add(match.user2_id);
      });
      
      console.log('🔍 Fetching profiles for users:', Array.from(allUserIds));
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, photos, bio, is_online, last_seen')
        .in('user_id', Array.from(allUserIds));

      if (profilesError) {
        logError('getConversations-profiles-query', profilesError, { 
          userId, 
          userIds: Array.from(allUserIds)
        });
        // Don't throw here, we can still return conversations without profiles
        console.warn('⚠️ Failed to fetch profiles:', profilesError.message);
      }

      console.log('✅ Found profiles:', profiles?.length || 0);

      // Test 5: Map conversations with match and profile data
      console.log('🔍 Mapping conversations with match data...');
      const mappedConversations = (conversations || []).map(conversation => {
        const match = matches.find(m => m.id === conversation.match_id);
        if (!match) {
          logError('getConversations-missing-match', null, { 
            conversationId: conversation.id, 
            matchId: conversation.match_id,
            availableMatches: matches.map(m => m.id)
          });
          console.warn('⚠️ No match found for conversation:', conversation.id);
          return null;
        }

        const isUser1 = match.user1_id === userId;
        const otherUserId = isUser1 ? match.user2_id : match.user1_id;
        const otherProfile = profiles?.find(p => p.user_id === otherUserId);

        return {
          ...conversation,
          otherProfile,
          match,
          // Add convenience aliases
          matchId: conversation.match_id,
          lastMessageId: conversation.last_message_id,
          unreadCount: conversation.unread_count,
          createdAt: new Date(conversation.created_at),
          updatedAt: new Date(conversation.updated_at),
          participants: [match.user1_id, match.user2_id],
        };
      }).filter(Boolean) as Conversation[];

      console.log('✅ Successfully mapped conversations:', mappedConversations.length);
      return mappedConversations;
      
    } catch (error) {
      const errorDetails = logError('getConversations-main', error, { userId });
      throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : 'Unknown error'}\n\nDebug Info: ${JSON.stringify(errorDetails, null, 2)}`);
    }
  }

  static async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    try {
      console.log('🔍 Getting messages for conversation:', conversationId);
      
      // Test 1: Validate conversation ID
      if (!conversationId) {
        logError('getMessages-no-conversation-id', null, { conversationId });
        throw new Error('Conversation ID is required');
      }
      
      // Test 2: Check if conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();
        
      if (convError) {
        logError('getMessages-conversation-check', convError, { conversationId });
        throw new Error(`Conversation not found: ${convError.message}`);
      }
      
      console.log('✅ Conversation exists:', conversation.id);
      
      // Test 3: Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (messagesError) {
        logError('getMessages-query', messagesError, { 
          conversationId, 
          limit,
          query: `eq(conversation_id, ${conversationId})` 
        });
        throw messagesError;
      }

      console.log('✅ Found messages:', messages?.length || 0);
      
      // Map database fields to convenience aliases
      const mappedMessages = (messages || []).map(message => ({
        ...message,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        messageType: message.message_type,
        timestamp: new Date(message.created_at),
        read: message.is_read,
      })).reverse(); // Return in chronological order
      
      console.log('✅ Successfully mapped messages');
      return mappedMessages;
      
    } catch (error) {
      const errorDetails = logError('getMessages-main', error, { conversationId, limit });
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}\n\nDebug Info: ${JSON.stringify(errorDetails, null, 2)}`);
    }
  }

  static async sendMessage(data: SendMessageData): Promise<Message> {
    try {
      console.log('🔍 Sending message:', { 
        conversationId: data.conversationId, 
        messageType: data.messageType,
        contentLength: data.content.length 
      });
      
      // Test 1: Validate input
      if (!data.conversationId || !data.content) {
        logError('sendMessage-invalid-input', null, { data });
        throw new Error('Conversation ID and content are required');
      }
      
      // Test 2: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        logError('sendMessage-user-auth', userError, { data });
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        logError('sendMessage-no-user', null, { data });
        throw new Error('User not authenticated');
      }
      
      console.log('✅ User authenticated:', user.id);
      
      // Test 3: Check conversation and match level
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          match_id,
          match:matches!conversations_match_id_fkey(id, level, user1_id, user2_id)
        `)
        .eq('id', data.conversationId)
        .single();

      if (convError) {
        logError('sendMessage-conversation-check', convError, { data });
        throw new Error(`Conversation not found: ${convError.message}`);
      }

      if (!conversation.match) {
        logError('sendMessage-no-match', null, { data, conversation });
        throw new Error('Match not found for conversation');
      }

      const match = Array.isArray(conversation.match) ? conversation.match[0] : conversation.match;
      
      console.log('✅ Conversation and match found:', { 
        conversationId: conversation.id, 
        matchId: match?.id,
        matchLevel: match?.level 
      });

      const matchLevel = match?.level;
      
      // Validate message type based on match level
      if (data.messageType === MessageType.PHOTO && matchLevel < MatchLevel.LEVEL_2) {
        logError('sendMessage-level-restriction', null, { 
          data, 
          requiredLevel: MatchLevel.LEVEL_2, 
          currentLevel: matchLevel 
        });
        throw new Error('Photo sharing requires match level 2');
      }
      
      if (data.messageType === MessageType.VOICE && matchLevel < MatchLevel.LEVEL_3) {
        logError('sendMessage-level-restriction', null, { 
          data, 
          requiredLevel: MatchLevel.LEVEL_3, 
          currentLevel: matchLevel 
        });
        throw new Error('Voice messages require match level 3');
      }

      // Test 4: Create message
      console.log('🔍 Creating message in database...');
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.conversationId,
          sender_id: user.id,
          content: data.content,
          message_type: data.messageType,
          is_read: false,
        })
        .select()
        .single();

      if (messageError) {
        logError('sendMessage-insert', messageError, { 
          data, 
          userId: user.id,
          insertData: {
            conversation_id: data.conversationId,
            sender_id: user.id,
            content: data.content,
            message_type: data.messageType,
            is_read: false,
          }
        });
        throw messageError;
      }

      console.log('✅ Message created:', messageData.id);

      // Test 5: Update conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message_id: messageData.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.conversationId);

      if (updateError) {
        logError('sendMessage-update-conversation', updateError, { 
          data, 
          messageId: messageData.id 
        });
        // Don't throw here, message was created successfully
        console.warn('⚠️ Failed to update conversation timestamp:', updateError.message);
      }

      // Return message with convenience aliases
      const result = {
        ...messageData,
        conversationId: messageData.conversation_id,
        senderId: messageData.sender_id,
        messageType: messageData.message_type,
        timestamp: new Date(messageData.created_at),
        read: messageData.is_read,
      };
      
      console.log('✅ Message sent successfully');
      return result;
      
    } catch (error) {
      const errorDetails = logError('sendMessage-main', error, { data });
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}\n\nDebug Info: ${JSON.stringify(errorDetails, null, 2)}`);
    }
  }

  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      // Update conversation unread count
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async createConversation(matchId: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          match_id: matchId,
          unread_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        matchId: data.match_id,
        lastMessageId: data.last_message_id,
        unreadCount: data.unread_count,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getOrCreateConversation(matchId: string, userId: string): Promise<Conversation> {
    try {
      // First, try to find an existing conversation for this match
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches!conversations_match_id_fkey(*),
          last_message:messages!conversations_last_message_id_fkey(*)
        `)
        .eq('match_id', matchId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw fetchError;
      }

      if (existingConversations) {
        // Map the existing conversation to the Conversation type
        const match = existingConversations.match;
        const isUser1 = match.user1_id === userId;
        const otherUserId = isUser1 ? match.user2_id : match.user1_id;
        
        // Fetch the other user's profile separately
        const { data: otherProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', otherUserId)
          .single();
          
        if (profileError) {
          console.error('Failed to fetch other user profile:', profileError);
        }

        return {
          ...existingConversations,
          otherProfile: otherProfile || null,
          // Add convenience aliases
          matchId: existingConversations.match_id,
          lastMessageId: existingConversations.last_message_id,
          unreadCount: existingConversations.unread_count,
          createdAt: new Date(existingConversations.created_at),
          updatedAt: new Date(existingConversations.updated_at),
          participants: [match.user1_id, match.user2_id],
        };
      }

      // If no existing conversation, create a new one
      const newConversation = await this.createConversation(matchId);

      // Fetch the newly created conversation with its full details for consistency
      const { data: createdConversationData, error: createdFetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches!conversations_match_id_fkey(*),
          last_message:messages!conversations_last_message_id_fkey(*)
        `)
        .eq('id', newConversation.id)
        .single();

      if (createdFetchError) throw createdFetchError;

      const match = createdConversationData.match;
      const isUser1 = match.user1_id === userId;
      const otherUserId = isUser1 ? match.user2_id : match.user1_id;
      
      // Fetch the other user's profile separately
      const { data: otherProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', otherUserId)
        .single();
        
      if (profileError) {
        console.error('Failed to fetch other user profile:', profileError);
      }

      return {
        ...createdConversationData,
        otherProfile: otherProfile || null,
        // Add convenience aliases
        matchId: createdConversationData.match_id,
        lastMessageId: createdConversationData.last_message_id,
        unreadCount: createdConversationData.unread_count,
        createdAt: new Date(createdConversationData.created_at),
        updatedAt: new Date(createdConversationData.updated_at),
        participants: [match.user1_id, match.user2_id],
      };

    } catch (error) {
      throw new Error(`Failed to get or create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async subscribeToMessages(conversationId: string, callback: (message: Message) => void): Promise<void> {
    supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as any;
          // Map database fields to convenience aliases
          const mappedMessage: Message = {
            ...message,
            conversationId: message.conversation_id,
            senderId: message.sender_id,
            messageType: message.message_type,
            timestamp: new Date(message.created_at),
            read: message.is_read,
          };
          callback(mappedMessage);
        }
      )
      .subscribe();
  }

  static async subscribeToConversations(userId: string, callback: (conversation: Conversation) => void): Promise<void> {
    supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const conversation = payload.new as any;
          // Map database fields to convenience aliases
          const mappedConversation: Conversation = {
            ...conversation,
            matchId: conversation.match_id,
            lastMessageId: conversation.last_message_id,
            unreadCount: conversation.unread_count,
            createdAt: new Date(conversation.created_at),
            updatedAt: new Date(conversation.updated_at),
          };
          callback(mappedConversation);
        }
      )
      .subscribe();
  }
} 