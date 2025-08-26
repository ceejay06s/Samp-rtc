import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, ImageStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/themes';

interface NotificationIconProps {
  size?: number;
  style?: ImageStyle;
  variant?: 'default' | 'active' | 'muted';
}

/**
 * Custom notification icon component using the bell icon image
 * 
 * @param size - Icon size in pixels (default: 24)
 * @param style - Additional styles to apply
 * @param variant - Icon variant for different states
 *   - 'default': Uses theme text color
 *   - 'active': Uses theme primary color
 *   - 'muted': Uses theme secondary text color
 */
export const NotificationIcon: React.FC<NotificationIconProps> = ({
  size = 24,
  style,
  variant = 'default',
}) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  const getIconSource = () => {
    // Use favicon.png as a fallback since other icons may not be available
    return require('../../../assets/images/favicon.png');
  };

  const getTintColor = () => {
    switch (variant) {
      case 'active':
        return theme.colors.primary;
      case 'muted':
        return theme.colors.textSecondary;
      default:
        return theme.colors.text;
    }
  };

  // If image failed to load, fall back to Ionicons
  if (imageError) {
    return (
      <Ionicons 
        name="notifications" 
        size={size} 
        color={getTintColor()} 
        style={style}
      />
    );
  }

  return (
    <Image
      source={getIconSource()}
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          tintColor: getTintColor(),
        },
        style,
      ]}
      resizeMode="contain"
      onError={() => setImageError(true)}
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    // Base icon styles - can be extended with additional styling if needed
  },
});
