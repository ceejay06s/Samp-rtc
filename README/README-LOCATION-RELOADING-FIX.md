# Location Reloading Fix

## Problem Description
The Expo emulator was experiencing excessive reloading and location requests, causing performance issues and battery drain. This was caused by:

1. **Aggressive Location Updates**: Location was being requested every time the app state changed
2. **Frequent Network Calls**: Multiple API calls to check geocoding services and network connectivity
3. **App State Change Conflicts**: Both `useAutoLocation` and `AuthContext` were handling app state changes
4. **No Caching**: Network and geocoding service checks were performed repeatedly

## Solutions Implemented

### 1. Optimized Location Update Intervals
- **Normal updates**: Minimum 30 minutes between location updates
- **App state change updates**: Minimum 15 minutes between updates
- **Initial app start**: 3-second delay before first location request
- **App foreground**: 5-second delay before location update

### 2. Added Caching System
- **Network connectivity**: Cached for 5 minutes
- **Geocoding services**: Cached for 5 minutes
- **Location data**: Prevents duplicate reverse geocoding calls

### 3. Improved App State Handling
- **Single responsibility**: Only `useAutoLocation` handles location-related app state changes
- **Better debouncing**: Prevents rapid successive location requests
- **Conditional updates**: Only updates when necessary

### 4. Configuration-Based Control
- **Centralized settings**: All location behavior controlled from `src/utils/locationConfig.ts`
- **Easy customization**: Modify intervals and behavior without code changes
- **Environment-specific**: Different settings for development vs production

## Configuration Options

### Location Update Intervals
```typescript
// Minimum time between location updates (30 minutes)
MIN_UPDATE_INTERVAL: 30 * 60 * 1000

// Minimum time between app state change updates (15 minutes)
MIN_APP_STATE_UPDATE_INTERVAL: 15 * 60 * 1000

// Initial location delay on app start (3 seconds)
INITIAL_LOCATION_DELAY: 3000

// App state change delay (5 seconds)
APP_STATE_CHANGE_DELAY: 5000
```

### Location Accuracy Settings
```typescript
// Location accuracy (balanced, high, low, etc.)
LOCATION_ACCURACY: 'balanced'

// Time interval for location updates (30 seconds)
LOCATION_TIME_INTERVAL: 30000

// Distance interval for location updates (50 meters)
LOCATION_DISTANCE_INTERVAL: 50
```

### Feature Toggles
```typescript
// Enable/disable automatic location on app start
ENABLE_AUTO_START_LOCATION: true

// Enable/disable location on app state change
ENABLE_APP_STATE_CHANGE_LOCATION: true

// Enable/disable aggressive location updates
ENABLE_AGGRESSIVE_UPDATES: false

// Enable/disable background location updates
ENABLE_BACKGROUND_UPDATES: false
```

## Usage Examples

### Basic Usage
```typescript
import { useAutoLocation } from '../hooks/useAutoLocation';

const { manualLocationUpdate } = useAutoLocation({
  userId: user?.id,
  isLocationSharingEnabled: true,
  onLocationUpdate: (lat, lng) => {
    console.log('Location updated:', lat, lng);
  },
  onError: (error) => {
    console.error('Location error:', error);
  }
});
```

### Manual Location Update
```typescript
// Force a location update
manualLocationUpdate();
```

### Custom Configuration
```typescript
// Modify location behavior for specific use cases
import { LOCATION_CONFIG } from '../utils/locationConfig';

// Disable automatic location updates temporarily
LOCATION_CONFIG.ENABLE_AUTO_START_LOCATION = false;
LOCATION_CONFIG.ENABLE_APP_STATE_CHANGE_LOCATION = false;
```

## Performance Improvements

### Before Fix
- Location updates every 5-10 minutes
- Network checks on every location request
- Multiple app state change handlers
- No caching of service status

### After Fix
- Location updates every 30 minutes (normal) or 15 minutes (app state change)
- Network checks cached for 5 minutes
- Single app state change handler for location
- Intelligent caching prevents duplicate API calls

## Troubleshooting

### Still Experiencing Reloading?
1. **Check configuration**: Verify `LOCATION_CONFIG` settings
2. **Disable features**: Set `ENABLE_AUTO_START_LOCATION` to `false`
3. **Increase intervals**: Set longer delays between updates
4. **Check logs**: Look for location-related console messages

### Location Not Updating?
1. **Check permissions**: Ensure location permissions are granted
2. **Verify user ID**: Make sure `userId` is available
3. **Check sharing**: Verify `isLocationSharingEnabled` is `true`
4. **Manual update**: Try calling `manualLocationUpdate()`

### Performance Issues?
1. **Reduce accuracy**: Change `LOCATION_ACCURACY` to `'low'` or `'lowest'`
2. **Increase intervals**: Set longer time and distance intervals
3. **Disable features**: Turn off unnecessary location features
4. **Check network**: Ensure stable internet connection

## Best Practices

1. **Use configuration**: Modify `locationConfig.ts` instead of hardcoding values
2. **Monitor logs**: Watch console for location-related messages
3. **Test thoroughly**: Verify behavior on both iOS and Android
4. **User feedback**: Consider user preferences for location updates
5. **Battery optimization**: Balance accuracy with battery life

## Future Improvements

1. **User preferences**: Allow users to customize location update frequency
2. **Smart updates**: Use activity detection to optimize update timing
3. **Offline support**: Cache location data for offline use
4. **Analytics**: Track location update patterns for optimization
5. **A/B testing**: Test different update strategies with users
