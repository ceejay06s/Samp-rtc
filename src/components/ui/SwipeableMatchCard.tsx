import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { CallType, Match, MatchLevel } from '../../types';
import { calculateAge } from '../../utils/dateUtils';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { ListItem } from './ListItem';
import { IconNames, MaterialIcon } from './MaterialIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width
const MAX_SWIPE_DISTANCE = SCREEN_WIDTH * 0.4; // 40% of screen width
const MIN_SWIPE_VELOCITY = 0.5; // Minimum velocity to trigger action

interface SwipeableMatchCardProps {
  match: Match;
  otherProfile: any;
  onViewProfile: () => void;
  onMessagePress: () => void;
  onUnmatch: () => void;
  onCallStart: (match: Match, callType: CallType) => void;
  currentUserId: string;
}

const getMatchLevelText = (level: MatchLevel): string => {
  switch (level) {
    case MatchLevel.LEVEL_1: return 'Level 1';
    case MatchLevel.LEVEL_2: return 'Level 2';
    case MatchLevel.LEVEL_3: return 'Level 3';
    case MatchLevel.LEVEL_4: return 'Level 4';
    default: return 'New Match';
  }
};

const getMatchLevelColor = (level: MatchLevel): string => {
  switch (level) {
    case MatchLevel.LEVEL_1: return '#FF6B9D';
    case MatchLevel.LEVEL_2: return '#4ECDC4';
    case MatchLevel.LEVEL_3: return '#45B7D1';
    case MatchLevel.LEVEL_4: return '#96CEB4';
    default: return '#FF6B9D';
  }
};

export const SwipeableMatchCard: React.FC<SwipeableMatchCardProps> = ({
  match,
  otherProfile,
  onViewProfile,
  onMessagePress,
  onUnmatch,
  onCallStart,
  currentUserId,
}) => {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isOnline = otherProfile.is_online;
  const lastSeen = otherProfile.last_seen;
  const age = otherProfile.birthdate ? calculateAge(otherProfile.birthdate) : null;
  const location = otherProfile.location ? 
    `${otherProfile.location.city || ''}${otherProfile.location.state ? `, ${otherProfile.location.state}` : ''}`.trim() : 
    null;
  const profilePhoto = otherProfile.photos?.[0] || 'https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=No+Photo';

  // Improved gesture handling with PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(0);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        const newValue = Math.max(-MAX_SWIPE_DISTANCE, Math.min(MAX_SWIPE_DISTANCE, dx));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        translateX.flattenOffset();
        
        // Determine if swipe should trigger action
        const shouldTriggerAction = 
          Math.abs(dx) > SWIPE_THRESHOLD || 
          (Math.abs(vx) > MIN_SWIPE_VELOCITY && Math.abs(dx) > SWIPE_THRESHOLD * 0.5);
        
        if (shouldTriggerAction) {
          setIsAnimating(true);
          
          if (dx > 0) {
            // Swipe right - Unmatch
            Animated.timing(translateX, {
              toValue: SCREEN_WIDTH,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              onUnmatch();
              translateX.setValue(0);
              setIsAnimating(false);
            });
          } else {
            // Swipe left - Chat
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              onMessagePress();
              translateX.setValue(0);
              setIsAnimating(false);
            });
          }
        } else {
          // Return to center
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Improved interpolations
  const cardOpacity = translateX.interpolate({
    inputRange: [-MAX_SWIPE_DISTANCE, 0, MAX_SWIPE_DISTANCE],
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  const cardScale = translateX.interpolate({
    inputRange: [-MAX_SWIPE_DISTANCE, 0, MAX_SWIPE_DISTANCE],
    outputRange: [0.98, 1, 0.98],
    extrapolate: 'clamp',
  });

  const cardRotation = translateX.interpolate({
    inputRange: [-MAX_SWIPE_DISTANCE, 0, MAX_SWIPE_DISTANCE],
    outputRange: ['-5deg', '0deg', '5deg'],
    extrapolate: 'clamp',
  });

  // Background actions with improved opacity
  const leftActionOpacity = translateX.interpolate({
    inputRange: [-MAX_SWIPE_DISTANCE, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.9, 0],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD, MAX_SWIPE_DISTANCE],
    outputRange: [0, 0.9, 1],
    extrapolate: 'clamp',
  });

  // Action scale for better visual feedback
  const leftActionScale = translateX.interpolate({
    inputRange: [-MAX_SWIPE_DISTANCE, -SWIPE_THRESHOLD, 0],
    outputRange: [1.1, 1.05, 1],
    extrapolate: 'clamp',
  });

  const rightActionScale = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD, MAX_SWIPE_DISTANCE],
    outputRange: [1, 1.05, 1.1],
    extrapolate: 'clamp',
  });

  const handleCardPress = useCallback(() => {
    if (!isAnimating) {
      onViewProfile();
    }
  }, [isAnimating, onViewProfile]);

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={styles.backgroundActions}>
        {/* Left Action - Chat */}
        <Animated.View 
          style={[
            styles.backgroundAction,
            styles.leftAction,
            { 
              opacity: leftActionOpacity,
              transform: [{ scale: leftActionScale }]
            }
          ]}
        >
          <MaterialIcon name={IconNames.messages} size={32} color="white" />
          <Text style={styles.actionLabel}>Chat</Text>
        </Animated.View>

        {/* Right Action - Unmatch */}
        <Animated.View 
          style={[
            styles.backgroundAction,
            styles.rightAction,
            { 
              opacity: rightActionOpacity,
              transform: [{ scale: rightActionScale }]
            }
          ]}
        >
          <MaterialIcon name={IconNames.close} size={32} color="white" />
          <Text style={styles.actionLabel}>Unmatch</Text>
        </Animated.View>
      </View>

      {/* Swipeable Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX },
              { scale: cardScale },
              { rotate: cardRotation }
            ],
            opacity: cardOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <ListItem 
          style={styles.matchCard} 
          onPress={handleCardPress}
          variant="elevated"
        >
          <View style={styles.cardContent}>
            {/* Header Section with Avatar and Basic Info */}
            <View style={styles.headerSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.avatar}
                  defaultSource={{ uri: 'https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=Loading' }}
                />
                <View 
                  style={[
                    styles.onlineIndicator, 
                    { backgroundColor: isOnline ? '#27AE60' : '#95A5A6' }
                  ]} 
                />
              </View>
              
              <View style={styles.basicInfo}>
                <Text style={[styles.matchName, { color: theme.colors.text }]}>
                  {otherProfile.first_name}{age ? `, ${age}` : ''}
                </Text>
                
                {location && (
                  <View style={styles.locationContainer}>
                    <MaterialIcon name={IconNames.location} size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.locationText, { color: theme.colors.textSecondary }]}>
                      {location}
                    </Text>
                  </View>
                )}
                
                <View style={styles.metaRow}>
                  <View style={[
                    styles.levelBadge,
                    { backgroundColor: getMatchLevelColor(match.level) + '20' }
                  ]}>
                    <Text style={[
                      styles.levelText,
                      { color: getMatchLevelColor(match.level) }
                    ]}>
                      {getMatchLevelText(match.level)}
                    </Text>
                  </View>
                  
                  {!isOnline && lastSeen && (
                    <Text style={[styles.lastSeenText, { color: theme.colors.textSecondary }]}>
                      Last seen {new Date(lastSeen).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Bio Section */}
            {otherProfile.bio && (
              <View style={styles.bioSection}>
                <Text 
                  style={[styles.bioText, { color: theme.colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {otherProfile.bio}
                </Text>
              </View>
            )}

            {/* Swipe Instructions */}
            <View style={styles.swipeInstructions}>
              <View style={styles.instructionRow}>
                <View style={styles.instructionItem}>
                  <MaterialIcon name={IconNames.back} size={16} color={theme.colors.primary} />
                  <Text style={[styles.instructionText, { color: theme.colors.primary }]}>
                    Swipe left to chat
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <MaterialIcon name={IconNames.forward} size={16} color={theme.colors.error} />
                  <Text style={[styles.instructionText, { color: theme.colors.error }]}>
                    Swipe right to unmatch
                  </Text>
                </View>
              </View>
              <Text style={[styles.tapInstruction, { color: theme.colors.textSecondary }]}>
                Tap to view profile
              </Text>
            </View>
          </View>
        </ListItem>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: getResponsiveSpacing('md'),
    marginHorizontal: getResponsiveSpacing('sm'),
  },
  backgroundActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  backgroundAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  leftAction: {
    backgroundColor: '#4ECDC4',
  },
  rightAction: {
    backgroundColor: '#FF6B6B',
  },
  actionLabel: {
    color: 'white',
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '600',
    marginTop: getResponsiveSpacing('xs'),
  },
  cardContainer: {
    zIndex: 1,
  },
  matchCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    padding: getResponsiveSpacing('lg'),
  },
  headerSection: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing('md'),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: getResponsiveSpacing('lg'),
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  basicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  matchName: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('xs'),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  locationText: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('xs'),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: 12,
  },
  levelText: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '600',
  },
  lastSeenText: {
    fontSize: getResponsiveFontSize('xs'),
  },
  bioSection: {
    marginBottom: getResponsiveSpacing('lg'),
    paddingTop: getResponsiveSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bioText: {
    fontSize: getResponsiveFontSize('sm'),
    lineHeight: getResponsiveFontSize('sm') * 1.4,
  },
  swipeInstructions: {
    paddingTop: getResponsiveSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  instructionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing('xs'),
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: getResponsiveFontSize('xs'),
    marginLeft: getResponsiveSpacing('xs'),
  },
  tapInstruction: {
    fontSize: getResponsiveFontSize('xs'),
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 