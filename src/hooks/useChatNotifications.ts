import { useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { hybridNotificationService } from '../services/notificationService';
import { supabase } from '../../lib/supabase';

export const useChatNotifications = (conversationId?: string) => {
  const { user } = useAuth();

  // Send notification for new message
  const sendNewMessageNotification = useCallback(async (
    recipientId: string,
    message: string,
    senderName: string
  ) => {
    if (!user || recipientId === user.id) return false;

    try {
      // Check if recipient has message notifications enabled
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('message_notifications, push_enabled')
        .eq('user_id', recipientId)
        .single();

      if (!preferences?.message_notifications || !preferences?.push_enabled) {
        return false;
      }

      // Send notification
      return await hybridNotificationService.sendNewMessageNotification(
        user.id,
        `${senderName}: ${message}`,
        conversationId || 'unknown'
      );
    } catch (error) {
      console.error('Error sending message notification:', error);
      return false;
    }
  }, [user, conversationId]);

  // Send typing indicator notification
  const sendTypingNotification = useCallback(async (
    recipientId: string,
    isTyping: boolean
  ) => {
    if (!user || recipientId === user.id || !isTyping) return false;

    try {
      // Check if recipient has typing notifications enabled
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('typing_notifications, push_enabled')
        .eq('user_id', recipientId)
        .single();

      if (!preferences?.typing_notifications || !preferences?.push_enabled) {
        return false;
      }

      // Send typing notification
      return await hybridNotificationService.sendTypingNotification(
        user.id,
        user.user_metadata?.full_name || 'Someone',
        conversationId || 'unknown'
      );
    } catch (error) {
      console.error('Error sending typing notification:', error);
      return false;
    }
  }, [user, conversationId]);

  // Listen for new messages in real-time
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const message = payload.new;
          
          // Don't notify if it's our own message
          if (message.sender_id === user.id) return;

          // Send notification to other participants
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', user.id);

          if (participants) {
            participants.forEach(async (participant) => {
              await sendNewMessageNotification(
                participant.user_id,
                message.content,
                user.user_metadata?.full_name || 'Someone'
              );
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, sendNewMessageNotification]);

  return {
    sendNewMessageNotification,
    sendTypingNotification
  };
};
