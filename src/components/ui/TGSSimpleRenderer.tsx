import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useTheme } from '../../utils/themes';

interface TGSSimpleRendererProps {
  url: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
}

export const TGSSimpleRenderer: React.FC<TGSSimpleRendererProps> = ({
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
  const webLottieRef = useRef<any>(null);

  console.log('🎭 TGSSimpleRenderer: Starting with URL:', url);

  useEffect(() => {
    loadTGSAnimation();
  }, [url]);

  const loadTGSAnimation = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎭 TGSSimpleRenderer: Loading TGS animation...');

      if (isWeb) {
        await loadTGSForWeb();
      } else {
        await loadTGSForMobile();
      }
    } catch (err) {
      console.error('🎭 TGSSimpleRenderer: Error loading animation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load animation');
    } finally {
      setLoading(false);
    }
  };

  const loadTGSForWeb = async () => {
    try {
      console.log('🎭 TGSSimpleRenderer: Web platform - fetching TGS file...');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch TGS file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log('🎭 TGSSimpleRenderer: TGS file fetched, size:', uint8Array.length, 'bytes');
      
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
          console.log('🎭 TGSSimpleRenderer: Decompressing TGS with pako...');
          const decompressedData = pako.inflate(uint8Array, { to: 'string' });
          console.log('🎭 TGSSimpleRenderer: Decompression successful, length:', decompressedData.length);
          
          const lottieData = JSON.parse(decompressedData);
          if (lottieData && lottieData.v) {
            console.log('🎭 TGSSimpleRenderer: Valid Lottie data parsed, version:', lottieData.v);
            // Store the data and render it
            setTimeout(() => {
              if (webLottieRef.current) {
                renderLottieAnimation(lottieData);
              }
            }, 100);
            return;
          } else {
            throw new Error('Decompressed data is not valid Lottie JSON');
          }
        } else {
          throw new Error('pako.inflate not available');
        }
      } catch (pakoError) {
        console.log('🎭 TGSSimpleRenderer: Pako decompression failed, trying direct TGS loading...');
        // Try to load TGS directly
        setTimeout(() => {
          if (webLottieRef.current) {
            renderTGSDirectly();
          }
        }, 100);
      }
    } catch (error) {
      console.error('🎭 TGSSimpleRenderer: Web TGS loading failed:', error);
      throw error;
    }
  };

  const loadTGSForMobile = async () => {
    try {
      console.log('🎭 TGSSimpleRenderer: Mobile platform - setting up TGS loading...');
      // For mobile, we'll just show the fallback for now
      setLoading(false);
    } catch (error) {
      console.error('🎭 TGSSimpleRenderer: Mobile TGS loading failed:', error);
      throw error;
    }
  };

  const renderLottieAnimation = async (lottieData: any) => {
    try {
      const lottie = await import('lottie-web');
      const anim = lottie.default.loadAnimation({
        container: webLottieRef.current,
        renderer: 'svg',
        loop: loop,
        autoplay: autoPlay,
        animationData: lottieData,
      });
      
      webLottieRef.current.animation = anim;
      console.log('🎭 TGSSimpleRenderer: Web Lottie animation loaded successfully');
    } catch (err) {
      console.error('🎭 TGSSimpleRenderer: Error loading web Lottie:', err);
      setError('Failed to load web animation');
    }
  };

  const renderTGSDirectly = async () => {
    try {
      const lottie = await import('lottie-web');
      const anim = lottie.default.loadAnimation({
        container: webLottieRef.current,
        renderer: 'svg',
        loop: loop,
        autoplay: autoPlay,
        path: url,
      });
      
      webLottieRef.current.animation = anim;
      console.log('🎭 TGSSimpleRenderer: Web TGS animation loaded directly');
    } catch (err) {
      console.error('🎭 TGSSimpleRenderer: Error loading web TGS directly:', err);
      setError('Failed to load TGS directly');
    }
  };

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
  } else {
    // Mobile fallback
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
            (Mobile TGS support coming soon)
          </Text>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
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