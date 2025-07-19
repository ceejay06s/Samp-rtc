import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../utils/themes';

interface ErrorLog {
  id: string;
  timestamp: string;
  context: string;
  error: {
    message?: string;
    code?: string;
    details?: string;
  };
  additionalInfo?: any;
}

export const ErrorLogger: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);

  const addErrorLog = (context: string, error: any, additionalInfo?: any) => {
    const newLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error?.message,
        code: error?.code,
        details: error?.details,
      },
      additionalInfo,
    };
    
    setErrorLogs(prev => [newLog, ...prev]);
    console.error('🚨 ERROR LOGGED:', newLog);
  };

  const testChatFunctionality = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    setErrorLogs([]); // Clear previous logs

    try {
      // Test 1: Basic authentication
      console.log('🔍 Test 1: Checking authentication...');
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addErrorLog('authentication', authError, { userId: user.id });
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      if (!currentUser) {
        addErrorLog('authentication', { message: 'No user found' }, { userId: user.id });
        throw new Error('No authenticated user');
      }
      
      console.log('✅ Authentication OK');

      // Test 2: Check matches table
      console.log('🔍 Test 2: Checking matches table...');
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, level, is_active')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true);

      if (matchesError) {
        addErrorLog('matches-query', matchesError, { 
          userId: user.id,
          query: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        });
        throw new Error(`Matches query error: ${matchesError.message}`);
      }

      console.log('✅ Matches query OK, found:', matches?.length || 0);
      addErrorLog('matches-success', null, { 
        count: matches?.length || 0,
        matches: matches?.slice(0, 2) // Log first 2 matches
      });

      if (!matches || matches.length === 0) {
        addErrorLog('no-matches', { message: 'No matches found' }, { userId: user.id });
        Alert.alert('Info', 'No matches found. Create matches through the discover screen first.');
        return;
      }

      // Test 3: Check conversations table
      console.log('🔍 Test 3: Checking conversations table...');
      const matchIds = matches.map(m => m.id);
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id, match_id, unread_count')
        .in('match_id', matchIds);

      if (conversationsError) {
        addErrorLog('conversations-query', conversationsError, { 
          userId: user.id,
          matchIds,
          query: `in(match_id, [${matchIds.join(',')}])`
        });
        throw new Error(`Conversations query error: ${conversationsError.message}`);
      }

      console.log('✅ Conversations query OK, found:', conversations?.length || 0);
      addErrorLog('conversations-success', null, { 
        count: conversations?.length || 0,
        conversations: conversations?.slice(0, 2) // Log first 2 conversations
      });

      // Test 4: Check messages table
      console.log('🔍 Test 4: Checking messages table...');
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, content')
          .in('conversation_id', conversationIds)
          .limit(5);

        if (messagesError) {
          addErrorLog('messages-query', messagesError, { 
            userId: user.id,
            conversationIds: conversationIds.slice(0, 2)
          });
          throw new Error(`Messages query error: ${messagesError.message}`);
        }

        console.log('✅ Messages query OK, found:', messages?.length || 0);
        addErrorLog('messages-success', null, { 
          count: messages?.length || 0,
          messages: messages?.slice(0, 2) // Log first 2 messages
        });
      }

      // Test 5: Test RLS policies
      console.log('🔍 Test 5: Testing RLS policies...');
      const { data: rlsTest, error: rlsError } = await supabase
        .from('conversations')
        .select('count')
        .limit(1);

      if (rlsError) {
        addErrorLog('rls-test', rlsError, { userId: user.id });
        throw new Error(`RLS test error: ${rlsError.message}`);
      }

      console.log('✅ RLS policies OK');
      addErrorLog('rls-success', null, { userId: user.id });

      Alert.alert('Success', 'All chat functionality tests passed!');

    } catch (error) {
      console.error('❌ Test failed:', error);
      addErrorLog('test-failure', error, { userId: user.id });
      Alert.alert('Error', `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setErrorLogs([]);
  };

  const exportLogs = () => {
    const logText = errorLogs.map(log => 
      `[${log.timestamp}] ${log.context}: ${JSON.stringify(log, null, 2)}`
    ).join('\n\n');
    
    console.log('📋 EXPORTED LOGS:\n', logText);
    Alert.alert('Logs Exported', 'Check console for exported logs');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Chat Error Logger
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        User: {user?.email || 'Not logged in'}
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testChatFunctionality}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {loading ? 'Testing...' : 'Test Chat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          onPress={clearLogs}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Clear Logs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          onPress={exportLogs}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Export Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Logs */}
      {errorLogs.length > 0 && (
        <View style={styles.logsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Error Logs ({errorLogs.length})
          </Text>
          
          {errorLogs.map((log) => (
            <View key={log.id} style={[styles.logItem, { borderColor: theme.colors.border }]}>
              <View style={styles.logHeader}>
                <Text style={[styles.logContext, { color: theme.colors.primary }]}>
                  {log.context}
                </Text>
                <Text style={[styles.logTimestamp, { color: theme.colors.textSecondary }]}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              
              {log.error.message && (
                <Text style={[styles.logError, { color: theme.colors.error }]}>
                  ❌ {log.error.message}
                </Text>
              )}
              
              {log.error.code && (
                <Text style={[styles.logDetail, { color: theme.colors.textSecondary }]}>
                  Code: {log.error.code}
                </Text>
              )}
              
              {log.error.details && (
                <Text style={[styles.logDetail, { color: theme.colors.textSecondary }]}>
                  Details: {log.error.details}
                </Text>
              )}
              
              {log.additionalInfo && (
                <Text style={[styles.logDetail, { color: theme.colors.textSecondary }]}>
                  Info: {JSON.stringify(log.additionalInfo, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Instructions
        </Text>
        <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
          1. Click &ldquo;Test Chat&rdquo; to run diagnostics
        </Text>
        <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
          2. Check the logs below for detailed error information
        </Text>
        <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
          3. Use &ldquo;Export Logs&rdquo; to copy logs to console
        </Text>
        <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
          4. Share the console output for debugging
        </Text>
      </View>
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
  logsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  logItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logContext: {
    fontSize: 16,
    fontWeight: '600',
  },
  logTimestamp: {
    fontSize: 12,
  },
  logError: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  logDetail: {
    fontSize: 12,
    marginBottom: 2,
  },
  instructionsSection: {
    marginTop: 16,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 4,
  },
}); 