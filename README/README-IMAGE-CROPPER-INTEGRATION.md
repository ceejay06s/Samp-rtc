# Image Cropper Integration Guide

This guide shows how to integrate the new image cropping functionality into your dating app's photo upload flow.

## 🎯 Overview

The image cropper allows users to:
- **Crop photos** to the perfect 3:4 aspect ratio for dating profiles
- **Position the crop area** to focus on the best part of the image
- **Maintain quality** with proper image processing
- **Upload directly** after cropping

## 📦 Components Created

### 1. `ImageCropper.tsx`
- **React Native compatible** cropping interface
- **3:4 aspect ratio** optimized for dating app photos
- **Gesture controls** for positioning crop area
- **Clean UI** with cancel/done actions

### 2. `PhotoUploadWithCrop.tsx`
- **Complete upload flow** with cropping
- **Camera and gallery** options
- **Automatic cropping** before upload
- **Progress indicators** and error handling

## 🚀 Integration Steps

### Step 1: Replace Existing Photo Upload

Replace your current photo upload with the new cropper-enabled version:

```tsx
// Before (old way)
import { PhotoUploadService } from '../services/photoUpload';

// After (new way)
import { PhotoUploadWithCrop } from '../components/ui/PhotoUploadWithCrop';

// In your component
const [showPhotoUpload, setShowPhotoUpload] = useState(false);

const handlePhotoUpload = (imageUrl: string) => {
  // Handle the uploaded image URL
  console.log('Photo uploaded:', imageUrl);
  setShowPhotoUpload(false);
};

// In your JSX
{showPhotoUpload && (
  <PhotoUploadWithCrop
    onUploadComplete={handlePhotoUpload}
    onCancel={() => setShowPhotoUpload(false)}
    aspectRatio={3/4}
  />
)}
```

### Step 2: Update Profile Photo Upload

In your profile screen, replace the photo upload button:

```tsx
// In app/profile.tsx or similar
import { PhotoUploadWithCrop } from '../src/components/ui/PhotoUploadWithCrop';

export default function ProfileScreen() {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  const handlePhotoUpload = async (imageUrl: string) => {
    try {
      // Update user profile with new photo
      await updateProfilePhoto(imageUrl);
      setShowPhotoUpload(false);
    } catch (error) {
      console.error('Failed to update profile photo:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your existing profile content */}
      
      <Button
        title="Add Photo"
        onPress={() => setShowPhotoUpload(true)}
      />
      
      {showPhotoUpload && (
        <PhotoUploadWithCrop
          onUploadComplete={handlePhotoUpload}
          onCancel={() => setShowPhotoUpload(false)}
          aspectRatio={3/4}
        />
      )}
    </View>
  );
}
```

### Step 3: Update CreatePost Component

In your post creation, add cropping before upload:

```tsx
// In src/components/ui/CreatePost.tsx
import { PhotoUploadWithCrop } from './PhotoUploadWithCrop';

export const CreatePost: React.FC = () => {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  const handlePhotoUpload = (imageUrl: string) => {
    // Add the cropped image to your post
    setPostImages(prev => [...prev, imageUrl]);
    setShowPhotoUpload(false);
  };

  return (
    <View>
      {/* Your existing post creation UI */}
      
      <Button
        title="Add Photo"
        onPress={() => setShowPhotoUpload(true)}
      />
      
      {showPhotoUpload && (
        <PhotoUploadWithCrop
          onUploadComplete={handlePhotoUpload}
          onCancel={() => setShowPhotoUpload(false)}
          aspectRatio={16/9} // Different ratio for posts
        />
      )}
    </View>
  );
};
```

## 🎨 Customization Options

### Aspect Ratios

Different components can use different aspect ratios:

```tsx
// Profile photos (3:4 - portrait)
<PhotoUploadWithCrop aspectRatio={3/4} />

// Post photos (16:9 - landscape)
<PhotoUploadWithCrop aspectRatio={16/9} />

// Square photos (1:1)
<PhotoUploadWithCrop aspectRatio={1/1} />
```

### Custom Styling

The components use your theme system:

```tsx
// The cropper automatically uses your theme colors
// No additional styling needed
```

## 🔧 Advanced Usage

### Direct ImageCropper Usage

If you need more control, use the ImageCropper directly:

```tsx
import { ImageCropper } from '../components/ui/ImageCropper';

const [showCropper, setShowCropper] = useState(false);
const [selectedImage, setSelectedImage] = useState<string | null>(null);

const handleCropComplete = (croppedImageUri: string) => {
  // Handle the cropped image
  console.log('Cropped image:', croppedImageUri);
  setShowCropper(false);
};

{showCropper && selectedImage && (
  <ImageCropper
    imageUri={selectedImage}
    onCropComplete={handleCropComplete}
    onCancel={() => setShowCropper(false)}
    aspectRatio={3/4}
  />
)}
```

### Custom Upload Logic

You can customize the upload process:

```tsx
const handleCropComplete = async (croppedImageUri: string) => {
  try {
    // Custom image processing
    const processedImage = await processImage(croppedImageUri);
    
    // Custom upload logic
    const imageUrl = await uploadToCustomServer(processedImage);
    
    // Handle success
    onUploadComplete(imageUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## 📱 User Experience

### Flow Overview

1. **User taps "Add Photo"**
2. **Choose source** (Camera or Gallery)
3. **Image opens in cropper**
4. **User positions crop area**
5. **User taps "Done"**
6. **Image uploads automatically**
7. **Success feedback**

### Benefits

- ✅ **Consistent aspect ratios** across all photos
- ✅ **Better photo quality** with proper cropping
- ✅ **Improved user experience** with visual feedback
- ✅ **Reduced upload failures** with pre-processing
- ✅ **Professional appearance** with uniform photo sizes

## 🐛 Troubleshooting

### Common Issues

**1. Cropper not showing**
- Check if `react-native-gesture-handler` is installed
- Ensure proper navigation setup

**2. Upload fails after cropping**
- Verify bucket connection (use bucket test)
- Check image size limits (50MB)
- Ensure proper permissions

**3. Aspect ratio issues**
- Verify the `aspectRatio` prop is correct
- Check that the ratio matches your requirements

### Debug Steps

1. **Test bucket connection**:
   ```bash
   # Go to Menu → Bucket Connection Test
   ```

2. **Check console logs** for errors

3. **Verify permissions** are granted

4. **Test with smaller images** first

## 🔄 Migration from Old System

If you're replacing an existing photo upload system:

1. **Backup current implementation**
2. **Replace upload components** with new ones
3. **Test thoroughly** with different image types
4. **Update documentation** for your team
5. **Monitor user feedback** after deployment

## 📊 Performance Considerations

- **Image compression** happens automatically
- **Crop area positioning** is optimized for smooth interaction
- **Upload progress** is shown to users
- **Error handling** prevents app crashes

---

**Ready to implement?** Start with the `PhotoUploadWithCrop` component for the easiest integration! 