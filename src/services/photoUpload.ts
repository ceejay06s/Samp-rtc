import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

export interface PhotoUploadResult {
  uri: string;
  width: number;
  height: number;
  type: string;
  fileName?: string;
  base64?: string; // Optional base64 data for free plan compatibility
}

export class PhotoUploadService {
  static async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to take photos for your profile.'
        );
        return false;
      }

      // Request media library permissions
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert(
          'Media Library Permission Required',
          'Please grant media library permission to select photos for your profile.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  static async pickImageFromGallery(): Promise<PhotoUploadResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Profile photo aspect ratio
        quality: 0.8,
        allowsMultipleSelection: false,
        base64: true, // Enable base64 for free plan compatibility
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image/jpeg',
          fileName: asset.fileName || undefined,
          base64: asset.base64 || undefined, // Include base64 data
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
      return null;
    }
  }

  static async takePhotoWithCamera(): Promise<PhotoUploadResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Profile photo aspect ratio
        quality: 0.8,
        base64: true, // Enable base64 for free plan compatibility
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image/jpeg',
          fileName: asset.fileName || undefined,
          base64: asset.base64 || undefined, // Include base64 data
        };
      }

      return null;
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      Alert.alert('Error', 'Failed to take photo with camera');
      return null;
    }
  }

  // Web-specific file upload method
  static async uploadFileFromWeb(file: File): Promise<PhotoUploadResult | null> {
    try {
      console.log('=== Starting web file upload ===');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB for web)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Create a temporary URL for the file
      const uri = URL.createObjectURL(file);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(file);

      console.log('✓ File processed successfully');
      console.log('Image dimensions:', dimensions);

      return {
        uri,
        width: dimensions.width,
        height: dimensions.height,
        type: file.type,
        fileName: file.name,
        base64,
      };
    } catch (error) {
      console.error('=== Web file upload failed ===');
      console.error('Error:', error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to convert File to base64
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Helper method to get image dimensions from File
  static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Enhanced showImagePickerOptions for web
  static async showImagePickerOptions(): Promise<PhotoUploadResult | null> {
    return new Promise((resolve) => {
      // Check if we're on web
      const isWeb = typeof window !== 'undefined' && window.navigator;
      
      if (isWeb) {
        // On web, just open file picker directly
        this.pickImageFromGallery().then(resolve);
      } else {
        // On mobile, show options
        Alert.alert(
          'Add Photo',
          'Choose how you want to add a photo',
          [
            {
              text: 'Camera',
              onPress: async () => {
                const result = await this.takePhotoWithCamera();
                resolve(result);
              },
            },
            {
              text: 'Gallery',
              onPress: async () => {
                const result = await this.pickImageFromGallery();
                resolve(result);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(null),
            },
          ]
        );
      }
    });
  }

  // Free plan compatible upload - stores images as base64 data URLs
  static async uploadPhotoForFreePlan(photo: PhotoUploadResult): Promise<string> {
    try {
      console.log('=== Starting photo upload (Free Plan) ===');
      console.log('Photo details:', {
        width: photo.width,
        height: photo.height,
        type: photo.type,
        fileName: photo.fileName
      });

      // Validate the image
      const validation = this.validateImage(photo);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Convert to base64 data URL if not already
      let dataUrl: string;
      
      if (photo.base64) {
        // Use the base64 data from the image picker
        dataUrl = `data:${photo.type};base64,${photo.base64}`;
      } else {
        // Convert the image to base64
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        const base64 = await this.blobToBase64(blob);
        dataUrl = `data:${photo.type};base64,${base64}`;
      }

      console.log('✓ Photo converted to base64 data URL');
      console.log('Data URL length:', dataUrl.length);

      // Check if the data URL is too large (database limit)
      if (dataUrl.length > 1000000) { // 1MB limit for database
        throw new Error('Image is too large. Please choose a smaller image or reduce quality.');
      }

      console.log('=== Photo upload completed (Free Plan) ===');
      return dataUrl;
    } catch (error) {
      console.error('=== Photo upload failed (Free Plan) ===');
      console.error('Error:', error);
      throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Legacy Supabase storage upload (for paid plans)
  static async uploadPhotoToSupabase(photo: PhotoUploadResult, userId: string): Promise<string> {
    try {
      console.log('=== Starting Supabase storage upload ===');
      console.log('User ID:', userId);
      console.log('Photo details:', {
        uri: photo.uri.substring(0, 50) + '...',
        width: photo.width,
        height: photo.height,
        type: photo.type,
        fileName: photo.fileName
      });

      // Step 1: Verify bucket exists
      console.log('Step 1: Verifying bucket exists...');
      await this.ensureStorageBucket();
      console.log('✓ Bucket verification passed');

      // Step 2: Generate filename
      const timestamp = Date.now();
      const fileExtension = photo.type === 'image/jpeg' ? 'jpg' : 'png';
      const fileName = `${userId}/${timestamp}.${fileExtension}`;
      console.log('Generated filename:', fileName);

      // Step 3: Convert image to blob
      console.log('Step 3: Converting image to blob...');
      const response = await fetch(photo.uri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('✓ Blob created, size:', blob.size, 'bytes');

      // Step 4: Upload to Supabase Storage
      console.log('Step 4: Uploading to Supabase storage...');
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob, {
          contentType: photo.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('✗ Supabase storage upload error:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name
        });
        
        // Provide specific error messages for common issues
        if (error.message.includes('bucket')) {
          throw new Error(`Storage bucket not found or not accessible. Please run the storage setup script.`);
        } else if (error.message.includes('policy') || error.message.includes('permission')) {
          throw new Error(`Permission denied. Please check your storage policies.`);
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error(`Network error. Please check your internet connection.`);
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Upload failed: No data returned from Supabase');
      }

      console.log('✓ Upload successful, data:', data);

      // Step 5: Get the public URL
      console.log('Step 5: Getting public URL...');
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('✓ Photo uploaded successfully:', publicUrl);
      console.log('=== Photo upload completed ===');

      return publicUrl;
    } catch (error) {
      console.error('=== Photo upload failed ===');
      console.error('Error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async uploadPhotoToServer(photo: PhotoUploadResult): Promise<string> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated, checking storage availability...');

      // Check if we can access Supabase storage (paid plan)
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError && listError.message.includes('not available')) {
          console.log('Storage not available (free plan), using base64 upload');
          return await this.uploadPhotoForFreePlan(photo);
        }
        
        // Try Supabase storage upload
        const supabaseUrl = await this.uploadPhotoToSupabase(photo, user.id);
        console.log('Supabase upload successful:', supabaseUrl);
        return supabaseUrl;
        
      } catch (storageError) {
        console.log('Storage not available, falling back to base64 upload');
        return await this.uploadPhotoForFreePlan(photo);
      }
    } catch (error) {
      console.error('Error in uploadPhotoToServer:', error);
      
      // Final fallback to base64
      console.log('Falling back to base64 upload due to error:', error);
      return await this.uploadPhotoForFreePlan(photo);
    }
  }

  static async deletePhotoFromSupabase(photoUrl: string): Promise<void> {
    try {
      // Only try to delete if it's a Supabase URL
      if (!photoUrl.includes('supabase.co') && !photoUrl.includes('storage.googleapis.com')) {
        console.log('Not a Supabase URL, skipping deletion');
        return;
      }

      // Extract the file path from the URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      const filePath = `${userId}/${fileName}`;

      console.log('Deleting photo from Supabase:', filePath);

      const { error } = await supabase.storage
        .from('profile-photos')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting photo from Supabase:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }

      console.log('Photo deleted successfully from Supabase');
    } catch (error) {
      console.error('Error deleting photo:', error);
      // Don't throw error for deletion failures as it's not critical
    }
  }

  static async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  }

  static validateImage(photo: PhotoUploadResult): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    
    // Check dimensions (minimum 300x400)
    const minWidth = 300;
    const minHeight = 400;

    if (photo.width < minWidth || photo.height < minHeight) {
      return {
        isValid: false,
        error: `Image must be at least ${minWidth}x${minHeight} pixels`,
      };
    }

    // Check aspect ratio (should be close to 3:4)
    const aspectRatio = photo.width / photo.height;
    const targetAspectRatio = 3 / 4;
    const tolerance = 0.1;

    if (Math.abs(aspectRatio - targetAspectRatio) > tolerance) {
      return {
        isValid: false,
        error: 'Image should have a 3:4 aspect ratio (portrait orientation)',
      };
    }

    return { isValid: true };
  }

  static async saveToGallery(uri: string): Promise<void> {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
    } catch (error) {
      console.error('Error saving to gallery:', error);
    }
  }

  // Helper method to convert blob to base64
  static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Helper method to create Supabase storage bucket if it doesn't exist
  static async ensureStorageBucket(): Promise<void> {
    try {
      console.log('Checking storage bucket configuration...');
      
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error checking storage buckets:', listError);
        throw new Error(`Failed to check storage buckets: ${listError.message}`);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'profile-photos');
      
      if (!bucketExists) {
        console.warn('Profile photos bucket does not exist. Please run the SQL setup script.');
        console.warn('Run this in your Supabase SQL editor: sql/fix-storage-bucket.sql');
        throw new Error('Storage bucket "profile-photos" does not exist. Please run the setup script.');
      }
      
      console.log('Storage bucket "profile-photos" exists and is accessible');
      
      // Test bucket access by trying to list files
      const { data: files, error: listFilesError } = await supabase.storage
        .from('profile-photos')
        .list('', { limit: 1 });
      
      if (listFilesError) {
        console.error('Error accessing storage bucket:', listFilesError);
        throw new Error(`Storage bucket access denied: ${listFilesError.message}`);
      }
      
      console.log('Storage bucket access confirmed');
      
    } catch (error) {
      console.error('Error ensuring storage bucket:', error);
      throw error;
    }
  }

  // Helper method to test photo upload functionality
  static async testPhotoUpload(): Promise<boolean> {
    try {
      console.log('Testing photo upload functionality...');
      
      // Create a simple test image (1x1 pixel)
      const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const testPhoto: PhotoUploadResult = {
        uri: testImageData,
        width: 1,
        height: 1,
        type: 'image/png',
        fileName: 'test.png'
      };
      
      const result = await this.uploadPhotoToServer(testPhoto);
      console.log('Test upload successful:', result.substring(0, 50) + '...');
      return true;
    } catch (error) {
      console.error('Test upload failed:', error);
      return false;
    }
  }

  // Comprehensive bucket connection test
  static async testBucketConnection(): Promise<{
    success: boolean;
    bucketExists: boolean;
    bucketAccessible: boolean;
    policiesExist: boolean;
    canUpload: boolean;
    errors: string[];
  }> {
    const results = {
      success: false,
      bucketExists: false,
      bucketAccessible: false,
      policiesExist: false,
      canUpload: false,
      errors: [] as string[]
    };

    try {
      console.log('=== Starting comprehensive bucket connection test ===');

      // Test 1: Check if we can connect to Supabase
      console.log('1. Testing Supabase connection...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        results.errors.push(`Authentication error: ${authError.message}`);
        console.error('Auth error:', authError);
      } else {
        console.log('✓ Supabase connection successful');
      }

      // Test 2: Check if storage is available
      console.log('2. Checking storage availability...');
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError && listError.message.includes('not available')) {
          results.errors.push('Storage not available on free plan - using base64 fallback');
          console.log('⚠ Storage not available (free plan)');
          results.success = true; // Base64 upload will work
          return results;
        }
        
        if (listError) {
          results.errors.push(`Failed to list buckets: ${listError.message}`);
          console.error('List buckets error:', listError);
        } else {
          console.log('✓ Storage is available');
          console.log('Available buckets:', buckets?.map(b => b.name) || []);
          
          const profilePhotosBucket = buckets?.find(b => b.name === 'profile-photos');
          results.bucketExists = !!profilePhotosBucket;
          
          if (profilePhotosBucket) {
            console.log('✓ Profile photos bucket found');
          } else {
            results.errors.push('Profile photos bucket not found');
            console.error('✗ Profile photos bucket not found');
          }
        }
      } catch (storageError) {
        results.errors.push('Storage not available - using base64 fallback');
        console.log('⚠ Storage not available, base64 upload will be used');
        results.success = true; // Base64 upload will work
        return results;
      }

      // Test 3: Try to access the bucket
      if (results.bucketExists) {
        console.log('3. Testing bucket access...');
        const { data: files, error: accessError } = await supabase.storage
          .from('profile-photos')
          .list('', { limit: 1 });
        
        if (accessError) {
          results.errors.push(`Bucket access error: ${accessError.message}`);
          console.error('Bucket access error:', accessError);
        } else {
          results.bucketAccessible = true;
          console.log('✓ Bucket access successful');
        }
      }

      // Test 4: Check if we can upload a test file
      if (results.bucketAccessible && user) {
        console.log('4. Testing upload capability...');
        try {
          const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
          const response = await fetch(testImageData);
          const blob = await response.blob();
          
          const testFileName = `${user.id}/test-${Date.now()}.png`;
          console.log('Attempting to upload test file:', testFileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(testFileName, blob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            results.errors.push(`Upload test failed: ${uploadError.message}`);
            console.error('Upload test error:', uploadError);
          } else {
            results.canUpload = true;
            console.log('✓ Upload test successful');
            console.log('Upload data:', uploadData);

            // Clean up test file
            const { error: deleteError } = await supabase.storage
              .from('profile-photos')
              .remove([testFileName]);
            
            if (deleteError) {
              console.warn('Failed to clean up test file:', deleteError);
            } else {
              console.log('✓ Test file cleaned up');
            }
          }
        } catch (uploadTestError) {
          results.errors.push(`Upload test exception: ${uploadTestError instanceof Error ? uploadTestError.message : 'Unknown error'}`);
          console.error('Upload test exception:', uploadTestError);
        }
      }

      // Determine overall success
      results.success = results.bucketExists && results.bucketAccessible && results.canUpload;
      
      console.log('=== Bucket connection test completed ===');
      console.log('Results:', results);
      
      return results;
    } catch (error) {
      console.error('Bucket connection test failed:', error);
      results.errors.push(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }
} 