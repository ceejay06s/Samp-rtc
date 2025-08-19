import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useTheme } from '../../utils/themes';

interface TGSRendererProps {
  url: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
  fallbackToStatic?: boolean;
}

export const TGSRenderer: React.FC<TGSRendererProps> = ({
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

  console.log('🎭 TGSRenderer: Component rendered with props:', { url, width, height, isWeb });

  useEffect(() => {
    console.log('🎭 TGSRenderer: useEffect triggered, loading TGS animation');
    loadTGSAnimation();
  }, [url]);

  const loadTGSAnimation = async () => {
    try {
      setLoading(true);
      setError(null);
      setUseFallback(false);

      console.log('🎭 TGSRenderer: Starting to load TGS animation from:', url);
      console.log('🎭 TGSRenderer: Platform isWeb:', isWeb);

      if (isWeb) {
        // For web, try to convert TGS to Lottie JSON
        try {
          console.log('🎭 TGSRenderer: Web platform - fetching TGS file...');
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch TGS file: ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          console.log('🎭 TGSRenderer: TGS file fetched, size:', uint8Array.length, 'bytes');
          
          // Use tgs2json to convert TGS to Lottie JSON
          console.log('🎭 TGSRenderer: Converting TGS to Lottie JSON...');
          const { tgs2json } = require('tgs2json');
          const lottieData = await tgs2json(uint8Array);
          console.log('🎭 TGSRenderer: TGS conversion successful, Lottie data:', lottieData);
          setAnimationData({ type: 'lottie', data: lottieData });
        } catch (conversionError) {
          console.warn('🎭 TGSRenderer: TGS to JSON conversion failed, trying fallback:', conversionError);
          setUseFallback(true);
        }
      } else {
        // For mobile, try to use the URL directly with lottie-react-native
        try {
          console.log('🎭 TGSRenderer: Mobile platform - setting up for lottie-react-native');
          setAnimationData({ type: 'lottie', uri: url });
        } catch (mobileError) {
          console.warn('🎭 TGSRenderer: Mobile TGS loading failed, using fallback:', mobileError);
          setUseFallback(true);
        }
      }
    } catch (err) {
      console.error('🎭 TGSRenderer: Error loading TGS animation:', err);
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
          if (animationData.type === 'lottie') {
            // Use lottie-web for converted Lottie JSON
            const lottie = require('lottie-web');
            const anim = lottie.loadAnimation({
              container: webLottieRef.current,
              renderer: 'svg',
              loop: loop,
              autoplay: autoPlay,
              animationData: animationData.data,
            });
            
            // Store animation reference for cleanup
            webLottieRef.current.animation = anim;
          }
        } catch (err) {
          console.error('🎭 TGSRenderer: Error loading web Lottie:', err);
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

  console.log('🎭 TGSRenderer: Render state:', { loading, error, useFallback, animationData });

  if (loading) {
    console.log('🎭 TGSRenderer: Rendering loading state');
    return (
      <View style={[styles.container, { width, height }, style]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && !useFallback) {
    console.log('🎭 TGSRenderer: Rendering error state');
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
    console.log('🎭 TGSRenderer: Web platform rendering, useFallback:', useFallback, 'animationData:', animationData);
    
    if (useFallback) {
      // Simple fallback for web - show TGS file info
      console.log('🎭 TGSRenderer: Using simple fallback for web');
      return (
        <View style={[styles.container, { width, height }, style]}>
          <View style={[styles.fallbackContainer, { backgroundColor: theme.colors.surface }]}>
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
    if (animationData?.type === 'lottie') {
      console.log('🎭 TGSRenderer: Rendering with lottie-web');
      return (
        <View style={[styles.container, { width, height }, style]}>
          <div
            ref={webLottieRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent'
            }}
          />
        </View>
      );
    }
  } else {
    // Mobile implementation using lottie-react-native
    console.log('🎭 TGSRenderer: Mobile platform rendering, useFallback:', useFallback, 'animationData:', animationData);
    
    if (animationData?.type === 'lottie' && !useFallback) {
      try {
        console.log('🎭 TGSRenderer: Rendering with lottie-react-native');
        const LottieView = require('lottie-react-native').default;
        
        return (
          <View style={[styles.container, { width, height }, style]}>
            <LottieView
              ref={lottieRef}
              source={animationData}
              autoPlay={autoPlay}
              loop={loop}
              style={styles.lottieAnimation}
            />
          </View>
        );
      } catch (lottieError) {
        console.error('🎭 TGSRenderer: Lottie mobile component failed:', lottieError);
        setUseFallback(true);
      }
    }
  }

  // Fallback display
  console.log('🎭 TGSRenderer: Using fallback display');
  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={[styles.fallbackContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.fallbackText, { color: theme.colors.textSecondary }]}>
          TGS File
        </Text>
        <Text style={[styles.fallbackSubtext, { color: theme.colors.textSecondary }]}>
          {url.split('/').pop()}
        </Text>
        <Text style={[styles.fallbackInfo, { color: theme.colors.textSecondary }]}>
          (TGS rendering in development)
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
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
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