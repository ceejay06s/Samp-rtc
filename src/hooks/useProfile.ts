import { useCallback, useEffect, useState } from 'react';
import { ProfileFilters, ProfileSearchParams, ProfileService } from '../services/profileService';
import { Profile } from '../types';

export interface UseProfileOptions {
  autoFetch?: boolean;
  userId?: string;
  filters?: ProfileFilters;
  limit?: number;
}

export function useProfile(options: UseProfileOptions = {}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = false, userId, filters, limit = 20 } = options;

  // Fetch single profile
  const fetchProfile = useCallback(async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await ProfileService.getProfile(id);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch multiple profiles
  const fetchProfiles = useCallback(async (params: ProfileSearchParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ProfileService.getProfiles({
        ...params,
        filters: filters || params.filters,
        limit: limit || params.limit
      });
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, limit]);

  // Search profiles
  const searchProfiles = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await ProfileService.searchProfiles(searchTerm, limit);
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search profiles');
      console.error('Error searching profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Get nearby profiles
  const getNearbyProfiles = useCallback(async (
    latitude: number, 
    longitude: number, 
    maxDistanceKm: number = 50
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ProfileService.getProfilesNearby(
        latitude, 
        longitude, 
        maxDistanceKm, 
        limit
      );
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nearby profiles');
      console.error('Error fetching nearby profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!userId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedProfile = await ProfileService.updateProfile(userId, updates);
      if (updatedProfile) {
        setProfile(updatedProfile);
        // Also update in profiles array if it exists there
        setProfiles(prev => 
          prev.map(p => p.user_id === userId ? updatedProfile : p)
        );
      }
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      console.error('Error updating profile:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create profile
  const createProfile = useCallback(async (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newProfile = await ProfileService.createProfile(profileData);
      if (newProfile) {
        setProfile(newProfile);
        setProfiles(prev => [...prev, newProfile]);
      }
      return newProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      console.error('Error creating profile:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete profile
  const deleteProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await ProfileService.deleteProfile(id);
      if (success) {
        setProfile(null);
        setProfiles(prev => prev.filter(p => p.user_id !== id));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      console.error('Error deleting profile:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch profile if userId is provided and autoFetch is true
  useEffect(() => {
    if (autoFetch && userId) {
      fetchProfile(userId);
    }
  }, [autoFetch, userId, fetchProfile]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // State
    profile,
    profiles,
    loading,
    error,
    
    // Actions
    fetchProfile,
    fetchProfiles,
    searchProfiles,
    getNearbyProfiles,
    updateProfile,
    createProfile,
    deleteProfile,
    
    // Utilities
    clearError: () => setError(null),
    refreshProfile: () => userId ? fetchProfile(userId) : Promise.resolve(),
    refreshProfiles: () => fetchProfiles({ filters, limit })
  };
}
