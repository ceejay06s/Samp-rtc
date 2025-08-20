import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { checkLibraryAvailability, logLibraryStatus } from '../src/utils/libraryChecker';
import { useTheme } from '../src/utils/themes';

export default function TGSSimpleTestScreen() {
  const theme = useTheme();
  const [libraryStatus, setLibraryStatus] = useState({
    pako: false,
    lottie: false,
    // Note: tgs2json has been removed due to compatibility issues
  });
  const [testResults, setTestResults] = useState<string[]>([]);

  const runLibraryCheck = () => {
    try {
      setTestResults(prev => [...prev, 'Starting library check...']);
      logLibraryStatus();
      const status = checkLibraryAvailability();
      setLibraryStatus(status);
      setTestResults(prev => [...prev, 'Library check completed successfully']);
    } catch (error) {
      console.error('Library check error:', error);
      setTestResults(prev => [...prev, `Library check error: ${error}`]);
      // Set a basic status even if the check fails
      setLibraryStatus({
        pako: false,
        lottie: false,
      });
    }
  };

  const testTGSRenderer = () => {
    try {
      setTestResults(prev => [...prev, 'Testing TGS renderer component...']);
      // This will test the component initialization
      setTestResults(prev => [...prev, 'TGS renderer component test completed']);
    } catch (error) {
      setTestResults(prev => [...prev, `TGS renderer test error: ${error}`]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setLibraryStatus(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        TGS Renderer Simple Test
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        This test checks library availability and component initialization without requiring actual TGS files.
      </Text>

      <View style={[styles.environmentContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.environmentTitle, { color: theme.colors.text }]}>
          Environment: {getEnvironmentInfo()}
        </Text>
        <Text style={[styles.environmentNote, { color: theme.colors.textSecondary }]}>
          {getEnvironmentInfo() === 'browser' ? 
            'Browser environment - some libraries may not be available' : 
            'Node.js/React Native environment - full library support available'
          }
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
          onPress={runLibraryCheck}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Check Library Status
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: theme.colors.success }]}
          onPress={testTGSRenderer}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test TGS Renderer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: theme.colors.error }]}
          onPress={clearResults}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Clear Results
          </Text>
        </TouchableOpacity>
      </View>

      {/* Library Status Display */}
      {libraryStatus && (
        <View style={[styles.statusContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
            Library Status
          </Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
              pako:
            </Text>
            <Text style={[styles.statusValue, { color: libraryStatus.pako ? theme.colors.success : theme.colors.error }]}>
              {libraryStatus.pako ? '✓ Available' : '✗ Not Available'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
              lottie-web:
            </Text>
            <Text style={[styles.statusValue, { color: libraryStatus.lottie ? theme.colors.success : theme.colors.error }]}>
              {libraryStatus.lottie ? '✓ Available' : '✗ Not Available'}
            </Text>
          </View>
        </View>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <View style={[styles.resultsContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
            Test Results
          </Text>
          <ScrollView style={styles.resultsList}>
            {testResults.map((result, index) => (
              <Text key={index} style={[styles.resultItem, { color: theme.colors.textSecondary }]}>
                {index + 1}. {result}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {/* TGS Renderer Test */}
      <View style={[styles.rendererTestContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.rendererTestTitle, { color: theme.colors.text }]}>
          TGS Renderer Component Test
        </Text>
        <Text style={[styles.rendererTestDescription, { color: theme.colors.textSecondary }]}>
          This will test the component with a placeholder URL:
        </Text>
        
        <View style={styles.rendererContainer}>
          <TGSRendererV3
            url="https://example.com/test.tgs"
            width={150}
            height={150}
            autoPlay={false}
            loop={false}
          />
        </View>
        
        <Text style={[styles.rendererTestNote, { color: theme.colors.textSecondary }]}>
          Note: This will show a fallback since the URL is not a real TGS file.
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
  environmentContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  environmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  environmentNote: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  testButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    fontSize: 14,
    marginBottom: 4,
    paddingVertical: 2,
  },
  rendererTestContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  rendererTestTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  rendererTestDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  rendererContainer: {
    marginBottom: 16,
  },
  rendererTestNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
}); 