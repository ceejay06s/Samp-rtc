import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { AuthService } from '../../services/auth';
import { useTheme } from '../../utils/themes';
import { Input } from '../ui/Input';

export const LoginTroubleshooter: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testConnection = async () => {
    addResult('🔍 Testing Supabase connection...');
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`);
      } else {
        addResult('✅ Supabase connection successful');
      }
    } catch (error) {
      addResult(`❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkUserExists = async () => {
    if (!email) {
      addResult('❌ Please enter an email address first');
      return;
    }

    addResult(`🔍 Checking if user exists: ${email}`);
    setLoading(true);

    try {
      // Check if user exists in auth.users (this requires admin privileges)
      addResult('⚠️ Note: Checking auth users requires admin privileges');
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('user_id', email)
        .maybeSingle();

      if (profileError) {
        addResult(`❌ Cannot check profile: ${profileError.message}`);
      } else if (profile) {
        addResult(`✅ Profile exists for user: ${profile.first_name} ${profile.last_name}`);
      } else {
        addResult('❌ No profile found for this user');
      }

    } catch (error) {
      addResult(`❌ Error checking user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (!email || !password) {
      addResult('❌ Please enter both email and password');
      return;
    }

    addResult(`🔐 Testing login for: ${email}`);
    setLoading(true);

    try {
      const result = await AuthService.signIn({ email, password });
      addResult(`✅ Login successful! User ID: ${result.user.id}`);
      addResult(`👤 Profile: ${result.profile.first_name} ${result.profile.last_name}`);
    } catch (error) {
      addResult(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Provide specific guidance based on error
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          addResult('💡 Tip: Check your email and password. Make sure caps lock is off.');
        } else if (error.message.includes('Profile not found')) {
          addResult('💡 Tip: User exists but profile is missing. Contact support.');
        } else if (error.message.includes('network')) {
          addResult('💡 Tip: Check your internet connection.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    if (!email || !password) {
      addResult('❌ Please enter both email and password');
      return;
    }

    addResult(`👤 Creating test user: ${email}`);
    setLoading(true);

    try {
      const result = await AuthService.signUp({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
        birthdate: '1990-01-01',
        gender: 'other'
      });
      
      addResult(`✅ Test user created successfully!`);
      addResult(`🆔 User ID: ${result.user.id}`);
      addResult(`👤 Profile: ${result.profile.first_name} ${result.profile.last_name}`);
      addResult(`📧 Email: ${result.user.email}`);
      addResult(`🔑 Password: ${password}`);
      
    } catch (error) {
      addResult(`❌ Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          addResult('💡 Tip: User already exists. Try logging in instead.');
        } else if (error.message.includes('password')) {
          addResult('💡 Tip: Password must be at least 6 characters long.');
        } else if (error.message.includes('email')) {
          addResult('💡 Tip: Please enter a valid email address.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      addResult('❌ Please enter an email address first');
      return;
    }

    addResult(`📧 Sending password reset to: ${email}`);
    setLoading(true);

    try {
      await AuthService.resetPassword(email);
      addResult('✅ Password reset email sent! Check your inbox.');
    } catch (error) {
      addResult(`❌ Failed to send reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Login Troubleshooter
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Diagnose and fix login issues
      </Text>

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          showPasswordToggle={true}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Connection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={checkUserExists}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Check User Exists
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={testLogin}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Test Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={createTestUser}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Create Test User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={resetPassword}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            Reset Password
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={clearResults}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Clear Results
          </Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
            Results:
          </Text>
          <View style={[styles.resultsList, { backgroundColor: theme.colors.surface }]}>
            {results.map((result, index) => (
              <Text key={index} style={[styles.resultText, { color: theme.colors.textSecondary }]}>
                {result}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          This tool helps diagnose login issues. Use it to:
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Test database connection
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Check if user exists
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Test login credentials
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Create test users
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          • Reset passwords
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
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
    maxHeight: 300,
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
    marginBottom: 2,
  },
}); 