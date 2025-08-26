import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../utils/themes';

interface NotificationBadgeProps {
  size?: number;
  count?: number;
  variant?: 'default' | 'alert' | 'count';
  showCount?: boolean;
}

/**
 * Notification badge component using the exclamation mark icon
 * Can display as an alert indicator or with a count
 * 
 * @param size - Badge size in pixels (default: 16)
 * @param count - Number to display in the badge
 * @param style - Additional styles to apply
 * @param variant - Badge variant for different states
 * @param showCount - Whether to show the count text
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 16,
  count = 0,
  variant = 'default',
  showCount = false,
}) => {
  const theme = useTheme();

  const getBadgeColor = () => {
    switch (variant) {
      case 'alert':
        return theme.colors.error;
      case 'count':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'alert':
        return theme.colors.error + '20';
      case 'count':
        return theme.colors.primary + '20';
      default:
        return theme.colors.border + '40';
    }
  };

  const shouldShowCount = showCount && count > 0;

  // Use Ionicons since badge.png doesn't exist
  const renderIcon = () => {
    return (
      <View style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
          borderRadius: size / 2,
        }
      ]}>
        <Ionicons 
          name="alert-circle" 
          size={size * 0.7} 
          color={getBadgeColor()} 
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderIcon()}
      
      {shouldShowCount && (
        <View style={[styles.countContainer, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.countText, { color: theme.colors.background }]}>
            {count > 99 ? '99+' : count.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
