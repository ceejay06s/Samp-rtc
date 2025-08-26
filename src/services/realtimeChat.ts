import { config } from '../../lib/config';
import { supabase } from '../../lib/supabase';
import { Message, MessageType } from '../types';
import { AudioUploadService } from './audioUploadService';
import { EnhancedPhotoUploadService, PhotoType } from './enhancedPhotoUpload';

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: string;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
}

export interface RealtimeMessage extends Message {
  // Additional real-time specific fields
  isTyping?: boolean;
  isOnline?: boolean;
  readBy?: string[];
  metadata?: any;
}

export interface ImageUploadData {
  uri: string;
  width: number;
  height: number;
  type: string;
  base64?: string;
}

export class RealtimeChatService {
  private static instance: RealtimeChatService;
  private channels: Map<string, any> = new Map();
  private messageCallbacks: Map<string, (message: RealtimeMessage) => void> = new Map();
  private typingCallbacks: Map<string, (typing: TypingIndicator) => void> = new Map();
  private onlineCallbacks: Map<string, (status: OnlineStatus) => void> = new Map();
  private readReceiptCallbacks: Map<string, (receipt: ReadReceipt) => void> = new Map();

  static getInstance(): RealtimeChatService {
    if (!RealtimeChatService.instance) {
      RealtimeChatService.instance = new RealtimeChatService();
    }
    return RealtimeChatService.instance;
  }

  /**
   * Send message with image attachment using UUID-based filename
   */
  async sendMessageWithImage(
    conversationId: string,
    imageData: ImageUploadData,
    caption?: string,
    metadata?: any
  ): Promise<RealtimeMessage> {
    try {
      console.log('📤 Sending message with image using UUID filename');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate UUID for message ID first
      const messageId = EnhancedPhotoUploadService.generateMessageId();
      console.log('Generated message ID:', messageId);

      // Create organized path: media/conversations/conversation_id/user_id/message_id.filetype
      const organizedPath = EnhancedPhotoUploadService.createChatMediaPath(
        conversationId,
        user.id,
        messageId,
        imageData.type
      );

      // Upload image with UUID filename and organized path
      const uploadResult = await EnhancedPhotoUploadService.uploadPhotoWithMessageId(
        imageData,
        messageId,
        PhotoType.CHAT,
        organizedPath
      );

      if (!uploadResult.success) {
        throw new Error(`Image upload failed: ${uploadResult.error}`);
      }

      console.log('✅ Image uploaded successfully with UUID filename');

      // Create message with the same UUID as ID
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          id: messageId, // Use the generated UUID as message ID
          conversation_id: conversationId,
          sender_id: user.id,
          content: caption || '',
          message_type: MessageType.PHOTO,
          is_read: false,
          metadata: JSON.stringify({
            ...metadata,
            imageUrl: uploadResult.url,
            imagePath: uploadResult.path,
            imageBucket: uploadResult.bucket,
            imageWidth: imageData.width,
            imageHeight: imageData.height,
            imageType: imageData.type
          }),
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({
          last_message_id: messageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Send notification to the other user in the conversation
      await this.sendMessageNotification(conversationId, user.id, caption || '', MessageType.PHOTO);

      // Map and return the message
      const message = this.mapMessagePayload(messageData);
      console.log('✅ Message with image sent successfully:', message.id);
      return message;

    } catch (error) {
      console.error('❌ Failed to send message with image:', error);
      throw new Error(`Failed to send message with image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Subscribe to real-time messages for a conversation
  async subscribeToMessages(
    conversationId: string, 
    onMessage: (message: RealtimeMessage) => void,
    onTyping?: (typing: TypingIndicator) => void,
    onOnlineStatus?: (status: OnlineStatus) => void
  ): Promise<void> {
    try {
      console.log('🔗 Subscribing to real-time messages for conversation:', conversationId);

      // Store callbacks
      this.messageCallbacks.set(conversationId, onMessage);
      if (onTyping) this.typingCallbacks.set(conversationId, onTyping);
      if (onOnlineStatus) this.onlineCallbacks.set(conversationId, onOnlineStatus);

      // Create channel for this conversation
      const channel = supabase
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
            console.log('📨 New message received:', payload);
            const message = this.mapMessagePayload(payload.new);
            onMessage(message);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log('📝 Message updated:', payload);
            const message = this.mapMessagePayload(payload.new);
            onMessage(message);
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });

      this.channels.set(conversationId, channel);

      // Subscribe to typing indicators
      if (onTyping) {
        this.subscribeToTypingIndicators(conversationId, onTyping);
      }

      // Subscribe to online status (with error handling)
      if (onOnlineStatus) {
        try {
          await this.subscribeToOnlineStatus(conversationId, onOnlineStatus);
        } catch (error) {
          console.warn('⚠️ Online status tracking disabled due to Realtime configuration');
          // Continue without online status tracking
        }
      }

    } catch (error) {
      console.error('❌ Failed to subscribe to messages:', error);
      throw new Error(`Failed to subscribe to messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Subscribe to typing indicators
  private async subscribeToTypingIndicators(
    conversationId: string,
    onTyping: (typing: TypingIndicator) => void
  ): Promise<void> {
    try {
      const channel = supabase
        .channel(`typing:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rtp_typing_indicators',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            console.log('⌨️ Typing indicator:', payload);
            const typing: TypingIndicator = {
              userId: payload.new.user_id,
              conversationId: payload.new.conversation_id,
              isTyping: payload.new.is_typing,
              timestamp: payload.new.timestamp,
            };
            onTyping(typing);
          }
        )
        .subscribe();

      this.channels.set(`typing:${conversationId}`, channel);
    } catch (error) {
      console.error('❌ Failed to subscribe to typing indicators:', error);
    }
  }

  // Subscribe to online status
  private async subscribeToOnlineStatus(
    conversationId: string,
    onOnlineStatus: (status: OnlineStatus) => void
  ): Promise<void> {
    try {
      const channel = supabase
        .channel(`online:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            console.log('🟢 Online status update:', payload);
            const status: OnlineStatus = {
              userId: payload.new.user_id,
              isOnline: payload.new.is_online,
              lastSeen: payload.new.last_seen,
            };
            onOnlineStatus(status);
          }
        )
        .subscribe((status) => {
          console.log('📡 Online status subscription status:', status);
          if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Online status subscription failed - Realtime may not be enabled for profiles table');
          }
        });

      this.channels.set(`online:${conversationId}`, channel);
    } catch (error) {
      console.error('❌ Failed to subscribe to online status:', error);
      console.warn('⚠️ Online status tracking disabled - Realtime not enabled for profiles table');
    }
  }

  // Send a real-time message
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    metadata?: any
  ): Promise<RealtimeMessage> {
    try {
      console.log('📤 Sending real-time message:', { conversationId, content, messageType });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          is_read: false,
          metadata: metadata ? JSON.stringify(metadata) : null,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({
          last_message_id: messageData.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Send notification to the other user in the conversation
      await this.sendMessageNotification(conversationId, user.id, content, messageType);

      // Map and return the message
      const message = this.mapMessagePayload(messageData);
      console.log('✅ Message sent successfully:', message.id);
      return message;

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Send notification for new message
  private async sendMessageNotification(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: MessageType
  ): Promise<void> {
    try {
      // Get conversation and match information
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          match:matches!conversations_match_id_fkey(id, user1_id, user2_id)
        `)
        .eq('id', conversationId)
        .single();

      if (convError || !conversation?.match) {
        console.warn('⚠️ Could not get conversation for notification:', convError);
        return;
      }

      const match = Array.isArray(conversation.match) ? conversation.match[0] : conversation.match;
      
      // Determine recipient (the other user in the match)
      const recipientId = match.user1_id === senderId ? match.user2_id : match.user1_id;
      
      // Get sender's profile
      const { data: senderProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', senderId)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not get sender profile for notification:', profileError);
        return;
      }

      // Prepare notification content
      let notificationBody = '';
      switch (messageType) {
        case MessageType.TEXT:
          notificationBody = `${senderProfile?.first_name || 'Someone'}: ${content.length > 50 ? content.substring(0, 47) + '...' : content}`;
          break;
        case MessageType.PHOTO:
          notificationBody = `${senderProfile?.first_name || 'Someone'} sent you a photo`;
          break;
        case MessageType.VOICE:
          notificationBody = `${senderProfile?.first_name || 'Someone'} sent you a voice message`;
          break;
        case MessageType.GIF:
          notificationBody = `${senderProfile?.first_name || 'Someone'} sent you a GIF`;
          break;
        case MessageType.STICKER:
          notificationBody = `${senderProfile?.first_name || 'Someone'} sent you a sticker`;
          break;
        default:
          notificationBody = `${senderProfile?.first_name || 'Someone'} sent you a message`;
      }

      // Check if recipient has notifications enabled
      const { data: preferences, error: prefError } = await supabase
        .from('notification_preferences')
        .select('message_notifications, push_enabled')
        .eq('user_id', recipientId)
        .single();

      if (prefError || !preferences?.message_notifications || !preferences?.push_enabled) {
        console.log('ℹ️ Recipient has notifications disabled or preferences not found');
        return;
      }

      // Create notification record
      const { error: notifError } = await supabase
        .from('notification_history')
        .insert({
          user_id: recipientId,
          title: 'New Message',
          body: notificationBody,
          data: {
            type: 'message',
            conversationId,
            senderId,
            senderName: senderProfile?.first_name || 'Unknown',
            messageType,
            timestamp: new Date().toISOString()
          },
          notification_type: 'message',
          status: 'sent'
        });

      if (notifError) {
        console.warn('⚠️ Could not create notification record:', notifError);
        return;
      }

      // Send push notification via edge function
      try {
        console.log('📤 Attempting to send push notification to user:', recipientId);
        
        const response = await fetch(
          `${config.supabase.url}/functions/v1/send-push-notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.supabase.anonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userIds: [recipientId],
              title: 'New Message',
              body: notificationBody,
              data: {
                type: 'message',
                conversationId,
                senderId,
                senderName: senderProfile?.first_name || 'Unknown',
                messageType,
                timestamp: new Date().toISOString()
              },
              notificationType: 'message',
            }),
          }
        );

        console.log('📡 Push notification response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.warn('⚠️ Push notification failed:', response.status, errorText);
        } else {
          const result = await response.json();
          console.log('✅ Push notification sent successfully:', result);
        }
      } catch (pushError) {
        console.error('❌ Error sending push notification:', pushError);
      }

    } catch (error) {
      console.error('❌ Error sending message notification:', error);
      // Don't throw here - notification failure shouldn't break message sending
    }
  }

  // Send typing indicator
  async sendTypingIndicator(
    conversationId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert typing indicator
      await supabase
        .from('rtp_typing_indicators')
        .upsert({
          user_id: user.id,
          conversation_id: conversationId,
          is_typing: isTyping,
          timestamp: new Date().toISOString(),
        }, {
          onConflict: 'conversation_id,user_id'
        });

      console.log('⌨️ Typing indicator sent:', { isTyping, conversationId });
    } catch (error) {
      console.error('❌ Failed to send typing indicator:', error);
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update message read status
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .neq('sender_id', user.id);

      // Add read receipt
      await supabase
        .from('rtp_delivery_receipts')
        .insert({
          message_id: messageId,
          user_id: user.id,
          read_at: new Date().toISOString(),
        });

      console.log('✅ Message marked as read:', messageId);
    } catch (error) {
      console.error('❌ Failed to mark message as read:', error);
    }
  }

  // Update online status
  async updateOnlineStatus(isOnline: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: isOnline ? null : new Date().toISOString(),
        })
        .eq('user_id', user.id);

      console.log('🟢 Online status updated:', isOnline);
    } catch (error) {
      console.error('❌ Failed to update online status:', error);
    }
  }

  // Unsubscribe from all channels
  async unsubscribe(conversationId: string): Promise<void> {
    try {
      console.log('🔌 Unsubscribing from conversation:', conversationId);

      // Remove callbacks
      this.messageCallbacks.delete(conversationId);
      this.typingCallbacks.delete(conversationId);
      this.onlineCallbacks.delete(conversationId);

      // Unsubscribe from channels
      const messageChannel = this.channels.get(conversationId);
      if (messageChannel) {
        await supabase.removeChannel(messageChannel);
        this.channels.delete(conversationId);
      }

      const typingChannel = this.channels.get(`typing:${conversationId}`);
      if (typingChannel) {
        await supabase.removeChannel(typingChannel);
        this.channels.delete(`typing:${conversationId}`);
      }

      const onlineChannel = this.channels.get(`online:${conversationId}`);
      if (onlineChannel) {
        await supabase.removeChannel(onlineChannel);
        this.channels.delete(`online:${conversationId}`);
      }

      console.log('✅ Unsubscribed successfully');
    } catch (error) {
      console.error('❌ Failed to unsubscribe:', error);
    }
  }

  // Unsubscribe from all conversations
  async unsubscribeAll(): Promise<void> {
    try {
      console.log('🔌 Unsubscribing from all conversations');
      
      const conversationIds = Array.from(this.channels.keys());
      for (const conversationId of conversationIds) {
        await this.unsubscribe(conversationId);
      }

      // Clear all callbacks
      this.messageCallbacks.clear();
      this.typingCallbacks.clear();
      this.onlineCallbacks.clear();
      this.readReceiptCallbacks.clear();

      console.log('✅ Unsubscribed from all conversations');
    } catch (error) {
      console.error('❌ Failed to unsubscribe from all:', error);
    }
  }

  // Map database payload to RealtimeMessage
  private mapMessagePayload(payload: any): RealtimeMessage {
    return {
      id: payload.id,
      conversation_id: payload.conversation_id,
      sender_id: payload.sender_id,
      content: payload.content,
      message_type: payload.message_type,
      is_read: payload.is_read,
      created_at: payload.created_at,
      // Add convenience aliases
      conversationId: payload.conversation_id,
      senderId: payload.sender_id,
      messageType: payload.message_type,
      timestamp: new Date(payload.created_at),
      read: payload.is_read,
      // Real-time specific fields - safely parse metadata
      metadata: this.safeParseMetadata(payload.metadata),
    };
  }

  // Helper method to safely parse metadata
  private safeParseMetadata(metadata: any): any {
    // Handle null, undefined, or empty values
    if (!metadata || metadata === null || metadata === undefined) {
      return undefined;
    }

    // If metadata is already an object (and not null), return it
    if (typeof metadata === 'object' && metadata !== null) {
      // Validate that it's a plain object, not an array or other object type
      if (Array.isArray(metadata)) {
        console.warn('Metadata is an array, expected object:', metadata);
        return undefined;
      }
      return metadata;
    }

    // If metadata is a string, try to parse it as JSON
    if (typeof metadata === 'string') {
      // Handle empty string
      if (metadata.trim() === '') {
        return undefined;
      }
      
      try {
        const parsed = JSON.parse(metadata);
        // Ensure parsed result is an object (not array, string, number, etc.)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return parsed;
        } else {
          console.warn('Parsed metadata is not an object:', parsed);
          return undefined;
        }
      } catch (error) {
        console.warn('Failed to parse metadata as JSON:', metadata, error);
        return undefined;
      }
    }

    // For any other type (number, boolean, etc.), return undefined
    console.warn('Metadata is not a string or object:', typeof metadata, metadata);
    return undefined;
  }

  // Get messages for a conversation with enhanced pagination and filtering
  async getMessages(
    conversationId: string, 
    options: {
      limit?: number;
      offset?: number;
      before?: string; // Get messages before this timestamp
      after?: string;  // Get messages after this timestamp
      messageType?: MessageType;
      includeDeleted?: boolean;
    } = {}
  ): Promise<RealtimeMessage[]> {
    try {
      console.log('🔍 Getting messages for conversation:', conversationId, 'with options:', options);
      
      const {
        limit = 50,
        offset = 0,
        before,
        after,
        messageType,
        includeDeleted = false
      } = options;

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Apply filters
      if (before) {
        query = query.lt('created_at', before);
      }
      
      if (after) {
        query = query.gt('created_at', after);
      }
      
      if (messageType) {
        query = query.eq('message_type', messageType);
      }
      
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Database error getting messages:', error);
        throw error;
      }

      const messages = (data || []).map(message => this.mapMessagePayload(message));
      console.log('✅ Retrieved messages:', messages.length);
      
      return messages;
    } catch (error) {
      console.error('❌ Failed to get messages:', error);
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get message count for a conversation
  async getMessageCount(conversationId: string, options: {
    messageType?: MessageType;
    includeDeleted?: boolean;
  } = {}): Promise<number> {
    try {
      const { messageType, includeDeleted = false } = options;
      
      let query = supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversationId);
      
      if (messageType) {
        query = query.eq('message_type', messageType);
      }
      
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      const { count, error } = await query;

      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('❌ Failed to get message count:', error);
      return 0;
    }
  }

  // Search messages in a conversation
  async searchMessages(
    conversationId: string, 
    searchTerm: string, 
    options: {
      limit?: number;
      offset?: number;
      messageType?: MessageType;
    } = {}
  ): Promise<RealtimeMessage[]> {
    try {
      console.log('🔍 Searching messages in conversation:', conversationId, 'for:', searchTerm);
      
      const { limit = 20, offset = 0, messageType } = options;

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .ilike('content', `%${searchTerm}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (messageType) {
        query = query.eq('message_type', messageType);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      const messages = (data || []).map(message => this.mapMessagePayload(message));
      console.log('✅ Found messages:', messages.length);
      
      return messages;
    } catch (error) {
      console.error('❌ Failed to search messages:', error);
      return [];
    }
  }

  // Get unread message count for a conversation
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)
        .is('deleted_at', null);

      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  // Get conversation participants
  async getConversationParticipants(conversationId: string): Promise<string[]> {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('match_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) return [];

      const { data: match } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', conversation.match_id)
        .single();

      if (!match) return [];

      return [match.user1_id, match.user2_id];
    } catch (error) {
      console.error('❌ Failed to get participants:', error);
      return [];
    }
  }

  // Get online status for users
  async getOnlineStatus(userIds: string[]): Promise<OnlineStatus[]> {
    try {
      // Try different column names for the user reference
      let profiles: any[] = [];
      let error: any = null;

      // Try with 'id' column first (most common)
      const { data: profilesById, error: errorById } = await supabase
        .from('profiles')
        .select('id, is_online, last_seen')
        .in('id', userIds);

      if (!errorById && profilesById) {
        profiles = profilesById;
        console.log('🔍 Using "id" column for user reference');
      } else {
        // Try with 'user_id' column
        const { data: profilesByUserId, error: errorByUserId } = await supabase
          .from('profiles')
          .select('user_id, is_online, last_seen')
          .in('user_id', userIds);

        if (!errorByUserId && profilesByUserId) {
          profiles = profilesByUserId;
          console.log('🔍 Using "user_id" column for user reference');
        } else {
          // Try with 'auth_user_id' column
          const { data: profilesByAuthUserId, error: errorByAuthUserId } = await supabase
            .from('profiles')
            .select('auth_user_id, is_online, last_seen')
            .in('auth_user_id', userIds);

          if (!errorByAuthUserId && profilesByAuthUserId) {
            profiles = profilesByAuthUserId;
            console.log('🔍 Using "auth_user_id" column for user reference');
          } else {
            console.error('❌ Could not find valid user column in profiles table');
            return [];
          }
        }
      }

      return profiles.map(profile => ({
        userId: profile.id || profile.user_id || profile.auth_user_id,
        isOnline: profile.is_online || false,
        lastSeen: profile.last_seen,
      }));
    } catch (error) {
      console.error('❌ Failed to get online status:', error);
      return [];
    }
  }

  /**
   * Send voice message with audio upload via Edge Function
   */
  async sendVoiceMessage(
    conversationId: string,
    audioUri: string,
    duration: number,
    metadata?: any
  ): Promise<RealtimeMessage> {
    try {
      console.log('🎤 Sending voice message via Edge Function');

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Authentication error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!user) {
        console.error('❌ No authenticated user found');
        throw new Error('User not authenticated');
      }

      console.log('✅ User authenticated:', user.id);

      // Convert audio URI to blob
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();

      console.log('✅ Audio converted to blob, size:', audioBlob.size, 'bytes');

      // Use AudioUploadService to upload via Edge Function
      const audioUploadService = AudioUploadService.getInstance();
      
      const uploadResult = await audioUploadService.uploadAudioViaEdgeFunction({
        audioBlob,
        conversationId,
        duration,
        metadata
      });

      if (!uploadResult.success) {
        throw new Error(`Audio upload failed: ${uploadResult.error}`);
      }

      console.log('✅ Audio uploaded successfully via Edge Function');

      // If the Edge Function created the message, we're done
      if (uploadResult.messageId) {
        // Fetch the created message to return it
        const { data: messageData, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', uploadResult.messageId)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch created message: ${fetchError.message}`);
        }

        console.log('✅ Voice message retrieved:', messageData.id);

        return {
          id: messageData.id,
          conversation_id: messageData.conversation_id,
          sender_id: messageData.sender_id,
          content: messageData.content,
          message_type: messageData.message_type,
          created_at: messageData.created_at,
          updated_at: messageData.updated_at,
          is_read: messageData.is_read,
          metadata: messageData.metadata,
          deleted_at: messageData.deleted_at
        } as RealtimeMessage;
      }

      // Fallback: Create message manually if Edge Function didn't create it
      console.log('⚠️ Edge Function didn\'t create message, creating manually...');
      
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: 'Voice message',
          message_type: MessageType.VOICE,
          metadata: {
            audioUrl: uploadResult.audioUrl,
            audioDuration: duration,
            uploadedVia: 'edge-function-fallback',
            ...metadata
          }
        })
        .select()
        .single();

      if (messageError) {
        console.error('❌ Failed to create voice message:', messageError);
        throw new Error(`Failed to create voice message: ${messageError.message}`);
      }

      console.log('✅ Voice message created successfully (fallback):', messageData.id);

      // Return the created message
      return {
        id: messageData.id,
        conversation_id: messageData.conversation_id,
        sender_id: messageData.sender_id,
        content: messageData.content,
        message_type: messageData.message_type,
        created_at: messageData.created_at,
        updated_at: messageData.updated_at,
        is_read: messageData.is_read,
        metadata: messageData.metadata,
        deleted_at: messageData.deleted_at
      } as RealtimeMessage;

    } catch (error) {
      console.error('❌ Failed to send voice message:', error);
      throw new Error(`Failed to send voice message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a message (soft delete by setting deleted_at timestamp)
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting message:', messageId, 'for user:', userId);

      // Get current user to verify ownership
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verify the message belongs to the user
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, deleted_at')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch message for deletion:', fetchError);
        throw new Error(`Failed to fetch message: ${fetchError.message}`);
      }

      if (!messageData) {
        throw new Error('Message not found');
      }

      if (messageData.sender_id !== user.id) {
        throw new Error('You can only delete your own messages');
      }

      if (messageData.deleted_at) {
        console.log('⚠️ Message already deleted');
        return true; // Already deleted
      }

      // Soft delete the message by setting deleted_at timestamp
      const { error: deleteError } = await supabase
        .from('messages')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (deleteError) {
        console.error('❌ Failed to delete message:', deleteError);
        throw new Error(`Failed to delete message: ${deleteError.message}`);
      }

      console.log('✅ Message deleted successfully:', messageId);

      // Notify real-time subscribers about the deletion
      this.notifyMessageDeleted(messageId);

      return true;

    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      throw new Error(`Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Notify subscribers about message deletion
   */
  private notifyMessageDeleted(messageId: string): void {
    const callback = this.messageCallbacks.get('deletion');
    if (callback) {
      callback({
        id: messageId,
        conversation_id: '',
        sender_id: '',
        content: '',
        message_type: MessageType.TEXT,
        created_at: '',
        updated_at: '',
        is_read: false,
        deleted_at: new Date().toISOString()
      } as RealtimeMessage);
    }
  }
} 