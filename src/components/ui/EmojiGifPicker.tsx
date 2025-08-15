import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useViewport } from '../../hooks/useViewport';
import { EmojiGifService } from '../../services/emojiGifService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

// Import the React Native emoji picker
import EmojiSelector from '@alextbogdanov/react-native-emoji-selector';

const { width: screenWidth } = Dimensions.get('window');

interface EmojiGifPickerProps {
  visible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
  onStickerSelect: (stickerUrl: string) => void;
}

type TabType = 'emoji' | 'gif' | 'sticker';

export const EmojiGifPicker: React.FC<EmojiGifPickerProps> = ({
  visible,
  onClose,
  onEmojiSelect,
  onGifSelect,
  onStickerSelect,
}) => {
  const theme = useTheme();
  const { isWeb, isDesktopBrowser } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser;
  
  const [activeTab, setActiveTab] = useState<TabType>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [loadingStickers, setLoadingStickers] = useState(false);

  // Load trending GIFs when GIF tab is selected
  useEffect(() => {
    if (activeTab === 'gif' && gifs.length === 0) {
      loadTrendingGifs();
    }
  }, [activeTab]);

  // Load trending stickers when sticker tab is selected
  useEffect(() => {
    if (activeTab === 'sticker' && stickers.length === 0) {
      loadTrendingStickers();
    }
  }, [activeTab]);

  const loadTrendingGifs = async () => {
    try {
      setLoadingGifs(true);
      const trendingGifs = await EmojiGifService.getTrendingGifs(20);
      setGifs(trendingGifs);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
    } finally {
      setLoadingGifs(false);
    }
  };

  const loadTrendingStickers = async () => {
    try {
      setLoadingStickers(true);
      const trendingStickers = await EmojiGifService.getTrendingStickers(20);
      setStickers(trendingStickers);
    } catch (error) {
      console.error('Error loading trending stickers:', error);
    } finally {
      setLoadingStickers(false);
    }
  };

  const searchGifs = async () => {
    if (!searchQuery.trim()) {
      await loadTrendingGifs();
      return;
    }

    try {
      setLoadingGifs(true);
      const searchResults = await EmojiGifService.searchGifs(searchQuery, 20);
      setGifs(searchResults);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setLoadingGifs(false);
    }
  };

  const searchStickers = async () => {
    if (!searchQuery.trim()) {
      await loadTrendingStickers();
      return;
    }

    try {
      setLoadingStickers(true);
      const searchResults = await EmojiGifService.searchStickers(searchQuery, 20);
      setStickers(searchResults);
    } catch (error) {
      console.error('Error searching stickers:', error);
    } finally {
      setLoadingStickers(false);
    }
  };

  const handleEmojiPress = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  const handleGifPress = (gifUrl: string) => {
    onGifSelect(gifUrl);
    onClose();
  };

  const handleStickerPress = (stickerUrl: string) => {
    onStickerSelect(stickerUrl);
    onClose();
  };

  const renderEmojiTab = () => (
    <View style={styles.tabContent}>
      <EmojiSelector
        onEmojiSelected={handleEmojiPress}
        showSearchBar={true}
        showHistory={true}
        showSectionTitles={true}
        showTabs={true}
        columns={isDesktop ? 12 : 8}
      />
    </View>
  );

  const renderGifTab = () => (
    <View style={styles.tabContent}>
      <View style={[
        styles.searchContainer,
        isDesktop && styles.desktopSearchContainer
      ]}>
        <TextInput
          style={[
            styles.searchInput, 
            { 
              backgroundColor: theme.colors.surface,
              fontSize: isDesktop ? getResponsiveFontSize('md') : getResponsiveFontSize('sm'),
              paddingHorizontal: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
              paddingVertical: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
              borderRadius: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
            }
          ]}
          placeholder="Search GIFs..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchGifs}
        />
        <TouchableOpacity 
          style={[
            styles.searchButton, 
            isDesktop && styles.desktopSearchButton
          ]} 
          onPress={searchGifs}
        >
          <MaterialIcons 
            name="search" 
            size={isDesktop ? 24 : 20} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {loadingGifs ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading GIFs...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.gifContainer} showsVerticalScrollIndicator={isDesktop}>
          <View style={[
            styles.gifGrid,
            isDesktop && styles.desktopGifGrid
          ]}>
            {gifs.map((gif, index) => (
              <TouchableOpacity
                key={gif.id || index}
                style={[
                  styles.gifItem,
                  isDesktop && styles.desktopGifItem
                ]}
                onPress={() => handleGifPress(gif.url)}
              >
                <Image source={{ uri: gif.url }} style={styles.gifImage} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderStickerTab = () => (
    <View style={styles.tabContent}>
      <View style={[
        styles.searchContainer,
        isDesktop && styles.desktopSearchContainer
      ]}>
        <TextInput
          style={[
            styles.searchInput, 
            { 
              backgroundColor: theme.colors.surface,
              fontSize: isDesktop ? getResponsiveFontSize('md') : getResponsiveFontSize('sm'),
              paddingHorizontal: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
              paddingVertical: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
              borderRadius: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
            }
          ]}
          placeholder="Search stickers..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchStickers}
        />
        <TouchableOpacity 
          style={[
            styles.searchButton, 
            isDesktop && styles.desktopSearchButton
          ]} 
          onPress={searchStickers}
        >
          <MaterialIcons 
            name="search" 
            size={isDesktop ? 24 : 20} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {loadingStickers ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading stickers...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.gifContainer} showsVerticalScrollIndicator={isDesktop}>
          <View style={[
            styles.gifGrid,
            isDesktop && styles.desktopGifGrid
          ]}>
            {stickers.map((sticker, index) => (
              <TouchableOpacity
                key={sticker.id || index}
                style={[
                  styles.gifItem,
                  isDesktop && styles.desktopGifItem
                ]}
                onPress={() => handleStickerPress(sticker.url)}
              >
                <Image source={{ uri: sticker.url }} style={styles.gifImage} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'emoji':
        return renderEmojiTab();
      case 'gif':
        return renderGifTab();
      case 'sticker':
        return renderStickerTab();
      default:
        return renderEmojiTab();
    }
  };

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && { backgroundColor: theme.colors.primary },
        isDesktop && styles.desktopTabButton
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <MaterialIcons
        name={icon as any}
        size={isDesktop ? 24 : 20}
        color={activeTab === tab ? theme.colors.onPrimary : theme.colors.text}
      />
      <Text
        style={[
          styles.tabButtonText,
          { 
            color: activeTab === tab ? theme.colors.onPrimary : theme.colors.text,
            fontSize: isDesktop ? getResponsiveFontSize('md') : getResponsiveFontSize('sm'),
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent, 
          { 
            backgroundColor: theme.colors.background,
            maxWidth: isDesktop ? 800 : '100%',
            maxHeight: isDesktop ? '80%' : '80%',
          }
        ]}>
          <View style={[
            styles.modalHeader,
            isDesktop && styles.desktopModalHeader
          ]}>
            <Text style={[
              styles.modalTitle, 
              { 
                color: theme.colors.text,
                fontSize: isDesktop ? getResponsiveFontSize('xl') : getResponsiveFontSize('lg'),
              }
            ]}>
              Add Emoji, GIF, or Sticker
            </Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={[
                styles.closeButton,
                isDesktop && styles.desktopCloseButton
              ]}
            >
              <MaterialIcons 
                name="close" 
                size={isDesktop ? 28 : 24} 
                color={theme.colors.text} 
              />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.tabContainer,
            isDesktop && styles.desktopTabContainer
          ]}>
            {renderTabButton('emoji', 'Emoji', 'emoji-emotions')}
            {renderTabButton('gif', 'GIF', 'gif')}
            {renderTabButton('sticker', 'Sticker', 'sticker-emoji')}
          </View>

          {renderTabContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center', // Center on desktop
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: getResponsiveSpacing('md'),
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  desktopModalHeader: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    padding: getResponsiveSpacing('sm'),
  },
  desktopCloseButton: {
    padding: getResponsiveSpacing('md'),
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
    borderRadius: 8,
    overflow: 'hidden',
  },
  desktopTabContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  desktopTabButton: {
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('md'),
  },
  tabButtonText: {
    marginLeft: getResponsiveSpacing('sm'),
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
  },
  desktopSearchContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  searchInput: {
    flex: 1,
    marginRight: getResponsiveSpacing('sm'),
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopSearchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: getResponsiveSpacing('md'),
    fontSize: getResponsiveFontSize('sm'),
  },
  gifContainer: {
    flex: 1,
  },
  gifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  desktopGifGrid: {
    justifyContent: 'flex-start',
    gap: getResponsiveSpacing('sm'),
  },
  gifItem: {
    width: (screenWidth - 80) / 2,
    height: (screenWidth - 80) / 2,
    marginBottom: getResponsiveSpacing('sm'),
    borderRadius: 8,
    overflow: 'hidden',
  },
  desktopGifItem: {
    width: 180,
    height: 180,
    marginBottom: getResponsiveSpacing('md'),
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
}); 