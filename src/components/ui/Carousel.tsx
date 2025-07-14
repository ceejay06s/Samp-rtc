import React, { useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  ViewToken,
  useWindowDimensions
} from 'react-native';
import { isDesktopBrowser } from '../../utils/platform';
import { useTheme } from '../../utils/themes';

interface CarouselProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor?: (item: any, index: number) => string;
  showPagination?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  style?: any;
}

export const Carousel: React.FC<CarouselProps> = ({
  data,
  renderItem,
  keyExtractor = (_, index) => index.toString(),
  showPagination = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  style,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Responsive item width calculation
  const getItemWidth = () => {
    if (isDesktopBrowser()) {
      // On desktop, use a wider width to prevent text overflow
      return Math.min(380, screenWidth * 0.4);
    }
    // On mobile, use a more appropriate width that works better
    return Math.min(screenWidth - 48, 320);
  };

  const itemWidth = getItemWidth();
  const itemSpacing = isDesktopBrowser() ? 24 : 16;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderCarouselItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={[
        styles.itemContainer, 
        { 
          width: itemWidth,
          marginRight: itemSpacing
        }
      ]}>
        {renderItem(item, index)}
      </View>
    );
  };

  const renderPaginationDots = () => {
    if (!showPagination) return null;

    return (
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === activeIndex 
                  ? theme.colors.primary 
                  : theme.colors.border,
                width: index === activeIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderCarouselItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={!isDesktopBrowser()}
        snapToInterval={itemWidth + itemSpacing}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={[
          styles.contentContainer,
          isDesktopBrowser() && styles.desktopContentContainer
        ]}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: itemWidth + itemSpacing,
          offset: (itemWidth + itemSpacing) * index,
          index,
        })}
      />
      {renderPaginationDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  desktopContentContainer: {
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  itemContainer: {
    // marginRight is now set dynamically
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
}); 