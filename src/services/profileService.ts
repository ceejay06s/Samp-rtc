import { supabase } from '../../lib/supabase';
import { Profile } from '../types';

export interface ProfileFilters {
  gender?: string;
  minAge?: number;
  maxAge?: number;
  maxDistance?: number;
  interests?: string[];
  lookingFor?: string[];
}

export interface ProfileSearchParams {
  userId?: string;
  latitude?: number;
  longitude?: number;
  filters?: ProfileFilters;
  limit?: number;
  offset?: number;
}

export class ProfileService {
  /**
   * Get a single profile by user ID
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile fetched successfully:', data);
      return data as Profile;
    } catch (error) {
      console.error('❌ Exception fetching profile:', error);
      return null;
    }
  }

  /**
   * Get multiple profiles with optional filtering
   */
  static async getProfiles(params: ProfileSearchParams = {}): Promise<Profile[]> {
    try {
      console.log('🔍 Fetching profiles with params:', params);
      
      let query = supabase
        .from('profiles')
        .select('*');

      // Apply filters
      if (params.userId) {
        query = query.eq('user_id', params.userId);
      }

      if (params.filters?.gender) {
        query = query.eq('gender', params.filters.gender);
      }

      if (params.filters?.minAge || params.filters?.maxAge) {
        // Note: You might need to calculate age from birthdate in your query
        // This is a simplified example
        if (params.filters.minAge) {
          const minBirthdate = new Date();
          minBirthdate.setFullYear(minBirthdate.getFullYear() - params.filters.minAge);
          query = query.lte('birthdate', minBirthdate.toISOString().split('T')[0]);
        }
        
        if (params.filters.maxAge) {
          const maxBirthdate = new Date();
          maxBirthdate.setFullYear(maxBirthdate.getFullYear() - params.filters.maxAge);
          query = query.gte('birthdate', maxBirthdate.toISOString().split('T')[0]);
        }
      }

      if (params.filters?.maxDistance && params.latitude && params.longitude) {
        // For distance filtering, you might need to use PostGIS or calculate in your app
        // This is a placeholder for distance logic
        console.log('📍 Distance filtering not yet implemented');
      }

      if (params.filters?.interests && params.filters.interests.length > 0) {
        // Filter by interests (assuming interests is stored as an array)
        query = query.overlaps('interests', params.filters.interests);
      }

      if (params.filters?.lookingFor && params.filters.lookingFor.length > 0) {
        // Filter by what the user is looking for
        query = query.overlaps('looking_for', params.filters.lookingFor);
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching profiles:', error);
        return [];
      }

      console.log(`✅ Fetched ${data?.length || 0} profiles successfully`);
      return (data || []) as Profile[];
    } catch (error) {
      console.error('❌ Exception fetching profiles:', error);
      return [];
    }
  }

  /**
   * Search profiles by text (name, bio, interests)
   */
  static async searchProfiles(searchTerm: string, limit: number = 20): Promise<Profile[]> {
    try {
      console.log('🔍 Searching profiles for term:', searchTerm);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) {
        console.error('❌ Error searching profiles:', error);
        return [];
      }

      console.log(`✅ Search returned ${data?.length || 0} profiles`);
      return (data || []) as Profile[];
    } catch (error) {
      console.error('❌ Exception searching profiles:', error);
      return [];
    }
  }

  /**
   * Get profiles within a certain distance from coordinates
   */
  static async getProfilesNearby(
    latitude: number, 
    longitude: number, 
    maxDistanceKm: number = 50,
    limit: number = 20
  ): Promise<Profile[]> {
    try {
      console.log('📍 Fetching profiles near:', { latitude, longitude, maxDistanceKm });
      
      // This is a simplified distance calculation
      // For production, consider using PostGIS or a more sophisticated approach
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching nearby profiles:', error);
        return [];
      }

      // Filter by distance in the app (you could do this in SQL with PostGIS)
      const nearbyProfiles = (data || []).filter(profile => {
        if (!profile.latitude || !profile.longitude) return false;
        
        const distance = this.calculateDistance(
          latitude, longitude,
          profile.latitude, profile.longitude
        );
        
        return distance <= maxDistanceKm;
      });

      console.log(`✅ Found ${nearbyProfiles.length} profiles within ${maxDistanceKm}km`);
      return nearbyProfiles as Profile[];
    } catch (error) {
      console.error('❌ Exception fetching nearby profiles:', error);
      return [];
    }
  }

  /**
   * Update a profile
   */
  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      console.log('🔄 Updating profile for user:', userId, 'with updates:', updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        return null;
      }

      console.log('✅ Profile updated successfully');
      return data as Profile;
    } catch (error) {
      console.error('❌ Exception updating profile:', error);
      return null;
    }
  }

  /**
   * Create a new profile
   */
  static async createProfile(profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile | null> {
    try {
      console.log('➕ Creating new profile:', profileData);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        return null;
      }

      console.log('✅ Profile created successfully');
      return data as Profile;
    } catch (error) {
      console.error('❌ Exception creating profile:', error);
      return null;
    }
  }

  /**
   * Delete a profile
   */
  static async deleteProfile(userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting profile for user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting profile:', error);
        return false;
      }

      console.log('✅ Profile deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception deleting profile:', error);
      return false;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Export convenience functions
export const getProfile = ProfileService.getProfile;
export const getProfiles = ProfileService.getProfiles;
export const searchProfiles = ProfileService.searchProfiles;
export const getProfilesNearby = ProfileService.getProfilesNearby;
export const updateProfile = ProfileService.updateProfile;
export const createProfile = ProfileService.createProfile;
export const deleteProfile = ProfileService.deleteProfile;
