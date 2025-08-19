import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TGSSimpleRenderer } from '../src/components/ui/TGSSimpleRenderer';
import { testTGSCapabilities } from '../src/utils/tgsTestData';
import { useTheme } from '../src/utils/themes';

export default function TGSWorkingTestScreen() {
  const theme = useTheme();
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [testingCapabilities, setTestingCapabilities] = useState(false);

  // Sample TGS sticker URLs for testing
  // These are placeholder URLs - replace with actual TGS files from your Supabase storage
  const testStickers = [
    {
      name: 'Sample TGS 1',
      url: 'https://your-project.supabase.co/storage/v1/object/public/telegram-stickers/cat_farsi/sticker_1.tgs',
      description: 'Basic TGS sticker test'
    },
    {
      name: 'Sample TGS 2', 
      url: 'https://your-project.supabase.co/storage/v1/object/public/telegram-stickers/cat_farsi/sticker_2.tgs',
      description: 'Another TGS sticker test'
    }
  ];

  const handleStickerTest = (sticker: any) => {
    if (selectedTest === sticker.name) {
      setSelectedTest(null);
    } else {
      setSelectedTest(sticker.name);
    }
  };

  const showInstructions = () => {
    Alert.alert(
      'TGS Testing Instructions',
      `1. Replace the placeholder URLs in the testStickers array with actual TGS file URLs from your Supabase storage
2. Make sure your TGS files are accessible and have proper CORS settings
3. The renderer will attempt to decompress TGS files and convert them to Lottie animations
4. Check the console for detailed loading information`,
      [{ text: 'OK' }]
    );
  };

  const testCapabilities = async () => {
    try {
      setTestingCapabilities(true);
      const result = await testTGSCapabilities();
      setCapabilities(result);
      Alert.alert('Capability Test Complete', 'Check the console for detailed results.');
    } catch (error) {
      Alert.alert('Test Failed', 'Error testing TGS capabilities. Check console for details.');
    } finally {
      setTestingCapabilities(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        TGS Working Test
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        This test demonstrates TGS sticker rendering. Update the URLs with actual TGS files from your storage.
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.instructionButton, { backgroundColor: theme.colors.primary }]}
          onPress={showInstructions}
        >
          <Text style={[styles.instructionButtonText, { color: theme.colors.onPrimary }]}>
            📋 Show Instructions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.instructionButton, { backgroundColor: theme.colors.success }]}
          onPress={testCapabilities}
          disabled={testingCapabilities}
        >
          <Text style={[styles.instructionButtonText, { color: theme.colors.onPrimary }]}>
            {testingCapabilities ? 'Testing...' : '🧪 Test Capabilities'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.stickerContainer}>
        {testStickers.map((sticker, index) => (
          <View key={index} style={[styles.stickerItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.stickerName, { color: theme.colors.text }]}>
              {sticker.name}
            </Text>
            
            <Text style={[styles.stickerDescription, { color: theme.colors.textSecondary }]}>
              {sticker.description}
            </Text>

            <Text style={[styles.stickerUrl, { color: theme.colors.textSecondary }]}>
              URL: {sticker.url}
            </Text>

            <TouchableOpacity
              style={styles.stickerButton}
              onPress={() => handleStickerTest(sticker)}
            >
              <Text style={[styles.stickerButtonText, { color: theme.colors.primary }]}>
                {selectedTest === sticker.name ? 'Hide' : 'Test'} TGS
              </Text>
            </TouchableOpacity>

            {selectedTest === sticker.name && (
              <View style={styles.rendererContainer}>
                <Text style={[styles.rendererStatus, { color: theme.colors.textSecondary }]}>
                  Testing TGS rendering...
                </Text>
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

      {/* Capabilities Display */}
      {capabilities && (
        <View style={[styles.capabilitiesContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.capabilitiesTitle, { color: theme.colors.text }]}>
            TGS Capabilities Test Results
          </Text>
          <View style={styles.capabilityRow}>
            <Text style={[styles.capabilityLabel, { color: theme.colors.textSecondary }]}>
              Pako (decompression):
            </Text>
            <Text style={[styles.capabilityValue, { color: capabilities.pakoAvailable ? theme.colors.success : theme.colors.error }]}>
              {capabilities.pakoAvailable ? '✓ Available' : '✗ Not Available'}
            </Text>
          </View>
          <View style={styles.capabilityRow}>
            <Text style={[styles.capabilityLabel, { color: theme.colors.textSecondary }]}>
              Lottie-web (rendering):
            </Text>
            <Text style={[styles.capabilityValue, { color: capabilities.lottieWebAvailable ? theme.colors.success : theme.colors.error }]}>
              {capabilities.lottieWebAvailable ? '✓ Available' : '✗ Not Available'}
            </Text>
          </View>
          <View style={styles.capabilityRow}>
            <Text style={[styles.capabilityLabel, { color: theme.colors.textSecondary }]}>
              Decompression:
            </Text>
            <Text style={[styles.capabilityValue, { color: capabilities.canDecompress ? theme.colors.success : theme.colors.error }]}>
              {capabilities.canDecompress ? '✓ Working' : '✗ Not Working'}
            </Text>
          </View>
          <View style={styles.capabilityRow}>
            <Text style={[styles.capabilityLabel, { color: theme.colors.textSecondary }]}>
              Rendering:
            </Text>
            <Text style={[styles.capabilityValue, { color: capabilities.canRender ? theme.colors.success : theme.colors.error }]}>
              {capabilities.canRender ? '✓ Working' : '✗ Not Working'}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.infoContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          TGS Rendering Information
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • TGS files are compressed Lottie JSON files{'\n'}
          • The renderer decompresses them using pako{'\n'}
          • Converts to Lottie format for animation{'\n'}
          • Supports both web and mobile platforms{'\n'}
          • Falls back gracefully if conversion fails
        </Text>
      </View>

      <View style={[styles.debugContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.debugTitle, { color: theme.colors.text }]}>
          Debug Information
        </Text>
        <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
          • Check browser console for detailed logs{'\n'}
          • Look for TGS loading and conversion messages{'\n'}
          • Verify file accessibility and CORS settings{'\n'}
          • Test with different TGS file sizes and complexities
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 12,
  },
  instructionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  instructionButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
  stickerUrl: {
    fontSize: 12,
    marginBottom: 16,
    fontFamily: 'monospace',
    opacity: 0.7,
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
  rendererStatus: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
  debugContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  debugText: {
    fontSize: 14,
    lineHeight: 20,
  },
  capabilitiesContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  capabilitiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  capabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capabilityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  capabilityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 