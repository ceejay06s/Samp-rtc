import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../src/components/ui/Button';
import { LocationPicker } from '../src/components/ui/LocationPicker';
import { WebAlert } from '../src/components/ui/WebAlert';
import { usePlatform } from '../src/hooks/usePlatform';
import { EnhancedPhotoUploadService } from '../src/services/enhancedPhotoUpload';
import { PostService, UpdatePostData } from '../src/services/postService';
import { Post } from '../src/types';
import { getResponsiveFontSize, getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  type: string;
}

interface LocationData {
  name?: string;
  address?: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
}

export default function EditPostScreen() {
  const theme = useTheme();
  const { isWeb } = usePlatform();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams();
  const postId = params.postId as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Helper function to show alerts
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
      const { LocationService } = await import('../src/services/locationService');
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

  const loadPost = async () => {
    try {
      if (!postId) {
        showAlert('Error', 'No post ID provided.');
        router.back();
        return;
      }

      if (!currentUser?.id) {
        showAlert('Error', 'You must be logged in to edit posts.');
        router.back();
        return;
      }

      const postData = await PostService.getPost(postId, currentUser.id);
      if (!postData) {
        showAlert('Error', 'Post not found.');
        router.back();
        return;
      }

      // Check if user owns the post
      if (postData.user_id !== currentUser.id) {
        showAlert('Error', 'You can only edit your own posts.');
        router.back();
        return;
      }

      setPost(postData);
      setContent(postData.content || '');
      setIsPublic(postData.is_public !== false);
      
      // Load existing location if available
      if (postData.location) {
        setSelectedLocation({
          name: postData.location,
          address: postData.location,
          formattedAddress: postData.location,
          latitude: 0,
          longitude: 0,
        });
      }
    } catch (error) {
      console.error('Error loading post:', error);
      showAlert('Error', 'Failed to load post. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showAlert('Error', 'Post content cannot be empty.');
      return;
    }

    try {
      setSaving(true);

      const updateData: UpdatePostData = {
        content: content.trim(),
        location: selectedLocation ? (selectedLocation.name || selectedLocation.formattedAddress) : undefined,
        is_public: isPublic,
      };

      await PostService.updatePost(postId, currentUser!.id, updateData);
      showAlert('Success', 'Post updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating post:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (content !== post?.content || selectedLocation !== null || isPublic !== (post?.is_public !== false)) {
      showAlert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const renderImages = () => {
    if (!post?.images || post.images.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Images ({post.images.length})
        </Text>
        <Text style={[styles.imagesNote, { color: theme.colors.textSecondary }]}>
          Images cannot be edited. Create a new post to change images.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
          {post.images.map((imageUrl, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.imagePreviewImage}
                contentFit="cover"
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderLocation = () => {
    if (!selectedLocation) return null;

    return (
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
    );
  };

  const renderActionToolbar = () => (
    <View style={[styles.actionToolbar, { borderTopColor: theme.colors.border }]}>
      <Text style={[styles.toolbarTitle, { color: theme.colors.text }]}>Add to your post</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            showAlert('Coming Soon', 'Image editing will be available soon!');
          }}
        >
          <Text style={styles.actionIcon}>📷</Text>
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

  const renderPrivacySettings = () => (
    <View style={styles.privacyContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        Privacy Settings
      </Text>
      <TouchableOpacity
        style={[styles.privacyButton, { backgroundColor: theme.colors.surface }]}
        onPress={() => setIsPublic(!isPublic)}
      >
        <Text style={[styles.privacyIcon, { color: theme.colors.primary }]}>
          {isPublic ? '🌍' : '🔒'}
        </Text>
        <View style={styles.privacyTextContainer}>
          <Text style={[styles.privacyText, { color: theme.colors.text }]}>
            {isPublic ? 'Public' : 'Private'}
          </Text>
          <Text style={[styles.privacyHint, { color: theme.colors.textSecondary }]}>
            {isPublic ? 'Anyone can see this post' : 'Only you can see this post'}
          </Text>
        </View>
        <Text style={[styles.privacyToggle, { color: theme.colors.primary }]}>
          {isPublic ? 'Public' : 'Private'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading post...
        </Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Post not found
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorAction}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Edit Post
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, (!content.trim() || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!content.trim() || saving}
        >
          <Text style={[
            styles.saveText, 
            { color: content.trim() && !saving ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Post Content
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            multiline
            style={styles.textInput}
          />
          <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
            {content.length}/1000 characters
          </Text>
        </View>

        {renderImages()}
        {renderLocation()}
        {renderPrivacySettings()}

        <View style={styles.infoContainer}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            Post Information
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Created:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Visibility:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {post.is_public ? 'Public' : 'Private'}
            </Text>
          </View>
          {post.location && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Location:
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {post.location}
              </Text>
            </View>
          )}
        </View>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getResponsiveSpacing('md'),
    paddingTop: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    padding: getResponsiveSpacing('sm'),
  },
  cancelText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  saveButton: {
    padding: getResponsiveSpacing('sm'),
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    padding: getResponsiveSpacing('md'),
  },
  label: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  textInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    padding: getResponsiveSpacing('md'),
    fontSize: getResponsiveFontSize('md'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
  },
  characterCount: {
    fontSize: getResponsiveFontSize('sm'),
    textAlign: 'right',
    marginTop: getResponsiveSpacing('xs'),
  },
  imagesContainer: {
    padding: getResponsiveSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  imagesNote: {
    fontSize: getResponsiveFontSize('sm'),
    fontStyle: 'italic',
    marginTop: getResponsiveSpacing('xs'),
  },
  imagesScroll: {
    marginTop: getResponsiveSpacing('sm'),
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: getResponsiveSpacing('sm'),
    overflow: 'hidden',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: getResponsiveSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  infoTitle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xs'),
  },
  infoLabel: {
    fontSize: getResponsiveFontSize('sm'),
  },
  infoValue: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
  },
  loadingText: {
    fontSize: getResponsiveFontSize('md'),
    marginTop: getResponsiveSpacing('sm'),
  },
  errorText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('lg'),
  },
  errorAction: {
    marginTop: getResponsiveSpacing('md'),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('md'),
    borderRadius: 8,
    marginTop: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  locationIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('sm'),
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  locationHint: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: getResponsiveSpacing('xs'),
  },
  removeLocation: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: 'bold',
  },
  actionToolbar: {
    padding: getResponsiveSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
  },
  actionIcon: {
    fontSize: getResponsiveFontSize('lg'),
  },
  activeActionButton: {
    opacity: 0.7,
  },
  privacyContainer: {
    padding: getResponsiveSpacing('md'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing('sm'),
    borderRadius: 8,
  },
  privacyIcon: {
    fontSize: getResponsiveFontSize('lg'),
    marginRight: getResponsiveSpacing('sm'),
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '500',
  },
  privacyHint: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: getResponsiveSpacing('xs'),
  },
  privacyToggle: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
}); 