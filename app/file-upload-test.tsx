import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { EnhancedPhotoUploadService, PhotoType } from '../src/services/enhancedPhotoUpload';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function FileUploadTestScreen() {
  const theme = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testImagePicker = async () => {
    try {
      addResult('Testing image picker...');
      
      const hasPermission = await EnhancedPhotoUploadService.requestPermissions();
      if (!hasPermission) {
        addResult('❌ Permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        addResult(`✅ Image selected: ${asset.width}x${asset.height}`);
        addResult(`Type: ${asset.type}`);
        addResult(`Base64 length: ${asset.base64?.length || 0}`);
        
        // Test the photo upload
        await testPhotoUpload(asset);
      } else {
        addResult('❌ No image selected');
      }
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testPhotoUpload = async (asset: any) => {
    try {
      setIsUploading(true);
      addResult('📤 Starting photo upload test...');

      const photoData = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type || 'image/jpeg',
        base64: asset.base64 || undefined,
      };

      // Generate message ID
      const messageId = EnhancedPhotoUploadService.generateMessageId();
      addResult(`Generated Message ID: ${messageId}`);

      // Create chat media path
      const conversationId = 'test-conv-12345';
      const userId = 'test-user-67890';
      const organizedPath = EnhancedPhotoUploadService.createChatMediaPath(
        conversationId,
        userId,
        messageId,
        photoData.type
      );
      addResult(`Organized Path: ${organizedPath}`);

      // Upload with message ID
      const uploadResult = await EnhancedPhotoUploadService.uploadPhotoWithMessageId(
        photoData,
        messageId,
        PhotoType.CHAT,
        organizedPath
      );

      if (uploadResult.success) {
        addResult('✅ Upload successful!');
        addResult(`URL: ${uploadResult.url}`);
        addResult(`Path: ${uploadResult.path}`);
        addResult(`Bucket: ${uploadResult.bucket}`);
        addResult(`Message ID: ${uploadResult.messageId}`);
        
        // Verify the path structure
        const expectedPath = `conversations/${conversationId}/${userId}/${messageId}.${photoData.type.split('/')[1]}`;
        if (uploadResult.path?.includes(expectedPath)) {
          addResult('✅ Path structure is correct!');
        } else {
          addResult('❌ Path structure is incorrect!');
          addResult(`Expected: ${expectedPath}`);
          addResult(`Got: ${uploadResult.path}`);
        }
      } else {
        addResult(`❌ Upload failed: ${uploadResult.error}`);
      }
    } catch (error) {
      addResult(`❌ Upload error: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const testProfileUpload = async () => {
    try {
      setIsUploading(true);
      addResult('📤 Testing profile photo upload...');

      const hasPermission = await EnhancedPhotoUploadService.requestPermissions();
      if (!hasPermission) {
        addResult('❌ Permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photoData = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type || 'image/jpeg',
          base64: asset.base64,
        };

        const uploadResult = await EnhancedPhotoUploadService.uploadProfilePhoto(photoData);

        if (uploadResult.success) {
          addResult('✅ Profile upload successful!');
          addResult(`URL: ${uploadResult.url}`);
          addResult(`Path: ${uploadResult.path}`);
          addResult(`Bucket: ${uploadResult.bucket}`);
        } else {
          addResult(`❌ Profile upload failed: ${uploadResult.error}`);
        }
      }
    } catch (error) {
      addResult(`❌ Profile upload error: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const testFileObjectCreation = async () => {
    try {
      addResult('🔧 Testing file object creation...');

      const hasPermission = await EnhancedPhotoUploadService.requestPermissions();
      if (!hasPermission) {
        addResult('❌ Permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photoData = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type || 'image/jpeg',
          base64: asset.base64 ? asset.base64 : undefined,
        };

        const messageId = EnhancedPhotoUploadService.generateMessageId();
        addResult(`Message ID: ${messageId}`);

        // Test filename creation
        const filename = EnhancedPhotoUploadService.createFilenameFromMessageId(messageId, photoData.type);
        addResult(`Generated filename: ${filename}`);

        // Test path creation
        const path = EnhancedPhotoUploadService.createChatMediaPath(
          'test-conv',
          'test-user',
          messageId,
          photoData.type
        );
        addResult(`Generated path: ${path}`);

        // Verify the structure
        const expectedFilename = `${messageId}.${photoData.type.split('/')[1]}`;
        if (filename === expectedFilename) {
          addResult('✅ Filename creation is correct!');
        } else {
          addResult('❌ Filename creation is incorrect!');
          addResult(`Expected: ${expectedFilename}`);
          addResult(`Got: ${filename}`);
        }
      }
    } catch (error) {
      addResult(`❌ File object test error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          File Upload Test
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Test file uploads with correct path structure
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testImagePicker}
          disabled={isUploading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {isUploading ? 'Uploading...' : 'Test Chat Image Upload'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={testProfileUpload}
          disabled={isUploading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {isUploading ? 'Uploading...' : 'Test Profile Upload'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          onPress={testFileObjectCreation}
          disabled={isUploading}
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
          • Message ID should be the filename{'\n'}
          • Path should be: conversations/conv_id/user_id/message_id.filetype{'\n'}
          • No duplicate filenames in path{'\n'}
          • Correct bucket and URL returned{'\n'}
          • File should be accessible via returned URL
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