import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StickerPicker } from '../src/components/ui/StickerPicker';
import { TGSRendererV2 } from '../src/components/ui/TGSRendererV2';
import { Sticker } from '../src/services/stickerService';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function StickerPickerDemoScreen() {
  const theme = useTheme();
  const [stickerPickerVisible, setStickerPickerVisible] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  const handleStickerSelect = (sticker: Sticker) => {
    setSelectedSticker(sticker);
    Alert.alert(
      'Sticker Selected!',
      `Selected: ${sticker.name}\nPack: ${sticker.packName}\nAnimated: ${sticker.isAnimated ? 'Yes' : 'No'}`,
      [{ text: 'OK' }]
    );
  };

  const openStickerPicker = () => {
    setStickerPickerVisible(true);
  };

  const closeStickerPicker = () => {
    setStickerPickerVisible(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Sticker Picker Demo
        </Text>
        
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Test the new sticker picker that fetches stickers from Supabase storage.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={openStickerPicker}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Open Sticker Picker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary || '#666' }]}
          onPress={async () => {
            try {
              const { StickerService } = await import('../src/services/stickerService');
              const hasAccess = await StickerService.checkStorageAccess();
              const packs = await StickerService.getStickerPacks();
              console.log('Storage access:', hasAccess);
              console.log('Available packs:', packs);
              Alert.alert('Service Test', `Access: ${hasAccess}, Packs: ${packs.length}`);
            } catch (error) {
              console.error('Service test error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Test Sticker Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ff6b6b' }]}
          onPress={async () => {
            try {
              const { supabase } = await import('../lib/supabase');
              
              // List everything in the bucket
              const { data: allFiles, error: listError } = await supabase.storage
                .from('telegram-stickers')
                .list('', { limit: 1000 });
              
              if (listError) {
                Alert.alert('List Error', listError.message);
                return;
              }
              
              console.log('All files in bucket:', allFiles);
              
              // Check if cat_farsi folder exists
              const catFarsiFiles = await supabase.storage
                .from('telegram-stickers')
                .list('cat_farsi', { limit: 1000 });
              
              console.log('cat_farsi folder contents:', catFarsiFiles);
              
              Alert.alert('Bucket Debug', 
                `Root files: ${allFiles?.length || 0}\n` +
                `cat_farsi files: ${catFarsiFiles.data?.length || 0}\n` +
                `Check console for details`
              );
            } catch (error) {
              console.error('Bucket debug error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Debug Bucket Contents
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4ecdc4' }]}
          onPress={async () => {
            try {
              const { StickerService } = await import('../src/services/stickerService');
              await StickerService.clearCache();
              Alert.alert('Cache Cleared', 'Sticker cache has been cleared. Next time you open the picker, it will fetch fresh data.');
            } catch (error) {
              console.error('Cache clear error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Clear Cache
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#45b7d1' }]}
          onPress={async () => {
            try {
              const { StickerService } = await import('../src/services/stickerService');
              const packs = await StickerService.refreshStickerPacks();
              Alert.alert('Cache Refreshed', `Refreshed ${packs.length} sticker packs from storage.`);
            } catch (error) {
              console.error('Cache refresh error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Force Refresh
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ff6b6b' }]}
          onPress={async () => {
            try {
              const { StickerService } = await import('../src/services/stickerService');
              console.log('🔍 Starting bucket access debug...');
              const result = await StickerService.debugBucketAccess();
              console.log('🔍 Debug result:', result);
              Alert.alert('Debug Complete', 'Check console for detailed bucket access information.');
            } catch (error) {
              console.error('Debug error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Debug Bucket Access
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#9c88ff' }]}
          onPress={async () => {
            try {
              const { StickerService } = await import('../src/services/stickerService');
              console.log('📊 Getting sticker statistics...');
              const stats = await StickerService.getStickerStats();
              console.log('📊 Sticker stats:', stats);
              Alert.alert('Sticker Statistics', 
                `Total Packs: ${stats.totalPacks}\n` +
                `Total Stickers: ${stats.totalStickers}\n` +
                `WebP: ${stats.byType.webp}\n` +
                `PNG: ${stats.byType.png}\n` +
                `GIF: ${stats.byType.gif}\n` +
                `TGS: ${stats.byType.tgs}\n` +
                `Animated: ${stats.animatedCount}\n` +
                `Telegram Stickers: ${stats.telegramStickerCount}`
              );
            } catch (error) {
              console.error('Stats error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Get Sticker Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ff9ff3' }]}
          onPress={async () => {
            try {
              const { StickerService } = await import('../src/services/stickerService');
              console.log('🎭 Testing TGS rendering...');
              
              // Get TGS stickers specifically
              const tgsStickers = await StickerService.getStickersByType('tgs', 5);
              console.log('🎭 TGS stickers found:', tgsStickers);
              
              if (tgsStickers.length > 0) {
                Alert.alert('TGS Test', 
                  `Found ${tgsStickers.length} TGS stickers\n` +
                  `First sticker: ${tgsStickers[0].name}\n` +
                  `URL: ${tgsStickers[0].url}\n` +
                  `Check console for full details`
                );
              } else {
                Alert.alert('TGS Test', 'No TGS stickers found in storage');
              }
            } catch (error) {
              console.error('TGS test error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Test TGS Rendering
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#a8e6cf' }]}
          onPress={() => {
            // Navigate to TGS test component
            // This would typically use navigation, but for demo purposes we'll show an alert
            Alert.alert('TGS Renderer Demo', 
              'TGS Renderer component is ready!\n\n' +
              'Features:\n' +
              '• Lottie animations for .tgs files\n' +
              '• Cross-platform support (web/mobile)\n' +
              '• Automatic TGS to Lottie conversion\n' +
              '• Error handling and loading states\n' +
              '• Graceful fallbacks for compatibility'
            );
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            TGS Renderer Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#ffd93d' }]}
          onPress={async () => {
            try {
              const { StickerService } = await import('../src/services/stickerService');
              console.log('🔍 Debugging TGS rendering...');
              
              // Get TGS stickers specifically
              const tgsStickers = await StickerService.getStickersByType('tgs', 3);
              console.log('🔍 TGS stickers found:', tgsStickers);
              
              if (tgsStickers.length > 0) {
                const firstTGS = tgsStickers[0];
                console.log('🔍 First TGS details:', {
                  name: firstTGS.name,
                  url: firstTGS.url,
                  fileType: firstTGS.fileType,
                  isAnimated: firstTGS.isAnimated,
                  fileSize: firstTGS.fileSize
                });
                
                // Test the TGS renderer directly
                Alert.alert('TGS Debug', 
                  `Found ${tgsStickers.length} TGS stickers\n\n` +
                  `First sticker:\n` +
                  `Name: ${firstTGS.name}\n` +
                  `Type: ${firstTGS.fileType}\n` +
                  `Animated: ${firstTGS.isAnimated ? 'Yes' : 'No'}\n` +
                  `Size: ${(firstTGS.fileSize / 1024).toFixed(1)} KB\n\n` +
                  `Check console for full details and test the TGS renderer in the sticker picker.`
                );
              } else {
                Alert.alert('TGS Debug', 'No TGS stickers found in storage. Upload some .tgs files to test.');
              }
            } catch (error) {
              console.error('TGS debug error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
            }
          }}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Debug TGS Rendering
          </Text>
        </TouchableOpacity>

        {selectedSticker && (
          <View style={[styles.selectedStickerContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.selectedStickerTitle, { color: theme.colors.text }]}>
              Last Selected Sticker:
            </Text>
            
            {/* Display the sticker preview */}
            <View style={styles.stickerPreview}>
                           {selectedSticker.fileType === 'tgs' ? (
               <TGSRendererV2
                 url={selectedSticker.url}
                 width={120}
                 height={120}
                 autoPlay={true}
                 loop={true}
               />
             ) : (
                <Image 
                  source={{ uri: selectedSticker.url }} 
                  style={styles.stickerPreviewImage}
                  resizeMode="contain"
                />
              )}
            </View>
            
            <View style={styles.selectedStickerInfo}>
              <Text style={[styles.stickerInfoText, { color: theme.colors.text }]}>
                <Text style={styles.label}>Name:</Text> {selectedSticker.name}
              </Text>
              <Text style={[styles.stickerInfoText, { color: theme.colors.text }]}>
                <Text style={styles.label}>Pack:</Text> {selectedSticker.packName}
              </Text>
              <Text style={[styles.stickerInfoText, { color: theme.colors.text }]}>
                <Text style={styles.label}>Type:</Text> {selectedSticker.fileType.toUpperCase()}
              </Text>
              <Text style={[styles.stickerInfoText, { color: theme.colors.text }]}>
                <Text style={styles.label}>Animated:</Text> {selectedSticker.isAnimated ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.stickerInfoText, { color: theme.colors.text }]}>
                <Text style={styles.label}>File Size:</Text> {(selectedSticker.fileSize / 1024).toFixed(1)} KB
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            Features:
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Browse sticker packs from Supabase storage{'\n'}
            • View individual stickers within each pack{'\n'}
            • Subtabs for organizing stickers: All, By Pack, Recent, Favorites{'\n'}
            • Search stickers across all packs{'\n'}
            • Support for animated stickers (GIF, WebP, TGS){'\n'}
            • Lottie animations for Telegram stickers (.tgs files){'\n'}
            • Cross-platform TGS rendering (web/mobile){'\n'}
            • Automatic TGS to Lottie conversion{'\n'}
            • Responsive design for mobile and desktop{'\n'}
            • Fallback to Giphy stickers if no storage access{'\n'}
            • Error handling and loading states
          </Text>
        </View>

        <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            How it works:
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            1. Opens with a list of available sticker packs{'\n'}
            2. Tap a pack to see all stickers in that pack{'\n'}
            3. Use search to find specific stickers{'\n'}
            4. Tap a sticker to select it and close the picker{'\n'}
            5. The selected sticker data is returned to your app
          </Text>
        </View>
      </View>

      <StickerPicker
        visible={stickerPickerVisible}
        onClose={closeStickerPicker}
        onStickerSelect={handleStickerSelect}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: getResponsiveSpacing('lg'),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('xl'),
    lineHeight: 24,
  },
  button: {
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xl'),
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedStickerContainer: {
    padding: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
  },
  selectedStickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('md'),
  },
  selectedStickerInfo: {
    gap: getResponsiveSpacing('sm'),
  },
  stickerInfoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
  },
  infoContainer: {
    padding: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('md'),
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  stickerPreview: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  stickerPreviewImage: {
    width: 120,
    height: 120,
    borderRadius: getResponsiveSpacing('sm'),
  },
}); 