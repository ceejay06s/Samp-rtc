import { supabase } from '../../lib/supabase';
import {
    Conversation,
    MatchLevel,
    Message,
    MessageType
} from '../types';
import RTPService from './rtpService';

export interface RTPMessageData {
  conversationId: string;
  content: string;
  messageType: MessageType;
  metadata?: {
    audioDuration?: number;
    imageUrl?: string;
    audioUrl?: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    replyTo?: string;
    reactions?: string[];
  };
}

export interface RTPChatSession {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  lastTypingTime: Date;
  isOnline: boolean;
  lastSeen: Date;
}

export interface RTPMessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  recipientId: string;
}

export interface RTPTypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export class RTPChatService {
  private static instance: RTPChatService;
  private rtpService: RTPService;
  private typingSubscriptions: Map<string, any> = new Map();
  private messageStatusSubscriptions: Map<string, any> = new Map();
  private onlineStatusSubscriptions: Map<string, any> = new Map();

  private constructor() {
    this.rtpService = RTPService.getInstance();
  }

  static getInstance(): RTPChatService {
    if (!RTPChatService.instance) {
      RTPChatService.instance = new RTPChatService();
    }
    return RTPChatService.instance;
  }

  // Enhanced message sending with RTP features
  async sendMessage(data: RTPMessageData): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check match level restrictions
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

      // Create message with enhanced metadata
      const { data: messageData, error: messageError } = await supabase
        .from('rtp_messages')
        .insert({
          conversation_id: data.conversationId,
          sender_id: user.id,
          content: data.content,
          message_type: data.messageType,
          metadata: data.metadata || {},
          status: 'sent',
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

      // Create message status records for recipients
      await this.createMessageStatuses(messageData.id, data.conversationId, user.id);

      return messageData;
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get messages with enhanced RTP features
  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('rtp_messages')
        .select(`
          *,
          sender:profiles!rtp_messages_sender_id_fkey(*),
          statuses:rtp_message_statuses(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse(); // Return in chronological order
    } catch (error) {
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create message status records for all participants
  private async createMessageStatuses(messageId: string, conversationId: string, senderId: string): Promise<void> {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          match:matches!conversations_match_id_fkey(user1_id, user2_id)
        `)
        .eq('id', conversationId)
        .single();

      if (!conversation) return;

      const match = Array.isArray(conversation.match) ? conversation.match[0] : conversation.match;
      const recipients = [
        match.user1_id,
        match.user2_id
      ].filter(id => id !== senderId);

      const statusRecords = recipients.map(recipientId => ({
        message_id: messageId,
        recipient_id: recipientId,
        status: 'sent',
        timestamp: new Date().toISOString(),
      }));

      await supabase
        .from('rtp_message_statuses')
        .insert(statusRecords);
    } catch (error) {
      console.error('Failed to create message statuses:', error);
    }
  }

  // Mark messages as read with RTP status tracking
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Update message statuses
      await supabase
        .from('rtp_message_statuses')
        .update({
          status: 'read',
          timestamp: new Date().toISOString(),
        })
        .eq('recipient_id', userId)
        .eq('status', 'delivered');

      // Update conversation unread count
      await supabase
        .from('conversations')
        .update({
          unread_count: 0,
        })
        .eq('id', conversationId);
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Typing indicators
  async setTypingStatus(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('rtp_typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          is_typing: isTyping,
          timestamp: new Date().toISOString(),
        }, {
          onConflict: 'conversation_id,user_id'
        });
    } catch (error) {
      console.error('Failed to set typing status:', error);
    }
  }

  // Subscribe to typing indicators
  async subscribeToTypingIndicators(conversationId: string, callback: (typing: RTPTypingIndicator) => void): Promise<void> {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rtp_typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as RTPTypingIndicator);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rtp_typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as RTPTypingIndicator);
        }
      )
      .subscribe();

    this.typingSubscriptions.set(conversationId, channel);
  }

  // Subscribe to message status updates
  async subscribeToMessageStatus(messageId: string, callback: (status: RTPMessageStatus) => void): Promise<void> {
    const channel = supabase
      .channel(`message_status:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rtp_message_statuses',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          callback(payload.new as RTPMessageStatus);
        }
      )
      .subscribe();

    this.messageStatusSubscriptions.set(messageId, channel);
  }

  // Online status management
  async updateOnlineStatus(isOnline: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  }

  // Subscribe to online status changes
  async subscribeToOnlineStatus(userId: string, callback: (status: { isOnline: boolean; lastSeen: Date }) => void): Promise<void> {
    const channel = supabase
      .channel(`online_status:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const profile = payload.new as any;
          callback({
            isOnline: profile.is_online,
            lastSeen: new Date(profile.last_seen),
          });
        }
      )
      .subscribe();

    this.onlineStatusSubscriptions.set(userId, channel);
  }

  // Enhanced conversation management
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches!conversations_match_id_fkey(*),
          last_message:rtp_messages!conversations_last_message_id_fkey(*),
          typing_indicators:rtp_typing_indicators(*)
        `)
        .or(`match.user1_id.eq.${userId},match.user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithProfiles = await Promise.all((data || []).map(async conversation => {
        const match = conversation.match;
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
          ...conversation,
          otherProfile: otherProfile || null,
          isTyping: conversation.typing_indicators?.some(
            (ti: any) => ti.user_id !== userId && ti.is_typing
          ) || false,
        };
      }));

      return conversationsWithProfiles;
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Message reactions
  async addReaction(messageId: string, reaction: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('rtp_message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          reaction: reaction,
          timestamp: new Date().toISOString(),
        }, {
          onConflict: 'message_id,user_id,reaction'
        });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }

  // Get message reactions
  async getMessageReactions(messageId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('rtp_message_reactions')
        .select(`
          *,
          user:profiles!rtp_message_reactions_user_id_fkey(first_name, photos)
        `)
        .eq('message_id', messageId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get message reactions:', error);
      return [];
    }
  }

  // Voice message recording (Level 3+)
  async recordVoiceMessage(conversationId: string, audioBlob: Blob, duration: number): Promise<Message> {
    try {
      // Upload audio to Supabase Storage
      const fileName = `voice_messages/${conversationId}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      // Send message with audio metadata
      return await this.sendMessage({
        conversationId,
        content: 'Voice message',
        messageType: MessageType.VOICE,
        metadata: {
          audioDuration: duration,
          audioUrl: urlData.publicUrl,
        },
      });
    } catch (error) {
      throw new Error(`Failed to record voice message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Location sharing
  async shareLocation(conversationId: string, latitude: number, longitude: number, address?: string): Promise<Message> {
    try {
      return await this.sendMessage({
        conversationId,
        content: 'Location shared',
        messageType: MessageType.LOCATION,
        metadata: {
          location: {
            latitude,
            longitude,
            address,
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to share location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Message search
  async searchMessages(conversationId: string, query: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('rtp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .textSearch('content', query)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to search messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cleanup subscriptions
  async cleanup(): Promise<void> {
    // Unsubscribe from typing indicators
    for (const [conversationId] of this.typingSubscriptions) {
      const channel = this.typingSubscriptions.get(conversationId);
      if (channel) {
        await supabase.removeChannel(channel);
      }
    }

    // Unsubscribe from message status
    for (const [messageId] of this.messageStatusSubscriptions) {
      const channel = this.messageStatusSubscriptions.get(messageId);
      if (channel) {
        await supabase.removeChannel(channel);
      }
    }

    // Unsubscribe from online status
    for (const [userId] of this.onlineStatusSubscriptions) {
      const channel = this.onlineStatusSubscriptions.get(userId);
      if (channel) {
        await supabase.removeChannel(channel);
      }
    }

    // Clear maps
    this.typingSubscriptions.clear();
    this.messageStatusSubscriptions.clear();
    this.onlineStatusSubscriptions.clear();
  }
}

export default RTPChatService; 