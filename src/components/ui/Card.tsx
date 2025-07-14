import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../utils/themes';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  disabled?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'gradient' | 'elevated';
  gradient?: 'primary' | 'secondary' | 'accent' | 'card';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  padding = 'medium',
  variant = 'default',
  gradient,
}) => {
  const theme = useTheme();

  const getCardStyle = () => {
    const paddingMap = {
      none: 0,
      small: theme.spacing.sm,
      medium: theme.spacing.md,
      large: theme.spacing.lg,
    };

    const baseStyle = {
      borderRadius: theme.borderRadius.large,
      borderWidth: variant === 'default' ? 1 : 0,
      borderColor: theme.colors.border,
      padding: paddingMap[padding],
    };

    const variantStyles = {
      default: {
        backgroundColor: theme.colors.surface,
        ...theme.shadows.small,
      },
      elevated: {
        backgroundColor: theme.colors.surface,
        ...theme.shadows.medium,
      },
      gradient: {
        backgroundColor: 'transparent',
        ...theme.shadows.medium,
      },
    };

    return [
      baseStyle,
      variantStyles[variant],
      disabled && { opacity: 0.6 },
      style,
    ];
  };

  const getGradientColors = () => {
    if (gradient) {
      return theme.colors.gradient[gradient] as [string, string];
    }
    return theme.colors.gradient.card as [string, string];
  };

  const cardContent = (
    <>
      {variant === 'gradient' && (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.large,
          }}
        />
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          getCardStyle(),
          variant === 'gradient' && { overflow: 'hidden' }
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View 
      style={[
        getCardStyle(),
        variant === 'gradient' && { overflow: 'hidden' }
      ]}
    >
      {cardContent}
    </View>
  );
}; 