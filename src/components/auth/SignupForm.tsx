import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthService } from '../../services/auth';
import { calculateAge, formatDateToISO, getMaximumBirthdate, getMinimumBirthdate } from '../../utils/dateUtils';
import { useTheme } from '../../utils/themes';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DatePicker } from '../ui/DatePicker';
import { GenderDropdown } from '../ui/GenderDropdown';
import { Input } from '../ui/Input';

interface SignupFormProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
  showLoginLink?: boolean;
  title?: string;
  subtitle?: string;
  showTerms?: boolean;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onNavigateToLogin,
  showLoginLink = true,
  title = 'Create Account',
  subtitle = 'Join our dating community and find your perfect match',
  showTerms = true,
}) => {
  const theme = useTheme();
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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName) {
      newErrors.lastName = 'Last name is required';
    }

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

    if (!gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await AuthService.signUp({
        email,
        password,
        firstName,
        lastName,
        birthdate: formatDateToISO(birthdate!),
        gender,
      });
      
      Alert.alert(
        'Success!',
        'Account created successfully! Welcome to our dating community.',
        [
          {
            text: 'Continue',
            onPress: () => onSuccess?.(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Signup Failed',
        error instanceof Error ? error.message : 'Please try again with different credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.nameRow}>
          <View style={styles.nameInput}>
            <Input
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
            />
          </View>
          <View style={styles.nameInput}>
            <Input
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
            />
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailInput}>
            <DatePicker
              placeholder="Birthdate"
              value={birthdate}
              onChange={setBirthdate}
              error={errors.birthdate}
              maximumDate={getMinimumBirthdate()}
              minimumDate={getMaximumBirthdate()}
            />
          </View>
          <View style={styles.detailInput}>
            <GenderDropdown
              value={gender}
              onValueChange={setGender}
              error={errors.gender}
              label=""
              placeholder="Select your gender"
            />
          </View>
        </View>

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

        <Input
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Create Account"
          onPress={handleSignup}
          loading={loading}
          style={styles.signupButton}
        />
      </Card>

      {showLoginLink && onNavigateToLogin && (
        <View style={styles.switchContainer}>
          <Text style={[styles.switchText, { color: theme.colors.textSecondary }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={[styles.switchButton, { color: theme.colors.primary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showTerms && (
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
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
  nameRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  nameInput: {
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  detailInput: {
    flex: 1,
  },
  signupButton: {
    marginTop: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchText: {
    fontSize: 14,
    marginRight: 5,
  },
  switchButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
}); 