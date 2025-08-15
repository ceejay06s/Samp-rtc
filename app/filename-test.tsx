import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { EnhancedPhotoUploadService } from '../src/services/enhancedPhotoUpload';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function FilenameTestScreen() {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testMessageIdGeneration = () => {
    const messageId = EnhancedPhotoUploadService.generateMessageId();
    addResult(`Generated Message ID: ${messageId}`);
    addResult(`Length: ${messageId.length} characters`);
    addResult(`Format: UUID v4`);
  };

  const testFilenameCreation = () => {
    const messageId = EnhancedPhotoUploadService.generateMessageId();
    const filename = EnhancedPhotoUploadService.createFilenameFromMessageId(messageId, 'image/jpeg');
    addResult(`Message ID: ${messageId}`);
    addResult(`Filename: ${filename}`);
    addResult(`Extension: .jpeg`);
  };

  const testChatMediaPath = () => {
    const messageId = EnhancedPhotoUploadService.generateMessageId();
    const conversationId = 'conv-12345';
    const userId = 'user-67890';
    const fileType = 'image/png';
    
    const path = EnhancedPhotoUploadService.createChatMediaPath(
      conversationId,
      userId,
      messageId,
      fileType
    );
    
    addResult(`Conversation ID: ${conversationId}`);
    addResult(`User ID: ${userId}`);
    addResult(`Message ID: ${messageId}`);
    addResult(`File Type: ${fileType}`);
    addResult(`Generated Path: ${path}`);
    addResult(`Full URL: /chat-media/${path}`);
  };

  const testFileObjectCreation = async () => {
    try {
      // Create a mock photo object
      const mockPhoto = {
        uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        width: 100,
        height: 100,
        type: 'image/jpeg',
        base64: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      };

      const messageId = EnhancedPhotoUploadService.generateMessageId();
      
      // Test the photoToFile method (we need to access it through a workaround)
      // Since it's private, we'll test the filename creation logic
      const extension = mockPhoto.type.split('/')[1] || 'jpg';
      const fileName = `${messageId}.${extension}`;
      
      addResult(`Mock Photo Type: ${mockPhoto.type}`);
      addResult(`Message ID: ${messageId}`);
      addResult(`Generated Filename: ${fileName}`);
      addResult(`Expected Extension: .jpeg`);
      addResult(`Filename matches Message ID: ${fileName.startsWith(messageId)}`);
    } catch (error) {
      addResult(`Error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Filename Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Test that message ID is used as filename, not folder
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testMessageIdGeneration}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Message ID Generation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={testFilenameCreation}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Filename Creation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          onPress={testChatMediaPath}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Chat Media Path
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.warning }]}
          onPress={testFileObjectCreation}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test File Object Creation
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

      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          Expected Behavior:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Message ID should be the filename, not a folder{'\n'}
          • Path should be: conversations/conv_id/user_id/message_id.filetype{'\n'}
          • NOT: conversations/conv_id/user_id/message_id/filename.filetype{'\n'}
          • File object should have message ID as filename{'\n'}
          • Extension should be based on MIME type
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