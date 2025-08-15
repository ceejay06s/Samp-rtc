import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { AuthService } from '../../services/auth';
import { useTheme } from '../../utils/themes';

export const AuthTestComponent: React.FC = () => {
  const theme = useTheme();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const [testLoading, setTestLoading] = useState(false);

  const handleTestSignIn = async () => {
    setTestLoading(true);
    try {
      // Test with a sample user (you'll need to create this user in your database)
      const result = await AuthService.signIn({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      Alert.alert('Success', `Signed in as ${result.user.email}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Sign in failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestSignOut = async () => {
    setTestLoading(true);
    try {
      await signOut();
      Alert.alert('Success', 'Signed out successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Sign out failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleRefreshAuthState = () => {
    const authState = {
      isAuthenticated,
      user: user?.email || 'None',
      loading,
    };
    
    Alert.alert(
      'Current Auth State',
      `Authenticated: ${authState.isAuthenticated}\nUser: ${authState.user}\nLoading: ${authState.loading}`
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Loading authentication state...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Authentication Test
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
        {!isAuthenticated ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleTestSignIn}
            disabled={testLoading}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              {testLoading ? 'Signing In...' : 'Test Sign In'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.error }]}
            onPress={handleTestSignOut}
            disabled={testLoading}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              {testLoading ? 'Signing Out...' : 'Test Sign Out'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={handleRefreshAuthState}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Check Auth State
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          This component helps test the authentication flow.
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Make sure you have a test user in your database.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
}); 