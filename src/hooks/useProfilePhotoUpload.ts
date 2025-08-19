import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  ProfilePhotoUploadService, 
  ProfilePhotoUploadOptions, 
  UploadResult 
} from '../services/profilePhotoUpload';
import { useAuth } from '../../lib/AuthContext';

export interface UseProfilePhotoUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export function useProfilePhotoUpload(options: UseProfilePhotoUploadOptions = {}) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { onSuccess, onError, onProgress } = options;

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const hasPermissions = await ProfilePhotoUploadService.requestPermissions();
      
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access is required to upload profile photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                // Open iOS settings
                // You might need to add a library like react-native-settings
              } else {
                // Open Android settings
                // You might need to add a library like react-native-settings
              }
            }}
          ]
        );
      }
      
      return hasPermissions;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      onError?.('Failed to request permissions');
      return false;
    }
  }, [onError]);

  // Pick image from library
  const pickImageFromLibrary = useCallback(async (
    uploadOptions: ProfilePhotoUploadOptions = {}
  ): Promise<void> => {
    if (!user?.id) {
      onError?.('User not authenticated');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Request permissions first
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setUploading(false);
        return;
      }

      // Pick image
      const imageUri = await ProfilePhotoUploadService.pickImageFromLibrary(uploadOptions);
      
      if (!imageUri) {
        setUploading(false);
        return; // User cancelled
      }

      // Validate image
      if (!ProfilePhotoUploadService.validateImage(imageUri)) {
        setUploading(false);
        onError?.('Invalid image format. Please use JPG, PNG, or WebP.');
        return;
      }

      // Upload image
      setUploadProgress(50);
      const result = await ProfilePhotoUploadService.uploadProfilePhoto(
        user.id,
        imageUri,
        uploadOptions
      );

      setUploadProgress(100);

      if (result.success) {
        onSuccess?.(result);
        
        // Update the profile photos array
        const currentPhotos = await ProfilePhotoUploadService.getUserProfilePhotos(user.id);
        const updatedPhotos = [...currentPhotos, result.url!];
        await ProfilePhotoUploadService.updateProfilePhotosArray(user.id, updatedPhotos);
        
        Alert.alert('Success', 'Profile photo uploaded successfully!');
      } else {
        onError?.(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Error uploading profile photo:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user?.id, onSuccess, onError, requestPermissions]);

  // Take photo with camera
  const takePhoto = useCallback(async (
    uploadOptions: ProfilePhotoUploadOptions = {}
  ): Promise<void> => {
    if (!user?.id) {
      onError?.('User not authenticated');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Request permissions first
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setUploading(false);
        return;
      }

      // Take photo
      const imageUri = await ProfilePhotoUploadService.takePhoto(uploadOptions);
      
      if (!imageUri) {
        setUploading(false);
        return; // User cancelled
      }

      // Validate image
      if (!ProfilePhotoUploadService.validateImage(imageUri)) {
        setUploading(false);
        onError?.('Invalid image format. Please use JPG, PNG, or WebP.');
        return;
      }

      // Upload image
      setUploadProgress(50);
      const result = await ProfilePhotoUploadService.uploadProfilePhoto(
        user.id,
        imageUri,
        uploadOptions
      );

      setUploadProgress(100);

      if (result.success) {
        onSuccess?.(result);
        
        // Update the profile photos array
        const currentPhotos = await ProfilePhotoUploadService.getUserProfilePhotos(user.id);
        const updatedPhotos = [...currentPhotos, result.url!];
        await ProfilePhotoUploadService.updateProfilePhotosArray(user.id, updatedPhotos);
        
        Alert.alert('Success', 'Profile photo uploaded successfully!');
      } else {
        onError?.(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Error taking and uploading photo:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user?.id, onSuccess, onError, requestPermissions]);

  // Upload multiple photos
  const uploadMultiplePhotos = useCallback(async (
    imageUris: string[],
    uploadOptions: ProfilePhotoUploadOptions = {}
  ): Promise<void> => {
    if (!user?.id) {
      onError?.('User not authenticated');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Request permissions first
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setUploading(false);
        return;
      }

      // Validate all images
      for (const imageUri of imageUris) {
        if (!ProfilePhotoUploadService.validateImage(imageUri)) {
          setUploading(false);
          onError?.(`Invalid image format: ${imageUri}. Please use JPG, PNG, or WebP.`);
          return;
        }
      }

      // Upload images
      const results = await ProfilePhotoUploadService.uploadMultipleProfilePhotos(
        user.id,
        imageUris,
        uploadOptions
      );

      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);

      if (successfulUploads.length > 0) {
        // Update the profile photos array
        const currentPhotos = await ProfilePhotoUploadService.getUserProfilePhotos(user.id);
        const newPhotoUrls = successfulUploads.map(r => r.url!);
        const updatedPhotos = [...currentPhotos, ...newPhotoUrls];
        await ProfilePhotoUploadService.updateProfilePhotosArray(user.id, updatedPhotos);
        
        Alert.alert(
          'Upload Complete', 
          `Successfully uploaded ${successfulUploads.length} photos.${failedUploads.length > 0 ? ` ${failedUploads.length} failed.` : ''}`
        );
      } else {
        onError?.('All uploads failed');
      }

    } catch (error) {
      console.error('Error uploading multiple photos:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user?.id, onSuccess, onError, requestPermissions]);

  // Delete photo
  const deletePhoto = useCallback(async (storagePath: string): Promise<boolean> => {
    try {
      const success = await ProfilePhotoUploadService.deleteProfilePhoto(storagePath);
      
      if (success && user?.id) {
        // Update the profile photos array
        const currentPhotos = await ProfilePhotoUploadService.getUserProfilePhotos(user.id);
        const updatedPhotos = currentPhotos.filter(url => !url.includes(storagePath));
        await ProfilePhotoUploadService.updateProfilePhotosArray(user.id, updatedPhotos);
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting photo:', error);
      onError?.(error instanceof Error ? error.message : 'Delete failed');
      return false;
    }
  }, [user?.id, onError]);

  // Get user's profile photos
  const getUserPhotos = useCallback(async (): Promise<string[]> => {
    if (!user?.id) return [];
    
    try {
      return await ProfilePhotoUploadService.getUserProfilePhotos(user.id);
    } catch (error) {
      console.error('Error getting user photos:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to fetch photos');
      return [];
    }
  }, [user?.id, onError]);

  return {
    // State
    uploading,
    uploadProgress,
    
    // Actions
    requestPermissions,
    pickImageFromLibrary,
    takePhoto,
    uploadMultiplePhotos,
    deletePhoto,
    getUserPhotos,
    
    // Utilities
    isSupported: !!user?.id
  };
}
