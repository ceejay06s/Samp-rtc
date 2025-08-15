import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LocationData } from '../../services/locationService';
import { getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { NearestCity } from './NearestCity';

export const NearestCityExample: React.FC = () => {
  const theme = useTheme();
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleLocationUpdate = (location: LocationData) => {
    console.log('📍 Location updated:', location);
    setLastLocation(location);
  };

  const handleLocationError = (error: string) => {
    console.error('❌ Location error:', error);
  };

  const styles = StyleSheet.create({
    container: {
      padding: getResponsiveSpacing('lg'),
      backgroundColor: theme.colors.background,
    },
    section: {
      marginBottom: getResponsiveSpacing('lg'),
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: getResponsiveSpacing('md'),
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: getResponsiveSpacing('sm'),
    },
    locationInfo: {
      backgroundColor: theme.colors.secondary,
      padding: getResponsiveSpacing('md'),
      borderRadius: 8,
      marginTop: getResponsiveSpacing('sm'),
    },
    locationText: {
      color: theme.colors.text,
      fontSize: 12,
    },
  });

  return (
    <View style={styles.container}>
      {/* Basic Usage */}
      <View style={styles.section}>
        <Text style={styles.title}>📍 Nearest City</Text>
        <Text style={styles.subtitle}>Automatically detects and displays your nearest city name</Text>
        <NearestCity 
          showLoading={true}
          onLocationUpdate={handleLocationUpdate}
          onError={handleLocationError}
        />
      </View>

      {/* Manual Update Example */}
      <View style={styles.section}>
        <Text style={styles.title}>🔄 Manual Location Update</Text>
        <Text style={styles.subtitle}>Component with auto-update disabled for manual control</Text>
        <NearestCity 
          showLoading={false}
          autoUpdate={false}
          onLocationUpdate={handleLocationUpdate}
          onError={handleLocationError}
        />
        <Button 
          title="Update Location" 
          onPress={() => {
            // This would trigger a manual location update
            console.log('Manual location update requested');
          }}
          variant="secondary"
          size="small"
        />
      </View>

      {/* Location Data Display */}
      {lastLocation && (
        <View style={styles.section}>
          <Text style={styles.title}>📊 Location Data</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              <Text style={{ fontWeight: 'bold' }}>Coordinates:</Text> {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              <Text style={{ fontWeight: 'bold' }}>Address:</Text> {lastLocation.formattedAddress || lastLocation.address || 'Not available'}
            </Text>
            {lastLocation.name && (
              <Text style={styles.locationText}>
                <Text style={{ fontWeight: 'bold' }}>Name:</Text> {lastLocation.name}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Usage in Dating App Context */}
      <View style={styles.section}>
        <Text style={styles.title}>💕 Dating App Integration</Text>
        <Text style={styles.subtitle}>How this component integrates with your dating app features</Text>
        
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            • <Text style={{ fontWeight: 'bold' }}>Match Discovery:</Text> Shows your current location for nearby matches
          </Text>
          <Text style={styles.locationText}>
            • <Text style={{ fontWeight: 'bold' }}>Profile Updates:</Text> Automatically updates user profile with current location
          </Text>
          <Text style={styles.locationText}>
            • <Text style={{ fontWeight: 'bold' }}>Distance Calculations:</Text> Enables accurate distance-based matching
          </Text>
          <Text style={styles.locationText}>
            • <Text style={{ fontWeight: 'bold' }}>Privacy Control:</Text> Users can disable location sharing in preferences
          </Text>
        </View>
      </View>
    </View>
  );
};

export default NearestCityExample; 