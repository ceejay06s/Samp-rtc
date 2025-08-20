# Notification Usage Examples

## Overview
This guide provides practical examples of how to use the Expo Notifications + Supabase integration in your dating app.

## 🚀 **Quick Start Examples**

### **1. Basic Local Notification**
```typescript
import { notificationService } from '../services/notificationService';

// Send a simple local notification
await notificationService.sendLocalNotification(
  'New Message',
  'You have a new message from John',
  { type: 'new_message', userId: 'john-id' }
);
```

### **2. Send Push Notification to Multiple Users**
```typescript
// Send match notification to multiple users
const sendMatchNotification = async (userIds: string[]) => {
  const success = await notificationService.sendPushNotification(
    userIds,
    'New Match! 🎉',
    'You have a new match. Tap to view their profile!',
    { type: 'new_match', timestamp: Date.now() },
    'match'
  );

  if (success) {
    console.log('Match notifications sent successfully');
  }
};

// Usage
sendMatchNotification(['user1-id', 'user2-id']);
```

## 💬 **Chat Notifications**

### **New Message Notification**
```typescript
// In your chat component
const handleNewMessage = async (message: any, senderName: string) => {
  // Show local notification
  await notificationService.sendLocalNotification(
    `Message from ${senderName}`,
    message.content || '📷 Photo message',
    {
      type: 'new_message',
      conversationId: message.conversation_id,
      messageId: message.id,
      senderId: message.sender_id
    }
  );

  // Send push notification if user is offline
  if (!isUserOnline(message.recipient_id)) {
    await notificationService.sendPushNotification(
      [message.recipient_id],
      `Message from ${senderName}`,
      message.content || '📷 Photo message',
      {
        type: 'new_message',
        conversationId: message.conversation_id,
        messageId: message.id
      },
      'message'
    );
  }
};
```

### **Typing Indicator Notification**
```typescript
const handleTypingIndicator = async (userId: string, userName: string) => {
  await notificationService.sendLocalNotification(
    `${userName} is typing...`,
    'Tap to open chat',
    {
      type: 'typing',
      userId,
      timestamp: Date.now()
    }
  );
};
```

## 🎯 **Match Notifications**

### **New Match Alert**
```typescript
const notifyNewMatch = async (userIds: string[], matchData: any) => {
  const success = await notificationService.sendPushNotification(
    userIds,
    'New Match! 🎉',
    `You matched with ${matchData.name}! Start a conversation.`,
    {
      type: 'new_match',
      matchId: matchData.id,
      userId: matchData.user_id,
      name: matchData.name
    },
    'match'
  );

  return success;
};
```

### **Match Request Notification**
```typescript
const notifyMatchRequest = async (recipientId: string, requesterName: string) => {
  await notificationService.sendPushNotification(
    [recipientId],
    'New Match Request',
    `${requesterName} wants to match with you!`,
    {
      type: 'match_request',
      requesterId: requesterId,
      requesterName
    },
    'match_request'
  );
};
```

## 👥 **User Activity Notifications**

### **Online Status Change**
```typescript
const notifyOnlineStatus = async (userId: string, userName: string, isOnline: boolean) => {
  if (isOnline) {
    await notificationService.sendLocalNotification(
      `${userName} is online`,
      'Tap to start chatting',
      {
        type: 'status_change',
        userId,
        isOnline: true
      }
    );
  } else {
    await notificationService.sendLocalNotification(
      `${userName} went offline`,
      'They\'ll see your message when they\'re back',
      {
        type: 'status_change',
        userId,
        isOnline: false
      }
    );
  }
};
```

### **Profile Update Notification**
```typescript
const notifyProfileUpdate = async (userId: string, updateType: string) => {
  const messages = {
    'photo': '📷 New profile photo added',
    'bio': '✏️ Profile bio updated',
    'location': '📍 Location updated',
    'preferences': '⚙️ Preferences changed'
  };

  await notificationService.sendLocalNotification(
    'Profile Updated',
    messages[updateType] || 'Profile updated',
    {
      type: 'profile_update',
      userId,
      updateType
    }
  );
};
```

## 🔔 **System Notifications**

### **App Updates and Maintenance**
```typescript
const notifyAppUpdate = async (allUserIds: string[]) => {
  await notificationService.sendPushNotification(
    allUserIds,
    'App Update Available',
    'New features and improvements are ready! Update now.',
    {
      type: 'app_update',
      version: '2.1.0',
      features: ['New chat features', 'Improved matching', 'Bug fixes']
    },
    'system'
  );
};
```

### **Maintenance Notifications**
```typescript
const notifyMaintenance = async (userIds: string[], startTime: string, duration: string) => {
  await notificationService.sendPushNotification(
    userIds,
    'Scheduled Maintenance',
    `App will be unavailable from ${startTime} for ${duration}`,
    {
      type: 'maintenance',
      startTime,
      duration,
      estimatedEnd: calculateEndTime(startTime, duration)
    },
    'system'
  );
};
```

## ⚙️ **User Preferences Management**

### **Get User Preferences**
```typescript
const loadUserPreferences = async () => {
  const preferences = await notificationService.getPreferences();
  
  if (preferences) {
    setNotificationSettings({
      messageNotifications: preferences.message_notifications,
      matchNotifications: preferences.match_notifications,
      typingNotifications: preferences.typing_notifications,
      quietHoursStart: preferences.quiet_hours_start,
      quietHoursEnd: preferences.quiet_hours_end,
      soundEnabled: preferences.sound_enabled
    });
  }
};
```

### **Update User Preferences**
```typescript
const updateNotificationSettings = async (newSettings: any) => {
  const success = await notificationService.updatePreferences({
    message_notifications: newSettings.messageNotifications,
    match_notifications: newSettings.matchNotifications,
    typing_notifications: newSettings.typingNotifications,
    quiet_hours_start: newSettings.quietHoursStart,
    quiet_hours_end: newSettings.quietHoursEnd,
    sound_enabled: newSettings.soundEnabled
  });

  if (success) {
    showAlert('Success', 'Notification settings updated');
  } else {
    showAlert('Error', 'Failed to update settings');
  }
};
```

## 📱 **Notification History**

### **Load Notification History**
```typescript
const [notificationHistory, setNotificationHistory] = useState([]);

const loadNotifications = async () => {
  const history = await notificationService.getHistory(20);
  setNotificationHistory(history);
};

// Display in a list
const renderNotificationItem = ({ item }) => (
  <TouchableOpacity
    onPress={() => markAsOpened(item.id)}
    style={[
      styles.notificationItem,
      item.opened_at ? styles.readNotification : styles.unreadNotification
    ]}
  >
    <Text style={styles.notificationTitle}>{item.title}</Text>
    <Text style={styles.notificationBody}>{item.body}</Text>
    <Text style={styles.notificationTime}>
      {formatTime(item.sent_at)}
    </Text>
  </TouchableOpacity>
);
```

### **Mark Notifications as Read**
```typescript
const markAsOpened = async (notificationId: string) => {
  const success = await notificationService.markAsOpened(notificationId);
  
  if (success) {
    // Update local state
    setNotificationHistory(prev => 
      prev.map(item => 
        item.id === notificationId 
          ? { ...item, opened_at: new Date().toISOString(), status: 'opened' }
          : item
      )
    );
  }
};
```

## 🎨 **Custom Notification Components**

### **Notification Settings Screen**
```typescript
const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState({
    messageNotifications: true,
    matchNotifications: true,
    typingNotifications: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    soundEnabled: true
  });

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updateNotificationSettings(settings);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message Notifications</Text>
        <Switch
          value={settings.messageNotifications}
          onValueChange={(value) => handleToggle('messageNotifications', value)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Notifications</Text>
        <Switch
          value={settings.matchNotifications}
          onValueChange={(value) => handleToggle('matchNotifications', value)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <TextInput
          style={styles.timeInput}
          value={settings.quietHoursStart}
          placeholder="22:00"
        />
        <Text>to</Text>
        <TextInput
          style={styles.timeInput}
          value={settings.quietHoursEnd}
          placeholder="08:00"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

### **Notification Badge Component**
```typescript
const NotificationBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

## 🔧 **Advanced Usage Patterns**

### **Batch Notifications**
```typescript
const sendBatchNotifications = async (notifications: Array<{
  userIds: string[];
  title: string;
  body: string;
  data?: any;
  type: string;
}>) => {
  const results = await Promise.allSettled(
    notifications.map(notification =>
      notificationService.sendPushNotification(
        notification.userIds,
        notification.title,
        notification.body,
        notification.data,
        notification.type
      )
    )
  );

  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value
  ).length;

  console.log(`Sent ${successful}/${notifications.length} notifications successfully`);
};
```

### **Conditional Notifications**
```typescript
const sendSmartNotification = async (
  userId: string,
  notificationType: string,
  context: any
) => {
  // Get user preferences
  const preferences = await notificationService.getPreferences();
  
  if (!preferences) return;

  // Check if user wants this type of notification
  const shouldSend = preferences[`${notificationType}_notifications`];
  if (!shouldSend) return;

  // Check quiet hours
  const now = new Date();
  const currentHour = now.getHours();
  const startHour = parseInt(preferences.quiet_hours_start.split(':')[0]);
  const endHour = parseInt(preferences.quiet_hours_end.split(':')[0]);

  const inQuietHours = startHour <= endHour
    ? currentHour >= startHour && currentHour <= endHour
    : currentHour >= startHour || currentHour <= endHour;

  if (inQuietHours) {
    console.log('In quiet hours, skipping notification');
    return;
  }

  // Send notification
  await notificationService.sendLocalNotification(
    context.title,
    context.body,
    context.data
  );
};
```

## 🚨 **Error Handling**

### **Graceful Fallbacks**
```typescript
const sendNotificationWithFallback = async (
  title: string,
  body: string,
  data?: any
) => {
  try {
    // Try to send via notification service
    await notificationService.sendLocalNotification(title, body, data);
  } catch (error) {
    console.error('Notification service failed:', error);
    
    // Fallback to simple alert
    Alert.alert(title, body);
    
    // Log error for debugging
    // You could send this to your error tracking service
    logError('notification_failed', {
      title,
      body,
      data,
      error: error.message
    });
  }
};
```

### **Retry Logic**
```typescript
const sendNotificationWithRetry = async (
  title: string,
  body: string,
  data?: any,
  maxRetries: number = 3
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await notificationService.sendLocalNotification(title, body, data);
      return true; // Success
    } catch (error) {
      console.error(`Notification attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Final attempt failed
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};
```

## 📊 **Analytics and Tracking**

### **Notification Metrics**
```typescript
const trackNotificationMetrics = async (
  notificationType: string,
  action: 'sent' | 'delivered' | 'opened' | 'failed'
) => {
  try {
    await supabase
      .from('notification_analytics')
      .insert({
        notification_type: notificationType,
        action,
        timestamp: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
  } catch (error) {
    console.error('Failed to track notification metrics:', error);
  }
};
```

### **User Engagement Tracking**
```typescript
const trackUserEngagement = async (notificationId: string, action: string) => {
  try {
    await supabase
      .from('user_engagement')
      .insert({
        notification_id: notificationId,
        action,
        timestamp: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
  } catch (error) {
    console.error('Failed to track user engagement:', error);
  }
};
```

## 🎯 **Best Practices Summary**

1. **Always check user preferences** before sending notifications
2. **Respect quiet hours** and user settings
3. **Use appropriate notification types** for different scenarios
4. **Implement graceful fallbacks** when notifications fail
5. **Track notification metrics** for optimization
6. **Handle errors gracefully** and log them for debugging
7. **Use batch operations** when sending multiple notifications
8. **Implement retry logic** for failed notifications
9. **Provide user control** over notification preferences
10. **Test thoroughly** on different devices and platforms

This comprehensive notification system provides a robust foundation for keeping your users engaged and informed about important events in your dating app!
