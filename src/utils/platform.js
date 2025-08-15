"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentConfig = exports.getPlatformStyles = exports.getBrowserInfo = exports.getUserAgent = exports.isDesktopBrowser = exports.isMobileBrowser = exports.isStandalone = exports.isAndroidBrowser = exports.isExpoGo = exports.isWeb = exports.isIOS = exports.isAndroid = exports.getPlatformInfo = void 0;
var expo_constants_1 = require("expo-constants");
var react_native_1 = require("react-native");
var getPlatformInfo = function () {
    var _a, _b;
    var isAndroid = react_native_1.Platform.OS === 'android';
    var isIOS = react_native_1.Platform.OS === 'ios';
    var isWeb = react_native_1.Platform.OS === 'web';
    // Check if running in Expo Go
    var isExpoGo = expo_constants_1.default.appOwnership === 'expo';
    // Check if running in standalone app (not Expo Go)
    var isStandalone = expo_constants_1.default.appOwnership !== 'expo';
    // Check if running in Android browser (web platform on Android)
    var isAndroidBrowser = isWeb && react_native_1.Platform.OS === 'web' &&
        (typeof window !== 'undefined' && ((_b = (_a = window.navigator) === null || _a === void 0 ? void 0 : _a.userAgent) === null || _b === void 0 ? void 0 : _b.includes('Android')));
    // Check if running in mobile browser (web platform on mobile devices)
    var isMobileBrowser = isWeb && (function () {
        if (typeof window === 'undefined' || !window.navigator)
            return false;
        var userAgent = window.navigator.userAgent;
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        var isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
        return isMobile || isTablet;
    })();
    // Check if running in desktop browser
    var isDesktopBrowser = isWeb && !isMobileBrowser;
    // Determine environment
    var environment;
    if (isExpoGo) {
        environment = 'expo-go';
    }
    else if (isStandalone) {
        environment = 'standalone';
    }
    else {
        environment = 'web';
    }
    return {
        isAndroid: isAndroid,
        isIOS: isIOS,
        isWeb: isWeb,
        isExpoGo: isExpoGo,
        isAndroidBrowser: isAndroidBrowser,
        isStandalone: isStandalone,
        isMobileBrowser: isMobileBrowser,
        isDesktopBrowser: isDesktopBrowser,
        platform: react_native_1.Platform.OS,
        environment: environment,
    };
};
exports.getPlatformInfo = getPlatformInfo;
// Convenience functions
var isAndroid = function () { return (0, exports.getPlatformInfo)().isAndroid; };
exports.isAndroid = isAndroid;
var isIOS = function () { return (0, exports.getPlatformInfo)().isIOS; };
exports.isIOS = isIOS;
var isWeb = function () { return (0, exports.getPlatformInfo)().isWeb; };
exports.isWeb = isWeb;
var isExpoGo = function () { return (0, exports.getPlatformInfo)().isExpoGo; };
exports.isExpoGo = isExpoGo;
var isAndroidBrowser = function () { return (0, exports.getPlatformInfo)().isAndroidBrowser; };
exports.isAndroidBrowser = isAndroidBrowser;
var isStandalone = function () { return (0, exports.getPlatformInfo)().isStandalone; };
exports.isStandalone = isStandalone;
var isMobileBrowser = function () { return (0, exports.getPlatformInfo)().isMobileBrowser; };
exports.isMobileBrowser = isMobileBrowser;
var isDesktopBrowser = function () { return (0, exports.getPlatformInfo)().isDesktopBrowser; };
exports.isDesktopBrowser = isDesktopBrowser;
// Get user agent string (web only)
var getUserAgent = function () {
    if (typeof window !== 'undefined' && window.navigator) {
        return window.navigator.userAgent;
    }
    return '';
};
exports.getUserAgent = getUserAgent;
// Check if running in specific browser
var getBrowserInfo = function () {
    if (!(0, exports.isWeb)())
        return null;
    var userAgent = (0, exports.getUserAgent)();
    if (userAgent.includes('Chrome')) {
        return { name: 'Chrome', isChrome: true };
    }
    else if (userAgent.includes('Firefox')) {
        return { name: 'Firefox', isFirefox: true };
    }
    else if (userAgent.includes('Safari')) {
        return { name: 'Safari', isSafari: true };
    }
    else if (userAgent.includes('Edge')) {
        return { name: 'Edge', isEdge: true };
    }
    return { name: 'Unknown', isUnknown: true };
};
exports.getBrowserInfo = getBrowserInfo;
// Platform-specific styling helpers
var getPlatformStyles = function () {
    var platformInfo = (0, exports.getPlatformInfo)();
    return {
        // Android-specific styles
        android: {
            elevation: platformInfo.isAndroid ? 4 : 0,
            shadowColor: platformInfo.isAndroid ? 'transparent' : '#000',
            shadowOffset: platformInfo.isAndroid ? undefined : { width: 0, height: 2 },
            shadowOpacity: platformInfo.isAndroid ? undefined : 0.25,
            shadowRadius: platformInfo.isAndroid ? undefined : 3.84,
        },
        // iOS-specific styles
        ios: {
            shadowColor: platformInfo.isIOS ? '#000' : 'transparent',
            shadowOffset: platformInfo.isIOS ? { width: 0, height: 2 } : undefined,
            shadowOpacity: platformInfo.isIOS ? 0.25 : undefined,
            shadowRadius: platformInfo.isIOS ? 3.84 : undefined,
            elevation: platformInfo.isIOS ? undefined : 0,
        },
        // Web-specific styles
        web: {
            boxShadow: platformInfo.isWeb ? '0 2px 4px rgba(0,0,0,0.1)' : undefined,
        },
    };
};
exports.getPlatformStyles = getPlatformStyles;
// Environment-specific configuration
var getEnvironmentConfig = function () {
    var platformInfo = (0, exports.getPlatformInfo)();
    return {
        // Enable/disable features based on environment
        features: {
            // Some features might not work in Expo Go
            pushNotifications: platformInfo.isStandalone || platformInfo.isWeb,
            // Camera might have different behavior
            camera: platformInfo.isExpoGo || platformInfo.isStandalone,
            // File system access
            fileSystem: platformInfo.isStandalone || platformInfo.isWeb,
        },
        // Performance settings
        performance: {
            // Reduce animations in web for better performance
            reduceAnimations: platformInfo.isWeb,
            // Optimize for mobile browsers
            optimizeForMobile: platformInfo.isAndroidBrowser,
        },
        // UI adjustments
        ui: {
            // Different touch targets for web
            touchTargetSize: platformInfo.isWeb ? 44 : 48,
            // Different font sizes
            baseFontSize: platformInfo.isWeb ? 16 : 14,
        },
    };
};
exports.getEnvironmentConfig = getEnvironmentConfig;
