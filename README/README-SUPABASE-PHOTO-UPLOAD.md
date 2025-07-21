# Supabase Photo Upload Implementation

This document explains how to set up and use the photo upload functionality with Supabase storage in the dating app.

## Overview

The photo upload system integrates with Supabase Storage to provide:
- Secure photo uploads with user-specific folders
- Automatic photo validation and cleanup
- Real-time photo management
- Cross-platform compatibility

## Setup Instructions

### 1. Create Supabase Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Set the following:
   - **Name**: `profile-photos`
   - **Public bucket**: ✅ Checked
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/*`

### 2. Run Storage Setup SQL

Execute the `sql/setup-storage-bucket.sql` script in your Supabase SQL editor:

```sql
-- This creates the necessary policies and functions
-- See the file for complete setup
```

### 3. Configure Environment Variables

Ensure your Supabase configuration is properly set up in `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Implementation Details

### Photo Upload Service (`src/services/photoUpload.ts`)

The service provides comprehensive photo management:

#### Key Methods:

1. **`uploadPhotoToSupabase(photo, userId)`**
   - Uploads photos to user-specific folders
   - Generates unique filenames with timestamps
   - Returns public URLs for access

2. **`deletePhotoFromSupabase(photoUrl)`**
   - Removes photos from storage
   - Cleans up orphaned files

3. **`validateImage(photo)`**
   - Validates dimensions, aspect ratio, and file size
   - Ensures 3:4 portrait orientation

#### Usage Example:

```typescript
// Upload a photo
const photo = await PhotoUploadService.showImagePickerOptions();
if (photo) {
  const validation = PhotoUploadService.validateImage(photo);
  if (validation.isValid) {
    const photoUrl = await PhotoUploadService.uploadPhotoToServer(photo);
    // photoUrl is now a public Supabase URL
  }
}

// Delete a photo
await PhotoUploadService.deletePhotoFromSupabase(photoUrl);
```

### Enhanced Auth Service (`src/services/auth.ts`)

The auth service now includes:

#### Profile Update Validation:

```typescript
// Comprehensive validation before saving
const validationErrors = this.validateProfileData(data);
if (validationErrors.length > 0) {
  throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
}
```

#### Enhanced Update Method:

```typescript
// Only updates provided fields
const updateData: any = {};
if (data.first_name !== undefined) updateData.first_name = data.first_name;
if (data.photos !== undefined) updateData.photos = data.photos;
// ... etc
```

### Profile Screen Integration (`app/profile.tsx`)

The profile screen now:

1. **Uploads photos to Supabase** when added
2. **Deletes photos from storage** when removed
3. **Saves changes immediately** to the database
4. **Handles errors gracefully** with user feedback

## Database Schema

### Profiles Table Structure:

```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthdate DATE NOT NULL, -- Changed from age
  bio TEXT,
  gender TEXT NOT NULL,
  location TEXT,
  photos TEXT[] DEFAULT '{}', -- Array of photo URLs
  interests TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',
  max_distance INTEGER DEFAULT 50,
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 100,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Structure:

```
profile-photos/
├── user-uuid-1/
│   ├── 1234567890.jpg
│   ├── 1234567891.png
│   └── 1234567892.jpg
├── user-uuid-2/
│   ├── 1234567893.jpg
│   └── 1234567894.png
└── ...
```

## Security Features

### Row Level Security (RLS):

- Users can only upload to their own folder
- Users can view all photos (for discovery)
- Users can only delete their own photos
- Automatic cleanup when users are deleted

### Validation:

- File size limit: 10MB
- File type: Images only
- Maximum photos per user: 6
- Image dimensions: Minimum 300x400
- Aspect ratio: 3:4 (portrait)

### Error Handling:

- Graceful fallback to local URIs if upload fails
- Comprehensive error messages
- User-friendly alerts
- Logging for debugging

## API Endpoints

### Storage Operations:

```typescript
// Upload
const { data, error } = await supabase.storage
  .from('profile-photos')
  .upload(fileName, blob, options);

// Get public URL
const { data: urlData } = supabase.storage
  .from('profile-photos')
  .getPublicUrl(fileName);

// Delete
const { error } = await supabase.storage
  .from('profile-photos')
  .remove([filePath]);
```

### Database Operations:

```typescript
// Update profile with photos
const { data, error } = await supabase
  .from('profiles')
  .update({ photos: photoUrls })
  .eq('user_id', userId)
  .select()
  .single();
```

## Performance Considerations

### Optimization Strategies:

1. **Image Compression**: Photos are compressed to 80% quality
2. **Lazy Loading**: Photos load progressively
3. **Caching**: Supabase provides CDN caching
4. **Batch Operations**: Multiple photos handled efficiently

### Monitoring:

- Track upload success/failure rates
- Monitor storage usage
- Log performance metrics
- Alert on storage limits

## Testing

### Manual Testing:

1. **Upload Flow**:
   - Take photo with camera
   - Select from gallery
   - Validate image requirements
   - Check upload success

2. **Delete Flow**:
   - Remove individual photos
   - Verify storage cleanup
   - Check database updates

3. **Error Scenarios**:
   - Network failures
   - Invalid file types
   - Storage quota exceeded
   - Permission denied

### Automated Testing:

```typescript
// Example test cases
describe('Photo Upload', () => {
  it('should upload valid image successfully', async () => {
    // Test implementation
  });
  
  it('should reject invalid file types', async () => {
    // Test implementation
  });
  
  it('should handle network errors gracefully', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues:

1. **Upload Fails**:
   - Check storage bucket exists
   - Verify RLS policies
   - Check file size limits
   - Ensure user authentication

2. **Photos Not Loading**:
   - Verify public bucket setting
   - Check URL generation
   - Validate file permissions

3. **Storage Quota**:
   - Monitor usage in dashboard
   - Implement cleanup routines
   - Set up alerts

### Debug Commands:

```typescript
// Check storage bucket
await PhotoUploadService.ensureStorageBucket();

// List user photos
const { data } = await supabase.storage
  .from('profile-photos')
  .list('user-uuid');

// Check storage policies
// Run in SQL editor:
SELECT * FROM storage.policies WHERE bucket_id = 'profile-photos';
```

## Future Enhancements

### Planned Features:

1. **Image Processing**:
   - Automatic resizing
   - Format conversion
   - Thumbnail generation
   - Face detection

2. **Advanced Storage**:
   - Multiple storage providers
   - Backup strategies
   - Geographic distribution
   - Cost optimization

3. **User Experience**:
   - Drag and drop upload
   - Photo reordering
   - Bulk operations
   - Progress indicators

### Integration Opportunities:

- **AI Photo Analysis**: Detect inappropriate content
- **Facial Recognition**: Prevent fake profiles
- **Image Optimization**: Automatic enhancement
- **Analytics**: Track photo engagement

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review Supabase documentation
3. Check console logs for errors
4. Verify storage bucket configuration

This implementation provides a robust, secure, and scalable photo upload system that integrates seamlessly with the dating app's user experience. 