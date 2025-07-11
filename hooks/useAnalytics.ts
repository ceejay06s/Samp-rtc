import { analytics } from '@/lib/analytics'
import { useAuth } from '@/lib/AuthContext'
import { useCallback } from 'react'

export function useAnalytics() {
  const { user } = useAuth()

  // Track screen view
  const trackScreenView = useCallback((screenName: string, properties?: Record<string, any>) => {
    analytics.trackScreenView(screenName, {
      ...properties,
      userId: user?.id,
      userEmail: user?.email,
    })
  }, [user])

  // Track button click
  const trackButtonClick = useCallback((buttonName: string, properties?: Record<string, any>) => {
    analytics.trackButtonClick(buttonName, {
      ...properties,
      userId: user?.id,
      userEmail: user?.email,
    })
  }, [user])

  // Track form submission
  const trackFormSubmission = useCallback((formName: string, properties?: Record<string, any>) => {
    analytics.trackFormSubmission(formName, {
      ...properties,
      userId: user?.id,
      userEmail: user?.email,
    })
  }, [user])

  // Track error
  const trackError = useCallback((error: Error, properties?: Record<string, any>) => {
    analytics.trackError(error, {
      ...properties,
      userId: user?.id,
      userEmail: user?.email,
    })
  }, [user])

  // Track user action
  const trackUserAction = useCallback((action: string, properties?: Record<string, any>) => {
    analytics.trackUserAction(action, {
      ...properties,
      userId: user?.id,
      userEmail: user?.email,
    })
  }, [user])

  // Track custom event
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, {
      ...properties,
      userId: user?.id,
      userEmail: user?.email,
    })
  }, [user])

  // Identify user (call when user logs in)
  const identifyUser = useCallback((userId: string, traits?: Record<string, any>) => {
    analytics.identify(userId, {
      ...traits,
      email: user?.email,
      lastLogin: new Date().toISOString(),
    })
  }, [user])

  // Set user properties
  const setUserProperties = useCallback((properties: Record<string, any>) => {
    analytics.setUserProperties(properties)
  }, [])

  return {
    trackScreenView,
    trackButtonClick,
    trackFormSubmission,
    trackError,
    trackUserAction,
    trackEvent,
    identifyUser,
    setUserProperties,
  }
} 