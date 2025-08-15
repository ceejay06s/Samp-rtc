# Supabase Storage Setup Guide

## ✅ What's Already Installed

- ✅ `@supabase/supabase-js` - Supabase JavaScript client
- ✅ Supabase CLI - For project management
- ✅ Environment variables configured
- ✅ Project linked to Supabase

## 🚀 Setup Steps

### 1. Run the Storage Setup SQL

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/xbcrxnebziipzqoorkti)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `sql/simple-storage-setup.sql`
4. Click **Run** to execute the script

This will create:
- `profile-photo` bucket (for user profile pictures)
- `telegram-stickers` bucket (for stickers)
- `user-uploads` bucket (for general user files)
- `chat-media` bucket (for chat attachments)

### 2. Verify Storage Setup

Run the bucket test in your app:
```bash
# Start your app
npm start

# Navigate to the bucket test screen
# Or run the bucket test directly
```

### 3. Test Storage Functionality

The bucket test will verify:
- ✅ Bucket creation
- ✅ File upload (with 50MB limit)
- ✅ File download
- ✅ File deletion
- ✅ Folder creation
- ✅ File size validation

## 📁 Bucket Structure

### Profile Photos
```
profile-photo/
├── {user-id}/
│   ├── profile-1.jpg
│   ├── profile-2.png
│   └── avatar.webp
```

### Telegram Stickers
```
telegram-stickers/
├── AnimeGirl/
│   ├── sticker_1.webp
│   └── sticker_2.webp
├── Emojis/
│   └── emoji_1.webp
```

### User Uploads
```
user-uploads/
├── {user-id}/
│   ├── documents/
│   ├── images/
│   └── videos/
```

### Chat Media
```
chat-media/
├── {conversation-id}/
│   ├── {user-id}/
│   │   ├── image_1.jpg
│   │   ├── video_1.mp4
│   │   └── audio_1.wav
```

## 🔐 Security Policies

### Public Access
- All buckets are public for viewing
- Only authenticated users can upload/update/delete

### File Size Limits
- Maximum file size: 50MB per file
- Supported formats: Images, videos, audio

### User Isolation
- Users can only manage their own files
- Chat media is restricted to conversation participants

## 🛠️ Usage Examples

### Upload Profile Photo
```typescript
import { StorageService } from '../src/services/storage';

const uploadProfilePhoto = async (file: File, userId: string) => {
  const path = `${userId}/profile-${Date.now()}.jpg`;
  const result = await StorageService.uploadFile('profile-photo', path, file);
  
  if (result.success) {
    console.log('Profile photo uploaded:', result.url);
  }
};
```

### Create Folder
```typescript
const createUserFolder = async (userId: string) => {
  const result = await StorageService.createFolder('user-uploads', userId);
  
  if (result.success) {
    console.log('User folder created');
  }
};
```

### List Files
```typescript
const listUserFiles = async (userId: string) => {
  const result = await StorageService.listFiles('user-uploads', userId);
  
  if (result.success) {
    console.log('User files:', result.files);
  }
};
```

## 🔧 Troubleshooting

### Empty Bucket Array
If bucket listing returns empty:
1. Check RLS policies in Supabase dashboard
2. Verify user authentication
3. Check bucket permissions

### Upload Failures
If uploads fail:
1. Check file size (max 50MB)
2. Verify file type is allowed
3. Check user authentication
4. Review RLS policies

### Permission Errors
If you get permission errors:
1. Ensure user is authenticated
2. Check bucket policies
3. Verify file path structure

## 📊 Monitoring

### Check Storage Usage
1. Go to Supabase Dashboard
2. Navigate to **Storage**
3. View bucket usage and file counts

### View Logs
1. Go to Supabase Dashboard
2. Navigate to **Logs**
3. Filter by storage events

## 🎯 Next Steps

1. **Test the bucket functionality** using the bucket test screen
2. **Implement file upload UI** in your app
3. **Add image compression** for better performance
4. **Set up CDN** for faster file delivery
5. **Monitor storage usage** and costs

## 📞 Support

If you encounter issues:
1. Check the bucket test results
2. Review Supabase dashboard logs
3. Verify environment variables
4. Test with different file types and sizes

Your Supabase storage is now ready to use! 🎉 