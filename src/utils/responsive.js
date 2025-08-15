"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLargeDevice = exports.isMediumDevice = exports.isSmallDevice = exports.addDimensionListener = exports.getResponsiveListItemHeight = exports.getResponsiveGridColumns = exports.getResponsiveCardDimensions = exports.getResponsiveButtonHeight = exports.getResponsiveIconSize = exports.getResponsiveBorderRadius = exports.getResponsiveMargin = exports.getResponsivePadding = exports.getResponsiveFontSize = exports.getResponsiveSpacing = exports.hp = exports.wp = exports.normalize = exports.getSafeAreaInsets = exports.getStatusBarHeight = exports.isPortrait = exports.isLandscape = exports.getOrientation = exports.isBreakpoint = exports.breakpoints = exports.deviceType = exports.getViewport = exports.viewport = void 0;
var react_native_1 = require("react-native");
// Get initial dimensions
var _a = react_native_1.Dimensions.get('window'), SCREEN_WIDTH = _a.width, SCREEN_HEIGHT = _a.height;
// Calculate scale based on design width (375px for iPhone 11 Pro)
// For web, use a more conservative scale to prevent oversized elements
var getScale = function () {
    if (react_native_1.Platform.OS === 'web') {
        // On web, use a more conservative scale to prevent oversized elements
        var baseWidth = 375;
        var scale_1 = Math.min(SCREEN_WIDTH / baseWidth, 1.5); // Cap at 1.5x
        return Math.max(scale_1, 0.8); // Minimum 0.8x
    }
    return SCREEN_WIDTH / 375;
};
var scale = getScale();
// Viewport dimensions
exports.viewport = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    scale: scale,
    pixelRatio: react_native_1.PixelRatio.get(),
};
// Dynamic viewport that updates on orientation change
var getViewport = function () {
    var _a = react_native_1.Dimensions.get('window'), width = _a.width, height = _a.height;
    var currentScale = react_native_1.Platform.OS === 'web'
        ? Math.min(Math.max(width / 375, 0.8), 1.5)
        : width / 375;
    return {
        width: width,
        height: height,
        scale: currentScale,
        pixelRatio: react_native_1.PixelRatio.get(),
    };
};
exports.getViewport = getViewport;
// Device type detection
exports.deviceType = {
    isPhone: SCREEN_WIDTH < 768,
    isTablet: SCREEN_WIDTH >= 768,
    isSmallPhone: SCREEN_WIDTH < 375,
    isMediumPhone: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
    isLargePhone: SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768,
    isSmallTablet: SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024,
    isLargeTablet: SCREEN_WIDTH >= 1024,
};
// Screen size breakpoints
exports.breakpoints = {
    xs: 375, // Small phones
    sm: 414, // Large phones
    md: 768, // Tablets
    lg: 1024, // Large tablets
    xl: 1200, // Desktop
};
// Responsive breakpoint helpers
exports.isBreakpoint = {
    xs: SCREEN_WIDTH < exports.breakpoints.xs,
    sm: SCREEN_WIDTH >= exports.breakpoints.xs && SCREEN_WIDTH < exports.breakpoints.sm,
    md: SCREEN_WIDTH >= exports.breakpoints.sm && SCREEN_WIDTH < exports.breakpoints.md,
    lg: SCREEN_WIDTH >= exports.breakpoints.md && SCREEN_WIDTH < exports.breakpoints.lg,
    xl: SCREEN_WIDTH >= exports.breakpoints.lg,
};
// Orientation detection
var getOrientation = function () {
    var _a = react_native_1.Dimensions.get('window'), width = _a.width, height = _a.height;
    return width > height ? 'landscape' : 'portrait';
};
exports.getOrientation = getOrientation;
exports.isLandscape = (0, exports.getOrientation)() === 'landscape';
exports.isPortrait = (0, exports.getOrientation)() === 'portrait';
// Status bar height
var getStatusBarHeight = function () {
    return react_native_1.Platform.OS === 'ios' ? 44 : react_native_1.StatusBar.currentHeight || 0;
};
exports.getStatusBarHeight = getStatusBarHeight;
// Safe area helpers
var getSafeAreaInsets = function () {
    var statusBarHeight = (0, exports.getStatusBarHeight)();
    return {
        top: statusBarHeight,
        bottom: react_native_1.Platform.OS === 'ios' ? 34 : 0, // iPhone home indicator
        left: 0,
        right: 0,
    };
};
exports.getSafeAreaInsets = getSafeAreaInsets;
// Normalize function for consistent scaling
var normalize = function (size) {
    var newSize = size * scale;
    return Math.round(react_native_1.PixelRatio.roundToNearestPixel(newSize));
};
exports.normalize = normalize;
// Width and height percentage helpers
var wp = function (percentage) {
    return (SCREEN_WIDTH * percentage) / 100;
};
exports.wp = wp;
var hp = function (percentage) {
    return (SCREEN_HEIGHT * percentage) / 100;
};
exports.hp = hp;
// Responsive spacing system
var getResponsiveSpacing = function (size) {
    var spacingMap = {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    };
    // For web, use more conservative spacing
    if (react_native_1.Platform.OS === 'web') {
        var baseSpacing = spacingMap[size];
        return Math.round(baseSpacing * Math.min(scale, 1.2));
    }
    return (0, exports.normalize)(spacingMap[size]);
};
exports.getResponsiveSpacing = getResponsiveSpacing;
// Responsive font size system
var getResponsiveFontSize = function (size) {
    var fontSizeMap = {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
    };
    // For web, use more conservative font sizes
    if (react_native_1.Platform.OS === 'web') {
        var baseFontSize = fontSizeMap[size];
        return Math.round(baseFontSize * Math.min(scale, 1.1));
    }
    return (0, exports.normalize)(fontSizeMap[size]);
};
exports.getResponsiveFontSize = getResponsiveFontSize;
// Responsive padding/margin helpers
var getResponsivePadding = function (sides, size) {
    var paddingValue = (0, exports.getResponsiveSpacing)(size);
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
exports.getResponsivePadding = getResponsivePadding;
// Responsive margin helpers
var getResponsiveMargin = function (sides, size) {
    var marginValue = (0, exports.getResponsiveSpacing)(size);
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
exports.getResponsiveMargin = getResponsiveMargin;
// Responsive border radius
var getResponsiveBorderRadius = function (size) {
    var borderRadiusMap = {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
    };
    return (0, exports.normalize)(borderRadiusMap[size]);
};
exports.getResponsiveBorderRadius = getResponsiveBorderRadius;
// Responsive icon size
var getResponsiveIconSize = function (size) {
    var iconSizeMap = {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 32,
        xl: 48,
    };
    return (0, exports.normalize)(iconSizeMap[size]);
};
exports.getResponsiveIconSize = getResponsiveIconSize;
// Responsive button height
var getResponsiveButtonHeight = function (size) {
    var buttonHeightMap = {
        sm: 36,
        md: 48,
        lg: 56,
    };
    return (0, exports.normalize)(buttonHeightMap[size]);
};
exports.getResponsiveButtonHeight = getResponsiveButtonHeight;
// Responsive card dimensions
var getResponsiveCardDimensions = function () {
    if (exports.deviceType.isPhone) {
        return {
            width: SCREEN_WIDTH - (0, exports.getResponsiveSpacing)('lg') * 2,
            height: (0, exports.normalize)(200),
            borderRadius: (0, exports.getResponsiveBorderRadius)('md'),
        };
    }
    else {
        return {
            width: (0, exports.normalize)(300),
            height: (0, exports.normalize)(250),
            borderRadius: (0, exports.getResponsiveBorderRadius)('lg'),
        };
    }
};
exports.getResponsiveCardDimensions = getResponsiveCardDimensions;
// Responsive grid columns
var getResponsiveGridColumns = function () {
    if (exports.deviceType.isPhone) {
        return 1;
    }
    else if (exports.deviceType.isSmallTablet) {
        return 2;
    }
    else {
        return 3;
    }
};
exports.getResponsiveGridColumns = getResponsiveGridColumns;
// Responsive list item height
var getResponsiveListItemHeight = function () {
    if (exports.deviceType.isPhone) {
        return (0, exports.normalize)(60);
    }
    else {
        return (0, exports.normalize)(80);
    }
};
exports.getResponsiveListItemHeight = getResponsiveListItemHeight;
// Listen for dimension changes (orientation, etc.)
var addDimensionListener = function (callback) {
    return react_native_1.Dimensions.addEventListener('change', function (_a) {
        var window = _a.window;
        callback(window);
    });
};
exports.addDimensionListener = addDimensionListener;
// Legacy exports for backward compatibility
exports.isSmallDevice = exports.deviceType.isSmallPhone;
exports.isMediumDevice = exports.deviceType.isMediumPhone;
exports.isLargeDevice = exports.deviceType.isLargePhone;
