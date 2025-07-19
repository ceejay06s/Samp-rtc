import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { supabase } from '../../../lib/supabase';
import { MessagingService } from '../../services/messaging';
import { MessageType } from '../../types';
import { useTheme } from '../../utils/themes';

interface DebugResult {
  id: string;
  timestamp: string;
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  error?: any;
}

export const ChatDebugAdvanced: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello from debug!');

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: any, error?: any) => {
    const result: DebugResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      test,
      status,
      message,
      data,
      error,
    };
    
    setDebugResults(prev => [result, ...prev]);
    console.log(`🔍 ${test}: ${status.toUpperCase()} - ${message}`, data || error);
  };

  const runAllTests = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    setDebugResults([]);

    try {
      // Test 1: Authentication
      addResult('Authentication', 'success', 'Starting authentication test...');
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addResult('Authentication', 'error', `Auth error: ${authError.message}`, null, authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!currentUser) {
        addResult('Authentication', 'error', 'No authenticated user found');
        throw new Error('No authenticated user');
      }
      
      addResult('Authentication', 'success', `User authenticated: ${currentUser.email}`, { userId: currentUser.id });

      // Test 2: Database Tables
      addResult('Database Tables', 'success', 'Checking database tables...');
      
      const tables = ['matches', 'conversations', 'messages', 'profiles'];
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          addResult(`Table ${table}`, 'error', `Table access error: ${error.message}`, null, error);
        } else {
          addResult(`Table ${table}`, 'success', `Table ${table} accessible`);
        }
      }

      // Test 2.5: Explicit conversations table check
      addResult('Conversations Table', 'success', 'Explicitly checking conversations table...');
      try {
        // Try to access the conversations table directly
        const { data: convCheck, error: convCheckError } = await supabase
          .from('conversations')
          .select('id')
          .limit(1);
        
        if (convCheckError) {
          addResult('Conversations Table', 'error', `Conversations table error: ${convCheckError.message}`, null, convCheckError);
          
          // Check if it's a "relation does not exist" error
          if (convCheckError.message.includes('relation') && convCheckError.message.includes('does not exist')) {
            addResult('Conversations Table', 'error', 'Table does not exist - needs to be created', null, convCheckError);
          }
        } else {
          addResult('Conversations Table', 'success', 'Conversations table exists and is accessible', { count: convCheck?.length || 0 });
        }
      } catch (convError) {
        addResult('Conversations Table', 'error', `Unexpected error: ${convError instanceof Error ? convError.message : 'Unknown error'}`, null, convError);
      }

      // Test 3: Foreign Keys
      addResult('Foreign Keys', 'success', 'Testing foreign key relationships...');
      
      // Test matches -> users relationship
      const { data: matchesTest, error: matchesError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .limit(1);
      
      if (matchesError) {
        addResult('Foreign Keys - Matches', 'error', `Matches FK error: ${matchesError.message}`, null, matchesError);
      } else {
        addResult('Foreign Keys - Matches', 'success', 'Matches foreign keys working');
      }

      // Test conversations -> matches relationship
      const { data: convTest, error: convError } = await supabase
        .from('conversations')
        .select('id, match_id')
        .limit(1);
      
      if (convError) {
        addResult('Foreign Keys - Conversations', 'error', `Conversations FK error: ${convError.message}`, null, convError);
      } else {
        addResult('Foreign Keys - Conversations', 'success', 'Conversations foreign keys working');
      }

      // Test 4: User's Matches
      addResult('User Matches', 'success', 'Fetching user matches...');
      const { data: matches, error: matchesError2 } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, level, is_active')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true);

      if (matchesError2) {
        addResult('User Matches', 'error', `Matches query error: ${matchesError2.message}`, null, matchesError2);
        throw new Error(`Failed to get matches: ${matchesError2.message}`);
      }

      addResult('User Matches', 'success', `Found ${matches?.length || 0} matches`, { matches: matches?.slice(0, 2) });

      if (!matches || matches.length === 0) {
        addResult('User Matches', 'warning', 'No matches found - create matches first');
        Alert.alert('Info', 'No matches found. Create matches through the discover screen first.');
        return;
      }

      // Test 5: Conversations
      addResult('Conversations', 'success', 'Fetching conversations...');
      const matchIds = matches.map(m => m.id);
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, match_id, unread_count, created_at, updated_at')
        .in('match_id', matchIds);

      if (conversationsError) {
        addResult('Conversations', 'error', `Conversations query error: ${conversationsError.message}`, null, conversationsError);
        throw new Error(`Failed to get conversations: ${conversationsError.message}`);
      }

      addResult('Conversations', 'success', `Found ${conversations?.length || 0} conversations`, { conversations: conversations?.slice(0, 2) });

      // Test 6: Profiles
      addResult('Profiles', 'success', 'Fetching user profiles...');
      const allUserIds = new Set<string>();
      matches.forEach(match => {
        allUserIds.add(match.user1_id);
        allUserIds.add(match.user2_id);
      });

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, photos')
        .in('user_id', Array.from(allUserIds));

      if (profilesError) {
        addResult('Profiles', 'error', `Profiles query error: ${profilesError.message}`, null, profilesError);
      } else {
        addResult('Profiles', 'success', `Found ${profiles?.length || 0} profiles`, { profiles: profiles?.slice(0, 2) });
      }

      // Test 7: MessagingService
      addResult('MessagingService', 'success', 'Testing MessagingService...');
      try {
        const serviceConversations = await MessagingService.getConversations(user.id);
        addResult('MessagingService', 'success', `Service returned ${serviceConversations.length} conversations`, { conversations: serviceConversations.slice(0, 1) });
      } catch (serviceError) {
        addResult('MessagingService', 'error', `Service error: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`, null, serviceError);
      }

      // Test 8: Send Message (if conversations exist)
      if (conversations && conversations.length > 0) {
        addResult('Send Message', 'success', 'Testing message sending...');
        const testConversation = conversations[0];
        
        try {
          const message = await MessagingService.sendMessage({
            conversationId: testConversation.id,
            content: testMessage,
            messageType: MessageType.TEXT,
          });
          addResult('Send Message', 'success', 'Message sent successfully', { messageId: message.id });
        } catch (sendError) {
          addResult('Send Message', 'error', `Send error: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`, null, sendError);
        }

        // Test 9: Get Messages
        addResult('Get Messages', 'success', 'Testing message retrieval...');
        try {
          const messages = await MessagingService.getMessages(testConversation.id);
          addResult('Get Messages', 'success', `Retrieved ${messages.length} messages`, { messages: messages.slice(0, 2) });
        } catch (getError) {
          addResult('Get Messages', 'error', `Get messages error: ${getError instanceof Error ? getError.message : 'Unknown error'}`, null, getError);
        }
      }

      // Test 10: RLS Policies
      addResult('RLS Policies', 'success', 'Testing Row Level Security...');
      const { data: rlsTest, error: rlsError } = await supabase
        .from('conversations')
        .select('count')
        .limit(1);

      if (rlsError) {
        addResult('RLS Policies', 'error', `RLS error: ${rlsError.message}`, null, rlsError);
      } else {
        addResult('RLS Policies', 'success', 'RLS policies working correctly');
      }

      addResult('All Tests', 'success', 'All tests completed successfully!');

    } catch (error) {
      console.error('❌ Debug test failed:', error);
      addResult('Test Suite', 'error', `Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`, null, error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  const exportResults = () => {
    const resultsText = debugResults.map(result => 
      `[${result.timestamp}] ${result.test}: ${result.status.toUpperCase()} - ${result.message}`
    ).join('\n');
    
    console.log('📋 DEBUG RESULTS:\n', resultsText);
    Alert.alert('Results Exported', 'Check console for detailed debug results');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.text;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Advanced Chat Debug
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        User: {user?.email || 'Not logged in'}
      </Text>

      {/* Test Message Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Test Message:</Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: theme.colors.surface, 
            color: theme.colors.text,
            borderColor: theme.colors.border 
          }]}
          value={testMessage}
          onChangeText={setTestMessage}
          placeholder="Enter test message..."
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={runAllTests}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {loading ? 'Running...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={clearResults}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Clear
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          onPress={exportResults}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Export
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Results */}
      {debugResults.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Debug Results ({debugResults.length})
          </Text>
          
          {debugResults.map((result) => (
            <View key={result.id} style={[styles.resultItem, { borderColor: theme.colors.border }]}>
              <View style={styles.resultHeader}>
                <Text style={[styles.resultTest, { color: theme.colors.primary }]}>
                  {result.test}
                </Text>
                <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                  {result.status.toUpperCase()}
                </Text>
              </View>
              
              <Text style={[styles.resultMessage, { color: theme.colors.text }]}>
                {result.message}
              </Text>
              
              <Text style={[styles.resultTimestamp, { color: theme.colors.textSecondary }]}>
                {new Date(result.timestamp).toLocaleTimeString()}
              </Text>
              
              {result.data && (
                <Text style={[styles.resultData, { color: theme.colors.textSecondary }]}>
                  Data: {JSON.stringify(result.data, null, 2)}
                </Text>
              )}
              
              {result.error && (
                <Text style={[styles.resultError, { color: theme.colors.error }]}>
                  Error: {JSON.stringify(result.error, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Summary */}
      {debugResults.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Summary
          </Text>
          <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
            Success: {debugResults.filter(r => r.status === 'success').length}
          </Text>
          <Text style={[styles.summaryText, { color: theme.colors.error }]}>
            Errors: {debugResults.filter(r => r.status === 'error').length}
          </Text>
          <Text style={[styles.summaryText, { color: theme.colors.warning }]}>
            Warnings: {debugResults.filter(r => r.status === 'warning').length}
          </Text>
        </View>
      )}
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultTimestamp: {
    fontSize: 12,
    marginBottom: 4,
  },
  resultData: {
    fontSize: 12,
    marginTop: 4,
  },
  resultError: {
    fontSize: 12,
    marginTop: 4,
  },
  summarySection: {
    marginTop: 16,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 2,
  },
}); 