import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { IconNames, MaterialIcon } from '../src/components/ui/MaterialIcon';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { MatchingService } from '../src/services/matching';
import { Profile } from '../src/types';
import { isDesktopBrowser, isMobileBrowser, isWeb } from '../src/utils/platform';
import { getResponsiveFontSize, getResponsiveSpacing, isBreakpoint } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function DashboardScreen() {
  const theme = useTheme();
  const { isWeb: isWebPlatform } = usePlatform();
  const { signOut, user, loading: authLoading, isAuthenticated, authStateStable } = useAuth();
  
  // Guard against rendering without user to prevent loops
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }
  
  // Wait for auth state to be stable
  if (!authStateStable) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Setting up authentication...
          </Text>
        </View>
      </View>
    );
  }
  
  // Check if we have a valid user
  if (!user || !user.id) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            No user found. Please sign in.
          </Text>
          <TouchableOpacity 
            style={styles.redirectButton}
            onPress={() => {
              router.replace('/welcome');
            }}
          >
            <Text style={[styles.redirectButtonText, { color: theme.colors.primary }]}>
              Go to Welcome
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // FULL DASHBOARD: Restore all original features
  const isDesktop = isBreakpoint.xl || isDesktopBrowser();
  const isMobile = isMobileBrowser() || !isWeb();

  // Notifications state
  const [activeMatches, setActiveMatches] = useState<Profile[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Memoized fetch function to prevent recreation
  const fetchMatches = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMatches(true);
    try {
      const matches = await MatchingService.getMatches(user.id);
      const profiles = matches
        .map((match: any) => match.otherProfile)
        .filter(Boolean) as Profile[];
      setActiveMatches(profiles);
    } catch (e) {
      setActiveMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Only fetch if user exists and is not loading
    if (user?.id && !authLoading) {
      fetchMatches();
    }
  }, [user?.id, authLoading, fetchMatches]);

  // Memoized helper function to show alerts
  const showAlert = useCallback((title: string, message?: string, buttons?: any[]) => {
    if (isWebPlatform) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  }, [isWebPlatform]);

  // Memoized sign out handler
  const handleSignOut = useCallback(async () => {
    if (isWebPlatform) {
      WebAlert.showConfirmation(
        'Sign Out',
        'Are you sure you want to sign out?',
        async () => {
          try {
            console.log('🔐 DashboardScreen: Starting sign out process');
            await signOut();
            console.log('✅ DashboardScreen: Sign out successful, redirecting to homepage');
            router.replace('/welcome');
          } catch (error) {
            console.error('❌ DashboardScreen: Sign out error:', error);
            showAlert(
              'Sign Out Failed', 
              'Failed to sign out. Please try again. If the problem persists, please refresh the page.'
            );
          }
        }
      );
    } else {
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
                console.log('🔐 DashboardScreen: Starting sign out process');
                await signOut();
                console.log('✅ DashboardScreen: Sign out successful, redirecting to homepage');
                router.replace('/welcome');
              } catch (error) {
                console.error('❌ DashboardScreen: Sign out error:', error);
                Alert.alert(
                  'Sign Out Failed', 
                  'Failed to sign out. Please try again. If the problem persists, please restart the app.'
                );
              }
            },
          },
        ]
      );
    }
  }, [isWebPlatform, signOut, showAlert]);

  // Memoized desktop spacing and sizing functions
  const getDesktopSpacing = useCallback((size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
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
  }, [isDesktop]);

  const getDesktopFontSize = useCallback((size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
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
  }, [isDesktop]);

  // Memoized styles to prevent recreation
  const containerStyle = useMemo(() => [
    styles.container, 
    { 
      backgroundColor: theme.colors.background,
      paddingTop: isDesktop ? 40 : 60, // Fixed padding instead of safeArea
      paddingHorizontal: isDesktop ? getDesktopSpacing('xl') : getResponsiveSpacing('lg'),
    }
  ], [theme.colors.background, isDesktop, getDesktopSpacing, getResponsiveSpacing]);

  const headerStyle = useMemo(() => [
    styles.header, 
    isDesktop && { marginBottom: getDesktopSpacing('xxl') }
  ], [isDesktop, getDesktopSpacing]);

  const titleStyle = useMemo(() => [
    styles.title, 
    isDesktop && { fontSize: getDesktopFontSize('xxl'), marginBottom: getDesktopSpacing('sm') }
  ], [isDesktop, getDesktopFontSize, getDesktopSpacing]);

  const subtitleStyle = useMemo(() => [
    styles.subtitle, 
    isDesktop && { fontSize: getDesktopFontSize('md'), lineHeight: getDesktopFontSize('md') * 1.4 }
  ], [isDesktop, getDesktopFontSize, getDesktopSpacing]);

  const statsContainerStyle = useMemo(() => [
    styles.statsContainer, 
    isDesktop && { marginBottom: getDesktopSpacing('xxl') }
  ], [isDesktop, getDesktopSpacing]);

  const statsTitleStyle = useMemo(() => [
    styles.sectionTitle, 
    isDesktop && { fontSize: getDesktopFontSize('lg'), marginBottom: getDesktopSpacing('md') }
  ], [isDesktop, getDesktopFontSize, getDesktopSpacing]);

  const actionsContainerStyle = useMemo(() => [
    styles.actionsContainer, 
    isDesktop && { marginBottom: getDesktopSpacing('xxl') }
  ], [isDesktop, getDesktopFontSize, getDesktopSpacing]);

  const actionsTitleStyle = useMemo(() => [
    styles.sectionTitle, 
    isDesktop && { fontSize: getDesktopFontSize('lg'), marginBottom: getDesktopSpacing('md') }
  ], [isDesktop, getDesktopFontSize, getDesktopSpacing]);

  return (
    <ScrollView 
      style={containerStyle}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={isDesktop ? styles.desktopContent : undefined}
    >
      {/* Header Section */}
      <View style={headerStyle}> 
        <View style={styles.headerTop}>
          <Text style={titleStyle}>
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
        <Text style={subtitleStyle}>
          Welcome to your dating journey
        </Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.notificationsSection}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {loadingMatches ? (
          <Text style={styles.notificationsLoading}>Loading...</Text>
        ) : activeMatches.length === 0 ? (
          <Text style={styles.notificationsEmpty}>No active matches yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.notificationsList}>
            {activeMatches.map((profile) => (
              <View key={profile.id} style={styles.notificationCard}>
                <View style={styles.notificationAvatarWrapper}>
                  {profile.photos && profile.photos.length > 0 ? (
                    <Image
                      source={{ uri: profile.photos[0] }}
                      style={styles.notificationAvatar}
                    />
                  ) : (
                    <View style={[styles.notificationAvatar, styles.notificationAvatarPlaceholder]}>
                      <Text style={styles.notificationAvatarInitial}>{profile.first_name?.[0] || '?'}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.notificationName}>{profile.first_name}</Text>
                <Text style={styles.notificationStatus}>
                  {profile.is_online ? 'Active now' : 'Matched'}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Stats Section */}
      <View style={statsContainerStyle}> 
        <Text style={statsTitleStyle}>
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
      <View style={actionsContainerStyle}> 
        <Text style={actionsTitleStyle}>
          Quick Actions
        </Text>
        <View style={[styles.actionsGrid, isDesktop && styles.desktopActionsGrid]}>
          <Card 
            style={[styles.actionCard, isDesktop && styles.desktopActionCard]}
            variant="elevated"
            padding="large"
          >
            <MaterialIcon 
              name={IconNames.matches} 
              size={isDesktop ? 32 : 24} 
              color={theme.colors.primary} 
            />
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
            <MaterialIcon 
              name={IconNames.messages} 
              size={isDesktop ? 32 : 24} 
              color={theme.colors.secondary} 
            />
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSignOutButton: {
    marginLeft: 10,
  },
  desktopContent: {
    paddingBottom: 48,
  },
  desktopStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  desktopActionCard: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  desktopActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  bottomPadding: {
    height: 48,
  },
  notificationsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationsLoading: {
    fontSize: 16,
    textAlign: 'center',
  },
  notificationsEmpty: {
    fontSize: 16,
    textAlign: 'center',
  },
  notificationsList: {
    paddingVertical: 16,
  },
  notificationCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  notificationAvatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  notificationAvatarPlaceholder: {
    backgroundColor: '#e0e0e0',
  },
  notificationAvatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notificationStatus: {
    fontSize: 12,
  },
  statsContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '30%', // Adjust as needed for 3 columns
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%', // Adjust as needed for 2 columns
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  desktopStatCard: {
    width: '30%', // Adjust as needed for 3 columns
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  redirectButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  redirectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  debugSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  debugButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 