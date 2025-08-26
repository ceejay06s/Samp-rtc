import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NotificationBadgeSimple } from './NotificationBadgeSimple';
import { NotificationIcon } from './NotificationIcon';

interface NotificationWithBadgeProps {
  iconSize?: number;
  badgeSize?: number;
  count?: number;
  showBadge?: boolean;
  badgeVariant?: 'default' | 'alert' | 'count';
  iconVariant?: 'default' | 'active' | 'muted';
}

/**
 * Combined component showing notification icon with optional badge
 * Perfect for navigation bars, headers, and other UI elements
 * 
 * @param iconSize - Size of the notification icon
 * @param badgeSize - Size of the badge overlay
 * @param count - Number to display in the badge
 * @param showBadge - Whether to show the badge
 * @param badgeVariant - Badge variant for different states
 * @param iconVariant - Icon variant for different states
 */
export const NotificationWithBadge: React.FC<NotificationWithBadgeProps> = ({
  iconSize = 24,
  badgeSize = 16,
  count = 0,
  showBadge = false,
  badgeVariant = 'count',
  iconVariant = 'default',
}) => {
  return (
    <View style={styles.container}>
      <NotificationIcon size={iconSize} variant={iconVariant} />
      
      {showBadge && (
        <View style={styles.badgeOverlay}>
          <NotificationBadgeSimple
            size={badgeSize}
            count={count}
            variant={badgeVariant}
            showCount={count > 0}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badgeOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});
