import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ViewStyle } from 'react-native';
import { useTheme } from '../utils/themes';

interface GradientBackgroundProps {
  children: React.ReactNode;
  gradient?: 'primary' | 'secondary' | 'accent' | 'background' | 'card';
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  gradient = 'background',
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}) => {
  const theme = useTheme();
  const colors = theme.colors.gradient[gradient];

  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}; 