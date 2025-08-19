import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { useTheme } from '../../utils/themes';

interface SessionGuardProps {
  children: React.ReactNode;
}

const SessionGuardComponent: React.FC<SessionGuardProps> = ({ children }) => {
  const theme = useTheme();
  const { isAuthenticated, loading, isSessionExpired, checkSessionValidity } = useAuth();
  const [checkingSession, setCheckingSession] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    // Only check session once when component mounts and auth is loaded
    if (loading || hasCheckedSession || !isAuthenticated) {
      return;
    }

    const validateSession = async () => {
      try {
        setCheckingSession(true);
        console.log('🔍 SessionGuard: Checking session validity...');
        
        const { isValid } = await checkSessionValidity();
        
        if (!isValid) {
          console.log('🚨 SessionGuard: Session invalid, redirecting to login');
          router.replace('/login');
          return;
        }
        
        console.log('✅ SessionGuard: Session is valid');
        setHasCheckedSession(true);
      } catch (error) {
        console.error('❌ SessionGuard: Error validating session:', error);
        router.replace('/login');
      } finally {
        setCheckingSession(false);
      }
    };

    // Add a small delay to prevent rapid re-renders
    const timeoutId = setTimeout(validateSession, 200);
    
    return () => clearTimeout(timeoutId);
  }, [loading, isAuthenticated, hasCheckedSession, checkSessionValidity]);

  // Show loading while checking session
  if (loading || checkingSession) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            {loading ? 'Loading...' : 'Checking session...'}
          </Text>
        </View>
      </View>
    );
  }

  // If session is expired, show redirecting message
  if (isSessionExpired) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.redirectContainer}>
          <Text style={[styles.redirectTitle, { color: theme.colors.text }]}>
            Session Expired
          </Text>
          <Text style={[styles.redirectText, { color: theme.colors.textSecondary }]}>
            Redirecting to login...
          </Text>
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.redirectSpinner} />
        </View>
      </View>
    );
  }

  // Session is valid, render children
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  redirectContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  redirectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  redirectText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  redirectSpinner: {
    marginTop: 8,
  },
});

export const SessionGuard = React.memo(SessionGuardComponent);
