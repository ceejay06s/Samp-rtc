import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EnhancedPhotoUploadService } from '../../services/enhancedPhotoUpload';
import { LocationData } from '../../services/locationService';
import { CreatePostData } from '../../services/postService';
import { Profile } from '../../types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { LocationPicker } from './LocationPicker';
import { WebAlert } from './WebAlert';

interface CreatePostProps {
  onSubmit: (postData: CreatePostData) => Promise<void>;
  onCancel?: () => void;
  isWeb?: boolean;
  userProfile?: Profile;
}

interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  type: string;
}

export const CreatePost: React.FC<CreatePostProps> = ({
  onSubmit,
  onCancel,
  isWeb = false,
  userProfile,
}) => {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const showAlert = (title: string, message?: string, buttons?: any[]) => {
    if (isWeb) {
      WebAlert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const pickImages = async () => {
    try {
      if (selectedImages.length >= 4) {
        showAlert('Photo Limit', 'You can add up to 4 photos.');
        return;
      }

      const hasPermission = await EnhancedPhotoUploadService.requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets
          .slice(0, 4 - selectedImages.length)
          .map(asset => ({
            uri: asset.uri,
            width: asset.width || 0,
            height: asset.height || 0,
            type: asset.type || 'image',
          }));

        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      showAlert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      if (selectedImages.length >= 4) {
        showAlert('Photo Limit', 'You can add up to 4 photos.');
        return;
      }

      const hasPermission = await EnhancedPhotoUploadService.requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: SelectedImage = {
          uri: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
          type: asset.type || 'image',
        };

        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };

  const removeLocation = () => {
    setSelectedLocation(null);
  };

  const setCurrentLocationQuick = async () => {
    try {
      const { LocationService } = await import('../../services/locationService');
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setSelectedLocation(location);
        showAlert('Location Set', `Your current location has been added: ${location.formattedAddress || location.address}`);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      showAlert('Location Error', 'Unable to get your current location. Please try again or select manually.');
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      showAlert('Empty Post', 'Please add some content or photos to your post.');
      return;
    }

    try {
      setSubmitting(true);
      setUploading(true);

      let uploadedImageUrls: string[] = [];

      if (selectedImages.length > 0) {
        const { PostService } = await import('../../services/postService');
        uploadedImageUrls = await PostService.uploadPostImages(selectedImages);
      }

      setUploading(false);

      const postData: CreatePostData = {
        content: content.trim(),
        images: uploadedImageUrls,
        location: selectedLocation ? (selectedLocation.name || selectedLocation.formattedAddress) : undefined,
        is_public: isPublic,
      };

      await onSubmit(postData);

      // Reset form
      setContent('');
      setSelectedImages([]);
      setSelectedLocation(null);
      setIsPublic(true);
    } catch (error) {
      console.error('Error creating post:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const renderUserHeader = () => {
    if (!userProfile) return null;

    const avatarUrl = userProfile.photos && userProfile.photos.length > 0 ? userProfile.photos[0] : null;

    return (
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: '#fff' }]}>
                {userProfile.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {userProfile.first_name} {userProfile.last_name}
          </Text>
          
          <TouchableOpacity 
            style={[styles.audienceButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => setIsPublic(!isPublic)}
          >
            <Text style={[styles.audienceText, { color: theme.colors.text }]}>
              {isPublic ? '🌍 Public' : '👥 Friends'}
            </Text>
            <Text style={[styles.dropdownIcon, { color: theme.colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderImages = () => {
    if (selectedImages.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedImages.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image
                source={{ uri: image.uri }}
                style={styles.selectedImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeImageText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderActionToolbar = () => (
    <View style={[styles.actionToolbar, { borderTopColor: theme.colors.border }]}>
      <Text style={[styles.toolbarTitle, { color: theme.colors.text }]}>Add to your post</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={pickImages}
        >
          <Text style={styles.actionIcon}>📷</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={takePhoto}
        >
          <Text style={styles.actionIcon}>📸</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            showAlert('Coming Soon', 'Tag people feature will be available soon!');
          }}
        >
          <Text style={styles.actionIcon}>👥</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            showAlert('Coming Soon', 'Feeling/Activity feature will be available soon!');
          }}
        >
          <Text style={styles.actionIcon}>😊</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, selectedLocation && styles.activeActionButton]}
          onPress={() => setShowLocationPicker(true)}
          onLongPress={setCurrentLocationQuick}
        >
          <Text style={[styles.actionIcon, selectedLocation && { opacity: 0.7 }]}>📍</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Post</Text>
        
        <Button
          title={uploading ? 'Uploading...' : 'Post'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={(!content.trim() && selectedImages.length === 0) || submitting}
          size="small"
          style={styles.postButton}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderUserHeader()}
        
        {/* Main Content Input */}
        <View style={styles.contentContainer}>
          <TextInput
            style={[styles.contentInput, { color: theme.colors.text }]}
            placeholder={`What's on your mind${userProfile ? `, ${userProfile.first_name}` : ''}?`}
            placeholderTextColor={theme.colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        {renderImages()}

        {selectedLocation && (
          <View style={[styles.locationContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.locationIcon, { color: theme.colors.primary }]}>📍</Text>
            <View style={styles.locationTextContainer}>
              <Text style={[styles.locationText, { color: theme.colors.text }]}>
                {selectedLocation.name || selectedLocation.formattedAddress || selectedLocation.address}
              </Text>
              <Text style={[styles.locationHint, { color: theme.colors.textSecondary }]}>
                Tap 📍 to choose different location • Long press 📍 for current location
              </Text>
            </View>
            <TouchableOpacity onPress={removeLocation}>
              <Text style={[styles.removeLocation, { color: theme.colors.textSecondary }]}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderActionToolbar()}

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onCancel={() => setShowLocationPicker(false)}
          placeholder="Search for places, addresses, or businesses"
          autoDetectLocation={true}
          showSaveButton={true}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: getResponsiveSpacing('xs'),
  },
  cancelText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  title: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  postButton: {
    minWidth: 80,
  },
  content: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('sm'),
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: getResponsiveSpacing('sm'),
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  avatarText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('xs'),
  },
  audienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: getResponsiveSpacing('sm'),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  audienceText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    marginRight: getResponsiveSpacing('xs'),
  },
  dropdownIcon: {
    fontSize: getResponsiveFontSize('xs'),
  },
  contentContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('md'),
  },
  contentInput: {
    fontSize: getResponsiveFontSize('lg'),
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: getResponsiveFontSize('lg') * 1.3,
  },
  imagesContainer: {
    paddingHorizontal: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
  },
  imageWrapper: {
    position: 'relative',
    marginRight: getResponsiveSpacing('sm'),
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: getResponsiveSpacing('sm'),
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
    padding: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
  },
  locationIcon: {
    fontSize: getResponsiveFontSize('md'),
    marginRight: getResponsiveSpacing('sm'),
  },
  locationText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationHint: {
    fontSize: getResponsiveFontSize('xs'),
    marginTop: getResponsiveSpacing('xs'),
    fontStyle: 'italic',
  },
  removeLocation: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    padding: getResponsiveSpacing('xs'),
  },
  actionToolbar: {
    borderTopWidth: 1,
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
  },
  toolbarTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: getResponsiveSpacing('sm'),
    borderRadius: getResponsiveSpacing('sm'),
    minWidth: 44,
    alignItems: 'center',
  },
  activeActionButton: {
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
  },
  actionIcon: {
    fontSize: getResponsiveFontSize('xl'),
  },
}); 