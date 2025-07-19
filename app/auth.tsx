import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { DatePicker } from '../src/components/ui/DatePicker';
import { GenderDropdown } from '../src/components/ui/GenderDropdown';
import { Input } from '../src/components/ui/Input';
import { AuthService } from '../src/services/auth';
import { calculateAge, formatDateToISO, getMaximumBirthdate, getMinimumBirthdate } from '../src/utils/dateUtils';
import { useTheme } from '../src/utils/themes';

export default function AuthScreen() {
  const theme = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState('');
  
  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!firstName) newErrors.firstName = 'First name is required';
      if (!lastName) newErrors.lastName = 'Last name is required';
      if (!birthdate) {
        newErrors.birthdate = 'Birthdate is required';
      } else {
        const age = calculateAge(birthdate);
        if (age < 18) {
          newErrors.birthdate = 'You must be at least 18 years old';
        } else if (age > 100) {
          newErrors.birthdate = 'Please enter a valid birthdate';
        }
      }
      if (!gender) newErrors.gender = 'Gender is required';
      if (confirmPassword !== password) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        await AuthService.signUp({
          email,
          password,
          firstName,
          lastName,
          birthdate: formatDateToISO(birthdate!),
          gender,
        });
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await AuthService.signIn({ email, password });
      }
      
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      await AuthService.resetPassword(email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send reset email'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {isSignUp ? 'Join our dating community' : 'Sign in to continue'}
        </Text>
      </View>

      <Card style={styles.formCard}>
        {isSignUp && (
          <>
            <Input
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
            />
            <Input
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
            />
            <DatePicker
              placeholder="Birthdate"
              value={birthdate}
              onChange={setBirthdate}
              error={errors.birthdate}
              maximumDate={getMinimumBirthdate()}
              minimumDate={getMaximumBirthdate()}
            />
            <GenderDropdown
              value={gender}
              onValueChange={setGender}
              error={errors.gender}
              label=""
              placeholder="Select your gender"
            />
          </>
        )}

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        {isSignUp && (
          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />
        )}

        <Button
          title={isSignUp ? 'Sign Up' : 'Sign In'}
          onPress={handleAuth}
          loading={loading}
          style={styles.authButton}
        />

        {!isSignUp && (
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      <View style={styles.switchContainer}>
        <Text style={[styles.switchText, { color: theme.colors.textSecondary }]}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        </Text>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={[styles.switchButton, { color: theme.colors.primary }]}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 20,
  },
  authButton: {
    marginTop: 10,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    marginRight: 5,
  },
  switchButton: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 