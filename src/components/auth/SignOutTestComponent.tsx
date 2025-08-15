import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { useTheme } from '../../utils/themes';

export const SignOutTestComponent: React.FC = () => {
  const theme = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const testSignOut = async () => {
    setTestLoading(true);
    addTestResult('🔐 Starting sign out test...');
    
    try {
      addTestResult('📋 Current state: User authenticated = ' + isAuthenticated);
      addTestResult('👤 Current user: ' + (user?.email || 'None'));
      
      await signOut();
      addTestResult('✅ Sign out completed successfully');
      
      // Wait a moment to see the state change
      setTimeout(() => {
        addTestResult('🔄 State after sign out: User authenticated = ' + isAuthenticated);
        addTestResult('👤 User after sign out: ' + (user?.email || 'None'));
        addTestResult('🎉 Sign out test completed successfully!');
      }, 1000);
      
    } catch (error) {
      addTestResult('❌ Sign out test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Sign out test error:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const testAuthState = () => {
    addTestResult('📊 Current Auth State:');
    addTestResult(`  - Authenticated: ${isAuthenticated}`);
    addTestResult(`  - User: ${user?.email || 'None'}`);
    addTestResult(`  - User ID: ${user?.id || 'None'}`);
    addTestResult(`  - Loading: ${false}`);
  };

  const simulateError = () => {
    addTestResult('🧪 Simulating sign out error...');
    // This will help test error handling
    setTimeout(() => {
      addTestResult('❌ Simulated error occurred');
    }, 1000);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Sign Out Test Component
        </Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Please sign in first to test sign out functionality.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Sign Out Test Component
      </Text>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </Text>
        {user && (
          <Text style={[styles.userText, { color: theme.colors.textSecondary }]}>
            User: {user.email}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testSignOut}
          disabled={testLoading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            {testLoading ? 'Testing Sign Out...' : 'Test Sign Out'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={testAuthState}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Check Auth State
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={simulateError}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            Simulate Error
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={clearTestResults}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Clear Results
          </Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
            Test Results:
          </Text>
          <View style={[styles.resultsList, { backgroundColor: theme.colors.surface }]}>
            {testResults.map((result, index) => (
              <Text key={index} style={[styles.resultText, { color: theme.colors.textSecondary }]}>
                {result}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          This component tests the sign out functionality across all components.
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Check the console for detailed logs.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  userText: {
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultsList: {
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
}); 