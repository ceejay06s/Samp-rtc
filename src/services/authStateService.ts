import { supabase } from '../../lib/supabase';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  profile: any | null;
  loading: boolean;
  lastLoginTime: string | null;
  sessionExpiry: string | null;
  isSessionExpired: boolean;
}

export type AuthStateListener = (state: AuthState) => void;

export class AuthStateService {
  private static instance: AuthStateService;
  private listeners: Set<AuthStateListener> = new Set();
  private currentState: AuthState = {
    isAuthenticated: false,
    user: null,
    profile: null,
    loading: true,
    lastLoginTime: null,
    sessionExpiry: null,
    isSessionExpired: false,
  };

  static getInstance(): AuthStateService {
    if (!AuthStateService.instance) {
      AuthStateService.instance = new AuthStateService();
    }
    return AuthStateService.instance;
  }

  private constructor() {
    this.initializeAuthListener();
  }

  private async initializeAuthListener() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check session validity immediately
    if (session?.user) {
      const { isValid } = await this.checkSessionValidity();
      if (!isValid) {
        console.log('🚨 Initial session check failed, clearing auth state');
        await this.updateAuthState(null);
        return;
      }
    }
    
    await this.updateAuthState(session);

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await this.handleSignIn(session);
      } else if (event === 'SIGNED_OUT') {
        await this.handleSignOut();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await this.handleTokenRefresh(session);
      }
    });
  }

  private async handleSignIn(session: any) {
    try {
      console.log('✅ User signed in:', session.user.id);
      
      // Fetch user profile
      console.log('🔍 Fetching profile for user:', session.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Failed to fetch profile:', profileError);
        console.error('❌ Profile error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        // Continue with user data even if profile fetch fails
      } else {
        console.log('✅ Profile fetched successfully:', {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          photos: profile.photos?.length || 0
        });
      }

      // Update online status
      const { error: onlineError } = await supabase
        .from('profiles')
        .update({ 
          is_online: true, 
          last_seen: new Date().toISOString() 
        })
        .eq('user_id', session.user.id);

      if (onlineError) {
        console.warn('⚠️ Failed to update online status:', onlineError);
        // Continue even if online status update fails
      }

      // Update auth state
      await this.updateAuthState(session, profile);
      
      console.log('🟢 User authenticated and online');
    } catch (error) {
      console.error('❌ Error handling sign in:', error);
      // Still update auth state with user data even if profile/online status fails
      await this.updateAuthState(session, null);
    }
  }

  private async handleSignOut() {
    try {
      console.log('🔴 User signed out');
      
      // Set user as inactive if we have user data
      if (this.currentState.user) {
        const { error: onlineError } = await supabase
          .from('profiles')
          .update({ 
            is_online: false, 
            last_seen: new Date().toISOString() 
          })
          .eq('user_id', this.currentState.user.id);

        if (onlineError) {
          console.warn('⚠️ Failed to update online status during sign out:', onlineError);
        }
      }

      // Clear auth state
      this.updateAuthState(null);
      
      console.log('🔴 User deauthenticated and offline');
    } catch (error) {
      console.error('❌ Error handling sign out:', error);
      // Still clear auth state even if online status update fails
      this.updateAuthState(null);
    }
  }

  private async handleTokenRefresh(session: any) {
    try {
      console.log('🔄 Token refreshed for user:', session.user.id);
      
      // Update session expiry
      await this.updateAuthState(session, this.currentState.profile);
      
      console.log('✅ Token refresh handled');
    } catch (error) {
      console.error('❌ Error handling token refresh:', error);
    }
  }

  private async updateAuthState(session: any, profile?: any) {
    const now = new Date();
    const sessionExpiry = session?.expires_at ? new Date(session.expires_at * 1000) : null;
    const isSessionExpired = sessionExpiry ? now > sessionExpiry : false;

    const newState: AuthState = {
      isAuthenticated: !!session?.user && !isSessionExpired,
      user: session?.user || null,
      profile: profile || null,
      loading: false,
      lastLoginTime: session?.user ? new Date().toISOString() : null,
      sessionExpiry: sessionExpiry ? sessionExpiry.toISOString() : null,
      isSessionExpired,
    };

    this.currentState = newState;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('❌ Error in auth state listener:', error);
      }
    });
  }

  // Public methods
  getCurrentState(): AuthState {
    return { ...this.currentState };
  }

  addListener(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    
    // Immediately call listener with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  removeListener(listener: AuthStateListener): void {
    this.listeners.delete(listener);
  }

  async refreshProfile(): Promise<void> {
    if (!this.currentState.user) {
      console.log('⚠️ refreshProfile: No user available');
      return;
    }

    try {
      console.log('🔄 refreshProfile: Fetching profile for user:', this.currentState.user.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', this.currentState.user.id)
        .single();

      if (error) {
        console.error('❌ refreshProfile: Failed to fetch profile:', error);
        console.error('❌ refreshProfile: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      console.log('✅ refreshProfile: Profile fetched successfully:', {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        photos: profile.photos?.length || 0
      });

      await this.updateAuthState(
        await supabase.auth.getSession().then(({ data }) => data.session),
        profile
      );
      
      console.log('✅ refreshProfile: Auth state updated with new profile');
    } catch (error) {
      console.error('❌ refreshProfile: Error refreshing profile:', error);
    }
  }

  async setOnlineStatus(isOnline: boolean): Promise<void> {
    if (!this.currentState.user) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline, 
          last_seen: new Date().toISOString() 
        })
        .eq('user_id', this.currentState.user.id);

      console.log(`🟢 User ${isOnline ? 'online' : 'offline'}:`, this.currentState.user.id);
    } catch (error) {
      console.error('❌ Failed to update online status:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  getUser(): any | null {
    return this.currentState.user;
  }

  getProfile(): any | null {
    return this.currentState.profile;
  }

  isLoading(): boolean {
    return this.currentState.loading;
  }

  getLastLoginTime(): string | null {
    return this.currentState.lastLoginTime;
  }

  getSessionExpiry(): string | null {
    return this.currentState.sessionExpiry;
  }

  private lastSessionCheck = 0;
  private readonly SESSION_CHECK_COOLDOWN = 10000; // 10 seconds cooldown

  async checkSessionValidity(): Promise<{ isValid: boolean; needsRefresh: boolean }> {
    try {
      const now = Date.now();
      
      // Prevent too frequent session checks
      if (now - this.lastSessionCheck < this.SESSION_CHECK_COOLDOWN) {
        console.log('⏰ Session check skipped - too recent, using cached result');
        return { 
          isValid: this.currentState.isAuthenticated, 
          needsRefresh: false 
        };
      }
      
      this.lastSessionCheck = now;
      console.log('🔍 Checking session validity...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ No session found');
        return { isValid: false, needsRefresh: false };
      }

      const currentTime = new Date();
      const sessionExpiry = session.expires_at ? new Date(session.expires_at * 1000) : null;
      
      console.log('🔍 Session expiry:', sessionExpiry);
      console.log('🔍 Current time:', currentTime);
      
      if (!sessionExpiry) {
        console.log('❌ No session expiry found');
        return { isValid: false, needsRefresh: false };
      }

      // Check if session is expired
      if (currentTime > sessionExpiry) {
        console.log('⚠️ Session expired, clearing auth state');
        await this.updateAuthState(null);
        return { isValid: false, needsRefresh: false };
      }

      // Check if session needs refresh (within 5 minutes of expiry)
      const fiveMinutesFromNow = new Date(currentTime.getTime() + 5 * 60 * 1000);
      const needsRefresh = sessionExpiry < fiveMinutesFromNow;

      console.log('🔍 Session needs refresh:', needsRefresh);

      if (needsRefresh) {
        console.log('🔄 Session needs refresh, attempting to refresh...');
        try {
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('❌ Failed to refresh session:', error);
            return { isValid: false, needsRefresh: false };
          }
          if (refreshedSession) {
            await this.updateAuthState(refreshedSession, this.currentState.profile);
            console.log('✅ Session refreshed successfully');
            return { isValid: true, needsRefresh: false };
          }
        } catch (refreshError) {
          console.error('❌ Error refreshing session:', refreshError);
          return { isValid: false, needsRefresh: false };
        }
      }

      console.log('✅ Session is valid');
      return { isValid: true, needsRefresh: false };
    } catch (error) {
      console.error('❌ Error checking session validity:', error);
      return { isValid: false, needsRefresh: false };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔐 AuthStateService: Starting sign out process');
      
      // Set online status to false first
      if (this.currentState.user) {
        try {
          await this.setOnlineStatus(false);
        } catch (onlineError) {
          console.warn('⚠️ Failed to set online status during sign out:', onlineError);
          // Continue with sign out even if online status fails
        }
      }

      // Sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('❌ Supabase sign out error:', signOutError);
        throw signOutError;
      }

      // Clear local auth state immediately
      this.updateAuthState(null);
      
      console.log('✅ AuthStateService: Sign out completed successfully');
      console.log('🧹 AuthStateService: Local state cleared');
    } catch (error) {
      console.error('❌ AuthStateService: Error during sign out:', error);
      // Even if there's an error, try to clear the local state
      try {
        this.updateAuthState(null);
        console.log('🧹 AuthStateService: Local state cleared despite error');
      } catch (stateError) {
        console.error('❌ Failed to clear auth state:', stateError);
      }
      throw error;
    }
  }
} 