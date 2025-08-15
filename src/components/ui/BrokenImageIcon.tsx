import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface BrokenImageIconProps {
  size?: number;
  color?: string;
  style?: any;
  showText?: boolean;
  text?: string;
}

export const BrokenImageIcon: React.FC<BrokenImageIconProps> = ({
  size = 48,
  color,
  style,
  showText = false,
  text = 'Image not available'
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      <MaterialIcons 
        name="broken-image" 
        size={size} 
        color={iconColor} 
      />
      {showText && (
        <View style={styles.textContainer}>
          <MaterialIcons 
            name="info-outline" 
            size={16} 
            color={iconColor} 
            style={styles.infoIcon}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  textContainer: {
    marginTop: getResponsiveSpacing('xs'),
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: getResponsiveSpacing('xs'),
  },
}); 