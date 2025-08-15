import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { DesktopSidebar, MobileToolbar } from '../src/components/ui';
import { useNavigationTracking } from '../src/hooks/useNavigationTracking';
import { usePlatform } from '../src/hooks/usePlatform';

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const platform = usePlatform();
  const { user } = useAuth();
  
  // Track navigation for referrer functionality
  useNavigationTracking();

  return (
    <>
      <StatusBar hidden={true} />
      <View style={styles.container}>
        {/* Desktop Sidebar - only show on desktop web browsers when logged in */}
        {platform.isDesktopBrowser && user && (
          <DesktopSidebar style={styles.sidebar} />
        )}
        
        {/* Main Content Area */}
        <View style={[styles.content, platform.isDesktopBrowser && styles.desktopContent]}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="discover" />
            <Stack.Screen name="matches" />
            <Stack.Screen name="messages" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="menu" />
            <Stack.Screen name="preferences" />
            <Stack.Screen name="user-profile" />
            <Stack.Screen name="chat" />
          </Stack>
          
          {/* Mobile Toolbar - show on mobile devices and mobile browsers only when logged in */}
          {user && (platform.isAndroid || platform.isIOS || platform.isMobileBrowser) && <MobileToolbar />}
        </View>
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    // Web-specific styles using React Native properties
    ...(Platform.OS === 'web' && {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }),
  },
  sidebar: {
    zIndex: 1000,
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      position: 'relative',
      flexShrink: 0,
    }),
  },
  content: {
    flex: 1,
    // Web-specific styles
    ...(Platform.OS === 'web' && {
      position: 'relative',
    }),
  },
  desktopContent: {
    // Desktop content takes remaining space after sidebar
    ...(Platform.OS === 'web' && {
      display: 'flex',
      flexDirection: 'column',
    }),
  },
}); 