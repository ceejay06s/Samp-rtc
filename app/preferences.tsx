import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { RangeSlider } from '../src/components/ui/RangeSlider';
import { SingleSlider } from '../src/components/ui/Slider';
import { usePlatform } from '../src/hooks/usePlatform';
import { useViewport } from '../src/hooks/useViewport';
import { AuthService, ProfileUpdateData } from '../src/services/auth';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

// Age range constraints - matching database schema
const AGE_MIN_RANGE = 18;   // Minimum allowed age (database constraint)
const AGE_MAX_RANGE = 100;  // Maximum allowed age (database constraint)

/*
 * Age Range Implementation:
 * - age_min, age_max: User's selected values from Supabase (currentProfile.min_age, currentProfile.max_age)
 * - min_range, max_range: Slider boundaries/defaults (like HTML input min/max attributes)
 * - Database constraints: CHECK (min_age >= 18), CHECK (max_age <= 100)
 */

export default function PreferencesScreen() {
  const theme = useTheme();
  const { 
    user, 
    profile: currentProfile, 
    loading: authLoading, 
    refreshProfile,
    locationSharing,
    setLocationSharing,
    manualLocationUpdate 
  } = useAuth();
  const { isAndroid, isIOS, isWeb } = usePlatform();
  const { width: viewportWidth, isBreakpoint } = useViewport();
  
  const isDesktop = isBreakpoint.xl || isWeb;

  // State for preferences - defaults match database schema
  const [ageRange, setAgeRange] = useState({ min: AGE_MIN_RANGE, max: AGE_MAX_RANGE });
  const [maxDistance, setMaxDistance] = useState(25);
  const [showMen, setShowMen] = useState(true);
  const [showWomen, setShowWomen] = useState(true);
  const [showNonBinary, setShowNonBinary] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  // locationSharing is now managed by AuthContext

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current preferences from user profile
  const loadPreferences = useCallback(async () => {
    if (!currentProfile) {
      setError('Please complete your profile to access preferences');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set preferences from current profile - age_min and age_max from Supabase
      setAgeRange({
        min: currentProfile.min_age || AGE_MIN_RANGE,  // Default min_range from database constraint
        max: currentProfile.max_age || AGE_MAX_RANGE   // Default max_range from database constraint
      });
      setMaxDistance(currentProfile.max_distance || 25);
      
      // Set gender preferences
      const lookingFor = currentProfile.looking_for || [];
      setShowMen(lookingFor.includes('male'));
      setShowWomen(lookingFor.includes('female'));
      setShowNonBinary(lookingFor.includes('non-binary'));

      // Note: These would come from a separate preferences table in a real app
      // For now, we'll use defaults
      setShowOnlineOnly(false);
      setShowVerifiedOnly(false);
      setNotifications(true);
      setEmailNotifications(true);
      // locationSharing is now managed by AuthContext

    } catch (error) {
      console.error('Failed to load preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    if (!authLoading && currentProfile) {
      loadPreferences();
    } else if (!authLoading && !currentProfile) {
      setLoading(false);
      setError('Please complete your profile to access preferences');
    }
  }, [authLoading, currentProfile]);

  const getDesktopFontSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const fontSizeMap = {
        xs: 16,
        sm: 18,
        md: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
      };
      return fontSizeMap[size];
    }
    return getResponsiveFontSize(size);
  };

  const getDesktopSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl') => {
    if (isDesktop) {
      const spacingMap = {
        xs: 8,
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
        xxl: 64,
      };
      return spacingMap[size];
    }
    return getResponsiveSpacing(size);
  };

  // Format location to show only city and state
  const formatLocationDisplay = (location?: string, latitude?: number, longitude?: number): string => {
    if (!location && (!latitude || !longitude)) {
      return 'Location not available';
    }

    if (location) {
      // Parse the location string to extract city and state
      // Common formats: "City, State, Country" or "Street, City, State, Country"
      const parts = location.split(',').map(part => part.trim());
      
      if (parts.length >= 2) {
        // Find the state part (usually contains state abbreviation or full name)
        // Look for the last part that looks like a state (2-3 chars or common state names)
        const statePattern = /^[A-Z]{2}$|^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$/i;
        
        for (let i = parts.length - 1; i >= 0; i--) {
          if (statePattern.test(parts[i])) {
            // Found state, get city (usually the part before state)
            const stateIndex = i;
            const cityIndex = stateIndex - 1;
            
            if (cityIndex >= 0) {
              return `${parts[cityIndex]}, ${parts[stateIndex]}`;
            } else {
              return parts[stateIndex]; // Just state if no city found
            }
          }
        }
        
        // Fallback: assume last two parts are city and state/country
        if (parts.length >= 2) {
          return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
        }
      }
      
      // Fallback: return first part if parsing fails
      return parts[0] || location;
    }

    // Fallback to coordinates if location string is not available
    return `${latitude?.toFixed(2)}, ${longitude?.toFixed(2)}`;
  };

  const handleSave = async () => {
    if (!user || !currentProfile) {
      Alert.alert('Error', 'Please complete your profile to save preferences');
      return;
    }

    // Validate that at least one gender preference is selected
    const selectedGenders = [];
    if (showMen) selectedGenders.push('male');
    if (showWomen) selectedGenders.push('female');
    if (showNonBinary) selectedGenders.push('non-binary');

    if (selectedGenders.length === 0) {
      Alert.alert('Error', 'Please select at least one gender preference');
      return;
    }

    // Validate age range is within database constraints
    if (ageRange.min < AGE_MIN_RANGE || ageRange.max > AGE_MAX_RANGE) {
      Alert.alert('Error', `Age range must be between ${AGE_MIN_RANGE} and ${AGE_MAX_RANGE} years`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData: ProfileUpdateData = {
        min_age: ageRange.min,  // age_min to save to Supabase
        max_age: ageRange.max,  // age_max to save to Supabase
        max_distance: maxDistance,
        looking_for: selectedGenders,
      };

      await AuthService.updateProfile(user.id, updateData);
      await refreshProfile(); // Refresh profile in context

      Alert.alert(
        'Preferences Saved',
        'Your dating preferences have been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preferences';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderToggleItem = (title: string, subtitle: string, value: boolean, onToggle: () => void, icon: string) => (
    <View style={[
      styles.preferenceItem,
      isDesktop && styles.desktopPreferenceItem
    ]}>
      <View style={styles.preferenceLeft}>
        <Text style={[
          styles.preferenceIcon,
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          {icon}
        </Text>
        <View style={styles.preferenceTextContainer}>
          <Text style={[
            styles.preferenceTitle,
            { color: theme.colors.text },
            isDesktop && { fontSize: getDesktopFontSize('md') }
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.preferenceSubtitle,
            { color: theme.colors.textSecondary },
            isDesktop && { fontSize: getDesktopFontSize('sm') }
          ]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
        disabled={saving}
      />
    </View>
  );

  const renderRangeSlider = (title: string, subtitle: string, value: { min: number; max: number }, onValueChange: (min: number, max: number) => void, icon: string, minRange?: number, maxRange?: number, step?: number) => (
    <View style={[
      styles.preferenceItem,
      isDesktop && styles.desktopPreferenceItem
    ]}>
      <View style={styles.preferenceLeft}>
        <Text style={[
          styles.preferenceIcon,
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          {icon}
        </Text>
        <View style={styles.preferenceTextContainer}>
          <Text style={[
            styles.preferenceTitle,
            { color: theme.colors.text },
            isDesktop && { fontSize: getDesktopFontSize('md') }
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.preferenceSubtitle,
            { color: theme.colors.textSecondary },
            isDesktop && { fontSize: getDesktopFontSize('sm') }
          ]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.rangeContainer}>
        <RangeSlider
          minValue={value.min}
          maxValue={value.max}
          onValueChange={onValueChange}
          minRange={minRange}
          maxRange={maxRange}
          step={step}
          showValues={false}
        />
      </View>
    </View>
  );



  // Auth loading state
  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            styles.title,
            { color: theme.colors.text },
            isDesktop && { fontSize: getDesktopFontSize('xxl') }
          ]}>
            Dating Preferences
          </Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your profile...
          </Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            styles.title,
            { color: theme.colors.text },
            isDesktop && { fontSize: getDesktopFontSize('xxl') }
          ]}>
            Dating Preferences
          </Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your preferences...
          </Text>
        </View>
      </View>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            styles.title,
            { color: theme.colors.text },
            isDesktop && { fontSize: getDesktopFontSize('xxl') }
          ]}>
            Dating Preferences
          </Text>
        </View>
        
        <Card style={styles.errorCard}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Please Log In
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            You need to be logged in to access your preferences.
          </Text>
          <Button
            title="Go to Login"
            onPress={() => router.push('/login')}
            variant="primary"
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            styles.title,
            { color: theme.colors.text },
            isDesktop && { fontSize: getDesktopFontSize('xxl') }
          ]}>
            Dating Preferences
          </Text>
        </View>
        
        <Card style={styles.errorCard}>
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <Button
            title="Try Again"
            onPress={loadPreferences}
            variant="primary"
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.desktopContent
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        
        <Text style={[
          styles.title,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('xxl') }
        ]}>
          Dating Preferences
        </Text>
        <Text style={[
          styles.subtitle,
          { color: theme.colors.textSecondary },
          isDesktop && { fontSize: getDesktopFontSize('md') }
        ]}>
          Customize your matching criteria
        </Text>
      </View>

      {/* Age Range */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <Text style={[
              styles.preferenceIcon,
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              🎂
            </Text>
            <View style={styles.preferenceTextContainer}>
              <Text style={[
                styles.preferenceTitle,
                { color: theme.colors.text },
                isDesktop && { fontSize: getDesktopFontSize('md') }
              ]}>
                Age Range
              </Text>
              <Text style={[
                styles.preferenceSubtitle,
                { color: theme.colors.textSecondary },
                isDesktop && { fontSize: getDesktopFontSize('sm') }
              ]}>
                Set your preferred age range for matches
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.ageSliderContainer}>
          <RangeSlider
            minValue={ageRange.min}  // age_min from Supabase
            maxValue={ageRange.max}  // age_max from Supabase
            onValueChange={(min: number, max: number) => setAgeRange({ min, max })}
            minRange={AGE_MIN_RANGE}   // min_range default (like HTML input min)
            maxRange={AGE_MAX_RANGE}   // max_range default (like HTML input max)
            step={1}
            showValues={true}
            minLabel={`${ageRange.min} years`}
            maxLabel={`${ageRange.max} years`}
            disabled={saving}
          />
        </View>
      </Card>

      {/* Distance */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <View style={styles.distanceHeader}>
          <View style={styles.distanceHeaderLeft}>
            <Text style={[
              styles.preferenceIcon,
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              📍
            </Text>
            <View style={styles.preferenceTextContainer}>
              <Text style={[
                styles.sectionTitle,
                { color: theme.colors.text },
                isDesktop && { fontSize: getDesktopFontSize('lg') }
              ]}>
                Maximum Distance
              </Text>
              <Text style={[
                styles.distanceSubtitle,
                { color: theme.colors.textSecondary },
                isDesktop && { fontSize: getDesktopFontSize('sm') }
              ]}>
                Set how far to look for matches
              </Text>
            </View>
          </View>
          <View style={[
            styles.distanceValueContainer,
            { backgroundColor: theme.colors.surface }
          ]}>
            <Text style={[
              styles.distanceValue,
              { color: theme.colors.primary },
              isDesktop && { fontSize: getDesktopFontSize('lg') }
            ]}>
              {maxDistance}
            </Text>
            <Text style={[
              styles.distanceUnit,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('sm') }
            ]}>
              miles
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.mobileDistanceSliderContainer,
          isDesktop && styles.desktopDistanceSliderContainer
        ]}>
          <SingleSlider
            value={maxDistance}
            onValueChange={setMaxDistance}
            minValue={1}
            maxValue={100}
            step={5}
            disabled={saving}
            showValue={false}
          />
          <View style={styles.distanceLabels}>
            <Text style={[
              styles.distanceLabel,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('xs') }
            ]}>
              1 mile
            </Text>
            <Text style={[
              styles.distanceLabel,
              { color: theme.colors.textSecondary },
              isDesktop && { fontSize: getDesktopFontSize('xs') }
            ]}>
              100 miles
            </Text>
          </View>
        </View>
      </Card>

      {/* Gender Preferences */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Show Me
        </Text>
        {renderToggleItem(
          'Men',
          'Show profiles of men',
          showMen,
          () => setShowMen(!showMen),
          '👨'
        )}
        {renderToggleItem(
          'Women',
          'Show profiles of women',
          showWomen,
          () => setShowWomen(!showWomen),
          '👩'
        )}
        {renderToggleItem(
          'Non-Binary',
          'Show profiles of non-binary people',
          showNonBinary,
          () => setShowNonBinary(!showNonBinary),
          '🌈'
        )}
      </Card>

      {/* Filters */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Filters
        </Text>
        {renderToggleItem(
          'Online Only',
          'Show only users who are currently online',
          showOnlineOnly,
          () => setShowOnlineOnly(!showOnlineOnly),
          '🟢'
        )}
        {renderToggleItem(
          'Verified Only',
          'Show only verified profiles',
          showVerifiedOnly,
          () => setShowVerifiedOnly(!showVerifiedOnly),
          '✅'
        )}
      </Card>

      {/* Notifications */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Notifications
        </Text>
        {renderToggleItem(
          'Push Notifications',
          'Receive notifications for new matches and messages',
          notifications,
          () => setNotifications(!notifications),
          '🔔'
        )}
        {renderToggleItem(
          'Email Notifications',
          'Receive email updates about your account',
          emailNotifications,
          () => setEmailNotifications(!emailNotifications),
          '📧'
        )}
      </Card>

      {/* Privacy & Location */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Privacy & Location
        </Text>
        
        {/* Location Sharing Toggle */}
        {renderToggleItem(
          'Location Sharing',
          locationSharing 
            ? 'Your location is automatically updated for better matches'
            : 'Enable to find matches near you and update location automatically',
          locationSharing,
          () => setLocationSharing(!locationSharing),
          '📍'
        )}

        {/* Location Status and Manual Update */}
        {locationSharing && (
          <View style={styles.locationInfoContainer}>
            <View style={styles.locationStatus}>
              <Text style={[styles.locationStatusIcon, { color: theme.colors.success }]}>✅</Text>
              <View style={styles.locationStatusText}>
                <Text style={[styles.locationStatusTitle, { color: theme.colors.text }]}>
                  Auto-location is active
                </Text>
                <Text style={[styles.locationStatusSubtitle, { color: theme.colors.textSecondary }]}>
                  Your location updates automatically when you open the app
                </Text>
                {currentProfile?.latitude && currentProfile?.longitude && (
                  <Text style={[styles.currentLocationText, { color: theme.colors.textSecondary }]}>
                    📍 Current: {formatLocationDisplay(currentProfile.location, currentProfile.latitude, currentProfile.longitude)}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.manualUpdateButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                manualLocationUpdate();
                Alert.alert('Location Update', 'Updating your location...');
              }}
            >
              <Text style={[styles.manualUpdateButtonText, { color: '#fff' }]}>
                📍 Update Now
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location Disabled Info */}
        {!locationSharing && (
          <View style={[styles.locationDisabledContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.locationDisabledIcon, { color: theme.colors.textSecondary }]}>⚠️</Text>
            <View style={styles.locationDisabledText}>
              <Text style={[styles.locationDisabledTitle, { color: theme.colors.text }]}>
                Location sharing is disabled
              </Text>
              <Text style={[styles.locationDisabledSubtitle, { color: theme.colors.textSecondary }]}>
                Enable to find better matches near you and allow automatic location updates
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Save Button */}
      <View style={[
        styles.saveContainer,
        isDesktop && styles.desktopSaveContainer
      ]}>
        <Button
          title={saving ? "Saving..." : "Save Preferences"}
          onPress={handleSave}
          variant="gradient"
          gradient="primary"
          size={isDesktop ? "large" : "medium"}
          style={[
            styles.saveButton,
            isDesktop && styles.desktopSaveButton
          ]}
          disabled={saving}
        />
        {saving && (
          <ActivityIndicator 
            size="small" 
            color={theme.colors.primary} 
            style={{ marginTop: theme.spacing.md }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: getResponsiveSpacing('lg'),
    paddingTop: 60,
    paddingBottom: 40,
  },
  desktopContent: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: getResponsiveSpacing('xxl'),
  },
  header: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  backButton: {
    marginBottom: getResponsiveSpacing('md'),
  },
  backButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  title: {
    fontSize: getResponsiveFontSize('xxl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
  },
  subtitle: {
    fontSize: getResponsiveFontSize('md'),
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  errorCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionCard: {
    marginBottom: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('md'),
  },
  desktopSectionCard: {
    padding: getResponsiveSpacing('lg'),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '700',
    marginBottom: getResponsiveSpacing('md'),
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  desktopPreferenceItem: {
    paddingVertical: getResponsiveSpacing('lg'),
    paddingHorizontal: getResponsiveSpacing('md'),
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('md'),
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '400',
  },
  rangeContainer: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  rangeValue: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('xs'),
    textAlign: 'center',
  },
  sliderContainer: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  ageSliderContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingTop: getResponsiveSpacing('sm'),
  },
  saveContainer: {
    marginTop: getResponsiveSpacing('lg'),
    alignItems: 'center',
  },
  desktopSaveContainer: {
    marginTop: getResponsiveSpacing('xl'),
  },
  saveButton: {
    minWidth: 200,
  },
  desktopSaveButton: {
    minWidth: 250,
  },

  // New styles for Privacy & Location section
  locationInfoContainer: {
    marginTop: getResponsiveSpacing('md'),
    padding: getResponsiveSpacing('md'),
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  locationStatusIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('md'),
  },
  locationStatusText: {
    flex: 1,
  },
  locationStatusTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: 2,
  },
  locationStatusSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '400',
  },
  currentLocationText: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: 4,
  },
  manualUpdateButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualUpdateButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  locationDisabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    borderRadius: 12,
    marginTop: getResponsiveSpacing('md'),
  },
  locationDisabledIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('md'),
  },
  locationDisabledText: {
    flex: 1,
  },
  locationDisabledTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: 2,
  },
  locationDisabledSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '400',
  },

  // New styles for Distance section
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing('lg'),
  },
  distanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distanceHeaderText: {
    marginLeft: getResponsiveSpacing('md'),
  },
  distanceSubtitle: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '400',
    marginTop: 2,
  },
  distanceValueContainer: {
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 12,
    minWidth: 80,
  },
  distanceValue: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: '700',
    lineHeight: getResponsiveFontSize('xl') * 1.2,
  },
  distanceUnit: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
    marginTop: -2,
  },
  mobileDistanceSliderContainer: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('md'),
  },
  desktopDistanceSliderContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('lg'),
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('xs'),
  },
  distanceLabel: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
  },

}); 