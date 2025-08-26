import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../utils/themes';

interface NotificationBadgeSimpleProps {
  size?: number;
  count?: number;
  variant?: 'default' | 'alert' | 'count';
  showCount?: boolean;
}

/**
 * Simple notification badge component using only native components
 * No external image dependencies - always works
 */
export const NotificationBadgeSimple: React.FC<NotificationBadgeSimpleProps> = ({
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
        return theme.colors.error;
      case 'count':
        return theme.colors.primary;
      default:
        return theme.colors.border;
    }
  };

  const shouldShowCount = showCount && count > 0;

  if (shouldShowCount) {
    // Show count badge
    return (
      <View style={[
        styles.countBadge,
        {
          backgroundColor: getBackgroundColor(),
          minWidth: size,
          height: size,
          borderRadius: size / 2,
        }
      ]}>
        <Text style={[
          styles.countText,
          {
            color: variant === 'default' ? theme.colors.text : theme.colors.background,
            fontSize: size * 0.6,
          }
        ]}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      </View>
    );
  }

  // Show icon badge
  return (
    <View style={[
      styles.iconBadge,
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
        color={variant === 'default' ? theme.colors.text : theme.colors.background}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  countBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
