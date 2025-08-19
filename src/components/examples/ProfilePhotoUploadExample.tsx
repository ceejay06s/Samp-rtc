import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { useProfilePhotoUpload } from '../../hooks/useProfilePhotoUpload';

export function ProfilePhotoUploadExample() {
  const { user } = useAuth();
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  
  const {
    uploading,
    uploadProgress,
    pickImageFromLibrary,
    takePhoto,
    uploadMultiplePhotos,
    deletePhoto,
    getUserPhotos,
    isSupported
  } = useProfilePhotoUpload({
    onSuccess: (result) => {
      console.log('✅ Upload successful:', result);
      // Refresh user photos
      refreshUserPhotos();
    },
    onError: (error) => {
      console.error('❌ Upload error:', error);
      Alert.alert('Upload Failed', error);
    },
    onProgress: (progress) => {
      console.log('📊 Upload progress:', progress);
    }
  });

  // Load user photos on component mount
  useEffect(() => {
    if (isSupported) {
      refreshUserPhotos();
    }
  }, [isSupported]);

  const refreshUserPhotos = async () => {
    const photos = await getUserPhotos();
    setUserPhotos(photos);
  };

  const handlePickImage = async () => {
    await pickImageFromLibrary({
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      allowsEditing: true,
      aspect: [1, 1]
    });
  };

  const handleTakePhoto = async () => {
    await takePhoto({
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      allowsEditing: true,
      aspect: [1, 1]
    });
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // Extract storage path from URL
            const urlParts = photoUrl.split('/');
            const storagePath = urlParts.slice(-3).join('/'); // profile/user-id/filename
            
            const success = await deletePhoto(storagePath);
            if (success) {
              refreshUserPhotos();
            }
          }
        }
      ]
    );
  };

  if (!isSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not authenticated</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile Photo Upload</Text>
      
      {/* Upload Progress */}
      {uploading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Uploading... {uploadProgress}%
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${uploadProgress}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Upload Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload New Photo</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              📷 Pick from Library
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              📸 Take Photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Photos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your Profile Photos ({userPhotos.length})
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshUserPhotos}
            disabled={uploading}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        {userPhotos.length === 0 ? (
          <Text style={styles.emptyText}>No photos uploaded yet</Text>
        ) : (
          <View style={styles.photosGrid}>
            {userPhotos.map((photoUrl, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image 
                  source={{ uri: photoUrl }} 
                  style={styles.photo}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(photoUrl)}
                  disabled={uploading}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
                
                {/* Photo info */}
                <View style={styles.photoInfo}>
                  <Text style={styles.photoIndex}>Photo {index + 1}</Text>
                  {index === 0 && (
                    <Text style={styles.primaryPhoto}>Primary</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        <Text style={styles.userInfo}>User ID: {user?.id}</Text>
        <Text style={styles.userInfo}>Email: {user?.email}</Text>
      </View>

      {/* Loading State */}
      {uploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  photoIndex: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryPhoto: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 16,
    marginTop: 50,
  },
});
