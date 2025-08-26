import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { useNavigationTracking } from '../src/hooks/useNavigationTracking';
import { usePlatform } from '../src/hooks/usePlatform';
import { useViewport } from '../src/hooks/useViewport';
import { MatchingService } from '../src/services/matching';
import type { OnlineStatus } from '../src/services/onlineStatusService';
import { OnlineStatusService } from '../src/services/onlineStatusService';
import { CallType, Match, MatchLevel } from '../src/types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function MatchesScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();
  const { isWeb } = usePlatform();
  const { isBreakpoint } = useViewport();
  const isDesktop = isBreakpoint.xl || isWeb;
  
  // Track navigation for referrer functionality
  useNavigationTracking();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineStatuses, setOnlineStatuses] = useState<OnlineStatus[]>([]);

  const loadMatches = useCallback(async () => {
    if (!user?.id) {
      setError('Please log in to view your matches');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const matchesData = await MatchingService.getMatches(user.id);
      setMatches(matchesData);
      
      // Start tracking online status for all matches
      if (matchesData.length > 0) {
        const userIds = matchesData.map(match => {
          const otherProfile = getOtherProfile(match);
          return otherProfile?.user_id;
        }).filter(Boolean) as string[];
        
        if (userIds.length > 0) {
          OnlineStatusService.getInstance().startPolling(
            userIds,
            (statuses) => setOnlineStatuses(statuses),
            30000 // Poll every 30 seconds
          );
        }
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
      setError(error instanceof Error ? error.message : 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMatches();
    
    // Cleanup online status polling on unmount
    return () => {
      OnlineStatusService.getInstance().stopAllPolling();
    };
  }, [loadMatches]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadMatches();
  }, [loadMatches]);

  const getMatchLevelText = (level: MatchLevel): string => {
    switch (level) {
      case MatchLevel.LEVEL_1:
        return 'Level 1 - Text Only';
      case MatchLevel.LEVEL_2:
        return 'Level 2 - Photos';
      case MatchLevel.LEVEL_3:
        return 'Level 3 - Voice Messages';
      case MatchLevel.LEVEL_4:
        return 'Level 4 - Voice Calls';
      default:
        return 'Level 1 - Text Only';
    }
  };

  const getMatchLevelColor = (level: MatchLevel): string => {
    switch (level) {
      case MatchLevel.LEVEL_1:
        return theme.colors.primary;
      case MatchLevel.LEVEL_2:
        return theme.colors.secondary;
      case MatchLevel.LEVEL_3:
        return theme.colors.accent;
      case MatchLevel.LEVEL_4:
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  const getOtherProfile = (match: Match) => {
    // Use the otherProfile if available, otherwise determine based on user IDs
    if (match.otherProfile) {
      return match.otherProfile;
    }
    
    const isUser1 = match.user1_id === user?.id;
    return isUser1 ? match.user2_profile : match.user1_profile;
  };

  const handleMatchPress = (match: Match) => {
    const otherProfile = getOtherProfile(match);
    if (otherProfile?.user_id) {
      // Navigate to user profile screen
              router.push(`/user-profile/${otherProfile.user_id}`);
    }
  };

  const handleVoiceCall = (match: Match) => {
    if (match.level >= MatchLevel.LEVEL_4) {
      Alert.alert(
        'Voice Call',
        'Voice call feature will be available soon!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Level 4 Required',
        'Voice calls require a Level 4 match. Keep chatting to unlock this feature!',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCallStart = (match: Match, callType: CallType) => {
    // Navigate to call screen
    router.push({
      pathname: '/voice-call' as any,
      params: {
        matchId: match.id,
        receiverId: getOtherProfile(match)?.user_id || '',
        callType: callType,
      }
    });
  };

  const handleMessagePress = (match: Match) => {
    // Navigate to individual chat screen with match ID
    router.push(`/chat/${match.id}`);
  };

  const handleUnmatch = async (match: Match) => {
    const otherProfile = getOtherProfile(match);
    
    Alert.alert(
      'Unmatch',
      `Are you sure you want to unmatch with ${otherProfile?.first_name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unmatch', 
          style: 'destructive',
          onPress: async () => {
            try {
              await MatchingService.unmatch(match.id);
              // Remove from local state
              setMatches(prev => prev.filter(m => m.id !== match.id));
              Alert.alert('Unmatched', `You have unmatched with ${otherProfile?.first_name}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to unmatch. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Categorize matches by type
  const categorizeMatches = () => {
    const regularMatches: Match[] = [];
    const superMatches: Match[] = [];

    matches.forEach(match => {
      if (match.level >= MatchLevel.LEVEL_4) {
        superMatches.push(match);
      } else {
        regularMatches.push(match);
      }
    });

    return { regularMatches, superMatches };
  };

  const renderProfileCard = ({ item: match }: { item: Match }) => {
    const otherProfile = getOtherProfile(match);
    
    if (!otherProfile) return null;

    const profilePhoto = otherProfile.photos?.[0] || 'https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=No+Photo';
    const isSuperMatch = match.level >= MatchLevel.LEVEL_4;
    
    // Get online status for this user
    const onlineStatus = onlineStatuses.find(status => status.userId === otherProfile.user_id);
    const isOnline = onlineStatus?.isOnline || false;

    return (
      <TouchableOpacity
        style={[
          styles.profileCard,
          { 
            width: isDesktop ? '18%' : '48%', // 2 columns for mobile
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.primary,
            marginRight: isDesktop ? getResponsiveSpacing('sm') : getResponsiveSpacing('xs'),
            marginBottom: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
          },
          isSuperMatch && {
            ...styles.superMatchCard,
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.primary,
          }
        ]} 
        onPress={() => handleMatchPress(match)}
        activeOpacity={0.7}
      >
        {/* Image Section */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: profilePhoto }}
            style={styles.profileImage}
            defaultSource={{ uri: 'https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=Loading' }}
          />
          
          {/* Online status indicator */}
          <View style={[
            styles.onlineIndicator, 
            {
              backgroundColor: isOnline ? theme.colors.success : theme.colors.disabled,
              width: isDesktop ? 16 : 12, // Increased from 12/8 to 16/12
              height: isDesktop ? 16 : 12, // Increased from 12/8 to 16/12
              borderRadius: isDesktop ? 8 : 6, // Adjusted radius for new size
              top: 6, // Adjusted positioning for larger size
              left: 6, // Adjusted positioning for larger size
            }
          ]} />
          
          {/* Super Match badge only for super matches */}
          {isSuperMatch && (
            <View style={[
              styles.matchTypeBadge,
              { 
                backgroundColor: theme.colors.primary,
                top: 4,
                right: 4,
                paddingHorizontal: isDesktop ? getResponsiveSpacing('xs') : 3,
                paddingVertical: isDesktop ? getResponsiveSpacing('xs') : 1,
              }
            ]}>
              <Text style={[
                styles.matchTypeText, 
                { 
                  color: 'white',
                  fontSize: isDesktop ? getResponsiveFontSize('xs') : 8,
                  fontWeight: '600'
                }
              ]}>
                Super
              </Text>
            </View>
          )}
        </View>
        
        {/* Divider Line */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        
        {/* Name Section */}
        <View style={styles.nameSection}>
          <Text style={[
            styles.profileName, 
            { 
              color: theme.colors.text,
              fontSize: isDesktop ? getResponsiveFontSize('md') : getResponsiveFontSize('xs'),
              fontWeight: '600'
            }
          ]}>
            {otherProfile.first_name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMatchSection = (title: string, matches: Match[], isSuperMatch: boolean) => {
    if (matches.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
                <Text style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontSize: isDesktop ? getResponsiveFontSize('lg') : getResponsiveFontSize('md'),
            marginBottom: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
            paddingHorizontal: isDesktop ? getResponsiveSpacing('sm') : getResponsiveSpacing('xs'),
          }
        ]}>
          {title} ({matches.length})
                </Text>
        <FlatList
          data={matches}
          renderItem={renderProfileCard}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 5 : 2} // 2 columns for mobile
          columnWrapperStyle={[
            styles.gridRow,
            { 
              justifyContent: 'flex-start', // Left align items
              paddingHorizontal: isDesktop ? getResponsiveSpacing('sm') : getResponsiveSpacing('xs'),
            }
                ]}
          contentContainerStyle={[
            styles.gridContainer,
            { 
              paddingBottom: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
              paddingHorizontal: isDesktop ? getResponsiveSpacing('sm') : getResponsiveSpacing('xs'),
            }
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
        </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, isDesktop && styles.desktopHeader]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[
            styles.title, 
            { color: theme.colors.text },
            isDesktop && { fontSize: getResponsiveFontSize('xxl') }
          ]}>
            Matches
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[
            styles.loadingText, 
            { color: theme.colors.text },
            isDesktop && { fontSize: getResponsiveFontSize('lg') }
          ]}>
            Loading your matches...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, isDesktop && styles.desktopHeader]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[
            styles.title, 
            { color: theme.colors.text },
            isDesktop && { fontSize: getResponsiveFontSize('xxl') }
          ]}>
            Matches
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadMatches}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { regularMatches, superMatches } = categorizeMatches();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.background,
        paddingHorizontal: isDesktop ? getResponsiveSpacing('md') : getResponsiveSpacing('sm'),
        paddingTop: isDesktop ? getResponsiveSpacing('sm') : getResponsiveSpacing('xs'),
      }
    ]}>
      <View style={[styles.header, isDesktop && styles.desktopHeader]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[
          styles.title, 
          { color: theme.colors.text },
          isDesktop && { fontSize: getResponsiveFontSize('xxl') }
        ]}>
          Matches ({matches.length})
        </Text>
        <TouchableOpacity onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[
            styles.emptyTitle, 
            { color: theme.colors.text },
            isDesktop && { fontSize: getResponsiveFontSize('xl') }
          ]}>
            No matches yet
          </Text>
          <Text style={[
            styles.emptyText, 
            { color: theme.colors.textSecondary },
            isDesktop && { fontSize: getResponsiveFontSize('md') }
          ]}>
            Start discovering and liking profiles to find your perfect match!
          </Text>
          <TouchableOpacity
            style={[
              styles.discoverButton, 
              { backgroundColor: theme.colors.primary },
              isDesktop && styles.desktopDiscoverButton
            ]}
            onPress={() => router.push('/discover')}
          >
            <Text style={[
              styles.discoverButtonText,
              isDesktop && { fontSize: getResponsiveFontSize('md') }
            ]}>
              Go to Discover
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.matchesContainer}
          contentContainerStyle={[
            styles.matchesList,
            isDesktop && styles.desktopMatchesList
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {renderMatchSection('Super Matches', superMatches, true)}
          {renderMatchSection('Regular Matches', regularMatches, false)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingTop: getResponsiveSpacing('sm'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    marginBottom: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  desktopHeader: {
    marginTop: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('lg'),
  },
  backButton: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    minHeight: 44, // Better touch target for mobile
    minWidth: 60, // Ensure button is wide enough
  },
  title: {
    fontSize: getResponsiveFontSize('xxl'),
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing('xl'),
  },
  loadingText: {
    fontSize: getResponsiveFontSize('lg'),
    textAlign: 'center',
    marginTop: getResponsiveSpacing('md'),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing('xl'),
  },
  errorTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  errorText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('lg'),
    lineHeight: getResponsiveFontSize('md') * 1.5,
  },
  retryButton: {
    paddingHorizontal: getResponsiveSpacing('xl'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing('xl'),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('xl'),
    lineHeight: getResponsiveFontSize('md') * 1.5,
  },
  discoverButton: {
    paddingHorizontal: getResponsiveSpacing('xl'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: 25,
  },
  desktopDiscoverButton: {
    paddingHorizontal: getResponsiveSpacing('xxl'),
    paddingVertical: getResponsiveSpacing('lg'),
  },
  discoverButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  matchesList: {
    paddingBottom: getResponsiveSpacing('lg'),
  },
  desktopMatchesList: {
    paddingBottom: getResponsiveSpacing('xl'),
  },
  matchCard: {
    marginBottom: getResponsiveSpacing('md'),
    padding: getResponsiveSpacing('lg'),
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  desktopMatchCard: {
    marginBottom: getResponsiveSpacing('lg'),
    marginHorizontal: getResponsiveSpacing('sm'),
    flex: 1,
  },
  clickableCard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  desktopMatchContent: {
    padding: getResponsiveSpacing('md'),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: getResponsiveSpacing('lg'),
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  desktopAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: 'white',
  },
  desktopOnlineIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
  matchInfo: {
    flex: 1,
    marginRight: getResponsiveSpacing('md'),
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing('sm'),
  },
  matchName: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    flex: 1,
  },
  viewProfileHint: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  matchLocation: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('xs'),
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing('sm'),
  },
  matchLevelContainer: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: 12,
  },
  matchLevel: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '600',
  },
  lastSeen: {
    fontSize: getResponsiveFontSize('xs'),
  },
  matchBio: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('md'),
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageButton: {
    // Theme colors will be applied inline
  },
  callButton: {
    // Theme colors will be applied inline
  },
  unmatchButton: {
    borderWidth: 1,
  },
  desktopActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize('md'),
  },
  unmatchButtonText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  profileCard: {
    width: '48%', // 2 columns for mobile (48% width)
    borderRadius: 16, // Larger border radius for modern look
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 3, // Slightly more elevation for better shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  superMatchCard: {
    // Theme colors will be applied inline
    elevation: 4, // More elevation for super matches
    shadowOpacity: 0.2,
  },
  profileImage: {
    width: '100%',
    height: '100%', // Fill the imageSection container
    resizeMode: 'cover',
  },
  profileInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', // Slightly more opaque for better readability
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 6, // Default padding for mobile
  },
  profileName: {
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    fontSize: getResponsiveFontSize('xs'), // Default to small font for mobile
  },
  matchTypeBadge: {
    position: 'absolute',
    borderRadius: 12, // Larger border radius
    top: 4, // Default positioning for mobile
    right: 4,
    paddingHorizontal: 3, // Default padding for mobile
    paddingVertical: 1,
  },
  matchTypeText: {
    fontWeight: '600',
    fontSize: 8, // Default font size for mobile
    color: 'white',
  },
  sectionContainer: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'), // Default margin for mobile
    paddingHorizontal: getResponsiveSpacing('xs'), // Default padding for mobile
  },
  gridRow: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Left align items
    alignItems: 'flex-start', // Align items to top
    marginBottom: getResponsiveSpacing('sm'), // Add bottom margin for better separation
  },
  gridContainer: {
    // Padding will be applied inline for responsive design
    paddingTop: getResponsiveSpacing('xs'), // Add top padding for better spacing
  },
  matchesContainer: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
    width: '100%',
    height: 120, // Increased height to fill most of card
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    marginBottom: getResponsiveSpacing('xs'), // Reduced margin for tighter layout
  },
  divider: {
    height: 1,
    marginVertical: getResponsiveSpacing('xs'), // Reduced vertical margins
  },
  nameSection: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingBottom: getResponsiveSpacing('xs'), // Reduced bottom padding
    paddingTop: getResponsiveSpacing('xs'), // Added top padding for balance
  },
}); 