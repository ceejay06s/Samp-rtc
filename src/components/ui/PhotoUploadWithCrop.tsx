import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { EnhancedPhotoUploadService, PhotoType } from '../../services/enhancedPhotoUpload';
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
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = async () => {
    try {
      const photo = await EnhancedPhotoUploadService.pickImageFromGallery();
      if (photo) {
        setSelectedImage(photo.uri);
        setShowCropper(true);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
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

      // Convert the cropped image to the format expected by EnhancedPhotoUploadService
      const photoData = {
        uri: croppedImageUri,
        width: width,
        height: height,
        type: 'image/jpeg',
        fileName: `photo_${Date.now()}.jpg`,
      };

      const result = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
        photoData,
        PhotoType.PROFILE
      );

      if (result.success && result.url) {
        onUploadComplete(result.url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
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
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Add Profile Photo
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Choose a photo from your gallery. You can crop it to fit perfectly.
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Select Photo"
          onPress={handleImageSelect}
          disabled={isUploading}
          style={styles.button}
        />
        
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="secondary"
          disabled={isUploading}
          style={styles.button}
        />
      </View>

      {isUploading && (
        <View style={styles.uploadingContainer}>
          <Text style={[styles.uploadingText, { color: theme.colors.textSecondary }]}>
            Uploading...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('md'),
    textAlign: 'center',
  },
  description: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('lg'),
    lineHeight: getResponsiveFontSize('md') * 1.4,
  },
  buttonContainer: {
    width: '100%',
    gap: getResponsiveSpacing('md'),
  },
  button: {
    marginVertical: getResponsiveSpacing('sm'),
  },
  uploadingContainer: {
    marginTop: getResponsiveSpacing('md'),
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: getResponsiveFontSize('md'),
  },
}); 