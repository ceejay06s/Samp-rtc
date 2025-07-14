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
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (!currentProfile) throw new Error('Current user profile not found');

      // Build query based on filters
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('user_id', currentUserId)
        .gte('birthdate', new Date(Date.now() - filters.ageRange[1] * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('birthdate', new Date(Date.now() - filters.ageRange[0] * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .in('gender', filters.gender)
        .limit(limit);

      // Add distance filter if location is available
      if (currentProfile.latitude && currentProfile.longitude) {
        // This would need a PostGIS extension in Supabase for proper distance calculation
        // For now, we'll filter by general location matching
        if (currentProfile.location) {
          query = query.ilike('location', `%${currentProfile.location.split(',')[0]}%`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to get discovery profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1_profile:profiles!matches_user1_id_fkey(*),
          user2_profile:profiles!matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform data to include the other user's profile
      return (data || []).map(match => {
        const isUser1 = match.user1_id === currentUserId;
        const otherProfile = isUser1 ? match.user2_profile : match.user1_profile;
        
        return {
          ...match,
          otherProfile,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        .select(`
          *,
          user1_profile:profiles!matches_user1_id_fkey(interests),
          user2_profile:profiles!matches_user2_id_fkey(interests)
        `)
        .eq('id', matchId)
        .single();

      if (!match) throw new Error('Match not found');

      const user1Interests = match.user1_profile?.interests || [];
      const user2Interests = match.user2_profile?.interests || [];

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