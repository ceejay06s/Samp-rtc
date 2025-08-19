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
  View
} from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useViewport } from '../../hooks/useViewport';
import { EmojiService } from '../../services/emojiService';
import { GiphyService } from '../../services/giphyService';
import { Sticker, StickerPack, StickerService } from '../../services/stickerService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { TGSRendererV2 } from './TGSRendererV2';

const { width: screenWidth } = Dimensions.get('window');

interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onStickerSelect: (sticker: Sticker) => void;
}

type ViewMode = 'packs' | 'stickers';
type StickerSubTab = 'emoji' | 'gif' | 'stickers' | 'recent' | 'favorites';

export const StickerPicker: React.FC<StickerPickerProps> = ({
  visible,
  onClose,
  onStickerSelect,
}) => {
  const theme = useTheme();
  const { isWeb, isDesktopBrowser } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser;

  const [viewMode, setViewMode] = useState<ViewMode>('packs');
  const [selectedPack, setSelectedPack] = useState<StickerPack | null>(null);
  const [stickerSubTab, setStickerSubTab] = useState<StickerSubTab>('stickers');
  const [searchQuery, setSearchQuery] = useState('');
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sticker packs when component mounts
  useEffect(() => {
    if (visible) {
      console.log('🎨 Sticker picker opened, loading packs...');
      setViewMode('packs');
      setSelectedPack(null);
      setStickers([]);
      setError(null);
      loadStickerPacks();
    }
  }, [visible]);

  // Load stickers when pack is selected or sub-tab changes
  useEffect(() => {
    if (viewMode === 'stickers') {
      loadStickersBySubTab();
    }
  }, [selectedPack, viewMode, stickerSubTab]);

  const loadStickerPacks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if storage is accessible
      const hasAccess = await StickerService.checkStorageAccess();
      if (!hasAccess) {
        setError('Unable to access sticker storage. Please check your connection.');
        return;
      }

      const stickerPacks = await StickerService.getStickerPacks();
      setPacks(stickerPacks);
      
      if (stickerPacks.length === 0) {
        setError('No sticker packs found. Upload some stickers to get started!');
      }
    } catch (error) {
      console.error('Error loading sticker packs:', error);
      setError('Failed to load sticker packs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStickersFromPack = async (packName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎨 Loading stickers from pack:', packName);
      const packStickers = await StickerService.getStickersFromPack(packName, 100);
      console.log('🎨 Pack stickers loaded:', packStickers.length, 'stickers');
      console.log('🎨 First few stickers:', packStickers.slice(0, 3));
      
      setStickers(packStickers);
      
      if (packStickers.length === 0) {
        setError('No stickers found in this pack.');
      }
    } catch (error) {
      console.error('Error loading stickers from pack:', error);
      setError('Failed to load stickers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStickersBySubTab = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let stickerResults: Sticker[] = [];
      
      switch (stickerSubTab) {
        case 'emoji':
          // Load default emoji category (Recent - commonly used)
          const recentEmojis = EmojiService.getCommonlyUsedEmojis(20);
          stickerResults = recentEmojis.map(emojiData => {
            const sticker: any = EmojiService.convertEmojiToSticker(emojiData);
            sticker.categoryName = 'Recent';
            return sticker;
          });
          break;
        case 'gif':
          // Giphy API - search for trending GIFs
          console.log('🎨 Loading GIFs from GIPHY...');
          if (!GiphyService.isConfigured()) {
            console.error('🎨 GIPHY API not configured');
            setError('Giphy API not configured. Please add your Giphy API key to .env file');
            setLoading(false);
            return;
          }
          
          try {
            if (searchQuery.trim()) {
              console.log('🎨 Searching GIPHY for:', searchQuery);
              const giphyGifs = await GiphyService.searchGifs(searchQuery, 50);
              console.log('🎨 GIPHY search results:', giphyGifs.length, 'GIFs');
              stickerResults = giphyGifs.map(gif => GiphyService.convertGiphyToSticker(gif));
            } else {
              console.log('🎨 Loading trending GIFs from GIPHY');
              const giphyGifs = await GiphyService.getTrendingGifs(50);
              console.log('🎨 GIPHY trending results:', giphyGifs.length, 'GIFs');
              stickerResults = giphyGifs.map(gif => GiphyService.convertGiphyToSticker(gif));
            }
            console.log('🎨 GIFs converted to stickers:', stickerResults.length);
          } catch (giphyError) {
            console.error('🎨 GIPHY error:', giphyError);
            setError('Failed to load GIFs from GIPHY. Please try again.');
          }
          break;
        case 'stickers':
          // Load stickers from selected pack or all stickers
          if (selectedPack) {
            console.log('🎨 Loading stickers from selected pack:', selectedPack.shortname);
            stickerResults = await StickerService.getStickersFromPack(selectedPack.shortname, 100);
          } else {
            console.log('🎨 Loading trending stickers');
            stickerResults = await StickerService.getTrendingStickers(50);
          }
          console.log('🎨 Stickers loaded for stickers tab:', stickerResults.length);
          break;
        case 'recent':
          // Load recently used stickers (placeholder for now)
          stickerResults = await StickerService.getRandomStickers(30);
          break;
        case 'favorites':
          // Load favorite stickers (placeholder for now)
          stickerResults = await StickerService.getTrendingStickers(30);
          break;
      }
      
      setStickers(stickerResults);
      
      console.log('🎨 Stickers state updated:', {
        count: stickerResults.length,
        fileTypes: stickerResults.map(s => s.fileType),
        firstFew: stickerResults.slice(0, 3).map(s => ({ name: s.name, fileType: s.fileType, url: s.url }))
      });
      
      if (stickerResults.length === 0) {
        setError(`No stickers found for ${stickerSubTab}.`);
      }
    } catch (error) {
      console.error('Error loading stickers by sub-tab:', error);
      setError('Failed to load stickers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchStickers = async () => {
    if (!searchQuery.trim()) {
      await loadStickersBySubTab();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let searchResults: Sticker[] = [];
      
      if (stickerSubTab === 'emoji') {
        // Search emojis by shortcode or keyword
        const emojiResults = EmojiService.searchEmojis(searchQuery);
        searchResults = emojiResults.map(emoji => EmojiService.convertEmojiToSticker(emoji));
      } else if (stickerSubTab === 'gif') {
        // Search Giphy for GIFs
        if (!GiphyService.isConfigured()) {
          setError('Giphy API not configured. Please add your Giphy API key to .env file');
          setLoading(false);
          return;
        }
        
        const giphyGifs = await GiphyService.searchGifs(searchQuery, 50);
        searchResults = giphyGifs.map(gif => GiphyService.convertGiphyToSticker(gif));
      } else {
        // Search stickers from storage
        searchResults = await StickerService.searchStickers(searchQuery, 50);
      }
      
      setStickers(searchResults);
      
      if (searchResults.length === 0) {
        setError(`No ${stickerSubTab === 'emoji' ? 'emojis' : stickerSubTab === 'gif' ? 'GIFs' : 'stickers'} found matching "${searchQuery}"`);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePackSelect = async (pack: StickerPack) => {
    console.log('🎨 Pack selected:', pack.name, pack.shortname);
    setSelectedPack(pack);
    setViewMode('stickers');
    setStickerSubTab('stickers');
    
    // Load stickers from the selected pack immediately
    try {
      console.log('🎨 Loading stickers from selected pack:', pack.shortname);
      const packStickers = await StickerService.getStickersFromPack(pack.shortname, 100);
      console.log('🎨 Stickers loaded from pack:', packStickers.length);
      setStickers(packStickers);
    } catch (error) {
      console.error('Error loading stickers from pack:', error);
      setError('Failed to load stickers from pack. Please try again.');
    }
  };

  const handleStickerSelect = (sticker: Sticker) => {
    onStickerSelect(sticker);
    onClose();
  };

  const handleBackToPacks = () => {
    console.log('🎨 Back to packs clicked');
    setSelectedPack(null);
    setViewMode('packs');
    setStickers([]);
    setError(null);
  };

  const renderPackItem = ({ item }: { item: StickerPack }) => (
    <TouchableOpacity
      style={[
        styles.packItem,
        isDesktop && styles.desktopPackItem
      ]}
      onPress={() => handlePackSelect(item)}
    >
      <View style={styles.packPreview}>
        {item.previewUrl ? (
          <Image source={{ uri: item.previewUrl }} style={styles.packPreviewImage} />
        ) : (
          <View style={[styles.packPreviewPlaceholder, { backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="emoji-emotions" size={32} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.packInfo}>
        <Text style={[styles.packName, { color: theme.colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.packCount, { color: theme.colors.textSecondary }]}>
          {item.stickerCount} stickers
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderStickerItem = ({ item }: { item: Sticker }) => {
    const isTGS = item.fileType === 'tgs';
    const isWebP = item.fileType === 'webp';
    const isGIF = item.fileType === 'gif';
    
    console.log('🎨 Rendering sticker:', {
      name: item.name,
      fileType: item.fileType,
      url: item.url,
      isAnimated: item.isAnimated
    });
    
    return (
      <TouchableOpacity
        style={[
          styles.stickerItem,
          isDesktop && styles.desktopStickerItem
        ]}
        onPress={() => handleStickerSelect(item)}
      >
        {isTGS ? (
          <TGSRendererV2
            url={item.url}
            width={80}
            height={80}
            autoPlay={true}
            loop={true}
            style={styles.stickerImage}
          />
        ) : (
          <View style={styles.imageContainer}>
            {/* Simplified image rendering for all non-TGS files */}
            <Image 
              source={{ uri: item.url }} 
              style={styles.stickerImage}
              resizeMode="contain"
              onError={(error) => {
                console.error('Sticker image failed to load:', item.url, error.nativeEvent.error);
                // Could add a fallback image here
              }}
              onLoad={() => console.log('Sticker image loaded successfully:', item.url)}
            />
            {/* Show file type indicator for debugging */}
            {__DEV__ && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>{item.fileType.toUpperCase()}</Text>
              </View>
            )}
          </View>
        )}
        {item.isAnimated && (
          <View style={styles.animatedBadge}>
            <MaterialIcons name="play-circle-outline" size={16} color={theme.colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={[
      styles.header,
      isDesktop && styles.desktopHeader
    ]}>
      <View style={styles.headerLeft}>
        {viewMode === 'stickers' && (
          <TouchableOpacity onPress={handleBackToPacks} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[
          styles.headerTitle,
          { color: theme.colors.text },
          isDesktop && styles.desktopHeaderTitle
        ]}>
          {viewMode === 'packs' ? 'Sticker Packs' : selectedPack?.name || 'Stickers'}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <MaterialIcons name="close" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={[
      styles.searchContainer,
      isDesktop && styles.desktopSearchContainer
    ]}>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            fontSize: isDesktop ? getResponsiveFontSize('md') : getResponsiveFontSize('sm'),
            paddingHorizontal: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
            paddingVertical: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
            borderRadius: isDesktop ? getResponsiveSpacing('lg') : getResponsiveSpacing('md'),
          }
        ]}
        placeholder={
          viewMode === 'packs' 
            ? 'Search packs...' 
            : stickerSubTab === 'emoji'
            ? 'Search emojis (e.g., :smiley:, :heart:, :cat:)'
            : stickerSubTab === 'gif'
            ? 'Search GIFs...'
            : 'Search stickers...'
        }
        placeholderTextColor={theme.colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={searchStickers}
      />
      <TouchableOpacity style={styles.searchButton} onPress={searchStickers}>
        <MaterialIcons name="search" size={isDesktop ? 24 : 20} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderStickerSubtabs = () => {
    if (viewMode !== 'stickers') return null;

    return (
      <View style={styles.simpleSubtabs}>
        {/* Top row: emoji | gif | stickers */}
        <View style={styles.topSubtabs}>
          <TouchableOpacity
            style={[
              styles.topTab,
              stickerSubTab === 'emoji' && styles.activeTopTab
            ]}
            onPress={() => setStickerSubTab('emoji')}
          >
            <Text style={[
              styles.topTabText,
              { color: stickerSubTab === 'emoji' ? theme.colors.primary : theme.colors.text }
            ]}>
              EMOJI
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.topTab,
              stickerSubTab === 'gif' && styles.activeTopTab
            ]}
            onPress={() => setStickerSubTab('gif')}
          >
            <Text style={[
              styles.topTabText,
              { color: stickerSubTab === 'gif' ? theme.colors.primary : theme.colors.text }
            ]}>
              GIF
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.topTab,
              stickerSubTab === 'stickers' && styles.activeTopTab
            ]}
            onPress={() => setStickerSubTab('stickers')}
          >
            <Text style={[
              styles.topTabText,
              { color: stickerSubTab === 'stickers' ? theme.colors.primary : theme.colors.text }
            ]}>
              STICKERS
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Bottom row: Dynamic content based on selected tab */}
        {stickerSubTab === 'emoji' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packTabsContent}
          >
            {EmojiService.getCategories().map((category, index) => {
              const isActive = stickers.length > 0 && (stickers[0] as any)?.categoryName === category.name;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.packTab,
                    styles.emojiCategoryTab,
                    isActive && styles.activePackTab
                  ]}
                  onPress={() => handleEmojiCategorySelect(category.name)}
                >
                  <Text style={[
                    styles.packTabText,
                    { color: isActive ? theme.colors.primary : theme.colors.text }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        
        {stickerSubTab === 'gif' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packTabsContent}
          >
            {GiphyService.getPopularCategories().map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.packTab,
                  styles.gifCategoryTab
                ]}
                onPress={() => handleGifCategorySelect(category)}
              >
                <Text style={[
                  styles.packTabText,
                  { color: theme.colors.text }
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {stickerSubTab === 'stickers' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packTabsContent}
          >
            {packs.map((pack) => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packTab,
                  selectedPack?.id === pack.id && styles.activePackTab
                ]}
                onPress={() => {
                  handlePackSelect(pack);
                  setViewMode('stickers');
                  setStickerSubTab('stickers');
                }}
              >
                <Text style={[
                  styles.packTabText,
                  { color: selectedPack?.id === pack.id ? theme.colors.primary : theme.colors.text }
                ]}>
                  {pack.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderEmojiPicker = () => {
    // Only show emojis from the currently selected category
    const selectedCategoryName = stickers.length > 0 && (stickers[0] as any)?.categoryName ? 
      (stickers[0] as any).categoryName : 'Recent';
    
    const selectedCategory = EmojiService.getCategories().find(cat => 
      cat.name === selectedCategoryName
    );
    
    if (!selectedCategory) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Select a category to view emojis
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emojiContainer}>
        <View style={[styles.emojiGrid, { justifyContent: 'flex-start' }]}>
          {selectedCategory.emojis.map((emojiData, emojiIndex) => (
            <TouchableOpacity
              key={emojiIndex}
              style={styles.emojiButton}
              onPress={() => handleEmojiSelect(emojiData)}
            >
              {emojiData.twemojiUrl && emojiData.twemojiUrl.startsWith('http') ? (
                <Image 
                  source={{ uri: emojiData.twemojiUrl }} 
                  style={styles.emojiImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.emojiText}>{emojiData.emoji}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderGiphyGifs = () => {
    if (stickers.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="gif" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Search for GIFs above to get started!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        key="giphy-gifs"
        data={stickers}
        renderItem={renderStickerItem}
        keyExtractor={(item) => item.id}
        numColumns={isDesktop ? 4 : 3}
        showsVerticalScrollIndicator={isDesktop}
        contentContainerStyle={styles.stickersContainer}
      />
    );
  };

  const handleEmojiSelect = (emojiData: any) => {
    // Convert emoji data to sticker format using the service
    const emojiSticker = EmojiService.convertEmojiToSticker(emojiData);
    handleStickerSelect(emojiSticker);
  };

  const handleEmojiCategorySelect = async (categoryName: string) => {
    setStickerSubTab('emoji');
    setSearchQuery(''); // Clear search query for emoji sub-tab
    
    const categoryEmojis = EmojiService.getEmojisByCategory(categoryName);
    const stickerResults = categoryEmojis.map(emojiData => {
      const sticker: any = EmojiService.convertEmojiToSticker(emojiData);
      // Add category name to help identify which category is selected
      sticker.categoryName = categoryName;
      return sticker;
    });
    
    setStickers(stickerResults);
  };

  const handleGifCategorySelect = async (categoryName: string) => {
    console.log('🎨 GIF category selected:', categoryName);
    setStickerSubTab('gif');
    setSearchQuery(''); // Clear search query for gif sub-tab
    let gifs: any[] = [];

    try {
      setLoading(true);
      setError(null);

      switch (categoryName) {
        case 'Recent':
          console.log('🎨 Loading recent GIFs from GIPHY');
          gifs = await GiphyService.getTrendingGifs(50);
          break;
        case 'Popular':
          console.log('🎨 Loading popular GIFs from GIPHY');
          gifs = await GiphyService.getTrendingGifs(50);
          break;
        case 'Trending':
          console.log('🎨 Loading trending GIFs from GIPHY');
          gifs = await GiphyService.getTrendingGifs(50);
          break;
        case 'Random':
          console.log('🎨 Loading random GIFs from GIPHY');
          gifs = await GiphyService.getRandomGifs(50);
          break;
        case 'Funny':
          console.log('🎨 Loading funny GIFs from GIPHY');
          gifs = await GiphyService.getGifsByCategory('funny', 50);
          break;
        case 'Cute':
          console.log('🎨 Loading cute GIFs from GIPHY');
          gifs = await GiphyService.getGifsByCategory('cute', 50);
          break;
        case 'Reactions':
          console.log('🎨 Loading reaction GIFs from GIPHY');
          gifs = await GiphyService.getGifsByCategory('reactions', 50);
          break;
        default:
          console.log('🎨 Loading default trending GIFs from GIPHY');
          gifs = await GiphyService.getTrendingGifs(50); // Fallback to trending
          break;
      }

      console.log('🎨 GIPHY GIFs loaded:', gifs.length);
      const stickerResults = gifs.map(gif => GiphyService.convertGiphyToSticker(gif));
      console.log('🎨 GIFs converted to stickers:', stickerResults.length);
      setStickers(stickerResults);
      
      if (stickerResults.length === 0) {
        setError(`No GIFs found for ${categoryName}. Please try another category.`);
      }
    } catch (error) {
      console.error('Error loading GIFs by category:', error);
      setError('Failed to load GIFs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    console.log('🎨 renderContent called:', {
      viewMode,
      stickerSubTab,
      selectedPack: selectedPack?.name,
      stickersCount: stickers.length,
      loading,
      error
    });

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading {viewMode === 'packs' ? 'sticker packs' : 'stickers'}...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={viewMode === 'packs' ? loadStickerPacks : () => selectedPack && loadStickersFromPack(selectedPack.shortname)}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (viewMode === 'packs') {
      return (
        <FlatList
          key="packs-list"
          data={packs}
          renderItem={renderPackItem}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 3 : 2}
          showsVerticalScrollIndicator={isDesktop}
          contentContainerStyle={styles.packsContainer}
        />
      );
    }

    if (stickerSubTab === 'emoji') {
      return renderEmojiPicker();
    }

    if (stickerSubTab === 'gif') {
      return renderGiphyGifs();
    }

    // For stickers tab
    if (stickers.length === 0 && !loading) {
      console.log('🎨 No stickers to render, showing empty state');
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="emoji-emotions" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {selectedPack ? `No stickers found in ${selectedPack.name}` : 'No stickers found'}
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
            Try selecting a different pack or category
          </Text>
        </View>
      );
    }

    console.log('🎨 Rendering stickers grid with', stickers.length, 'stickers');
    return (
      <FlatList
        key="stickers-grid"
        data={stickers}
        renderItem={renderStickerItem}
        keyExtractor={(item) => item.id}
        numColumns={isDesktop ? 6 : 4}
        showsVerticalScrollIndicator={isDesktop}
        contentContainerStyle={styles.stickersContainer}
      />
    );
  };

  const renderStickerPacks = () => {
    console.log('🎨 Rendering sticker packs:', packs.length, 'packs available');
    
    if (packs.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="folder-open" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No sticker packs found
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
            Upload some stickers to get started!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        key="packs-list"
        data={packs}
        renderItem={renderPackItem}
        keyExtractor={(item) => item.id}
        numColumns={isDesktop ? 3 : 2}
        showsVerticalScrollIndicator={isDesktop}
        contentContainerStyle={styles.packsContainer}
      />
    );
  };

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
            maxWidth: isDesktop ? 900 : '100%',
            maxHeight: isDesktop ? '90%' : '90%',
          }
        ]}>
          {renderHeader()}
          {renderSearchBar()}
          {renderStickerSubtabs()}
          <View key={`content-${viewMode}`}>
            {renderContent()}
          </View>
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
    alignItems: 'center',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: getResponsiveSpacing('md'),
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  desktopHeader: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: getResponsiveSpacing('sm'),
    padding: getResponsiveSpacing('sm'),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    flex: 1,
  },
  desktopHeaderTitle: {
    fontSize: getResponsiveFontSize('xl'),
  },
  closeButton: {
    padding: getResponsiveSpacing('sm'),
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: getResponsiveSpacing('md'),
    fontSize: getResponsiveFontSize('sm'),
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  errorText: {
    marginTop: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
  },
  retryButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  packsContainer: {
    paddingBottom: getResponsiveSpacing('lg'),
  },
  packItem: {
    flex: 1,
    margin: getResponsiveSpacing('sm'),
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  desktopPackItem: {
    margin: getResponsiveSpacing('md'),
  },
  packPreview: {
    aspectRatio: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  packPreviewImage: {
    width: '100%',
    height: '100%',
  },
  packPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packInfo: {
    padding: getResponsiveSpacing('sm'),
  },
  packName: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('xs'),
  },
  packCount: {
    fontSize: getResponsiveFontSize('xs'),
  },
  stickersContainer: {
    paddingBottom: getResponsiveSpacing('lg'),
  },
  stickerItem: {
    aspectRatio: 1,
    margin: getResponsiveSpacing('xs'),
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  desktopStickerItem: {
    margin: getResponsiveSpacing('sm'),
  },
  stickerImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  animatedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 2,
  },
  subtabContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  desktopSubtabContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  subtabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  desktopSubtabButton: {
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('md'),
  },
  subtabButtonText: {
    marginLeft: getResponsiveSpacing('xs'),
    fontWeight: '500',
  },
  subtabCount: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '400',
    marginTop: 2,
  },
  // Messenger-style tab styles
  messengerStyleTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    padding: getResponsiveSpacing('sm'),
  },
  packTabsScrollContent: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    flexGrow: 1,
  },
  messengerPackTab: {
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('xs'),
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
  },
  activeMessengerPackTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  desktopMessengerPackTab: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    marginHorizontal: getResponsiveSpacing('sm'),
    minWidth: 100,
  },
  packTabContent: {
    alignItems: 'center',
  },
  packTabPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  packTabPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messengerPackTabText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
    textAlign: 'center',
  },
  actionTabsContainer: {
    flexDirection: 'row',
    marginLeft: getResponsiveSpacing('sm'),
  },
  actionTab: {
    padding: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('xs'),
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeActionTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  // Simple subtab styles
  simpleSubtabs: {
    marginBottom: getResponsiveSpacing('md'),
  },
  topSubtabs: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  topTab: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    marginHorizontal: getResponsiveSpacing('xs'),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTopTab: {
    borderBottomColor: '#007AFF',
  },
  topTabText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  packTabsContent: {
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  packTab: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('xs'),
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activePackTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  packTabText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  emojiContainer: {
    padding: getResponsiveSpacing('md'),
  },
  emojiCategory: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  emojiCategoryTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emojiButton: {
    width: '20%', // 5 columns
    alignItems: 'center',
    marginVertical: getResponsiveSpacing('xs'),
  },
  emojiText: {
    fontSize: getResponsiveFontSize('xxl'),
  },
  emojiImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('lg'),
  },
  emptyText: {
    marginTop: getResponsiveSpacing('md'),
    fontSize: getResponsiveFontSize('md'),
  },
  emojiCategoryTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('xs'),
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
  },
  gifCategoryTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    marginHorizontal: getResponsiveSpacing('xs'),
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  debugInfo: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  },
}); 