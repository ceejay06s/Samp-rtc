import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../utils/themes';

interface DatingIconProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'heart' | 'star' | 'sparkle';
  style?: any;
}

export const DatingIcon: React.FC<DatingIconProps> = ({
  size = 'medium',
  variant = 'heart',
  style,
}) => {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 80;
      default: return 48;
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'star': return '⭐';
      case 'sparkle': return '✨';
      default: return '❤️';
    }
  };

  const getGradientColors = () => {
    switch (variant) {
      case 'star': return theme.colors.gradient.accent as [string, string];
      case 'sparkle': return theme.colors.gradient.secondary as [string, string];
      default: return theme.colors.gradient.primary as [string, string];
    }
  };

  const iconSize = getSize();
  const borderRadius = iconSize / 2;

  return (
    <View style={[styles.container, { width: iconSize, height: iconSize }, style]}>
      <LinearGradient
        colors={getGradientColors()}
        style={[
          styles.gradient,
          {
            width: iconSize,
            height: iconSize,
            borderRadius,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.icon, { fontSize: iconSize * 0.6 }]}>
          {getIcon()}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
}); 