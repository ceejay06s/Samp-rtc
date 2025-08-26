// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv/config');
} catch (error) {
  console.warn('dotenv not available, using default values');
}

export default {
  name: 'Samp-rtc',
  slug: 'Samp-rtc',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'samp-rtc',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.samp-rtc',
    deploymentTarget: '15.4',
    infoPlist: {
      UIViewControllerBasedStatusBarAppearance: false,
      UIStatusBarHidden: false,
      UIStatusBarStyle: 'UIStatusBarStyleDefault',
      UIStatusBarAnimation: 'UIStatusBarAnimationSlide',
      NSCameraUsageDescription: 'This app needs access to camera to take profile photos.',
      NSPhotoLibraryUsageDescription: 'This app needs access to photo library to select profile photos.',
      NSLocationWhenInUsePermission: 'This app needs access to your location to find nearby places and improve your dating experience.',
      NSLocationAlwaysAndWhenInUsePermission: 'This app needs access to your location to find nearby places and improve your dating experience.',
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    edgeToEdgeEnabled: true,
    package: 'com.christianbalais06.Samprtc',
    androidNavigationBar: {
      visible: 'leanback'
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.RECORD_AUDIO'
    ]
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you share them with your friends.',
        cameraPermission: 'The app accesses your camera to take photos for your profile.'
      }
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'The app accesses your photos to let you select profile pictures.',
        savePhotosPermission: 'The app saves photos to your photo library.'
      }
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'This app needs access to your location to find nearby places and improve your dating experience.',
        locationAlwaysAndWhenInUsePermission: 'This app needs access to your location to find nearby places and improve your dating experience.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    env: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xbcrxnebziipzqoorkti.supabase.co',
      EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_0sql0alZjTpYFGjMaUT7Rg_L-hWaeZo',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiY3J4bmViemlpcHpxb29ya3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTQyNTYsImV4cCI6MjA2Nzg5MDI1Nn0.oAETtcpGaNvvF-MWxN5zwIqJEwaW4u8XRbDu3BIfQ5g',
      EXPO_PUBLIC_APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Samp-rtc',
      EXPO_PUBLIC_APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      EXPO_PUBLIC_API_KEY: process.env.EXPO_PUBLIC_API_KEY || 'iIFhwGAtOcaX3V20SXhH21t8uogfbXPaJTkfU_8Z',
      EXPO_PUBLIC_GIPHY_API_KEY: process.env.EXPO_PUBLIC_GIPHY_API_KEY || 'K561QAO7slfK8l7zgjVLLCP6b5Fg9Wki',
      EXPO_PUBLIC_VAPID_PUBLIC_KEY: process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || 'BGt6PrOD5VwzZBM9HnMKSjLwHD8yrakP8ggYIJ1NhBJfSyPlRLXRFCCobSMMq_6b4EwbPozBJKMae290A_24ETA',
      EXPO_PUBLIC_ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS || 'true',
      EXPO_PUBLIC_ENABLE_CRASH_REPORTING: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING || 'true',
    },
    eas: {
      projectId: '3b50b9bb-f3b5-41b7-a9a0-1f7bc71f2ffe',
    },
  }
};
