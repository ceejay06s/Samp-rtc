import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { config } from '../../lib/config';
import { supabase } from '../../lib/supabase';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  type?: 'message' | 'match' | 'typing' | 'online' | 'general';
  priority?: 'high' | 'normal' | 'low';
}

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
  expo_push_token?: string;
  web_push_subscription?: any;
  device_type: 'ios' | 'android' | 'web';
}

export class HybridNotificationService {
  private static instance: HybridNotificationService;
  private currentToken: string | null = null;
  private webPushSubscription: any = null;
  private isInitialized: boolean = false;
  private inAppNotificationQueue: NotificationData[] = [];
  private inAppNotificationListeners: ((notification: NotificationData) => void)[] = [];

  static getInstance(): HybridNotificationService {
    if (!HybridNotificationService.instance) {
      HybridNotificationService.instance = new HybridNotificationService();
    }
    return HybridNotificationService.instance;
  }

  // Initialize notification service based on platform
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'web') {
        await this.initializeWebPush();
      } else {
        await this.initializeExpoNotifications();
      }

      this.isInitialized = true;
      console.log(`Notification service initialized for ${Platform.OS}`);
    } catch (error) {
      console.error('Error initializing notification service:', error);
      // Fallback to in-app notifications only
      this.isInitialized = true;
    }
  }

  // Initialize Expo Notifications for mobile platforms
  private async initializeExpoNotifications(): Promise<void> {
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
      await this.savePushToken();

      // Set up notification response listener
      this.setupExpoNotificationListener();

      console.log('Expo notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing Expo notifications:', error);
    }
  }

  // Initialize Web Push API for web platforms
  private async initializeWebPush(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Web Push API not supported');
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(config.api.vapidPublicKey || ''),
      });

      this.webPushSubscription = subscription;
      
      // Save subscription to Supabase
      await this.savePushToken();

      console.log('Web Push API initialized successfully');
    } catch (error) {
      console.error('Error initializing Web Push API:', error);
    }
  }

  // Convert VAPID public key for Web Push API
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Save push token/subscription to Supabase
  private async savePushToken(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      const tokenData: any = {
        user_id: user.id,
        device_type: deviceType,
        is_active: true,
        last_used: new Date().toISOString(),
      };

      if (Platform.OS === 'web' && this.webPushSubscription) {
        tokenData.web_push_subscription = this.webPushSubscription;
      } else if (this.currentToken) {
        tokenData.expo_push_token = this.currentToken;
      }

      const { error } = await supabase
        .from('push_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id,device_type'
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Set up Expo notification listener for mobile
  private setupExpoNotificationListener(): void {
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received:', response);
      // Handle notification tap
      this.handleNotificationTap(response.notification.request.content.data);
    });
  }

  // Send notification (platform-aware)
  async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      // Always show in-app notification
      this.showInAppNotification(notification);

      // Send platform-specific notification
      if (Platform.OS === 'web') {
        return await this.sendWebNotification(notification);
      } else {
        return await this.sendExpoNotification(notification);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Send Expo notification for mobile
  private async sendExpoNotification(notification: NotificationData): Promise<boolean> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.priority === 'high' ? true : false,
        },
        trigger: null, // Send immediately
      });
      return true;
    } catch (error) {
      console.error('Error sending Expo notification:', error);
      return false;
    }
  }

  // Send Web notification for web
  private async sendWebNotification(notification: NotificationData): Promise<boolean> {
    try {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          data: notification.data || {},
          icon: '/icon.png',
          badge: '/badge.png',
          tag: notification.type || 'general',
          requireInteraction: notification.priority === 'high',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending Web notification:', error);
      return false;
    }
  }

  // Show in-app notification (works on all platforms)
  private showInAppNotification(notification: NotificationData): void {
    // Add to queue
    this.inAppNotificationQueue.push(notification);
    
    // Notify all listeners
    this.inAppNotificationListeners.forEach(listener => {
      listener(notification);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.inAppNotificationQueue = this.inAppNotificationQueue.filter(
        n => n !== notification
      );
    }, 5000);
  }

  // Add in-app notification listener
  addInAppNotificationListener(listener: (notification: NotificationData) => void): () => void {
    this.inAppNotificationListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.inAppNotificationListeners = this.inAppNotificationListeners.filter(
        l => l !== listener
      );
    };
  }

  // Get current in-app notifications
  getCurrentInAppNotifications(): NotificationData[] {
    return [...this.inAppNotificationQueue];
  }

  // Handle notification tap
  private handleNotificationTap(data: any): void {
    // Navigate based on notification type
    if (data?.type === 'message' && data?.conversationId) {
      // Navigate to conversation
      console.log('Navigate to conversation:', data.conversationId);
    } else if (data?.type === 'match' && data?.userId) {
      // Navigate to user profile
      console.log('Navigate to user profile:', data.userId);
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
        `${config.supabase.url}/functions/v1/send-push-notification`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.supabase.anonKey}`,
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Push notification sent:', result);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Get notification preferences
  async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
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
        console.error('Error updating notification preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  // Check if notifications are supported on current platform
  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return 'Notification' in window && 'serviceWorker' in navigator;
    }
    return true; // Expo notifications work on mobile
  }

  // Check if notifications are enabled
  async isEnabled(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return Notification.permission === 'granted';
    } else {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    }
  }
}

// Export singleton instance
export const hybridNotificationService = HybridNotificationService.getInstance();
