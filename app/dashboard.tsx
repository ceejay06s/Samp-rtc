import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui';
import { Card } from '../src/components/ui/Card';
import { IconNames, MaterialIcon } from '../src/components/ui/MaterialIcon';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { MatchingService } from '../src/services/matching';
import { Profile } from '../src/types';
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
  const { isWeb: isWebPlatform } = usePlatform();
  const { signOut, user } = useAuth();
  const safeArea = getSafeAreaInsets();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser();
  const isTablet = isBreakpoint.lg || isBreakpoint.md;
  const isMobile = isMobileBrowser() || !isWeb();

  // Notifications state
  const [activeMatches, setActiveMatches] = useState<Profile[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      if (!user?.id) return;
      setLoadingMatches(true);
      try {
        const matches = await MatchingService.getMatches(user.id);
        // Extract the other user's profile from each match
        const profiles = matches
          .map((m) => m.otherProfile)
          .filter(Boolean) as Profile[];
        setActiveMatches(profiles);
      } catch (e) {
        setActiveMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    }
    fetchMatches();
  }, [user?.id]);

  // Helper function to show alerts that work on both web and mobile
  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWebPlatform) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleSignOut = async () => {
    // Use web-compatible confirmation for all platforms
    if (isWebPlatform) {
      WebAlert.showConfirmation(
        'Sign Out',
        'Are you sure you want to sign out?',
        async () => {
          try {
            await signOut();
            router.replace('/login');
          } catch (error) {
            console.error('Sign out error:', error);
            showAlert('Error', 'Failed to sign out. Please try again.');
          }
        }
      );
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

  // Carousel items for auto-scrolling
  const carouselItems = [
    {
      id: '1',
      content: (
        <Card style={[
          styles.carouselCard, 
          isDesktop && styles.desktopCarouselCard,
          { backgroundColor: theme.colors.surface }
        ]}>
          <View style={[styles.carouselContent, isDesktop && styles.desktopCarouselContent]}>
            <MaterialIcon 
              name={IconNames.matches} 
              size={isDesktop ? 32 : 24} 
              color={theme.colors.primary} 
            />
            <Text style={[
              styles.carouselTitle, 
              isDesktop && styles.desktopCarouselTitle,
              { color: theme.colors.text }
            ]}>
              New Matches Available!
            </Text>
            <Text style={[
              styles.carouselText, 
              isDesktop && styles.desktopCarouselText,
              { color: theme.colors.textSecondary }
            ]}>
              Discover 5 new profiles that match your preferences
            </Text>
          </View>
          <View style={[styles.carouselButtonWrapper, isDesktop && styles.desktopCarouselButtonWrapper]}>
            <TouchableOpacity
              style={[
                styles.carouselButton, 
                isDesktop && styles.desktopCarouselButton,
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => router.push('/discover')}
            >
              <Text style={[
                styles.carouselButtonText, 
                isDesktop && styles.desktopCarouselButtonText,
                { color: 'white' }
              ]}>
                Start Discovering
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      ),
    },
    {
      id: '2',
      content: (
        <Card style={[
          styles.carouselCard, 
          isDesktop && styles.desktopCarouselCard,
          { backgroundColor: theme.colors.surface }
        ]}>
          <View style={[styles.carouselContent, isDesktop && styles.desktopCarouselContent]}>
            <MaterialIcon 
              name={IconNames.messages} 
              size={isDesktop ? 32 : 24} 
              color={theme.colors.secondary} 
            />
            <Text style={[
              styles.carouselTitle, 
              isDesktop && styles.desktopCarouselTitle,
              { color: theme.colors.text }
            ]}>
              Unread Messages
            </Text>
            <Text style={[
              styles.carouselText, 
              isDesktop && styles.desktopCarouselText,
              { color: theme.colors.textSecondary }
            ]}>
              You have 3 new messages waiting for you
            </Text>
          </View>
          <View style={[styles.carouselButtonWrapper, isDesktop && styles.desktopCarouselButtonWrapper]}>
            <TouchableOpacity
              style={[
                styles.carouselButton, 
                isDesktop && styles.desktopCarouselButton,
                { backgroundColor: theme.colors.secondary }
              ]}
              onPress={() => router.push('/messages')}
            >
              <Text style={[
                styles.carouselButtonText, 
                isDesktop && styles.desktopCarouselButtonText,
                { color: 'white' }
              ]}>
                View Messages
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      ),
    },
    {
      id: '3',
      content: (
        <Card style={[
          styles.carouselCard, 
          isDesktop && styles.desktopCarouselCard,
          { backgroundColor: theme.colors.surface }
        ]}>
          <View style={[styles.carouselContent, isDesktop && styles.desktopCarouselContent]}>
            <MaterialIcon name={IconNames.discover} size={24} color={theme.colors.primary} />
            <Text style={[
              styles.carouselTitle, 
              isDesktop && styles.desktopCarouselTitle,
              { color: theme.colors.text }
            ]}>
              Dating Tips
            </Text>
            <Text style={[
              styles.carouselText, 
              isDesktop && styles.desktopCarouselText,
              { color: theme.colors.textSecondary }
            ]}>
              Be authentic and ask engaging questions to build better connections
            </Text>
          </View>
          <View style={[styles.carouselButtonWrapper, isDesktop && styles.desktopCarouselButtonWrapper]}>
            <TouchableOpacity
              style={[
                styles.carouselButton, 
                isDesktop && styles.desktopCarouselButton,
                { backgroundColor: theme.colors.accent }
              ]}
              onPress={() => showAlert('Tip', 'Great conversations start with genuine curiosity!')}
            >
              <Text style={[
                styles.carouselButtonText, 
                isDesktop && styles.desktopCarouselButtonText,
                { color: 'white' }
              ]}>
                Learn More
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      ),
    },
    {
      id: '4',
      content: (
        <Card style={[
          styles.carouselCard, 
          isDesktop && styles.desktopCarouselCard,
          { backgroundColor: theme.colors.surface }
        ]}>
          <View style={[styles.carouselContent, isDesktop && styles.desktopCarouselContent]}>
            <MaterialIcon name={IconNames.celebration} size={24} color={theme.colors.success} />
            <Text style={[
              styles.carouselTitle, 
              isDesktop && styles.desktopCarouselTitle,
              { color: theme.colors.text }
            ]}>
              Profile Boost
            </Text>
            <Text style={[
              styles.carouselText, 
              isDesktop && styles.desktopCarouselText,
              { color: theme.colors.textSecondary }
            ]}>
              Update your profile photos to get 50% more views
            </Text>
          </View>
          <View style={[styles.carouselButtonWrapper, isDesktop && styles.desktopCarouselButtonWrapper]}>
            <TouchableOpacity
              style={[
                styles.carouselButton, 
                isDesktop && styles.desktopCarouselButton,
                { backgroundColor: theme.colors.success }
              ]}
              onPress={() => router.push('/profile')}
            >
              <Text style={[
                styles.carouselButtonText, 
                isDesktop && styles.desktopCarouselButtonText,
                { color: 'white' }
              ]}>
                Update Profile
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      ),
    },
  ];

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
  carouselContainer: {
    marginBottom: getResponsiveSpacing('xxl'),
  },
  carousel: {
    width: '100%',
    height: 180, // Default height, will be overridden by AutoScrollCarousel
    borderRadius: getResponsiveSpacing('md'),
    backgroundColor: 'transparent',
  },
  desktopCarousel: {
    height: 240,
    borderRadius: getResponsiveSpacing('lg'),
  },
  carouselCard: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: getResponsiveSpacing('lg'),
    marginHorizontal: 0, // Remove horizontal margin since carousel handles padding
    minHeight: 140,
    borderWidth: 1,
    borderColor: 'transparent',
    width: '100%', // Ensure full width
    overflow: 'hidden', // Prevent overflow
    backgroundColor: 'transparent',
    padding: 0, // Remove card padding, use content wrapper instead
  },
  desktopCarouselCard: {
    minHeight: 200,
    borderRadius: getResponsiveSpacing('xl'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 0,
    overflow: 'hidden', // Prevent overflow
    backgroundColor: 'transparent',
    padding: 0, // Remove card padding, use content wrapper instead
  },
  carouselContent: {
    alignItems: 'center',
    width: '100%',
    paddingTop: getResponsiveSpacing('xl'),
    paddingBottom: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  desktopCarouselContent: {
    alignItems: 'center',
    width: '100%',
    paddingTop: getResponsiveSpacing('xxl'),
    paddingBottom: getResponsiveSpacing('lg'),
    paddingHorizontal: getResponsiveSpacing('xxl'),
    maxWidth: 600,
    alignSelf: 'center',
  },
  carouselIcon: {
    fontSize: getResponsiveFontSize('xxl'),
    marginBottom: getResponsiveSpacing('md'),
  },
  desktopCarouselIcon: {
    fontSize: getResponsiveFontSize('xxl') * 1.5,
    marginBottom: getResponsiveSpacing('md'),
  },
  carouselTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize('lg') * 1.2,
  },
  desktopCarouselTitle: {
    fontSize: getResponsiveFontSize('xxl'),
    marginBottom: getResponsiveSpacing('sm'),
    lineHeight: getResponsiveFontSize('xxl') * 1.2,
    fontWeight: '800',
    textAlign: 'center',
  },
  carouselText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
    opacity: 0.8,
    paddingHorizontal: getResponsiveSpacing('xs'),
  },
  desktopCarouselText: {
    fontSize: getResponsiveFontSize('lg'),
    marginBottom: 0,
    lineHeight: getResponsiveFontSize('lg') * 1.4,
    paddingHorizontal: getResponsiveSpacing('md'),
    opacity: 0.9,
    maxWidth: '80%',
    textAlign: 'center',
    alignSelf: 'center',
  },
  carouselButtonWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('xl'),
  },
  desktopCarouselButtonWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: getResponsiveSpacing('lg'),
    marginBottom: getResponsiveSpacing('xxl'),
  },
  carouselButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
    minWidth: 80,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing('sm'),
    alignSelf: 'center',
    width: 'auto', // Ensure button doesn't stretch
  },
  desktopCarouselButton: {
    paddingVertical: getResponsiveSpacing('lg'),
    paddingHorizontal: getResponsiveSpacing('xl'),
    borderRadius: getResponsiveSpacing('lg'),
    minWidth: 140,
    maxWidth: '80%', // Prevent overflow
    marginTop: getResponsiveSpacing('lg'),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'center',
    width: 'auto', // Ensure button doesn't stretch
  },
  carouselButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    textAlign: 'center',
  },
  desktopCarouselButtonText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notificationsSection: {
    marginBottom: getResponsiveSpacing('xxl'),
  },
  notificationsList: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSpacing('md'),
    minWidth: 100,
    maxWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationAvatarWrapper: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  notificationAvatarPlaceholder: {
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationAvatarInitial: {
    fontSize: 24,
    color: '#888',
    fontWeight: 'bold',
  },
  notificationName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
    color: '#222',
    textAlign: 'center',
  },
  notificationStatus: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  notificationsLoading: {
    color: '#888',
    fontSize: 14,
    paddingVertical: getResponsiveSpacing('sm'),
  },
  notificationsEmpty: {
    color: '#888',
    fontSize: 14,
    paddingVertical: getResponsiveSpacing('sm'),
  },
}); 