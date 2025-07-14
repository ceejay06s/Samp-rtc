import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../utils/themes';
import { LoginForm, SignupForm } from './index';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const theme = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleNavigateToSignup = () => {
    setMode('signup');
  };

  const handleNavigateToLogin = () => {
    setMode('login');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>
              ✕
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.content}>
          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onNavigateToSignup={handleNavigateToSignup}
              showForgotPassword={true}
              showSignupLink={true}
              title="Welcome Back"
              subtitle="Sign in to continue your dating journey"
            />
          ) : (
            <SignupForm
              onSuccess={handleSuccess}
              onNavigateToLogin={handleNavigateToLogin}
              showLoginLink={true}
              title="Create Account"
              subtitle="Join our dating community and find your perfect match"
              showTerms={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
}); 