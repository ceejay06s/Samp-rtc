/**
 * Utility to check if required libraries are available for TGS rendering
 */

export interface LibraryStatus {
  tgs2json: boolean;
  pako: boolean;
  lottieWeb: boolean;
  lottieReactNative: boolean;
}

export const checkLibraryAvailability = (): LibraryStatus => {
  const status: LibraryStatus = {
    tgs2json: false,
    pako: false,
    lottieWeb: false,
    lottieReactNative: false,
  };

  try {
    // Check if we're in a Node.js/React Native environment with require
    if (typeof require !== 'undefined' && typeof window === 'undefined') {
      // Node.js environment
      console.log('🔍 Library checker: Node.js environment detected');
      
      // Check tgs2json
      try {
        const tgs2json = require('tgs2json');
        status.tgs2json = !!(tgs2json && typeof tgs2json === 'function');
        console.log('✅ tgs2json available in Node.js');
      } catch (e) {
        console.log('❌ tgs2json not available in Node.js:', e);
      }

      // Check pako
      try {
        const pako = require('pako');
        status.pako = !!(pako && pako.inflate && typeof pako.inflate === 'function');
        console.log('✅ pako available in Node.js');
      } catch (e) {
        console.log('❌ pako not available in Node.js:', e);
      }

      // Check lottie-web (for web platform)
      try {
        const lottieWeb = require('lottie-web');
        status.lottieWeb = !!(lottieWeb && typeof lottieWeb.loadAnimation === 'function');
        console.log('✅ lottie-web available in Node.js');
      } catch (e) {
        console.log('❌ lottie-web not available in Node.js:', e);
      }

      // Check lottie-react-native (for mobile platform)
      try {
        const lottieReactNative = require('lottie-react-native');
        status.lottieReactNative = !!(lottieReactNative && lottieReactNative.default);
        console.log('✅ lottie-react-native available in Node.js');
      } catch (e) {
        console.log('❌ lottie-react-native not available in Node.js:', e);
      }
    } else if (typeof window !== 'undefined') {
      // Browser environment
      console.log('🔍 Library checker: Browser environment detected');
      
      // Check if libraries are available globally
      if ((window as any).tgs2json) {
        status.tgs2json = !!(window as any).tgs2json && typeof (window as any).tgs2json === 'function';
        console.log('✅ tgs2json available globally in browser');
      }
      
      if ((window as any).pako) {
        status.pako = !!((window as any).pako && (window as any).pako.inflate);
        console.log('✅ pako available globally in browser');
      }
      
      if ((window as any).lottie) {
        status.lottieWeb = !!((window as any).lottie && typeof (window as any).lottie.loadAnimation === 'function');
        console.log('✅ lottie available globally in browser');
      }
      
      // Try dynamic imports for browser
      try {
        // Note: Dynamic imports might not work in all environments
        console.log('🔍 Library checker: Attempting dynamic imports for browser...');
        
        // For web browsers, we need to check if these libraries are bundled
        // or available through CDN/global variables
        if (typeof (window as any).pako !== 'undefined') {
          status.pako = true;
          console.log('✅ pako available via global variable');
        }
        
        if (typeof (window as any).lottie !== 'undefined') {
          status.lottieWeb = true;
          console.log('✅ lottie available via global variable');
        }
        
        // Note: tgs2json is typically not available in browsers
        // It's a Node.js-specific library
        console.log('ℹ️ tgs2json not typically available in browsers');
        
      } catch (e) {
        console.log('❌ Dynamic imports not supported in this browser environment');
      }
    } else {
      // React Native environment
      console.log('🔍 Library checker: React Native environment detected');
      
      try {
        // Check tgs2json
        const tgs2json = require('tgs2json');
        status.tgs2json = !!(tgs2json && typeof tgs2json === 'function');
        console.log('✅ tgs2json available in React Native');
      } catch (e) {
        console.log('❌ tgs2json not available in React Native:', e);
      }

      // Check pako
      try {
        const pako = require('pako');
        status.pako = !!(pako && pako.inflate && typeof pako.inflate === 'function');
        console.log('✅ pako available in React Native');
      } catch (e) {
        console.log('❌ pako not available in React Native:', e);
      }

      // Check lottie-react-native
      try {
        const lottieReactNative = require('lottie-react-native');
        status.lottieReactNative = !!(lottieReactNative && lottieReactNative.default);
        console.log('✅ lottie-react-native available in React Native');
      } catch (e) {
        console.log('❌ lottie-react-native not available in React Native:', e);
      }
    }
  } catch (error) {
    console.error('❌ Error checking library availability:', error);
  }

  return status;
};

export const getRecommendedFallback = (): string => {
  const status = checkLibraryAvailability();
  
  if (status.tgs2json) {
    return 'tgs2json';
  } else if (status.pako) {
    return 'pako';
  } else if (status.lottieWeb || status.lottieReactNative) {
    return 'direct';
  } else {
    return 'fallback';
  }
};

export const getEnvironmentInfo = (): string => {
  if (typeof window !== 'undefined') {
    return 'browser';
  } else if (typeof require !== 'undefined') {
    return 'node';
  } else {
    return 'unknown';
  }
};

export const getBrowserCompatibilityNote = (): string => {
  return `Note: In web browsers, some libraries (like tgs2json) are not available. 
  The TGS renderer will use alternative methods like pako decompression or direct TGS loading.`;
};

export const logLibraryStatus = (): void => {
  const environment = getEnvironmentInfo();
  console.log('🌍 Environment detected:', environment);
  
  const status = checkLibraryAvailability();
  console.log('📚 Library Availability Status:', status);
  console.log('🎯 Recommended fallback method:', getRecommendedFallback());
  
  if (environment === 'browser') {
    console.log('💡 Browser compatibility note:', getBrowserCompatibilityNote());
  }
}; 