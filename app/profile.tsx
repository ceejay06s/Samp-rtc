import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { DatePicker } from '../src/components/ui/DatePicker';
import { GenderSelector } from '../src/components/ui/GenderSelector';
import { Input } from '../src/components/ui/Input';
import { PhotoGallery } from '../src/components/ui/PhotoGallery';
import { RangeSlider } from '../src/components/ui/RangeSlider';
import { SingleSlider } from '../src/components/ui/Slider';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { AuthService } from '../src/services/auth';
import { PhotoUploadService } from '../src/services/photoUpload';
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
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (maxDistance < 1 || maxDistance > 100) {
      newErrors.maxDistance = 'Max distance must be between 1 and 100 miles';
    }

    if (minAge < 18 || minAge > 100) {
      newErrors.minAge = 'Minimum age must be between 18 and 100';
    }
    if (maxAge < 18 || maxAge > 100) {
      newErrors.maxAge = 'Maximum age must be between 18 and 100';
    }
    if (minAge > maxAge) {
      newErrors.maxAge = 'Maximum age must be greater than minimum age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validateForm()) return;

    try {
      setSaving(true);
      
      console.log('Saving profile with gender:', gender);
      
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birthdate: birthdate ? formatDateToISO(birthdate) : undefined,
        gender: gender,
        bio: bio.trim(),
        location: location.trim(),
        interests,
        looking_for: lookingFor,
        max_distance: maxDistance,
        min_age: minAge,
        max_age: maxAge,
        photos,
      };
      
      console.log('Update data:', updateData);
      
      await AuthService.updateProfile(user.id, updateData);

      showAlert('Success', 'Profile updated successfully!');
      await refreshProfile(); // Refresh profile in context
      await loadProfile(); // Reload profile to get updated data
    } catch (error) {
      console.error('Failed to update profile:', error);
      showAlert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => {
      if (prev.includes(interest)) {
        // Remove interest if already selected
        return prev.filter(i => i !== interest);
      } else {
        // Add interest only if under the limit
        if (prev.length >= 7) {
          showAlert('Interest Limit', 'You can only select up to 7 interests. Please remove one before adding another.');
          return prev;
        }
        return [...prev, interest];
      }
    });
  };

  const toggleLookingFor = (gender: string) => {
    setLookingFor(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  const addPhoto = async () => {
    if (!user) {
      showAlert('Error', 'Please log in to add photos');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      const photoResult = await PhotoUploadService.showImagePickerOptions();
      if (photoResult) {
        // Validate the image
        const validation = PhotoUploadService.validateImage(photoResult);
        if (!validation.isValid) {
          showAlert('Invalid Image', validation.error);
          return;
        }

        // Upload the photo (works with both free and paid plans)
        const photoUrl = await PhotoUploadService.uploadPhotoToServer(photoResult);
        
        // Add to local state
        setPhotos(prev => [...prev, photoUrl]);
        
        // Save to profile immediately
        await AuthService.updateProfile(user.id, { photos: [...photos, photoUrl] });
        
        // Show appropriate success message based on upload type
        if (photoUrl.startsWith('data:')) {
          showAlert('Success', 'Photo added successfully! (Stored as base64 - free plan compatible)');
        } else {
          showAlert('Success', 'Photo added successfully! (Stored in Supabase storage)');
        }
      }
    } catch (error) {
      console.error('Failed to add photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to add photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Web-specific file handler
  const handleWebFileSelect = async (file: File) => {
    if (!user) {
      showAlert('Error', 'Please log in to add photos');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Process the file using the web upload method
      const photoResult = await PhotoUploadService.uploadFileFromWeb(file);
      if (photoResult) {
        // Validate the image
        const validation = PhotoUploadService.validateImage(photoResult);
        if (!validation.isValid) {
          showAlert('Invalid Image', validation.error);
          return;
        }

        // Upload the photo (works with both free and paid plans)
        const photoUrl = await PhotoUploadService.uploadPhotoToServer(photoResult);
        
        // Add to local state
        setPhotos(prev => [...prev, photoUrl]);
        
        // Save to profile immediately
        await AuthService.updateProfile(user.id, { photos: [...photos, photoUrl] });
        
        // Show appropriate success message based on upload type
        if (photoUrl.startsWith('data:')) {
          showAlert('Success', 'Photo added successfully! (Stored as base64 - free plan compatible)');
        } else {
          showAlert('Success', 'Photo added successfully! (Stored in Supabase storage)');
        }
      }
    } catch (error) {
      console.error('Failed to add photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to add photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const testBucketConnection = async () => {
    try {
      setUploadingPhoto(true);
      console.log('Testing storage connection...');
      
      const results = await PhotoUploadService.testBucketConnection();
      
      let message = 'Storage Connection Test Results:\n\n';
      
      if (results.success) {
        if (results.bucketExists && results.bucketAccessible && results.canUpload) {
          message += '✅ Supabase Storage Available (Paid Plan)\n';
          message += '✓ Photos will be stored in Supabase storage\n';
          message += '✓ Better performance and scalability\n';
        } else {
          message += '✅ Base64 Storage Available (Free Plan)\n';
          message += '✓ Photos will be stored as base64 in database\n';
          message += '✓ Compatible with free Supabase plan\n';
        }
      } else {
        message += '❌ Storage Issues Detected\n';
      }
      
      message += '\nDetailed Results:\n';
      message += `• Bucket exists: ${results.bucketExists ? 'Yes' : 'No'}\n`;
      message += `• Bucket accessible: ${results.bucketAccessible ? 'Yes' : 'No'}\n`;
      message += `• Can upload: ${results.canUpload ? 'Yes' : 'No'}\n`;
      message += `• Overall success: ${results.success ? 'Yes' : 'No'}\n`;
      
      if (results.errors.length > 0) {
        message += '\nNotes:\n';
        results.errors.forEach((error, index) => {
          message += `${index + 1}. ${error}\n`;
        });
      }
      
      showAlert('Storage Test Results', message);
    } catch (error) {
      console.error('Storage test failed:', error);
      showAlert('Test Error', 'Failed to test storage connection');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    if (!user) {
      showAlert('Error', 'Please log in to remove photos');
      return;
    }

    const showDeleteConfirmation = () => {
      if (isWeb) {
        WebAlert.showDeleteConfirmation(
          'Remove Photo',
          'Are you sure you want to remove this photo?',
          async () => {
            try {
              const photoToRemove = photos[index];
              
              // Remove from local state first
              const updatedPhotos = photos.filter((_, i) => i !== index);
              setPhotos(updatedPhotos);
              
              // Try to delete from Supabase storage if it's a Supabase URL
              if (photoToRemove.includes('supabase.co') || photoToRemove.includes('storage.googleapis.com')) {
                await PhotoUploadService.deletePhotoFromSupabase(photoToRemove);
              }
              
              // Save the updated photos array to Supabase
              await AuthService.updateProfile(user.id, { photos: updatedPhotos });
              
              showAlert('Success', 'Photo removed successfully!');
            } catch (error) {
              console.error('Error removing photo:', error);
              showAlert('Error', 'Failed to remove photo. Please try again.');
              // Reload photos to restore state
              await loadProfile();
            }
          }
        );
      } else {
        Alert.alert(
          'Remove Photo',
          'Are you sure you want to remove this photo?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  const photoToRemove = photos[index];
                  
                  // Remove from local state first
                  const updatedPhotos = photos.filter((_, i) => i !== index);
                  setPhotos(updatedPhotos);
                  
                  // Try to delete from Supabase storage if it's a Supabase URL
                  if (photoToRemove.includes('supabase.co') || photoToRemove.includes('storage.googleapis.com')) {
                    await PhotoUploadService.deletePhotoFromSupabase(photoToRemove);
                  }
                  
                  // Save the updated photos array to Supabase
                  await AuthService.updateProfile(user.id, { photos: updatedPhotos });
                  
                  showAlert('Success', 'Photo removed successfully!');
                } catch (error) {
                  console.error('Error removing photo:', error);
                  showAlert('Error', 'Failed to remove photo. Please try again.');
                  // Reload photos to restore state
                  await loadProfile();
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
    console.log('Age range changed:', { min, max, currentMin: minAge, currentMax: maxAge });
    setMinAge(min);
    setMaxAge(max);
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your profile...
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading profile...
          </Text>
        </View>
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
          
          {/* Test Bucket Connection Button */}
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
            onPress={testBucketConnection}
            disabled={uploadingPhoto}
          >
            <Text style={[styles.testButtonText, { color: theme.colors.text }]}>
              {uploadingPhoto ? 'Testing...' : 'Test Storage Connection'}
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
              Maximum 7 interests selected. Remove one to add another.
            </Text>
          )}
        </Card>

        {/* Preferences */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
          
          <View style={styles.preferenceRow}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Looking for</Text>
            <GenderSelector
              value={''}
              onValueChange={() => {}}
              multiple
              selectedValues={lookingFor}
              onValuesChange={setLookingFor}
              label={''}
              type="preference"
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Max Distance</Text>
              <Text style={[styles.ageRangeText, { color: theme.colors.text }]}>
                {maxDistance} miles
              </Text>
            </View>
            <SingleSlider
              value={maxDistance}
              onValueChange={(value) => setMaxDistance(value)}
              minValue={1}
              maxValue={100}
              step={1}
              showValue={false}
            />
            <View style={styles.sliderIndicators}>
              <Text style={[styles.sliderMinMax, { color: theme.colors.textSecondary }]}>
                1 mile
              </Text>
              <Text style={[styles.sliderMinMax, { color: theme.colors.textSecondary }]}>
                100 miles
              </Text>
            </View>
          </View>

          <View style={styles.ageRangeRow}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Age Range</Text>
              <Text style={[styles.ageRangeText, { color: theme.colors.text }]}>
                {minAge} - {maxAge} years
              </Text>
            </View>
            
            <RangeSlider
              minValue={minAge}
              maxValue={maxAge}
              onValueChange={handleAgeRangeChange}
              minRange={18}
              maxRange={100}
              step={1}
              showValues={false}
              disabled={saving}
            />
            <View style={styles.sliderIndicators}>
              <Text style={[styles.sliderMinMax, { color: theme.colors.textSecondary }]}>
                18 years
              </Text>
              <Text style={[styles.sliderMinMax, { color: theme.colors.textSecondary }]}>
                100 years
              </Text>
            </View>
          </View>
        </Card>

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
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
}); 