import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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
import { Sticker, StickerPack, StickerService } from '../../services/stickerService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { TGSSimpleRenderer } from './TGSSimpleRenderer';

// Import the React Native emoji picker
import EmojiSelector from '@alextbogdanov/react-native-emoji-selector';

const { width: screenWidth } = Dimensions.get('window');

interface EmojiGifPickerProps {
  visible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
  onStickerSelect: (stickerUrl: string | Sticker) => void;
}

type TabType = 'emoji' | 'gif' | 'sticker';
type StickerViewMode = 'packs' | 'stickers';

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
  const [loadingGifs, setLoadingGifs] = useState(false);
  
  // Sticker pack related state
  const [stickerViewMode, setStickerViewMode] = useState<StickerViewMode>('packs');
  const [selectedStickerPack, setSelectedStickerPack] = useState<StickerPack | null>(null);
  const [stickerPacks, setStickerPacks] = useState<StickerPack[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const [stickerError, setStickerError] = useState<string | null>(null);

  // Load trending GIFs when GIF tab is selected
  useEffect(() => {
    if (activeTab === 'gif' && gifs.length === 0) {
      loadTrendingGifs();
    }
  }, [activeTab]);

  // Load sticker packs when sticker tab is selected
  useEffect(() => {
    if (activeTab === 'sticker') {
      if (stickerViewMode === 'packs' && stickerPacks.length === 0) {
        loadStickerPacks();
      } else if (stickerViewMode === 'stickers' && selectedStickerPack) {
        loadStickersFromPack(selectedStickerPack.shortname);
      }
    }
  }, [activeTab, stickerViewMode, selectedStickerPack]);

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

  const loadStickerPacks = async () => {
    try {
      setLoadingStickers(true);
      setStickerError(null);
      
      // Check if storage is accessible
      const hasAccess = await StickerService.checkStorageAccess();
      if (!hasAccess) {
        setStickerError('Unable to access sticker storage. Please check your connection.');
        return;
      }

      const packs = await StickerService.getStickerPacks();
      setStickerPacks(packs);
      
      if (packs.length === 0) {
        setStickerError('No sticker packs found. Upload some stickers to get started!');
      }
    } catch (error) {
      console.error('Error loading sticker packs:', error);
      setStickerError('Failed to load sticker packs. Please try again.');
    } finally {
      setLoadingStickers(false);
    }
  };

  const loadStickersFromPack = async (packName: string) => {
    try {
      setLoadingStickers(true);
      setStickerError(null);
      
      const packStickers = await StickerService.getStickersFromPack(packName, 50);
      setStickers(packStickers);
      
      if (packStickers.length === 0) {
        setStickerError('No stickers found in this pack.');
      }
    } catch (error) {
      console.error('Error loading stickers from pack:', error);
      setStickerError('Failed to load stickers from pack. Please try again.');
    } finally {
      setLoadingStickers(false);
    }
  };

  const loadTrendingStickers = async () => {
    try {
      setLoadingStickers(true);
      setStickerError(null);
      
      // Try to get trending stickers from StickerService first
      const trendingStickers = await StickerService.getTrendingStickers(20);
      if (trendingStickers.length > 0) {
        setStickers(trendingStickers);
        setStickerViewMode('stickers');
        setSelectedStickerPack(null);
        return;
      }
      
      // Fallback to random stickers if no trending ones
      const randomStickers = await StickerService.getRandomStickers(20);
      setStickers(randomStickers);
      setStickerViewMode('stickers');
      setSelectedStickerPack(null);
    } catch (error) {
      console.error('Error loading trending stickers:', error);
      setStickerError('Failed to load trending stickers. Please try again.');
    } finally {
      setLoadingStickers(false);
    }
  };

  const loadAnimatedStickers = async () => {
    try {
      setLoadingStickers(true);
      setStickerError(null);
      
      const animatedStickers = await StickerService.getAnimatedStickers(20);
      setStickers(animatedStickers);
      setStickerViewMode('stickers');
      setSelectedStickerPack(null);
    } catch (error) {
      console.error('Error loading animated stickers:', error);
      setStickerError('Failed to load animated stickers. Please try again.');
    } finally {
      setLoadingStickers(false);
    }
  };

  const loadTelegramStickers = async () => {
    try {
      setLoadingStickers(true);
      setStickerError(null);
      
      const telegramStickers = await StickerService.getTelegramStickers(20);
      setStickers(telegramStickers);
      setStickerViewMode('stickers');
      setSelectedStickerPack(null);
    } catch (error) {
      console.error('Error loading Telegram stickers:', error);
      setStickerError('Failed to load Telegram stickers. Please try again.');
    } finally {
      setLoadingStickers(false);
    }
  };

  const handlePackSelect = async (pack: StickerPack) => {
    setSelectedStickerPack(pack);
    setStickerViewMode('stickers');
    await loadStickersFromPack(pack.shortname);
  };

  const handleBackToPacks = () => {
    setStickerViewMode('packs');
    setSelectedStickerPack(null);
    setStickers([]);
    setStickerError(null);
  };

  const handleQuickAccess = (type: 'trending' | 'animated' | 'telegram') => {
    switch (type) {
      case 'trending':
        loadTrendingStickers();
        break;
      case 'animated':
        loadAnimatedStickers();
        break;
      case 'telegram':
        loadTelegramStickers();
        break;
    }
  };

  const refreshStickerPacks = async () => {
    try {
      setLoadingStickers(true);
      setStickerError(null);
      
      // Force refresh from storage
      const packs = await StickerService.refreshStickerPacks();
      setStickerPacks(packs);
      
      if (packs.length === 0) {
        setStickerError('No sticker packs found. Upload some stickers to get started!');
      }
    } catch (error) {
      console.error('Error refreshing sticker packs:', error);
      setStickerError('Failed to refresh sticker packs. Please try again.');
    } finally {
      setLoadingStickers(false);
    }
  };

  const getStickerStats = async () => {
    try {
      const stats = await StickerService.getStickerStats();
      console.log('Sticker statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting sticker stats:', error);
      return null;
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
      if (stickerViewMode === 'packs') {
        await loadStickerPacks();
      } else if (selectedStickerPack) {
        await loadStickersFromPack(selectedStickerPack.shortname);
      }
      return;
    }

    try {
      setLoadingStickers(true);
      setStickerError(null);
      
      if (stickerViewMode === 'packs') {
        // Search across all packs
        const searchResults = await StickerService.searchStickers(searchQuery, 20);
        setStickers(searchResults);
        setStickerViewMode('stickers');
        setSelectedStickerPack(null);
      } else if (selectedStickerPack) {
        // Search within selected pack
        const packStickers = await StickerService.getStickersFromPack(selectedStickerPack.shortname, 100);
        const matchingStickers = packStickers.filter(sticker => 
          sticker.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setStickers(matchingStickers);
      }
    } catch (error) {
      console.error('Error searching stickers:', error);
      setStickerError('Failed to search stickers. Please try again.');
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

  const handleStickerPress = (sticker: Sticker) => {
    // For backward compatibility, pass the sticker URL if the callback expects a string
    if (typeof onStickerSelect === 'function') {
      onStickerSelect(sticker.url);
    }
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
      {/* Header with back button when viewing stickers from a pack */}
      {stickerViewMode === 'stickers' && selectedStickerPack && (
        <View style={styles.stickerHeader}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackToPacks}
          >
            <MaterialIcons 
              name="arrow-back" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <Text style={[styles.packTitle, { color: theme.colors.text }]}>
            {selectedStickerPack.name}
          </Text>
          <View style={styles.placeholder} />
        </View>
      )}

      {/* Header for sticker packs view */}
      {stickerViewMode === 'packs' && (
        <View style={styles.stickerHeader}>
          <View style={styles.placeholder} />
          <Text style={[styles.packTitle, { color: theme.colors.text }]}>
            Sticker Packs
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={refreshStickerPacks}
          >
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Stats display for sticker packs */}
      {stickerViewMode === 'packs' && stickerPacks.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
            {stickerPacks.length} packs available
          </Text>
        </View>
      )}

      {/* Quick access buttons */}
      <View style={[
        styles.quickAccessContainer,
        isDesktop && styles.desktopQuickAccessContainer
      ]}>
        <TouchableOpacity
          style={[styles.quickAccessButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleQuickAccess('trending')}
        >
          <MaterialIcons name="trending-up" size={16} color={theme.colors.onPrimary} />
          <Text style={[styles.quickAccessText, { color: theme.colors.onPrimary }]}>
            Trending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickAccessButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleQuickAccess('animated')}
        >
          <MaterialIcons name="play-circle-outline" size={16} color={theme.colors.text} />
          <Text style={[styles.quickAccessText, { color: theme.colors.text }]}>
            Animated
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickAccessButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleQuickAccess('telegram')}
        >
          <MaterialIcons name="telegram" size={16} color={theme.colors.text} />
          <Text style={[styles.quickAccessText, { color: theme.colors.text }]}>
            Telegram
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
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
          placeholder={stickerViewMode === 'packs' ? "Search sticker packs..." : "Search stickers..."}
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
            Loading {stickerViewMode === 'packs' ? 'sticker packs' : 'stickers'}...
          </Text>
        </View>
      ) : stickerError ? (
        <View style={styles.errorContainer}>
          <MaterialIcons 
            name="error-outline" 
            size={48} 
            color={theme.colors.textSecondary} 
          />
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {stickerError}
          </Text>
        </View>
      ) : stickerViewMode === 'packs' ? (
        // Render sticker packs
        <FlatList
          data={stickerPacks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.packItem}
              onPress={() => handlePackSelect(item)}
            >
              <View style={styles.packPreview}>
                {item.previewUrl ? (
                  <Image source={{ uri: item.previewUrl }} style={styles.packPreviewImage} />
                ) : (
                  <View style={[styles.packPreviewPlaceholder, { backgroundColor: theme.colors.surface }]}>
                    <MaterialIcons 
                      name="emoji-emotions" 
                      size={32} 
                      color={theme.colors.textSecondary} 
                    />
                  </View>
                )}
              </View>
              <View style={styles.packInfo}>
                <Text style={[styles.packName, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.packCount, { color: theme.colors.textSecondary }]}>
                  {item.stickerCount} stickers
                </Text>
              </View>
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={isDesktop}
        />
      ) : (
        // Render stickers from selected pack
        <ScrollView style={styles.gifContainer} showsVerticalScrollIndicator={isDesktop}>
          <View style={[
            styles.gifGrid,
            isDesktop && styles.desktopGifGrid
          ]}>
            {stickers.map((sticker, index) => {
              const isTGS = sticker.fileType === 'tgs';
              
              return (
                <TouchableOpacity
                  key={sticker.id || index}
                  style={[
                    styles.gifItem,
                    isDesktop && styles.desktopGifItem
                  ]}
                  onPress={() => handleStickerPress(sticker)}
                >
                  {isTGS ? (
                    <TGSSimpleRenderer
                      url={sticker.url}
                      width={isDesktop ? 180 : (screenWidth - 80) / 2}
                      height={isDesktop ? 180 : (screenWidth - 80) / 2}
                      autoPlay={true}
                      loop={true}
                      style={styles.gifImage}
                    />
                  ) : (
                    <Image source={{ uri: sticker.url }} style={styles.gifImage} />
                  )}
                  {sticker.isAnimated && (
                    <View style={styles.animatedBadge}>
                      <MaterialIcons name="play-circle-outline" size={16} color={theme.colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
            {renderTabButton('sticker', 'Sticker', 'emoji-emotions')}
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
  animatedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 2,
  },
  // New styles for sticker packs
  stickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  backButton: {
    padding: getResponsiveSpacing('sm'),
  },
  refreshButton: {
    padding: getResponsiveSpacing('sm'),
  },
  packTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40, // Placeholder for the chevron
  },
  packItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  packPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: getResponsiveSpacing('sm'),
  },
  packPreviewImage: {
    width: '100%',
    height: '100%',
  },
  packPreviewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  packInfo: {
    flex: 1,
    marginRight: getResponsiveSpacing('sm'),
  },
  packName: {
    fontWeight: 'bold',
    fontSize: getResponsiveFontSize('md'),
  },
  packCount: {
    fontSize: getResponsiveFontSize('sm'),
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: getResponsiveSpacing('md'),
  },
  errorText: {
    marginTop: getResponsiveSpacing('md'),
    textAlign: 'center',
    fontSize: getResponsiveFontSize('md'),
  },
  // Quick access button styles
  quickAccessContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
    gap: getResponsiveSpacing('sm'),
  },
  desktopQuickAccessContainer: {
    marginBottom: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('md'),
  },
  quickAccessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('md'),
    gap: getResponsiveSpacing('xs'),
  },
  quickAccessText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  statsText: {
    fontSize: getResponsiveFontSize('sm'),
    opacity: 0.8,
  },
}); 