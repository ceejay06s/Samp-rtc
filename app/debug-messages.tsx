import { useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { SafeImage } from '../src/components/ui/SafeImage';
import { RealtimeChatService } from '../src/services/realtimeChat';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

interface DebugMessage {
  id: string;
  content: string;
  message_type: string;
  metadata: any;
  sender_id: string;
  created_at: string;
  raw_metadata: string;
}

export default function DebugMessagesScreen() {
  const theme = useTheme();
  const [messages, setMessages] = useState<DebugMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<DebugMessage | null>(null);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      
      // Get all messages from the database
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        Alert.alert('Error', `Failed to load messages: ${error.message}`);
        return;
      }

      const debugMessages = (data || []).map(msg => ({
        ...msg,
        raw_metadata: typeof msg.metadata === 'string' ? msg.metadata : JSON.stringify(msg.metadata)
      }));

      setMessages(debugMessages);
      console.log('Loaded messages:', debugMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const testMetadataParsing = () => {
    const realtimeService = RealtimeChatService.getInstance();
    
    messages.forEach((msg, index) => {
      console.log(`\n=== Message ${index + 1} ===`);
      console.log('Raw metadata:', msg.raw_metadata);
      console.log('Parsed metadata:', msg.metadata);
      
      // Test the safeParseMetadata method
      const parsed = realtimeService['safeParseMetadata'](msg.raw_metadata);
      console.log('Safe parsed metadata:', parsed);
      
      if (msg.message_type === 'PHOTO') {
        console.log('Photo message detected');
        console.log('Content:', msg.content);
        console.log('Metadata imageUrl:', msg.metadata?.imageUrl);
        console.log('Parsed imageUrl:', parsed?.imageUrl);
      }
    });
  };

  const renderMessage = ({ item }: { item: DebugMessage }) => {
    const isPhotoMessage = item.message_type === 'PHOTO';
    const imageUrl = item.metadata?.imageUrl;

    return (
      <View style={[styles.messageContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageId, { color: theme.colors.text }]}>
            ID: {item.id.substring(0, 8)}...
          </Text>
          <Text style={[styles.messageType, { color: theme.colors.primary }]}>
            {item.message_type}
          </Text>
        </View>

        <Text style={[styles.messageContent, { color: theme.colors.text }]}>
          Content: {item.content || '(empty)'}
        </Text>

        {isPhotoMessage && (
          <View style={styles.photoSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Photo Message Details:
            </Text>
            
            {imageUrl ? (
              <View style={styles.imageContainer}>
                <Text style={[styles.imageUrl, { color: theme.colors.textSecondary }]}>
                  URL: {imageUrl}
                </Text>
                <SafeImage 
                  source={{ uri: imageUrl }} 
                  style={styles.debugImage}
                  showFallbackText={true}
                  fallbackText="Failed to load"
                />
              </View>
            ) : (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                ❌ No imageUrl found in metadata
              </Text>
            )}
          </View>
        )}

        <View style={styles.metadataSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Metadata:
          </Text>
          <Text style={[styles.metadataText, { color: theme.colors.textSecondary }]}>
            {item.raw_metadata || '(no metadata)'}
          </Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            Sender: {item.sender_id.substring(0, 8)}...
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            Created: {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setSelectedMessage(item)}
        >
          <Text style={[styles.selectButtonText, { color: theme.colors.onPrimary }]}>
            Select for Details
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSelectedMessage = () => {
    if (!selectedMessage) return null;

    return (
      <View style={[styles.selectedMessageContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.selectedHeader}>
          <Text style={[styles.selectedTitle, { color: theme.colors.text }]}>
            Selected Message Details
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedMessage(null)}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.error }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.selectedContent}>
          <Text style={[styles.detailLabel, { color: theme.colors.text }]}>ID:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
            {selectedMessage.id}
          </Text>

          <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Type:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
            {selectedMessage.message_type}
          </Text>

          <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Content:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
            {selectedMessage.content || '(empty)'}
          </Text>

          <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Raw Metadata:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
            {selectedMessage.raw_metadata || '(no metadata)'}
          </Text>

          <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Parsed Metadata:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
            {JSON.stringify(selectedMessage.metadata, null, 2)}
          </Text>

          {selectedMessage.message_type === 'PHOTO' && (
            <>
              <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Image URL:</Text>
              <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                {selectedMessage.metadata?.imageUrl || '(no URL)'}
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Debug Messages
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Inspect message data and metadata
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={loadMessages}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {isLoading ? 'Loading...' : 'Load Messages'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={testMetadataParsing}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Metadata Parsing
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No messages loaded. Click "Load Messages" to start debugging.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
          />
        )}
      </View>

      {renderSelectedMessage()}
    </View>
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
    flexDirection: 'row',
    gap: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
  },
  button: {
    flex: 1,
    padding: getResponsiveSpacing('md'),
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: getResponsiveSpacing('md'),
    padding: getResponsiveSpacing('md'),
    borderRadius: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing('sm'),
  },
  messageId: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageType: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageContent: {
    fontSize: 16,
    marginBottom: getResponsiveSpacing('sm'),
  },
  photoSection: {
    marginBottom: getResponsiveSpacing('md'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('xs'),
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageUrl: {
    fontSize: 12,
    marginBottom: getResponsiveSpacing('xs'),
    textAlign: 'center',
  },
  debugImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metadataSection: {
    marginBottom: getResponsiveSpacing('md'),
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  detailsSection: {
    marginBottom: getResponsiveSpacing('md'),
  },
  detailText: {
    fontSize: 14,
  },
  selectButton: {
    padding: getResponsiveSpacing('sm'),
    borderRadius: 4,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedMessageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: getResponsiveSpacing('md'),
    zIndex: 1000,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: getResponsiveSpacing('sm'),
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: getResponsiveSpacing('sm'),
  },
}); 