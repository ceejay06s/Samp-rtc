import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';
import { SafeImage } from '../src/components/ui/SafeImage';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function ImageUrlTestScreen() {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testStorageAccess = async () => {
    try {
      setIsTesting(true);
      addResult('🔍 Testing Supabase Storage access...');

      // Test 1: List buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addResult(`❌ Failed to list buckets: ${bucketsError.message}`);
        return;
      }

      addResult(`✅ Found ${buckets.length} buckets`);
      buckets.forEach(bucket => {
        addResult(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });

      // Test 2: Check if chat-media bucket exists
      const chatMediaBucket = buckets.find(b => b.name === 'chat-media');
      if (!chatMediaBucket) {
        addResult('❌ chat-media bucket not found');
        return;
      }

      addResult('✅ chat-media bucket found');

      // Test 3: List files in chat-media bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('chat-media')
        .list('', { limit: 10 });

      if (filesError) {
        addResult(`❌ Failed to list files: ${filesError.message}`);
        return;
      }

      addResult(`✅ Found ${files.length} files in chat-media bucket`);

      // Test 4: Test a few image URLs if they exist
      if (files.length > 0) {
        addResult('🔍 Testing image URLs...');
        
        for (const file of files.slice(0, 3)) {
          if (file.name && !file.name.endsWith('/')) {
            const { data: urlData } = supabase.storage
              .from('chat-media')
              .getPublicUrl(file.name);
            
            addResult(`  Testing: ${file.name}`);
            addResult(`  URL: ${urlData.publicUrl}`);
            
            // Test if URL is accessible
            try {
              const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
              if (response.ok) {
                addResult(`  ✅ URL accessible (${response.status})`);
              } else {
                addResult(`  ❌ URL not accessible (${response.status})`);
              }
            } catch (error) {
              addResult(`  ❌ URL fetch failed: ${error}`);
            }
          }
        }
      }

    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testSampleUrls = () => {
    addResult('🔍 Testing sample image URLs...');

    const sampleUrls = [
      'https://xbcrxnebziipzqoorkti.supabase.co/storage/v1/object/public/chat-media/conversations/test-conv-12345/test-user-67890/550e8400-e29b-41d4-a716-446655440000.jpeg',
      'https://xbcrxnebziipzqoorkti.supabase.co/storage/v1/object/public/chat-media/profiles/test-profile.jpg',
      'https://xbcrxnebziipzqoorkti.supabase.co/storage/v1/object/public/chat-media/general/test-image.jpg',
    ];

    sampleUrls.forEach((url, index) => {
      addResult(`Testing URL ${index + 1}: ${url}`);
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Image URL Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Test Supabase Storage access and image URLs
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testStorageAccess}
          disabled={isTesting}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {isTesting ? 'Testing...' : 'Test Storage Access'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={testSampleUrls}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Sample URLs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={clearResults}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Clear Results
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
          Test Results:
        </Text>
        {testResults.length === 0 ? (
          <Text style={[styles.noResults, { color: theme.colors.textSecondary }]}>
            No test results yet. Run tests to see results.
          </Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={[styles.resultText, { color: theme.colors.text }]}>
              {result}
            </Text>
          ))
        )}
      </View>

      <View style={styles.sampleImagesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Sample Image Test:
        </Text>
        <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
          These are sample images to test if the SafeImage component works:
        </Text>
        
        <View style={styles.imageGrid}>
          <View style={styles.imageItem}>
            <Text style={[styles.imageLabel, { color: theme.colors.textSecondary }]}>
              Valid Image:
            </Text>
            <SafeImage 
              source={{ uri: 'https://picsum.photos/200/200' }} 
              style={styles.testImage}
              showFallbackText={true}
              fallbackText="Failed to load"
            />
          </View>
          
          <View style={styles.imageItem}>
            <Text style={[styles.imageLabel, { color: theme.colors.textSecondary }]}>
              Invalid URL:
            </Text>
            <SafeImage 
              source={{ uri: 'https://invalid-url-that-will-fail.com/image.jpg' }} 
              style={styles.testImage}
              showFallbackText={true}
              fallbackText="Failed to load"
            />
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          Troubleshooting Steps:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          1. Check if chat-media bucket exists{'\n'}
          2. Verify bucket is public{'\n'}
          3. Test if image URLs are accessible{'\n'}
          4. Check RLS policies{'\n'}
          5. Verify Edge Function is working{'\n'}
          6. Check network connectivity
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
  sampleImagesContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  sectionText: {
    fontSize: 14,
    marginBottom: getResponsiveSpacing('md'),
  },
  imageGrid: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('md'),
  },
  imageItem: {
    flex: 1,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  testImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
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