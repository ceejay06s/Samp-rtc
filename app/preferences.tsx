import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { isDesktopBrowser } from '../src/utils/platform';
import { getResponsiveFontSize, getResponsiveSpacing, isBreakpoint } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

interface PreferenceSection {
  key: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'range' | 'select' | 'multi-select';
  value?: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export default function PreferencesScreen() {
  const theme = useTheme();
  const isDesktop = isBreakpoint.xl || isDesktopBrowser();

  // State for preferences
  const [ageRange, setAgeRange] = useState({ min: 18, max: 35 });
  const [maxDistance, setMaxDistance] = useState(25);
  const [showMen, setShowMen] = useState(true);
  const [showWomen, setShowWomen] = useState(true);
  const [showNonBinary, setShowNonBinary] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

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

  const handleSave = () => {
    // Here you would typically save preferences to backend
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
      />
    </View>
  );

  const renderRangeItem = (title: string, subtitle: string, value: { min: number; max: number }, onValueChange: (value: { min: number; max: number }) => void, icon: string) => (
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
        <Text style={[
          styles.rangeValue,
          { color: theme.colors.primary },
          isDesktop && { fontSize: getDesktopFontSize('md') }
        ]}>
          {value.min} - {value.max}
        </Text>
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: theme.colors.surfaceVariant }
          ]}
          onPress={() => {
            // In a real app, this would open a range picker
            Alert.alert('Age Range', 'This would open an age range picker');
          }}
        >
          <Text style={[
            styles.editButtonText,
            { color: theme.colors.primary },
            isDesktop && { fontSize: getDesktopFontSize('sm') }
          ]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDistanceItem = (title: string, subtitle: string, value: number, onValueChange: (value: number) => void, icon: string) => (
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
        <Text style={[
          styles.rangeValue,
          { color: theme.colors.primary },
          isDesktop && { fontSize: getDesktopFontSize('md') }
        ]}>
          {value} km
        </Text>
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: theme.colors.surfaceVariant }
          ]}
          onPress={() => {
            Alert.alert('Distance', 'This would open a distance picker');
          }}
        >
          <Text style={[
            styles.editButtonText,
            { color: theme.colors.primary },
            isDesktop && { fontSize: getDesktopFontSize('sm') }
          ]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Age Range
        </Text>
        {renderRangeItem(
          'Age Range',
          'Set your preferred age range for matches',
          ageRange,
          setAgeRange,
          '🎂'
        )}
      </Card>

      {/* Distance */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Distance
        </Text>
        {renderDistanceItem(
          'Maximum Distance',
          'Set how far to look for matches',
          maxDistance,
          setMaxDistance,
          '📍'
        )}
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

      {/* Privacy */}
      <Card style={[styles.sectionCard, isDesktop && styles.desktopSectionCard]} variant="elevated">
        <Text style={[
          styles.sectionTitle,
          { color: theme.colors.text },
          isDesktop && { fontSize: getDesktopFontSize('lg') }
        ]}>
          Privacy
        </Text>
        {renderToggleItem(
          'Location Sharing',
          'Allow others to see your approximate location',
          locationSharing,
          () => setLocationSharing(!locationSharing),
          '📍'
        )}
      </Card>

      {/* Save Button */}
      <View style={[
        styles.saveContainer,
        isDesktop && styles.desktopSaveContainer
      ]}>
        <Button
          title="Save Preferences"
          onPress={handleSave}
          variant="gradient"
          gradient="primary"
          size={isDesktop ? "large" : "medium"}
          style={[
            styles.saveButton,
            isDesktop && styles.desktopSaveButton
          ]}
        />
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
  },
  rangeValue: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('xs'),
  },
  editButton: {
    paddingVertical: getResponsiveSpacing('xs'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('xs'),
  },
  editButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
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
}); 