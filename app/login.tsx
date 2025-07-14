import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoginForm } from '../src/components/auth';
import { useTheme } from '../src/utils/themes';

export default function LoginScreen() {
  const theme = useTheme();

  const handleLoginSuccess = () => {
    router.replace('/dashboard');
  };

  const handleNavigateToSignup = () => {
    router.push('/signup');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LoginForm
        onSuccess={handleLoginSuccess}
        onNavigateToSignup={handleNavigateToSignup}
        showForgotPassword={true}
        showSignupLink={true}
        title="Welcome Back"
        subtitle="Sign in to continue your dating journey"
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