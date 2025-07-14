import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui';
import { Card } from '../src/components/ui/Card';
import { isDesktopBrowser, isMobileBrowser, isWeb } from '../src/utils/platform';
import {
    deviceType,
    getResponsiveFontSize,
    getResponsiveSpacing,
    getSafeAreaInsets,
    isBreakpoint
} from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function DashboardScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();
  const safeArea = getSafeAreaInsets();

  // Platform-specific helpers
  const isDesktop = isBreakpoint.xl || isDesktopBrowser();
  const isTablet = isBreakpoint.lg || isBreakpoint.md;
  const isMobile = isMobileBrowser() || !isWeb();

  const handleSignOut = async () => {
    // Use web-compatible confirmation for desktop browsers
    if (isDesktopBrowser()) {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) return;
      
      try {
        await signOut();
        router.replace('/login');
      } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
      }
    } else {
      // Use native Alert for mobile
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/login');
              } catch (error) {
                console.error('Sign out error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  // Desktop-specific spacing and sizing
  const getDesktopSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const spacingMap = {
        xs: 6,
        sm: 12,
        md: 20,
        lg: 28,
        xl: 36,
        xxl: 56,
      };
      return spacingMap[size];
    }
    return getResponsiveSpacing(size);
  };

  const getDesktopFontSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const fontSizeMap = {
        xs: 14,
        sm: 16,
        md: 18,
        lg: 20,
        xl: 24,
        xxl: 32,
      };
      return fontSizeMap[size];
    }
    return getResponsiveFontSize(size);
  };

  return (
    <ScrollView 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: isDesktop ? 40 : safeArea.top + getResponsiveSpacing('lg'),
          paddingHorizontal: isDesktop ? getDesktopSpacing('xl') : getResponsiveSpacing('lg'),
        }
      ]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={isDesktop ? styles.desktopContent : undefined}
    >
      {/* Header Section */}
      <View style={[styles.header, isDesktop && { marginBottom: getDesktopSpacing('xxl') }]}> 
        <View style={styles.headerTop}>
          <Text 
            style={[ 
              styles.title, 
              isDesktop && { fontSize: getDesktopFontSize('xxl'), marginBottom: getDesktopSpacing('sm') }
            ]}
          >
            Dashboard
          </Text>
          {/* Only show sign out button on mobile devices and mobile browsers */}
          {isMobile && (
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              size="small"
              style={styles.headerSignOutButton}
            />
          )}
        </View>
        <Text 
          style={[ 
            styles.subtitle, 
            isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.4 }
          ]}
        >
          Welcome to your dating journey
        </Text>
      </View>
      
      {/* Stats Section */}
      <View style={[styles.statsContainer, isDesktop && { marginBottom: getDesktopSpacing('xxl') }]}> 
        <Text 
          style={[ 
            styles.sectionTitle, 
            isDesktop && { fontSize: getDesktopFontSize('lg'), marginBottom: getDesktopSpacing('md') }
          ]}
        >
          Your Stats
        </Text>
        <View style={[styles.statsGrid, isDesktop && styles.desktopStatsGrid]}> 
          <Card 
            style={[styles.statCard, isDesktop && styles.desktopStatCard]}
            variant="elevated"
            padding="medium"
          >
            <Text style={[styles.statNumber, isDesktop && { fontSize: getDesktopFontSize('xl'), marginBottom: getDesktopSpacing('xs') }, { color: theme.colors.primary }]}>12</Text>
            <Text style={[styles.statLabel, isDesktop && { fontSize: getDesktopFontSize('sm') }, { color: theme.colors.textSecondary }]}>Matches</Text>
          </Card>
          <Card 
            style={[styles.statCard, isDesktop && styles.desktopStatCard]}
            variant="elevated"
            padding="medium"
          >
            <Text style={[styles.statNumber, isDesktop && { fontSize: getDesktopFontSize('xl'), marginBottom: getDesktopSpacing('xs') }, { color: theme.colors.secondary }]}>5</Text>
            <Text style={[styles.statLabel, isDesktop && { fontSize: getDesktopFontSize('sm') }, { color: theme.colors.textSecondary }]}>Conversations</Text>
          </Card>
          <Card 
            style={[styles.statCard, isDesktop && styles.desktopStatCard]}
            variant="elevated"
            padding="medium"
          >
            <Text style={[styles.statNumber, isDesktop && { fontSize: getDesktopFontSize('xl'), marginBottom: getDesktopSpacing('xs') }, { color: theme.colors.accent }]}>3</Text>
            <Text style={[styles.statLabel, isDesktop && { fontSize: getDesktopFontSize('sm') }, { color: theme.colors.textSecondary }]}>Voice Calls</Text>
          </Card>
        </View>
      </View>
      
      {/* Quick Actions Section */}
      <View style={[styles.actionsContainer, isDesktop && { marginBottom: getDesktopSpacing('xxl') }]}> 
        <Text 
          style={[ 
            styles.sectionTitle, 
            isDesktop && { fontSize: getDesktopFontSize('lg'), marginBottom: getDesktopSpacing('md') }
          ]}
        >
          Quick Actions
        </Text>
        <View style={[styles.actionsGrid, isDesktop && styles.desktopActionsGrid]}>
          <Card 
            style={[styles.actionCard, isDesktop && styles.desktopActionCard]}
            variant="elevated"
            padding="large"
          >
            <Text style={[styles.actionIcon, { color: theme.colors.primary }]}>💕</Text>
            <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
              Start Discovering
            </Text>
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
              Find new matches based on your preferences
            </Text>
          </Card>
          <Card 
            style={[styles.actionCard, isDesktop && styles.desktopActionCard]}
            variant="elevated"
            padding="large"
          >
            <Text style={[styles.actionIcon, { color: theme.colors.secondary }]}>💬</Text>
            <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
              View Messages
            </Text>
            <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
              Check your conversations and respond
            </Text>
          </Card>
        </View>
      </View>
      
      {/* Bottom padding for mobile to ensure content is not cut off by toolbar */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  desktopContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xxl'),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  headerSignOutButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  title: {
    fontSize: getResponsiveFontSize('xxl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize('md') * 1.4,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '700',
    marginBottom: getResponsiveSpacing('md'),
  },
  statsContainer: {
    marginBottom: getResponsiveSpacing('xxl'),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSpacing('sm'),
  },
  desktopStatsGrid: {
    gap: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: deviceType.isPhone ? 80 : 100,
  },
  desktopStatCard: {
    minHeight: 120,
    flex: 1,
  },
  statNumber: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('xs'),
  },
  statLabel: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: getResponsiveSpacing('xxl'),
  },
  actionsGrid: {
    flexDirection: 'column',
    gap: getResponsiveSpacing('md'),
  },
  desktopActionsGrid: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('lg'),
  },
  actionCard: {
    alignItems: 'center',
    textAlign: 'center',
  },
  desktopActionCard: {
    flex: 1,
    padding: getResponsiveSpacing('xl'),
  },
  actionIcon: {
    fontSize: getResponsiveFontSize('xl'),
    marginBottom: getResponsiveSpacing('md'),
  },
  actionTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  actionText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize('sm') * 1.4,
  },
  bottomPadding: {
    height: getResponsiveSpacing('xxl'),
  },
}); 