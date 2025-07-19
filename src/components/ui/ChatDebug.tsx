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

export const ChatDebug: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    const info: any = {};

    try {
      // Test 1: Check if user exists
      console.log('🔍 Testing user authentication...');
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      info.user = {
        id: currentUser?.id,
        email: currentUser?.email,
        error: userError?.message
      };

      // Test 2: Check matches
      console.log('🔍 Testing matches...');
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true);
      
      info.matches = {
        count: matches?.length || 0,
        data: matches?.slice(0, 2), // Show first 2 matches
        error: matchesError?.message
      };

      // Test 3: Check conversations
      console.log('🔍 Testing conversations...');
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .limit(5);
      
      info.conversations = {
        count: conversations?.length || 0,
        data: conversations?.slice(0, 2), // Show first 2 conversations
        error: conversationsError?.message
      };

      // Test 4: Check messages
      console.log('🔍 Testing messages...');
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(5);
      
      info.messages = {
        count: messages?.length || 0,
        data: messages?.slice(0, 2), // Show first 2 messages
        error: messagesError?.message
      };

      // Test 5: Check RLS policies
      console.log('🔍 Testing RLS...');
      const { data: rlsTest, error: rlsError } = await supabase
        .from('conversations')
        .select('count')
        .limit(1);
      
      info.rls = {
        canAccess: !rlsError,
        error: rlsError?.message
      };

      // Test 6: Check user's conversations specifically
      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        const { data: userConversations, error: userConvError } = await supabase
          .from('conversations')
          .select('*')
          .in('match_id', matchIds);
        
        info.userConversations = {
          count: userConversations?.length || 0,
          data: userConversations?.slice(0, 2),
          error: userConvError?.message
        };
      }

      setDebugInfo(info);
      console.log('✅ Diagnostics complete:', info);

    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      Alert.alert('Error', 'Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    if (!user?.id) return;

    try {
      // Create a test match (you'll need another user ID)
      Alert.alert('Info', 'To create test data, you need to create a match first through the normal app flow.');
    } catch (error) {
      console.error('❌ Failed to create test data:', error);
      Alert.alert('Error', 'Failed to create test data');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Chat Debug Component
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        User: {user?.email || 'Not logged in'}
      </Text>

      {/* Run Diagnostics Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={runDiagnostics}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
          {loading ? 'Running...' : 'Run Diagnostics'}
        </Text>
      </TouchableOpacity>

      {/* Debug Information */}
      {Object.keys(debugInfo).length > 0 && (
        <View style={styles.debugSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Debug Results
          </Text>
          
          {Object.entries(debugInfo).map(([key, value]: [string, any]) => (
            <View key={key} style={[styles.debugItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.debugKey, { color: theme.colors.primary }]}>
                {key.toUpperCase()}
              </Text>
              
              {value.error ? (
                <Text style={[styles.debugError, { color: theme.colors.error }]}>
                  ❌ Error: {value.error}
                </Text>
              ) : (
                <>
                  {value.count !== undefined && (
                    <Text style={[styles.debugText, { color: theme.colors.text }]}>
                      Count: {value.count}
                    </Text>
                  )}
                  {value.canAccess !== undefined && (
                    <Text style={[styles.debugText, { color: value.canAccess ? theme.colors.success : theme.colors.error }]}>
                      Access: {value.canAccess ? '✅ Yes' : '❌ No'}
                    </Text>
                  )}
                  {value.data && (
                    <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
                      Sample: {JSON.stringify(value.data, null, 2)}
                    </Text>
                  )}
                </>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {Object.keys(debugInfo).length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recommendations
          </Text>
          
          {debugInfo.matches?.count === 0 && (
            <Text style={[styles.recommendation, { color: theme.colors.warning }]}>
              ⚠️ No matches found. Create matches through the discover screen first.
            </Text>
          )}
          
          {debugInfo.conversations?.count === 0 && debugInfo.matches?.count > 0 && (
            <Text style={[styles.recommendation, { color: theme.colors.warning }]}>
              ⚠️ No conversations found for matches. Run the database fix script.
            </Text>
          )}
          
          {debugInfo.rls?.canAccess === false && (
            <Text style={[styles.recommendation, { color: theme.colors.error }]}>
              ❌ RLS policies not working. Check database permissions.
            </Text>
          )}
          
          {debugInfo.user?.error && (
            <Text style={[styles.recommendation, { color: theme.colors.error }]}>
              ❌ User authentication issue: {debugInfo.user.error}
            </Text>
          )}
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
  debugSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  debugItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  debugKey: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 14,
    marginBottom: 2,
  },
  debugError: {
    fontSize: 14,
    fontWeight: '500',
  },
  recommendationsSection: {
    marginTop: 16,
  },
  recommendation: {
    fontSize: 14,
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
}); 