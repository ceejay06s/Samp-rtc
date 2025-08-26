import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { APP_CONFIG } from '../../utils/appConfig';
import { getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface CarouselItem {
  id: string;
  content: React.ReactNode;
}

interface AutoScrollCarouselProps {
  items: CarouselItem[];
  autoScrollInterval?: number;
  showIndicators?: boolean;
  height?: number;
  style?: any;
}

export const AutoScrollCarousel: React.FC<AutoScrollCarouselProps> = ({
  items,
  autoScrollInterval = 8000, // Increased from 3000ms to 8000ms (8 seconds) to prevent excessive reloading
  showIndicators = true,
  height = 200,
  style,
}) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(0); // Use ref to avoid dependency issues

  // Auto-scroll effect - fixed infinite loop
  useEffect(() => {
    // Completely disable auto-scroll in development mode if configured
    if (APP_CONFIG.DEVELOPMENT.DISABLE_AUTO_SCROLL) {
      console.log('🔄 Auto-scroll disabled in development mode');
      return;
    }

    if (items.length <= 1) return;

    const startAutoScroll = () => {
      autoScrollTimer.current = setInterval(() => {
        if (flatListRef.current) {
          const nextIndex = (currentIndexRef.current + 1) % items.length;
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          currentIndexRef.current = nextIndex;
          setCurrentIndex(nextIndex);
        }
      }, autoScrollInterval);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, [autoScrollInterval, items.length]); // Removed currentIndex to prevent infinite loop

  // Update ref when currentIndex changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Handle scroll events
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / containerWidth);
    if (index !== currentIndex && index >= 0 && index < items.length) {
      setCurrentIndex(index);
    }
  };

  // Handle manual scroll
  const handleManualScroll = (index: number) => {
    if (flatListRef.current && index >= 0 && index < items.length) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
      });
      setCurrentIndex(index);
    }
  };

  // Handle container layout
  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Render carousel item
  const renderItem = ({ item }: { item: CarouselItem }) => (
    <View style={[styles.carouselItem, { width: containerWidth }]}>
      {item.content}
    </View>
  );

  // Render indicator dots
  const renderIndicators = () => {
    if (!showIndicators || items.length <= 1) return null;

    return (
      <View style={styles.indicatorsContainer}>
        {items.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index === currentIndex 
                  ? theme.colors.primary 
                  : theme.colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
            onPress={() => handleManualScroll(index)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    );
  };

  // Handle scroll to index errors
  const handleScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 100));
    wait.then(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: Math.min(info.index, items.length - 1),
          animated: true,
        });
      }
    });
  };

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, { height }, style]} onLayout={handleLayout}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        getItemLayout={(data, index) => ({
          length: containerWidth,
          offset: containerWidth * index,
          index,
        })}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        decelerationRate="fast"
        snapToInterval={containerWidth}
        snapToAlignment="center"
      />
      {renderIndicators()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  carouselItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: getResponsiveSpacing('md'),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSpacing('xs'),
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
}); 