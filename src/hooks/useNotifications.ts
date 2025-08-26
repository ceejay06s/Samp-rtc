import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { hybridNotificationService, NotificationData, NotificationPreferences } from '../services/notificationService';
import { APP_CONFIG } from '../utils/appConfig';

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [currentNotifications, setCurrentNotifications] = useState<NotificationData[]>([]);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await hybridNotificationService.initialize();
        setIsInitialized(true);
        
        // Check if notifications are supported and enabled
        const supported = hybridNotificationService.isSupported();
        setIsSupported(supported);
        
        if (supported) {
          const enabled = await hybridNotificationService.isEnabled();
          setIsEnabled(enabled);
          
          // Get notification preferences
          const prefs = await hybridNotificationService.getNotificationPreferences();
          setPreferences(prefs);
        }
        
        // Set up in-app notification listener
        const unsubscribe = hybridNotificationService.addInAppNotificationListener((notification) => {
          setCurrentNotifications(prev => [...prev, notification]);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setIsInitialized(false);
      }
    };

    initializeNotifications();
  }, []);

  // Get current in-app notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const notifications = hybridNotificationService.getCurrentInAppNotifications();
      setCurrentNotifications(notifications);
    }, APP_CONFIG.NOTIFICATIONS.IN_APP_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Send notification
  const sendNotification = useCallback(async (notification: NotificationData): Promise<boolean> => {
    try {
      return await hybridNotificationService.sendNotification(notification);
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, []);

  // Send push notification to multiple users
  const sendPushNotification = useCallback(async (
    userIds: string[],
    title: string,
    body: string,
    data?: any,
    notificationType?: string
  ): Promise<boolean> => {
    try {
      return await hybridNotificationService.sendPushNotification(
        userIds,
        title,
        body,
        data,
        notificationType
      );
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      const success = await hybridNotificationService.updateNotificationPreferences(newPreferences);
      if (success) {
        // Update local state
        setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      }
      return success;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }, []);

  // Request permissions (web only)
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setIsEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, []);

  // Clear specific notification
  const clearNotification = useCallback((notification: NotificationData) => {
    setCurrentNotifications(prev => 
      prev.filter(n => n !== notification)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setCurrentNotifications([]);
  }, []);

  // Check if we're in quiet hours
  const isInQuietHours = useCallback((): boolean => {
    if (!preferences?.quiet_hours_start || !preferences?.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (startTime <= endTime) {
      // Same day (e.g., 9:00 AM to 5:00 PM)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight (e.g., 10:00 PM to 8:00 AM)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [preferences]);

  // Send notification with quiet hours check
  const sendNotificationWithQuietHours = useCallback(async (notification: NotificationData): Promise<boolean> => {
    if (isInQuietHours() && preferences?.push_enabled) {
      // Only show in-app notification during quiet hours
      hybridNotificationService.showInAppNotification(notification);
      return true;
    }
    
    return await sendNotification(notification);
  }, [isInQuietHours, preferences, sendNotification]);

  return {
    // State
    isSupported,
    isEnabled,
    isInitialized,
    preferences,
    currentNotifications,
    
    // Actions
    sendNotification,
    sendNotificationWithQuietHours,
    sendPushNotification,
    updatePreferences,
    requestPermissions,
    clearNotification,
    clearAllNotifications,
    
    // Utilities
    isInQuietHours,
  };
};
