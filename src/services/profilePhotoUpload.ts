import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export interface ProfilePhotoUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export class ProfilePhotoUploadService {
  private static readonly BUCKET_NAME = 'profile-photo';
  private static readonly FOLDER_NAME = 'profile';

  /**
   * Request camera and photo library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus === 'granted' && libraryStatus === 'granted';
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick an image from the photo library
   */
  static async pickImageFromLibrary(options: ProfilePhotoUploadOptions = {}): Promise<string | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        maxWidth: options.maxWidth ?? 800,
        maxHeight: options.maxHeight ?? 800,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('❌ Error picking image from library:', error);
      return null;
    }
  }

  /**
   * Take a photo with the camera
   */
  static async takePhoto(options: ProfilePhotoUploadOptions = {}): Promise<string | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.8,
        maxWidth: options.maxWidth ?? 800,
        maxHeight: options.maxHeight ?? 800,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      return null;
    }
  }

  /**
   * Upload a profile photo to Supabase storage
   */
  static async uploadProfilePhoto(
    userId: string,
    imageUri: string,
    options: ProfilePhotoUploadOptions = {}
  ): Promise<UploadResult> {
    try {
      console.log('📤 Starting profile photo upload for user:', userId);

      // Generate unique filename
      const fileExtension = this.getFileExtension(imageUri);
      const timestamp = new Date().getTime();
      const filename = `profile-${timestamp}.${fileExtension}`;
      
      // Create the storage path: profile-photo/profile/user-uid/filename
      const storagePath = `${this.FOLDER_NAME}/${userId}/${filename}`;
      
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
        .from(this.BUCKET_NAME)
        .upload(storagePath, fileData, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;
      
      console.log('✅ Profile photo uploaded successfully:', publicUrl);

      return {
        success: true,
        url: publicUrl,
        path: storagePath
      };

    } catch (error) {
      console.error('❌ Exception during profile photo upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload multiple profile photos
   */
  static async uploadMultipleProfilePhotos(
    userId: string,
    imageUris: string[],
    options: ProfilePhotoUploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const result = await this.uploadProfilePhoto(userId, imageUris[i], options);
      results.push(result);
      
      // Add small delay between uploads to avoid overwhelming the server
      if (i < imageUris.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  /**
   * Delete a profile photo
   */
  static async deleteProfilePhoto(storagePath: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting profile photo:', storagePath);
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
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
   * Get all profile photos for a user
   */
  static async getUserProfilePhotos(userId: string): Promise<string[]> {
    try {
      console.log('🔍 Fetching profile photos for user:', userId);
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`${this.FOLDER_NAME}/${userId}`);

      if (error) {
        console.error('❌ Error listing profile photos:', error);
        return [];
      }

      const photoUrls: string[] = [];
      
      for (const file of data) {
        const { data: urlData } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(`${this.FOLDER_NAME}/${userId}/${file.name}`);
        
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
  static async updateProfilePhotosArray(userId: string, photoUrls: string[]): Promise<boolean> {
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
   * Validate image file
   */
  static validateImage(imageUri: string): boolean {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = this.getFileExtension(imageUri);
    return validExtensions.includes(extension);
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(imageUri: string): Promise<{ width: number; height: number } | null> {
    try {
      const result = await ImagePicker.getImageInfoAsync(imageUri);
      return {
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('❌ Error getting image dimensions:', error);
      return null;
    }
  }
}

// Export convenience functions
export const uploadProfilePhoto = ProfilePhotoUploadService.uploadProfilePhoto;
export const uploadMultipleProfilePhotos = ProfilePhotoUploadService.uploadMultipleProfilePhotos;
export const deleteProfilePhoto = ProfilePhotoUploadService.deleteProfilePhoto;
export const getUserProfilePhotos = ProfilePhotoUploadService.getUserProfilePhotos;
export const updateProfilePhotosArray = ProfilePhotoUploadService.updateProfilePhotosArray;
export const pickImageFromLibrary = ProfilePhotoUploadService.pickImageFromLibrary;
export const takePhoto = ProfilePhotoUploadService.takePhoto;
export const requestPermissions = ProfilePhotoUploadService.requestPermissions;
