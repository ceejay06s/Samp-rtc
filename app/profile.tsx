import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
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
import { EnhancedPhotoUploadService } from '../src/services/enhancedPhotoUpload';
import { Profile } from '../src/types';

import * as ImagePicker from 'expo-image-picker';
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

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    if (!profile) return 0;
    
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.birthdate,
      profile.gender,
      profile.bio,
      profile.location,
      profile.photos?.length > 0,
      profile.interests?.length > 0,
      profile.looking_for?.length > 0
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  // Get completion color based on percentage
  const getCompletionColor = (): string => {
    const completion = calculateProfileCompletion();
    if (completion >= 80) return '#28a745'; // Green
    if (completion >= 60) return '#ffc107'; // Yellow
    if (completion >= 40) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (!authLoading && currentProfile) {
      loadProfile();
    }
  }, [currentProfile, authLoading]);

  // Initialize profile data when user changes
  useEffect(() => {
    if (user && !currentProfile) {
      // If no profile in context, try to load from database
      loadProfileFromDatabase();
    }
  }, [user, currentProfile]);

  const loadProfileFromDatabase = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading profile from database for user:', user.id);
      
      // Fetch profile directly from Supabase
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is okay for new users
        console.error('❌ Error fetching profile:', error);
        throw error;
      }
      
      if (profileData) {
        console.log('✅ Profile found in database:', profileData);
        setProfile(profileData);
        loadProfileData(profileData);
      } else {
        console.log('ℹ️ No profile found, creating default profile');
        // Create a new profile in the database
        const defaultProfile = {
          user_id: user.id,
          first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || '',
          last_name: user.user_metadata?.last_name || '',
          gender: '',
          bio: '',
          location: '',
          interests: [],
          looking_for: [],
          max_distance: 50,
          min_age: 18,
          max_age: 100,
          photos: [],
          is_online: true,
        };
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([defaultProfile])
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating profile:', createError);
          throw createError;
        }
        
        console.log('✅ Profile created:', newProfile);
        setProfile(newProfile);
        loadProfileData(newProfile);
      }
      
      // Try to refresh profile in context as well
      try {
        await refreshProfile();
      } catch (contextError) {
        console.log('ℹ️ Context refresh failed, but local profile loaded successfully');
      }
      
    } catch (error) {
      console.error('❌ Failed to load profile from database:', error);
      showAlert('Error', 'Failed to load profile from database. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadProfileData = (profileData: Profile) => {
    console.log('📋 Loading profile data into form fields');
    setFirstName(profileData.first_name || '');
    setLastName(profileData.last_name || '');
    
    // Handle birthdate
    if (profileData.birthdate) {
      try {
        const birthDate = new Date(profileData.birthdate + 'T00:00:00');
        if (!isNaN(birthDate.getTime())) {
          setBirthdate(birthDate);
        }
      } catch (error) {
        console.error('Error parsing birthdate:', error);
      }
    }
    
    setGender(profileData.gender || '');
    setBio(profileData.bio || '');
    setLocation(profileData.location || '');
    setInterests(profileData.interests || []);
    setLookingFor(profileData.looking_for || []);
    setMaxDistance(profileData.max_distance || 50);
    setMinAge(profileData.min_age || 18);
    setMaxAge(profileData.max_age || 100);
    setPhotos(profileData.photos || []);
  };

  const loadProfile = async () => {
    if (!currentProfile) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('📋 Loading profile from AuthContext:', currentProfile);
      
      // Set profile state
      setProfile(currentProfile);
      
      // Load profile data into form fields
      loadProfileData(currentProfile);
      
    } catch (error) {
      console.error('❌ Failed to load profile:', error);
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
      console.log('💾 Saving profile for user:', user.id);
      
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
        updated_at: new Date().toISOString(),
      };

      // Save directly to Supabase
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert([{ ...profileData, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error saving profile to database:', error);
        throw error;
      }
      
      console.log('✅ Profile saved to database:', updatedProfile);
      setProfile(updatedProfile);
      
      // Also try AuthService for backwards compatibility
      try {
        await AuthService.updateProfile(user.id, profileData);
        console.log('✅ Profile updated via AuthService');
      } catch (authServiceError) {
        console.log('ℹ️ AuthService update failed, but direct Supabase update succeeded');
      }
      
      // Refresh profile in context
      try {
        await refreshProfile();
        console.log('✅ Profile context refreshed');
      } catch (contextError) {
        console.log('ℹ️ Context refresh failed, but profile saved successfully');
      }
      
      showAlert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
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

  // Enhanced photo upload with profile-photo bucket
  const handleEnhancedPhotoUpload = async () => {
    if (!user?.id) {
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

      // Upload using enhanced profile photo upload service
      const result = await EnhancedPhotoUploadService.uploadProfilePhotoToProfileBucket(
        user.id,
        photo.uri,
        {
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 800,
          allowsEditing: true,
          aspect: [1, 1]
        }
      );

      if (result.success && result.url) {
        
        // Add to local state
        const newPhotos = [...photos, result.url];
        setPhotos(newPhotos);
        
        // Save to profile immediately in Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ photos: newPhotos, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('❌ Failed to update photos in database:', updateError);
          // Try AuthService as fallback
          await AuthService.updateProfile(user.id, { photos: newPhotos });
        } else {
          console.log('✅ Photos updated in database');
        }
        
        // Refresh profile in context
        try {
          await refreshProfile();
        } catch (contextError) {
          console.log('ℹ️ Context refresh failed, but photos updated successfully');
        }
        
        // Show success message
        showAlert('Success', 'Photo uploaded successfully!');
      } else {
        console.error('❌ Photo upload failed:', result.error);
        showAlert('Error', result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('❌ Failed to upload photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to upload photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Enhanced photo upload from library
  const handlePickPhotoFromLibrary = async () => {
    if (!user?.id) {
      showAlert('Error', 'Please log in to add photos');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Pick image from library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Upload using enhanced profile photo upload service
        const uploadResult = await EnhancedPhotoUploadService.uploadProfilePhotoToProfileBucket(
          user.id,
          asset.uri,
          {
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1]
          }
        );

        if (uploadResult.success && uploadResult.url) {
          
          // Add to local state
          const newPhotos = [...photos, uploadResult.url];
          setPhotos(newPhotos);
          
          // Save to profile immediately in Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ photos: newPhotos, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('❌ Failed to update photos in database:', updateError);
            // Try AuthService as fallback
            await AuthService.updateProfile(user.id, { photos: newPhotos });
          } else {
            console.log('✅ Photos updated in database');
          }
          
          // Refresh profile in context
          try {
            await refreshProfile();
          } catch (contextError) {
            console.log('ℹ️ Context refresh failed, but photos updated successfully');
          }
          
          // Show success message
          showAlert('Success', 'Photo uploaded successfully!');
        } else {
          console.error('❌ Photo upload failed:', uploadResult.error);
          showAlert('Error', uploadResult.error || 'Failed to upload photo');
        }
      }
    } catch (error) {
      console.error('❌ Failed to pick and upload photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to upload photo: ${errorMessage}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Enhanced photo upload with camera
  const handleTakePhotoWithCamera = async () => {
    if (!user?.id) {
      showAlert('Error', 'Please log in to add photos');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      // Take photo with camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Upload using enhanced profile photo upload service
        const uploadResult = await EnhancedPhotoUploadService.uploadProfilePhotoToProfileBucket(
          user.id,
          asset.uri,
          {
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1]
          }
        );

        if (uploadResult.success && uploadResult.url) {
          
          // Add to local state
          const newPhotos = [...photos, uploadResult.url];
          setPhotos(newPhotos);
          
          // Save to profile immediately in Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ photos: newPhotos, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('❌ Failed to update photos in database:', updateError);
            // Try AuthService as fallback
            await AuthService.updateProfile(user.id, { photos: newPhotos });
          } else {
            console.log('✅ Photos updated in database');
          }
          
          // Refresh profile in context
          try {
            await refreshProfile();
          } catch (contextError) {
            console.log('ℹ️ Context refresh failed, but photos updated successfully');
          }
          
          // Show success message
          showAlert('Success', 'Photo taken and uploaded successfully!');
        } else {
          console.error('❌ Photo upload failed:', uploadResult.error);
          showAlert('Error', uploadResult.error || 'Failed to upload photo');
        }
      }
    } catch (error) {
      console.error('❌ Failed to take and upload photo:', error);
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
              const updatedPhotos = photos.filter((_, i) => i !== index);
              setPhotos(updatedPhotos);
              
              // Update in Supabase
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
              
              if (updateError) {
                console.error('❌ Failed to update photos in database:', updateError);
                // Try AuthService as fallback
                await AuthService.updateProfile(user.id, { photos: updatedPhotos });
              } else {
                console.log('✅ Photos updated in database');
              }
              
              // Refresh profile in context to ensure UI updates
              try {
                await refreshProfile();
              } catch (contextError) {
                console.log('ℹ️ Context refresh failed, but photo removed successfully');
              }
              
              showAlert('Success', 'Photo removed successfully!');
            } catch (error) {
              console.error('❌ Failed to remove photo:', error);
              showAlert('Error', 'Failed to remove photo. Please try again.');
            }
          }
        );
      } else {
        Alert.alert(
          'Remove Photo',
          'Are you sure you want to remove this photo?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  const updatedPhotos = photos.filter((_, i) => i !== index);
                  setPhotos(updatedPhotos);
                  
                  // Update in Supabase
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ photos: updatedPhotos, updated_at: new Date().toISOString() })
                    .eq('user_id', user.id);
                  
                  if (updateError) {
                    console.error('❌ Failed to update photos in database:', updateError);
                    // Try AuthService as fallback
                    await AuthService.updateProfile(user.id, { photos: updatedPhotos });
                  } else {
                    console.log('✅ Photos updated in database');
                  }
                  
                  // Refresh profile in context to ensure UI updates
                  try {
                    await refreshProfile();
                  } catch (contextError) {
                    console.log('ℹ️ Context refresh failed, but photo removed successfully');
                  }
                  
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
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Please log in to view your profile
          </Text>
        </View>
      </View>
    );
  }

  // Show photo upload cropper if active
  if (showPhotoUpload) {
    return (
      <PhotoUploadWithCrop
        onUploadComplete={handleEnhancedPhotoUpload}
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
        {/* Profile Status */}
        {!profile?.id && (
          <Card style={[styles.section, { backgroundColor: '#fff3cd', borderColor: '#ffc107' }]}>
            <Text style={[styles.sectionTitle, { color: '#856404' }]}>⚠️ Profile Setup Required</Text>
            <Text style={[styles.statusText, { color: '#856404' }]}>
              Your profile is not yet set up. Please fill in the required information below and save your profile.
            </Text>
          </Card>
        )}

        {/* Profile Completion Status */}
        {profile?.id && calculateProfileCompletion() < 100 && (
          <Card style={[styles.section, { backgroundColor: '#d1ecf1', borderColor: '#17a2b8' }]}>
            <Text style={[styles.sectionTitle, { color: '#0c5460' }]}>📊 Profile Completion</Text>
            <View style={styles.completionBar}>
              <View 
                style={[
                  styles.completionFill, 
                  { 
                    width: `${calculateProfileCompletion()}%`,
                    backgroundColor: getCompletionColor()
                  }
                ]} 
              />
            </View>
            <Text style={[styles.completionText, { color: '#0c5460' }]}>
              {calculateProfileCompletion()}% Complete
            </Text>
          </Card>
        )}

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
          
          {/* Photo Upload Buttons */}
          <View style={styles.photoUploadButtons}>
            <TouchableOpacity
              style={[
                styles.photoUploadButton,
                { backgroundColor: theme.colors.primary, marginBottom: 10 }
              ]}
              onPress={handlePickPhotoFromLibrary}
              disabled={uploadingPhoto}
            >
              <Text style={[styles.photoUploadButtonText, { color: 'white' }]}>
                📷 Pick from Library
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.photoUploadButton,
                { backgroundColor: theme.colors.secondary || '#34C759' }
              ]}
              onPress={handleTakePhotoWithCamera}
              disabled={uploadingPhoto}
            >
              <Text style={[styles.photoUploadButtonText, { color: 'white' }]}>
                📸 Take Photo
              </Text>
            </TouchableOpacity>
          </View>

          <PhotoGallery
            photos={photos}
            onRemovePhoto={removePhoto}
            onAddPhoto={() => setShowPhotoUpload(true)}
            maxPhotos={6}
            uploading={uploadingPhoto}
            onFileSelect={() => setShowPhotoUpload(true)}
          />

          {/* Legacy Photo Upload (keeping for backward compatibility) */}
          <TouchableOpacity
            style={[
              styles.testButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: 10 }
            ]}
            onPress={() => setShowPhotoUpload(true)}
            disabled={uploadingPhoto}
          >
            <Text style={[styles.testButtonText, { color: theme.colors.text }]}>
              Legacy Photo Upload
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
  photoUploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: getResponsiveSpacing('md'),
  },
  photoUploadButton: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: getResponsiveSpacing('sm'),
  },
  photoUploadButtonText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  completionBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  completionFill: {
    height: '100%',
    borderRadius: 5,
  },
  completionText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    fontWeight: '600',
  },
  statusText: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'center',
    marginTop: getResponsiveSpacing('sm'),
  },
}); 