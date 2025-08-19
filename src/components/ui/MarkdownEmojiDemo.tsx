import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { MarkdownEmojiService } from '../../services/markdownEmojiService';
import { useTheme } from '../../utils/themes';

export const MarkdownEmojiDemo: React.FC = () => {
  const theme = useTheme();
  const [inputText, setInputText] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [extractedEmojis, setExtractedEmojis] = useState<string[]>([]);
  const [twemojiUrls, setTwemojiUrls] = useState<string[]>([]);

  const handleProcessText = () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text to process');
      return;
    }

    try {
      // Process text with markdown and Twemoji
      const result = MarkdownEmojiService.processTextWithMarkdownAndTwemoji(inputText);
      
      setFormattedText(result.markdown);
      setExtractedEmojis(result.emojis);
      setTwemojiUrls(result.twemojiUrls);
      
      Alert.alert('Success', 'Text processed with Markdown-it and Twemoji!');
    } catch (error) {
      console.error('Error processing text:', error);
      Alert.alert('Error', 'Failed to process text. Please try again.');
    }
  };

  const handleRenderMarkdown = () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text to render');
      return;
    }

    try {
      // Render markdown with Twemoji using markdown-it
      const rendered = MarkdownEmojiService.renderMarkdownWithTwemoji(inputText);
      setFormattedText(rendered);
      
      Alert.alert('Success', 'Markdown rendered with Markdown-it and Twemoji!');
    } catch (error) {
      console.error('Error rendering markdown:', error);
      Alert.alert('Error', 'Failed to render markdown. Please try again.');
    }
  };

  const getAvailableShortcodes = () => {
    return MarkdownEmojiService.getAvailableShortcodes();
  };

  const insertShortcode = (shortcode: string) => {
    setInputText(prev => prev + ' ' + shortcode);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Markdown-it + Twemoji Demo
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Combine Markdown-it formatting with Twemoji emojis using existing emoji database
      </Text>

      {/* Input Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Enter Text with Markdown & Emojis:
        </Text>
        
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          multiline
          numberOfLines={4}
          placeholder="Try: **Hello** :smiley: *world* :heart:"
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleProcessText}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              Process Text
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.secondary }]}
            onPress={handleRenderMarkdown}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onSecondary }]}>
              Render Markdown
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Section */}
      {formattedText && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Formatted Result:
          </Text>
          <View style={[styles.resultBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.resultText, { color: theme.colors.text }]}>
              {formattedText}
            </Text>
          </View>
        </View>
      )}

      {/* Extracted Emojis */}
      {extractedEmojis.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Extracted Emojis:
          </Text>
          <View style={styles.emojiGrid}>
            {extractedEmojis.map((emoji, index) => (
              <View key={index} style={styles.emojiItem}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Twemoji URLs */}
      {twemojiUrls.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Twemoji URLs:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.urlContainer}>
              {twemojiUrls.map((url, index) => (
                <View key={index} style={styles.urlItem}>
                  {url.startsWith('http') ? (
                    <Image source={{ uri: url }} style={styles.twemojiImage} />
                  ) : (
                    <Text style={[styles.urlText, { color: theme.colors.textSecondary }]}>
                      {url}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Available Shortcodes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Available Emoji Shortcodes:
        </Text>
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
          Click any shortcode to insert it into your text
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.shortcodeContainer}>
            {getAvailableShortcodes().slice(0, 20).map((shortcode, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.shortcodeButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => insertShortcode(shortcode)}
              >
                <Text style={[styles.shortcodeText, { color: theme.colors.primary }]}>
                  {shortcode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Examples */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Try These Examples:
        </Text>
        
        <View style={styles.examplesContainer}>
          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setInputText('**Hello** :smiley: *world* :heart:')}
          >
            <Text style={[styles.exampleText, { color: theme.colors.text }]}>
              **Hello** :smiley: *world* :heart:
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setInputText('# Welcome :cat: :dog:')}
          >
            <Text style={[styles.exampleText, { color: theme.colors.text }]}>
              # Welcome :cat: :dog:
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setInputText('~~Old~~ :broken_heart: **New** :heart:')}
          >
            <Text style={[styles.exampleText, { color: theme.colors.text }]}>
              ~~Old~~ :broken_heart: **New** :heart:
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  emojiText: {
    fontSize: 20,
  },
  urlContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  urlItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  twemojiImage: {
    width: 32,
    height: 32,
  },
  urlText: {
    fontSize: 12,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  shortcodeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcodeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shortcodeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  examplesContainer: {
    gap: 12,
  },
  exampleButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exampleText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 