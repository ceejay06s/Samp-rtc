import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { TGSRendererV2 } from './TGSRendererV2';

export const TGSTestComponent: React.FC = () => {
  const theme = useTheme();
  const [testUrl, setTestUrl] = useState<string>('');

  const testTGSFiles = [
    {
      name: 'Sample TGS 1',
      url: 'https://example.com/sample1.tgs',
      description: 'Test TGS file 1'
    },
    {
      name: 'Sample TGS 2', 
      url: 'https://example.com/sample2.tgs',
      description: 'Test TGS file 2'
    }
  ];

  const handleTestTGS = (url: string) => {
    setTestUrl(url);
    Alert.alert('TGS Test', `Testing TGS file: ${url}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        TGS Renderer Test
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Test the TGS renderer with Lottie animations
      </Text>

      {/* Test TGS files */}
      <View style={styles.testSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Test TGS Files:
        </Text>
        
        {testTGSFiles.map((file, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleTestTGS(file.url)}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              {file.name}
            </Text>
            <Text style={[styles.buttonSubtext, { color: theme.colors.onPrimary }]}>
              {file.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TGS Renderer Display */}
      {testUrl && (
        <View style={styles.rendererSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            TGS Renderer Output:
          </Text>
          
          <View style={[styles.rendererContainer, { backgroundColor: theme.colors.surface }]}>
            <TGSRendererV2
              url={testUrl}
              width={200}
              height={200}
              autoPlay={true}
              loop={true}
            />
          </View>
          
          <Text style={[styles.urlText, { color: theme.colors.textSecondary }]}>
            URL: {testUrl}
          </Text>
        </View>
      )}

      {/* Instructions */}
      <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          How to use:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          1. Click on a test TGS file above{'\n'}
          2. The TGS renderer will attempt to load and display it{'\n'}
          3. For web: Uses tgs2json + lottie-web{'\n'}
          4. For mobile: Uses lottie-react-native{'\n'}
          5. Graceful fallbacks for compatibility
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('xl'),
    lineHeight: 22,
  },
  testSection: {
    marginBottom: getResponsiveSpacing('xl'),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('md'),
  },
  testButton: {
    padding: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    fontSize: 12,
    marginTop: getResponsiveSpacing('xs'),
    opacity: 0.8,
  },
  rendererSection: {
    marginBottom: getResponsiveSpacing('xl'),
  },
  rendererContainer: {
    padding: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  urlText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  infoSection: {
    padding: getResponsiveSpacing('lg'),
    borderRadius: getResponsiveSpacing('md'),
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('md'),
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 