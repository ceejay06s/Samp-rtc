import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SignupForm } from '../src/components/auth';
import { useTheme } from '../src/utils/themes';

export default function SignupScreen() {
  const theme = useTheme();

  const handleSignupSuccess = () => {
    router.replace('/dashboard');
  };

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SignupForm
        onSuccess={handleSignupSuccess}
        onNavigateToLogin={handleNavigateToLogin}
        showLoginLink={true}
        title="Create Account"
        subtitle="Join our dating community and find your perfect match"
        showTerms={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
}); 