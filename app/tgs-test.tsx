import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TGSSimpleRenderer } from '../src/components/ui/TGSSimpleRenderer';
import { useTheme } from '../src/utils/themes';

export default function TGSTestScreen() {
  const theme = useTheme();
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  // Sample TGS sticker URLs for testing
  const testStickers = [
    {
      name: 'Sample TGS 1',
      url: 'https://your-supabase-project.supabase.co/storage/v1/object/public/telegram-stickers/cat_farsi/sticker_1.tgs',
      description: 'Basic TGS sticker test'
    },
    {
      name: 'Sample TGS 2', 
      url: 'https://your-supabase-project.supabase.co/storage/v1/object/public/telegram-stickers/cat_farsi/sticker_2.tgs',
      description: 'Another TGS sticker test'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        TGS Sticker Rendering Test
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        This screen tests TGS sticker rendering functionality. 
        Make sure you have actual TGS sticker URLs in the testStickers array.
      </Text>

      <ScrollView style={styles.stickerContainer}>
        {testStickers.map((sticker, index) => (
          <View key={index} style={[styles.stickerItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.stickerName, { color: theme.colors.text }]}>
              {sticker.name}
            </Text>
            
            <Text style={[styles.stickerDescription, { color: theme.colors.textSecondary }]}>
              {sticker.description}
            </Text>

            <TouchableOpacity
              style={styles.stickerButton}
              onPress={() => setSelectedSticker(selectedSticker === sticker.url ? null : sticker.url)}
            >
              <Text style={[styles.stickerButtonText, { color: theme.colors.primary }]}>
                {selectedSticker === sticker.url ? 'Hide' : 'Show'} TGS
              </Text>
            </TouchableOpacity>

            {selectedSticker === sticker.url && (
              <View style={styles.rendererContainer}>
                <TGSRendererV3
                  url={sticker.url}
                  width={200}
                  height={200}
                  autoPlay={true}
                  loop={true}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          TGS Rendering Information
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • TGS files are Telegram's animated sticker format{'\n'}
          • They are compressed Lottie JSON files{'\n'}
          • This renderer attempts multiple conversion methods{'\n'}
          • Fallback to static display if conversion fails{'\n'}
          • Supports both web and mobile platforms
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  stickerContainer: {
    flex: 1,
    marginBottom: 20,
  },
  stickerItem: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stickerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  stickerDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  stickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  stickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rendererContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 