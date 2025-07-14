import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../src/components/ui/Card';
import { Match, MatchLevel } from '../src/types';
import { calculateAge } from '../src/utils/dateUtils';
import { useTheme } from '../src/utils/themes';

export default function MatchesScreen() {
  const theme = useTheme();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockMatches: Match[] = [
        {
          id: '1',
          user1Id: 'current_user',
          user2Id: '2',
          level: MatchLevel.LEVEL_2,
          status: 'matched',
          createdAt: new Date(),
          updatedAt: new Date(),
          user1_id: 'current_user',
          user2_id: '2',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user1_profile: {
            id: '1',
            user_id: 'current_user',
            first_name: 'You',
            last_name: '',
            bio: '',
            birthdate: '1998-05-15',
            gender: 'male',
            location: '',
            photos: [],
            interests: [],
            looking_for: [],
            max_distance: 50,
            min_age: 18,
            max_age: 100,
            is_online: true,
            last_seen: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          user2_profile: {
            id: '2',
            user_id: '2',
            first_name: 'Sarah',
            last_name: 'Johnson',
            bio: 'Love hiking and coffee ☕️',
            birthdate: '1998-03-20',
            gender: 'female',
            location: 'San Francisco, CA',
            photos: ['https://via.placeholder.com/100x100/FF6B9D/FFFFFF?text=S'],
            interests: ['hiking', 'coffee', 'travel'],
            looking_for: ['male', 'female'],
            max_distance: 50,
            min_age: 23,
            max_age: 30,
            is_online: true,
            last_seen: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        {
          id: '2',
          user1Id: 'current_user',
          user2Id: '3',
          level: MatchLevel.LEVEL_1,
          status: 'matched',
          createdAt: new Date(),
          updatedAt: new Date(),
          user1_id: 'current_user',
          user2_id: '3',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user1_profile: {
            id: '1',
            user_id: 'current_user',
            first_name: 'You',
            last_name: '',
            bio: '',
            birthdate: '1998-05-15',
            gender: 'male',
            location: '',
            photos: [],
            interests: [],
            looking_for: [],
            max_distance: 50,
            min_age: 18,
            max_age: 100,
            is_online: true,
            last_seen: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          user2_profile: {
            id: '3',
            user_id: '3',
            first_name: 'Emma',
            last_name: 'Wilson',
            bio: 'Passionate about art and music 🎨',
            birthdate: '1996-08-10',
            gender: 'female',
            location: 'New York, NY',
            photos: ['https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=E'],
            interests: ['art', 'music', 'photography'],
            looking_for: ['male'],
            max_distance: 30,
            min_age: 25,
            max_age: 35,
            is_online: false,
            last_seen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      ];
      setMatches(mockMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

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
        return '#FF6B9D';
      case MatchLevel.LEVEL_2:
        return '#4ECDC4';
      case MatchLevel.LEVEL_3:
        return '#45B7D1';
      case MatchLevel.LEVEL_4:
        return '#96CEB4';
      default:
        return '#FF6B9D';
    }
  };

  const handleMatchPress = (match: Match) => {
    // Navigate to messages screen for now
    router.push('/messages');
  };

  const handleVoiceCall = (match: Match) => {
    if (match.level >= MatchLevel.LEVEL_4) {
      // Navigate to messages screen for now
      router.push('/messages');
    } else {
      alert('Voice calls require Level 4 match');
    }
  };

  const renderMatch = ({ item: match }: { item: Match }) => {
    const otherProfile = match.user2_profile;
    const isOnline = otherProfile?.is_online;
    const lastSeen = otherProfile?.last_seen;

    return (
      <Card style={styles.matchCard} onPress={() => handleMatchPress(match)}>
        <View style={styles.matchContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: otherProfile?.photos[0] || 'https://via.placeholder.com/100x100' }}
              style={styles.avatar}
            />
            <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#27AE60' : '#95A5A6' }]} />
          </View>
          
          <View style={styles.matchInfo}>
            <Text style={[styles.matchName, { color: theme.colors.text }]}>
              {otherProfile?.first_name}, {otherProfile?.birthdate ? calculateAge(otherProfile.birthdate) : 'N/A'}
            </Text>
            <Text style={[styles.matchLocation, { color: theme.colors.textSecondary }]}>
              📍 {otherProfile?.location}
            </Text>
            <Text style={[styles.matchLevel, { color: getMatchLevelColor(match.level) }]}>
              {getMatchLevelText(match.level)}
            </Text>
            {!isOnline && lastSeen && (
              <Text style={[styles.lastSeen, { color: theme.colors.textSecondary }]}>
                Last seen {new Date(lastSeen).toLocaleTimeString()}
              </Text>
            )}
          </View>
          
          <View style={styles.matchActions}>
            {match.level >= MatchLevel.LEVEL_4 && (
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: getMatchLevelColor(match.level) }]}
                onPress={() => handleVoiceCall(match)}
              >
                <Text style={styles.callButtonText}>📞</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading your matches...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Matches</Text>
        <View style={{ width: 50 }} />
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No matches yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Start swiping to find your perfect match!
          </Text>
          <TouchableOpacity
            style={[styles.discoverButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/discover')}
          >
            <Text style={styles.discoverButtonText}>Go to Discover</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.matchesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 60,
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  discoverButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  matchesList: {
    paddingBottom: 20,
  },
  matchCard: {
    marginBottom: 15,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  matchLevel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
  },
  matchActions: {
    alignItems: 'center',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 18,
  },
}); 