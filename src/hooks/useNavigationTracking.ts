import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const REFERRER_URL_KEY = 'currentUrl';

/**
 * Hook to track navigation and save current URL for referrer tracking
 * This helps with back button navigation in chat screens
 */
export const useNavigationTracking = () => {
  const pathname = usePathname();

  useEffect(() => {
    const saveCurrentUrl = async () => {
      try {
        // Only save if it's not a chat URL (to avoid circular references)
        if (pathname && !pathname.includes('/chat/')) {
          if (Platform.OS === 'web') {
            // Web platform: use sessionStorage/localStorage
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(REFERRER_URL_KEY, pathname);
            }
            
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(REFERRER_URL_KEY, pathname);
            }
          } else {
            // Mobile platform: use AsyncStorage
            await AsyncStorage.setItem(REFERRER_URL_KEY, pathname);
          }
          
          console.log('📍 Navigation tracking: Saved URL:', pathname);
        }
      } catch (error) {
        console.warn('📍 Navigation tracking: Failed to save URL:', error);
      }
    };

    saveCurrentUrl();
  }, [pathname]);

  /**
   * Get the saved referrer URL
   * @returns The saved referrer URL or null if not found
   */
  const getReferrerUrl = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        // Web platform: check sessionStorage first, then localStorage
        if (typeof sessionStorage !== 'undefined') {
          const sessionUrl = sessionStorage.getItem(REFERRER_URL_KEY);
          if (sessionUrl) return sessionUrl;
        }
        
        if (typeof localStorage !== 'undefined') {
          const localUrl = localStorage.getItem(REFERRER_URL_KEY);
          if (localUrl) return localUrl;
        }
      } else {
        // Mobile platform: use AsyncStorage
        const mobileUrl = await AsyncStorage.getItem(REFERRER_URL_KEY);
        if (mobileUrl) return mobileUrl;
      }
      return null;
    } catch (error) {
      console.warn('📍 Navigation tracking: Failed to get referrer URL:', error);
      return null;
    }
  };

  /**
   * Get the saved referrer URL synchronously (for immediate use)
   * @returns The saved referrer URL or null if not found
   */
  const getReferrerUrlSync = (): string | null => {
    try {
      if (Platform.OS === 'web') {
        if (typeof sessionStorage !== 'undefined') {
          const sessionUrl = sessionStorage.getItem(REFERRER_URL_KEY);
          if (sessionUrl) return sessionUrl;
        }
        
        if (typeof localStorage !== 'undefined') {
          const localUrl = localStorage.getItem(REFERRER_URL_KEY);
          if (localUrl) return localUrl;
        }
      }
      // For mobile, we can't get it synchronously, so return null
      return null;
    } catch (error) {
      console.warn('📍 Navigation tracking: Failed to get referrer URL sync:', error);
      return null;
    }
  };

  /**
   * Clear the saved referrer URL
   */
  const clearReferrerUrl = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(REFERRER_URL_KEY);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(REFERRER_URL_KEY);
        }
      } else {
        await AsyncStorage.removeItem(REFERRER_URL_KEY);
      }
      console.log('📍 Navigation tracking: Cleared referrer URL');
    } catch (error) {
      console.warn('📍 Navigation tracking: Failed to clear referrer URL:', error);
    }
  };

  return {
    currentPath: pathname,
    getReferrerUrl,
    getReferrerUrlSync,
    clearReferrerUrl,
  };
}; 