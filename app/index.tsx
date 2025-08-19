import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../src/utils/themes';

export default function IndexScreen() {
  const theme = useTheme();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        router.replace('/dashboard');
      } else {
        router.replace('/welcome');
      }
    }
  }, [isAuthenticated, loading, user]);

  if (loading) {
    return (
      <LinearGradient
        colors={theme.colors.gradient.background as [string, string]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={theme.colors.gradient.primary as [string, string]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>❤️</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.appTitle, { color: theme.colors.text }]}>
            Spark
          </Text>
          <Text style={[styles.appSubtitle, { color: theme.colors.textSecondary }]}>
            Find your perfect match
          </Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color={theme.colors.primary}
              style={styles.loadingSpinner}
            />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading your matches...
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return null; // This should never render as we redirect in useEffect
}

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
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: -1,
  },
  appSubtitle: {
    fontSize: 18,
    marginBottom: 48,
    fontWeight: '500',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 