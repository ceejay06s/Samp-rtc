# Analytics Setup Guide

This guide explains how to set up and use analytics in your React Native/Expo app.

## Quick Start

1. **Enable analytics** in your `.env` file:
   ```env
   EXPO_PUBLIC_ENABLE_ANALYTICS=true
   ```

2. **Test analytics** using the Analytics Dashboard in your app

3. **Configure a real analytics provider** (optional)

## Features

### ✅ **What's Included:**

- **Environment-based toggle** - Enable/disable analytics via config
- **Mock provider** - Console logging when real provider not configured
- **Type-safe tracking** - Full TypeScript support
- **React hooks** - Easy integration with components
- **Predefined events** - Common tracking patterns
- **User identification** - Automatic user context
- **Error tracking** - Built-in error monitoring
- **Test dashboard** - Visual testing interface

## Usage Examples

### **Basic Tracking**
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function MyComponent() {
  const { trackButtonClick, trackUserAction } = useAnalytics()

  const handlePress = () => {
    trackButtonClick('my_button', { 
      screen: 'home',
      category: 'navigation' 
    })
  }

  return <Button onPress={handlePress} title="Click Me" />
}
```

### **Screen Tracking**
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function MyScreen() {
  const { trackScreenView } = useAnalytics()

  useEffect(() => {
    trackScreenView('My Screen', {
      category: 'main',
      source: 'navigation'
    })
  }, [])

  return <View>...</View>
}
```

### **User Identification**
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function LoginComponent() {
  const { identifyUser } = useAnalytics()

  const handleLogin = async (user) => {
    identifyUser(user.id, {
      email: user.email,
      plan: user.plan,
      signupDate: user.created_at
    })
  }
}
```

### **Error Tracking**
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function MyComponent() {
  const { trackError } = useAnalytics()

  const handleError = (error) => {
    trackError(error, {
      component: 'MyComponent',
      action: 'data_fetch'
    })
  }
}
```

## Available Tracking Methods

### **Event Tracking**
- `trackEvent(name, properties)` - Custom events
- `trackButtonClick(buttonName, properties)` - Button interactions
- `trackScreenView(screenName, properties)` - Screen views
- `trackFormSubmission(formName, properties)` - Form submissions
- `trackUserAction(action, properties)` - User actions
- `trackError(error, properties)` - Error tracking

### **User Management**
- `identifyUser(userId, traits)` - Identify users
- `setUserProperties(properties)` - Set user properties
- `flush()` - Flush events (mobile apps)

## Configuration

### **Environment Variables**
```env
# Enable/disable analytics
EXPO_PUBLIC_ENABLE_ANALYTICS=true

# App information (auto-included in events)
EXPO_PUBLIC_APP_NAME=My App
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### **Analytics Provider Setup**

The analytics system supports multiple providers. To use a real provider:

1. **Install your preferred analytics SDK**:
   ```bash
   # Mixpanel
   npm install mixpanel-react-native

   # Amplitude
   npm install @amplitude/analytics-react-native

   # Firebase Analytics
   npm install @react-native-firebase/analytics
   ```

2. **Update `lib/analytics.ts`**:
   ```typescript
   // Replace RealAnalyticsProvider with your service
   class RealAnalyticsProvider implements AnalyticsProvider {
     track(event: AnalyticsEvent): void {
       // Your analytics service here
       mixpanel.track(event.name, event.properties)
     }
     // ... other methods
   }
   ```

## Popular Analytics Services

### **Mixpanel**
```typescript
import mixpanel from 'mixpanel-react-native'

class MixpanelProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    mixpanel.track(event.name, event.properties)
  }
  
  identify(userId: string, traits?: Record<string, any>): void {
    mixpanel.identify(userId)
    if (traits) mixpanel.people.set(traits)
  }
}
```

### **Amplitude**
```typescript
import { track, identify, setUserProperties } from '@amplitude/analytics-react-native'

class AmplitudeProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    track(event.name, event.properties)
  }
  
  identify(userId: string, traits?: Record<string, any>): void {
    identify(userId, traits)
  }
}
```

### **Firebase Analytics**
```typescript
import analytics from '@react-native-firebase/analytics'

class FirebaseProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    analytics().logEvent(event.name, event.properties)
  }
  
  identify(userId: string, traits?: Record<string, any>): void {
    analytics().setUserId(userId)
    if (traits) {
      Object.entries(traits).forEach(([key, value]) => {
        analytics().setUserProperty(key, String(value))
      })
    }
  }
}
```

## Testing Analytics

### **Using the Dashboard**
1. Open your app
2. Navigate to the "Analytics Dashboard" section
3. Click test buttons to trigger events
4. Check console logs for event data

### **Console Output**
When analytics is enabled, you'll see logs like:
```
📊 Analytics Event: {
  name: "Button Click",
  properties: {
    button_name: "test_button",
    userId: "user123",
    userEmail: "user@example.com",
    appVersion: "1.0.0",
    timestamp: 1640995200000
  }
}
```

## Best Practices

### ✅ **Do**
- Use descriptive event names
- Include relevant properties
- Track user identification on login
- Use consistent property names
- Test analytics in development
- Handle errors gracefully

### ❌ **Don't**
- Track sensitive user data
- Over-track (too many events)
- Use inconsistent naming
- Forget to test analytics
- Track PII without consent

## Event Naming Conventions

### **Recommended Format**
- Use snake_case for event names
- Be descriptive and specific
- Include action and object

### **Examples**
```
✅ Good:
- "button_click"
- "screen_view"
- "form_submission"
- "user_login"
- "purchase_completed"

❌ Bad:
- "click"
- "view"
- "submit"
- "login"
- "buy"
```

## Property Guidelines

### **Common Properties**
```typescript
// Screen/Page context
screen_name: string
screen_category: string

// User context
user_id: string
user_email: string
user_type: string

// Action context
action_type: string
action_category: string

// App context
app_version: string
platform: string
```

## Troubleshooting

### **Common Issues**

1. **"Analytics not working"**
   - Check `EXPO_PUBLIC_ENABLE_ANALYTICS=true`
   - Restart development server
   - Check console for errors

2. **"Events not showing"**
   - Verify provider configuration
   - Check network connectivity
   - Ensure proper initialization

3. **"User identification not working"**
   - Call `identifyUser` after login
   - Verify user ID format
   - Check provider setup

### **Debug Tips**
```typescript
// Add debug logging
console.log('Analytics Config:', config.features.analytics)
console.log('User:', user)
console.log('Event:', event)
```

## Advanced Features

### **Custom Event Properties**
```typescript
trackEvent('custom_action', {
  category: 'feature',
  subcategory: 'advanced',
  value: 100,
  metadata: {
    source: 'user_input',
    timestamp: new Date().toISOString()
  }
})
```

### **Batch Events**
```typescript
// Track multiple events
const events = [
  { name: 'feature_view', properties: { feature: 'analytics' } },
  { name: 'user_action', properties: { action: 'explore' } }
]

events.forEach(event => trackEvent(event.name, event.properties))
```

### **Conditional Tracking**
```typescript
const { trackEvent } = useAnalytics()

// Only track for specific users
if (user.plan === 'premium') {
  trackEvent('premium_feature_used', { feature: 'advanced_analytics' })
}
```

## Additional Resources

- [Mixpanel Documentation](https://developer.mixpanel.com/docs/react-native)
- [Amplitude Documentation](https://developers.amplitude.com/docs/react-native)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Analytics Best Practices](https://amplitude.com/blog/analytics-best-practices) 