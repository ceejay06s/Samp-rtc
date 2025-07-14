import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface PlatformInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
  isExpoGo: boolean;
  isAndroidBrowser: boolean;
  isStandalone: boolean;
  isMobileBrowser: boolean;
  isDesktopBrowser: boolean;
  platform: 'android' | 'ios' | 'web';
  environment: 'expo-go' | 'standalone' | 'web';
}

export const getPlatformInfo = (): PlatformInfo => {
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  
  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  
  // Check if running in standalone app (not Expo Go)
  const isStandalone = Constants.appOwnership !== 'expo';
  
  // Check if running in Android browser (web platform on Android)
  const isAndroidBrowser = isWeb && Platform.OS === 'web' && 
    (typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Android'));
  
  // Check if running in mobile browser (web platform on mobile devices)
  const isMobileBrowser = isWeb && (() => {
    if (typeof window === 'undefined' || !window.navigator) return false;
    
    const userAgent = window.navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
    
    return isMobile || isTablet;
  })();
  
  // Check if running in desktop browser
  const isDesktopBrowser = isWeb && !isMobileBrowser;
  
  // Determine environment
  let environment: 'expo-go' | 'standalone' | 'web';
  if (isExpoGo) {
    environment = 'expo-go';
  } else if (isStandalone) {
    environment = 'standalone';
  } else {
    environment = 'web';
  }

  return {
    isAndroid,
    isIOS,
    isWeb,
    isExpoGo,
    isAndroidBrowser,
    isStandalone,
    isMobileBrowser,
    isDesktopBrowser,
    platform: Platform.OS as 'android' | 'ios' | 'web',
    environment,
  };
};

// Convenience functions
export const isAndroid = () => getPlatformInfo().isAndroid;
export const isIOS = () => getPlatformInfo().isIOS;
export const isWeb = () => getPlatformInfo().isWeb;
export const isExpoGo = () => getPlatformInfo().isExpoGo;
export const isAndroidBrowser = () => getPlatformInfo().isAndroidBrowser;
export const isStandalone = () => getPlatformInfo().isStandalone;
export const isMobileBrowser = () => getPlatformInfo().isMobileBrowser;
export const isDesktopBrowser = () => getPlatformInfo().isDesktopBrowser;

// Get user agent string (web only)
export const getUserAgent = (): string => {
  if (typeof window !== 'undefined' && window.navigator) {
    return window.navigator.userAgent;
  }
  return '';
};

// Check if running in specific browser
export const getBrowserInfo = () => {
  if (!isWeb()) return null;
  
  const userAgent = getUserAgent();
  
  if (userAgent.includes('Chrome')) {
    return { name: 'Chrome', isChrome: true };
  } else if (userAgent.includes('Firefox')) {
    return { name: 'Firefox', isFirefox: true };
  } else if (userAgent.includes('Safari')) {
    return { name: 'Safari', isSafari: true };
  } else if (userAgent.includes('Edge')) {
    return { name: 'Edge', isEdge: true };
  }
  
  return { name: 'Unknown', isUnknown: true };
};

// Platform-specific styling helpers
export const getPlatformStyles = () => {
  const platformInfo = getPlatformInfo();
  
  return {
    // Android-specific styles
    android: {
      elevation: platformInfo.isAndroid ? 4 : 0,
      shadowColor: platformInfo.isAndroid ? 'transparent' : '#000',
      shadowOffset: platformInfo.isAndroid ? undefined : { width: 0, height: 2 },
      shadowOpacity: platformInfo.isAndroid ? undefined : 0.25,
      shadowRadius: platformInfo.isAndroid ? undefined : 3.84,
    },
    // iOS-specific styles
    ios: {
      shadowColor: platformInfo.isIOS ? '#000' : 'transparent',
      shadowOffset: platformInfo.isIOS ? { width: 0, height: 2 } : undefined,
      shadowOpacity: platformInfo.isIOS ? 0.25 : undefined,
      shadowRadius: platformInfo.isIOS ? 3.84 : undefined,
      elevation: platformInfo.isIOS ? undefined : 0,
    },
    // Web-specific styles
    web: {
      boxShadow: platformInfo.isWeb ? '0 2px 4px rgba(0,0,0,0.1)' : undefined,
    },
  };
};

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const platformInfo = getPlatformInfo();
  
  return {
    // Enable/disable features based on environment
    features: {
      // Some features might not work in Expo Go
      pushNotifications: platformInfo.isStandalone || platformInfo.isWeb,
      // Camera might have different behavior
      camera: platformInfo.isExpoGo || platformInfo.isStandalone,
      // File system access
      fileSystem: platformInfo.isStandalone || platformInfo.isWeb,
    },
    // Performance settings
    performance: {
      // Reduce animations in web for better performance
      reduceAnimations: platformInfo.isWeb,
      // Optimize for mobile browsers
      optimizeForMobile: platformInfo.isAndroidBrowser,
    },
    // UI adjustments
    ui: {
      // Different touch targets for web
      touchTargetSize: platformInfo.isWeb ? 44 : 48,
      // Different font sizes
      baseFontSize: platformInfo.isWeb ? 16 : 14,
    },
  };
};