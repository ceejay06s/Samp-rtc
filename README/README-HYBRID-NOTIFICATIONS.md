# Hybrid Notification System

A comprehensive notification solution that works seamlessly across **mobile (iOS/Android)** and **web platforms**, providing the best user experience on each platform.

## 🚀 **Features**

### **Cross-Platform Support**
- ✅ **iOS/Android**: Full Expo Notifications support
- ✅ **Web**: Web Push API + Browser Notifications
- ✅ **Fallback**: In-app notifications on all platforms

### **Notification Types**
- 💬 **Messages**: New message notifications
- ❤️ **Matches**: New match alerts
- ⌨️ **Typing**: Typing indicators
- 🌐 **Online Status**: When matches come online
- 🔔 **General**: Custom notifications

### **Smart Features**
- 🎯 **Priority-based**: High, normal, low priority levels
- ⏰ **Auto-dismiss**: Notifications auto-remove after 5 seconds
- 🎨 **Beautiful UI**: Smooth animations and modern design
- ⚙️ **User Preferences**: Granular control over notification types
- 🔇 **Quiet Hours**: Scheduled notification blocking

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    HybridNotificationService                │
├─────────────────────────────────────────────────────────────┤
│  Platform Detection  │  Mobile (Expo)  │  Web (Push API)  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   In-App        │  │   Push          │  │   Service   │ │
│  │ Notifications   │  │ Notifications   │  │   Worker    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   User          │  │   Notification  │  │   VAPID     │ │
│  │ Preferences     │  │   Settings      │  │   Keys      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📱 **Mobile (iOS/Android)**

### **Features**
- Full system notifications
- Sound and vibration
- Background processing
- Badge counts
- Rich notifications

### **Implementation**
```typescript
// Automatically uses expo-notifications
await hybridNotificationService.initialize();

// Send notification
await hybridNotificationService.sendNotification({
  title: 'New Message',
  body: 'You have a new message!',
  type: 'message',
  priority: 'high',
  data: { conversationId: '123' }
});
```

## 🌐 **Web Platform**

### **Features**
- Web Push API support
- Browser notifications
- Service worker integration
- Offline support
- Cross-tab notifications

### **Requirements**
- HTTPS required for production
- VAPID keys for push subscriptions
- Service worker registration
- User permission grant

### **Implementation**
```typescript
// Automatically detects web platform
await hybridNotificationService.initialize();

// Request permissions (web only)
const granted = await hybridNotificationService.requestPermissions();

// Send notification
await hybridNotificationService.sendNotification({
  title: 'New Match!',
  body: 'You have a new match!',
  type: 'match',
  priority: 'high'
});
```

## 🎯 **Usage Examples**

### **Basic Setup**
```typescript
import { useNotifications } from '../hooks/useNotifications';

const MyComponent = () => {
  const {
    isSupported,
    isEnabled,
    sendNotification,
    showMessageNotification,
    showMatchNotification
  } = useNotifications();

  // Component logic...
};
```

### **Message Notifications**
```typescript
// When receiving a new message
await showMessageNotification(
  'John Doe',
  'Hey, how are you doing?',
  'conversation-123'
);
```

### **Match Notifications**
```typescript
// When getting a new match
await showMatchNotification(
  'Sarah Wilson',
  'user-456'
);
```

### **Custom Notifications**
```typescript
await sendNotification({
  title: 'Profile Updated',
  body: 'Your profile has been successfully updated',
  type: 'general',
  priority: 'normal',
  data: { action: 'profile_update' }
});
```

## ⚙️ **Configuration**

### **VAPID Keys (Web Only)**
Generate VAPID keys for web push notifications:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Update your config:
```typescript
// lib/config.ts
export const config = {
  api: {
    vapidPublicKey: 'your-vapid-public-key',
    vapidPrivateKey: 'your-vapid-private-key',
  }
};
```

### **Environment Variables**
```bash
# .env
EXPO_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
EXPO_PUBLIC_VAPID_PRIVATE_KEY=your-vapid-private-key
```

## 🎨 **UI Components**

### **InAppNotification**
Beautiful animated notification component:
```typescript
import { InAppNotification } from '../components/ui/InAppNotification';

<InAppNotification
  notification={notification}
  onDismiss={() => removeNotification(notification)}
  onPress={() => handleNotificationPress(notification)}
/>
```

### **NotificationContainer**
Manages multiple notifications:
```typescript
import { NotificationContainer } from '../components/ui/NotificationContainer';

// Add to your app root
<NotificationContainer />
```

### **NotificationSettings**
User preference management:
```typescript
import { NotificationSettings } from '../components/ui/NotificationSettings';

// Add to settings screen
<NotificationSettings />
```

## 🔧 **Database Schema**

### **Push Tokens Table**
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT,
  web_push_subscription JSONB,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_type)
);
```

### **Notification Preferences Table**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  match_notifications BOOLEAN DEFAULT true,
  typing_notifications BOOLEAN DEFAULT false,
  online_status_notifications BOOLEAN DEFAULT false,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## 🚀 **Deployment**

### **Web Platform**
1. Ensure HTTPS is enabled
2. Deploy service worker (`public/sw.js`)
3. Set VAPID keys in environment
4. Test notification permissions

### **Mobile Platform**
1. Configure Expo Notifications in `app.json`
2. Set up push notification certificates
3. Test on physical devices

## 🧪 **Testing**

### **Local Development**
```bash
# Start development server
npm run web

# Test notifications
# 1. Grant notification permissions
# 2. Send test notification
# 3. Verify in-app and system notifications
```

### **Production Testing**
1. Deploy to production
2. Test on real devices
3. Verify cross-platform functionality
4. Monitor notification delivery rates

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Web Notifications Not Working**
- Check HTTPS requirement
- Verify VAPID keys
- Check browser permissions
- Ensure service worker is registered

#### **Mobile Notifications Not Working**
- Verify Expo Notifications setup
- Check device permissions
- Test on physical device
- Verify push certificates

#### **In-App Notifications Not Showing**
- Check component mounting
- Verify notification service initialization
- Check for JavaScript errors
- Verify theme configuration

### **Debug Mode**
Enable debug logging:
```typescript
// Add to your app initialization
if (__DEV__) {
  console.log('Notification Debug Mode Enabled');
}
```

## 📚 **API Reference**

### **HybridNotificationService**
- `initialize()`: Initialize platform-specific notifications
- `sendNotification()`: Send notification to current user
- `sendPushNotification()`: Send to multiple users via Supabase
- `getNotificationPreferences()`: Get user preferences
- `updateNotificationPreferences()`: Update user preferences

### **useNotifications Hook**
- `isSupported`: Platform support status
- `isEnabled`: Permission status
- `isInitialized`: Service initialization status
- `preferences`: User notification preferences
- `sendNotification()`: Send notification
- `showMessageNotification()`: Quick message notification
- `showMatchNotification()`: Quick match notification

## 🤝 **Contributing**

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test on multiple platforms
5. Ensure backward compatibility

## 📄 **License**

This notification system is part of the Samp-rtc dating app project.

---

**Built with ❤️ for cross-platform excellence**
