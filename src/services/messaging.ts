import { supabase } from '../../lib/supabase';
import { Conversation, MatchLevel, Message, MessageType } from '../types';

export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType: MessageType;
}

export class MessagingService {
  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches!conversations_match_id_fkey(
            *,
            user1_profile:profiles!matches_user1_id_fkey(*),
            user2_profile:profiles!matches_user2_id_fkey(*)
          ),
          last_message:messages!conversations_last_message_id_fkey(*)
        `)
        .or(`match.user1_id.eq.${userId},match.user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(conversation => {
        const match = conversation.match;
        const isUser1 = match.user1_id === userId;
        const otherProfile = isUser1 ? match.user2_profile : match.user1_profile;
        
        return {
          ...conversation,
          otherProfile,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse(); // Return in chronological order
    } catch (error) {
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async sendMessage(data: SendMessageData): Promise<Message> {
    try {
      // Check if user can send this type of message based on match level
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches!conversations_match_id_fkey(level)
        `)
        .eq('id', data.conversationId)
        .single();

      if (!conversation) throw new Error('Conversation not found');

      const matchLevel = conversation.match.level;
      
      // Validate message type based on match level
      if (data.messageType === MessageType.PHOTO && matchLevel < MatchLevel.LEVEL_2) {
        throw new Error('Photo sharing requires match level 2');
      }
      
      if (data.messageType === MessageType.VOICE && matchLevel < MatchLevel.LEVEL_3) {
        throw new Error('Voice messages require match level 3');
      }

      // Create message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.conversationId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          content: data.content,
          message_type: data.messageType,
          is_read: false,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation's last message and timestamp
      await supabase
        .from('conversations')
        .update({
          last_message_id: messageData.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.conversationId);

      return messageData;
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      return data;
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          callback(payload.new as Message);
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
          callback(payload.new as Conversation);
        }
      )
      .subscribe();
  }
} 