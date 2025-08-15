import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { EmojiGifPicker } from './EmojiGifPicker';

export const EmojiGifPickerDemo: React.FC = () => {
  const theme = useTheme();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [selectedGif, setSelectedGif] = useState<string>('');
  const [selectedSticker, setSelectedSticker] = useState<string>('');

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    Alert.alert('Emoji Selected', `You selected: ${emoji}`);
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowEmojiPicker(false);
    Alert.alert('GIF Selected', 'GIF has been selected!');
  };

  const handleStickerSelect = (stickerUrl: string) => {
    setSelectedSticker(stickerUrl);
    setShowEmojiPicker(false);
    Alert.alert('Sticker Selected', 'Sticker has been selected!');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Emoji GIF Picker Demo
      </Text>
      
      <View style={styles.demoSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Selected Items:
        </Text>
        
        {selectedEmoji && (
          <View style={styles.selectedItem}>
            <Text style={[styles.selectedLabel, { color: theme.colors.textSecondary }]}>
              Emoji:
            </Text>
            <Text style={[styles.selectedValue, { color: theme.colors.text }]}>
              {selectedEmoji}
            </Text>
          </View>
        )}
        
        {selectedGif && (
          <View style={styles.selectedItem}>
            <Text style={[styles.selectedLabel, { color: theme.colors.textSecondary }]}>
              GIF:
            </Text>
            <Text style={[styles.selectedValue, { color: theme.colors.text }]}>
              GIF URL selected
            </Text>
          </View>
        )}
        
        {selectedSticker && (
          <View style={styles.selectedItem}>
            <Text style={[styles.selectedLabel, { color: theme.colors.textSecondary }]}>
              Sticker:
            </Text>
            <Text style={[styles.selectedValue, { color: theme.colors.text }]}>
              Sticker URL selected
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttonSection}>
        <Button
          title="Open Emoji GIF Picker"
          onPress={() => setShowEmojiPicker(true)}
          style={styles.demoButton}
        />
        
        <TouchableOpacity
          style={[styles.emojiButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowEmojiPicker(true)}
        >
          <MaterialIcons name="emoji-emotions" size={24} color="white" />
          <Text style={[styles.emojiButtonText, { color: 'white' }]}>
            😊 Emoji
          </Text>
        </TouchableOpacity>
      </View>

      <EmojiGifPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        onGifSelect={handleGifSelect}
        onStickerSelect={handleStickerSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
  },
  title: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('xl'),
  },
  demoSection: {
    marginBottom: getResponsiveSpacing('xl'),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('md'),
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
    padding: getResponsiveSpacing('md'),
    backgroundColor: '#f0f2f5',
    borderRadius: getResponsiveSpacing('sm'),
  },
  selectedLabel: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
    marginRight: getResponsiveSpacing('sm'),
  },
  selectedValue: {
    fontSize: getResponsiveFontSize('md'),
    flex: 1,
  },
  buttonSection: {
    alignItems: 'center',
  },
  demoButton: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('lg'),
  },
  emojiButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginLeft: getResponsiveSpacing('sm'),
  },
}); 