# Edge Function Photo Upload Integration Guide

## 🎯 Overview

This guide explains how to integrate the Edge Function photo upload system into your dating app for profile photos and chat images. The system uses Supabase Edge Functions with automatic JWT authentication for secure, reliable photo uploads.

## ✨ Features

### **🔐 Secure Authentication**
- **Automatic JWT handling** - No manual token management
- **User-specific uploads** - Photos are organized by user ID
- **Permission validation** - Ensures users can only upload to their own folders

### **📁 Organized Storage**
- **Profile photos** → `profile-photo` bucket
- **Chat images** → `chat-media` bucket  
- **Stickers** → `telegram-stickers` bucket
- **General uploads** → `user-uploads` bucket

### **🔄 Cross-Platform Support**
- **iOS/Android** - Native camera and gallery integration
- **Web** - File input and drag-and-drop support
- **Automatic conversion** - Handles different image formats

## 🚀 Integration Steps

### **1. Profile Photo Upload**

#### **Updated Profile Screen (`app/profile.tsx`)**

```typescript
import { EnhancedPhotoUploadService, PhotoType } from '../src/services/enhancedPhotoUpload';

// Enhanced photo upload handler
const handleEnhancedPhotoUpload = async () => {
  if (!user) {
    showAlert('Error', 'Please log in to add photos');
    return;
  }

  try {
    setUploadingPhoto(true);
    
    // Show photo picker options (camera/gallery)
    const photo = await EnhancedPhotoUploadService.showImagePickerOptions();
    if (!photo) {
      setUploadingPhoto(false);
      return;
    }

    // Upload using Edge Function
    const result = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
      photo,
      PhotoType.PROFILE
    );

    if (result.success && result.url) {
      // Add to local state
      setPhotos(prev => [...prev, result.url!]);
      
      // Save to profile immediately
      await AuthService.updateProfile(user.id, { photos: [...photos, result.url!] });
      
      // Show success message
      showAlert('Success', 'Photo uploaded successfully!');
    } else {
      showAlert('Error', result.error || 'Failed to upload photo');
    }
  } catch (error) {
    console.error('Failed to upload photo:', error);
    showAlert('Error', `Failed to upload photo: ${error.message}`);
  } finally {
    setUploadingPhoto(false);
  }
};
```

#### **Add Upload Button**

```tsx
// In your profile screen JSX
<Button 
  title="Add Photo (Edge Function)" 
  onPress={handleEnhancedPhotoUpload}
  disabled={uploadingPhoto}
/>
{uploadingPhoto && <Text>Uploading...</Text>}
```

### **2. Chat Image Upload**

#### **Updated Chat Component (`src/components/ui/EnhancedRealtimeChat.tsx`)**

```typescript
import { EnhancedPhotoUploadService, PhotoType } from '../../services/enhancedPhotoUpload';

// Enhanced image picker for chat
const handleImagePicker = async () => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('Image selected:', asset.uri);
      
      // Show loading indicator
      Alert.alert('Uploading...', 'Please wait while we upload your image.');
      
      // Convert to PhotoUploadResult format
      const photoData = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image/jpeg',
        fileName: asset.fileName || `chat_image_${Date.now()}.jpg`,
        base64: asset.base64 || undefined,
      };

      // Create conversation-specific path
      const chatPath = conversationId 
        ? `conversations/${conversationId}/${Date.now()}.jpg`
        : `general/${Date.now()}.jpg`;

      // Upload using Edge Function
      const uploadResult = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
        photoData,
        PhotoType.CHAT,
        chatPath
      );
      
      if (uploadResult.success && uploadResult.url) {
        console.log('Image uploaded successfully:', uploadResult.url);
        console.log('File path:', uploadResult.path);
        
        // Add the uploaded image to selected media
        const newMedia = { 
          type: 'image' as const, 
          url: uploadResult.url, 
          id: Date.now().toString() 
        };
        setSelectedMedia(prev => [...prev, newMedia]);
        setShowAttachmentMenu(false);
        
        Alert.alert('Success', 'Image uploaded successfully!');
      } else {
        console.error('Upload failed:', uploadResult.error);
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
  }
};
```

### **3. Enhanced Photo Upload Service**

#### **Key Methods (`src/services/enhancedPhotoUpload.ts`)**

```typescript
// Show photo picker options (camera or gallery)
const photo = await EnhancedPhotoUploadService.showImagePickerOptions();

// Upload with specific photo type
const result = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
  photo,
  PhotoType.PROFILE  // or PhotoType.CHAT, PhotoType.STICKER, PhotoType.GENERAL
);

// Test the upload system
const testResult = await EnhancedPhotoUploadService.testPhotoUpload();
```

#### **Photo Types**

```typescript
export enum PhotoType {
  PROFILE = 'profile',    // → profile-photo bucket
  STICKER = 'sticker',    // → telegram-stickers bucket  
  CHAT = 'chat',          // → chat-media bucket
  GENERAL = 'general'     // → user-uploads bucket
}
```

## 📊 Expected Results

### **Successful Upload**
```json
{
  "success": true,
  "url": "https://xbcrxnebziipzqoorkti.supabase.co/storage/v1/object/public/profile-photo/profile_1703123456789.jpg",
  "path": "profile-photo/profile_1703123456789.jpg",
  "bucket": "profile-photo"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Image must be at least 300x400 pixels",
  "bucket": "profile-photo"
}
```

## 🔧 Configuration

### **Environment Variables**
Ensure these are set in your `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### **Edge Function Environment**
The Edge Function needs these environment variables:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Testing

### **1. Test Profile Photo Upload**
```typescript
// In your profile screen
const testPhotoUpload = async () => {
  const result = await EnhancedPhotoUploadService.testPhotoUpload();
  console.log('Test result:', result);
  
  if (result.success) {
    showAlert('Success', 'Photo upload system is working!');
  } else {
    showAlert('Error', `Test failed: ${result.error}`);
  }
};
```

### **2. Test Chat Image Upload**
```typescript
// In your chat component
const testChatUpload = async () => {
  const testPhoto = {
    uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    width: 1,
    height: 1,
    type: 'image/png',
    fileName: 'test.png',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  };

  const result = await EnhancedPhotoUploadService.uploadPhotoWithEdgeFunction(
    testPhoto,
    PhotoType.CHAT,
    'test/chat_test.png'
  );
  
  console.log('Chat upload test:', result);
};
```

## 🔍 Error Handling

### **Common Errors and Solutions**

#### **"Permission denied"**
- **Cause**: User not authenticated or insufficient permissions
- **Solution**: Ensure user is logged in and has proper permissions

#### **"Image validation failed"**
- **Cause**: Image doesn't meet requirements (size, aspect ratio)
- **Solution**: Validate images before upload

#### **"Edge Function not found"**
- **Cause**: Edge Function not deployed
- **Solution**: Deploy the function using `npx supabase functions deploy storage-operations`

#### **"Bucket not found"**
- **Cause**: Storage bucket doesn't exist
- **Solution**: Create buckets using the bucket setup service

## 🚀 Best Practices

### **1. Always Validate Images**
```typescript
// Validate before upload
const validation = EnhancedPhotoUploadService.validateImage(photo);
if (!validation.isValid) {
  showAlert('Error', validation.error);
  return;
}
```

### **2. Handle Loading States**
```typescript
const [isUploading, setIsUploading] = useState(false);

const handleUpload = async () => {
  setIsUploading(true);
  try {
    // Upload logic
  } finally {
    setIsUploading(false);
  }
};
```

### **3. Provide User Feedback**
```typescript
// Show progress
Alert.alert('Uploading...', 'Please wait while we upload your photo.');

// Show success/error
if (result.success) {
  showAlert('Success', 'Photo uploaded successfully!');
} else {
  showAlert('Error', result.error || 'Upload failed');
}
```

### **4. Organize Files by User/Conversation**
```typescript
// Profile photos: user-specific folders
const profilePath = `users/${userId}/profile_${timestamp}.jpg`;

// Chat images: conversation-specific folders  
const chatPath = `conversations/${conversationId}/${timestamp}.jpg`;
```

## 📱 UI Integration Examples

### **Profile Photo Upload Button**
```tsx
<View style={styles.photoUploadSection}>
  <Text style={styles.sectionTitle}>Profile Photos</Text>
  <Button 
    title={uploadingPhoto ? "Uploading..." : "Add Photo"}
    onPress={handleEnhancedPhotoUpload}
    disabled={uploadingPhoto}
    style={styles.uploadButton}
  />
  {uploadingPhoto && (
    <ActivityIndicator size="small" color="#007AFF" />
  )}
</View>
```

### **Chat Attachment Menu**
```tsx
<View style={styles.attachmentMenu}>
  <TouchableOpacity onPress={handleImagePicker}>
    <Icon name="image" size={24} color="#007AFF" />
    <Text>Photo</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={handleCamera}>
    <Icon name="camera" size={24} color="#007AFF" />
    <Text>Camera</Text>
  </TouchableOpacity>
</View>
```

## 🎯 Next Steps

1. **Test the integration** with your existing app
2. **Add error boundaries** for better error handling
3. **Implement image compression** for better performance
4. **Add upload progress indicators** for better UX
5. **Implement retry logic** for failed uploads
6. **Add image preview** before upload

The Edge Function photo upload system provides a robust, secure, and user-friendly way to handle photo uploads in your dating app! 🎉 