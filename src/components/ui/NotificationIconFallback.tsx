import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/themes';

interface NotificationIconFallbackProps {
  size?: number;
  style?: any;
  variant?: 'default' | 'active' | 'muted';
}

/**
 * Fallback notification icon using Ionicons
 * Use this when the image-based NotificationIcon has issues
 */
export const NotificationIconFallback: React.FC<NotificationIconFallbackProps> = ({
  size = 24,
  style,
  variant = 'default',
}) => {
  const theme = useTheme();

  const getIconColor = () => {
    switch (variant) {
      case 'active':
        return theme.colors.primary;
      case 'muted':
        return theme.colors.textSecondary;
      default:
        return theme.colors.text;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Ionicons 
        name="notifications" 
        size={size} 
        color={getIconColor()} 
        style={style}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
