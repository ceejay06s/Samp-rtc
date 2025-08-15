import { useEffect, useState } from 'react';
import { AuthState, AuthStateService } from '../services/authStateService';

export function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    profile: null,
    loading: true,
    lastLoginTime: null,
    sessionExpiry: null,
  });

  useEffect(() => {
    const authService = AuthStateService.getInstance();
    
    // Subscribe to auth state changes
    const unsubscribe = authService.addListener((newState) => {
      setAuthState(newState);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    lastLoginTime: authState.lastLoginTime,
    sessionExpiry: authState.sessionExpiry,

    // Actions
    signOut: () => AuthStateService.getInstance().signOut(),
    refreshProfile: () => AuthStateService.getInstance().refreshProfile(),
    setOnlineStatus: (isOnline: boolean) => AuthStateService.getInstance().setOnlineStatus(isOnline),

    // Utility methods
    getUser: () => AuthStateService.getInstance().getUser(),
    getProfile: () => AuthStateService.getInstance().getProfile(),
    isLoading: () => AuthStateService.getInstance().isLoading(),
    getLastLoginTime: () => AuthStateService.getInstance().getLastLoginTime(),
    getSessionExpiry: () => AuthStateService.getInstance().getSessionExpiry(),
  };
} 