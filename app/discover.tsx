import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { useTheme } from '../src/utils/themes';

const { width, height } = Dimensions.get('window');

export default function DiscoverScreen() {
  const theme = useTheme();
  const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
  const { isAndroid, isIOS, isWeb } = usePlatform();
  const { width: viewportWidth } = useViewport();
  
  // Simple mobile detection
  const isMobile = isAndroid || isIOS || viewportWidth < 768;
  
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
      ageRange: [currentUserProfile.min_age || 18, currentUserProfile.max_age || 100] as [number, number],
      maxDistance: currentUserProfile.max_distance || 50,
      gender: currentUserProfile.looking_for || ['male', 'female'],
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
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
          }),
        ]).start();
      }
    },
  });

  // Load profiles
  const loadProfiles = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const filters = getDefaultFilters();
      const loadedProfiles = await MatchingService.getDiscoveryProfiles(user.id, filters, 20);
      
      if (loadedProfiles.length === 0) {
        setError('No more profiles to show right now. Check back later!');
      } else {
        setProfiles(loadedProfiles);
        setCurrentIndex(0);
        setCurrentPhotoIndex(0);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, getDefaultFilters]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  }, [loadProfiles]);

  // Load profiles on mount
  useEffect(() => {
    if (!authLoading && user?.id) {
      loadProfiles();
    }
  }, [authLoading, user?.id, loadProfiles]);

  const displayedProfile = profiles[currentIndex];

  // Handle like action
  const handleLike = useCallback(async () => {
    if (!displayedProfile || processingAction) return;
    
    setProcessingAction(true);
    try {
      await MatchingService.likeProfile({
        targetUserId: displayedProfile.user_id,
        isSuperLike: false,
      });
      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentPhotoIndex(0);
        resetPosition();
      } else {
        // No more profiles
        setProfiles([]);
      }
    } catch (error) {
      console.error('Error liking profile:', error);
      Alert.alert('Error', 'Failed to like profile. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  }, [displayedProfile, processingAction, currentIndex, profiles.length, resetPosition]);

  // Handle pass action
  const handlePass = useCallback(async () => {
    if (!displayedProfile || processingAction) return;
    
    setProcessingAction(true);
    try {
      // For pass, just move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentPhotoIndex(0);
        resetPosition();
      } else {
        // No more profiles
        setProfiles([]);
      }
    } catch (error) {
      console.error('Error passing profile:', error);
      Alert.alert('Error', 'Failed to pass profile. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  }, [displayedProfile, processingAction, currentIndex, profiles.length, resetPosition]);

  // Handle super like
  const handleSuperLike = useCallback(async () => {
    if (!displayedProfile || processingAction) return;
    
    setProcessingAction(true);
    try {
      await MatchingService.likeProfile({
        targetUserId: displayedProfile.user_id,
        isSuperLike: true,
      });
      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentPhotoIndex(0);
        resetPosition();
      } else {
        // No more profiles
        setProfiles([]);
      }
    } catch (error) {
      console.error('Error super liking profile:', error);
      Alert.alert('Error', 'Failed to super like profile. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  }, [displayedProfile, processingAction, currentIndex, profiles.length, resetPosition]);

  // Animate swipe out
  const animateSwipeOut = useCallback((direction: 'left' | 'right', callback: () => void) => {
    const targetX = direction === 'right' ? width * 1.5 : -width * 1.5;
    
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: targetX, y: 0 },
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      callback();
    });
  }, [position, opacity, scale, width]);

  // Handle photo navigation
  const handlePhotoNavigation = useCallback((direction: 'prev' | 'next') => {
    if (!displayedProfile?.photos || displayedProfile.photos.length <= 1) return;
    
    if (direction === 'prev') {
      setCurrentPhotoIndex(prev => 
        prev === 0 ? displayedProfile.photos!.length - 1 : prev - 1
      );
    } else {
      setCurrentPhotoIndex(prev => 
        prev === displayedProfile.photos!.length - 1 ? 0 : prev + 1
      );
    }
  }, [displayedProfile?.photos]);

  // Handle profile click
  const handleProfileClick = useCallback(() => {
    setShowDetailModal(true);
  }, []);

  // Simple card dimensions for mobile
  const getCardDimensions = () => {
    if (isMobile) {
      return {
        cardWidth: width - 20, // 10px margin on each side
        cardHeight: height * 0.7, // 70% of screen height
        imageHeight: 0.7, // 70% of card height for image
        padding: 16,
        fontSize: {
          name: 20,
          bio: 14,
          interest: 12,
        },
      };
    }
    
    return {
      cardWidth: Math.min(400, viewportWidth * 0.4),
      cardHeight: Math.min(height * 0.68, height - 200),
      imageHeight: 0.72,
      padding: 16,
      fontSize: {
        name: 22,
        bio: 14,
        interest: 12,
      },
    };
  };

  const cardDimensions = getCardDimensions();

  // Auth loading state
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          </View>
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
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          </View>
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
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          </View>
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
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
          </View>
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

  const currentPhoto = (displayedProfile.photos && displayedProfile.photos.length > 0) 
    ? displayedProfile.photos[currentPhotoIndex] 
    : 'https://via.placeholder.com/400x600/FF6B9D/FFFFFF?text=No+Photo';
  const hasMultiplePhotos = displayedProfile.photos && displayedProfile.photos.length > 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
        </View>
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
            style={{ width: '100%' }}
          >
            <View style={[styles.profileCard, { 
              width: cardDimensions.cardWidth,
              height: cardDimensions.cardHeight,
            }]}>
              
              {/* Profile Image */}
              <View style={[styles.imageContainer, { height: cardDimensions.cardHeight * cardDimensions.imageHeight }]}>
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
              
              {/* Profile Info */}
              <View style={[styles.profileInfo, { padding: cardDimensions.padding }]}>
                <View style={styles.profileHeader}>
                  <Text style={[styles.profileName, { 
                    color: theme.colors.text,
                    fontSize: cardDimensions.fontSize.name 
                  }]}>
                    {displayedProfile.first_name}, {calculateAge(displayedProfile.birthdate)}
                  </Text>
                  {displayedProfile.is_online && (
                    <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success }]} />
                  )}
                </View>
                
                {displayedProfile.bio && (
                  <Text 
                    style={[styles.profileBio, { 
                      color: theme.colors.text,
                      fontSize: cardDimensions.fontSize.bio
                    }]}
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
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Action Buttons */}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 30, // Increase top padding
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    marginBottom: 20, // Increase bottom margin
    paddingHorizontal: 16, // Add horizontal padding
    zIndex: 1000, // Ensure header is above other elements
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    marginTop: 20, // Add top margin to separate from header
    marginBottom: 10,
    paddingTop: 20, // Add padding to ensure separation
  },
  profileCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, // Add top margin for additional separation
    zIndex: 1, // Lower z-index than header
  },
  profileCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  profileInfo: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontWeight: 'bold',
    flex: 1,
    fontSize: 20,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  profileBio: {
    lineHeight: 20,
    marginBottom: 12,
    fontSize: 14,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  moreInterests: {
    fontStyle: 'italic',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    top: 20,
  },
  passIndicator: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
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