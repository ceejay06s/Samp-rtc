import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { logLibraryStatus } from '../../utils/libraryChecker';
import { useTheme } from '../../utils/themes';

interface TGSRendererV2Props {
  url: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
  fallbackToStatic?: boolean;
}

export const TGSRendererV2: React.FC<TGSRendererV2Props> = ({
  url,
  width = 100,
  height = 100,
  autoPlay = true,
  loop = true,
  style,
  fallbackToStatic = true,
}) => {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const [useFallback, setUseFallback] = useState(false);
  const lottieRef = useRef<any>(null);
  const webLottieRef = useRef<any>(null);

  console.log('🎭 TGSRendererV2: Component rendered with props:', { url, width, height, isWeb });

  useEffect(() => {
    console.log('🎭 TGSRendererV2: useEffect triggered, loading TGS animation');
    // Log library availability for debugging (optional)
    try {
      logLibraryStatus();
    } catch (error) {
      console.log('🎭 TGSRendererV2: Library status check failed, continuing with animation load');
    }
    loadTGSAnimation();
  }, [url]);

  const loadTGSAnimation = async () => {
    try {
      setLoading(true);
      setError(null);
      setUseFallback(false);

      console.log('🎭 TGSRendererV2: Starting to load TGS animation from:', url);
      console.log('🎭 TGSRendererV2: Platform isWeb:', isWeb);

      if (isWeb) {
        // For web, try to convert TGS to Lottie JSON
        try {
          console.log('🎭 TGSRendererV2: Web platform - fetching TGS file...');
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch TGS file: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          console.log('🎭 TGSRendererV2: TGS file fetched, size:', uint8Array.length, 'bytes');
          
          // Debug: Check the first few bytes to see if it looks like a TGS file
          const firstBytes = Array.from(uint8Array.slice(0, 10));
          console.log('🎭 TGSRendererV2: First 10 bytes:', firstBytes);
          console.log('🎭 TGSRendererV2: First 10 bytes as hex:', firstBytes.map(b => b.toString(16).padStart(2, '0')).join(' '));
          
          // Try multiple approaches for TGS conversion
          let lottieData = null;
          
          // Approach 1: Try using tgs2json library first (Node.js/React Native only)
          try {
            console.log('🎭 TGSRendererV2: Trying tgs2json library...');
            // tgs2json is only available in Node.js/React Native environments
            if (typeof require !== 'undefined' && typeof window === 'undefined') {
              try {
                const tgs2json = require('tgs2json');
                if (tgs2json && typeof tgs2json === 'function') {
                  const jsonString = tgs2json(uint8Array);
                  lottieData = JSON.parse(jsonString);
                  console.log('🎭 TGSRendererV2: tgs2json conversion successful');
                } else {
                  throw new Error('tgs2json is not a function');
                }
              } catch (requireError) {
                console.log('🎭 TGSRendererV2: tgs2json require failed:', requireError);
                throw new Error('tgs2json library not available');
              }
            } else {
              console.log('🎭 TGSRendererV2: tgs2json not available in browser environment, skipping...');
              throw new Error('tgs2json not available in browser environment');
            }
          } catch (tgs2jsonError) {
            console.log('🎭 TGSRendererV2: tgs2json failed, trying pako decompression...');
            
            // Approach 2: Use pako to decompress TGS and convert to Lottie JSON
            try {
              console.log('🎭 TGSRendererV2: Trying pako decompression...');
              // Try to get pako from different sources
              let pako;
              try {
                if (typeof require !== 'undefined' && typeof window === 'undefined') {
                  // Node.js/React Native environment
                  pako = require('pako');
                } else if (typeof window !== 'undefined' && (window as any).pako) {
                  // Browser with global pako
                  pako = (window as any).pako;
                } else if (typeof window !== 'undefined') {
                  // Browser environment - try to use bundled pako if available
                  console.log('🎭 TGSRendererV2: Browser environment - pako might be bundled');
                  // In browsers, pako might be available through the bundler
                  // We'll try to use it directly if it's available
                  throw new Error('pako not available in browser environment');
                } else {
                  throw new Error('pako not available in this environment');
                }
                
                if (pako && pako.inflate) {
                  console.log('🎭 TGSRendererV2: pako imported successfully');
                  
                  // TGS files are gzipped Lottie JSON, so we need to decompress them
                  console.log('🎭 TGSRendererV2: Decompressing TGS data...');
                  const decompressedData = pako.inflate(uint8Array, { to: 'string' });
                  console.log('🎭 TGSRendererV2: Decompression successful, data length:', decompressedData.length);
                  
                  // Parse the decompressed JSON data
                  console.log('🎭 TGSRendererV2: Parsing decompressed JSON...');
                  lottieData = JSON.parse(decompressedData);
                  console.log('🎭 TGSRendererV2: pako decompression successful');
                } else {
                  throw new Error('pako.inflate not available');
                }
              } catch (importError) {
                console.log('🎭 TGSRendererV2: pako import failed:', importError);
                throw new Error('pako library not available');
              }
            } catch (pakoError) {
              console.log('🎭 TGSRendererV2: pako decompression failed, trying raw TGS...');
              
              // Approach 3: Try to use the TGS file directly with lottie-web
              try {
                // Some TGS files can be loaded directly by lottie-web
                lottieData = { type: 'tgs', uri: url };
                console.log('🎭 TGSRendererV2: Using TGS file directly');
              } catch (directError) {
                throw new Error('All TGS conversion methods failed');
              }
            }
          }
          
          // Validate that it looks like Lottie data
          if (lottieData && (
            (typeof lottieData === 'object' && lottieData.v) || // Standard Lottie format
            (lottieData.type === 'tgs') // Direct TGS format
          )) {
            console.log('🎭 TGSRendererV2: Valid animation data detected');
            setAnimationData(lottieData);
          } else {
            throw new Error('Converted data does not appear to be valid animation data');
          }
        } catch (conversionError) {
          console.warn('🎭 TGSRendererV2: TGS to JSON conversion failed, trying fallback:', conversionError);
          setUseFallback(true);
        }
      } else {
        // For mobile, try to use the URL directly with lottie-react-native
        try {
          console.log('🎭 TGSRendererV2: Mobile platform - setting up for lottie-react-native');
          // Try to convert TGS to Lottie JSON on mobile as well
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch TGS file: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Try tgs2json first on mobile
          let lottieData = null;
          try {
            console.log('🎭 TGSRendererV2: Mobile - trying tgs2json...');
            let tgs2json;
            try {
              if (typeof require !== 'undefined') {
                tgs2json = require('tgs2json');
              } else if (typeof window !== 'undefined' && (window as any).tgs2json) {
                tgs2json = (window as any).tgs2json;
              } else {
                throw new Error('tgs2json not available in this environment');
              }
              
              if (tgs2json && typeof tgs2json === 'function') {
                const jsonString = tgs2json(uint8Array);
                lottieData = JSON.parse(jsonString);
                console.log('🎭 TGSRendererV2: Mobile tgs2json conversion successful');
              } else {
                throw new Error('tgs2json is not a function');
              }
            } catch (importError) {
              console.log('🎭 TGSRendererV2: Mobile tgs2json import failed:', importError);
              throw new Error('tgs2json library not available');
            }
          } catch (tgs2jsonError) {
            console.log('🎭 TGSRendererV2: Mobile tgs2json failed, trying pako...');
            // Fallback to pako on mobile
            try {
              console.log('🎭 TGSRendererV2: Mobile - trying pako...');
              let pako;
              try {
                if (typeof require !== 'undefined') {
                  pako = require('pako');
                } else if (typeof window !== 'undefined' && (window as any).pako) {
                  pako = (window as any).pako;
                } else {
                  throw new Error('pako not available in this environment');
                }
                
                if (pako && pako.inflate) {
                  const decompressedData = pako.inflate(uint8Array, { to: 'string' });
                  lottieData = JSON.parse(decompressedData);
                  console.log('🎭 TGSRendererV2: Mobile pako decompression successful');
                } else {
                  throw new Error('pako.inflate not available');
                }
              } catch (importError) {
                console.log('🎭 TGSRendererV2: Mobile pako import failed:', importError);
                throw new Error('pako library not available');
              }
            } catch (pakoError) {
              console.log('🎭 TGSRendererV2: Mobile pako failed, using direct TGS...');
              // Last resort: try direct TGS loading
              lottieData = { type: 'tgs', uri: url };
              console.log('🎭 TGSRendererV2: Mobile using TGS file directly');
            }
          }
          
          setAnimationData(lottieData);
        } catch (mobileError) {
          console.warn('🎭 TGSRendererV2: Mobile TGS loading failed, using fallback:', mobileError);
          setUseFallback(true);
        }
      }
    } catch (err) {
      console.error('🎭 TGSRendererV2: Error loading TGS animation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load animation');
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  };

  // Initialize web Lottie animation
  useEffect(() => {
    if (isWeb && animationData && webLottieRef.current && !useFallback) {
      const loadWebLottie = async () => {
        try {
          if (animationData.type === 'tgs') {
            // Handle TGS files directly with lottie-web
            const lottie = require('lottie-web');
            const anim = lottie.loadAnimation({
              container: webLottieRef.current,
              renderer: 'svg',
              loop: loop,
              autoplay: autoPlay,
              path: animationData.uri, // Use the TGS URL directly
            });
            
            // Store animation reference for cleanup
            webLottieRef.current.animation = anim;
          } else if (animationData.v) {
            // Use lottie-web for converted Lottie JSON
            const lottie = require('lottie-web');
            const anim = lottie.loadAnimation({
              container: webLottieRef.current,
              renderer: 'svg',
              loop: loop,
              autoplay: autoPlay,
              animationData: animationData,
            });
            
            // Store animation reference for cleanup
            webLottieRef.current.animation = anim;
          }
        } catch (err) {
          console.error('🎭 TGSRendererV2: Error loading web Lottie:', err);
          setError('Failed to load web animation');
          setUseFallback(true);
        }
      };
      
      loadWebLottie();
    }
  }, [isWeb, animationData, autoPlay, loop, useFallback]);

  // Cleanup web Lottie animation
  useEffect(() => {
    return () => {
      if (isWeb && webLottieRef.current?.animation) {
        webLottieRef.current.animation.destroy();
      }
    };
  }, [isWeb]);

  console.log('🎭 TGSRendererV2: Render state:', { loading, error, useFallback, animationData });

  if (loading) {
    console.log('🎭 TGSRendererV2: Rendering loading state');
    return (
      <View style={[styles.container, { width, height }, style]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && !useFallback) {
    console.log('🎭 TGSRendererV2: Rendering error state');
    return (
      <View style={[styles.container, { width, height }, style]}>
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Failed to load animation
          </Text>
        </View>
      </View>
    );
  }

  if (isWeb) {
    console.log('🎭 TGSRendererV2: Web platform rendering, useFallback:', useFallback, 'animationData:', animationData);
    
    if (useFallback) {
      // Simple fallback for web - show TGS file info
      console.log('🎭 TGSRendererV2: Using simple fallback for web');
      return (
        <View style={[styles.container, { width, height }, style]}>
          <View style={[styles.fallbackContainer, { width, height, backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
              TGS File
            </Text>
            <Text style={[styles.fallbackSubtext, { color: theme.colors.textSecondary }]}>
              {url.split('/').pop()}
            </Text>
            <Text style={[styles.fallbackInfo, { color: theme.colors.textSecondary }]}>
              (Web TGS rendering in development)
            </Text>
          </View>
        </View>
      );
    }

    // Web implementation using lottie-web
    if (animationData && (animationData.v || animationData.type === 'tgs')) {
      console.log('🎭 TGSRendererV2: Rendering with lottie-web');
      return (
        <View style={[styles.container, { width, height }, style]}>
          <div
            ref={webLottieRef}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: 'transparent'
            }}
          />
        </View>
      );
    }
  } else {
    // Mobile implementation using lottie-react-native
    console.log('🎭 TGSRendererV2: Mobile platform rendering, useFallback:', useFallback, 'animationData:', animationData);
    
    if (animationData && !useFallback) {
      try {
        console.log('🎭 TGSRendererV2: Rendering with lottie-react-native');
        const LottieView = require('lottie-react-native').default;
        
        // Handle different data formats
        let source = animationData;
        if (animationData.v) {
          // Standard Lottie JSON
          source = animationData;
        } else if (animationData.type === 'tgs') {
          // TGS file - try to use directly
          source = { uri: animationData.uri };
        }
        
        return (
          <View style={[styles.container, { width, height }, style]}>
            <LottieView
              ref={lottieRef}
              source={source}
              autoPlay={autoPlay}
              loop={loop}
              style={[styles.lottieAnimation, { width, height }]}
            />
          </View>
        );
      } catch (lottieError) {
        console.error('🎭 TGSRendererV2: Lottie mobile component failed:', lottieError);
        setUseFallback(true);
      }
    }
  }

  // Fallback display
  console.log('🎭 TGSRendererV2: Using fallback display');
  
  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={[styles.fallbackContainer, { width, height, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
          TGS File
        </Text>
        <Text style={[styles.fallbackSubtext, { color: theme.colors.textSecondary }]}>
          {url.split('/').pop()}
        </Text>
        <Text style={[styles.fallbackInfo, { color: theme.colors.textSecondary }]}>
          (TGS rendering in development)
        </Text>
        <Text style={[styles.fallbackInfo, { color: theme.colors.textSecondary }]}>
          Check console for library status
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  lottieAnimation: {
    // Remove fixed width/height to allow props to control sizing
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 8,
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  fallbackInfo: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 