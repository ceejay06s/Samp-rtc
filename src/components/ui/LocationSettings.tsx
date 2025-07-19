import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { LocationData, LocationService } from '../../services/locationService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { WebAlert } from './WebAlert';

interface LocationSettingsProps {
  userId?: string;
  currentLocation?: string;
  onLocationUpdate?: (location: LocationData) => void;
  isWeb?: boolean;
}

export const LocationSettings: React.FC<LocationSettingsProps> = ({
  userId,
  currentLocation,
  onLocationUpdate,
  isWeb = false,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [lastDetectedLocation, setLastDetectedLocation] = useState<LocationData | null>(null);

  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWeb) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const detectCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        setLastDetectedLocation(location);
        showAlert(
          'Location Detected',
          `Current location: ${location.formattedAddress || location.address}`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Update Profile',
              onPress: () => saveLocationToProfile(location),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      showAlert('Location Error', 'Unable to detect your current location. Please check location permissions.');
    } finally {
      setLoading(false);
    }
  };

  const saveLocationToProfile = async (location: LocationData) => {
    if (!userId) {
      showAlert('Error', 'Please log in to save your location.');
      return;
    }

    try {
      setLoading(true);
      const success = await LocationService.saveLocationToProfile(userId, location);
      
      if (success) {
        showAlert('Success', 'Your location has been updated in your profile!');
        onLocationUpdate?.(location);
      } else {
        showAlert('Error', 'Failed to update your profile location. Please try again.');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      showAlert('Error', 'Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const autoDetectAndSave = async () => {
    if (!userId) {
      showAlert('Error', 'Please log in to save your location.');
      return;
    }

    try {
      setLoading(true);
      const location = await LocationService.getCurrentLocationAndSave(userId, true);
      
      if (location) {
        setLastDetectedLocation(location);
        showAlert('Location Updated', `Your profile location has been automatically updated to: ${location.formattedAddress || location.address}`);
        onLocationUpdate?.(location);
      }
    } catch (error) {
      console.error('Error auto-detecting location:', error);
      showAlert('Location Error', 'Unable to detect and save your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Location Settings</Text>
      
      {currentLocation && (
        <View style={[styles.currentLocationContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.currentLocationIcon, { color: theme.colors.primary }]}>📍</Text>
          <View style={styles.currentLocationText}>
            <Text style={[styles.currentLocationLabel, { color: theme.colors.textSecondary }]}>
              Current profile location:
            </Text>
            <Text style={[styles.currentLocationValue, { color: theme.colors.text }]}>
              {currentLocation}
            </Text>
          </View>
        </View>
      )}

      {lastDetectedLocation && (
        <View style={[styles.detectedLocationContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.detectedLocationIcon, { color: theme.colors.primary }]}>🎯</Text>
          <View style={styles.detectedLocationText}>
            <Text style={[styles.detectedLocationLabel, { color: theme.colors.textSecondary }]}>
              Last detected location:
            </Text>
            <Text style={[styles.detectedLocationValue, { color: theme.colors.text }]}>
              {lastDetectedLocation.formattedAddress || lastDetectedLocation.address}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Detecting..." : "Detect Current Location"}
          onPress={detectCurrentLocation}
          variant="outline"
          size="medium"
          style={styles.button}
          disabled={loading}
        />

        <Button
          title={loading ? "Updating..." : "Auto-Update Profile Location"}
          onPress={autoDetectAndSave}
          variant="gradient"
          gradient="primary"
          size="medium"
          style={styles.button}
          disabled={loading}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Getting your location...
          </Text>
        </View>
      )}

      <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
        💡 Your location helps us find better matches near you and improve location-based features.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: getResponsiveSpacing('md'),
  },
  title: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
    textAlign: 'center',
  },
  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  currentLocationIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('sm'),
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  currentLocationValue: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  detectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
  },
  detectedLocationIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('sm'),
  },
  detectedLocationText: {
    flex: 1,
  },
  detectedLocationLabel: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  detectedLocationValue: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  buttonContainer: {
    gap: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('md'),
  },
  button: {
    marginVertical: getResponsiveSpacing('xs'),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: getResponsiveSpacing('md'),
  },
  loadingText: {
    fontSize: getResponsiveFontSize('md'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  helpText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize('sm') * 1.4,
    fontStyle: 'italic',
  },
}); 