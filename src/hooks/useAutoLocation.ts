import { useCallback, useEffect, useRef } from 'react';
import { LocationService } from '../services/locationService';
import { APP_CONFIG } from '../utils/appConfig';
import { getLocationUpdateDelay, LOCATION_CONFIG, shouldAllowLocationUpdate } from '../utils/locationConfig';

interface UseAutoLocationProps {
  userId?: string;
  isLocationSharingEnabled: boolean;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  onError?: (error: string) => void;
}

export const useAutoLocation = ({
  userId,
  isLocationSharingEnabled,
  onLocationUpdate,
  onError,
}: UseAutoLocationProps) => {
  const lastLocationUpdate = useRef<number>(0);
  const isUpdating = useRef<boolean>(false);
  const hasInitialized = useRef<boolean>(false);

  const updateUserLocation = useCallback(async (forceUpdate = false, updateType: 'normal' | 'app_state_change' = 'normal') => {
    // Only update if location sharing is enabled and user is logged in
    if (!isLocationSharingEnabled || !userId) {
      return;
    }

    // Prevent concurrent updates
    if (isUpdating.current) {
      console.log('🔄 Location update already in progress, skipping...');
      return;
    }

    // Check if update should be allowed based on time intervals
    if (!shouldAllowLocationUpdate(lastLocationUpdate.current, forceUpdate, updateType)) {
      console.log('⏰ Location update skipped - too recent');
      return;
    }

    try {
      isUpdating.current = true;
      console.log('🌍 Auto-detecting location for user:', userId);
      
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        // Save location to user profile
        const success = await LocationService.saveLocationToProfile(userId, location);
        
        if (success) {
          lastLocationUpdate.current = Date.now();
          console.log('✅ Location updated automatically:', {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.formattedAddress
          });
          
          onLocationUpdate?.(location.latitude, location.longitude);
        } else {
          throw new Error('Failed to save location to profile');
        }
      } else {
        throw new Error('Failed to get current location');
      }
    } catch (error) {
      console.error('❌ Error updating user location:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown location error');
    } finally {
      isUpdating.current = false;
    }
  }, [isLocationSharingEnabled, userId, onLocationUpdate, onError]);

  useEffect(() => {
    // Completely disable auto-location in development mode if configured
    if (APP_CONFIG.DEVELOPMENT.DISABLE_AUTO_LOCATION) {
      console.log('🔄 Auto-location disabled in development mode to prevent infinite loops');
      return;
    }

    // Only update location once when component mounts and user is available
    if (isLocationSharingEnabled && userId && !hasInitialized.current && LOCATION_CONFIG.ENABLE_AUTO_START_LOCATION) {
      hasInitialized.current = true;
      // Add a delay to prevent immediate location request on app start
      const initTimeout = setTimeout(() => {
        updateUserLocation(true, 'normal');
      }, getLocationUpdateDelay('initial'));
      
      return () => clearTimeout(initTimeout);
    }
  }, [isLocationSharingEnabled, userId, updateUserLocation]);

  // Removed duplicate AppState listener to prevent conflicts with AuthContext
  // Location updates will now be handled through manual triggers and the initial mount

  // Manual location update function - now memoized to prevent recreation
  const manualLocationUpdate = useCallback(() => {
    updateUserLocation(true, 'normal');
  }, [updateUserLocation]);

  return {
    manualLocationUpdate,
  };
}; 