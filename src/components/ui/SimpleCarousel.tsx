import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface CarouselItem {
  id: string;
  content: React.ReactNode;
}

interface SimpleCarouselProps {
  items: CarouselItem[];
  autoScrollInterval?: number;
  showIndicators?: boolean;
  height?: number;
  style?: any;
}

export const SimpleCarousel: React.FC<SimpleCarouselProps> = ({
  items,
  autoScrollInterval = 3000,
  showIndicators = true,
  height = 200,
  style,
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (items.length <= 1) return;

    const startAutoScroll = () => {
      autoScrollTimer.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
      }, autoScrollInterval);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [autoScrollInterval, items.length]);

  // Handle manual navigation
  const handleManualNavigation = (index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
    }
  };

  // Handle next/previous
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <View style={[styles.container, { height }, style]}>
      {/* Main Content with padding to avoid navigation overlap */}
      <View style={styles.contentContainer}>
        {currentItem.content}
      </View>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={handlePrevious}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonText, { color: theme.colors.text }]}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonText, { color: theme.colors.text }]}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
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
              onPress={() => handleManualNavigation(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      )}

      {/* Counter */}
      {items.length > 1 && (
        <View style={styles.counterContainer}>
          <Text style={[styles.counterText, { color: theme.colors.textSecondary }]}>
            {currentIndex + 1} / {items.length}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Add horizontal padding to make room for navigation arrows
    paddingHorizontal: getResponsiveSpacing('xl'),
    // Add bottom padding to make room for indicators
    paddingBottom: getResponsiveSpacing('lg'),
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  prevButton: {
    left: getResponsiveSpacing('sm'),
  },
  nextButton: {
    right: getResponsiveSpacing('sm'),
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: getResponsiveSpacing('sm'),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSpacing('xs'),
    zIndex: 10,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  counterContainer: {
    position: 'absolute',
    top: getResponsiveSpacing('sm'),
    right: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('sm'),
    zIndex: 10,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
}); 