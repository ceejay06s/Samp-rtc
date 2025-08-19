import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useAutoLocation } from '../src/hooks/useAutoLocation'
import { AuthStateService } from '../src/services/authStateService'
import { Profile } from '../src/types'

interface AuthContextType {
  user: any
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  locationSharing: boolean
  setLocationSharing: (enabled: boolean) => void
  manualLocationUpdate: () => void
  lastLoginTime: string | null
  sessionExpiry: string | null
  isSessionExpired: boolean
  checkSessionValidity: () => Promise<{ isValid: boolean; needsRefresh: boolean }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [lastLoginTime, setLastLoginTime] = useState<string | null>(null)
  const [sessionExpiry, setSessionExpiry] = useState<string | null>(null)
  const [locationSharing, setLocationSharing] = useState(true) // Default to enabled for dating app

  // Auto-location hook - automatically updates location when sharing is enabled
  const { manualLocationUpdate } = useAutoLocation({
    userId: user?.id,
    isLocationSharingEnabled: locationSharing,
    onLocationUpdate: (latitude, longitude) => {
      console.log('📍 User location updated:', { latitude, longitude });
      // Optionally refresh profile to get updated location
      if (profile) {
        setProfile(prev => prev ? {
          ...prev,
          latitude,
          longitude,
          updated_at: new Date().toISOString()
        } : null);
      }
    },
    onError: (error) => {
      console.error('🚨 Auto-location error:', error);
      // Could show a toast or handle error silently
    }
  });

  useEffect(() => {
    const authService = AuthStateService.getInstance();
    
    // Subscribe to auth state changes
    const unsubscribe = authService.addListener((authState) => {
      setUser(authState.user);
      setProfile(authState.profile);
      setLoading(authState.loading);
      setIsAuthenticated(authState.isAuthenticated);
      setLastLoginTime(authState.lastLoginTime);
      setSessionExpiry(authState.sessionExpiry);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let lastUpdate = 0;
    const updateInterval = 5000; // 5 seconds minimum between updates

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (!user) return

      const now = Date.now();
      if (now - lastUpdate < updateInterval) {
        console.log('⏰ App state change skipped - too recent');
        return;
      }

      if (nextAppState === 'active') {
        // App came to foreground - set user as active
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          await AuthStateService.getInstance().setOnlineStatus(true);
          console.log('📱 App became active - user set as online')
          lastUpdate = Date.now();
        }, 1000); // 1 second delay
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background - set user as inactive
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          await AuthStateService.getInstance().setOnlineStatus(false);
          console.log('📱 App went to background - user set as offline')
          lastUpdate = Date.now();
        }, 1000); // 1 second delay
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription?.remove()
      clearTimeout(timeoutId)
    }
  }, [user])

  const signOut = async () => {
    try {
      console.log('🔐 AuthContext: Starting sign out process');
      await AuthStateService.getInstance().signOut();
      console.log('✅ AuthContext: Sign out completed successfully');
      console.log('🧹 AuthContext: Session and state cleared');
    } catch (error) {
      console.error('❌ AuthContext: Error during sign out:', error);
      // Re-throw the error so components can handle it appropriately
      throw error;
    }
  }

  // Periodic session checking - only when user is authenticated
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    console.log('⏰ Setting up periodic session checking every 5 minutes');
    
    const checkSessionInterval = setInterval(async () => {
      try {
        console.log('🔄 Periodic session check...');
        const { isValid } = await AuthStateService.getInstance().checkSessionValidity();
        if (!isValid) {
          console.log('🚨 Periodic session check failed, signing out');
          await signOut();
        } else {
          console.log('✅ Periodic session check passed');
        }
      } catch (error) {
        console.error('❌ Error during periodic session check:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      console.log('⏰ Clearing periodic session checking');
      clearInterval(checkSessionInterval);
    };
  }, [user, isAuthenticated, signOut]);

  const refreshProfile = async () => {
    await AuthStateService.getInstance().refreshProfile();
  }

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isAuthenticated,
    signOut,
    refreshProfile,
    locationSharing,
    setLocationSharing,
    manualLocationUpdate,
    lastLoginTime,
    sessionExpiry,
    isSessionExpired: sessionExpiry ? new Date() > new Date(sessionExpiry) : false,
    checkSessionValidity: useCallback(() => AuthStateService.getInstance().checkSessionValidity(), []),
  }), [
    user,
    profile,
    loading,
    isAuthenticated,
    signOut,
    refreshProfile,
    locationSharing,
    setLocationSharing,
    manualLocationUpdate,
    lastLoginTime,
    sessionExpiry,
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}