import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useTheme } from '../../utils/themes';

interface TGSRendererV3Props {
  url: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
}

export const TGSRendererV3: React.FC<TGSRendererV3Props> = ({
  url,
  width = 100,
  height = 100,
  autoPlay = true,
  loop = true,
  style,
}) => {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const lottieRef = useRef<any>(null);
  const webLottieRef = useRef<any>(null);

  console.log('🎭 TGSRendererV3: Starting with URL:', url);

  useEffect(() => {
    loadTGSAnimation();
  }, [url]);

  const loadTGSAnimation = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎭 TGSRendererV3: Loading TGS animation...');

      if (isWeb) {
        await loadTGSForWeb();
      } else {
        await loadTGSForMobile();
      }
    } catch (err) {
      console.error('🎭 TGSRendererV3: Error loading animation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load animation');
    } finally {
      setLoading(false);
    }
  };

  const loadTGSForWeb = async () => {
    try {
      console.log('🎭 TGSRendererV3: Web platform - fetching TGS file...');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch TGS file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log('🎭 TGSRendererV3: TGS file fetched, size:', uint8Array.length, 'bytes');
      
      // Try to decompress TGS using pako
      try {
        let pako;
        if (typeof window !== 'undefined' && (window as any).pako) {
          pako = (window as any).pako;
        } else {
          const pakoModule = await import('pako');
          pako = pakoModule.default || pakoModule;
        }
        
        if (pako && pako.inflate) {
          console.log('🎭 TGSRendererV3: Decompressing TGS with pako...');
          const decompressedData = pako.inflate(uint8Array, { to: 'string' });
          console.log('🎭 TGSRendererV3: Decompression successful, length:', decompressedData.length);
          
          const lottieData = JSON.parse(decompressedData);
          if (lottieData && lottieData.v) {
            console.log('🎭 TGSRendererV3: Valid Lottie data parsed, version:', lottieData.v);
            setAnimationData({ type: 'lottie', data: lottieData });
            return;
          } else {
            throw new Error('Decompressed data is not valid Lottie JSON');
          }
        } else {
          throw new Error('pako.inflate not available');
        }
      } catch (pakoError) {
        console.log('🎭 TGSRendererV3: Pako decompression failed, trying direct TGS loading...');
        setAnimationData({ type: 'tgs', uri: url });
      }
    } catch (error) {
      console.error('🎭 TGSRendererV3: Web TGS loading failed:', error);
      throw error;
    }
  };

  const loadTGSForMobile = async () => {
    try {
      console.log('🎭 TGSRendererV3: Mobile platform - setting up TGS loading...');
      setAnimationData({ type: 'tgs', uri: url });
    } catch (error) {
      console.error('🎭 TGSRendererV3: Mobile TGS loading failed:', error);
      throw error;
    }
  };

  // Initialize web Lottie animation
  useEffect(() => {
    if (isWeb && animationData && webLottieRef.current) {
      const loadWebLottie = async () => {
        try {
          if (animationData.type === 'lottie' && animationData.data) {
            const lottie = await import('lottie-web');
            const anim = lottie.default.loadAnimation({
              container: webLottieRef.current,
              renderer: 'svg',
              loop: loop,
              autoplay: autoPlay,
              animationData: animationData.data,
            });
            
            webLottieRef.current.animation = anim;
            console.log('🎭 TGSRendererV3: Web Lottie animation loaded successfully');
          } else if (animationData.type === 'tgs') {
            const lottie = await import('lottie-web');
            const anim = lottie.default.loadAnimation({
              container: webLottieRef.current,
              renderer: 'svg',
              loop: loop,
              autoplay: autoPlay,
              path: animationData.uri,
            });
            
            webLottieRef.current.animation = anim;
            console.log('🎭 TGSRendererV3: Web TGS animation loaded directly');
          }
        } catch (err) {
          console.error('🎭 TGSRendererV3: Error loading web Lottie:', err);
          setError('Failed to load web animation');
        }
      };
      
      loadWebLottie();
    }
  }, [isWeb, animationData, autoPlay, loop]);

  // Cleanup web Lottie animation
  useEffect(() => {
    return () => {
      if (isWeb && webLottieRef.current?.animation) {
        webLottieRef.current.animation.destroy();
      }
    };
  }, [isWeb]);

  if (loading) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading TGS...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Failed to load TGS
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  if (isWeb) {
    if (animationData) {
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
    if (animationData?.type === 'tgs') {
      try {
        const LottieView = require('lottie-react-native').default;
        
        return (
          <View style={[styles.container, { width, height }, style]}>
            <LottieView
              ref={lottieRef}
              source={{ uri: animationData.uri }}
              autoPlay={autoPlay}
              loop={loop}
              style={[styles.lottieAnimation, { width, height }]}
            />
          </View>
        );
      } catch (lottieError) {
        console.error('🎭 TGSRendererV3: Lottie mobile component failed:', lottieError);
        setError('Lottie component not available');
      }
    }
  }

  // Fallback display
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
          (TGS rendering in progress)
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
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
}); 