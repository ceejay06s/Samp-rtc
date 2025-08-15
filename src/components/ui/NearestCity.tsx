import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LocationData, LocationService } from '../../services/locationService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface NearestCityProps {
  showLoading?: boolean;
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: string) => void;
  autoUpdate?: boolean;
  style?: any;
}

export const NearestCity: React.FC<NearestCityProps> = ({
  showLoading = true,
  onLocationUpdate,
  onError,
  autoUpdate = true,
  style,
}) => {
  const theme = useTheme();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const locationData = await LocationService.getCurrentLocation();
      
      if (locationData) {
        setLocation(locationData);
        onLocationUpdate?.(locationData);
      } else {
        throw new Error('Unable to get current location');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoUpdate) {
      getCurrentLocation();
    }
  }, [autoUpdate]);

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
    </View>
  );
};

export default NearestCity; 