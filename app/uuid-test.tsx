import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EnhancedPhotoUploadService } from '../src/services/enhancedPhotoUpload';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function UUIDTestScreen() {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testUUIDGeneration = () => {
    try {
      const messageId1 = EnhancedPhotoUploadService.generateMessageId();
      const messageId2 = EnhancedPhotoUploadService.generateMessageId();
      
      addResult(`Generated Message ID 1: ${messageId1}`);
      addResult(`Generated Message ID 2: ${messageId2}`);
      addResult(`UUIDs are unique: ${messageId1 !== messageId2}`);
      addResult(`UUID format valid: ${messageId1.length === 36 && messageId2.length === 36}`);
      
      Alert.alert('Success', 'UUID generation test completed!');
    } catch (error) {
      addResult(`Error: ${error}`);
      Alert.alert('Error', 'UUID generation test failed');
    }
  };

  const testFilenameCreation = () => {
    try {
      const messageId = EnhancedPhotoUploadService.generateMessageId();
      const filename1 = EnhancedPhotoUploadService.createFilenameFromMessageId(messageId, 'image/jpeg');
      const filename2 = EnhancedPhotoUploadService.createFilenameFromMessageId(messageId, 'image/png');
      const filename3 = EnhancedPhotoUploadService.createFilenameFromMessageId(messageId, 'image/gif');
      
      addResult(`Message ID: ${messageId}`);
      addResult(`JPEG filename: ${filename1}`);
      addResult(`PNG filename: ${filename2}`);
      addResult(`GIF filename: ${filename3}`);
      addResult(`All filenames use same UUID: ${filename1.split('.')[0] === filename2.split('.')[0]}`);
      
      Alert.alert('Success', 'Filename creation test completed!');
    } catch (error) {
      addResult(`Error: ${error}`);
      Alert.alert('Error', 'Filename creation test failed');
    }
  };

  const testMessageIdConsistency = () => {
    try {
      const messageId = EnhancedPhotoUploadService.generateMessageId();
      const filename = EnhancedPhotoUploadService.createFilenameFromMessageId(messageId, 'image/jpeg');
      
      addResult(`Message ID: ${messageId}`);
      addResult(`Filename: ${filename}`);
      addResult(`UUID in filename: ${filename.split('.')[0]}`);
      addResult(`Consistent: ${messageId === filename.split('.')[0]}`);
      
      Alert.alert('Success', 'Message ID consistency test completed!');
    } catch (error) {
      addResult(`Error: ${error}`);
      Alert.alert('Error', 'Message ID consistency test failed');
    }
  };

  const testOrganizedPathStructure = () => {
    try {
      const messageId = EnhancedPhotoUploadService.generateMessageId();
      const conversationId = 'conv-12345';
      const userId = 'user-67890';
      const fileType = 'image/jpeg';
      
      const organizedPath = EnhancedPhotoUploadService.createChatMediaPath(
        conversationId,
        userId,
        messageId,
        fileType
      );
      
      addResult(`Message ID: ${messageId}`);
      addResult(`Conversation ID: ${conversationId}`);
      addResult(`User ID: ${userId}`);
      addResult(`File Type: ${fileType}`);
      addResult(`Organized Path: ${organizedPath}`);
      addResult(`Full URL: /chat-media/${organizedPath}`);
      addResult(`Path Structure: conversations/conv-12345/user-67890/${messageId}.jpeg`);
      
      Alert.alert('Success', 'Organized path structure test completed!');
    } catch (error) {
      addResult(`Error: ${error}`);
      Alert.alert('Error', 'Organized path structure test failed');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          UUID-Based Filename Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Test the UUID-based filename system for messages
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testUUIDGeneration}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test UUID Generation
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
          onPress={testMessageIdConsistency}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Message ID Consistency
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.success }]}
          onPress={testOrganizedPathStructure}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Organized Path Structure
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
            No test results yet. Run a test to see results.
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
          How UUID-Based Filenames Work:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Generate UUID for message ID first{'\n'}
          • Use same UUID as filename{'\n'}
          • Upload image with UUID filename{'\n'}
          • Create message with UUID as ID{'\n'}
          • Ensures perfect consistency{'\n'}
          • No filename conflicts{'\n'}
          • Easy to track and manage
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          New Organized Path Structure:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Bucket: chat-media{'\n'}
          • Path: conversations/conversation_id/user_id/message_id.filetype{'\n'}
          • Example: /chat-media/conversations/conv-12345/user-67890/uuid-here.jpeg{'\n'}
          • Benefits:{'\n'}
          • Organized by conversation{'\n'}
          • User-specific folders{'\n'}
          • UUID-based filenames{'\n'}
          • Easy to find and manage{'\n'}
          • No path conflicts
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