import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { InAppNotification } from './InAppNotification';
import { NotificationData, hybridNotificationService } from '../../services/hybridNotificationService';

export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    // Subscribe to new notifications
    const unsubscribe = hybridNotificationService.addInAppNotificationListener(
      (notification) => {
        setNotifications(prev => [...prev, notification]);
      }
    );

    // Get any existing notifications
    const existingNotifications = hybridNotificationService.getCurrentInAppNotifications();
    if (existingNotifications.length > 0) {
      setNotifications(existingNotifications);
    }

    return unsubscribe;
  }, []);

  const removeNotification = (notificationToRemove: NotificationData) => {
    setNotifications(prev => 
      prev.filter(notification => notification !== notificationToRemove)
    );
  };

  const handleNotificationPress = (notification: NotificationData) => {
    // Handle notification tap based on type
    if (notification.data?.type === 'message' && notification.data?.conversationId) {
      // Navigate to conversation
      console.log('Navigate to conversation:', notification.data.conversationId);
      // You can use your navigation library here
    } else if (notification.data?.type === 'match' && notification.data?.userId) {
      // Navigate to user profile
      console.log('Navigate to user profile:', notification.data.userId);
      // You can use your navigation library here
    }

    // Remove the notification after handling
    removeNotification(notification);
  };

  return (
    <View style={styles.container}>
      {notifications.map((notification, index) => (
        <InAppNotification
          key={`${notification.title}-${index}-${Date.now()}`}
          notification={notification}
          onDismiss={() => removeNotification(notification)}
          onPress={() => handleNotificationPress(notification)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
