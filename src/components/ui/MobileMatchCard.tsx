import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { CallType, Match, MatchLevel } from '../../types';
import { calculateAge } from '../../utils/dateUtils';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { CallButton } from './CallButton';
import { ListItem } from './ListItem';
import { IconNames, MaterialIcon } from './MaterialIcon';

interface MobileMatchCardProps {
  match: Match;
  otherProfile: any;
  onPress: () => void;
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

export const MobileMatchCard: React.FC<MobileMatchCardProps> = ({
  match,
  otherProfile,
  onPress,
  onMessagePress,
  onUnmatch,
  onCallStart,
  currentUserId,
}) => {
  const theme = useTheme();
  
  const isOnline = otherProfile.is_online;
  const lastSeen = otherProfile.last_seen;
  const age = otherProfile.birthdate ? calculateAge(otherProfile.birthdate) : null;
  const location = otherProfile.location ? 
    `${otherProfile.location.city || ''}${otherProfile.location.state ? `, ${otherProfile.location.state}` : ''}${otherProfile.location.country ? `, ${otherProfile.location.country}` : ''}`.trim() : 
    null;
  const profilePhoto = otherProfile.photos?.[0] || 'https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=No+Photo';

  return (
    <ListItem 
      style={styles.matchCard} 
      onPress={onPress}
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

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.messageButton,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={onMessagePress}
            activeOpacity={0.8}
          >
            <MaterialIcon name={IconNames.messages} size={20} color="white" />
            <Text style={[styles.actionButtonText, { color: 'white' }]}>
              Message
            </Text>
          </TouchableOpacity>
          
          {match.level >= MatchLevel.LEVEL_4 && (
            <CallButton
              match={{
                id: match.id,
                level: match.level,
                user1_id: match.user1_id || '',
                user2_id: match.user2_id || '',
                user1_profile: match.user1_profile,
                user2_profile: match.user2_profile,
              }}
              currentUserId={currentUserId}
              onCallStart={(callType) => onCallStart(match, callType)}
            />
          )}
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.unmatchButton,
              { borderColor: theme.colors.error }
            ]}
            onPress={onUnmatch}
            activeOpacity={0.8}
          >
            <MaterialIcon name={IconNames.close} size={20} color={theme.colors.error} />
            <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
              Unmatch
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ListItem>
  );
};

const styles = StyleSheet.create({
  matchCard: {
    marginBottom: getResponsiveSpacing('md'),
    marginHorizontal: getResponsiveSpacing('sm'),
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
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSpacing('sm'),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderRadius: 12,
    minHeight: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageButton: {
    backgroundColor: '#FF6B9D', // Will be overridden by inline style
  },
  unmatchButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
    marginLeft: getResponsiveSpacing('xs'),
  },
}); 