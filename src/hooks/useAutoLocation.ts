import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LocationService } from '../services/locationService';

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
  const appState = useRef(AppState.currentState);
  const lastLocationUpdate = useRef<number>(0);
  const locationUpdateInterval = 5 * 60 * 1000; // 5 minutes minimum between updates

  const updateUserLocation = async (forceUpdate = false) => {
    // Only update if location sharing is enabled and user is logged in
    if (!isLocationSharingEnabled || !userId) {
      return;
    }

    const now = Date.now();
    // Prevent too frequent updates unless forced
    if (!forceUpdate && (now - lastLocationUpdate.current) < locationUpdateInterval) {
      return;
    }

    try {
      console.log('🌍 Auto-detecting location for user:', userId);
      
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        // Save location to user profile
        const success = await LocationService.saveLocationToProfile(userId, location);
        
        if (success) {
          lastLocationUpdate.current = now;
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
    }
  };

  useEffect(() => {
    // Update location when component mounts (app opens)
    if (isLocationSharingEnabled && userId) {
      updateUserLocation(true); // Force update on app open
    }
  }, [isLocationSharingEnabled, userId]);

  useEffect(() => {
    // Handle app state changes (foreground/background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        console.log('📱 App came to foreground, checking location...');
        updateUserLocation(true); // Force update when app becomes active
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isLocationSharingEnabled, userId]);

  // Manual location update function
  const manualLocationUpdate = () => {
    updateUserLocation(true);
  };

  return {
    manualLocationUpdate,
  };
}; 