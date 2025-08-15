import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { DatePicker } from '../src/components/ui/DatePicker';
import { GenderSelector } from '../src/components/ui/GenderSelector';
import { Input } from '../src/components/ui/Input';
import { NearestCity } from '../src/components/ui/NearestCity';
import { PhotoGallery } from '../src/components/ui/PhotoGallery';
import { PhotoUploadWithCrop } from '../src/components/ui/PhotoUploadWithCrop';
import { RangeSlider } from '../src/components/ui/RangeSlider';
import { SingleSlider } from '../src/components/ui/Slider';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { AuthService } from '../src/services/auth';
import { EnhancedPhotoUploadService, PhotoType } from '../src/services/enhancedPhotoUpload';
import { Profile } from '../src/types';

import { calculateAge, formatDateToISO } from '../src/utils/dateUtils';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function ProfileScreen() {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const { user, profile: currentProfile, loading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(100);
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Predefined options
  const interestOptions = [
    'travel', 'music', 'sports', 'cooking', 'reading', 'gaming',
    'photography', 'art', 'dancing', 'hiking', 'coffee', 'wine',
    'movies', 'fitness', 'yoga', 'pets', 'technology', 'fashion'
  ];

  // Helper function to show alerts that work on both web and mobile
  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWeb) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    if (!authLoading && currentProfile) {
      loadProfile();
    }
  }, [currentProfile, authLoading]);

  const loadProfile = async () => {
    if (!currentProfile) return;
    
    try {
      setLoading(true);
      console.log('Loading profile from context:', currentProfile);
      setProfile(currentProfile);
      setFirstName(currentProfile.first_name || '');
      setLastName(currentProfile.last_name || '');
      setBirthdate(currentProfile.birthdate ? new Date(currentProfile.birthdate + 'T00:00:00') : undefined);
      setGender(currentProfile.gender || '');
      console.log('Loaded gender:', currentProfile.gender);
      setBio(currentProfile.bio || '');
      setLocation(currentProfile.location || '');
      setInterests(currentProfile.interests || []);
      setLookingFor(currentProfile.looking_for || []);
      setMaxDistance(currentProfile.max_distance || 50);
      setMinAge(currentProfile.min_age || 18);
      setMaxAge(currentProfile.max_age || 100);
      setPhotos(currentProfile.photos || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
      showAlert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!birthdate) {
      newErrors.birthdate = 'Birthdate is required';
    } else {
      const age = calculateAge(birthdate);
      if (age < 18) {
        newErrors.birthdate = 'You must be at least 18 years old';
      }
    }

    if (!gender) {
      newErrors.gender = 'Gender is required';
    }

    if (bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) {
      showAlert('Error', 'Please log in to save your profile');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const profileData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birthdate: birthdate ? formatDateToISO(birthdate) : undefined,
        gender,
        bio: bio.trim(),
        location: location.trim(),
        interests,
        looking_for: lookingFor,
        max_distance: maxDistance,
        min_age: minAge,
        max_age: maxAge,
        photos,
      };

      await AuthService.updateProfile(user.id, profileData);
      await refreshProfile();
      
      showAlert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showAlert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : prev.length < 7 
          ? [...prev, interest]
          : prev
    );
  };

  const toggleLookingFor = (gender: string) => {
    setLookingFor(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  // New photo upload handler with Edge Function
  const handlePhotoUpload = async (imageUrl: string) => {
    if (!user) {
      showAlert('Error', 'Please log in to add photos');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Add to local state
      setPhotos(prev => [...prev, imageUrl]);
      
      // Save to profile immediately
      await AuthService.updateProfile(user.id, { photos: [...photos, imageUrl] });
      
      // Show success message
      showAlert('Success', 'Photo added successfully!');
      setShowPhotoUpload(false);
    } catch (error) {
      console.error('Failed to add photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to add photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Enhanced photo upload with Edge Function
  const handleEnhancedPhotoUpload = async () => {
    if (!user) {
      showAlert('Error', 'Please log in to add photos');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Show photo picker options
      const photo = await EnhancedPhotoUploadService.showImagePickerOptions();
      if (!photo) {
        setUploadingPhoto(false);
        return;
      }

      // Upload using Edge Function
      const result = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
        photo,
        PhotoType.PROFILE
      );

      if (result.success && result.url) {
        // Add to local state
        setPhotos(prev => [...prev, result.url!]);
        
        // Save to profile immediately
        await AuthService.updateProfile(user.id, { photos: [...photos, result.url!] });
        
        // Show success message
        showAlert('Success', 'Photo uploaded successfully!');
      } else {
        showAlert('Error', result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Failed to upload photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to upload photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Legacy photo upload methods (keeping for backward compatibility)
  const addPhoto = async () => {
    setShowPhotoUpload(true);
  };

  // Web-specific file handler (keeping for backward compatibility)
  const handleWebFileSelect = async (file: File) => {
    setShowPhotoUpload(true);
  };



  const removePhoto = (index: number) => {
    console.log('🖼️ removePhoto called with index:', index);
    console.log('🖼️ Current photos:', photos);
    
    if (!user) {
      showAlert('Error', 'Please log in to remove photos');
      return;
    }

    const showDeleteConfirmation = () => {
      if (isWeb) {
        console.log('🖼️ Showing web delete confirmation');
        WebAlert.showDeleteConfirmation(
          'Remove Photo',
          'Are you sure you want to remove this photo?',
          async () => {
            console.log('🖼️ Web delete confirmed, removing photo...');
            try {
              const updatedPhotos = photos.filter((_, i) => i !== index);
              console.log('🖼️ Updated photos array:', updatedPhotos);
              setPhotos(updatedPhotos);
              await AuthService.updateProfile(user.id, { photos: updatedPhotos });
              
              // Refresh profile in context to ensure UI updates
              console.log('🖼️ Refreshing profile context...');
              await refreshProfile();
              
              console.log('🖼️ Photo removed successfully!');
              showAlert('Success', 'Photo removed successfully!');
            } catch (error) {
              console.error('❌ Failed to remove photo:', error);
              showAlert('Error', 'Failed to remove photo. Please try again.');
            }
          }
        );
      } else {
        console.log('🖼️ Showing mobile delete confirmation');
        Alert.alert(
          'Remove Photo',
          'Are you sure you want to remove this photo?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                console.log('🖼️ Mobile delete confirmed, removing photo...');
                try {
                  const updatedPhotos = photos.filter((_, i) => i !== index);
                  console.log('🖼️ Updated photos array:', updatedPhotos);
                  setPhotos(updatedPhotos);
                  await AuthService.updateProfile(user.id, { photos: updatedPhotos });
                  
                  // Refresh profile in context to ensure UI updates
                  console.log('🖼️ Refreshing profile context...');
                  await refreshProfile();
                  
                  console.log('🖼️ Photo removed successfully!');
                  showAlert('Success', 'Photo removed successfully!');
                } catch (error) {
                  console.error('❌ Failed to remove photo:', error);
                  showAlert('Error', 'Failed to remove photo. Please try again.');
                }
              },
            },
          ]
        );
      }
    };

    showDeleteConfirmation();
  };

  const handleAgeRangeChange = (min: number, max: number) => {
    setMinAge(min);
    setMaxAge(max);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Please log in to view your profile
        </Text>
      </View>
    );
  }

  // Show photo upload cropper if active
  if (showPhotoUpload) {
    return (
      <PhotoUploadWithCrop
        onUploadComplete={handlePhotoUpload}
        onCancel={() => setShowPhotoUpload(false)}
        aspectRatio={3/4}
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Edit Profile</Text>
        <View style={{ width: 50 }} />
      </View>
      
      <View style={styles.content}>
        {/* Basic Information */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
          
          <View style={styles.nameRow}>
            <View style={styles.nameInput}>
              <Input
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
              />
            </View>
            <View style={styles.nameInput}>
              <Input
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                error={errors.lastName}
              />
            </View>
          </View>

          <DatePicker
            placeholder="Birthdate"
            value={birthdate}
            onChange={setBirthdate}
            error={errors.birthdate}
          />

          <GenderSelector
            value={gender}
            onValueChange={(newGender) => {
              console.log('Gender changed from', gender, 'to', newGender);
              setGender(newGender);
            }}
            error={errors.gender}
            label="Gender"
            type="gender"
          />
        </Card>

        {/* Bio */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About Me</Text>
          <Input
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            error={errors.bio}
          />
          <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
            {bio.length}/500 characters
          </Text>
        </Card>

        {/* Location */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location</Text>
          
          {/* Current Location Display */}
          <View style={styles.locationContainer}>
            <Text style={[styles.locationLabel, { color: theme.colors.textSecondary }]}>
              Current Location:
            </Text>
            <NearestCity 
              showLoading={true}
              style={styles.currentLocation}
            />
          </View>
          
          <Input
            placeholder="City, State"
            value={location}
            onChangeText={setLocation}
          />
        </Card>

        {/* Photos */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Photos</Text>
          <PhotoGallery
            photos={photos}
            onRemovePhoto={removePhoto}
            onAddPhoto={addPhoto}
            maxPhotos={6}
            uploading={uploadingPhoto}
            onFileSelect={handleWebFileSelect}
          />
          


          {/* Test Edge Function Photo Upload Button */}
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: 10 }
            ]}
            onPress={handleEnhancedPhotoUpload}
            disabled={uploadingPhoto}
          >
            <Text style={[styles.testButtonText, { color: theme.colors.text }]}>
              {uploadingPhoto ? 'Uploading...' : 'Test Edge Function Photo Upload'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Interests */}
        <Card style={styles.section}>
          <View style={styles.interestsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Interests</Text>
            <Text style={[styles.interestCounter, { color: theme.colors.textSecondary }]}>
              {interests.length}/7
            </Text>
          </View>
          <View style={styles.interestsContainer}>
            {interestOptions.map(interest => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestTag,
                  {
                    backgroundColor: interests.includes(interest) ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: !interests.includes(interest) && interests.length >= 7 ? 0.5 : 1,
                  }
                ]}
                onPress={() => toggleInterest(interest)}
                disabled={!interests.includes(interest) && interests.length >= 7}
              >
                <Text style={[
                  styles.interestText,
                  { color: interests.includes(interest) ? 'white' : theme.colors.text }
                ]}>
                  {interest.charAt(0).toUpperCase() + interest.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {interests.length >= 7 && (
            <Text style={[styles.interestLimitText, { color: theme.colors.textSecondary }]}>
              Maximum 7 interests allowed
            </Text>
          )}
        </Card>

        {/* Looking For */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Looking For</Text>
          <View style={styles.lookingForContainer}>
            {['male', 'female', 'non-binary'].map(genderOption => (
              <TouchableOpacity
                key={genderOption}
                style={[
                  styles.lookingForTag,
                  {
                    backgroundColor: lookingFor.includes(genderOption) ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => toggleLookingFor(genderOption)}
              >
                <Text style={[
                  styles.lookingForText,
                  { color: lookingFor.includes(genderOption) ? 'white' : theme.colors.text }
                ]}>
                  {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Preferences */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: theme.colors.text }]}>
              Maximum Distance: {maxDistance} km
            </Text>
            <SingleSlider
              value={maxDistance}
              onValueChange={setMaxDistance}
              minValue={1}
              maxValue={100}
              step={1}
            />
          </View>

          <View style={styles.preferenceItem}>
            <Text style={[styles.preferenceLabel, { color: theme.colors.text }]}>
              Age Range: {minAge} - {maxAge} years
            </Text>
            <RangeSlider
              minValue={minAge}
              maxValue={maxAge}
              onValueChange={handleAgeRangeChange}
              minRange={18}
              maxRange={100}
              step={1}
            />
          </View>
        </Card>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <Button
            title={saving ? 'Saving...' : 'Save Profile'}
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('lg'),
    paddingTop: 60,
  },
  backButton: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  title: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
  },
  content: {
    padding: getResponsiveSpacing('lg'),
  },
  loadingText: {
    fontSize: getResponsiveFontSize('lg'),
    textAlign: 'center',
    marginTop: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
  },
  nameRow: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
  },
  nameInput: {
    flex: 1,
  },
  genderContainer: {
    marginTop: getResponsiveSpacing('md'),
  },
  label: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
  },
  genderOption: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 20,
    borderWidth: 1,
  },
  genderOptionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  charCount: {
    fontSize: getResponsiveFontSize('xs'),
    textAlign: 'right',
    marginTop: getResponsiveSpacing('xs'),
  },
  interestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  interestCounter: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
  },
  interestTag: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 20,
    borderWidth: 1,
  },
  interestText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  interestLimitText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    marginTop: getResponsiveSpacing('sm'),
    fontStyle: 'italic',
  },
  preferenceRow: {
    marginBottom: getResponsiveSpacing('md'),
  },
  lookingForOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
    marginTop: getResponsiveSpacing('sm'),
  },
  lookingForOption: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 20,
    borderWidth: 1,
  },
  lookingForOptionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  unit: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  ageRangeRow: {
    marginBottom: getResponsiveSpacing('md'),
  },
  errorText: {
    fontSize: getResponsiveFontSize('xs'),
    marginTop: getResponsiveSpacing('xs'),
  },
  debugText: {
    fontSize: getResponsiveFontSize('xs'),
    marginTop: getResponsiveSpacing('xs'),
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: getResponsiveSpacing('lg'),
    marginBottom: getResponsiveSpacing('xl'),
  },
  testButton: {
    marginTop: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  nativeAgeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('sm'),
  },
  ageSliderStyle: {
    flex: 1,
    height: 40,
    marginHorizontal: getResponsiveSpacing('sm'),
  },
  ageValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  ageValueText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  description: {
    fontSize: getResponsiveFontSize('sm'),
    marginBottom: getResponsiveSpacing('md'),
  },
  ageRangeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  ageValue: {
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: getResponsiveFontSize('xs'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  ageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 100,
  },
  ageButton: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ageButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: 'bold',
  },
  ageNumber: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: 'bold',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  ageRangeText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  sliderIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  sliderMinMax: {
    fontSize: getResponsiveFontSize('xs'),
  },
  lookingForContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
  },
  lookingForTag: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 20,
    borderWidth: 1,
  },
  lookingForText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '600',
  },
  preferenceItem: {
    marginBottom: getResponsiveSpacing('md'),
  },
  preferenceLabel: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  saveContainer: {
    marginTop: getResponsiveSpacing('lg'),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  locationLabel: {
    fontSize: getResponsiveFontSize('md'),
    marginRight: getResponsiveSpacing('sm'),
  },
  currentLocation: {
    flex: 1,
  },
}); 