import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate scale based on design width (375px for iPhone 11 Pro)
// For web, use a more conservative scale to prevent oversized elements
const getScale = () => {
  if (Platform.OS === 'web') {
    // On web, use a more conservative scale to prevent oversized elements
    const baseWidth = 375;
    const scale = Math.min(SCREEN_WIDTH / baseWidth, 1.5); // Cap at 1.5x
    return Math.max(scale, 0.8); // Minimum 0.8x
  }
  return SCREEN_WIDTH / 375;
};

const scale = getScale();

// Viewport dimensions
export const viewport = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale,
  pixelRatio: PixelRatio.get(),
};

// Dynamic viewport that updates on orientation change
export const getViewport = () => {
  const { width, height } = Dimensions.get('window');
  const currentScale = Platform.OS === 'web' 
    ? Math.min(Math.max(width / 375, 0.8), 1.5)
    : width / 375;
  
  return {
    width,
    height,
    scale: currentScale,
    pixelRatio: PixelRatio.get(),
  };
};

// Device type detection
export const deviceType = {
  isPhone: SCREEN_WIDTH < 768,
  isTablet: SCREEN_WIDTH >= 768,
  isSmallPhone: SCREEN_WIDTH < 375,
  isMediumPhone: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargePhone: SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768,
  isSmallTablet: SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024,
  isLargeTablet: SCREEN_WIDTH >= 1024,
};

// Screen size breakpoints
export const breakpoints = {
  xs: 375,    // Small phones
  sm: 414,    // Large phones
  md: 768,    // Tablets
  lg: 1024,   // Large tablets
  xl: 1200,   // Desktop
};

// Responsive breakpoint helpers
export const isBreakpoint = {
  xs: SCREEN_WIDTH < breakpoints.xs,
  sm: SCREEN_WIDTH >= breakpoints.xs && SCREEN_WIDTH < breakpoints.sm,
  md: SCREEN_WIDTH >= breakpoints.sm && SCREEN_WIDTH < breakpoints.md,
  lg: SCREEN_WIDTH >= breakpoints.md && SCREEN_WIDTH < breakpoints.lg,
  xl: SCREEN_WIDTH >= breakpoints.lg,
};

// Orientation detection
export const getOrientation = () => {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape' : 'portrait';
};

export const isLandscape = getOrientation() === 'landscape';
export const isPortrait = getOrientation() === 'portrait';

// Status bar height
export const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
};

// Safe area helpers
export const getSafeAreaInsets = () => {
  const statusBarHeight = getStatusBarHeight();
  return {
    top: statusBarHeight,
    bottom: Platform.OS === 'ios' ? 34 : 0, // iPhone home indicator
    left: 0,
    right: 0,
  };
};

// Normalize function for consistent scaling
export const normalize = (size: number): number => {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Width and height percentage helpers
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive spacing system
export const getResponsiveSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): number => {
  const spacingMap = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };
  
  // For web, use more conservative spacing
  if (Platform.OS === 'web') {
    const baseSpacing = spacingMap[size];
    return Math.round(baseSpacing * Math.min(scale, 1.2));
  }
  
  return normalize(spacingMap[size]);
};

// Responsive font size system
export const getResponsiveFontSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): number => {
  const fontSizeMap = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  };
  
  // For web, use more conservative font sizes
  if (Platform.OS === 'web') {
    const baseFontSize = fontSizeMap[size];
    return Math.round(baseFontSize * Math.min(scale, 1.1));
  }
  
  return normalize(fontSizeMap[size]);
};

// Responsive padding/margin helpers
export const getResponsivePadding = (sides: 'all' | 'horizontal' | 'vertical' | 'top' | 'bottom' | 'left' | 'right', size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): any => {
  const paddingValue = getResponsiveSpacing(size);
  
  switch (sides) {
    case 'all':
      return { padding: paddingValue };
    case 'horizontal':
      return { paddingHorizontal: paddingValue };
    case 'vertical':
      return { paddingVertical: paddingValue };
    case 'top':
      return { paddingTop: paddingValue };
    case 'bottom':
      return { paddingBottom: paddingValue };
    case 'left':
      return { paddingLeft: paddingValue };
    case 'right':
      return { paddingRight: paddingValue };
    default:
      return { padding: paddingValue };
  }
};

// Responsive margin helpers
export const getResponsiveMargin = (sides: 'all' | 'horizontal' | 'vertical' | 'top' | 'bottom' | 'left' | 'right', size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): any => {
  const marginValue = getResponsiveSpacing(size);
  
  switch (sides) {
    case 'all':
      return { margin: marginValue };
    case 'horizontal':
      return { marginHorizontal: marginValue };
    case 'vertical':
      return { marginVertical: marginValue };
    case 'top':
      return { marginTop: marginValue };
    case 'bottom':
      return { marginBottom: marginValue };
    case 'left':
      return { marginLeft: marginValue };
    case 'right':
      return { marginRight: marginValue };
    default:
      return { margin: marginValue };
  }
};

// Responsive border radius
export const getResponsiveBorderRadius = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): number => {
  const borderRadiusMap = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  };
  
  return normalize(borderRadiusMap[size]);
};

// Responsive icon size
export const getResponsiveIconSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): number => {
  const iconSizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  };
  
  return normalize(iconSizeMap[size]);
};

// Responsive button height
export const getResponsiveButtonHeight = (size: 'sm' | 'md' | 'lg'): number => {
  const buttonHeightMap = {
    sm: 36,
    md: 48,
    lg: 56,
  };
  
  return normalize(buttonHeightMap[size]);
};

// Responsive card dimensions
export const getResponsiveCardDimensions = () => {
  if (deviceType.isPhone) {
    return {
      width: SCREEN_WIDTH - getResponsiveSpacing('lg') * 2,
      height: normalize(200),
      borderRadius: getResponsiveBorderRadius('md'),
    };
  } else {
    return {
      width: normalize(300),
      height: normalize(250),
      borderRadius: getResponsiveBorderRadius('lg'),
    };
  }
};

// Responsive grid columns
export const getResponsiveGridColumns = (): number => {
  if (deviceType.isPhone) {
    return 1;
  } else if (deviceType.isSmallTablet) {
    return 2;
  } else {
    return 3;
  }
};

// Responsive list item height
export const getResponsiveListItemHeight = (): number => {
  if (deviceType.isPhone) {
    return normalize(60);
  } else {
    return normalize(80);
  }
};

// Listen for dimension changes (orientation, etc.)
export const addDimensionListener = (callback: (dimensions: { width: number; height: number }) => void) => {
  return Dimensions.addEventListener('change', ({ window }) => {
    callback(window);
  });
};

// Legacy exports for backward compatibility
export const isSmallDevice = deviceType.isSmallPhone;
export const isMediumDevice = deviceType.isMediumPhone;
export const isLargeDevice = deviceType.isLargePhone; 