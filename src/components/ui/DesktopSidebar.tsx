import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface SidebarItem {
  key: string;
  title: string;
  icon: string;
  route: string;
  badge?: number;
}

interface DesktopSidebarProps {
  style?: any;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ style }) => {
  const theme = useTheme();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [widthAnim] = useState(new Animated.Value(240));
  const [opacityAnim] = useState(new Animated.Value(1));

  // Ensure animations are properly initialized
  useEffect(() => {
    widthAnim.setValue(240);
    opacityAnim.setValue(1);
  }, []);

  const sidebarItems: SidebarItem[] = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: '🏠',
      route: '/dashboard',
    },
    {
      key: 'discover',
      title: 'Discover',
      icon: '💕',
      route: '/discover',
    },
    {
      key: 'matches',
      title: 'Matches',
      icon: '❤️',
      route: '/matches',
      badge: 3,
    },
    {
      key: 'messages',
      title: 'Messages',
      icon: '💬',
      route: '/messages',
      badge: 5,
    },
    {
      key: 'menu',
      title: 'Menu',
      icon: '⚙️',
      route: '/menu',
    },
  ];

  const handleTabPress = (item: SidebarItem) => {
    if (pathname !== item.route) {
      router.push(item.route as any);
    }
  };

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: newCollapsed ? 80 : 240,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: newCollapsed ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    
    setIsCollapsed(newCollapsed);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (route: string) => {
    return pathname === route;
  };

  // Fallback styles for web if theme is not available
  const fallbackColors = {
    surface: '#F8F9FA',
    border: '#E5E7EB',
    primary: '#FF2E63',
    textSecondary: '#6B7280',
    surfaceVariant: '#FFF5F7',
    error: '#EF4444',
  };

  const currentColors = theme?.colors || fallbackColors;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: currentColors.surface,
          borderRightColor: currentColors.border,
          width: widthAnim,
        },
        style
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <Animated.View style={[styles.logoContainer, { opacity: opacityAnim }]}>
          {!isCollapsed && (
            <Text style={[styles.logo, { color: currentColors.primary }]}>
              Spark
            </Text>
          )}
        </Animated.View>
        <TouchableOpacity
          style={[styles.collapseButton, { backgroundColor: currentColors.surfaceVariant }]}
          onPress={handleToggleCollapse}
          activeOpacity={0.7}
        >
          <Text style={[styles.collapseIcon, { color: currentColors.textSecondary }]}>
            {isCollapsed ? '→' : '←'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <View style={styles.navContainer}>
        {sidebarItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navItem,
              isCollapsed && styles.navItemCollapsed,
              isActive(item.route) && { 
                backgroundColor: currentColors.surfaceVariant,
                borderLeftColor: currentColors.primary,
                borderLeftWidth: 3,
              }
            ]}
            onPress={() => handleTabPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={[
                styles.icon,
                { color: currentColors.textSecondary },
                isActive(item.route) && { color: currentColors.primary }
              ]}>
                {item.icon}
              </Text>
              {item.badge && item.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </View>
            <Animated.View style={[styles.titleContainer, { opacity: opacityAnim }]}>
              {!isCollapsed && (
                <Text style={[
                  styles.title,
                  { color: currentColors.textSecondary },
                  isActive(item.route) && { color: currentColors.primary, fontWeight: '600' }
                ]}>
                  {item.title}
                </Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer with Sign Out */}
      <View style={[styles.footer, { borderTopColor: currentColors.border }]}>
        <Animated.View style={[styles.footerTextContainer, { opacity: opacityAnim }]}>
          {!isCollapsed && (
            <Text style={[styles.footerText, { color: currentColors.textSecondary }]}>
              Dating App v1.0
            </Text>
          )}
        </Animated.View>
        <TouchableOpacity
          style={[
            styles.signOutButton, 
            { backgroundColor: currentColors.error },
            isCollapsed && styles.signOutButtonCollapsed
          ]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={[styles.signOutIcon, { color: 'white' }]}>
            🚪
          </Text>
          <Animated.View style={[styles.signOutTextContainer, { opacity: opacityAnim }]}>
            {!isCollapsed && (
              <Text style={[styles.signOutText, { color: 'white' }]}>
                Sign Out
              </Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    // Web-specific styles using React Native properties
    ...(Platform.OS === 'web' && {
      position: 'relative',
      zIndex: 1000,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    minHeight: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  collapseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseIcon: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  navContainer: {
    flex: 1,
    paddingVertical: getResponsiveSpacing('md'),
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    marginHorizontal: getResponsiveSpacing('sm'),
    marginVertical: 2,
    borderRadius: getResponsiveSpacing('sm'),
    borderLeftWidth: 0,
    minHeight: 48,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: getResponsiveFontSize('md'),
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('md'),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    borderTopWidth: 1,
  },
  footerTextContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  footerText: {
    fontSize: getResponsiveFontSize('xs'),
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    minHeight: 40,
  },
  signOutButtonCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  signOutIcon: {
    fontSize: getResponsiveFontSize('md'),
  },
  signOutTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('sm'),
  },
}); 