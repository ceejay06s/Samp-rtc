# NearestCity Component Integration

## Overview
The `NearestCity` component provides a simple, reusable way to display the user's current location in city, state, country format in your dating app. It intelligently extracts location information from structured address data and integrates seamlessly with your existing location service infrastructure.

## Features

### ✅ **Automatic Location Detection**
- Uses your existing `LocationService` for consistent location handling
- Automatically requests permissions and gets current location
- Integrates with your app's auto-location system

### ✅ **Flexible Configuration**
- `showLoading`: Control loading indicator display
- `autoUpdate`: Enable/disable automatic location updates
- `onLocationUpdate`: Callback when location is detected
- `onError`: Error handling callback
- `style`: Custom styling support

### ✅ **Smart Location Extraction**
- Intelligently extracts city, state, and country from structured address data
- Skips street addresses and focuses on location hierarchy
- Falls back to location name or "Unknown Location" if needed
- Handles errors gracefully with user-friendly messages
- Uses your app's theme system for consistent styling

## Basic Usage

### Simple Implementation
```tsx
import { NearestCity } from '../components/ui';

export const ProfileScreen = () => {
  return (
    <View>
      <Text>Your Profile</Text>
      <NearestCity />
    </View>
  );
};
```

### With Callbacks
```tsx
import { NearestCity } from '../components/ui';
import { LocationData } from '../services/locationService';

export const DiscoverScreen = () => {
  const handleLocationUpdate = (location: LocationData) => {
    // Update user profile with new location
    console.log('City updated:', location);
  };

  const handleLocationError = (error: string) => {
    // Show error message to user
    Alert.alert('Location Error', error);
  };

  return (
    <View>
      <Text>Discover Nearby Matches</Text>
      <NearestCity 
        onLocationUpdate={handleLocationUpdate}
        onError={handleLocationError}
      />
    </View>
  );
};
```

## Integration Examples

### 1. **Profile Screen Integration**
```tsx
// app/profile.tsx
import { NearestCity } from '../src/components/ui';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      
      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Current Location</Text>
        <NearestCity 
          showLoading={true}
          onLocationUpdate={(location) => {
            // Optionally save to profile
            console.log('Profile location updated:', location);
          }}
        />
      </View>
      
      {/* Other profile content */}
    </View>
  );
}
```

### 2. **Discover Screen Integration**
```tsx
// app/discover.tsx
import { NearestCity } from '../src/components/ui';

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      {/* Header with location */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <NearestCity 
          showLoading={false}
          style={styles.locationDisplay}
        />
      </View>
      
      {/* Match cards */}
      <View style={styles.matchesContainer}>
        {/* Your existing match cards */}
      </View>
    </View>
  );
}
```

### 3. **Preferences Screen Integration**
```tsx
// app/preferences.tsx
import { NearestCity } from '../src/components/ui';
import { useAuth } from '../lib/AuthContext';

export default function PreferencesScreen() {
  const { user, locationSharing } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferences</Text>
      
      {/* Location Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Settings</Text>
        
        {locationSharing ? (
          <View style={styles.locationInfo}>
            <Text>Your current location:</Text>
            <NearestCity 
              showLoading={true}
              onLocationUpdate={(location) => {
                // Location is automatically saved via AuthContext
                console.log('Location updated in preferences');
              }}
            />
          </View>
        ) : (
          <Text>Location sharing is disabled</Text>
        )}
      </View>
    </View>
  );
}
```

## Advanced Usage

### Manual Location Updates
```tsx
import { NearestCity } from '../src/components/ui';
import { Button } from '../src/components/ui';

export const LocationTestScreen = () => {
  const [location, setLocation] = useState(null);

  return (
    <View>
      <NearestCity 
        autoUpdate={false} // Disable automatic updates
        onLocationUpdate={setLocation}
      />
      
      <Button 
        title="Update Location" 
        onPress={() => {
          // Trigger manual location update
          // You can implement this by calling LocationService directly
        }}
      />
    </View>
  );
};
```

### Custom Styling
```tsx
<NearestCity 
  style={{
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  }}
  showLoading={false}
/>
```

## Integration with Existing Services

### Works with Your Location Infrastructure
The `NearestCity` component leverages your existing:

- **LocationService**: Uses `getCurrentLocation()` method
- **Auto-location Hook**: Integrates with `useAutoLocation`
- **AuthContext**: Respects location sharing preferences
- **Theme System**: Uses your app's colors and spacing
- **Responsive Utilities**: Adapts to different screen sizes

### Permission Handling
The component automatically:
- Requests location permissions using your existing service
- Handles permission denials gracefully
- Shows appropriate error messages
- Integrates with your app's permission flow

### Error Handling
```tsx
<NearestCity 
  onError={(error) => {
    // Log error for debugging
    console.error('Location error:', error);
    
    // Show user-friendly message
    if (error.includes('Permission denied')) {
      Alert.alert(
        'Location Permission',
        'Please enable location access in your device settings to find nearby matches.'
      );
    }
  }}
/>
```

## Best Practices

### 1. **Performance**
- Use `autoUpdate={false}` when you don't need real-time updates
- Implement manual update triggers for better user control
- Consider caching location data to reduce API calls

### 2. **User Experience**
- Always show loading indicators for better UX
- Provide clear error messages when location fails
- Give users control over location sharing

### 3. **Privacy**
- Respect user's location sharing preferences
- Only request location when necessary
- Provide clear explanations of why location is needed

### 4. **Accessibility**
- Include proper accessibility labels
- Ensure sufficient color contrast
- Support screen readers

## Troubleshooting

### Common Issues

**Location not updating:**
- Check if location sharing is enabled in AuthContext
- Verify location permissions are granted
- Ensure device has GPS enabled

**Error messages:**
- Check network connectivity
- Verify location services are enabled
- Review permission settings

**Styling issues:**
- Ensure theme is properly configured
- Check responsive utilities are imported
- Verify style props are correctly applied

## Migration from Original Component

If you were using the original `NearestCity` component:

### Before (Original)
```tsx
import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';

export default function NearestCity() {
  // Manual location handling
  // Direct expo-location usage
  // No integration with existing services
}
```

### After (Integrated)
```tsx
import { NearestCity } from '../src/components/ui';

export default function MyScreen() {
  return (
    <NearestCity 
      onLocationUpdate={(location) => {
        // Integrates with your existing services
        console.log('Location updated:', location);
      }}
    />
  );
}
```

## Benefits of Integration

### ✅ **Consistency**
- Uses your existing location service
- Follows your app's design patterns
- Integrates with your theme system

### ✅ **Reliability**
- Leverages your tested location infrastructure
- Uses your error handling patterns
- Integrates with your permission system

### ✅ **Maintainability**
- Centralized location logic
- Consistent API across components
- Easy to update and extend

### ✅ **User Experience**
- Seamless integration with your app
- Consistent loading and error states
- Respects user preferences

The `NearestCity` component is now fully integrated with your dating app's architecture and ready to use across all your screens! 