import { router, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { IconNames, MaterialIcon } from './MaterialIcon';

interface ToolbarItem {
  key: string;
  title: string;
  icon: keyof typeof IconNames;
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

  const handleTabPress = (item: ToolbarItem) => {
    if (pathname !== item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
      },
      style
    ]}>
      {toolbarItems.map((item) => {
        const isActive = pathname === item.route;
        
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.tabItem}
            onPress={() => handleTabPress(item)}
          >
            <View style={styles.iconContainer}>
              <MaterialIcon
                name={IconNames[item.icon]}
                size={24}
                color={isActive ? theme.colors.primary : theme.colors.textSecondary}
              />
              {item.badge && item.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.badgeText, { color: 'white' }]}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.tabLabel,
              { color: isActive ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('xs'),
    // Add shadow for better visual separation
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xs'),
    paddingHorizontal: getResponsiveSpacing('xs'),
  },
  iconContainer: {
    position: 'relative',
    marginBottom: getResponsiveSpacing('xs'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: 'bold',
  },
}); 