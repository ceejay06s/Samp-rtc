# Expo Notifications + Supabase Integration

## Overview
This guide demonstrates how to integrate Expo Notifications with Supabase to create a comprehensive notification system for your dating app. This combination provides both local notifications (Expo) and server-sent push notifications (Supabase) for a complete user experience.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Expo Cloud    │    │    Supabase     │
│      App        │◄──►│  Push Service   │◄──►│   Database      │
│                 │    │                 │    │   + Functions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Components:**
1. **Expo Notifications**: Local notifications, permission management
2. **Supabase Database**: Store notification preferences and history
3. **Supabase Edge Functions**: Send push notifications
4. **Expo Push Service**: Deliver notifications to devices

## 📋 **Prerequisites**

### **Dependencies**
```bash
npm install expo-notifications @supabase/supabase-js
```

### **Required Services**
- Supabase project with Edge Functions enabled
- Expo account for push notifications
- Apple Developer Account (for iOS)
- Google Play Console (for Android)

## 🗄️ **Database Schema**

### **1. Notification Preferences Table**
```sql
-- Create notification preferences table
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  match_notifications BOOLEAN DEFAULT true,
  typing_notifications BOOLEAN DEFAULT false,
  online_status_notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### **2. Push Tokens Table**
```sql
-- Create push tokens table
CREATE TABLE push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tokens" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Unique constraint for user + token combination
CREATE UNIQUE INDEX idx_push_tokens_user_token ON push_tokens(user_id, expo_push_token);
```

### **3. Notification History Table**
```sql
-- Create notification history table
CREATE TABLE notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed'))
);

-- Enable RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notification_history
  FOR UPDATE USING (auth.uid() = user_id);
```

## 🔧 **Implementation**

### **1. Notification Service Setup**

Create `src/services/notificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

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
}

export const notificationService = NotificationService.getInstance();
```

### **2. Supabase Edge Function for Push Notifications**

Create `supabase/functions/send-push-notification/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { userIds, title, body, data, notificationType } = await req.json()

    if (!userIds || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get push tokens for users
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('expo_push_token, device_type')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare notification payloads
    const messages = tokens.map(token => ({
      to: token.expo_push_token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        type: notificationType,
        timestamp: new Date().toISOString(),
      },
    }))

    // Send notifications via Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!expoResponse.ok) {
      const errorText = await expoResponse.text()
      console.error('Expo Push API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send push notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expoResult = await expoResponse.json()

    // Log notifications to history
    const historyEntries = userIds.map(userId => ({
      user_id: userId,
      title,
      body,
      data,
      notification_type: notificationType,
      status: 'sent',
    }))

    const { error: historyError } = await supabase
      .from('notification_history')
      .insert(historyEntries)

    if (historyError) {
      console.error('Error logging notifications:', historyError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: tokens.length,
        expoResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### **3. Enhanced Chat Component Integration**

Update your `EnhancedRealtimeChat.tsx` to use the new service:

```typescript
// Add to imports
import { notificationService } from '../../services/notificationService';

// Add to component
useEffect(() => {
  // Initialize notification service
  notificationService.initialize();
}, []);

// Update notification functions to use the service
const showNewMessageNotification = async (message: any, senderName: string) => {
  if (isWeb) return;
  
  try {
    let body = 'New message';
    if (message.content) {
      body = message.content.length > 50 
        ? `${message.content.substring(0, 50)}...` 
        : message.content;
    } else if (message.message_type === MessageType.PHOTO) {
      body = '📷 Photo';
    } else if (message.message_type === MessageType.VOICE) {
      body = '🎤 Voice message';
    } else if (message.message_type === MessageType.GIF) {
      body = '🎬 GIF';
    } else if (message.message_type === MessageType.STICKER) {
      body = '😊 Sticker';
    }

    await notificationService.sendLocalNotification(
      `Message from ${senderName}`,
      body,
      { 
        type: 'new_message', 
        conversationId,
        messageId: message.id,
        senderId: message.sender_id
      }
    );
  } catch (error) {
    console.error('Error showing new message notification:', error);
  }
};
```

## 🚀 **Usage Examples**

### **1. Send Push Notification to Multiple Users**
```typescript
// Send match notification
const sendMatchNotification = async (userIds: string[]) => {
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
          title: 'New Match! 🎉',
          body: 'You have a new match. Tap to view their profile!',
          data: { type: 'new_match' },
          notificationType: 'match',
        }),
      }
    );

    const result = await response.json();
    console.log('Push notification result:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
```

### **2. Update User Preferences**
```typescript
const updateNotificationSettings = async () => {
  const success = await notificationService.updatePreferences({
    message_notifications: true,
    match_notifications: true,
    typing_notifications: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  });

  if (success) {
    console.log('Notification preferences updated');
  }
};
```

### **3. Get Notification History**
```typescript
const loadNotificationHistory = async () => {
  const history = await notificationService.getHistory(20);
  console.log('Recent notifications:', history);
};
```

## 🔒 **Security Considerations**

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only access their own data
- Service role key used only in Edge Functions

### **Token Management**
- Push tokens are user-specific
- Inactive tokens are automatically cleaned up
- Token validation on server side

### **Data Privacy**
- No sensitive content in notifications
- Minimal data payload
- User consent for notifications

## 📱 **Testing**

### **Local Development**
```bash
# Start Supabase locally
supabase start

# Deploy Edge Functions
supabase functions deploy send-push-notification

# Test notifications
curl -X POST http://localhost:54321/functions/v1/send-push-notification \
  -H "Content-Type: application/json" \
  -d '{"userIds":["test-user-id"],"title":"Test","body":"Test notification"}'
```

### **Production Testing**
1. Deploy to Supabase production
2. Test on physical devices
3. Verify notification delivery
4. Check analytics and logs

## 🎯 **Best Practices**

### **Notification Content**
- Keep titles under 50 characters
- Use clear, actionable language
- Include relevant context
- Respect user preferences

### **Performance**
- Batch notifications when possible
- Use quiet hours for non-urgent notifications
- Implement notification throttling
- Monitor delivery rates

### **User Experience**
- Provide notification settings
- Allow granular control
- Respect user preferences
- Handle edge cases gracefully

## 🔮 **Future Enhancements**

### **Advanced Features**
- **Smart Notifications**: AI-powered relevance scoring
- **Notification Groups**: Group related notifications
- **Custom Sounds**: Different sounds for different types
- **Rich Notifications**: Images and interactive buttons

### **Analytics & Insights**
- **Delivery Tracking**: Monitor notification success rates
- **User Engagement**: Track notification interactions
- **A/B Testing**: Test different notification strategies
- **Performance Metrics**: Optimize notification timing

This integration provides a robust, scalable notification system that combines the best of both Expo and Supabase for an excellent user experience!
