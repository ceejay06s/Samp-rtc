import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PhotoUploadService } from '../../services/photoUpload';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { Button } from './Button';
import { CrossPlatformImageCropper } from './CrossPlatformImageCropper';

interface PhotoUploadWithCropProps {
  onUploadComplete: (imageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export const PhotoUploadWithCrop: React.FC<PhotoUploadWithCropProps> = ({
  onUploadComplete,
  onCancel,
  aspectRatio = 3 / 4,
}) => {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // We'll handle editing with our cropper
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // We'll handle editing with our cropper
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleCropComplete = async (croppedImageUri: string) => {
    setShowCropper(false);
    setIsUploading(true);

    try {
      // Get actual image dimensions from the cropped image
      const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.width, height: img.height });
          };
          img.onerror = reject;
          img.src = uri;
        });
      };

      let width = 800;
      let height = Math.round(800 * aspectRatio);

      try {
        const dimensions = await getImageDimensions(croppedImageUri);
        width = dimensions.width;
        height = dimensions.height;
      } catch (error) {
        console.warn('Could not get image dimensions, using defaults:', error);
      }

      // Convert the cropped image to the format expected by PhotoUploadService
      const photoData = {
        uri: croppedImageUri,
        width: width,
        height: height,
        type: 'image/jpeg',
        fileName: `photo_${Date.now()}.jpg`,
      };

      const imageUrl = await PhotoUploadService.uploadPhotoToServer(photoData);
      onUploadComplete(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
  };

  if (showCropper && selectedImage) {
    return (
      <CrossPlatformImageCropper
        imageUri={selectedImage}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        aspectRatio={aspectRatio}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Add Photo</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.uploadArea}>
          <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>
            Choose a Photo
          </Text>
          <Text style={[styles.uploadSubtitle, { color: theme.colors.textSecondary }]}>
            Select a photo from your gallery or take a new one
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="📷 Take Photo"
              onPress={takePhoto}
              style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
              disabled={isUploading}
            />
            
            <Button
              title="🖼️ Choose from Gallery"
              onPress={pickImage}
              style={[styles.uploadButton, { backgroundColor: theme.colors.secondary }]}
              disabled={isUploading}
            />
          </View>
        </View>

        {isUploading && (
          <View style={styles.uploadingContainer}>
            <Text style={[styles.uploadingText, { color: theme.colors.textSecondary }]}>
              Uploading photo...
            </Text>
          </View>
        )}
      </View>
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
    height: 60,
  },
  cancelButton: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
  },
  cancelText: {
    fontSize: getResponsiveFontSize('md'),
  },
  title: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: '600',
  },
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  uploadArea: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xl'),
  },
  uploadTitle: {
    fontSize: getResponsiveFontSize('xl'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('xl'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
  },
  buttonContainer: {
    width: '100%',
    gap: getResponsiveSpacing('md'),
  },
  uploadButton: {
    paddingVertical: getResponsiveSpacing('md'),
  },
  uploadingContainer: {
    alignItems: 'center',
    marginTop: getResponsiveSpacing('lg'),
  },
  uploadingText: {
    fontSize: getResponsiveFontSize('md'),
  },
}); 