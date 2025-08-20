import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export interface NotificationPreferences {
  push_enabled: boolean;
  message_notifications: boolean;
  match_notifications: boolean;
  typing_notifications: boolean;
  online_status_notifications: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface PushTokenData {
  expo_push_token: string;
  device_type: 'ios' | 'android' | 'web';
}

export class NotificationService {
  private static instance: NotificationService;
  private currentToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync();
      this.currentToken = token.data;
      
      // Save token to Supabase
      await this.savePushToken(token.data);

      // Set up notification response listener
      this.setupNotificationListener();

      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Save push token to Supabase
  private async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          expo_push_token: token,
          device_type: deviceType,
          is_active: true,
          last_used: new Date().toISOString(),
        }, {
          onConflict: 'user_id,expo_push_token'
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Setup notification response listener
  private setupNotificationListener(): void {
    Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      this.handleNotificationResponse(data);
    });
  }

  // Handle notification response
  private handleNotificationResponse(data: any): void {
    console.log('Notification response received:', data);
    
    // Handle different notification types
    switch (data.type) {
      case 'new_message':
        // Navigate to chat
        this.navigateToChat(data.conversationId);
        break;
      case 'new_match':
        // Navigate to matches
        this.navigateToMatches();
        break;
      case 'typing':
        // Show typing indicator
        this.showTypingIndicator(data.userId);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // Navigation methods (implement based on your navigation setup)
  private navigateToChat(conversationId: string): void {
    // Implement navigation to chat
    console.log('Navigate to chat:', conversationId);
  }

  private navigateToMatches(): void {
    // Implement navigation to matches
    console.log('Navigate to matches');
  }

  private showTypingIndicator(userId: string): void {
    // Implement typing indicator
    console.log('Show typing indicator for:', userId);
  }

  // Get user notification preferences
  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  // Check if notifications should be sent (quiet hours)
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.timeToMinutes(preferences.quiet_hours_start);
    const endTime = this.timeToMinutes(preferences.quiet_hours_end);

    if (startTime <= endTime) {
      // Same day range (e.g., 08:00 to 22:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Send local notification
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    preferences?: NotificationPreferences
  ): Promise<void> {
    try {
      // Check quiet hours
      if (preferences && this.isInQuietHours(preferences)) {
        console.log('In quiet hours, skipping notification');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: preferences?.sound_enabled !== false,
        },
        trigger: null, // Show immediately
      });

      // Log to history
      await this.logNotification(title, body, data);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Log notification to history
  private async logNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notification_history')
        .insert({
          user_id: user.id,
          title,
          body,
          data,
          notification_type: data?.type || 'local',
        });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Get notification history
  async getHistory(limit: number = 50): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notification history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  // Mark notification as opened
  async markAsOpened(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_history')
        .update({
          opened_at: new Date().toISOString(),
          status: 'opened',
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as opened:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as opened:', error);
      return false;
    }
  }

  // Send push notification to multiple users via Supabase Edge Function
  async sendPushNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: any,
    notificationType?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds,
            title,
            body,
            data,
            notificationType,
          }),
        }
      );

      if (!response.ok) {
        console.error('Error sending push notification:', response.statusText);
        return false;
      }

      const result = await response.json();
      console.log('Push notification result:', result);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Get current push token
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Check if service is initialized
  isInitialized(): boolean {
    return this.currentToken !== null;
  }
}

export const notificationService = NotificationService.getInstance();
