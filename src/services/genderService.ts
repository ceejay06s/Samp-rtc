import { supabase } from '../../lib/supabase';
import { Profile } from '../types';

// Gender options with proper labels and values
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'genderfluid', label: 'Genderfluid' },
  { value: 'agender', label: 'Agender' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

export type GenderValue = typeof GENDER_OPTIONS[number]['value'];

// Gender preference options (for who users are looking for)
export const GENDER_PREFERENCE_OPTIONS = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'non-binary', label: 'Non-binary people' },
  { value: 'genderfluid', label: 'Genderfluid people' },
  { value: 'agender', label: 'Agender people' },
  { value: 'other', label: 'Other' },
] as const;

export type GenderPreferenceValue = typeof GENDER_PREFERENCE_OPTIONS[number]['value'];

export class GenderService {
  static getGenderOptions() {
    return GENDER_OPTIONS;
  }

  static getGenderPreferenceOptions() {
    return GENDER_PREFERENCE_OPTIONS;
  }

  static getGenderLabel(value: string): string {
    const option = GENDER_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  static getGenderPreferenceLabel(value: string): string {
    const option = GENDER_PREFERENCE_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  static validateGender(value: string): boolean {
    return GENDER_OPTIONS.some(option => option.value === value);
  }

  static validateGenderPreferences(preferences: string[]): boolean {
    if (!Array.isArray(preferences)) return false;
    return preferences.every(pref => 
      GENDER_PREFERENCE_OPTIONS.some(option => option.value === pref)
    );
  }

  static async updateUserGender(userId: string, gender: string): Promise<Profile> {
    try {
      // Validate gender value
      if (!this.validateGender(gender)) {
        throw new Error(`Invalid gender value: ${gender}`);
      }

      console.log(`Updating gender for user ${userId} to: ${gender}`);

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({ 
          gender,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating gender:', error);
        throw error;
      }

      if (!profile) {
        throw new Error('Profile not found after gender update');
      }

      console.log('Gender updated successfully:', profile);
      return profile;
    } catch (error) {
      console.error('Failed to update gender:', error);
      throw new Error(`Gender update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateGenderPreferences(userId: string, preferences: string[]): Promise<Profile> {
    try {
      // Validate preferences
      if (!this.validateGenderPreferences(preferences)) {
        throw new Error(`Invalid gender preferences: ${JSON.stringify(preferences)}`);
      }

      console.log(`Updating gender preferences for user ${userId} to:`, preferences);

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({ 
          looking_for: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating gender preferences:', error);
        throw error;
      }

      if (!profile) {
        throw new Error('Profile not found after gender preferences update');
      }

      console.log('Gender preferences updated successfully:', profile);
      return profile;
    } catch (error) {
      console.error('Failed to update gender preferences:', error);
      throw new Error(`Gender preferences update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserGender(userId: string): Promise<string | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gender')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user gender:', error);
        return null;
      }

      return profile?.gender || null;
    } catch (error) {
      console.error('Failed to get user gender:', error);
      return null;
    }
  }

  static async getUserGenderPreferences(userId: string): Promise<string[]> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('looking_for')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user gender preferences:', error);
        return [];
      }

      return profile?.looking_for || [];
    } catch (error) {
      console.error('Failed to get user gender preferences:', error);
      return [];
    }
  }

  static async getProfilesByGender(gender: string, limit: number = 20): Promise<Profile[]> {
    try {
      if (!this.validateGender(gender)) {
        throw new Error(`Invalid gender value: ${gender}`);
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', gender)
        .eq('is_online', true)
        .order('last_seen', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching profiles by gender:', error);
        throw error;
      }

      return profiles || [];
    } catch (error) {
      console.error('Failed to get profiles by gender:', error);
      return [];
    }
  }

  static async getProfilesMatchingPreferences(userId: string, limit: number = 20): Promise<Profile[]> {
    try {
      // Get user's gender preferences
      const preferences = await this.getUserGenderPreferences(userId);
      
      if (preferences.length === 0) {
        console.log('No gender preferences set, returning empty array');
        return [];
      }

      // Get user's own gender to exclude from results
      const userGender = await this.getUserGender(userId);

      let query = supabase
        .from('profiles')
        .select('*')
        .in('gender', preferences)
        .eq('is_online', true)
        .order('last_seen', { ascending: false })
        .limit(limit);

      // Exclude user's own profile
      if (userGender) {
        query = query.neq('user_id', userId);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching profiles matching preferences:', error);
        throw error;
      }

      return profiles || [];
    } catch (error) {
      console.error('Failed to get profiles matching preferences:', error);
      return [];
    }
  }

  // Helper method to get gender statistics for analytics
  static async getGenderStatistics(): Promise<Record<string, number>> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('gender');

      if (error) {
        console.error('Error fetching gender statistics:', error);
        return {};
      }

      const stats: Record<string, number> = {};
      profiles?.forEach(profile => {
        const gender = profile.gender || 'unknown';
        stats[gender] = (stats[gender] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get gender statistics:', error);
      return {};
    }
  }

  // Helper method to check if two users are compatible based on gender preferences
  static async areUsersCompatible(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      const [user1Gender, user1Preferences, user2Gender, user2Preferences] = await Promise.all([
        this.getUserGender(user1Id),
        this.getUserGenderPreferences(user1Id),
        this.getUserGender(user2Id),
        this.getUserGenderPreferences(user2Id),
      ]);

      // Check if user1 is interested in user2's gender
      const user1Interested = user1Preferences.includes(user2Gender || '');
      
      // Check if user2 is interested in user1's gender
      const user2Interested = user2Preferences.includes(user1Gender || '');

      return user1Interested && user2Interested;
    } catch (error) {
      console.error('Failed to check user compatibility:', error);
      return false;
    }
  }
} 