import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { useTheme } from '../src/utils/themes';

export default function SessionTestScreen() {
  const theme = useTheme();
  const { 
    user, 
    profile, 
    loading, 
    isAuthenticated, 
    isSessionExpired, 
    sessionExpiry, 
    lastLoginTime,
    checkSessionValidity 
  } = useAuth();
  
  const [sessionCheckResult, setSessionCheckResult] = useState<string>('Not checked');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  const handleSessionCheck = async () => {
    try {
      setSessionCheckResult('Checking...');
      const result = await checkSessionValidity();
      setSessionCheckResult(`Valid: ${result.isValid}, Needs Refresh: ${result.needsRefresh}`);
    } catch (error) {
      setSessionCheckResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => router.replace('/welcome')
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Not authenticated
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Session Test
        </Text>
        
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Authentication Status
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Is Session Expired: {isSessionExpired ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Loading: {loading ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            User Information
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            User ID: {user?.id || 'N/A'}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Email: {user?.email || 'N/A'}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Profile Name: {profile ? `${profile.first_name} ${profile.last_name}` : 'N/A'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Session Information
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Last Login: {lastLoginTime ? new Date(lastLoginTime).toLocaleString() : 'N/A'}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Session Expiry: {sessionExpiry ? new Date(sessionExpiry).toLocaleString() : 'N/A'}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Session Check Result: {sessionCheckResult}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Check Session Validity"
            onPress={handleSessionCheck}
            style={styles.button}
          />
          
          <Button
            title="Go to Dashboard"
            onPress={() => router.push('/dashboard')}
            style={styles.button}
          />
          
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            style={[styles.button, { backgroundColor: theme.colors.error }]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    gap: 15,
    marginTop: 20,
  },
  button: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
