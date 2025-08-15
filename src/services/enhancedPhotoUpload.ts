import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { EdgeStorageService } from './edgeStorage';

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

export enum PhotoType {
  PROFILE = 'profile',
  STICKER = 'sticker',
  CHAT = 'chat',
  GENERAL = 'general'
}

export class EnhancedPhotoUploadService {
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