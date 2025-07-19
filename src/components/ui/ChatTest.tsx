import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { MessagingService } from '../../services/messaging';
import { MessageType } from '../../types';
import { useTheme } from '../../utils/themes';

export const ChatTest: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Load conversations
  const loadConversations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await MessagingService.getConversations(user.id);
      setConversations(data);
      console.log('✅ Conversations loaded:', data.length);
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const data = await MessagingService.getMessages(conversationId);
      setMessages(data);
      setSelectedConversation(conversationId);
      console.log('✅ Messages loaded:', data.length);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a test message
  const sendTestMessage = async (conversationId: string) => {
    if (!user?.id) return;
    
    try {
      const message = await MessagingService.sendMessage({
        conversationId,
        content: `Test message from ${user.email} at ${new Date().toLocaleTimeString()}`,
        messageType: MessageType.TEXT,
      });
      console.log('✅ Message sent:', message);
      
      // Reload messages
      await loadMessages(conversationId);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Create a test conversation
  const createTestConversation = async () => {
    if (!user?.id) return;
    
    try {
      // This would need a valid match ID - for testing, we'll use the first conversation
      if (conversations.length > 0) {
        const conversation = conversations[0];
        await sendTestMessage(conversation.id);
      } else {
        Alert.alert('Info', 'No conversations available. Create a match first.');
      }
    } catch (error) {
      console.error('❌ Failed to create test conversation:', error);
      Alert.alert('Error', 'Failed to create test conversation');
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Chat Test Component
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        User: {user?.email || 'Not logged in'}
      </Text>

      {/* Load Conversations Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={loadConversations}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
          {loading ? 'Loading...' : 'Load Conversations'}
        </Text>
      </TouchableOpacity>

      {/* Conversations List */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Conversations ({conversations.length})
      </Text>
      
      {conversations.map((conversation) => (
        <View key={conversation.id} style={[styles.conversationItem, { borderColor: theme.colors.border }]}>
          <Text style={[styles.conversationText, { color: theme.colors.text }]}>
            ID: {conversation.id}
          </Text>
          <Text style={[styles.conversationText, { color: theme.colors.textSecondary }]}>
            Match ID: {conversation.match_id}
          </Text>
          <Text style={[styles.conversationText, { color: theme.colors.textSecondary }]}>
            Unread: {conversation.unread_count}
          </Text>
          <Text style={[styles.conversationText, { color: theme.colors.textSecondary }]}>
            Updated: {new Date(conversation.updated_at).toLocaleString()}
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => loadMessages(conversation.id)}
            >
              <Text style={[styles.smallButtonText, { color: theme.colors.onPrimary }]}>
                Load Messages
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: theme.colors.accent }]}
              onPress={() => sendTestMessage(conversation.id)}
            >
              <Text style={[styles.smallButtonText, { color: theme.colors.onPrimary }]}>
                Send Test Message
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Messages List */}
      {selectedConversation && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Messages for {selectedConversation} ({messages.length})
          </Text>
          
          {messages.map((message) => (
            <View key={message.id} style={[styles.messageItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.messageText, { color: theme.colors.text }]}>
                {message.content}
              </Text>
              <Text style={[styles.messageMeta, { color: theme.colors.textSecondary }]}>
                From: {message.sender_id} | {new Date(message.created_at).toLocaleString()}
              </Text>
              <Text style={[styles.messageMeta, { color: theme.colors.textSecondary }]}>
                Type: {message.message_type} | Read: {message.is_read ? 'Yes' : 'No'}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Test Actions */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Test Actions
      </Text>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.success }]}
        onPress={createTestConversation}
      >
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
          Send Test Message
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  conversationItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  conversationText: {
    fontSize: 14,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  smallButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageMeta: {
    fontSize: 12,
    marginBottom: 2,
  },
}); 