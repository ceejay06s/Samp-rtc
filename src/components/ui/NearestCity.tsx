import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocationData, LocationService } from '../../services/locationService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface NearestCityProps {
  showLoading?: boolean;
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: string) => void;
  autoUpdate?: boolean;
  style?: any;
  // New props for using profile coordinates
  latitude?: number;
  longitude?: number;
  useProfileCoordinates?: boolean;
}

export const NearestCity: React.FC<NearestCityProps> = ({
  showLoading = true,
  onLocationUpdate,
  onError,
  autoUpdate = true,
  style,
  // New props for using profile coordinates
  latitude,
  longitude,
  useProfileCoordinates = false,
}) => {
  const theme = useTheme();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let locationData: LocationData | null = null;
      
      if (useProfileCoordinates && latitude && longitude) {
        console.log('📍 NearestCity: Using profile coordinates:', { latitude, longitude });
        
        // Use reverse geocoding with profile coordinates
        const address = await LocationService.reverseGeocode(latitude, longitude);
        
        if (address) {
          locationData = {
            latitude,
            longitude,
            address: address,
            formattedAddress: address,
            addressData: undefined, // We'll parse this if needed
            name: undefined
          };
          
          console.log('✅ NearestCity: Profile coordinates reverse geocoded successfully:', locationData);
        } else {
          throw new Error('Unable to reverse geocode profile coordinates');
        }
      } else {
        console.log('📍 NearestCity: Getting current location...');
        console.log('📍 NearestCity: Requesting permissions...');
        
        locationData = await LocationService.getCurrentLocation();
      }
      
      if (locationData) {
        console.log('✅ NearestCity: Location obtained successfully:', locationData);
        console.log('📍 NearestCity: Address data:', locationData.addressData);
        console.log('📍 NearestCity: Formatted address:', locationData.formattedAddress);
        
        // Check if we're using fallback data
        const isFallback = locationData.formattedAddress?.includes('Coordinates:') || 
                          locationData.addressData?.city === 'Unknown City';
        setIsUsingFallback(isFallback);
        
        setLocation(locationData);
        onLocationUpdate?.(locationData);
      } else {
        console.warn('⚠️ NearestCity: No location data returned');
        throw new Error('Unable to get location data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ NearestCity: Location error:', errorMessage);
      console.error('❌ NearestCity: Full error object:', error);
      
      // Provide more user-friendly error messages
      let userFriendlyError = 'Location unavailable';
      if (errorMessage.includes('Network not available')) {
        userFriendlyError = 'Internet connection issue';
      } else if (errorMessage.includes('Nominatim API not accessible')) {
        userFriendlyError = 'Location services temporarily unavailable';
      } else if (errorMessage.includes('permission')) {
        userFriendlyError = 'Location permission denied';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Location request timed out';
      } else if (errorMessage.includes('No geocoding services accessible')) {
        userFriendlyError = 'Using offline location mode';
      }
      
      setError(userFriendlyError);
      onError?.(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoUpdate && !useProfileCoordinates) {
      getCurrentLocation();
    } else if (useProfileCoordinates && latitude && longitude) {
      // If using profile coordinates, get location immediately
      getCurrentLocation();
    }
  }, [autoUpdate, useProfileCoordinates, latitude, longitude]);

  // Get display text in city, state, country format
  const getDisplayText = () => {
    if (error) {
      return `Error: ${error}`;
    }
    
    if (!location) {
      return 'Location not available';
    }

    // Try to get city, state, country from structured address data first
    if (location.addressData && typeof location.addressData === 'object') {
      const addressData = location.addressData;
      
      // Extract city, state, and country
      const city = addressData.city || addressData.town || addressData.village || addressData.municipality;
      const state = addressData.state || addressData.county || addressData.region;
      const country = addressData.country;
      
      // Build the display string
      const parts = [];
      if (city) parts.push(city);
      if (state) parts.push(state);
      if (country) parts.push(country);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    // Fallback to parsing formatted address
    const address = location.formattedAddress || location.address;
    
    if (address && typeof address === 'string') {
      // Check if it's just coordinates (fallback case)
      if (address.includes('Coordinates:')) {
        return '📍 Current Location';
      }
      
      // Split address by commas and extract city, state, country
      const parts = address.split(',').map(part => part.trim());
      
      // Look for city, state, country pattern
      const extractedParts = [];
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Skip if it's likely a street address (contains numbers or common street words)
        if (/\d/.test(part) || 
            ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr', 'lane', 'ln', 'suburb', 'district', 'postcode', 'zip'].some(word => 
              part.toLowerCase().includes(word)
            )) {
          continue;
        }
        
        // If this part looks like a location name (no numbers, reasonable length)
        if (part.length > 2 && part.length < 50 && !/\d/.test(part)) {
          extractedParts.push(part);
          
          // Limit to 3 parts (city, state, country)
          if (extractedParts.length >= 3) {
            break;
          }
        }
      }
      
      if (extractedParts.length > 0) {
        return extractedParts.join(', ');
      }
    }

    // If we have a name field, use that
    if (location.name) {
      return location.name;
    }

    // Last resort: show "Unknown Location"
    return 'Unknown Location';
  };

  const styles = StyleSheet.create({
    container: {
      padding: getResponsiveSpacing('md'),
      alignItems: 'flex-start',
      justifyContent: 'center',
      ...style,
    },
    text: {
      fontSize: getResponsiveFontSize('md'),
      color: theme.colors.text,
      textAlign: 'left',
      flexWrap: 'wrap',
      flexShrink: 1,
    },
    errorText: {
      fontSize: getResponsiveFontSize('md'),
      color: theme.colors.error || '#ff4444',
      textAlign: 'left',
      flexWrap: 'wrap',
      flexShrink: 1,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveSpacing('sm'),
      flexWrap: 'wrap',
    },
    retryButton: {
      marginTop: getResponsiveSpacing('sm'),
      paddingVertical: getResponsiveSpacing('sm'),
      paddingHorizontal: getResponsiveSpacing('md'),
      backgroundColor: theme.colors.primary,
      borderRadius: getResponsiveSpacing('sm'),
    },
    retryText: {
      color: theme.colors.onPrimary,
      fontSize: getResponsiveFontSize('md'),
      fontWeight: 'bold',
    },
    fallbackText: {
      marginTop: getResponsiveSpacing('sm'),
      textAlign: 'left',
    },
  });

  if (loading && showLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.text}>Detecting location...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={error ? styles.errorText : styles.text}>
        {error ? getDisplayText() : `📍 ${getDisplayText()}`}
      </Text>
      {isUsingFallback && !error && (
        <Text style={[styles.fallbackText, { color: theme.colors.textSecondary, fontSize: 12 }]}>
          🔄 Using offline location (internet available, location services blocked)
        </Text>
      )}
      {error && (
        <TouchableOpacity 
          onPress={getCurrentLocation}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>🔄 Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NearestCity; 