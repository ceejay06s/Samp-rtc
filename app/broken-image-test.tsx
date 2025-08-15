import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BrokenImageIcon } from '../src/components/ui/BrokenImageIcon';
import { SafeImage } from '../src/components/ui/SafeImage';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function BrokenImageTestScreen() {
  const theme = useTheme();
  const [imageUrl, setImageUrl] = useState('https://example.com/nonexistent-image.jpg');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testValidImage = () => {
    setImageUrl('https://picsum.photos/300/200');
    addResult('Testing with valid image URL');
  };

  const testBrokenImage = () => {
    setImageUrl('https://example.com/nonexistent-image.jpg');
    addResult('Testing with broken image URL');
  };

  const testInvalidUrl = () => {
    setImageUrl('not-a-valid-url');
    addResult('Testing with invalid URL format');
  };

  const testEmptyUrl = () => {
    setImageUrl('');
    addResult('Testing with empty URL');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Broken Image Icon Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Test the broken image icon fallback functionality
        </Text>
      </View>

      <View style={styles.urlInputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Image URL:
        </Text>
        <TextInput
          style={[styles.urlInput, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border
          }]}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="Enter image URL to test"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.testImageContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Test Image:
        </Text>
        <View style={styles.imageContainer}>
          <SafeImage
            source={{ uri: imageUrl }}
            style={styles.testImage}
            fallbackSize={64}
            showFallbackText={true}
            fallbackText="Image not available"
            onImageError={(error) => {
              addResult(`Image failed to load: ${error?.message || 'Unknown error'}`);
            }}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testValidImage}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Valid Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={testBrokenImage}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Broken Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          onPress={testInvalidUrl}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Invalid URL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={testEmptyUrl}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Empty URL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.warning }]}
          onPress={clearResults}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Clear Results
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconExamplesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Broken Image Icon Examples:
        </Text>
        <View style={styles.iconGrid}>
          <View style={styles.iconExample}>
            <BrokenImageIcon size={32} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
              Small (32px)
            </Text>
          </View>
          <View style={styles.iconExample}>
            <BrokenImageIcon size={48} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
              Medium (48px)
            </Text>
          </View>
          <View style={styles.iconExample}>
            <BrokenImageIcon size={64} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
              Large (64px)
            </Text>
          </View>
          <View style={styles.iconExample}>
            <BrokenImageIcon size={96} showText={true} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>
              With Text
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
          Test Results:
        </Text>
        {testResults.length === 0 ? (
          <Text style={[styles.noResults, { color: theme.colors.textSecondary }]}>
            No test results yet. Try testing different image URLs.
          </Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={[styles.resultText, { color: theme.colors.text }]}>
              {result}
            </Text>
          ))
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          How Broken Image Handling Works:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • SafeImage component wraps React Native Image{'\n'}
          • Detects image loading errors automatically{'\n'}
          • Shows BrokenImageIcon when image fails{'\n'}
          • Provides customizable fallback options{'\n'}
          • Logs errors for debugging{'\n'}
          • Maintains consistent UI even when images fail{'\n'}
          • Supports different sizes and text options
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getResponsiveSpacing('md'),
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('lg'),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  urlInputContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  urlInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: getResponsiveSpacing('md'),
    fontSize: 16,
  },
  testImageContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  imageContainer: {
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  testImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  buttonContainer: {
    gap: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
  },
  button: {
    padding: getResponsiveSpacing('md'),
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconExamplesContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: getResponsiveSpacing('md'),
  },
  iconExample: {
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    minWidth: 100,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: getResponsiveSpacing('xs'),
    textAlign: 'center',
  },
  resultsContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  noResults: {
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 14,
    marginBottom: getResponsiveSpacing('xs'),
    fontFamily: 'monospace',
  },
  infoContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: getResponsiveSpacing('md'),
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 