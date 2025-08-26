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

// Cache the platform info to prevent recreation on every call
let cachedPlatformInfo: PlatformInfo | null = null;

export const getPlatformInfo = (): PlatformInfo => {
  // Return cached version if available
  if (cachedPlatformInfo) {
    return cachedPlatformInfo;
  }

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

  // Cache the result
  cachedPlatformInfo = {
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

  return cachedPlatformInfo;
};

// Convenience functions - now these return stable values
export const isAndroid = (): boolean => getPlatformInfo().isAndroid;
export const isIOS = (): boolean => getPlatformInfo().isIOS;
export const isWeb = (): boolean => getPlatformInfo().isWeb;
export const isExpoGo = (): boolean => getPlatformInfo().isExpoGo;
export const isAndroidBrowser = (): boolean => getPlatformInfo().isAndroidBrowser;
export const isStandalone = (): boolean => getPlatformInfo().isStandalone;
export const isMobileBrowser = (): boolean => getPlatformInfo().isMobileBrowser;
export const isDesktopBrowser = (): boolean => getPlatformInfo().isDesktopBrowser;

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

// Cache platform styles to prevent recreation
let cachedPlatformStyles: any = null;

// Platform-specific styling helpers
export const getPlatformStyles = () => {
  // Return cached version if available
  if (cachedPlatformStyles) {
    return cachedPlatformStyles;
  }

  const platformInfo = getPlatformInfo();
  
  // Cache the result
  cachedPlatformStyles = {
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

  return cachedPlatformStyles;
};

// Cache environment config to prevent recreation
let cachedEnvironmentConfig: any = null;

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  // Return cached version if available
  if (cachedEnvironmentConfig) {
    return cachedEnvironmentConfig;
  }

  const platformInfo = getPlatformInfo();
  
  // Cache the result
  cachedEnvironmentConfig = {
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

  return cachedEnvironmentConfig;
};