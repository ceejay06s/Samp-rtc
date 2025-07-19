import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { IconNames, MaterialIcon } from './MaterialIcon';
import { WebAlert } from './WebAlert';

interface SidebarItem {
  key: string;
  title: string;
  icon: keyof typeof IconNames;
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
      icon: 'home',
      route: '/dashboard',
    },
    {
      key: 'discover',
      title: 'Discover',
      icon: 'discover',
      route: '/discover',
    },
    {
      key: 'matches',
      title: 'Matches',
      icon: 'matches',
      route: '/matches',
      badge: 3,
    },
    {
      key: 'messages',
      title: 'Messages',
      icon: 'messages',
      route: '/messages',
      badge: 5,
    },
    {
      key: 'menu',
      title: 'Menu',
      icon: 'settings',
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
    WebAlert.showConfirmation(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        try {
          await signOut();
          router.replace('/login');
        } catch (error) {
          console.error('Error signing out:', error);
          WebAlert.showError('Error', 'Failed to sign out. Please try again.');
        }
      }
    );
  };

  const currentColors = theme.colors;

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: currentColors.surface,
        borderRightColor: currentColors.border,
        width: widthAnim,
      },
      style
    ]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentColors.border }]}>
        <Animated.View style={[styles.headerContent, { opacity: opacityAnim }]}>
          <Text style={[styles.title, { color: currentColors.text }]}>
            Dating App
          </Text>
        </Animated.View>
        <TouchableOpacity
          style={[styles.collapseButton, { backgroundColor: currentColors.background }]}
          onPress={handleToggleCollapse}
        >
          <MaterialIcon
            name={isCollapsed ? IconNames.forward : IconNames.back}
            size={20}
            color={currentColors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <View style={styles.nav}>
        {sidebarItems.map((item) => {
          const isActive = pathname === item.route;
          
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.navItem,
                isActive && [styles.navItemActive, { backgroundColor: currentColors.primary + '20' }],
              ]}
              onPress={() => handleTabPress(item)}
            >
              <View style={styles.iconContainer}>
                <MaterialIcon
                  name={IconNames[item.icon]}
                  size={24}
                  color={isActive ? currentColors.primary : currentColors.textSecondary}
                />
                {item.badge && item.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: currentColors.primary }]}>
                    <Text style={[styles.badgeText, { color: 'white' }]}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Animated.View style={[styles.labelContainer, { opacity: opacityAnim }]}>
                <Text style={[
                  styles.navLabel,
                  { color: isActive ? currentColors.primary : currentColors.textSecondary }
                ]}>
                  {item.title}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sign Out Button */}
      <View style={[styles.footer, { borderTopColor: currentColors.border }]}>
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: currentColors.primary }]}
          onPress={handleSignOut}
        >
          <MaterialIcon
            name={IconNames.logout}
            size={20}
            color="white"
          />
          <Animated.View style={[styles.signOutLabelContainer, { opacity: opacityAnim }]}>
            <Text style={styles.signOutLabel}>
              Sign Out
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative' as any,
    zIndex: 1000,
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    // Add shadow for better visual separation
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    minHeight: 60,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
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
  nav: {
    flex: 1,
    paddingVertical: getResponsiveSpacing('md'),
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('sm'),
    borderRadius: 8,
    minHeight: 48,
  },
  navItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: 'transparent', // This will be overridden by the inline style
  },
  iconContainer: {
    position: 'relative',
    marginRight: getResponsiveSpacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: 'bold',
  },
  footer: {
    padding: getResponsiveSpacing('md'),
    borderTopWidth: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 8,
    minHeight: 40,
  },
  signOutLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  signOutLabel: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginLeft: getResponsiveSpacing('sm'),
    color: 'white',
  },
}); 