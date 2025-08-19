import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { EdgeStorageService } from './edgeStorage';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';

export interface PhotoUploadResult {
  uri: string;
  width: number;
  height: number;
  type: string;
  fileName?: string;
  base64?: string;
}

export interface EnhancedUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  bucket?: string;
  error?: string;
  messageId?: string; // Add message ID for UUID-based filenames
}

export interface ProfilePhotoUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export enum PhotoType {
  PROFILE = 'profile',
  STICKER = 'sticker',
  CHAT = 'chat',
  GENERAL = 'general'
}

export class EnhancedPhotoUploadService {
  private static readonly PROFILE_BUCKET_NAME = 'profile-photo';
  private static readonly PROFILE_FOLDER_NAME = 'profile';

  /**
   * Generate a UUID for message ID and filename
   */
  static generateMessageId(): string {
    return uuidv4();
  }

  /**
   * Create filename from message ID with proper extension
   */
  static createFilenameFromMessageId(messageId: string, fileType: string): string {
    const extension = fileType.split('/')[1] || 'jpg';
    return `${messageId}.${extension}`;
  }

  /**
   * Enhanced profile photo upload to profile-photo bucket
   */
  static async uploadProfilePhotoToProfileBucket(
    userId: string,
    imageUri: string,
    options: ProfilePhotoUploadOptions = {}
  ): Promise<EnhancedUploadResult> {
    try {
      console.log('📤 Starting enhanced profile photo upload for user:', userId);

      // Generate unique filename
      const fileExtension = this.getFileExtension(imageUri);
      const timestamp = new Date().getTime();
      const filename = `profile-${timestamp}.${fileExtension}`;
      
      // Create the storage path: profile-photo/profile/user-uid/filename
      const storagePath = `${this.PROFILE_FOLDER_NAME}/${userId}/${filename}`;
      
      console.log('📁 Storage path:', storagePath);

      // Convert image to base64 or blob based on platform
      let fileData: string | Blob;
      
      if (Platform.OS === 'web') {
        // For web, convert to blob
        fileData = await this.uriToBlob(imageUri);
      } else {
        // For mobile, convert to base64
        fileData = await this.uriToBase64(imageUri);
      }

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.PROFILE_BUCKET_NAME)
        .upload(storagePath, fileData, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`,
          bucket: this.PROFILE_BUCKET_NAME
        };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.PROFILE_BUCKET_NAME)
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;
      
      console.log('✅ Enhanced profile photo uploaded successfully:', publicUrl);

      return {
        success: true,
        url: publicUrl,
        path: storagePath,
        bucket: this.PROFILE_BUCKET_NAME
      };

    } catch (error) {
      console.error('❌ Exception during enhanced profile photo upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        bucket: this.PROFILE_BUCKET_NAME
      };
    }
  }

  /**
   * Upload multiple profile photos to profile-photo bucket
   */
  static async uploadMultipleProfilePhotosToProfileBucket(
    userId: string,
    imageUris: string[],
    options: ProfilePhotoUploadOptions = {}
  ): Promise<EnhancedUploadResult[]> {
    const results: EnhancedUploadResult[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const result = await this.uploadProfilePhotoToProfileBucket(userId, imageUris[i], options);
      results.push(result);
      
      // Add small delay between uploads to avoid overwhelming the server
      if (i < imageUris.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  /**
   * Get all profile photos for a user from profile-photo bucket
   */
  static async getUserProfilePhotosFromProfileBucket(userId: string): Promise<string[]> {
    try {
      console.log('🔍 Fetching profile photos for user:', userId);
      
      const { data, error } = await supabase.storage
        .from(this.PROFILE_BUCKET_NAME)
        .list(`${this.PROFILE_FOLDER_NAME}/${userId}`);

      if (error) {
        console.error('❌ Error listing profile photos:', error);
        return [];
      }

      const photoUrls: string[] = [];
      
      for (const file of data) {
        const { data: urlData } = supabase.storage
          .from(this.PROFILE_BUCKET_NAME)
          .getPublicUrl(`${this.PROFILE_FOLDER_NAME}/${userId}/${file.name}`);
        
        photoUrls.push(urlData.publicUrl);
      }

      console.log(`✅ Found ${photoUrls.length} profile photos`);
      return photoUrls;
    } catch (error) {
      console.error('❌ Exception fetching profile photos:', error);
      return [];
    }
  }

  /**
   * Update profile photos array in the profiles table
   */
  static async updateProfilePhotosArrayInDatabase(userId: string, photoUrls: string[]): Promise<boolean> {
    try {
      console.log('🔄 Updating profile photos array for user:', userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          photos: photoUrls,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating profile photos array:', error);
        return false;
      }

      console.log('✅ Profile photos array updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception updating profile photos array:', error);
      return false;
    }
  }

  /**
   * Delete a profile photo from profile-photo bucket
   */
  static async deleteProfilePhotoFromProfileBucket(storagePath: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting profile photo:', storagePath);
      
      const { error } = await supabase.storage
        .from(this.PROFILE_BUCKET_NAME)
        .remove([storagePath]);

      if (error) {
        console.error('❌ Error deleting profile photo:', error);
        return false;
      }

      console.log('✅ Profile photo deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception deleting profile photo:', error);
      return false;
    }
  }

  /**
   * Get file extension from URI
   */
  private static getFileExtension(uri: string): string {
    const match = uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  /**
   * Convert URI to base64 (for mobile)
   */
  private static async uriToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('❌ Error converting URI to base64:', error);
      throw error;
    }
  }

  /**
   * Convert URI to blob (for web)
   */
  private static async uriToBlob(uri: string): Promise<Blob> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('❌ Error converting URI to blob:', error);
      throw error;
    }
  }

  /**
   * Validate image file for profile uploads
   */
  static validateImageForProfileUpload(imageUri: string): boolean {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = this.getFileExtension(imageUri);
    return validExtensions.includes(extension);
  }

  /**
   * Get image dimensions for profile uploads
   */
  static async getImageDimensionsForProfileUpload(imageUri: string): Promise<{ width: number; height: number } | null> {
    try {
      // Use ImagePicker.launchImageLibraryAsync to get image info
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        return {
          width: result.assets[0].width,
          height: result.assets[0].height
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Upload photo with UUID-based filename for message integration
   */
  static async uploadPhotoWithMessageId(
    photo: PhotoUploadResult,
    messageId: string,
    photoType: PhotoType = PhotoType.CHAT,
    customPath?: string
  ): Promise<EnhancedUploadResult> {
    try {
      console.log('=== Starting UUID-based Photo Upload ===');
      console.log('Message ID:', messageId);
      console.log('Photo type:', photoType);

      // Validate the image
      const validation = this.validateImage(photo);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Convert photo to File object with messageId as filename
      const file = await this.photoToFile(photo, messageId);
      if (!file) {
        return { success: false, error: 'Failed to convert photo to file' };
      }

      // Determine bucket and path based on photo type
      const { bucket, path } = this.getBucketAndPath(photoType, customPath);
      
      // If customPath is provided, use it directly (it should already include the filename structure)
      // Otherwise, use the path with the filename from the File object
      const fullPath = customPath || `${path}/${file.name}`;

      console.log('Using bucket:', bucket);
      console.log('Using path:', fullPath);

      // Upload using Edge Function
      const result = await EdgeStorageService.uploadFile(bucket, fullPath, file);

      if (result.success) {
        console.log('✓ Photo uploaded successfully with UUID filename');
        console.log('URL:', result.url);
        console.log('Path:', result.path);

        return {
          success: true,
          url: result.url,
          path: result.path,
          bucket: bucket,
          messageId: messageId
        };
      } else {
        console.error('✗ Upload failed:', result.error);
        return {
          success: false,
          error: result.error || 'Upload failed',
          bucket: bucket,
          messageId: messageId
        };
      }

    } catch (error) {
      console.error('=== UUID-based Photo Upload Failed ===');
      console.error('Error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        messageId: messageId
      };
    }
  }

  /**
   * Request camera and media library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!cameraPermission.granted || !mediaLibraryPermission.granted) {
        Alert.alert(
          'Permissions Required',
          'Camera and media library permissions are required to upload photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Show image picker options (camera or gallery)
   */
  static async showImagePickerOptions(): Promise<PhotoUploadResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      Alert.alert(
        'Select Photo',
        'Choose how you want to add a photo',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await this.takePhotoWithCamera();
              return result;
            }
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await this.pickImageFromGallery();
              return result;
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );

      return null;
    } catch (error) {
      console.error('Error showing image picker options:', error);
      Alert.alert('Error', 'Failed to show image picker options');
      return null;
    }
  }

  /**
   * Pick image from gallery
   */
  static async pickImageFromGallery(): Promise<PhotoUploadResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow any aspect ratio
        quality: 0.8,
        allowsMultipleSelection: false,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image/jpeg',
          fileName: asset.fileName || undefined,
          base64: asset.base64 || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  static async takePhotoWithCamera(): Promise<PhotoUploadResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow any aspect ratio
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image/jpeg',
          fileName: asset.fileName || undefined,
          base64: asset.base64 || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      Alert.alert('Error', 'Failed to take photo with camera');
      return null;
    }
  }

  /**
   * Upload photo using Edge Functions to appropriate bucket
   */
  static async uploadPhotoWithEdgeFunction(
    photo: PhotoUploadResult, 
    photoType: PhotoType = PhotoType.PROFILE,
    customPath?: string
  ): Promise<EnhancedUploadResult> {
    try {
      console.log('=== Starting Enhanced Photo Upload with Edge Function ===');
      console.log('Photo type:', photoType);
      console.log('Photo details:', {
        width: photo.width,
        height: photo.height,
        type: photo.type,
        fileName: photo.fileName
      });

      // Validate the image
      const validation = this.validateImage(photo);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Convert photo to File object
      const file = await this.photoToFile(photo);
      if (!file) {
        return { success: false, error: 'Failed to convert photo to file' };
      }

      // Determine bucket and path based on photo type
      const { bucket, path } = this.getBucketAndPath(photoType, customPath);

      // Use the filename from the File object
      const fullPath = customPath || `${path}/${file.name}`;

      console.log('Using bucket:', bucket);
      console.log('Using path:', fullPath);

      // Upload using Edge Function
      const result = await EdgeStorageService.uploadFile(bucket, fullPath, file);

      if (result.success) {
        console.log('✓ Photo uploaded successfully');
        console.log('URL:', result.url);
        console.log('Path:', result.path);
        
        return {
          success: true,
          url: result.url,
          path: result.path,
          bucket: bucket
        };
      } else {
        console.error('✗ Upload failed:', result.error);
        return {
          success: false,
          error: result.error || 'Upload failed',
          bucket: bucket
        };
      }

    } catch (error) {
      console.error('=== Enhanced Photo Upload Failed ===');
      console.error('Error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get bucket and path based on photo type and custom path
   */
  private static getBucketAndPath(photoType: PhotoType, customPath?: string): { bucket: string; path: string } {
    switch (photoType) {
      case PhotoType.PROFILE:
        return {
          bucket: 'chat-media',
          path: customPath || `profiles`
        };

      case PhotoType.STICKER:
        return {
          bucket: 'chat-media',
          path: customPath || `stickers`
        };

      case PhotoType.CHAT:
        return {
          bucket: 'chat-media',
          path: customPath || `conversations`
        };

      case PhotoType.GENERAL:
      default:
        return {
          bucket: 'user-uploads',
          path: customPath || `general`
        };
    }
  }

  /**
   * Create organized path for chat media with conversation and user structure
   */
  static createChatMediaPath(
    conversationId: string,
    userId: string,
    messageId: string,
    fileType: string
  ): string {
    const extension = fileType.split('/')[1] || 'jpg';
    return `conversations/${conversationId}/${userId}/${messageId}.${extension}`;
  }

  /**
   * Validate image requirements (file size limit is handled by Edge Function)
   */
  private static validateImage(photo: PhotoUploadResult): { isValid: boolean; error?: string } {
    // Check file type
    if (!photo.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'File must be an image'
      };
    }

    // Check file size if we have base64 data
    if (photo.base64) {
      const sizeInBytes = Math.ceil((photo.base64.length * 3) / 4); // Base64 to bytes conversion
      const sizeInKB = sizeInBytes / 1024;
      
      if (sizeInKB > 51200) { // 50MB = 51200 KB
        return {
          isValid: false,
          error: `File size (${Math.round(sizeInKB)} KB) exceeds 50MB limit`
        };
      }
      
      console.log(`File size: ${Math.round(sizeInKB)} KB`);
    }

    return { isValid: true };
  }

  /**
   * Convert photo to File object for Edge Function
   */
  private static async photoToFile(photo: PhotoUploadResult, messageId?: string): Promise<File | null> {
    try {
      // Determine filename - use messageId if provided, otherwise use original filename or timestamp
      const extension = photo.type.split('/')[1] || 'jpg';
      const fileName = messageId ? `${messageId}.${extension}` : (photo.fileName || `photo_${Date.now()}.${extension}`);
      
      // If we have base64 data, use it directly
      if (photo.base64) {
        const base64Data = photo.base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        
        return new File([byteArray], fileName, { type: photo.type });
      }

      // Otherwise, fetch the image and convert
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      
      return new File([blob], fileName, { type: photo.type });
    } catch (error) {
      console.error('Error converting photo to file:', error);
      return null;
    }
  }

  /**
   * Upload profile photo
   */
  static async uploadProfilePhoto(photo: PhotoUploadResult): Promise<EnhancedUploadResult> {
    return this.uploadPhotoWithEdgeFunction(photo, PhotoType.PROFILE);
  }

  /**
   * Upload sticker
   */
  static async uploadSticker(photo: PhotoUploadResult): Promise<EnhancedUploadResult> {
    return this.uploadPhotoWithEdgeFunction(photo, PhotoType.STICKER);
  }

  /**
   * Upload chat media
   */
  static async uploadChatMedia(photo: PhotoUploadResult, conversationId?: string): Promise<EnhancedUploadResult> {
    const path = conversationId ? `conversations/${conversationId}/media` : 'media';
    return this.uploadPhotoWithEdgeFunction(photo, PhotoType.CHAT, path);
  }

  /**
   * Upload general user content
   */
  static async uploadUserContent(photo: PhotoUploadResult, category?: string): Promise<EnhancedUploadResult> {
    const path = category ? `content/${category}` : 'content';
    return this.uploadPhotoWithEdgeFunction(photo, PhotoType.GENERAL, path);
  }
} 