import React, { useState } from 'react';
import { Image, ImageProps, StyleSheet, View } from 'react-native';
import { useTheme } from '../../utils/themes';
import { BrokenImageIcon } from './BrokenImageIcon';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSize?: number;
  fallbackColor?: string;
  showFallbackText?: boolean;
  fallbackText?: string;
  onImageError?: (error: any) => void;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  source,
  style,
  fallbackSize = 48,
  fallbackColor,
  showFallbackText = false,
  fallbackText = 'Image not available',
  onImageError,
  ...props
}) => {
  const theme = useTheme();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (error: any) => {
    console.warn('Image failed to load:', source, error);
    setHasError(true);
    setIsLoading(false);
    onImageError?.(error);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // If there's an error, show broken image icon
  if (hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <BrokenImageIcon
          size={fallbackSize}
          color={fallbackColor}
          showText={showFallbackText}
          text={fallbackText}
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={[styles.image, style]}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    // Default image styles
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
}); 