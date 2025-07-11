import { config } from './config'

// Analytics event types
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: number
}

// Analytics provider interface
interface AnalyticsProvider {
  track(event: AnalyticsEvent): void
  identify(userId: string, traits?: Record<string, any>): void
  setUserProperties(properties: Record<string, any>): void
  flush(): void
}

// Mock analytics provider (when analytics is disabled)
class MockAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    if (config.features.analytics) {
      console.log('📊 Analytics Event:', event)
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (config.features.analytics) {
      console.log('👤 Analytics Identify:', { userId, traits })
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    if (config.features.analytics) {
      console.log('🏷️ Analytics User Properties:', properties)
    }
  }

  flush(): void {
    if (config.features.analytics) {
      console.log('🔄 Analytics Flush')
    }
  }
}

// Real analytics provider (you can replace this with your preferred service)
class RealAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    // Replace with your analytics service (Mixpanel, Amplitude, etc.)
    console.log('📊 Real Analytics Event:', event)
    
    // Example: Mixpanel
    // mixpanel.track(event.name, event.properties)
    
    // Example: Amplitude
    // amplitude.track(event.name, event.properties)
    
    // Example: Firebase Analytics
    // analytics().logEvent(event.name, event.properties)
  }

  identify(userId: string, traits?: Record<string, any>): void {
    console.log('👤 Real Analytics Identify:', { userId, traits })
    
    // Example: Mixpanel
    // mixpanel.identify(userId)
    // if (traits) mixpanel.people.set(traits)
  }

  setUserProperties(properties: Record<string, any>): void {
    console.log('🏷️ Real Analytics User Properties:', properties)
    
    // Example: Mixpanel
    // mixpanel.people.set(properties)
  }

  flush(): void {
    console.log('🔄 Real Analytics Flush')
    
    // Example: Mixpanel
    // mixpanel.flush()
  }
}

// Analytics service class
class AnalyticsService {
  private provider: AnalyticsProvider
  private userId?: string

  constructor() {
    // Use real analytics if enabled, otherwise use mock
    this.provider = config.features.analytics 
      ? new RealAnalyticsProvider() 
      : new MockAnalyticsProvider()
  }

  // Track an event
  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        appVersion: config.app.version,
        timestamp: Date.now(),
      },
      userId: this.userId,
    }

    this.provider.track(event)
  }

  // Identify a user
  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId
    this.provider.identify(userId, traits)
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>): void {
    this.provider.setUserProperties(properties)
  }

  // Flush events (useful for mobile apps)
  flush(): void {
    this.provider.flush()
  }

  // Predefined event tracking methods
  trackScreenView(screenName: string, properties?: Record<string, any>): void {
    this.track('Screen View', {
      screen_name: screenName,
      ...properties,
    })
  }

  trackButtonClick(buttonName: string, properties?: Record<string, any>): void {
    this.track('Button Click', {
      button_name: buttonName,
      ...properties,
    })
  }

  trackFormSubmission(formName: string, properties?: Record<string, any>): void {
    this.track('Form Submission', {
      form_name: formName,
      ...properties,
    })
  }

  trackError(error: Error, properties?: Record<string, any>): void {
    this.track('Error', {
      error_message: error.message,
      error_stack: error.stack,
      ...properties,
    })
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.track('User Action', {
      action,
      ...properties,
    })
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()
