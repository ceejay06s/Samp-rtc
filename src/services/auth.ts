import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Profile } from '../types';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthdate: string; // ISO date string (YYYY-MM-DD)
  gender: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  birthdate?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  photos?: string[];
  looking_for?: string[];
  max_distance?: number;
  min_age?: number;
  max_age?: number;
}

export class AuthService {
  static async signUp(data: SignUpData): Promise<{ user: SupabaseUser; profile: Profile }> {
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      console.log('User created with ID:', authData.user.id);

      // Wait for user creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      let profileData: Profile | null = null;

      // Method 1: Use the simple create function (should definitely work)
      try {
        console.log('Method 1: Using simple_create_profile function...');
        const { data: simpleData, error: simpleError } = await supabase
          .rpc('simple_create_profile', {
            p_user_id: authData.user.id,
            p_first_name: data.firstName,
            p_last_name: data.lastName,
            p_birthdate: data.birthdate,
            p_gender: data.gender,
          });

        if (!simpleError && simpleData) {
          profileData = simpleData;
          console.log('Profile created with simple function successfully');
        } else {
          console.error('Simple function error:', simpleError);
          throw simpleError;
        }
      } catch (error) {
        console.log('Method 1 failed:', error);
      }

      // Method 2: Direct insert (RLS should be disabled now)
      if (!profileData) {
        try {
          console.log('Method 2: Trying direct insert...');
          const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              first_name: data.firstName,
              last_name: data.lastName,
              birthdate: data.birthdate,
              gender: data.gender,
              bio: '',
              location: '',
              photos: [],
              interests: [],
              looking_for: [],
              max_distance: 50,
              min_age: 18,
              max_age: 100,
              is_online: true,
            })
            .select()
            .single();

          if (!insertError && insertData) {
            profileData = insertData;
            console.log('Profile created with direct insert successfully');
          } else {
            console.error('Direct insert error:', insertError);
            throw insertError;
          }
        } catch (error) {
          console.log('Method 2 failed:', error);
        }
      }

      // Method 3: Check if trigger created the profile
      if (!profileData) {
        try {
          console.log('Method 3: Checking if trigger created profile...');
          const { data: existingProfile, error: selectError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

          if (existingProfile && !selectError) {
            // Profile exists, update it with signup data
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({
                first_name: data.firstName,
                last_name: data.lastName,
                birthdate: data.birthdate,
                gender: data.gender,
              })
              .eq('user_id', authData.user.id)
              .select()
              .single();

            if (!updateError && updatedProfile) {
              profileData = updatedProfile;
              console.log('Profile updated successfully');
            } else {
              console.error('Profile update error:', updateError);
            }
          } else {
            console.log('No profile found from trigger');
          }
        } catch (error) {
          console.log('Method 3 failed:', error);
        }
      }

      // Method 4: Use sync function as last resort
      if (!profileData) {
        try {
          console.log('Method 4: Using sync_missing_profiles function...');
          
          const { data: syncResult, error: syncError } = await supabase
            .rpc('sync_missing_profiles');

          if (!syncError) {
            console.log('Sync function executed, checking for profile...');
            // Check again for the profile
            const { data: syncedProfile, error: checkError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', authData.user.id)
              .single();

            if (syncedProfile && !checkError) {
              // Update with signup data
              const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({
                  first_name: data.firstName,
                  last_name: data.lastName,
                  birthdate: data.birthdate,
                  gender: data.gender,
                })
                .eq('user_id', authData.user.id)
                .select()
                .single();

              if (!updateError && updatedProfile) {
                profileData = updatedProfile;
                console.log('Profile created via sync and updated successfully');
              }
            }
          } else {
            console.error('Sync function error:', syncError);
            // If function doesn't exist, just log and continue
            if (syncError.message?.includes('Could not find the function')) {
              console.log('Sync function does not exist, skipping Method 4');
            }
          }
        } catch (error) {
          console.log('Method 4 failed:', error);
        }
      }

      if (!profileData) {
        throw new Error('Profile creation failed after trying all methods. User ID: ' + authData.user.id);
      }

      console.log('Signup completed successfully');
      return {
        user: authData.user,
        profile: profileData,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async signIn(data: SignInData): Promise<{ user: SupabaseUser; profile: Profile }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign in failed');

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Update online status
      await supabase
        .from('profiles')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('user_id', authData.user.id);

      return {
        user: authData.user,
        profile: profileData,
      };
    } catch (error) {
      throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Update online status to offline
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    } catch (error) {
      throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getCurrentUser(): Promise<{ user: SupabaseUser; profile: Profile } | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) return null;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) return null;

      return {
        user,
        profile: profileData,
      };
    } catch (error) {
      return null;
    }
  }

  static async updateProfile(userId: string, data: ProfileUpdateData): Promise<Profile> {
    try {
      console.log('Updating profile for user:', userId);
      console.log('Update data:', data);

      // Validate the data before updating
      const validationErrors = this.validateProfileData(data);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Prepare the update data
      const updateData: any = {};

      // Only include fields that are provided
      if (data.first_name !== undefined) updateData.first_name = data.first_name;
      if (data.last_name !== undefined) updateData.last_name = data.last_name;
      if (data.birthdate !== undefined) updateData.birthdate = data.birthdate;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.interests !== undefined) updateData.interests = data.interests;
      if (data.photos !== undefined) updateData.photos = data.photos;
      if (data.looking_for !== undefined) updateData.looking_for = data.looking_for;
      if (data.max_distance !== undefined) updateData.max_distance = data.max_distance;
      if (data.min_age !== undefined) updateData.min_age = data.min_age;
      if (data.max_age !== undefined) updateData.max_age = data.max_age;

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      console.log('Final update data:', updateData);

      // Update the profile in Supabase
      const { data: profileData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      if (!profileData) {
        throw new Error('Profile not found after update');
      }

      console.log('Profile updated successfully:', profileData);
      return profileData;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error(`Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static validateProfileData(data: ProfileUpdateData): string[] {
    const errors: string[] = [];

    // Validate first name
    if (data.first_name !== undefined) {
      if (!data.first_name.trim()) {
        errors.push('First name cannot be empty');
      } else if (data.first_name.length > 50) {
        errors.push('First name must be less than 50 characters');
      }
    }

    // Validate last name
    if (data.last_name !== undefined) {
      if (!data.last_name.trim()) {
        errors.push('Last name cannot be empty');
      } else if (data.last_name.length > 50) {
        errors.push('Last name must be less than 50 characters');
      }
    }

    // Validate birthdate
    if (data.birthdate !== undefined) {
      const birthdate = new Date(data.birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthdate.getFullYear();
      
      if (isNaN(birthdate.getTime())) {
        errors.push('Invalid birthdate format');
      } else if (birthdate > today) {
        errors.push('Birthdate cannot be in the future');
      } else if (age < 18) {
        errors.push('User must be at least 18 years old');
      } else if (age > 100) {
        errors.push('Invalid birthdate (age too high)');
      }
    }

    // Validate bio
    if (data.bio !== undefined && data.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    // Validate max distance
    if (data.max_distance !== undefined) {
      if (data.max_distance < 1 || data.max_distance > 100) {
        errors.push('Max distance must be between 1 and 100 miles');
      }
    }

    // Validate age range
    if (data.min_age !== undefined) {
      if (data.min_age < 18 || data.min_age > 100) {
        errors.push('Minimum age must be between 18 and 100');
      }
    }
    if (data.max_age !== undefined) {
      if (data.max_age < 18 || data.max_age > 100) {
        errors.push('Maximum age must be between 18 and 100');
      }
    }
    if (data.min_age !== undefined && data.max_age !== undefined) {
      if (data.min_age > data.max_age) {
        errors.push('Minimum age cannot be greater than maximum age');
      }
    }

    // Validate photos array
    if (data.photos !== undefined) {
      if (!Array.isArray(data.photos)) {
        errors.push('Photos must be an array');
      } else if (data.photos.length > 6) {
        errors.push('Maximum 6 photos allowed');
      } else {
        // Validate each photo URL
        data.photos.forEach((photo, index) => {
          if (typeof photo !== 'string' || !photo.trim()) {
            errors.push(`Photo ${index + 1} must be a valid URL`);
          }
        });
      }
    }

    // Validate interests array
    if (data.interests !== undefined) {
      if (!Array.isArray(data.interests)) {
        errors.push('Interests must be an array');
      } else if (data.interests.length > 20) {
        errors.push('Maximum 20 interests allowed');
      } else {
        // Validate each interest
        data.interests.forEach((interest, index) => {
          if (typeof interest !== 'string' || !interest.trim()) {
            errors.push(`Interest ${index + 1} must be a valid string`);
          }
        });
      }
    }

    // Validate looking_for array
    if (data.looking_for !== undefined) {
      if (!Array.isArray(data.looking_for)) {
        errors.push('Looking for must be an array');
      } else if (data.looking_for.length === 0) {
        errors.push('At least one preference must be selected');
      } else {
        // Validate each preference
        const validGenders = ['male', 'female', 'non-binary', 'other'];
        data.looking_for.forEach((preference, index) => {
          if (!validGenders.includes(preference)) {
            errors.push(`Invalid preference: ${preference}`);
          }
        });
      }
    }

    return errors;
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async onAuthStateChange(callback: (user: SupabaseUser | null) => void): Promise<void> {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        callback(session.user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
} 