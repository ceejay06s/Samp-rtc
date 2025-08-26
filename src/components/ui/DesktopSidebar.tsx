import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { config } from '../../../lib/config';
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentWidth, setCurrentWidth] = useState(240); // Track current width for debugging

  // Ensure animations are properly initialized
  useEffect(() => {
    widthAnim.setValue(240);
    opacityAnim.setValue(1);
  }, []);

  // Listen to width animation changes for debugging
  useEffect(() => {
    const listener = widthAnim.addListener(({ value }) => {
      setCurrentWidth(value);
    });
    return () => widthAnim.removeListener(listener);
  }, [widthAnim]);

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
      icon: 'menu',
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
    console.log('🔄 Toggle collapse:', { current: isCollapsed, new: newCollapsed });
    
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: newCollapsed ? 60 : 240,
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
    console.log('✅ Collapse state updated:', newCollapsed);
  };

  const handleSignOut = async () => {
    WebAlert.showConfirmation(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        try {
          console.log('🔐 DesktopSidebar: Starting sign out process');
          await signOut();
          console.log('✅ DesktopSidebar: Sign out successful, redirecting to homepage');
          router.replace('/welcome');
        } catch (error) {
          console.error('❌ DesktopSidebar: Sign out error:', error);
          WebAlert.showError(
            'Sign Out Failed', 
            'Failed to sign out. Please try again. If the problem persists, please refresh the page.'
          );
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
      <View style={[
        styles.header, 
        isCollapsed && styles.headerCollapsed,
        { 
          borderBottomColor: currentColors.border,
          justifyContent: isCollapsed ? 'center' : 'space-between',
          paddingHorizontal: isCollapsed ? 0 : getResponsiveSpacing('md'),
        }
      ]}>
        {!isCollapsed && (
          <Animated.View style={[styles.headerContent, { opacity: opacityAnim }]}>
            <Text style={[styles.title, { color: currentColors.text }]}>
              Dating App
            </Text>
          </Animated.View>
        )}
        <TouchableOpacity
          style={[
            styles.collapseButton, 
            isCollapsed && styles.collapseButtonCollapsed,
            { 
              backgroundColor: currentColors.background,
            }
          ]}
          onPress={handleToggleCollapse}
        >
          <MaterialIcon
            name={isCollapsed ? 'arrow-forward' : 'arrow-back'}
            size={isCollapsed ? 16 : 20}
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
                isCollapsed && styles.navItemCollapsed,
              ]}
              onPress={() => handleTabPress(item)}
              {...(Platform.OS === 'web' && {
                onMouseEnter: () => isCollapsed && setHoveredItem(item.key),
                onMouseLeave: () => setHoveredItem(null),
              })}
            >
              <View style={[
                styles.iconContainer,
                isCollapsed && styles.iconContainerCollapsed
              ]}>
                <MaterialIcon
                  name={IconNames[item.icon]}
                  size={24}
                  color={isActive ? currentColors.primary : currentColors.textSecondary}
                />
                {item.badge && item.badge > 0 && (
                  <View style={[
                    styles.badge, 
                    { backgroundColor: currentColors.primary },
                    isCollapsed && styles.badgeCollapsed
                  ]}>
                    <Text style={[styles.badgeText, { color: 'white' }]}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}
              </View>
              {!isCollapsed && (
                <Animated.View style={[styles.labelContainer, { opacity: opacityAnim }]}>
                  <Text style={[
                    styles.navLabel,
                    { color: isActive ? currentColors.primary : currentColors.textSecondary }
                  ]}>
                    {item.title}
                  </Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tooltip for collapsed state */}
      {isCollapsed && hoveredItem && Platform.OS === 'web' && (
        <View style={[
          styles.tooltip,
          { 
            backgroundColor: currentColors.surface,
            borderColor: currentColors.border,
          }
        ]}>
          <Text style={[styles.tooltipText, { color: currentColors.text }]}>
            {sidebarItems.find(item => item.key === hoveredItem)?.title}
          </Text>
        </View>
      )}

      {/* Version Number */}
      <View style={[
        styles.versionContainer,
        { 
          borderTopColor: currentColors.border,
          padding: isCollapsed ? getResponsiveSpacing('xs') : getResponsiveSpacing('sm'),
        }
      ]}>
        {!isCollapsed && (
          <Animated.View style={[styles.versionText, { opacity: opacityAnim }]}>
            <Text style={[styles.versionLabel, { color: currentColors.textSecondary }]}>
              v{config.app.version}
            </Text>
          </Animated.View>
        )}
        {isCollapsed && (
          <Text style={[styles.versionLabelCollapsed, { color: currentColors.textSecondary }]}>
            v{config.app.version.split('.').slice(0, 2).join('.')}
          </Text>
        )}
      </View>

      {/* Sign Out Button */}
      <View style={[
        styles.footer, 
        isCollapsed && styles.footerCollapsed,
        { 
          borderTopColor: currentColors.border,
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.signOutButton, 
            isCollapsed && styles.signOutButtonCollapsed,
            { 
              backgroundColor: currentColors.primary,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }
          ]}
          onPress={handleSignOut}
        >
          <MaterialIcon
            name={IconNames.logout}
            size={isCollapsed ? 16 : 20}
            color="white"
          />
          {!isCollapsed && (
            <Animated.View style={[styles.signOutLabelContainer, { opacity: opacityAnim }]}>
              <Text style={styles.signOutLabel}>
                Sign Out
              </Text>
            </Animated.View>
          )}
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
    minHeight: 50,
  },
  headerCollapsed: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
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
  collapseButtonCollapsed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    flex: 1,
    paddingVertical: getResponsiveSpacing('sm'),
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('sm'),
    borderRadius: 8,
    minHeight: 40,
  },
  navItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: 'transparent', // This will be overridden by the inline style
  },
  navItemCollapsed: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: getResponsiveSpacing('xs'),
    marginHorizontal: 0,
    width: '100%',
    minHeight: 36,
  },
  iconContainer: {
    position: 'relative',
    marginRight: getResponsiveSpacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerCollapsed: {
    marginRight: 0,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
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
  badgeCollapsed: {
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
  },
  tooltip: {
    position: 'absolute' as any,
    left: 70,
    top: 0,
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  tooltipText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
  },
  footer: {
    padding: getResponsiveSpacing('md'),
    borderTopWidth: 1,
    minHeight: 50,
  },
  footerCollapsed: {
    padding: getResponsiveSpacing('xs'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionContainer: {
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 30,
  },
  versionText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionLabel: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '400',
    textAlign: 'center',
  },
  versionLabelCollapsed: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '400',
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 8,
    minHeight: 36,
  },
  signOutButtonCollapsed: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: getResponsiveSpacing('xs'),
    minHeight: 36,
    width: '100%',
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