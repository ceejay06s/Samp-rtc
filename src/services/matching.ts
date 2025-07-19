import { supabase } from '../../lib/supabase';
import { Match, MatchLevel, Profile } from '../types';

export interface DiscoveryFilters {
  ageRange: [number, number];
  maxDistance: number;
  gender: string[];
  interests?: string[];
}

export interface LikeData {
  targetUserId: string;
  isSuperLike?: boolean;
}

export class MatchingService {
  static async getDiscoveryProfiles(
    currentUserId: string,
    filters: DiscoveryFilters,
    limit: number = 20
  ): Promise<Profile[]> {
    try {
      console.log('🔍 Getting discovery profiles for user:', currentUserId);
      console.log('📋 Using filters:', filters);

      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching current user profile:', profileError);
        throw new Error(`Failed to fetch current user profile: ${profileError.message}`);
      }

      if (!currentProfile) {
        console.error('❌ Current user profile not found for user:', currentUserId);
        throw new Error('Current user profile not found - please complete your profile first');
      }

      console.log('✅ Current user profile found:', {
        name: `${currentProfile.first_name} ${currentProfile.last_name}`,
        gender: currentProfile.gender,
        location: currentProfile.location
      });

      // Calculate birth date range for age filtering
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentDay = new Date().getDate();
      
      // For age filtering, we need to be more precise with birthdate calculations
      const maxAgeDate = new Date(currentYear - filters.ageRange[0], currentMonth, currentDay);
      const minAgeDate = new Date(currentYear - filters.ageRange[1] - 1, currentMonth, currentDay);

      // Build base query
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', currentUserId)
        .gte('birthdate', minAgeDate.toISOString().split('T')[0])
        .lte('birthdate', maxAgeDate.toISOString().split('T')[0])
        .in('gender', filters.gender)
        .limit(limit * 2); // Get more to filter out duplicates

      // Add interest-based filtering if specified
      if (filters.interests && filters.interests.length > 0) {
        query = query.overlaps('interests', filters.interests);
      }

      console.log('🔍 Executing discovery query...');
      const { data: allProfiles, error } = await query;
      
      if (error) {
        console.error('❌ Database query error:', error);
        throw error;
      }

      console.log(`📊 Query returned ${allProfiles?.length || 0} profiles`);

      if (!allProfiles || allProfiles.length === 0) {
        console.log('🧪 No real profiles found, returning mock profiles for development');
        // Return mock profiles for development if no real profiles found
        const mockProfiles = this.getMockDiscoveryProfiles(currentProfile, filters, limit);
        console.log(`✅ Generated ${mockProfiles.length} mock profiles`);
        return mockProfiles;
      }

      // Filter profiles by distance if location is available
      let filteredProfiles = allProfiles;
      if (currentProfile.latitude && currentProfile.longitude && filters.maxDistance) {
        filteredProfiles = allProfiles.filter(profile => {
          if (!profile.latitude || !profile.longitude) return true; // Include profiles without location
          
          const distance = this.calculateDistance(
            currentProfile.latitude!,
            currentProfile.longitude!,
            profile.latitude,
            profile.longitude
          );
          
          return distance <= filters.maxDistance!;
        });
      }

      // Remove profiles that user has already interacted with
      const { data: existingLikes } = await supabase
        .from('likes')
        .select('liked_id')
        .eq('liker_id', currentUserId);

      const likedUserIds = new Set(existingLikes?.map(like => like.liked_id) || []);
      
      filteredProfiles = filteredProfiles.filter(profile => 
        !likedUserIds.has(profile.user_id)
      );

      // Sort by compatibility score if interests are available
      if (currentProfile.interests && currentProfile.interests.length > 0) {
        filteredProfiles.sort((a, b) => {
          const scoreA = this.calculateCompatibilityScore(currentProfile, a);
          const scoreB = this.calculateCompatibilityScore(currentProfile, b);
          return scoreB - scoreA;
        });
      }

      // Shuffle remaining profiles to add variety
      filteredProfiles = this.shuffleArray(filteredProfiles);

      const finalProfiles = filteredProfiles.slice(0, limit);
      console.log(`✅ Returning ${finalProfiles.length} discovery profiles`);
      
      return finalProfiles;
    } catch (error) {
      console.error('❌ Error in getDiscoveryProfiles:', error);
      
      // If there's an error, try to return mock profiles as fallback
      try {
        console.log('🔄 Attempting to return mock profiles as fallback...');
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUserId)
          .single();
        
        if (currentProfile) {
          const mockProfiles = this.getMockDiscoveryProfiles(currentProfile, filters, limit);
          console.log(`✅ Returning ${mockProfiles.length} mock profiles as fallback`);
          return mockProfiles;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      throw new Error(`Failed to get discovery profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Calculate compatibility score based on shared interests
  private static calculateCompatibilityScore(currentProfile: Profile, otherProfile: Profile): number {
    if (!currentProfile.interests || !otherProfile.interests) return 0;
    
    const currentInterests = new Set(currentProfile.interests);
    const otherInterests = new Set(otherProfile.interests);
    
    // Count shared interests
    const sharedInterests = [...currentInterests].filter(interest => 
      otherInterests.has(interest)
    ).length;
    
    // Calculate compatibility as a percentage
    const totalUniqueInterests = new Set([...currentInterests, ...otherInterests]).size;
    return totalUniqueInterests > 0 ? (sharedInterests / totalUniqueInterests) * 100 : 0;
  }

  // Shuffle array for randomness
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Enhanced mock profiles for development/testing
  private static getMockDiscoveryProfiles(currentProfile: Profile, filters: DiscoveryFilters, limit: number): Profile[] {
    const mockProfiles: Profile[] = [
      {
        id: 'mock-1',
        user_id: 'mock-user-1',
        first_name: 'Sarah',
        last_name: 'Johnson',
        birthdate: '1995-06-15',
        gender: 'female',
        bio: 'Love hiking, photography, and trying new coffee shops. Looking for someone who shares my passion for adventure and good conversations.',
        photos: [
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=faces',
          'https://images.unsplash.com/photo-1494790108755-2616b612b4c0?w=400&h=600&fit=crop&crop=faces'
        ],
        interests: ['hiking', 'photography', 'coffee', 'travel', 'books'],
        location: 'San Francisco, CA',
        latitude: currentProfile.latitude ? currentProfile.latitude + 0.01 : 37.7749,
        longitude: currentProfile.longitude ? currentProfile.longitude + 0.01 : -122.4194,
        is_online: true,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_distance: 25,
        looking_for: ['male'],
        min_age: 25,
        max_age: 35
      },
      {
        id: 'mock-2',
        user_id: 'mock-user-2',
        first_name: 'Emma',
        last_name: 'Davis',
        birthdate: '1992-03-22',
        gender: 'female',
        bio: 'Yoga instructor who loves cooking, painting, and weekend getaways. Seeking genuine connections and meaningful conversations.',
        photos: [
          'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=faces',
          'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&crop=faces'
        ],
        interests: ['yoga', 'cooking', 'painting', 'travel', 'meditation'],
        location: 'Oakland, CA',
        latitude: currentProfile.latitude ? currentProfile.latitude + 0.02 : 37.8044,
        longitude: currentProfile.longitude ? currentProfile.longitude + 0.02 : -122.2711,
        is_online: false,
        last_seen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_distance: 30,
        looking_for: ['male'],
        min_age: 28,
        max_age: 38
      },
      {
        id: 'mock-3',
        user_id: 'mock-user-3',
        first_name: 'Alex',
        last_name: 'Rodriguez',
        birthdate: '1990-11-08',
        gender: 'male',
        bio: 'Musician and food enthusiast. I play guitar, love concerts, and I\'m always discovering new restaurants. Let\'s explore the city together!',
        photos: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=faces',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=faces'
        ],
        interests: ['music', 'guitar', 'concerts', 'food', 'exploring'],
        location: 'Berkeley, CA',
        latitude: currentProfile.latitude ? currentProfile.latitude + 0.03 : 37.8715,
        longitude: currentProfile.longitude ? currentProfile.longitude + 0.03 : -122.2730,
        is_online: true,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        max_distance: 20,
        looking_for: ['female'],
        min_age: 26,
        max_age: 36
      }
    ];

    // Filter mock profiles based on user's gender preferences
    const filteredMockProfiles = mockProfiles.filter(profile => 
      filters.gender.includes(profile.gender)
    );

    return filteredMockProfiles.slice(0, limit);
  }

  static async likeProfile(data: LikeData): Promise<{ isMatch: boolean; match?: Match }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if there's already a like from the target user
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', data.targetUserId)
        .eq('liked_id', user.id)
        .single();

      if (existingLike) {
        // It's a match! Create match record
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: user.id,
            user2_id: data.targetUserId,
            level: MatchLevel.LEVEL_1,
            is_active: true,
          })
          .select()
          .single();

        if (matchError) throw matchError;

        return { isMatch: true, match: matchData };
      } else {
        // Just a like, create like record
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            liker_id: user.id,
            liked_id: data.targetUserId,
            is_super_like: data.isSuperLike || false,
          });

        if (likeError) throw likeError;

        return { isMatch: false };
      }
    } catch (error) {
      throw new Error(`Failed to like profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getMatches(currentUserId: string): Promise<Match[]> {
    try {
      console.log('🔍 Getting matches for user:', currentUserId);
      
      // First, get all matches for the current user
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (matchesError) {
        console.error('❌ Supabase error getting matches:', matchesError);
        throw matchesError;
      }

      console.log('📊 Raw matches data:', matchesData);

      if (!matchesData || matchesData.length === 0) {
        console.log('📭 No matches found for user');
        
        // For development/testing: create mock matches if none exist
        console.log('🧪 Creating mock matches for testing...');
        return this.createMockMatches(currentUserId);
      }

      // For each match, get both user profiles
      const matchesWithProfiles = await Promise.all(
        matchesData.map(async (match) => {
          try {
            console.log(`🔍 Fetching profiles for match ${match.id}: user1=${match.user1_id}, user2=${match.user2_id}`);
            
            // Get user1 profile
            const { data: user1Profile, error: user1Error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', match.user1_id)
              .maybeSingle(); // Use maybeSingle to avoid errors if profile doesn't exist

            // Get user2 profile  
            const { data: user2Profile, error: user2Error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', match.user2_id)
              .maybeSingle(); // Use maybeSingle to avoid errors if profile doesn't exist

            if (user1Error) {
              console.warn('⚠️ Error fetching user1 profile:', user1Error);
            }
            if (user2Error) {
              console.warn('⚠️ Error fetching user2 profile:', user2Error);
            }

            // Log what we found
            console.log(`📄 Profiles found - user1: ${user1Profile ? 'yes' : 'no'}, user2: ${user2Profile ? 'yes' : 'no'}`);

            // Determine which profile is the "other" user
            const isUser1 = match.user1_id === currentUserId;
            const otherProfile = isUser1 ? user2Profile : user1Profile;
        
        return {
          ...match,
              user1_profile: user1Profile,
              user2_profile: user2Profile,
          otherProfile,
        };
          } catch (profileError) {
            console.error('❌ Error fetching profiles for match:', match.id, profileError);
            return {
              ...match,
              user1_profile: undefined,
              user2_profile: undefined,
              otherProfile: undefined,
            };
          }
        })
      );

      // Filter out matches where we couldn't get the other user's profile
      const validMatches = matchesWithProfiles.filter(match => match.otherProfile !== undefined);

      console.log(`✅ Successfully processed ${validMatches.length} valid matches out of ${matchesData.length} total`);
      return validMatches;

    } catch (error) {
      console.error('❌ Error in getMatches:', error);
      throw new Error(`Failed to get matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to create mock matches for development/testing
  private static createMockMatches(currentUserId: string): Match[] {
    console.log('🧪 Creating mock matches for development');
    
    const mockMatches: Match[] = [
      {
        id: 'mock-1',
        user1Id: currentUserId,
        user2Id: 'mock-user-2',
        user1_id: currentUserId,
        user2_id: 'mock-user-2',
        level: MatchLevel.LEVEL_2,
        status: 'matched',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user1_profile: undefined,
        user2_profile: {
          id: 'mock-profile-2',
          user_id: 'mock-user-2',
          first_name: 'Sarah',
          last_name: 'Johnson',
          bio: 'Love hiking and coffee ☕️ Looking for someone to explore the city with!',
          birthdate: '1998-03-20',
          gender: 'female',
          location: 'San Francisco, CA',
          latitude: 37.7749,
          longitude: -122.4194,
          photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'],
          interests: ['hiking', 'coffee', 'travel', 'photography'],
          looking_for: ['male'],
          max_distance: 50,
          min_age: 23,
          max_age: 30,
          is_online: true,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        otherProfile: {
          id: 'mock-profile-2',
          user_id: 'mock-user-2',
          first_name: 'Sarah',
          last_name: 'Johnson',
          bio: 'Love hiking and coffee ☕️ Looking for someone to explore the city with!',
          birthdate: '1998-03-20',
          gender: 'female',
          location: 'San Francisco, CA',
          latitude: 37.7749,
          longitude: -122.4194,
          photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'],
          interests: ['hiking', 'coffee', 'travel', 'photography'],
          looking_for: ['male'],
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
        id: 'mock-2',
        user1Id: currentUserId,
        user2Id: 'mock-user-3',
        user1_id: currentUserId,
        user2_id: 'mock-user-3',
        level: MatchLevel.LEVEL_1,
        status: 'matched',
        is_active: true,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        user1_profile: undefined,
        user2_profile: {
          id: 'mock-profile-3',
          user_id: 'mock-user-3',
          first_name: 'Emma',
          last_name: 'Wilson',
          bio: 'Passionate about art and music 🎨 Always discovering new galleries and concerts.',
          birthdate: '1996-08-10',
          gender: 'female',
          location: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060,
          photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'],
          interests: ['art', 'music', 'photography', 'museums'],
          looking_for: ['male'],
          max_distance: 30,
          min_age: 25,
          max_age: 35,
          is_online: false,
          last_seen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        otherProfile: {
          id: 'mock-profile-3',
          user_id: 'mock-user-3',
          first_name: 'Emma',
          last_name: 'Wilson',
          bio: 'Passionate about art and music 🎨 Always discovering new galleries and concerts.',
          birthdate: '1996-08-10',
          gender: 'female',
          location: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060,
          photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'],
          interests: ['art', 'music', 'photography', 'museums'],
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
      {
        id: 'mock-3',
        user1Id: currentUserId,
        user2Id: 'mock-user-4',
        user1_id: currentUserId,
        user2_id: 'mock-user-4',
        level: MatchLevel.LEVEL_4,
        status: 'matched',
        is_active: true,
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 1800000),
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        user1_profile: undefined,
        user2_profile: {
          id: 'mock-profile-4',
          user_id: 'mock-user-4',
          first_name: 'Alex',
          last_name: 'Chen',
          bio: 'Tech enthusiast and weekend chef 👨‍💻🍳 Love trying new recipes and coding projects!',
          birthdate: '1995-12-15',
          gender: 'male',
          location: 'Austin, TX',
          latitude: 30.2672,
          longitude: -97.7431,
          photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'],
          interests: ['technology', 'cooking', 'gaming', 'startups'],
          looking_for: ['female', 'non-binary'],
          max_distance: 25,
          min_age: 22,
          max_age: 32,
          is_online: true,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        otherProfile: {
          id: 'mock-profile-4',
          user_id: 'mock-user-4',
          first_name: 'Alex',
          last_name: 'Chen',
          bio: 'Tech enthusiast and weekend chef 👨‍💻🍳 Love trying new recipes and coding projects!',
          birthdate: '1995-12-15',
          gender: 'male',
          location: 'Austin, TX',
          latitude: 30.2672,
          longitude: -97.7431,
          photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'],
          interests: ['technology', 'cooking', 'gaming', 'startups'],
          looking_for: ['female', 'non-binary'],
          max_distance: 25,
          min_age: 22,
          max_age: 32,
          is_online: true,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ];

    console.log(`🧪 Created ${mockMatches.length} mock matches`);
    return mockMatches;
  }

  static async updateMatchLevel(matchId: string, level: MatchLevel): Promise<Match> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({ level, updated_at: new Date().toISOString() })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update match level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async unmatch(matchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', matchId);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to unmatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getMatchCompatibility(matchId: string): Promise<number> {
    try {
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (!match) throw new Error('Match not found');

      // Fetch profiles separately
      const { data: user1Profile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', match.user1_id)
        .single();

      const { data: user2Profile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', match.user2_id)
        .single();

      const user1Interests = user1Profile?.interests || [];
      const user2Interests = user2Profile?.interests || [];

      // Calculate compatibility based on shared interests
      const sharedInterests = user1Interests.filter((interest: string) => 
        user2Interests.includes(interest)
      );

      const totalInterests = new Set([...user1Interests, ...user2Interests]).size;
      const compatibility = totalInterests > 0 ? (sharedInterests.length / totalInterests) * 100 : 0;

      return Math.round(compatibility);
    } catch (error) {
      throw new Error(`Failed to get match compatibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 