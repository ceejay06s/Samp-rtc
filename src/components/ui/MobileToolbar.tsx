import { router, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface ToolbarItem {
  key: string;
  title: string;
  icon: string;
  route: string;
  badge?: number;
}

interface MobileToolbarProps {
  style?: any;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({ style }) => {
  const theme = useTheme();
  const pathname = usePathname();

  const toolbarItems: ToolbarItem[] = [
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

  const handleTabPress = (item: ToolbarItem) => {
    if (pathname !== item.route) {
      router.push(item.route as any);
    }
  };

  const isActive = (route: string) => {
    return pathname === route;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }, style]}>
      {toolbarItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.tab,
            isActive(item.route) && { backgroundColor: theme.colors.surfaceVariant }
          ]}
          onPress={() => handleTabPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Text style={[
              styles.icon,
              { color: theme.colors.textSecondary },
              isActive(item.route) && { color: theme.colors.primary }
            ]}>
              {item.icon}
            </Text>
            {item.badge && item.badge > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.badgeText}>
                  {item.badge > 99 ? '99+' : item.badge}
                </Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.title,
            { color: theme.colors.textSecondary },
            isActive(item.route) && { color: theme.colors.primary, fontWeight: '600' }
          ]}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    minHeight: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('sm'),
    minHeight: 50,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: getResponsiveSpacing('xs'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: getResponsiveFontSize('md'),
  },
  title: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 12,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
}); 