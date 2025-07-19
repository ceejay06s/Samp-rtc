import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface ListItemProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  disabled?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'elevated' | 'compact';
  showBorder?: boolean;
  activeOpacity?: number;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  padding = 'medium',
  variant = 'default',
  showBorder = true,
  activeOpacity = 0.7,
}) => {
  const theme = useTheme();

  const getListItemStyle = () => {
    const paddingMap = {
      none: 0,
      small: getResponsiveSpacing('sm'),
      medium: getResponsiveSpacing('md'),
      large: getResponsiveSpacing('lg'),
    };

    const baseStyle = {
      borderRadius: theme.borderRadius.medium,
      padding: paddingMap[padding],
      minHeight: getResponsiveSpacing('xl'),
    };

    const variantStyles = {
      default: {
        backgroundColor: theme.colors.surface,
        borderWidth: showBorder ? 1 : 0,
        borderColor: theme.colors.border,
      },
      elevated: {
        backgroundColor: theme.colors.surface,
        borderWidth: showBorder ? 1 : 0,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
      compact: {
        backgroundColor: theme.colors.surface,
        borderWidth: showBorder ? 1 : 0,
        borderColor: theme.colors.border,
        minHeight: getResponsiveSpacing('lg'),
      },
    };

    return [
      baseStyle,
      variantStyles[variant],
      disabled && { opacity: 0.6 },
      style,
    ];
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getListItemStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={getListItemStyle()}>
      {children}
    </View>
  );
}; 