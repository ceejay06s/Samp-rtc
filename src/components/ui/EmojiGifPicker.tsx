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
        columns={8}
      />
    </View>
  );

  const renderGifTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
          placeholder="Search GIFs..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchGifs}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchGifs}>
          <MaterialIcons name="search" size={20} color={theme.colors.primary} />
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
        <ScrollView style={styles.gifContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.gifGrid}>
            {gifs.map((gif, index) => (
              <TouchableOpacity
                key={gif.id || index}
                style={styles.gifItem}
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
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
          placeholder="Search stickers..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchStickers}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchStickers}>
          <MaterialIcons name="search" size={20} color={theme.colors.primary} />
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
        <ScrollView style={styles.gifContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.gifGrid}>
            {stickers.map((sticker, index) => (
              <TouchableOpacity
                key={sticker.id || index}
                style={styles.gifItem}
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
        activeTab === tab && { backgroundColor: theme.colors.primary }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <MaterialIcons
        name={icon as any}
        size={20}
        color={activeTab === tab ? theme.colors.onPrimary : theme.colors.text}
      />
      <Text
        style={[
          styles.tabButtonText,
          { color: activeTab === tab ? theme.colors.onPrimary : theme.colors.text }
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
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Add Emoji, GIF, or Sticker
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
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
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: getResponsiveSpacing('md'),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  modalTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  closeButton: {
    padding: getResponsiveSpacing('sm'),
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  tabButtonText: {
    marginLeft: getResponsiveSpacing('sm'),
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: getResponsiveSpacing('md'),
    marginRight: getResponsiveSpacing('sm'),
    fontSize: getResponsiveFontSize('sm'),
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
  gifContainer: {
    flex: 1,
  },
  gifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gifItem: {
    width: (screenWidth - 80) / 2,
    height: (screenWidth - 80) / 2,
    marginBottom: getResponsiveSpacing('sm'),
    borderRadius: 8,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
}); 