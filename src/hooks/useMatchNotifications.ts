import { useCallback, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { hybridNotificationService } from '../services/notificationService';

export const useMatchNotifications = () => {
  const { user } = useAuth();

  // Send notification for new match
  const sendNewMatchNotification = useCallback(async (
    matchedUserId: string,
    matchedUserName: string
  ) => {
    if (!user || matchedUserId === user.id) return false;

    try {
      // Check if user has match notifications enabled
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('match_notifications, push_enabled')
        .eq('user_id', user.id)
        .single();

      if (!preferences?.match_notifications || !preferences?.push_enabled) {
        return false;
      }

      // Send notification
      return await hybridNotificationService.sendNewMatchNotification(
        matchedUserId,
        matchedUserName
      );
    } catch (error) {
      console.error('Error sending match notification:', error);
      return false;
    }
  }, [user]);

  // Listen for new matches in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`matches:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const match = payload.new;
          
          // Get matched user's profile
          const { data: matchedUser } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', match.matched_user_id)
            .single();

          if (matchedUser) {
            const userName = matchedUser.full_name || matchedUser.username || 'Someone';
            await sendNewMatchNotification(match.matched_user_id, userName);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sendNewMatchNotification]);

  return {
    sendNewMatchNotification
  };
};
