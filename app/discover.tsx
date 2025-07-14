import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Profile } from '../src/types';
import { calculateAge } from '../src/utils/dateUtils';
import { useTheme } from '../src/utils/themes';

const { width, height } = Dimensions.get('window');

export default function DiscoverScreen() {
  const theme = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockProfiles: Profile[] = [
        {
          id: '1',
          user_id: '1',
          first_name: 'Sarah',
          last_name: 'Johnson',
          bio: 'Love hiking and coffee ☕️',
          birthdate: '1998-03-20',
          gender: 'female',
          location: 'San Francisco, CA',
          photos: ['https://via.placeholder.com/400x600/FF6B9D/FFFFFF?text=Sarah'],
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
        {
          id: '2',
          user_id: '2',
          first_name: 'Alex',
          last_name: 'Chen',
          bio: 'Passionate about music and art 🎨',
          birthdate: '1995-07-15',
          gender: 'male',
          location: 'New York, NY',
          photos: ['https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Alex'],
          interests: ['music', 'art', 'photography'],
          looking_for: ['female'],
          max_distance: 30,
          min_age: 25,
          max_age: 35,
          is_online: true,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setProfiles(mockProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (currentIndex >= profiles.length) return;
    
    try {
      const currentProfile = profiles[currentIndex];
      // Mock like action - replace with actual API call
      console.log('Liked:', currentProfile.first_name);
      
      // Check if it's a match (mock)
      const isMatch = Math.random() > 0.7; // 30% chance of match
      
      if (isMatch) {
        // Show match notification
        alert(`It's a match with ${currentProfile.first_name}! 🎉`);
      }
      
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Failed to like profile:', error);
    }
  };

  const handlePass = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleSuperLike = async () => {
    if (currentIndex >= profiles.length) return;
    
    try {
      const currentProfile = profiles[currentIndex];
      // Mock super like action - replace with actual API call
      console.log('Super liked:', currentProfile.first_name);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Failed to super like profile:', error);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Finding amazing people for you...
        </Text>
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.noMoreCard}>
          <Text style={[styles.noMoreTitle, { color: theme.colors.text }]}>
            No more profiles to show
          </Text>
          <Text style={[styles.noMoreText, { color: theme.colors.textSecondary }]}>
            Check back later for new matches!
          </Text>
          <Button
            title="Refresh"
            onPress={loadProfiles}
            variant="primary"
            style={{ marginTop: 20 }}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Discover</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.profileContainer}>
        <Card style={styles.profileCard}>
          <Image
            source={{ uri: currentProfile.photos[0] }}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              {currentProfile.first_name}, {currentProfile.birthdate ? calculateAge(currentProfile.birthdate) : 'N/A'}
            </Text>
            <Text style={[styles.profileLocation, { color: theme.colors.textSecondary }]}>
              📍 {currentProfile.location}
            </Text>
            <Text style={[styles.profileBio, { color: theme.colors.text }]}>
              {currentProfile.bio}
            </Text>
            <View style={styles.interestsContainer}>
              {currentProfile.interests.slice(0, 3).map((interest, index) => (
                <View
                  key={index}
                  style={[styles.interestTag, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePass}>
          <Text style={styles.actionButtonText}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={handleSuperLike}
        >
          <Text style={styles.superLikeText}>⭐</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLike}
        >
          <Text style={styles.likeButtonText}>♥</Text>
        </TouchableOpacity>
      </View>
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
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  profileCard: {
    height: height * 0.6,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  profileInfo: {
    padding: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileLocation: {
    fontSize: 16,
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 20,
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
  actionButtonText: {
    fontSize: 30,
    color: '#FF6B6B',
  },
  superLikeButton: {
    backgroundColor: '#4ECDC4',
  },
  superLikeText: {
    fontSize: 30,
    color: 'white',
  },
  likeButton: {
    backgroundColor: '#FF6B9D',
  },
  likeButtonText: {
    fontSize: 30,
    color: 'white',
  },
}); 