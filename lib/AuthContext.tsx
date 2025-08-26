import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Profile } from '../src/types'
import { signOut as supabaseSignOut } from './auth'
import { supabase } from './supabase'

interface AuthContextType {
  user: any
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  authStateStable: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  locationSharing: boolean
  setLocationSharing: (enabled: boolean) => void
  manualLocationUpdate: () => Promise<void>
  lastLoginTime: string | null
  sessionExpiry: string | null
  isSessionExpired: boolean
  checkSessionValidity: () => Promise<{ isValid: boolean; needsRefresh: boolean }>
  getCurrentSessionInfo: () => Promise<any>
  forceSessionRefresh: () => Promise<any>
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
  const [lastSessionCheck, setLastSessionCheck] = useState<number>(0) // Track last session check time
  const [isCheckingSession, setIsCheckingSession] = useState(false) // Prevent multiple simultaneous checks
  const [authStateStable, setAuthStateStable] = useState(false) // Track if auth state has stabilized

  // Auto-location hook - temporarily disabled to isolate rendering issue
  // const { manualLocationUpdate: rawManualLocationUpdate } = useAutoLocation({
  //   userId: user?.id,
  //   isLocationSharingEnabled: locationSharing,
  //   onLocationUpdate: (latitude, longitude) => {
  //     console.log('📍 User location updated:', { latitude, longitude });
  //     // Removed profile state update to prevent infinite re-render loop
  //     // Profile will be updated through the normal auth state flow instead
  //   },
  //   onError: (error) => {
  //     console.error('🚨 Auto-location error:', error);
  //     // Could show a toast or handle error silently
  //   }
  // });

  // Memoize the manual location update function to prevent unnecessary re-renders
  // const manualLocationUpdate = useCallback(rawManualLocationUpdate, [rawManualLocationUpdate]);
  
  // Temporary stub function
  const manualLocationUpdate = useCallback(async () => {
    console.log('📍 Manual location update called (stub)');
  }, []);

  useEffect(() => {
    let isMounted = true;
    console.log('🔐 AuthContext: useEffect triggered, starting session check');
    
    const checkExistingSession = async () => {
      try {
        if (!isMounted) return;
        
        // Prevent multiple simultaneous session checks
        if (isCheckingSession) {
          console.log('⏳ AuthContext: Session check already in progress, skipping...');
          return;
        }
        
        // Debounce session checks (minimum 2 seconds between checks)
        const now = Date.now();
        if (now - lastSessionCheck < 2000) {
          console.log('⏳ AuthContext: Session check too recent, skipping...');
          return;
        }
        
        console.log('🔍 AuthContext: Starting session check');
        setIsCheckingSession(true);
        setLastSessionCheck(now);
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        console.log('📋 AuthContext: Session check result', {
          hasSession: !!session,
          sessionExpiry: session?.expires_at,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          timestamp: new Date().toISOString()
        });
        
        // Only update state if it's different to prevent unnecessary re-renders
        if (session?.user) {
          console.log('✅ AuthContext: Found existing session');
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Try to fetch profile information
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileData && !error) {
              console.log('👤 AuthContext: Profile loaded on session check:', profileData);
              setProfile(profileData);
            } else {
              console.log('ℹ️ AuthContext: No profile found on session check:', error);
            }
          } catch (profileError) {
            console.log('ℹ️ AuthContext: Error fetching profile on session check:', profileError);
          }
          
          setAuthStateStable(true);
          console.log('🔒 AuthContext: Auth state marked as stable (authenticated)');
        } else {
          console.log('ℹ️ AuthContext: No existing session found');
          
          // Only update if we currently have a user
          if (user) {
            console.log('🔄 AuthContext: Clearing user state');
            setUser(null);
            setIsAuthenticated(false);
            setAuthStateStable(true);
            console.log('🔒 AuthContext: Auth state marked as stable (not authenticated)');
          } else {
            // Even if no user, mark as stable to prevent further checks
            setAuthStateStable(true);
            console.log('🔒 AuthContext: Auth state marked as stable (no user)');
          }
        }
        
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ AuthContext: Error checking session:', error);
        // Only update if we currently have a user
        if (user) {
          setUser(null);
          setIsAuthenticated(false);
        }
        // Mark as stable even on error to prevent infinite loops
        setAuthStateStable(true);
      } finally {
        if (isMounted) {
          console.log('🏁 AuthContext: Session check completed, setting loading to false');
          setLoading(false);
          setIsCheckingSession(false);
        }
      }
    };
    
    checkExistingSession();
    
    return () => {
      console.log('🧹 AuthContext: Cleaning up useEffect');
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Watch for user state changes and mark auth state as stable
  useEffect(() => {
    if (user?.id && isAuthenticated && !authStateStable) {
      console.log('🔒 AuthContext: User state settled, marking auth state as stable', {
        userId: user.id,
        userEmail: user.email,
        isAuthenticated
      });
      setAuthStateStable(true);
    }
  }, [user?.id, isAuthenticated, authStateStable]);

  // Separate useEffect for auth state changes to prevent loops
  useEffect(() => {
    let isMounted = true;
    
    console.log('🔐 AuthContext: Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AuthContext: Auth state changed:', { event, userEmail: session?.user?.email });
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ AuthContext: User signed in, updating state');
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Try to fetch profile information
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileData && !error) {
              console.log('👤 AuthContext: Profile loaded:', profileData);
              setProfile(profileData);
            } else {
              console.log('ℹ️ AuthContext: No profile found or error loading profile:', error);
            }
          } catch (profileError) {
            console.log('ℹ️ AuthContext: Error fetching profile:', profileError);
          }
          
          setAuthStateStable(true);
          console.log('🔒 AuthContext: Auth state marked as stable (authenticated)');
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 AuthContext: User signed out, clearing state');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setLastLoginTime(null);
          setSessionExpiry(null);
          setAuthStateStable(false); // Reset stability for next login
          console.log('🔒 AuthContext: Auth state cleared for sign out');
        }
      }
    );
    
    return () => {
      console.log('🧹 AuthContext: Cleaning up auth state listener');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array to prevent loops

  // Handle app state changes (background/foreground) - temporarily disabled
  // useEffect(() => {
  //   let timeoutId: ReturnType<typeof setTimeout>;
  //   let lastUpdate = 0;
  //   const updateInterval = APP_CONFIG.APP_STATE.UPDATE_INTERVAL;

  //   const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //     if (!user) return

  //     const now = Date.now();
  //     if (now - lastUpdate < updateInterval) {
  //       console.log('⏰ App state change skipped - too recent');
  //       return;
  //     }

  //     if (nextAppState === 'active') {
  //       // App came to foreground - set user as active
  //       clearTimeout(timeoutId);
  //       timeoutId = setTimeout(async () => {
  //         await AuthStateService.getInstance().setOnlineStatus(true);
  //         console.log('📱 App became active - user set as online')
  //         lastUpdate = Date.now();
  //       }, APP_CONFIG.APP_STATE.STATUS_UPDATE_DELAY);
  //     } else if (nextAppState === 'background' || nextAppState === 'inactive') {
  //       // App went to background - set user as inactive
  //       clearTimeout(timeoutId);
  //       timeoutId = setTimeout(async () => {
  //         await AuthStateService.getInstance().setOnlineStatus(false);
  //         console.log('📱 App went to background - user set as offline')
  //         lastUpdate = Date.now();
  //       }, APP_CONFIG.APP_STATE.STATUS_UPDATE_DELAY);
  //     }
  //   }

  //   const subscription = AppState.addEventListener('change', handleAppStateChange)

  //   return () => {
  //     subscription?.remove()
  //     clearTimeout(timeoutId)
  //   }
  // }, [user])

  const signOut = useCallback(async () => {
    try {
      console.log('🔐 AuthContext: Starting sign out process');
      
      // Sign out from Supabase
      const { success, error } = await supabaseSignOut();
      
      if (!success) {
        throw new Error(error?.message || 'Failed to sign out from Supabase');
      }
      
      // Clear all local state
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setLastLoginTime(null);
      setSessionExpiry(null);
      setLocationSharing(true); // Reset to default
      
      // Clear any stored data (if using AsyncStorage or similar)
      try {
        // Clear any cached data or tokens
        await supabase.auth.refreshSession(); // This will clear the current session
        console.log('🧹 AuthContext: Supabase session refreshed and cleared');
      } catch (clearError) {
        console.log('ℹ️ AuthContext: Session already cleared');
      }
      
      // Clear any other stored data (you can add more cleanup here)
      try {
        // Clear any local storage, cookies, or other persistent data
        if (typeof window !== 'undefined' && window.localStorage) {
          // Clear any app-specific data from localStorage
          const keysToRemove = Object.keys(window.localStorage).filter(key => 
            key.startsWith('samp-rtc-') || 
            key.startsWith('supabase.') ||
            key.includes('auth')
          );
          
          keysToRemove.forEach(key => {
            window.localStorage.removeItem(key);
            console.log(`🧹 Removed localStorage key: ${key}`);
          });
        }
      } catch (storageError) {
        console.log('ℹ️ No additional storage to clear');
      }
      
      console.log('✅ AuthContext: Sign out completed successfully');
      console.log('🧹 AuthContext: Session and state cleared');
    } catch (error) {
      console.error('❌ AuthContext: Error during sign out:', error);
      // Re-throw the error so components can handle it appropriately
      throw error;
    }
  }, []);

  // Periodic session checking - temporarily disabled
  // useEffect(() => {
  //   if (!user || !isAuthenticated) return;

  //   console.log('⏰ Setting up periodic session checking every 15 minutes');
    
  //   const checkSessionInterval = setInterval(async () => {
  //     try {
  //       console.log('🔄 Periodic session check...');
  //       const { isValid } = await AuthStateService.getInstance().checkSessionValidity();
  //       if (!isValid) {
  //         console.log('🚨 Periodic session check failed, signing out');
  //         await signOut();
  //       } else {
  //         console.log('✅ Periodic session check passed');
  //       }
  //     } catch (error) {
  //       console.error('❌ Error during periodic session check:', error);
  //     }
  //   }, APP_CONFIG.SESSION.CHECK_INTERVAL);

  //   return () => {
  //     console.log('⏰ Clearing periodic session checking');
  //       clearInterval(checkSessionInterval);
  //   };
  // }, [user, isAuthenticated, signOut]);

  const refreshProfile = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log('ℹ️ No user to refresh profile for');
        return;
      }
      
      // Refresh the session first
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Error refreshing session:', error);
        return;
      }
      
      if (data.session) {
        console.log('🔄 Session refreshed successfully');
        // You can fetch updated profile data here if needed
      }
      
      console.log('🔄 Profile refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing profile:', error);
    }
  }, [user?.id]);

  const checkSessionValidity = useCallback(async () => {
    try {
      console.log('🔍 AuthContext: Manual session validity check');
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('📋 AuthContext: Current session status', {
        hasSession: !!session,
        sessionExpiry: session?.expires_at,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        currentTime: new Date().toISOString()
      });
      
      if (!session) {
        return { isValid: false, needsRefresh: false };
      }
      
      // Check if session has expired
      if (session.expires_at) {
        const expiryTime = new Date(session.expires_at * 1000);
        const now = new Date();
        const isValid = expiryTime > now;
        
        console.log('⏰ AuthContext: Session expiry check', {
          expiryTime: expiryTime.toISOString(),
          now: now.toISOString(),
          isValid,
          timeRemaining: expiryTime.getTime() - now.getTime()
        });
        
        if (!isValid) {
          console.log('🚨 Session expired');
          return { isValid: false, needsRefresh: false };
        }
      }
      
      return { isValid: true, needsRefresh: false };
    } catch (error) {
      console.error('❌ Error checking session validity:', error);
      return { isValid: false, needsRefresh: false };
    }
  }, []);

  const getCurrentSessionInfo = useCallback(async () => {
    try {
      console.log('🔍 AuthContext: Getting current session info');
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      const sessionInfo = {
        hasSession: !!session,
        sessionExpiry: session?.expires_at,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        currentUser: user,
        currentTime: new Date().toISOString(),
        contextState: {
          user: !!user,
          isAuthenticated,
          loading,
          profile: !!profile,
          authStateStable
        }
      };
      
      console.log('📋 AuthContext: Current session info', sessionInfo);
      return sessionInfo;
    } catch (error) {
      console.error('❌ Error getting session info:', error);
      return null;
    }
  }, [isAuthenticated, loading, profile, authStateStable]);

  const forceSessionRefresh = useCallback(async () => {
    try {
      console.log('🔄 AuthContext: Force refreshing session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Error refreshing session:', error);
        return { success: false, error };
      }
      
      if (data.session) {
        console.log('✅ AuthContext: Session refreshed successfully', {
          userId: data.session.user.id,
          userEmail: data.session.user.email
        });
        
        // Update the state with the refreshed session
        setUser(data.session.user);
        setIsAuthenticated(true);
        setAuthStateStable(true);
        
        return { success: true, session: data.session };
      } else {
        console.log('ℹ️ AuthContext: No session after refresh');
        setUser(null);
        setIsAuthenticated(false);
        setAuthStateStable(true);
        return { success: true, session: null };
      }
    } catch (error) {
      console.error('❌ Error in force session refresh:', error);
      return { success: false, error };
    }
  }, []);

  const isSessionExpired = useMemo(() => {
    return sessionExpiry ? new Date() > new Date(sessionExpiry) : false;
  }, [sessionExpiry]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isAuthenticated,
    authStateStable,
    signOut,
    refreshProfile,
    locationSharing,
    setLocationSharing,
    manualLocationUpdate,
    lastLoginTime,
    sessionExpiry,
    isSessionExpired,
    checkSessionValidity,
    getCurrentSessionInfo,
    forceSessionRefresh,
  }), [
    user,
    profile,
    loading,
    isAuthenticated,
    authStateStable,
    signOut,
    refreshProfile,
    locationSharing,
    setLocationSharing,
    manualLocationUpdate,
    lastLoginTime,
    sessionExpiry,
    isSessionExpired,
    checkSessionValidity,
    getCurrentSessionInfo,
    forceSessionRefresh,
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