import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FullscreenConfig, useFullscreen } from '../../services/fullscreen';
import { useTheme } from '../../utils/themes';

interface FullscreenToggleProps {
  config?: FullscreenConfig;
  style?: any;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button' | 'text';
}

export const FullscreenToggle: React.FC<FullscreenToggleProps> = ({
  config,
  style,
  showLabel = false,
  size = 'medium',
  variant = 'icon',
}) => {
  const theme = useTheme();
  const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen();

  const handlePress = async () => {
    if (isSupported) {
      await toggleFullscreen(config);
    }
  };

  const getIcon = () => {
    return isFullscreen ? '⛶' : '⛶';
  };

  const getLabel = () => {
    return isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 16, padding: 8 };
      case 'large':
        return { fontSize: 24, padding: 16 };
      default:
        return { fontSize: 20, padding: 12 };
    }
  };

  if (!isSupported) {
    return null; // Don't render if fullscreen is not supported
  }

  if (variant === 'text') {
    return (
      <TouchableOpacity
        style={[styles.textButton, { padding: getSizeStyles().padding }, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.text,
          { 
            fontSize: getSizeStyles().fontSize,
            color: theme.colors.primary 
          }
        ]}>
          {getLabel()}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'button') {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: theme.colors.primary,
            padding: getSizeStyles().padding,
          },
          style
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.buttonText,
          { fontSize: getSizeStyles().fontSize }
        ]}>
          {getIcon()}
        </Text>
        {showLabel && (
          <Text style={[styles.buttonLabel, { color: 'white' }]}>
            {getLabel()}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Default icon variant
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { 
          backgroundColor: theme.colors.surface,
          padding: getSizeStyles().padding,
        },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.icon,
        { 
          fontSize: getSizeStyles().fontSize,
          color: theme.colors.primary 
        }
      ]}>
        {getIcon()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  textButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontWeight: '600',
  },
}); 