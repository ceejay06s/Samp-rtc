import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';
import { WebFileInput } from './WebFileInput';

interface PhotoGalleryProps {
  photos: string[];
  onRemovePhoto: (index: number) => void;
  onAddPhoto: () => void;
  onFileSelect?: (file: File) => void; // New prop for web file handling
  maxPhotos?: number;
  uploading?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onRemovePhoto,
  onAddPhoto,
  onFileSelect,
  maxPhotos = 6,
  uploading = false,
}) => {
  const theme = useTheme();
  const { isWeb } = usePlatform();

  const handleRemovePhoto = (index: number) => {
    console.log('🖼️ PhotoGallery: handleRemovePhoto called with index:', index);
    console.log('🖼️ PhotoGallery: Total photos:', photos.length);
    
    // Call the parent's removePhoto function directly - it will handle the confirmation
    onRemovePhoto(index);
  };

  const renderAddPhotoButton = () => {
    if (photos.length >= maxPhotos) return null;

    if (isWeb && onFileSelect) {
      // Web version with file input
      return (
        <WebFileInput
          onFileSelect={onFileSelect}
          accept="image/*"
          disabled={uploading}
        >
          <View
            style={[
              styles.addPhotoButton,
              { borderColor: theme.colors.border },
              uploading && styles.addPhotoButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.addPhotoText,
                {
                  color: uploading ? theme.colors.textSecondary : theme.colors.primary,
                },
              ]}
            >
              {uploading ? '...' : '+'}
            </Text>
          </View>
        </WebFileInput>
      );
    }

    // Mobile version with touch handler
    return (
      <TouchableOpacity
        style={[
          styles.addPhotoButton,
          { borderColor: theme.colors.border },
          uploading && styles.addPhotoButtonDisabled,
        ]}
        onPress={onAddPhoto}
        disabled={uploading}
      >
        <Text
          style={[
            styles.addPhotoText,
            {
              color: uploading ? theme.colors.textSecondary : theme.colors.primary,
            },
          ]}
        >
          {uploading ? '...' : '+'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.photosGrid}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemovePhoto(index)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
            {index === 0 && (
              <View style={styles.mainPhotoBadge}>
                <Text style={styles.mainPhotoText}>Main</Text>
              </View>
            )}
          </View>
        ))}
        
        {renderAddPhotoButton()}
      </View>
      
      <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
        {photos.length === 0
          ? 'Add your first photo to get started!'
          : `Add up to ${maxPhotos} photos. First photo will be your main profile picture.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: getResponsiveSpacing('sm'),
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainPhotoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  addPhotoButton: {
    width: 100,
    height: 140,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
  },
  addPhotoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: getResponsiveFontSize('xs'),
    marginTop: getResponsiveSpacing('sm'),
    fontStyle: 'italic',
    textAlign: 'center',
  },
}); 