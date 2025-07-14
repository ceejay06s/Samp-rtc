import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useTheme } from '../../utils/themes';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  gradient?: 'primary' | 'secondary' | 'accent';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  gradient,
}) => {
  const theme = useTheme();
  const platform = usePlatform();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...theme.shadows.medium,
      // Platform-specific styling
      ...platform.platformStyles[platform.platform],
    };

    const sizeStyles = {
      small: { 
        paddingVertical: theme.spacing.sm, 
        paddingHorizontal: theme.spacing.md,
        minHeight: 36,
      },
      medium: { 
        paddingVertical: theme.spacing.md, 
        paddingHorizontal: theme.spacing.lg,
        minHeight: 48,
      },
      large: { 
        paddingVertical: theme.spacing.lg, 
        paddingHorizontal: theme.spacing.xl,
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        borderWidth: 0,
      },
      accent: {
        backgroundColor: theme.colors.accent,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
        // Ensure outline is visible on all platforms
        ...(platform.isExpoGo && {
          borderWidth: 2,
          borderColor: theme.colors.primary,
        }),
      },
      danger: {
        backgroundColor: theme.colors.error,
        borderWidth: 0,
      },
      gradient: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      disabled && { opacity: 0.6, ...theme.shadows.small },
      style,
    ];
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textAlign: 'center' as const,
      // Ensure text doesn't wrap unnecessarily
      flexShrink: 0,
    };

    const sizeTextStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantTextStyles = {
      primary: { color: 'white' },
      secondary: { color: 'white' },
      accent: { color: 'white' },
      outline: { color: theme.colors.primary },
      danger: { color: 'white' },
      gradient: { color: 'white' },
    };

    return [
      baseTextStyle,
      sizeTextStyles[size],
      variantTextStyles[variant],
    ];
  };

  const getGradientColors = () => {
    if (gradient) {
      return theme.colors.gradient[gradient] as [string, string];
    }
    
    switch (variant) {
      case 'primary':
        return theme.colors.gradient.primary as [string, string];
      case 'secondary':
        return theme.colors.gradient.secondary as [string, string];
      case 'accent':
        return theme.colors.gradient.accent as [string, string];
      default:
        return theme.colors.gradient.primary as [string, string];
    }
  };

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.primary : 'white'}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </>
  );

  // Use gradient for primary, secondary, accent, and gradient variants
  const shouldUseGradient = ['primary', 'secondary', 'accent', 'gradient'].includes(variant);

  if (shouldUseGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          getButtonStyle(),
          { overflow: 'hidden' }
        ]}
      >
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
            borderRadius: theme.borderRadius.medium,
          }}
        />
        {buttonContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}; 