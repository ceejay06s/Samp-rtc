import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Image, Modal, PanResponder, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { ListItem } from '../src/components/ui/ListItem';
import { IconNames, MaterialIcon } from '../src/components/ui/MaterialIcon';
import { usePlatform } from '../src/hooks/usePlatform';
import { useViewport } from '../src/hooks/useViewport';
import { DiscoveryFilters, MatchingService } from '../src/services/matching';
import { Profile } from '../src/types';
import { calculateAge } from '../src/utils/dateUtils';
import { formatLocationForDisplay } from '../src/utils/location';
import { useTheme } from '../src/utils/themes';

const { width, height } = Dimensions.get('window');


export default function DiscoverScreen() {
  const theme = useTheme();
  const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
  const { isAndroid, isIOS, isWeb } = usePlatform();
  const { width: viewportWidth } = useViewport();
  
  const isMobile = isAndroid || isIOS;
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Animation values for swipe gestures
  const [position] = useState(new Animated.ValueXY());
  const [opacity] = useState(new Animated.Value(1));
  const [scale] = useState(new Animated.Value(1));
  const [likeOpacity] = useState(new Animated.Value(0));
  const [passOpacity] = useState(new Animated.Value(0));

  // Default filters based on current user's preferences
  const getDefaultFilters = useCallback((): DiscoveryFilters => {
    if (!currentUserProfile) {
      return {
        ageRange: [18, 100] as [number, number],
        maxDistance: 50,
        gender: ['male', 'female'],
      };
    }

    return {
      ageRange: [currentUserProfile.min_age, currentUserProfile.max_age] as [number, number],
      maxDistance: currentUserProfile.max_distance,
      gender: currentUserProfile.looking_for,
      interests: currentUserProfile.interests,
    };
  }, [currentUserProfile]);

  // Reset animation values
  const resetPosition = useCallback(() => {
    position.setValue({ x: 0, y: 0 });
    opacity.setValue(1);
    scale.setValue(1);
    likeOpacity.setValue(0);
    passOpacity.setValue(0);
  }, [position, opacity, scale, likeOpacity, passOpacity]);

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !processingAction && !showDetailModal,
    onMoveShouldSetPanResponder: (_, gesture) => {
      // Only activate pan responder if there's significant movement
      const moveThreshold = 10;
      return !processingAction && !showDetailModal && 
        (Math.abs(gesture.dx) > moveThreshold || Math.abs(gesture.dy) > moveThreshold);
    },
    
    onPanResponderGrant: () => {
      position.setOffset({
        x: (position.x as any)._value,
        y: (position.y as any)._value,
      });
    },
    
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
      
      // Show like/pass indicators based on swipe direction
      const swipeThreshold = 120;
      if (gesture.dx > swipeThreshold) {
        likeOpacity.setValue(Math.min(1, gesture.dx / swipeThreshold - 1));
        passOpacity.setValue(0);
      } else if (gesture.dx < -swipeThreshold) {
        passOpacity.setValue(Math.min(1, Math.abs(gesture.dx) / swipeThreshold - 1));
        likeOpacity.setValue(0);
      } else {
        likeOpacity.setValue(0);
        passOpacity.setValue(0);
      }
    },
    
    onPanResponderRelease: (_, gesture) => {
      position.flattenOffset();
      
      const swipeThreshold = 120;
      const velocityThreshold = 0.3;
      
      if (gesture.dx > swipeThreshold || gesture.vx > velocityThreshold) {
        // Swipe right - like
        animateSwipeOut('right', handleLike);
      } else if (gesture.dx < -swipeThreshold || gesture.vx < -velocityThreshold) {
        // Swipe left - pass
        animateSwipeOut('left', handlePass);
      } else {
        // Return to center
        Animated.parallel([
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.timing(likeOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(passOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      }
    },
  });

  const animateSwipeOut = (direction: 'left' | 'right', callback: () => void) => {
    const toValue = direction === 'right' ? width : -width;
    
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: toValue, y: 0 },
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      callback();
      resetPosition();
    });
  };

  const loadProfiles = useCallback(async (isRefresh = false) => {
    if (!user) {
      setError('Please log in to start discovering');
      setLoading(false);
      return;
    }

    if (!currentUserProfile) {
      setError('Please complete your profile to start discovering');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filters = getDefaultFilters();
      const discoveryProfiles = await MatchingService.getDiscoveryProfiles(
        user.id,
        filters,
        20
      );

      setProfiles(discoveryProfiles);
      setCurrentIndex(0);
      setCurrentPhotoIndex(0);
      resetPosition();
    } catch (error) {
      console.error('Failed to load profiles:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, currentUserProfile, getDefaultFilters, resetPosition]);

  const onRefresh = useCallback(() => {
    loadProfiles(true);
  }, [loadProfiles]);

  useEffect(() => {
    if (!authLoading) {
      loadProfiles();
    }
  }, [loadProfiles, authLoading]);

  const handleLike = useCallback(async () => {
    if (currentIndex >= profiles.length || processingAction) return;
    
    try {
      setProcessingAction(true);
      const targetProfile = profiles[currentIndex];
      
      const result = await MatchingService.likeProfile({
        targetUserId: targetProfile.user_id,
        isSuperLike: false,
      });
      
      if (result.isMatch) {
        Alert.alert(
          "It's a Match! 🎉",
          `You and ${targetProfile.first_name} liked each other!`,
          [
            { text: 'Keep Swiping', style: 'default' },
            { 
              text: 'View Match', 
              onPress: () => router.push('/matches') 
            }
          ]
        );
      }
      
      setCurrentIndex(prev => prev + 1);
      setCurrentPhotoIndex(0);
    } catch (error) {
      console.error('Failed to like profile:', error);
      Alert.alert('Error', 'Failed to like profile. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  }, [currentIndex, profiles, processingAction]);

  const handlePass = useCallback(() => {
    if (processingAction) return;
    setCurrentIndex(prev => prev + 1);
    setCurrentPhotoIndex(0);
    setProcessingAction(false);
  }, [processingAction]);

  const handleSuperLike = useCallback(async () => {
    if (currentIndex >= profiles.length || processingAction) return;
    
    try {
      setProcessingAction(true);
      const targetProfile = profiles[currentIndex];
      
      const result = await MatchingService.likeProfile({
        targetUserId: targetProfile.user_id,
        isSuperLike: true,
      });
      
      if (result.isMatch) {
        Alert.alert(
          "Super Match! ⭐",
          `You super liked ${targetProfile.first_name} and they liked you back!`,
          [
            { text: 'Keep Swiping', style: 'default' },
            { 
              text: 'View Match', 
              onPress: () => router.push('/matches') 
            }
          ]
        );
      } else {
        Alert.alert(
          "Super Like Sent! ⭐",
          `${targetProfile.first_name} will be notified of your super like!`
        );
      }
      
      setCurrentIndex(prev => prev + 1);
      setCurrentPhotoIndex(0);
    } catch (error) {
      console.error('Failed to super like profile:', error);
      Alert.alert('Error', 'Failed to send super like. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  }, [currentIndex, profiles, processingAction]);

  const handlePhotoNavigation = (direction: 'next' | 'prev') => {
    if (!displayedProfile?.photos) return;
    
    const newIndex = direction === 'next' 
      ? (currentPhotoIndex + 1) % displayedProfile.photos.length
      : (currentPhotoIndex - 1 + displayedProfile.photos.length) % displayedProfile.photos.length;
    
    setCurrentPhotoIndex(newIndex);
  };

  const handleProfileClick = () => {
    console.log('Profile clicked:', displayedProfile?.user_id);
    if (displayedProfile?.user_id) {
              router.push(`/user-profile/${displayedProfile.user_id}`);
    }
  };

  const displayedProfile = profiles[currentIndex];

  // Auth loading state
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          <View style={{ width: 50 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your profile...
          </Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          <View style={{ width: 50 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Finding amazing people for you...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          <View style={{ width: 50 }} />
        </View>
        
        <ListItem style={styles.errorCard} padding="small">
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Button
            title="Try Again"
            onPress={() => loadProfiles()}
            variant="primary"
            style={{ marginTop: theme.spacing.lg }}
          />
        </ListItem>
      </View>
    );
  }

  // No more profiles state
  if (!displayedProfile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          <View style={{ width: 50 }} />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ListItem style={styles.noMoreCard} padding="small">
            <Text style={[styles.noMoreTitle, { color: theme.colors.text }]}>
              No more profiles to show
            </Text>
            <Text style={[styles.noMoreText, { color: theme.colors.textSecondary }]}>
              Check back later for new matches or adjust your preferences!
            </Text>
            <View style={styles.noMoreActions}>
              <Button
                title="Refresh"
                onPress={onRefresh}
                variant="primary"
                style={{ marginRight: theme.spacing.md }}
              />
              <Button
                title="Preferences"
                onPress={() => router.push('/preferences')}
                variant="secondary"
              />
            </View>
          </ListItem>
        </ScrollView>
      </View>
    );
  }

  const currentPhoto = displayedProfile.photos?.[currentPhotoIndex] || 'https://via.placeholder.com/400x600/FF6B9D/FFFFFF?text=No+Photo';
  const hasMultiplePhotos = displayedProfile.photos && displayedProfile.photos.length > 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
        <TouchableOpacity onPress={() => router.push('/preferences')}>
          <MaterialIcon name={IconNames.settings} size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileContainer}>
        {/* Swipe indicators */}
        <Animated.View style={[styles.swipeIndicator, styles.likeIndicator, { opacity: likeOpacity }]}>
          <Text style={styles.swipeIndicatorText}>LIKE</Text>
        </Animated.View>
        
        <Animated.View style={[styles.swipeIndicator, styles.passIndicator, { opacity: passOpacity }]}>
          <Text style={styles.swipeIndicatorText}>PASS</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.profileCardContainer,
            {
              transform: [...position.getTranslateTransform()],
              opacity,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            onPress={handleProfileClick}
            activeOpacity={0.9}
            delayPressIn={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ 
              width: '100%',
              // Add subtle visual feedback for mobile
              ...(isMobile && {
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              })
            }}
          >
            <ListItem style={[styles.profileCard, { 
            maxWidth: isMobile ? '100%' : Math.min(400, viewportWidth * 0.4),
            alignSelf: 'center'
            }]} padding="small">
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: currentPhoto }}
                style={styles.profileImage}
                resizeMode="cover"
              />
              
              {/* Photo navigation dots */}
              {hasMultiplePhotos && (
                <View style={styles.photoIndicators}>
                  {displayedProfile.photos!.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.photoIndicator,
                        {
                          backgroundColor: index === currentPhotoIndex 
                            ? 'white' 
                            : 'rgba(255, 255, 255, 0.4)'
                        }
                      ]}
                    />
                  ))}
                </View>
              )}
              
              {/* Photo navigation areas */}
              {hasMultiplePhotos && (
                <>
                  <TouchableOpacity
                    style={[styles.photoNavArea, styles.photoNavLeft]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePhotoNavigation('prev');
                      }}
                    activeOpacity={0.7}
                  />
                  <TouchableOpacity
                    style={[styles.photoNavArea, styles.photoNavRight]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePhotoNavigation('next');
                      }}
                    activeOpacity={0.7}
                  />
                </>
              )}
              
              {/* Profile info button */}
              <TouchableOpacity
                style={styles.infoButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowDetailModal(true);
                  }}
              >
                <MaterialIcon name={IconNames.info} size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <View style={styles.profileHeader}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {displayedProfile.first_name}, {calculateAge(displayedProfile.birthdate)}
                </Text>
                {displayedProfile.is_online && (
                  <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success }]} />
                )}
                  {isMobile && (
                    <MaterialIcon 
                      name={IconNames.forward} 
                      size={16} 
                      color={theme.colors.textSecondary} 
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
              </View>
              
              <Text style={[styles.profileLocation, { color: theme.colors.textSecondary }]}>
                <MaterialIcon name={IconNames.location} size={16} color={theme.colors.textSecondary} /> {formatLocationForDisplay(displayedProfile.location, 'city-state')}
              </Text>
              
              {displayedProfile.bio && (
                <Text 
                  style={[styles.profileBio, { color: theme.colors.text }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {displayedProfile.bio}
                </Text>
              )}
              
              {displayedProfile.interests && displayedProfile.interests.length > 0 && (
                <View style={styles.interestsContainer}>
                  {displayedProfile.interests.slice(0, 3).map((interest, index) => (
                    <View
                      key={index}
                      style={[styles.interestTag, { backgroundColor: theme.colors.primary }]}
                    >
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                  {displayedProfile.interests.length > 3 && (
                    <Text style={[styles.moreInterests, { color: theme.colors.textSecondary }]}>
                      +{displayedProfile.interests.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </View>
            </ListItem>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.passButton]} 
          onPress={() => animateSwipeOut('left', handlePass)}
          disabled={processingAction}
        >
          <Text style={styles.passButtonText}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={handleSuperLike}
          disabled={processingAction}
        >
          <Text style={styles.superLikeText}>⭐</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => animateSwipeOut('right', handleLike)}
          disabled={processingAction}
        >
          <Text style={styles.likeButtonText}>♥</Text>
        </TouchableOpacity>
      </View>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Image
              source={{ uri: currentPhoto }}
              style={styles.modalImage}
              resizeMode="cover"
            />
            
            <View style={styles.modalInfo}>
              <Text style={[styles.modalName, { color: theme.colors.text }]}>
                {displayedProfile.first_name}, {calculateAge(displayedProfile.birthdate)}
              </Text>
              
              <Text style={[styles.modalLocation, { color: theme.colors.textSecondary }]}>
                <MaterialIcon name={IconNames.location} size={16} color={theme.colors.textSecondary} /> {formatLocationForDisplay(displayedProfile.location, 'city-state')}
              </Text>
              
              {displayedProfile.bio && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>About</Text>
                  <Text style={[styles.modalBio, { color: theme.colors.text }]}>
                    {displayedProfile.bio}
                  </Text>
                </View>
              )}
              
              {displayedProfile.interests && displayedProfile.interests.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>Interests</Text>
                  <View style={styles.modalInterests}>
                    {displayedProfile.interests.map((interest, index) => (
                      <View
                        key={index}
                        style={[styles.modalInterestTag, { backgroundColor: theme.colors.primary }]}
                      >
                        <Text style={styles.modalInterestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {processingAction && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  noMoreCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  noMoreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noMoreText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  noMoreActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileCardContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    width: '100%',
    maxWidth: 400,
    height: Math.min(height * 0.68, height - 200), // Ensure card doesn't exceed available space
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '72%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  profileInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  profileLocation: {
    fontSize: 14,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  interestTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  interestText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  moreInterests: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  passButton: {
    backgroundColor: '#6B7280',
  },
  passButtonText: {
    fontSize: 28,
    color: 'white',
  },
  superLikeButton: {
    backgroundColor: '#08D9D6',
  },
  superLikeText: {
    fontSize: 28,
    color: 'white',
  },
  likeButton: {
    backgroundColor: '#FF2E63',
  },
  likeButtonText: {
    fontSize: 28,
    color: 'white',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12,
  },
  likeIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)', // Green for like with transparency
    top: 20,
  },
  passIndicator: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)', // Red for pass with transparency
    bottom: 20,
  },
  swipeIndicatorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '72%',
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    width: '100%',
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  photoNavArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNavLeft: {
    left: 0,
  },
  photoNavRight: {
    right: 0,
  },
  infoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  infoButtonText: {
    fontSize: 20,
    color: 'white',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  modalCloseButton: {
    fontSize: 18,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: height * 0.4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalInfo: {
    padding: 20,
  },
  modalName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalLocation: {
    fontSize: 18,
    marginBottom: 15,
  },
  modalSection: {
    marginBottom: 15,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalBio: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalInterestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalInterestText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 