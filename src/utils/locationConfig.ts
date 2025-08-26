/**
 * Location Configuration
 * This file helps control location behavior and prevent excessive reloading
 */

export const LOCATION_CONFIG = {
  // Minimum time between location updates (in milliseconds)
  MIN_UPDATE_INTERVAL: 30 * 60 * 1000, // 30 minutes
  
  // Minimum time between app state change location updates (in milliseconds)
  MIN_APP_STATE_UPDATE_INTERVAL: 15 * 60 * 1000, // 15 minutes
  
  // Delay before initial location request on app start (in milliseconds)
  INITIAL_LOCATION_DELAY: 3000, // 3 seconds
  
  // Delay before location update on app state change (in milliseconds)
  APP_STATE_CHANGE_DELAY: 5000, // 5 seconds
  
  // Location accuracy settings
  LOCATION_ACCURACY: 'balanced' as const, // 'lowest', 'low', 'balanced', 'high', 'highest'
  
  // Location update intervals
  LOCATION_TIME_INTERVAL: 30000, // 30 seconds
  LOCATION_DISTANCE_INTERVAL: 50, // 50 meters
  
  // Network check cache duration (in milliseconds)
  NETWORK_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Geocoding service cache duration (in milliseconds)
  GEOCODING_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Maximum retry attempts for location services
  MAX_RETRY_ATTEMPTS: 2,
  
  // Timeout for network requests (in milliseconds)
  NETWORK_TIMEOUT: 5000, // 5 seconds
  
  // Enable/disable aggressive location updates
  ENABLE_AGGRESSIVE_UPDATES: false,
  
  // Enable/disable background location updates
  ENABLE_BACKGROUND_UPDATES: false,
  
  // Enable/disable automatic location on app start
  ENABLE_AUTO_START_LOCATION: true,
  
  // Enable/disable location on app state change
  ENABLE_APP_STATE_CHANGE_LOCATION: true,
};

/**
 * Check if location update should be allowed based on time intervals
 */
export const shouldAllowLocationUpdate = (
  lastUpdate: number,
  forceUpdate: boolean = false,
  updateType: 'normal' | 'app_state_change' = 'normal'
): boolean => {
  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdate;
  
  if (forceUpdate) {
    return true;
  }
  
  if (updateType === 'app_state_change') {
    return timeSinceLastUpdate >= LOCATION_CONFIG.MIN_APP_STATE_UPDATE_INTERVAL;
  }
  
  return timeSinceLastUpdate >= LOCATION_CONFIG.MIN_UPDATE_INTERVAL;
};

/**
 * Get appropriate delay for location updates
 */
export const getLocationUpdateDelay = (updateType: 'initial' | 'app_state_change'): number => {
  switch (updateType) {
    case 'initial':
      return LOCATION_CONFIG.INITIAL_LOCATION_DELAY;
    case 'app_state_change':
      return LOCATION_CONFIG.APP_STATE_CHANGE_DELAY;
    default:
      return 1000; // 1 second default
  }
};
